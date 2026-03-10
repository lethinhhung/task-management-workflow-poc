import * as files from "../utils/files";
import * as logger from "../utils/logger";
import * as claude from "../claude/client";
import { execSync } from "child_process";

export async function codeCommand(options: { force?: boolean }): Promise<void> {
  const derivedSpecDir = files.resolve("specs", "derived-spec");
  const backendDir = files.resolve("backend");
  const frontendDir = files.resolve("frontend");

  // Validate derived-spec exists
  if (!files.dirExists(derivedSpecDir)) {
    logger.fatal("specs/derived-spec/ does not exist. Run 'workflow init' first.");
  }

  // Check required derived spec files
  const requiredFiles = ["architecture.md", "implementation.md", "tests.md"];
  for (const fileName of requiredFiles) {
    if (!files.fileExists(files.resolve("specs", "derived-spec", fileName))) {
      logger.fatal(`specs/derived-spec/${fileName} is missing. Run 'workflow init' first.`);
    }
  }

  // Check if backend/frontend already exist
  if (!options.force) {
    if (files.dirExists(backendDir)) {
      logger.fatal("backend/ already exists. Use --force to overwrite.");
    }
    if (files.dirExists(frontendDir)) {
      logger.fatal("frontend/ already exists. Use --force to overwrite.");
    }
  }

  // Read derived specs
  logger.info("Reading derived specs...");
  const architecture = files.readFile(files.resolve("specs", "derived-spec", "architecture.md"));
  logger.success("Read specs/derived-spec/architecture.md");

  const implementation = files.readFile(files.resolve("specs", "derived-spec", "implementation.md"));
  logger.success("Read specs/derived-spec/implementation.md");

  const tests = files.readFile(files.resolve("specs", "derived-spec", "tests.md"));
  logger.success("Read specs/derived-spec/tests.md");

  // Remove existing directories if --force
  if (options.force) {
    if (files.dirExists(backendDir)) files.removeDir(backendDir);
    if (files.dirExists(frontendDir)) files.removeDir(frontendDir);
  }

  // Build prompt
  const prompt = `You are generating a full-stack project from derived specifications. Read the specs below and generate all source code, tests, and configuration files.

## Architecture Spec

${architecture}

## Implementation Spec

${implementation}

## Test Spec

${tests}

## Instructions

Generate the complete project by writing all files to disk:

1. **backend/** — NestJS backend with:
   - Source code in backend/src/ (modules, controllers, services, entities, DTOs)
   - E2E tests in backend/test/ (Jest + Supertest)
   - package.json, tsconfig.json, .env as specified in the implementation spec
   - Follow the project structure from the architecture spec exactly

2. **frontend/** — React frontend with:
   - Source code in frontend/src/ (pages, components, API client, context providers)
   - E2E tests in frontend/e2e/ (Playwright)
   - package.json, tsconfig.json, vite.config.ts as specified in the implementation spec
   - Follow the project structure from the architecture spec exactly

3. **docker-compose.yml** — As specified in the implementation spec

Write ALL files listed in the architecture spec's Project Structure section. Follow the implementation spec's Configuration Files section for exact config contents. Follow the test spec for test file contents.

Important: Generate idiomatic, production-ready code. Use proper TypeScript types, NestJS decorators, React hooks, etc.`;

  // Invoke Claude Code
  logger.info("Generating backend...");
  logger.info("Generating frontend...");

  const result = claude.invoke(prompt);

  if (!result.success) {
    logger.fatal("Failed to generate project code.");
  }

  // Verify key directories were created
  if (!files.dirExists(backendDir)) {
    logger.fatal("backend/ was not created. Code generation may have failed.");
  }
  if (!files.dirExists(frontendDir)) {
    logger.fatal("frontend/ was not created. Code generation may have failed.");
  }

  logger.success("Generated backend/");
  logger.success("Generated frontend/");

  // Check for docker-compose.yml
  const dockerComposePath = files.resolve("docker-compose.yml");
  if (files.fileExists(dockerComposePath)) {
    logger.success("Generated docker-compose.yml");
  }

  // Install dependencies
  logger.info("Installing dependencies...");

  try {
    execSync("npm install", {
      cwd: backendDir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 120_000,
    });
    logger.success("Backend dependencies installed.");
  } catch {
    logger.error("Failed to install backend dependencies.");
  }

  try {
    execSync("npm install", {
      cwd: frontendDir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 120_000,
    });
    logger.success("Frontend dependencies installed.");
  } catch {
    logger.error("Failed to install frontend dependencies.");
  }

  console.log("\nCode generation complete.");
}
