# Workflow CLI — Core Spec

## Goal

A spec-driven development CLI tool that transforms a project's core specification into working code through a structured pipeline. The workflow tool reads specs, generates derived specs, produces source code and tests, and supports iterative feature addition and debugging.

## Tech Stack (Workflow CLI)

- TypeScript
- Node.js
- Jest (testing)
- npm (package manager)

## Tech Stack (Target Project)

- React (frontend)
- NestJS (backend)
- PostgreSQL (database)
- Playwright (frontend E2E testing)
- Jest + Supertest (backend testing)

## Concept

The workflow tool follows a layered transformation model:

```
specs/core-spec/*.md
       ↓ init
specs/derived-spec/ (architecture, implementation, tests)
       ↓ code
backend/ + frontend/ + docker-compose.yml
       ↓ feature (iterative)
specs/new-features/*.md → specs/features/*.md → specs/derived-spec/ → backend/ + frontend/
       ↓ debug (iterative)
error analysis → code fix → tests pass
```

Each layer builds on the previous one. The core spec directory is the single source of truth; derived specs are regenerated from it (plus any feature specs) whenever the pipeline runs.

## Commands

| Command   | Purpose                                              |
| --------- | ---------------------------------------------------- |
| `init`    | Bootstrap derived specs from the core spec           |
| `code`    | Generate source code, tests, and config from derived specs |
| `feature` | Add features via a pipeline: new-feature → core spec → derived spec → code → test |
| `debug`   | Analyze errors, apply fixes, and re-run tests        |

See `workflow/specs/commands/*.md` for detailed command specifications.

## Directory Structure

The workflow tool expects and produces the following structure in the target project:

```
project/
├── specs/
│   ├── core-spec/                   # Source of truth (user-authored)
│   │   ├── overview.md              # Project name, goal, tech stack
│   │   ├── data-model.md            # Entities, fields, relationships
│   │   ├── api.md                   # Endpoint definitions and behavior
│   │   ├── auth.md                  # JWT strategy, password security, guards
│   │   ├── frontend.md              # Pages, UI components, architecture
│   │   ├── testing.md               # Backend and frontend E2E test cases
│   │   └── infrastructure.md        # Env vars, project structure, non-functional reqs
│   ├── new-features/*.md            # Pending feature requests (user-authored)
│   ├── features/*.md                # Generated feature specs
│   └── generated-new-features/*.md  # Processed feature requests (archived)
├── specs/derived-spec/
│   ├── architecture.md              # Generated from core + feature specs
│   ├── implementation.md            # Generated from core + feature specs
│   └── tests.md                     # Generated from core + feature specs
├── backend/                         # Generated NestJS backend
│   ├── src/                         # Backend source code
│   ├── test/                        # Backend E2E tests (Jest + Supertest)
│   └── package.json                 # Backend dependencies
├── frontend/                        # Generated React frontend
│   ├── src/                         # Frontend source code
│   ├── e2e/                         # Frontend E2E tests (Playwright)
│   └── package.json                 # Frontend dependencies
└── docker-compose.yml               # PostgreSQL and service orchestration
```

## Principles

- **Spec-first**: All code originates from specs. Changing behavior means changing specs, then regenerating.
- **Reproducible**: Running `init` → `code` on the same specs always produces the same output.
- **Incremental**: Features are added one at a time through the `feature` pipeline, each building on the existing spec base.
- **Verifiable**: Every pipeline run ends with a test execution to confirm correctness.

## Target

This workflow tool is a spec-driven development pipeline. It operates on a project's `specs/core-spec/` directory (reading all `*.md` files within it) to produce derived specifications, source code, and tests. The target project structure (e.g., `backend/`, `frontend/`, monorepo layout) is determined by the derived specs generated from the core spec files. See `workflow/specs/derived-spec-schema.md` for the derived spec format.
