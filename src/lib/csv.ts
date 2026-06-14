import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { FeedbackMetadata, ParsedFeedbackRow } from "./types";

const FEEDBACK_HEADER_PATTERNS = [
  /^feedback$/i,
  /^comments?$/i,
  /^responses?$/i,
  /^suggestions?$/i,
  /^reviews?$/i,
  /^messages?$/i,
  /^descriptions?$/i,
  /^notes?$/i,
  /^open feedback$/i,
  /^your (feedback|thoughts|comments?)$/i,
  /^what .*(think|feedback|wrong|improve)/i,
  /^additional comments?$/i,
  /^please describe/i,
  /^tell us/i,
  /^how can we improve/i,
];

const METADATA_HEADER_PATTERNS = [
  /^timestamp$/i,
  /^submitted at$/i,
  /^date$/i,
  /^time$/i,
  /^email$/i,
  /^e-?mail address$/i,
  /^name$/i,
  /^full name$/i,
  /^first name$/i,
  /^last name$/i,
  /^username$/i,
  /^phone$/i,
  /^company$/i,
  /^organization$/i,
  /^role$/i,
  /^title$/i,
  /^rating$/i,
  /^score$/i,
  /^nps$/i,
  /^id$/i,
  /^response id$/i,
];

function stripCell(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

function normalizeHeader(header: string) {
  return header.trim().replace(/\s+/g, " ");
}

function isFeedbackHeader(header: string) {
  const normalized = normalizeHeader(header);
  return FEEDBACK_HEADER_PATTERNS.some((pattern) => pattern.test(normalized));
}

function isMetadataHeader(header: string) {
  const normalized = normalizeHeader(header);
  return METADATA_HEADER_PATTERNS.some((pattern) => pattern.test(normalized));
}

function averageTextLength(rows: Record<string, string>[], column: string) {
  if (rows.length === 0) return 0;

  const total = rows.reduce(
    (sum, row) => sum + stripCell(row[column]).length,
    0,
  );
  return total / rows.length;
}

function findFeedbackColumn(
  headers: string[],
  rows: Record<string, string>[],
): string {
  const feedbackMatch = headers.find((header) => isFeedbackHeader(header));
  if (feedbackMatch) return feedbackMatch;

  const candidates = headers.filter((header) => !isMetadataHeader(header));
  const pool = candidates.length > 0 ? candidates : headers;

  return pool.reduce((best, header) => {
    const bestScore = averageTextLength(rows, best);
    const headerScore = averageTextLength(rows, header);
    return headerScore > bestScore ? header : best;
  }, pool[0]);
}

function rowToParsedItem(
  row: Record<string, string>,
  feedbackColumn: string,
): ParsedFeedbackRow | null {
  const text = stripCell(row[feedbackColumn]);
  if (!text) return null;

  const metadata: FeedbackMetadata = {};

  for (const [key, value] of Object.entries(row)) {
    if (key === feedbackColumn) continue;
    const cleaned = stripCell(value);
    if (cleaned) metadata[normalizeHeader(key)] = cleaned;
  }

  return { text, metadata };
}

function parseStructuredRows(rows: Record<string, string>[]) {
  const cleanedRows = rows
    .map((row) => {
      const normalized: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        const header = normalizeHeader(key);
        if (!header) continue;
        normalized[header] = stripCell(value);
      }
      return normalized;
    })
    .filter((row) => Object.values(row).some(Boolean));

  if (cleanedRows.length === 0) return [];

  const headers = Object.keys(cleanedRows[0]);
  if (headers.length <= 1) {
    return cleanedRows
      .map((row) => {
        const text = Object.values(row).find(Boolean) ?? "";
        return text ? { text, metadata: {} } : null;
      })
      .filter((row): row is ParsedFeedbackRow => row !== null);
  }

  const feedbackColumn = findFeedbackColumn(headers, cleanedRows);

  return cleanedRows
    .map((row) => rowToParsedItem(row, feedbackColumn))
    .filter((row): row is ParsedFeedbackRow => row !== null);
}

function parseAsLines(text: string): ParsedFeedbackRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => stripCell(line))
    .filter(Boolean)
    .map((line) => ({ text: line, metadata: {} }));
}

function sheetToRows(workbook: XLSX.WorkBook): Record<string, string>[] {
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: "",
    raw: false,
  });
}

export function extractItemsFromSpreadsheetText(text: string): ParsedFeedbackRow[] {
  const cleaned = text.replace(/^\uFEFF/, "").trim();
  if (!cleaned) return [];

  const withHeader = Papa.parse<Record<string, string>>(cleaned, {
    skipEmptyLines: "greedy",
    header: true,
    transformHeader: normalizeHeader,
  });

  let items = parseStructuredRows(withHeader.data);

  if (items.length === 0) {
    const withoutHeader = Papa.parse<string[]>(cleaned, {
      skipEmptyLines: "greedy",
      header: false,
    });

    const objectRows = withoutHeader.data
      .filter((row) => Array.isArray(row) && row.some((cell) => stripCell(cell)))
      .map((row) => {
        const cells = (row as string[]).map(stripCell).filter(Boolean);
        return cells.length > 0 ? { Column: cells[0] } : null;
      })
      .filter((row) => row !== null) as Record<string, string>[];

    items = parseStructuredRows(objectRows);
  }

  if (items.length === 0) {
    items = parseAsLines(cleaned);
  }

  if (items.length > 0) {
    return items;
  }

  const blockingError = withHeader.errors.find(
    (entry) => entry.type === "Quotes" || entry.type === "Delimiter",
  );

  if (blockingError) {
    throw new Error(
      "Could not parse file. Save as UTF-8 CSV with a feedback column, or paste the text directly.",
    );
  }

  return [];
}

export async function extractItemsFromUpload(file: File): Promise<ParsedFeedbackRow[]> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "xlsx" || extension === "xls") {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const rows = sheetToRows(workbook);
    const items = parseStructuredRows(rows);

    if (items.length === 0) {
      throw new Error("Spreadsheet did not contain any feedback rows.");
    }

    return items;
  }

  const text = await file.text();
  const items = extractItemsFromSpreadsheetText(text);

  if (items.length === 0) {
    throw new Error("File did not contain any feedback items.");
  }

  return items;
}

// Backward-compatible helper for plain-text extraction.
export function extractItemsFromCsv(text: string): ParsedFeedbackRow[] {
  return extractItemsFromSpreadsheetText(text);
}

export function getMetadataPreview(item: ParsedFeedbackRow | { metadata: FeedbackMetadata }) {
  const entries = Object.entries(item.metadata);
  if (entries.length === 0) return null;

  const preferred = ["Name", "Email", "Timestamp", "Date", "Company"];
  for (const key of preferred) {
    const match = entries.find(([entryKey]) => entryKey.toLowerCase() === key.toLowerCase());
    if (match) return `${match[0]}: ${match[1]}`;
  }

  const [firstKey, firstValue] = entries[0];
  return `${firstKey}: ${firstValue}`;
}
