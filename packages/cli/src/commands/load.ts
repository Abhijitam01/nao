import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import ora from "ora";
import { parseCSV } from "../utils/csv-parser.js";
import { inferSchema, type ColumnSchema } from "../utils/schema-inferrer.js";
import { createDatabase, insertRows } from "../utils/db.js";

export async function loadCommand(
  csvFile: string,
  customTableName?: string
): Promise<void> {
  const spinner = ora("Loading CSV file...").start();

  const csvPath = path.resolve(process.cwd(), csvFile);

  // Validate file exists
  if (!fs.existsSync(csvPath)) {
    spinner.fail(chalk.red(`File not found: ${csvPath}`));
    process.exit(1);
  }

  // Validate we're in a project directory
  const schemaPath = path.resolve(process.cwd(), "schema.json");
  const configPath = path.resolve(process.cwd(), "config.json");

  if (!fs.existsSync(schemaPath) || !fs.existsSync(configPath)) {
    spinner.fail(
      chalk.red(
        'Not inside an analytics-agent project. Run "analytics-agent init" first.'
      )
    );
    process.exit(1);
  }

  try {
    // Parse CSV
    spinner.text = "Parsing CSV...";
    const { headers, rows } = await parseCSV(csvPath);

    if (rows.length === 0) {
      spinner.fail(chalk.red("CSV file is empty or has no data rows."));
      process.exit(1);
    }

    spinner.text = `Parsed ${rows.length} rows with ${headers.length} columns`;

    // Infer schema
    spinner.text = "Inferring column types...";
    const columns = inferSchema(headers, rows);

    // Determine table name
    const tableName =
      customTableName ||
      path
        .basename(csvFile, path.extname(csvFile))
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .toLowerCase();

    // Read config for DB path
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const dbPath = path.resolve(process.cwd(), config.database);

    // Ensure data directory exists
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    // Create/update database
    spinner.text = "Creating database table...";
    createDatabase(dbPath, tableName, columns);

    // Insert rows
    spinner.text = `Inserting ${rows.length} rows...`;
    insertRows(dbPath, tableName, headers, rows);

    // Update schema.json
    spinner.text = "Updating schema...";
    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));

    // Remove existing table entry if reloading
    schema.tables = schema.tables.filter(
      (t: { name: string }) => t.name !== tableName
    );

    schema.tables.push({
      name: tableName,
      columns: columns.map((col: ColumnSchema) => ({
        name: col.name,
        type: col.type,
        sqlType: col.sqlType,
      })),
      rowCount: rows.length,
      source: path.basename(csvFile),
      loadedAt: new Date().toISOString(),
    });

    fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));

    spinner.succeed(chalk.green(`Loaded ${rows.length} rows into "${tableName}"`));

    console.log("");
    console.log(chalk.dim("  Schema:"));
    for (const col of columns) {
      console.log(
        chalk.cyan(`    ${col.name}`) + chalk.dim(` (${col.type} → ${col.sqlType})`)
      );
    }
    console.log("");
    console.log(
      chalk.dim(`  Database: ${path.relative(process.cwd(), dbPath)}`)
    );
    console.log("");
  } catch (error) {
    spinner.fail(chalk.red("Failed to load CSV."));
    console.error(error);
    process.exit(1);
  }
}
