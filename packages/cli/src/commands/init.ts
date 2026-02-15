import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import ora from "ora";

export async function initCommand(projectName: string): Promise<void> {
  const spinner = ora(`Creating project "${projectName}"...`).start();

  const projectPath = path.resolve(process.cwd(), projectName);

  // Check if directory already exists
  if (fs.existsSync(projectPath)) {
    spinner.fail(chalk.red(`Directory "${projectName}" already exists.`));
    process.exit(1);
  }

  try {
    // Create project structure
    fs.mkdirSync(path.join(projectPath, "data"), { recursive: true });

    // Create schema.json (empty initially)
    const schema = {
      tables: [],
      createdAt: new Date().toISOString(),
      version: "1.0.0",
    };
    fs.writeFileSync(
      path.join(projectPath, "schema.json"),
      JSON.stringify(schema, null, 2)
    );

    // Create config.json
    const config = {
      name: projectName,
      database: "data/analytics.db",
      llm: {
        provider: "openai",
        model: "gpt-4o-mini",
      },
      server: {
        port: 3001,
      },
    };
    fs.writeFileSync(
      path.join(projectPath, "config.json"),
      JSON.stringify(config, null, 2)
    );

    // Create README
    const readme = `# ${projectName}

An analytics project powered by **analytics-agent**.

## Getting Started

1. Load your data:
   \`\`\`bash
   analytics-agent load data/your-file.csv
   \`\`\`

2. Start the server:
   \`\`\`bash
   analytics-agent serve
   \`\`\`

3. Open the web UI and start asking questions!

## Project Structure

\`\`\`
${projectName}/
  data/          ← Your CSV files and SQLite database
  schema.json    ← Auto-generated table schemas
  config.json    ← Project configuration
\`\`\`
`;
    fs.writeFileSync(path.join(projectPath, "README.md"), readme);

    spinner.succeed(
      chalk.green(`Project "${projectName}" created successfully!`)
    );

    console.log("");
    console.log(chalk.dim("  Next steps:"));
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan(`  analytics-agent load data/your-file.csv`));
    console.log("");
  } catch (error) {
    spinner.fail(chalk.red("Failed to create project."));
    console.error(error);
    process.exit(1);
  }
}
