import * as files from "../utils/files";
import * as logger from "../utils/logger";
import * as claude from "../claude/client";

export async function testBackendCommand(): Promise<void> {
  const backendDir = files.resolve("backend");

  if (!files.dirExists(backendDir)) {
    logger.fatal("backend/ does not exist. Run 'workflow code' first.");
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

  logger.info("Running backend tests and fixing issues via Claude Code...");

  const prompt = `You are responsible for making all backend tests pass in a NestJS application.

## Project Specs (for context)

${specsContext}

## Instructions

1. Run the backend tests using: cd backend && npm test
2. If all tests pass, you are done.
3. If any tests fail:
   a. Read the failing test files in backend/test/ and the related source files in backend/src/.
   b. Identify the root cause — whether the bug is in the source code or the test itself.
   c. Apply a targeted fix by editing the source file(s). Do NOT refactor or change code unrelated to the failing tests.
   d. Run the tests again.
4. Repeat until ALL backend tests pass.
5. When finished, print a summary of all changes you made.`;

  const result = claude.invoke(prompt);

  if (!result.success) {
    logger.fatal("Claude Code failed to run backend tests.");
  }

  logger.success("Backend test-fix cycle complete.");
}
