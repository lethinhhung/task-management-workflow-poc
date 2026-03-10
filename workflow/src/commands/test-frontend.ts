import * as files from "../utils/files";
import * as logger from "../utils/logger";
import * as claude from "../claude/client";

export async function testFrontendCommand(): Promise<void> {
  const frontendDir = files.resolve("frontend");

  if (!files.dirExists(frontendDir)) {
    logger.fatal("frontend/ does not exist. Run 'workflow code' first.");
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

  logger.info("Running frontend tests and fixing issues via Claude Code...");

  const prompt = `You are responsible for making all frontend Playwright tests pass in a React application.

## Project Specs (for context)

${specsContext}

## Instructions

1. Run the frontend tests using: cd frontend && npx playwright test
2. If all tests pass, you are done.
3. If any tests fail:
   a. Read the failing test files in frontend/e2e/ and the related source files in frontend/src/.
   b. Identify the root cause — whether the bug is in the source code or the test itself.
   c. Apply a targeted fix by editing the source file(s). Do NOT refactor or change code unrelated to the failing tests.
   d. Run the tests again.
4. Repeat until ALL frontend tests pass.
5. When finished, print a summary of all changes you made.`;

  const result = claude.invoke(prompt);

  if (!result.success) {
    logger.fatal("Claude Code failed to run frontend tests.");
  }

  logger.success("Frontend test-fix cycle complete.");
}
