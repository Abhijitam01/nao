import OpenAI from "openai";

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
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY environment variable is not set. Create a .env file with OPENAI_API_KEY=sk-..."
      );
    }
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
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

  return `You are a SQL query generator for SQLite databases.

Here is the database schema:

${tableDescriptions}

Rules:
1. Generate ONLY valid SQLite SELECT queries.
2. Never use DROP, DELETE, INSERT, UPDATE, ALTER, or CREATE.
3. Use double quotes for table and column names.
4. Keep queries simple and efficient.
5. When grouping by date/month, use the column as-is (dates are stored as TEXT like "2024-01").
6. For aggregations, use SUM, AVG, COUNT, MIN, MAX as appropriate.
7. Always alias computed columns with readable names.

You MUST respond with valid JSON only. No markdown, no code fences, no explanation.

Response format:
{
  "sql": "SELECT ...",
  "chartType": "line" | "bar" | "table",
  "xAxis": "column_name_for_x_axis",
  "yAxis": "column_name_for_y_axis",
  "title": "Human readable chart title"
}

Chart type rules:
- Use "line" for time series data (dates on x-axis)
- Use "bar" for categorical comparisons (categories on x-axis)
- Use "table" for detailed multi-column results or when no clear chart fits`;
}

export async function generateSQL(
  question: string,
  schema: SchemaInfo
): Promise<LLMResponse> {
  const systemPrompt = buildPrompt(schema);

  const response = await getClient().chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ],
    temperature: 0,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("LLM returned empty response");
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

    return parsed;
  } catch (parseError) {
    // If JSON parsing fails, try to extract SQL from raw text
    console.warn("  ⚠️  Failed to parse LLM JSON, attempting raw extraction");

    const sqlMatch = cleaned.match(/SELECT[\s\S]+?;?$/i);
    if (sqlMatch) {
      return {
        sql: sqlMatch[0].replace(/;$/, ""),
        chartType: "table",
        xAxis: "",
        yAxis: "",
        title: "Query Results",
      };
    }

    throw new Error(`Failed to parse LLM response: ${cleaned}`);
  }
}
