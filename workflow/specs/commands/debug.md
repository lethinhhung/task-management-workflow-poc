# Command: `workflow debug`

## Purpose

Debug failing code or tests. Analyzes the provided error, proposes a fix, updates source code, and re-runs tests.

## Input

- An error description or failing test name passed as a CLI argument.

## Flow

1. Receive error description.
2. Analyze error and identify likely source.
3. Apply fix to source code.
4. Re-run tests.
5. Done.

## Behavior

1. Validate that an error description is provided.
2. Verify `src/` and `tests/` exist.
3. **Analyze** — Print the error and identify the likely source file and line.
4. **Fix** — Apply the fix to the identified source file.
5. **Verify** — Re-run tests and print results.
6. Print a summary of the debug session to stdout.

## Proposed Solutions

Propose 3 solutions for implementing this command. For each solution, provide a brief description, pros, and cons. Create a separate workspace to run it separately with naming: `workspace/{index}-{command}-{short-description}-{timestamp}`.

## Error Handling

- Exit with error if no error description is provided.
- Exit with error if project has not been scaffolded (`src/` missing).

## Example

```
$ workflow debug "TypeError: createTask is not a function"
→ Analyzing: "TypeError: createTask is not a function"
→ Likely source: src/tasks.ts
→ Applying fix...
✓ Updated src/tasks.ts
→ Re-running tests...
✓ All tests passed.
Debug complete.
```
