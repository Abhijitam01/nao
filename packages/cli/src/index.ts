#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { loadCommand } from "./commands/load.js";

const program = new Command();

program
  .name("analytics-agent")
  .description("Natural language analytics on your CSV data")
  .version("1.0.0");

program
  .command("init")
  .argument("<project-name>", "Name of the analytics project")
  .description("Initialize a new analytics project")
  .action(async (projectName: string) => {
    await initCommand(projectName);
  });

program
  .command("load")
  .argument("<csv-file>", "Path to CSV file to load")
  .option("-n, --table-name <name>", "Custom table name (defaults to filename)")
  .description("Load a CSV file into the project database")
  .action(async (csvFile: string, options: { tableName?: string }) => {
    await loadCommand(csvFile, options.tableName);
  });

program.parse();
