# Command: `workflow feature`

## Purpose

Add a new feature to the project. Reads new feature requests, generates feature specs, regenerates derived specs, regenerates code, and runs tests.

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

## Flow

1. Read feature requests from `specs/new-features/*.md`.
2. Generate feature spec for each request at `specs/features/*.md`.
3. Regenerate derived specs at `specs/derived-spec/*.md`.
4. Run `workflow code --force` to regenerate backend and frontend.
5. Run tests.
6. Move processed feature requests to `specs/generated-new-features/*.md`.
7. Done.

## Behavior

1. Verify `specs/new-features/` exists and contains at least one `.md` file.
2. Verify `specs/derived-spec/` exists (project must be initialized).
3. Read each feature request file from `specs/new-features/*.md`.
4. For each feature, generate a feature spec at `specs/features/<feature-name>.md` containing:
   - **Goal**: What the feature achieves (from the request's Description).
   - **Requirements**: Structured requirements (from the request's Requirements).
   - **Architecture impact**: New modules, endpoints, pages, or data model changes.
   - **Test cases**: Specific test scenarios with setup, action, and assertion.
5. Regenerate `specs/derived-spec/*.md` by reading all files from `specs/core-spec/` and `specs/features/`, following the schema in `workflow/specs/derived-spec-schema.md`. Derived specs are regenerated from scratch (not patched) to ensure consistency.
6. Run `workflow code --force` to regenerate `backend/` and `frontend/` from the updated derived specs.
7. Run tests (see Test Execution below) and report results.
8. Move each processed file from `specs/new-features/` to `specs/generated-new-features/` (create directory if needed).
9. Print a summary of the full pipeline to stdout.

## Test Execution

Run both test suites and report results:

1. **Backend tests**: `cd backend && npm test` — runs Jest + Supertest E2E tests against a test database.
2. **Frontend tests**: `cd frontend && npx playwright test` — runs Playwright E2E tests against the full stack.

A test run is considered successful only if both suites pass. Report individual suite results in the output.

## Error Handling

- Exit with error if `specs/new-features/` does not exist or is empty.
- Exit with error if project has not been initialized (`specs/derived-spec/` missing).
- Exit with error if `workflow code --force` fails.
- Exit with error if tests fail (report failing test names and errors).

## Example

```
$ workflow feature
→ Reading specs/new-features/user-authentication.md
✓ Generated specs/features/user-authentication.md
→ Regenerating derived specs...
✓ Updated specs/derived-spec/architecture.md
✓ Updated specs/derived-spec/implementation.md
✓ Updated specs/derived-spec/tests.md
→ Running workflow code --force...
✓ Generated backend/src/auth/ (5 files)
✓ Generated frontend/src/pages/LoginPage.tsx
→ Running tests...
✓ Backend tests: 16 passed
✓ Frontend tests: 3 passed
✓ Moved specs/new-features/user-authentication.md → specs/generated-new-features/user-authentication.md
Feature pipeline complete — 1 feature added, all tests passed.
```
