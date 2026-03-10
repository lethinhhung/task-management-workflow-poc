# Command: `workflow code`

## Purpose

Generate project source code, tests, and configuration from the derived specs. Translates specifications into a runnable project scaffold with separate backend and frontend sub-projects.

## Input

- `specs/derived-spec/*` — the derived specification files produced by `workflow init`.
- See `workflow/specs/derived-spec-schema.md` for the expected format of each file.

## Flow

1. Read derived spec files from `specs/derived-spec/`.
2. Generate `backend/` — NestJS source code, tests, and configuration.
3. Generate `frontend/` — React source code, tests, and configuration.
4. Generate `docker-compose.yml` — service orchestration.
5. Install dependencies.
6. Done.

## Behavior

1. Verify `specs/derived-spec/` exists and contains `architecture.md`, `implementation.md`, and `tests.md`.
2. Read each derived spec file.
3. Generate `backend/` with source code and structure based on `specs/derived-spec/architecture.md`:
   - `backend/src/` — NestJS modules, controllers, services, entities, DTOs.
   - `backend/test/` — E2E test files based on `specs/derived-spec/tests.md`.
   - `backend/package.json` and `backend/tsconfig.json` based on `specs/derived-spec/implementation.md`.
   - `backend/.env` with environment variable defaults.
4. Generate `frontend/` with source code and structure based on `specs/derived-spec/architecture.md`:
   - `frontend/src/` — React pages, components, API client, context providers.
   - `frontend/e2e/` — Playwright test files based on `specs/derived-spec/tests.md`.
   - `frontend/package.json`, `frontend/tsconfig.json`, and `frontend/vite.config.ts` based on `specs/derived-spec/implementation.md`.
5. Generate `docker-compose.yml` based on `specs/derived-spec/implementation.md`.
6. Run `cd backend && npm install` and `cd frontend && npm install`.
7. Print a summary of generated files to stdout.

## Error Handling

- Exit with error if `specs/derived-spec/` does not exist (run `workflow init` first).
- Exit with error if `backend/` or `frontend/` already exist (use `--force` to overwrite).

## Example

```
$ workflow code
→ Reading derived specs...
✓ Read specs/derived-spec/architecture.md
✓ Read specs/derived-spec/implementation.md
✓ Read specs/derived-spec/tests.md
→ Generating backend...
✓ Generated backend/src/main.ts
✓ Generated backend/src/app.module.ts
✓ Generated backend/src/auth/ (5 files)
✓ Generated backend/src/users/ (3 files)
✓ Generated backend/src/todos/ (5 files)
✓ Generated backend/test/app.e2e-spec.ts
✓ Generated backend/package.json
→ Generating frontend...
✓ Generated frontend/src/main.tsx
✓ Generated frontend/src/App.tsx
✓ Generated frontend/src/pages/ (3 files)
✓ Generated frontend/src/components/ (2 files)
✓ Generated frontend/e2e/todo-app.spec.ts
✓ Generated frontend/package.json
✓ Generated docker-compose.yml
→ Installing dependencies...
✓ Backend dependencies installed.
✓ Frontend dependencies installed.
Code generation complete — 28 files generated.
```
