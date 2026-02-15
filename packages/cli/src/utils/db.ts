import Database from "better-sqlite3";
import type { ColumnSchema } from "./schema-inferrer.js";

export function createDatabase(
  dbPath: string,
  tableName: string,
  columns: ColumnSchema[]
): void {
  const db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma("journal_mode = WAL");

  // Drop table if it exists (reloading)
  db.exec(`DROP TABLE IF EXISTS "${tableName}"`);

  // Build CREATE TABLE statement
  const columnDefs = columns
    .map((col) => `"${col.name}" ${col.sqlType}`)
    .join(", ");

  db.exec(`CREATE TABLE "${tableName}" (${columnDefs})`);
  db.close();
}

export function insertRows(
  dbPath: string,
  tableName: string,
  headers: string[],
  rows: string[][]
): void {
  const db = new Database(dbPath);

  const placeholders = headers.map(() => "?").join(", ");
  const quotedHeaders = headers.map((h) => `"${h}"`).join(", ");
  const stmt = db.prepare(
    `INSERT INTO "${tableName}" (${quotedHeaders}) VALUES (${placeholders})`
  );

  // Use a transaction for bulk insert (massive perf improvement)
  const insertMany = db.transaction((rows: string[][]) => {
    for (const row of rows) {
      // Clean values: convert empty strings to null, parse numbers
      const cleaned = row.map((val, idx) => {
        if (val === null || val === undefined || val.trim() === "") {
          return null;
        }
        // TODO: We could coerce based on column type here
        // For now, let SQLite handle type affinity
        return val.trim();
      });
      stmt.run(...cleaned);
    }
  });

  insertMany(rows);
  db.close();
}

export function queryDatabase(dbPath: string, sql: string): Record<string, unknown>[] {
  const db = new Database(dbPath, { readonly: true });
  try {
    const rows = db.prepare(sql).all() as Record<string, unknown>[];
    return rows;
  } finally {
    db.close();
  }
}
