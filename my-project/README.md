# my-project

An analytics project powered by **analytics-agent**.

## Getting Started

1. Load your data:
   ```bash
   analytics-agent load data/your-file.csv
   ```

2. Start the server:
   ```bash
   analytics-agent serve
   ```

3. Open the web UI and start asking questions!

## Project Structure

```
my-project/
  data/          ← Your CSV files and SQLite database
  schema.json    ← Auto-generated table schemas
  config.json    ← Project configuration
```
