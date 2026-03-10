# Command: `workflow feature`

## Purpose

Add a new feature to the project incrementally. Reads new feature requests, generates self-contained feature specs, patches existing code, and runs tests. No full regeneration of derived specs or code.

## Execution

This command invokes **Claude Code** at two stages: (1) to transform a feature request into a detailed feature spec that serves as the implementation guide, and (2) to patch existing source code based on that feature spec. Tests are delegated to Claude Code to run and fix in a loop.

## Input

- Feature request markdown files located in `specs/new-features/*.md`.

## Feature Request File Format

Each file in `specs/new-features/` must follow this structure:

```markdown
# Feature: <Feature Name>

## Description
What the feature does and why it's needed.

## Requirements
- Numbered list of functional requirements.

## API Changes (if any)
New or modified endpoints with request/response details.

## Frontend Changes (if any)
New pages, components, or UI modifications.

## Data Model Changes (if any)
New entities, fields, or relationship changes.

## Testing
- Key test cases that verify the feature works.
```

## Output

Feature specs are written to `specs/features-spec/` with the naming convention:

```
specs/features-spec/{index}-{name}-{timestamp}.md
```

- **index**: Zero-padded sequential number (001, 002, ...) based on existing specs.
- **name**: Kebab-case feature name derived from the request filename.
- **timestamp**: ISO 8601 date (YYYYMMDD) for traceability.

Example: `specs/features-spec/001-add-due-date-2026-03-10.md`

## Flow

1. Read feature requests from `specs/new-features/*.md`.
2. For each request, generate a feature spec at `specs/features-spec/{index}-{name}-{timestamp}.md`.
3. Patch existing code (backend + frontend) based on the feature spec.
4. Run tests and fix failures via Claude Code.
5. Archive processed feature requests to `specs/generated-new-features/`.
6. Done.

## Behavior

1. Verify `specs/new-features/` exists and contains at least one `.md` file.
2. Verify `backend/` or `frontend/` exists (project must have been generated).
3. Read existing feature specs from `specs/features-spec/` to determine the next index.
4. For each feature request:
   a. **Generate feature spec** — Invoke Claude Code to produce a detailed spec containing:
      - **Goal**: What the feature achieves.
      - **Requirements**: Structured functional requirements.
      - **Data model changes**: New fields, entities, or migrations.
      - **API changes**: New or modified endpoints with request/response shapes.
      - **Frontend changes**: New components, pages, or UI modifications.
      - **Implementation steps**: Ordered list of code changes needed.
      - **Test cases**: Backend and frontend test scenarios.
   b. **Patch code** — Invoke Claude Code to read the feature spec and modify existing source code. Claude reads the current codebase, applies targeted changes, and writes only the files that need updating. No full regeneration.
   c. **Run tests** — Invoke Claude Code to run all test suites and fix any failures in a loop until all tests pass.
5. Move each processed file from `specs/new-features/` to `specs/generated-new-features/`.
6. Print a summary.

## Key Principle: Incremental Patching

Unlike the `workflow code` command which generates everything from scratch, `workflow feature` patches code incrementally:

- Claude Code reads the feature spec and the existing source files.
- It modifies only the files affected by the new feature.
- It adds new files only when the feature requires them.
- Existing functionality is preserved — no full regeneration.

This is faster, cheaper, and reduces regression risk compared to regenerating the entire codebase.

## Error Handling

- Exit with error if `specs/new-features/` does not exist or is empty.
- Exit with error if neither `backend/` nor `frontend/` exists.
- Exit with error if feature spec generation fails.
- Exit with error if code patching fails.
- Report test results (pass/fail) but do not exit on test failure — Claude Code handles the fix loop.

## Example

```
$ workflow feature
→ Reading specs/new-features/add-due-date-to-todo.md
→ Generating feature spec...
✓ Generated specs/features-spec/001-add-due-date-to-todo-20260310.md
→ Patching code for feature: add-due-date-to-todo
✓ Code patched successfully
→ Running tests and fixing issues via Claude Code...
✓ All tests passed
✓ Moved specs/new-features/add-due-date-to-todo.md → specs/generated-new-features/add-due-date-to-todo.md
Feature pipeline complete — 1 feature added, all tests passed.
```
