# Analytics Agent 📊

> Ask your CSV data questions in plain English. Get SQL, results, and charts back instantly.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   CLI        │     │   Express    │     │   React UI   │
│   Commander  │────▶│   Backend    │◀────│   + Recharts │
│   + SQLite   │     │   + OpenAI   │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │
       ▼                    ▼                     ▼
   CSV → DB          Schema → SQL           Charts / Tables
```

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Initialize a project

```bash
npx tsx packages/cli/src/index.ts init my-project
```

### 3. Load your CSV data

```bash
cd my-project
cp /path/to/your/data.csv data/
npx tsx ../packages/cli/src/index.ts load data/your-data.csv
```

### 4. Set your OpenAI API key

```bash
# In the root directory, create .env
cd ..
echo "OPENAI_API_KEY=sk-your-key-here" > .env
```

### 5. Start the backend

```bash
npx tsx packages/server/src/index.ts
```

### 6. Start the frontend (new terminal)

```bash
cd packages/web
npx vite
```

### 7. Open http://localhost:5173

Enter your project path (e.g., `/absolute/path/to/my-project`) and start asking questions!

## Example Questions

- "Show me monthly revenue trend"
- "Total revenue by region"
- "Compare revenue vs costs over time"
- "Which product has the highest profit?"

## Tech Stack

| Component | Technology                       |
| --------- | -------------------------------- |
| CLI       | Node.js + TypeScript + Commander |
| Database  | SQLite via better-sqlite3        |
| Backend   | Express + CORS + dotenv          |
| LLM       | OpenAI API (gpt-4o-mini)         |
| Frontend  | Vite + React                     |
| Charts    | Recharts                         |

## Architecture

```
nao/
├── packages/
│   ├── cli/           ← Commander CLI (init + load)
│   │   └── src/
│   │       ├── commands/   init.ts, load.ts
│   │       └── utils/      csv-parser, schema-inferrer, db
│   ├── server/        ← Express API
│   │   └── src/
│   │       ├── routes/     POST /ask
│   │       ├── services/   llm, sql-executor, schema-reader
│   │       └── utils/      sql sanitizer
│   └── web/           ← React + Recharts
│       └── src/
│           ├── components/ ChatBox, MessageBubble, ChartRenderer, DataTable
│           └── styles/     Dark theme CSS
└── sample/
    └── sales.csv      ← Demo dataset
```

## How It Works

1. **CLI** parses CSV → infers column types → creates SQLite DB + `schema.json`
2. **Backend** reads schema → builds LLM prompt → calls OpenAI → validates SQL → executes query
3. **Frontend** sends question → receives results + chart hints → renders chart or table

## Security

- SQL queries are validated: only `SELECT` statements allowed
- Dangerous keywords (`DROP`, `DELETE`, `INSERT`, etc.) are blocked
- Database opened in read-only mode for query execution
- No auth (local tool — not designed for production deployment)

## Sample Data

The `sample/sales.csv` contains 18 months of business data:

- **Columns**: month, revenue, costs, profit, region, product
- **Regions**: North, South, East, West
- **Products**: Widget A, Widget B, Widget C
