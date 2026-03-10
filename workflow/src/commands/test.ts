import * as files from "../utils/files";
import * as logger from "../utils/logger";
import * as claude from "../claude/client";

export async function testCommand(): Promise<void> {
  const backendDir = files.resolve("backend");
  const frontendDir = files.resolve("frontend");

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

  const sections: string[] = [];

  if (files.dirExists(backendDir)) {
    sections.push(`### Backend
- Run tests: cd backend && npm test
- Test files: backend/test/
- Source files: backend/src/`);
  }

  if (files.dirExists(frontendDir)) {
    sections.push(`### Frontend
- Run tests: cd frontend && npx playwright test
- Test files: frontend/e2e/
- Source files: frontend/src/`);
  }

  logger.info("Running all tests and fixing issues via Claude Code...");

  const prompt = `You are responsible for making all tests pass in a full-stack application.

## Project Specs (for context)

${specsContext}

## Test Suites

${sections.join("\n\n")}

## Instructions

1. Run ALL test suites listed above, one at a time.
2. If a test suite fails:
   a. Read the failing test files and the related source files.
   b. Identify the root cause — whether the bug is in the source code or the test itself.
   c. Apply a targeted fix by editing the source file(s). Do NOT refactor or change code unrelated to the failing tests.
   d. Run that test suite again.
   e. Repeat until that test suite passes, then move to the next one.
3. After fixing one suite, re-run all previous suites to ensure fixes didn't break anything.
4. Continue until ALL test suites pass.
5. When finished, print a summary of all changes you made.`;

  const result = claude.invoke(prompt);

  if (!result.success) {
    logger.fatal("Claude Code failed to run tests.");
  }

  logger.success("All test-fix cycles complete.");
}
