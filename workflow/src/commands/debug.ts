import * as files from "../utils/files";
import * as logger from "../utils/logger";
import * as claude from "../claude/client";
import { execSync } from "child_process";

const MAX_ATTEMPTS = 3;

export async function debugCommand(errorDescription: string): Promise<void> {
  const backendDir = files.resolve("backend");
  const frontendDir = files.resolve("frontend");

  // Validate inputs
  if (!errorDescription || errorDescription.trim() === "") {
    logger.fatal("No error description provided. Usage: workflow debug \"<error message>\"");
  }

  if (!files.dirExists(backendDir) && !files.dirExists(frontendDir)) {
    logger.fatal("Neither backend/ nor frontend/ exist. Run 'workflow code' first.");
  }

  // Read derived specs for context
  const derivedSpecDir = files.resolve("specs", "derived-spec");
  let specsContext = "";
  if (files.dirExists(derivedSpecDir)) {
    const specs = await files.readMarkdownFiles(derivedSpecDir);
    specsContext = specs
      .map((s) => `### ${s.name}\n\n${s.content}`)
      .join("\n\n---\n\n");
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    logger.info(`Attempt ${attempt}/${MAX_ATTEMPTS}`);
    logger.info(`Analyzing: "${errorDescription}"`);

    const prompt = `You are debugging a full-stack application. Analyze the error below, find the root cause in the source code, and fix it.

## Error

${errorDescription}

## Project Specs (for context)

${specsContext}

## Instructions

1. Search across backend/src/, backend/test/, frontend/src/, and frontend/e2e/ for relevant code related to the error.
2. Identify the root cause — the specific file(s) and line(s) causing the issue.
3. Apply a targeted fix by editing the source file(s).
4. Print which files you changed and what the fix was.

Do NOT refactor or change code unrelated to the error. Apply the minimal fix needed.`;

    const result = claude.invoke(prompt);

    if (!result.success) {
      logger.error("Claude Code analysis failed.");
      if (attempt === MAX_ATTEMPTS) {
        logger.fatal(`Fix could not be determined after ${MAX_ATTEMPTS} attempts.`);
      }
      continue;
    }

    // Run tests to verify
    logger.info("Re-running tests...");
    let testsPass = true;

    if (files.dirExists(backendDir)) {
      try {
        execSync("npm test", {
          cwd: backendDir,
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
          timeout: 120_000,
        });
        logger.success("Backend tests: passed");
      } catch {
        logger.error("Backend tests: failed");
        testsPass = false;
      }
    }

    if (files.dirExists(frontendDir)) {
      try {
        execSync("npx playwright test", {
          cwd: frontendDir,
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
          timeout: 120_000,
        });
        logger.success("Frontend tests: passed");
      } catch {
        logger.error("Frontend tests: failed");
        testsPass = false;
      }
    }

    if (testsPass) {
      console.log(`\nDebug complete — fix applied, all tests passed (attempt ${attempt}).`);
      return;
    }

    if (attempt < MAX_ATTEMPTS) {
      logger.info("Tests still failing, retrying...");
      errorDescription += "\n\n[Previous fix attempt did not resolve the issue. Tests are still failing.]";
    }
  }

  logger.fatal(`Fix could not be determined after ${MAX_ATTEMPTS} attempts.`);
}
