import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface SchemaInfo {
  tables: {
    name: string;
    columns: { name: string; type: string; sqlType: string }[];
    rowCount: number;
  }[];
}

export interface LLMResponse {
  sql: string;
  chartType: "line" | "bar" | "table";
  xAxis: string;
  yAxis: string;
  title: string;
  description: string;
}

let openAIClient: OpenAI | null = null;
let geminiClient: GoogleGenerativeAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openAIClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY environment variable is not set. Create a .env file with OPENAI_API_KEY=sk-..."
      );
    }
    openAIClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openAIClient;
}

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY environment variable is not set. Create a .env file with GEMINI_API_KEY=..."
      );
    }
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
}

function buildPrompt(schema: SchemaInfo): string {
  const tableDescriptions = schema.tables
    .map((table) => {
      const cols = table.columns
        .map((c) => `    ${c.name} (${c.type} → ${c.sqlType})`)
        .join("\n");
      return `  Table: "${table.name}" (${table.rowCount} rows)\n${cols}`;
    })
    .join("\n\n");

  return `You are a SQL query generator for SQLite databases. You are also a data visualization expert.

Here is the database schema:

${tableDescriptions}

SQL Rules:
1. Generate ONLY valid SQLite SELECT queries.
2. Never use DROP, DELETE, INSERT, UPDATE, ALTER, or CREATE.
3. Use double quotes for table and column names.
4. Keep queries simple and efficient.
5. When grouping by date/month, use the column as-is (dates are stored as TEXT like "2024-01").
6. For aggregations, use SUM, AVG, COUNT, MIN, MAX as appropriate.
7. Always alias computed columns with readable names.
8. ORDER BY the x-axis column for charts (chronologically for dates, alphabetically for categories).

You MUST respond with valid JSON only. No markdown, no code fences, no explanation.

Response format:
{
  "sql": "SELECT ...",
  "chartType": "line" | "bar" | "table",
  "xAxis": "column_name_for_x_axis",
  "yAxis": "column_name_for_y_axis or comma-separated for multiple series",
  "title": "Short chart title",
  "description": "One sentence explaining what this data shows"
}

Chart type decision tree:
1. Does the query have a date/time column? → "line" (time series)
2. Does it compare categories (regions, products, etc.)? → "bar"
3. Is there a single aggregated value (e.g., total)? → "table"
4. Are there 5+ columns in the result? → "table"
5. Default → "bar"
6. Multi-series: If the user asks to compare multiple metrics (e.g., revenue vs costs), put all numeric column names in yAxis as comma-separated values like "revenue,costs".`;
}

export async function generateSQL(
  question: string,
  schema: SchemaInfo
): Promise<LLMResponse> {
  const systemPrompt = buildPrompt(schema);
  const provider = process.env.LLM_PROVIDER || "openai";

  let content: string | null = null;

  try {
    if (provider === "gemini") {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent([
        systemPrompt,
        `User Question: ${question}`,
      ]);
      content = result.response.text();
    } else {
      // Default to OpenAI
      const response = await getOpenAIClient().chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        temperature: 0,
        max_tokens: 500,
      });
      content = response.choices[0]?.message?.content || null;
    }
  } catch (error) {
    console.error(`LLM Provider Error (${provider}):`, error);
    throw new Error(`Failed to generate SQL from ${provider}: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!content) {
    throw new Error(`${provider} returned empty response`);
  }

  // Strip any markdown code fences the LLM might add despite instructions
  const cleaned = content
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as LLMResponse;

    // Validate required fields
    if (!parsed.sql) {
      throw new Error("LLM response missing 'sql' field");
    }

    // Defaults
    parsed.chartType = parsed.chartType || "table";
    parsed.xAxis = parsed.xAxis || "";
    parsed.yAxis = parsed.yAxis || "";
    parsed.title = parsed.title || "Query Results";
    parsed.description = parsed.description || "";

    return parsed;
  } catch (parseError) {
    // If JSON parsing fails, try to extract SQL from raw text
    console.warn("  ⚠️  Failed to parse LLM JSON, attempting raw extraction");

    const sqlMatch = cleaned.match(/SELECT[\s\S]+?;?$/i);
    if (sqlMatch) {
      return {
        sql: sqlMatch[0].replace(/;$/, ""),
        chartType: "table" as const,
        xAxis: "",
        yAxis: "",
        title: "Query Results",
        description: "",
      };
    }

    throw new Error(`Failed to parse LLM response: ${cleaned}`);
  }
}
