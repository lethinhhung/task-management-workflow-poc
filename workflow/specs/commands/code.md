# Command: `workflow code`

## Purpose

Generate project source code, tests, and package configuration from the derived specs. Translates specifications into a runnable project scaffold.

## Input

- `derived-spec/*` — the derived specification files produced by `workflow init`.

## Flow

1. Read derived spec files from `derived-spec/`.
2. Generate source code at `src/`.
3. Generate test files at `tests/`.
4. Generate `package.json`.
5. Done.

## Behavior

1. Verify `derived-spec/` exists and contains the expected files.
2. Read each derived spec file.
3. Generate `src/` with module files based on `derived-spec/architecture.md`.
4. Generate `tests/` with test files based on `derived-spec/tests.md`.
5. Generate `package.json` based on `derived-spec/implementation.md`.
6. Print a summary of generated files to stdout.

## Proposed Solutions

Propose 3 solutions for implementing this command. For each solution, provide a brief description, pros, and cons. Create a separate workspace to run it separately with naming: `workspace/{index}-{command}-{short-description}-{timestamp}`.

## Error Handling

- Exit with error if `derived-spec/` does not exist (run `workflow init` first).
- Exit with error if `src/` or `tests/` already exist (use `--force` to overwrite).

## Example

```
$ workflow code
✓ Read derived-spec/architecture.md
✓ Read derived-spec/implementation.md
✓ Read derived-spec/tests.md
✓ Generated src/index.ts
✓ Generated tests/index.test.ts
✓ Generated package.json
Code generation complete — 3 files generated.
```
