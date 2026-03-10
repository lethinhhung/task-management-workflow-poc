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
specs/core-spec.md
       ↓ init
derived-spec/ (architecture, implementation, tests)
       ↓ code
src/ + tests/ + package.json
       ↓ feature (iterative)
specs/new-features/*.md → specs/features/*.md → derived-spec/ → src/ + tests/
       ↓ debug (iterative)
error analysis → src/ fix → tests pass
```

Each layer builds on the previous one. The core spec is the single source of truth; derived specs are regenerated from it (plus any feature specs) whenever the pipeline runs.

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
│   ├── core-spec.md                 # Source of truth (user-authored)
│   ├── new-features/*.md            # Pending feature requests (user-authored)
│   ├── features/*.md                # Generated feature specs
│   └── generated-new-features/*.md  # Processed feature requests (archived)
├── derived-spec/
│   ├── architecture.md              # Generated from core + feature specs
│   ├── implementation.md            # Generated from core + feature specs
│   └── tests.md                     # Generated from core + feature specs
├── src/                             # Generated source code
├── tests/                           # Generated test files
└── package.json                     # Generated project config
```

## Principles

- **Spec-first**: All code originates from specs. Changing behavior means changing specs, then regenerating.
- **Reproducible**: Running `init` → `code` on the same specs always produces the same output.
- **Incremental**: Features are added one at a time through the `feature` pipeline, each building on the existing spec base.
- **Verifiable**: Every pipeline run ends with a test execution to confirm correctness.

## Target

This workflow tool is a general-purpose spec-driven development pipeline. It operates on a project's `specs/core-spec.md` to produce derived specifications, source code, and tests. The target project is defined by whatever core spec is provided.
