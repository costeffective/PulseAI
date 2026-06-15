import {
  GoogleGenerativeAI,
  SchemaType,
  type GenerationConfig,
} from "@google/generative-ai";
import { z } from "zod";
import type { ClassificationResult, BatchAnalysis, BatchSubmitItem } from "./types";
import {
  buildColumnSamples,
  collectColumnNames,
} from "./batch-analysis";

const CHUNK_SIZE = 10;
const CHUNK_DELAY_MS = 200;
const MAX_BATCH_SIZE = 200;

const classificationSchema = z.array(
  z.object({
    index: z.number().int().nonnegative(),
    category: z.string(),
    sentiment: z.enum(["positive", "negative", "neutral"]),
    priority: z.enum(["high", "medium", "low"]),
  }),
);

const summarySchema = z.object({
  summary: z.string().min(1),
});

function getModel(generationConfig?: GenerationConfig) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig,
  });
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildClassificationPrompt(items: string[], startIndex: number) {
  const numbered = items
    .map((text, i) => `${startIndex + i}: ${text}`)
    .join("\n");

  return `You are a feedback triage assistant for a small product team.

Classify each feedback item below. Return a JSON array with one object per item.

Rules:
- index must match the number before each item
- category must be one of: Bug, Feature request, Pricing, UX issue, Praise, Other
- sentiment must be one of: positive, negative, neutral
- priority must be one of: high, medium, low
- high priority = urgent bugs, churn risk, or blocking issues
- medium priority = meaningful improvements or recurring pain
- low priority = minor issues, praise, or nice-to-haves

Feedback items:
${numbered}`;
}

function buildSummaryPrompt(
  items: Array<{
    text: string;
    category: string;
    sentiment: string;
    priority: string;
  }>,
) {
  const lines = items
    .map(
      (item, i) =>
        `${i + 1}. [${item.category} | ${item.sentiment} | ${item.priority}] ${item.text}`,
    )
    .join("\n");

  return `You are summarizing customer feedback for an internal ops dashboard.

Write a 2-3 sentence overview of trends, themes, and priorities across this batch.
Be specific and actionable. Do not use bullet points.

Return JSON: { "summary": "..." }

Classified feedback:
${lines}`;
}

async function classifyChunk(
  items: string[],
  startIndex: number,
  retry = true,
): Promise<ClassificationResult[]> {
  const model = getModel({
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          index: { type: SchemaType.INTEGER },
          category: { type: SchemaType.STRING },
          sentiment: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["positive", "negative", "neutral"],
          },
          priority: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["high", "medium", "low"],
          },
        },
        required: ["index", "category", "sentiment", "priority"],
      },
    },
  });

  const result = await model.generateContent(
    buildClassificationPrompt(items, startIndex),
  );

  const text = result.response.text();
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    if (retry) {
      return classifyChunk(items, startIndex, false);
    }
    throw new Error("Failed to parse Gemini classification response");
  }

  const validated = classificationSchema.safeParse(parsed);
  if (!validated.success) {
    if (retry) {
      return classifyChunk(items, startIndex, false);
    }
    throw new Error("Gemini classification response failed validation");
  }

  const expectedIndices = new Set(
    items.map((_, i) => startIndex + i),
  );

  for (const item of validated.data) {
    if (!expectedIndices.has(item.index)) {
      if (retry) {
        return classifyChunk(items, startIndex, false);
      }
      throw new Error("Gemini returned unexpected item indices");
    }
  }

  return validated.data.sort((a, b) => a.index - b.index);
}

async function generateSummary(
  items: Array<{
    text: string;
    category: string;
    sentiment: string;
    priority: string;
  }>,
  retry = true,
): Promise<string> {
  const model = getModel({
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        summary: { type: SchemaType.STRING },
      },
      required: ["summary"],
    },
  });

  const result = await model.generateContent(buildSummaryPrompt(items));

  const text = result.response.text();
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    if (retry) {
      return generateSummary(items, false);
    }
    throw new Error("Failed to parse Gemini summary response");
  }

  const validated = summarySchema.safeParse(parsed);
  if (!validated.success) {
    if (retry) {
      return generateSummary(items, false);
    }
    throw new Error("Gemini summary response failed validation");
  }

  return validated.data.summary.trim();
}

const analysisSchema = z.object({
  overview: z.string().min(1),
  columns: z.array(
    z.object({
      name: z.string().min(1),
      summary: z.string().min(1),
      triggerPoints: z.array(z.string()),
    }),
  ),
  highPriorityHighlights: z.array(
    z.object({
      text: z.string().min(1),
      reason: z.string().min(1),
      category: z.string().min(1),
      sentiment: z.enum(["positive", "negative", "neutral"]),
    }),
  ),
});

function buildAnalysisPrompt(
  items: Array<{
    text: string;
    category: string;
    sentiment: string;
    priority: string;
    metadata: Record<string, string>;
  }>,
  columnNames: string[],
  columnSamples: Record<string, string[]>,
) {
  const itemLines = items
    .slice(0, 40)
    .map((item, index) => {
      const metadata = Object.entries(item.metadata)
        .map(([key, value]) => `${key}: ${value}`)
        .join(" | ");

      return `${index + 1}. [${item.category} | ${item.sentiment} | ${item.priority}] ${item.text}${
        metadata ? ` :: ${metadata}` : ""
      }`;
    })
    .join("\n");

  const columnContext = columnNames
    .map((name) => {
      const samples = columnSamples[name] ?? [];
      return `- ${name}: ${samples.slice(0, 6).join(" · ") || "no samples"}`;
    })
    .join("\n");

  return `You are analyzing a spreadsheet or Google Form feedback export for an internal ops dashboard.

Produce a structured analysis for product and support teams.

Rules:
- overview: 2-3 sentences on the biggest themes and what needs action
- columns: one entry per form column/question listed below; summarize patterns in responses; triggerPoints are specific red flags, recurring complaints, or escalation-worthy signals (max 3 per column, short phrases)
- highPriorityHighlights: up to 6 most urgent feedback items already classified as high priority, with a short reason each
- Be specific and actionable; reference actual themes from the data

Form columns and sample values:
${columnContext || "- No extra columns; primary feedback text only"}

Classified responses (${items.length} total, showing up to 40):
${itemLines}`;
}

async function generateBatchAnalysis(
  items: Array<{
    text: string;
    category: string;
    sentiment: string;
    priority: string;
    metadata: Record<string, string>;
  }>,
  retry = true,
): Promise<BatchAnalysis> {
  const columnNames = collectColumnNames(items).map((column) => column.name);
  const columnSamples = buildColumnSamples(items, columnNames);

  const model = getModel({
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        overview: { type: SchemaType.STRING },
        columns: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              summary: { type: SchemaType.STRING },
              triggerPoints: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
            },
            required: ["name", "summary", "triggerPoints"],
          },
        },
        highPriorityHighlights: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              text: { type: SchemaType.STRING },
              reason: { type: SchemaType.STRING },
              category: { type: SchemaType.STRING },
              sentiment: {
                type: SchemaType.STRING,
                format: "enum",
                enum: ["positive", "negative", "neutral"],
              },
            },
            required: ["text", "reason", "category", "sentiment"],
          },
        },
      },
      required: ["overview", "columns", "highPriorityHighlights"],
    },
  });

  const result = await model.generateContent(buildAnalysisPrompt(items, columnNames, columnSamples));

  const text = result.response.text();
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    if (retry) {
      return generateBatchAnalysis(items, false);
    }
    throw new Error("Failed to parse Gemini analysis response");
  }

  const validated = analysisSchema.safeParse(parsed);
  if (!validated.success) {
    if (retry) {
      return generateBatchAnalysis(items, false);
    }
    throw new Error("Gemini analysis response failed validation");
  }

  return {
    overview: validated.data.overview.trim(),
    columns: validated.data.columns.map((column) => ({
      name: column.name.trim(),
      summary: column.summary.trim(),
      triggerPoints: column.triggerPoints.map((point) => point.trim()).filter(Boolean),
    })),
    highPriorityHighlights: validated.data.highPriorityHighlights.map((item) => ({
      text: item.text.trim(),
      reason: item.reason.trim(),
      category: item.category.trim(),
      sentiment: item.sentiment,
    })),
  };
}

export async function generateBatchAnalysisFromItems(
  items: Array<{
    text: string;
    category: string;
    sentiment: string;
    priority: string;
    metadata?: Record<string, string>;
  }>,
) {
  return generateBatchAnalysis(
    items.map((item) => ({
      text: item.text,
      category: item.category,
      sentiment: item.sentiment,
      priority: item.priority,
      metadata: item.metadata ?? {},
    })),
  );
}

export async function summarizeClassifiedFeedback(
  items: Array<{
    text: string;
    category: string;
    sentiment: string;
    priority: string;
  }>,
) {
  return generateSummary(items);
}

export async function classifyFeedbackBatch(items: BatchSubmitItem[]) {
  if (items.length === 0) {
    throw new Error("At least one feedback item is required");
  }

  if (items.length > MAX_BATCH_SIZE) {
    throw new Error(`Maximum ${MAX_BATCH_SIZE} items per batch`);
  }

  const texts = items.map((item) => item.text);
  const chunks = chunkArray(texts, CHUNK_SIZE);
  const allClassifications: ClassificationResult[] = [];

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    const startIndex = chunkIndex * CHUNK_SIZE;
    const classifications = await classifyChunk(chunk, startIndex);
    allClassifications.push(...classifications);

    if (chunkIndex < chunks.length - 1) {
      await sleep(CHUNK_DELAY_MS);
    }
  }

  const classifiedItems = texts.map((text, index) => {
    const classification = allClassifications.find((c) => c.index === index);
    if (!classification) {
      throw new Error(`Missing classification for item ${index}`);
    }

    return {
      text,
      category: classification.category,
      sentiment: classification.sentiment,
      priority: classification.priority,
    };
  });

  const summary = await generateSummary(classifiedItems);
  const analysis = await generateBatchAnalysis(
    items.map((item, index) => ({
      ...classifiedItems[index],
      metadata: item.metadata ?? {},
    })),
  );

  return {
    items: classifiedItems.map((item, lineIndex) => ({
      line_index: lineIndex,
      ...item,
    })),
    summary,
    analysis,
  };
}
