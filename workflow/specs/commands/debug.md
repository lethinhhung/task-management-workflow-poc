# Command: `workflow debug`

## Purpose

Debug failing code or tests. Analyzes the provided error, proposes a fix, updates source code, and re-runs tests.

## Execution

This command invokes **Claude Code** to perform error analysis and code fixes. Claude Code reads the error description, searches the codebase to identify the root cause, applies targeted fixes to the source files, and the workflow CLI re-runs tests to verify. The analyze → fix → verify loop repeats up to 3 times.

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
2. Verify `backend/` and/or `frontend/` exist.
3. **Analyze** — Print the error and identify the likely source file and line. Search across `backend/src/`, `backend/test/`, `frontend/src/`, and `frontend/e2e/` for relevant code.
4. **Fix** — Apply the fix to the identified source file(s).
5. **Verify** — Re-run tests (see Test Execution below) and print results.
6. If tests still fail, repeat steps 3–5 up to 3 times before stopping.
7. Print a summary of the debug session to stdout.

## Test Execution

Run both test suites and report results:

1. **Backend tests**: `cd backend && npm test` — runs Jest + Supertest E2E tests.
2. **Frontend tests**: `cd frontend && npx playwright test` — runs Playwright E2E tests.

If the error is clearly isolated to one suite (e.g., a backend import error), only that suite's tests need to pass. If unclear, run both.

## Error Handling

- Exit with error if no error description is provided.
- Exit with error if project has not been scaffolded (`backend/` missing).
- Exit with error if fix cannot be determined after 3 attempts (report what was tried).

## Example

```
$ workflow debug "TypeError: createTask is not a function"
→ Analyzing: "TypeError: createTask is not a function"
→ Likely source: backend/src/todos/todos.service.ts
→ Applying fix...
✓ Updated backend/src/todos/todos.service.ts
→ Re-running tests...
✓ Backend tests: 16 passed
✓ Frontend tests: 3 passed
Debug complete — 1 file fixed, all tests passed.
```
