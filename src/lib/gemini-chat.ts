import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const MAX_HISTORY_TURNS = 20;

export async function chatAboutBatch(
  systemContext: string,
  messages: ChatTurn[],
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const trimmed = messages
    .filter((message) => message.content.trim().length > 0)
    .slice(-MAX_HISTORY_TURNS);

  if (trimmed.length === 0 || trimmed[trimmed.length - 1].role !== "user") {
    throw new Error("A user message is required");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemContext,
  });

  const history = trimmed.slice(0, -1).map((message) => ({
    role: message.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: message.content }],
  }));

  const lastMessage = trimmed[trimmed.length - 1].content;
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage);
  const reply = result.response.text().trim();

  if (!reply) {
    throw new Error("Empty response from AI");
  }

  return reply;
}
