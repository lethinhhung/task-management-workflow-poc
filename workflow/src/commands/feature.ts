import * as files from "../utils/files";
import * as logger from "../utils/logger";
import * as claude from "../claude/client";
import { execSync } from "child_process";
import * as path from "path";

export async function featureCommand(): Promise<void> {
  const newFeaturesDir = files.resolve("specs", "new-features");
  const featuresDir = files.resolve("specs", "features");
  const derivedSpecDir = files.resolve("specs", "derived-spec");
  const archivDir = files.resolve("specs", "generated-new-features");

  // Validate directories
  if (!files.dirExists(newFeaturesDir)) {
    logger.fatal("specs/new-features/ does not exist. Create feature request files first.");
  }

  if (!files.dirExists(derivedSpecDir)) {
    logger.fatal("specs/derived-spec/ does not exist. Run 'workflow init' first.");
  }

  // Read feature requests
  const featureRequests = await files.readMarkdownFiles(newFeaturesDir);

  if (featureRequests.length === 0) {
    logger.fatal("No .md files found in specs/new-features/.");
  }

  // Read core specs
  const coreSpecDir = files.resolve("specs", "core-spec");
  const coreSpecs = await files.readMarkdownFiles(coreSpecDir);

  // Read derived spec schema
  const schemaPath = files.resolve("workflow", "specs", "derived-spec-schema.md");
  const schema = files.fileExists(schemaPath) ? files.readFile(schemaPath) : "";

  // Read existing feature specs (if any)
  files.ensureDir(featuresDir);
  const existingFeatures = await files.readMarkdownFiles(featuresDir);

  // Step 1: Generate feature specs from each request
  for (const request of featureRequests) {
    logger.info(`Reading specs/new-features/${request.name}`);

    const featureSpecPrompt = `You are generating a structured feature specification from a feature request.

## Feature Request

${request.content}

## Instructions

Generate a feature spec file at specs/features/${request.name} containing:

- **Goal**: What the feature achieves (from the request's Description).
- **Requirements**: Structured requirements (from the request's Requirements).
- **Architecture impact**: New modules, endpoints, pages, or data model changes.
- **Test cases**: Specific test scenarios with setup, action, and assertion.

Write the file now.`;

    const result = claude.invoke(featureSpecPrompt);
    if (!result.success) {
      logger.fatal(`Failed to generate feature spec for ${request.name}`);
    }

    logger.success(`Generated specs/features/${request.name}`);
  }

  // Step 2: Regenerate derived specs from core + all feature specs
  const allFeatureSpecs = await files.readMarkdownFiles(featuresDir);

  const coreContent = coreSpecs
    .map((s) => `### ${s.name}\n\n${s.content}`)
    .join("\n\n---\n\n");

  const featureContent = allFeatureSpecs
    .map((s) => `### ${s.name}\n\n${s.content}`)
    .join("\n\n---\n\n");

  const derivedSpecPrompt = `You are regenerating derived specifications for a software project. Read ALL core specs and feature specs below, and regenerate the three derived spec files from scratch.

## Derived Spec Schema

Follow this schema exactly:

${schema}

## Core Specs

${coreContent}

## Feature Specs

${featureContent}

## Instructions

Regenerate all three derived spec files from scratch (not patched). New features add to existing functionality without removing anything unless explicitly stated.

Write these files:

1. **specs/derived-spec/architecture.md**
2. **specs/derived-spec/implementation.md**
3. **specs/derived-spec/tests.md**

Each must follow the Required Sections from the schema precisely.`;

  logger.info("Regenerating derived specs...");

  // Remove existing derived specs for clean regeneration
  files.removeDir(derivedSpecDir);
  files.ensureDir(derivedSpecDir);

  const derivedResult = claude.invoke(derivedSpecPrompt);
  if (!derivedResult.success) {
    logger.fatal("Failed to regenerate derived specs.");
  }

  // Validate derived spec files
  const expectedFiles = ["architecture.md", "implementation.md", "tests.md"];
  for (const fileName of expectedFiles) {
    const filePath = files.resolve("specs", "derived-spec", fileName);
    if (files.fileExists(filePath)) {
      logger.success(`Updated specs/derived-spec/${fileName}`);
    } else {
      logger.fatal(`Missing derived spec file: ${fileName}`);
    }
  }

  // Step 3: Run workflow code --force
  logger.info("Running workflow code --force...");

  const { codeCommand } = await import("./code");
  await codeCommand({ force: true });

  // Step 4: Run tests
  logger.info("Running tests...");
  let testsPass = true;

  try {
    execSync("npm test", {
      cwd: files.resolve("backend"),
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 120_000,
    });
    logger.success("Backend tests: passed");
  } catch (err: unknown) {
    logger.error("Backend tests: failed");
    testsPass = false;
  }

  try {
    execSync("npx playwright test", {
      cwd: files.resolve("frontend"),
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 120_000,
    });
    logger.success("Frontend tests: passed");
  } catch (err: unknown) {
    logger.error("Frontend tests: failed");
    testsPass = false;
  }

  // Step 5: Archive processed feature requests
  files.ensureDir(archivDir);

  for (const request of featureRequests) {
    const src = path.join(newFeaturesDir, request.name);
    const dest = path.join(archivDir, request.name);
    files.moveFile(src, dest);
    logger.success(
      `Moved specs/new-features/${request.name} → specs/generated-new-features/${request.name}`
    );
  }

  console.log(
    `\nFeature pipeline complete — ${featureRequests.length} feature(s) added${testsPass ? ", all tests passed" : ", some tests failed"}.`
  );

  if (!testsPass) {
    process.exit(1);
  }
}
