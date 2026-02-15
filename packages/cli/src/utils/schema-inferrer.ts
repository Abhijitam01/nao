export interface ColumnSchema {
  name: string;
  type: "string" | "number" | "date";
  sqlType: string;
}

// Common date patterns to check against
const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/,                    // 2024-01-15
  /^\d{2}\/\d{2}\/\d{4}$/,                  // 01/15/2024
  /^\d{2}-\d{2}-\d{4}$/,                    // 01-15-2024
  /^\d{4}\/\d{2}\/\d{2}$/,                  // 2024/01/15
  /^\w{3}\s+\d{1,2},?\s+\d{4}$/,            // Jan 15, 2024
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,   // ISO 8601
  /^\d{4}-\d{2}$/,                           // 2024-01
];

function isDate(value: string): boolean {
  if (!value || value.trim() === "") return false;
  const trimmed = value.trim();

  // Check against known patterns first (fast path)
  for (const pattern of DATE_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  // Fallback: try Date.parse, but be strict
  // Exclude pure numbers (they'd parse as timestamps)
  if (/^\d+(\.\d+)?$/.test(trimmed)) return false;

  const parsed = Date.parse(trimmed);
  if (isNaN(parsed)) return false;

  // Additional check: the string should look date-like
  // (contains separator characters typical of dates)
  return /[-\/,.\s]/.test(trimmed) && trimmed.length >= 6;
}

function isNumber(value: string): boolean {
  if (!value || value.trim() === "") return false;
  const trimmed = value.trim();

  // Handle common number formats
  const cleaned = trimmed
    .replace(/^\$/, "")       // currency prefix
    .replace(/,/g, "")        // thousand separators
    .replace(/%$/, "")        // percentage suffix
    .trim();

  return cleaned !== "" && !isNaN(Number(cleaned)) && isFinite(Number(cleaned));
}

export function inferSchema(
  headers: string[],
  rows: string[][]
): ColumnSchema[] {
  const columns: ColumnSchema[] = [];

  // Sample up to 100 rows for type detection
  const sampleSize = Math.min(rows.length, 100);
  const sample = rows.slice(0, sampleSize);

  for (let colIdx = 0; colIdx < headers.length; colIdx++) {
    const values = sample
      .map((row) => row[colIdx] || "")
      .filter((v) => v.trim() !== "");

    if (values.length === 0) {
      // All empty — default to string
      columns.push({ name: headers[colIdx], type: "string", sqlType: "TEXT" });
      continue;
    }

    // Check if all non-empty values are dates
    const allDates = values.every((v) => isDate(v));
    if (allDates) {
      columns.push({ name: headers[colIdx], type: "date", sqlType: "TEXT" });
      continue;
    }

    // Check if all non-empty values are numbers
    const allNumbers = values.every((v) => isNumber(v));
    if (allNumbers) {
      columns.push({ name: headers[colIdx], type: "number", sqlType: "REAL" });
      continue;
    }

    // Default to string
    columns.push({ name: headers[colIdx], type: "string", sqlType: "TEXT" });
  }

  return columns;
}
