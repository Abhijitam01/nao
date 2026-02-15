import { Router, type Request, type Response } from "express";
import { readSchema } from "../services/schema-reader.js";
import { generateSQL } from "../services/llm.js";
import { executeQuery } from "../services/sql-executor.js";
import { validateSQL } from "../utils/sanitize.js";

export const askRouter = Router();

interface AskRequest {
  question: string;
  projectPath: string;
}

askRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { question, projectPath } = req.body as AskRequest;

    // Validate inputs
    if (!question || !projectPath) {
      res.status(400).json({
        error: "Missing required fields: question and projectPath",
      });
      return;
    }

    // Step 1: Read the schema
    const schema = readSchema(projectPath);
    if (!schema || schema.tables.length === 0) {
      res.status(400).json({
        error: "No data loaded. Run 'analytics-agent load' first.",
      });
      return;
    }

    // Step 2: Generate SQL via LLM
    console.log(`\n  📝 Question: "${question}"`);
    const llmResponse = await generateSQL(question, schema);
    console.log(`  🤖 SQL: ${llmResponse.sql}`);
    console.log(`  📊 Chart: ${llmResponse.chartType}`);

    // Step 3: Validate SQL
    const validation = validateSQL(llmResponse.sql);
    if (!validation.valid) {
      res.status(400).json({
        error: `Unsafe SQL detected: ${validation.reason}`,
        sql: llmResponse.sql,
      });
      return;
    }

    // Step 4: Execute SQL
    const results = executeQuery(projectPath, llmResponse.sql);

    // Step 5: Return everything
    res.json({
      question,
      sql: llmResponse.sql,
      chartType: llmResponse.chartType,
      xAxis: llmResponse.xAxis,
      yAxis: llmResponse.yAxis,
      title: llmResponse.title,
      results,
      rowCount: results.length,
    });
  } catch (error) {
    console.error("  ❌ Error:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    res.status(500).json({ error: message });
  }
});
