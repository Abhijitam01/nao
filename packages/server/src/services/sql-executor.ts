import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export function executeQuery(
  projectPath: string,
  sql: string
): Record<string, unknown>[] {
  const configPath = path.resolve(projectPath, "config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const dbPath = path.resolve(projectPath, config.database);

  const db = new Database(dbPath, { readonly: true });

  try {
    const rows = db.prepare(sql).all() as Record<string, unknown>[];
    return rows;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "SQL execution failed";
    throw new Error(`SQL Error: ${message}\nQuery: ${sql}`);
  } finally {
    db.close();
  }
}
