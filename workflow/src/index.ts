#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init";
import { codeCommand } from "./commands/code";
import { featureCommand } from "./commands/feature";
import { debugCommand } from "./commands/debug";
import { testCommand } from "./commands/test";
import { testBackendCommand } from "./commands/test-backend";
import { testFrontendCommand } from "./commands/test-frontend";

const program = new Command();

program
  .name("workflow")
  .description("Spec-driven development workflow CLI powered by Claude Code")
  .version("1.0.0");

program
  .command("init")
  .description("Generate derived specs from the core spec")
  .option("--force", "Overwrite existing derived specs")
  .action(async (options) => {
    await initCommand({ force: options.force });
  });

program
  .command("code")
  .description("Generate source code and tests from derived specs")
  .option("--force", "Overwrite existing backend and frontend directories")
  .action(async (options) => {
    await codeCommand({ force: options.force });
  });

program
  .command("feature")
  .description("Add features through the full spec-to-code pipeline")
  .action(async () => {
    await featureCommand();
  });

program
  .command("debug <error>")
  .description("Analyze errors, apply fixes, re-run tests")
  .action(async (error) => {
    await debugCommand(error);
  });

program
  .command("test")
  .description("Run all tests, fix failures (up to 3 attempts)")
  .action(async () => {
    await testCommand();
  });

program
  .command("test-backend")
  .description("Run backend tests, fix failures (up to 3 attempts)")
  .action(async () => {
    await testBackendCommand();
  });

program
  .command("test-frontend")
  .description("Run frontend tests, fix failures (up to 3 attempts)")
  .action(async () => {
    await testFrontendCommand();
  });

program.parse(process.argv);
