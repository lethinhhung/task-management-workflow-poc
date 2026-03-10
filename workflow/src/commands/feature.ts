import * as files from "../utils/files";
import * as logger from "../utils/logger";
import * as claude from "../claude/client";
import * as path from "path";

export async function featureCommand(): Promise<void> {
  const newFeaturesDir = files.resolve("specs", "new-features");
  const featuresSpecDir = files.resolve("specs", "features-spec");
  const archiveDir = files.resolve("specs", "generated-new-features");

  // Validate new-features directory
  if (!files.dirExists(newFeaturesDir)) {
    logger.fatal("specs/new-features/ does not exist. Create feature request files first.");
  }

  // Validate project has been generated
  const backendDir = files.resolve("backend");
  const frontendDir = files.resolve("frontend");
  if (!files.dirExists(backendDir) && !files.dirExists(frontendDir)) {
    logger.fatal("Neither backend/ nor frontend/ exist. Run 'workflow code' first.");
  }

  // Read feature requests
  const featureRequests = await files.readMarkdownFiles(newFeaturesDir);
  if (featureRequests.length === 0) {
    logger.fatal("No .md files found in specs/new-features/.");
  }

  // Determine next index from existing feature specs
  files.ensureDir(featuresSpecDir);
  const existingSpecs = await files.readMarkdownFiles(featuresSpecDir);
  let nextIndex = existingSpecs.length + 1;

  // Read derived specs for context
  const derivedSpecDir = files.resolve("specs", "derived-spec");
  let specsContext = "";
  if (files.dirExists(derivedSpecDir)) {
    const specs = await files.readMarkdownFiles(derivedSpecDir);
    specsContext = specs
      .map((s) => `### ${s.name}\n\n${s.content}`)
      .join("\n\n---\n\n");
  }

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  for (const request of featureRequests) {
    logger.info(`Reading specs/new-features/${request.name}`);

    // Derive kebab-case name from filename (strip .md)
    const featureName = request.name.replace(/\.md$/, "");
    const indexStr = String(nextIndex).padStart(3, "0");
    const specFileName = `${indexStr}-${featureName}-${today}.md`;
    const specFilePath = path.join(featuresSpecDir, specFileName);

    // Step 1: Generate feature spec
    logger.info("Generating feature spec...");

    const featureSpecPrompt = `You are generating a detailed feature specification from a feature request. This spec will be used to patch existing code — it must be detailed enough to guide implementation.

## Feature Request

${request.content}

## Existing Project Specs (for context)

${specsContext}

## Instructions

Generate a feature spec file at specs/features-spec/${specFileName} containing:

- **Goal**: What the feature achieves.
- **Requirements**: Structured functional requirements.
- **Data Model Changes**: New fields, entities, or migrations needed.
- **API Changes**: New or modified endpoints with request/response shapes and validation rules.
- **Frontend Changes**: New or modified components, pages, or UI elements.
- **Implementation Steps**: Ordered list of specific code changes needed (which files to create or modify).
- **Test Cases**: Specific backend and frontend test scenarios with setup, action, and assertion.

Be precise about file paths, function names, and data types. This spec drives the code changes directly.

Write the file now.`;

    const specResult = claude.invoke(featureSpecPrompt);
    if (!specResult.success) {
      logger.fatal(`Failed to generate feature spec for ${request.name}`);
    }

    // Verify the spec was created
    if (!files.fileExists(specFilePath)) {
      logger.fatal(`Feature spec was not created at specs/features-spec/${specFileName}`);
    }

    logger.success(`Generated specs/features-spec/${specFileName}`);

    // Step 2: Patch code based on feature spec
    logger.info(`Patching code for feature: ${featureName}`);

    const featureSpec = files.readFile(specFilePath);

    const patchPrompt = `You are adding a new feature to an existing full-stack application by patching the current code. Do NOT regenerate or rewrite entire files — make targeted, incremental changes.

## Feature Spec

${featureSpec}

## Instructions

1. Read the existing source files that need to be modified.
2. Apply the changes described in the feature spec:
   - Modify existing files where needed (add fields, endpoints, components, etc.).
   - Create new files only when the feature requires them.
   - Update imports, routes, and registrations as needed.
3. Do NOT:
   - Rewrite files from scratch.
   - Remove or refactor existing functionality.
   - Change code unrelated to this feature.
4. After patching, verify the changes look correct by reading the modified files.`;

    const patchResult = claude.invoke(patchPrompt);
    if (!patchResult.success) {
      logger.fatal(`Failed to patch code for feature: ${featureName}`);
    }

    logger.success("Code patched successfully");

    // Step 3: Run tests and fix via Claude Code
    logger.info("Running tests and fixing issues via Claude Code...");

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

    const testPrompt = `You are responsible for making all tests pass after a feature was added to a full-stack application.

## Feature That Was Added

${featureSpec}

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

    const testResult = claude.invoke(testPrompt);
    if (!testResult.success) {
      logger.error("Claude Code test-fix cycle reported a failure.");
    } else {
      logger.success("All tests passed");
    }

    nextIndex++;
  }

  // Archive processed feature requests
  files.ensureDir(archiveDir);
  for (const request of featureRequests) {
    const src = path.join(newFeaturesDir, request.name);
    const dest = path.join(archiveDir, request.name);
    files.moveFile(src, dest);
    logger.success(
      `Moved specs/new-features/${request.name} → specs/generated-new-features/${request.name}`
    );
  }

  console.log(
    `\nFeature pipeline complete — ${featureRequests.length} feature(s) added.`
  );
}
