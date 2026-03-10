# Command: `workflow init`

## Purpose

Generate derived specs from the core spec. This bootstraps the project by producing structured specification files that downstream commands (`code`, `feature`, `debug`) consume.

## Input

- `specs/core-spec/` — the source of truth directory containing project requirement files (`*.md`).

## Output

- `specs/derived-spec/architecture.md`
- `specs/derived-spec/implementation.md`
- `specs/derived-spec/tests.md`

See `workflow/specs/derived-spec-schema.md` for the required format and content of each output file.

## Flow

1. Read all `*.md` files from `specs/core-spec/`.
2. Synthesize project architecture, implementation plan, and test specification.
3. Generate derived spec files at `specs/derived-spec/`.
4. Done.

## Behavior

1. Read all `*.md` files from `specs/core-spec/`.
2. Analyze the core specs to understand:
   - Project structure (from `overview.md` and `infrastructure.md`).
   - Data model and relationships (from `data-model.md`).
   - API endpoints and behavior (from `api.md`).
   - Authentication strategy (from `auth.md`).
   - Frontend pages and components (from `frontend.md`).
   - Test cases and strategy (from `testing.md`).
3. Generate `specs/derived-spec/architecture.md`:
   - System overview (monorepo with backend + frontend).
   - Complete project directory tree with every file.
   - Module breakdown (responsibilities, locations, dependencies, exports).
   - Data flow diagrams for key operations.
   - External dependency list by sub-project.
4. Generate `specs/derived-spec/implementation.md`:
   - Setup steps (package.json, tsconfig, env, docker-compose).
   - Ordered implementation steps with file lists and dependencies.
   - Configuration file contents.
   - Environment variable reference.
5. Generate `specs/derived-spec/tests.md`:
   - Test strategy overview.
   - Backend test setup (test database, app bootstrap, helpers).
   - Backend test suites with individual test cases (setup, action, assertion).
   - Frontend test setup (Playwright config, base URL, helpers).
   - Frontend test suites with individual test cases (steps, assertions).
   - Test commands for each suite.
6. Print a summary of generated files to stdout.

## Error Handling

- Exit with error if `specs/core-spec/` does not exist.
- Exit with error if `specs/derived-spec/` already exists (use `--force` to overwrite).

## Example

```
$ workflow init
→ Reading core specs...
✓ Read specs/core-spec/overview.md
✓ Read specs/core-spec/data-model.md
✓ Read specs/core-spec/api.md
✓ Read specs/core-spec/auth.md
✓ Read specs/core-spec/frontend.md
✓ Read specs/core-spec/testing.md
✓ Read specs/core-spec/infrastructure.md
→ Generating derived specs...
✓ Generated specs/derived-spec/architecture.md
✓ Generated specs/derived-spec/implementation.md
✓ Generated specs/derived-spec/tests.md
Init complete — 3 derived spec files generated from 7 core spec files.
```
