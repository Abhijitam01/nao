import fs from "node:fs";
import path from "node:path";

interface SchemaInfo {
  tables: {
    name: string;
    columns: { name: string; type: string; sqlType: string }[];
    rowCount: number;
  }[];
  createdAt: string;
  version: string;
}

export function readSchema(projectPath: string): SchemaInfo {
  const schemaPath = path.resolve(projectPath, "schema.json");

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`schema.json not found at ${schemaPath}`);
  }

  const raw = fs.readFileSync(schemaPath, "utf-8");
  return JSON.parse(raw) as SchemaInfo;
}
