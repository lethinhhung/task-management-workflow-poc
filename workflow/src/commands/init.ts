import * as files from "../utils/files";
import * as logger from "../utils/logger";
import * as claude from "../claude/client";

export async function initCommand(options: { force?: boolean }): Promise<void> {
  const coreSpecDir = files.resolve("specs", "core-spec");
  const derivedSpecDir = files.resolve("specs", "derived-spec");

  // Validate core-spec exists
  if (!files.dirExists(coreSpecDir)) {
    logger.fatal("specs/core-spec/ does not exist. Create core spec files first.");
  }

  // Check if derived-spec already exists
  if (files.dirExists(derivedSpecDir) && !options.force) {
    logger.fatal("specs/derived-spec/ already exists. Use --force to overwrite.");
  }

  // Read all core spec files
  logger.info("Reading core specs...");
  const coreSpecs = await files.readMarkdownFiles(coreSpecDir);

  if (coreSpecs.length === 0) {
    logger.fatal("No .md files found in specs/core-spec/.");
  }

  for (const spec of coreSpecs) {
    logger.success(`Read specs/core-spec/${spec.name}`);
  }

  // Read the derived spec schema for reference
  const schemaPath = files.resolve("workflow", "specs", "derived-spec-schema.md");
  const schema = files.fileExists(schemaPath) ? files.readFile(schemaPath) : "";

  // Build prompt with all core spec content embedded
  const specContent = coreSpecs
    .map((s) => `### ${s.name}\n\n${s.content}`)
    .join("\n\n---\n\n");

  const prompt = `You are generating derived specifications for a software project. Read the core specs below and generate three derived spec files.

## Derived Spec Schema

Follow this schema exactly:

${schema}

## Core Specs

${specContent}

## Instructions

Generate the following three files by writing them to disk:

1. **specs/derived-spec/architecture.md** — System architecture, project structure (complete directory tree with every file), module breakdown, data flow, and external dependencies. Follow the schema's "architecture.md" section exactly.

2. **specs/derived-spec/implementation.md** — Setup steps, ordered implementation plan, configuration file contents, and environment variables. Follow the schema's "implementation.md" section exactly.

3. **specs/derived-spec/tests.md** — Test strategy, backend test setup and test suites (Jest + Supertest), frontend test setup and test suites (Playwright), and test commands. Follow the schema's "tests.md" section exactly.

Write all three files now. Each file must follow the Required Sections from the schema precisely. Make sure the content is comprehensive and covers everything from the core specs.`;

  // Invoke Claude Code
  logger.info("Generating derived specs...");

  if (options.force && files.dirExists(derivedSpecDir)) {
    files.removeDir(derivedSpecDir);
  }

  files.ensureDir(derivedSpecDir);

  const result = claude.invoke(prompt);

  if (!result.success) {
    logger.fatal("Failed to generate derived specs.");
  }

  // Validate output files were created
  const expectedFiles = ["architecture.md", "implementation.md", "tests.md"];
  const missing: string[] = [];

  for (const fileName of expectedFiles) {
    const filePath = files.resolve("specs", "derived-spec", fileName);
    if (files.fileExists(filePath)) {
      logger.success(`Generated specs/derived-spec/${fileName}`);
    } else {
      missing.push(fileName);
    }
  }

  if (missing.length > 0) {
    logger.fatal(`Missing derived spec files: ${missing.join(", ")}`);
  }

  console.log(
    `\nInit complete — ${expectedFiles.length} derived spec files generated from ${coreSpecs.length} core spec files.`
  );
}
