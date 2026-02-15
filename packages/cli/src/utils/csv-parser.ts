import fs from "node:fs";
import { parse } from "csv-parse";

export interface CSVData {
  headers: string[];
  rows: string[][];
}

export async function parseCSV(filePath: string): Promise<CSVData> {
  return new Promise((resolve, reject) => {
    const headers: string[] = [];
    const rows: string[][] = [];
    let isFirstRow = true;

    const parser = fs.createReadStream(filePath).pipe(
      parse({
        trim: true,
        skip_empty_lines: true,
        relax_column_count: true,
      })
    );

    parser.on("data", (row: string[]) => {
      if (isFirstRow) {
        // Sanitize header names: lowercase, replace spaces/special chars with underscores
        for (const col of row) {
          headers.push(
            col
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "_")
              .replace(/_+/g, "_")
              .replace(/^_|_$/g, "")
          );
        }
        isFirstRow = false;
      } else {
        rows.push(row);
      }
    });

    parser.on("end", () => {
      resolve({ headers, rows });
    });

    parser.on("error", (error) => {
      reject(error);
    });
  });
}
