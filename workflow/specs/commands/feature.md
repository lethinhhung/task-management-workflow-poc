# Command: `workflow feature`

## Purpose

Add a new feature to the project. Reads new feature requests, generates core and derived specs, regenerates code, and runs tests.

## Input

- Feature request markdown files located in `specs/new-features/*.md`.

## Flow

1. Read feature requests from `specs/new-features/*.md`.
2. Generate core spec for each feature at `specs/features/*.md`.
3. Generate derived specs at `specs/derived-spec/*.md` (architecture, implementation, tests).
4. Run `workflow code` to regenerate source code and tests.
5. Run tests.
6. Move processed feature requests from `specs/new-features/*.md` to `specs/generated-new-features/*.md`.
7. Done.

## Behavior

1. Verify `specs/new-features/` exists and contains at least one `.md` file.
2. Read each feature request file from `specs/new-features/*.md`.
3. For each feature, generate a core spec file at `specs/features/<feature-name>.md` describing the feature's goal, requirements, and testing criteria.
4. Regenerate `specs/derived-spec/*.md` by merging all core spec files from `specs/core-spec/` with all feature specs from `specs/features/`.
5. Run `workflow code` to regenerate `src/`, `tests/`, and `package.json` from the updated derived specs.
6. Run tests and report results.
7. Move each processed file from `specs/new-features/` to `specs/generated-new-features/` (create directory if needed).
8. Print a summary of the full pipeline to stdout.

## Proposed Solutions

Propose 3 solutions for implementing this command. For each solution, provide a brief description, pros, and cons. Create a separate workspace to run it separately with naming: `workspace/{index}-{command}-{short-description}-{timestamp}`.

## Error Handling

- Exit with error if `specs/new-features/` does not exist or is empty.
- Exit with error if project has not been initialized (`specs/derived-spec/` missing).
- Exit with error if `workflow code` fails.
- Exit with error if tests fail (report failing tests).

## Example

```
$ workflow feature
→ Reading specs/new-features/user-authentication.md
✓ Generated specs/features/user-authentication.md
✓ Updated specs/derived-spec/architecture.md
✓ Updated specs/derived-spec/implementation.md
✓ Updated specs/derived-spec/tests.md
→ Running workflow code...
✓ Generated src/auth.ts
✓ Generated tests/auth.test.ts
→ Running tests...
✓ All tests passed.
✓ Moved specs/new-features/user-authentication.md → specs/generated-new-features/user-authentication.md
Feature pipeline complete — 1 feature added.
```
