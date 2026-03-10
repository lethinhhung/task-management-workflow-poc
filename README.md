# Task Management Workflow POC

A proof-of-concept for spec-driven development powered by Claude Code. A custom CLI reads specifications and orchestrates Claude Code to generate, test, and iterate on a full-stack application — no manual code editing.

## How It Works

```
specs/core-spec/ → workflow init → specs/derived-spec/ → workflow code → backend/ + frontend/
                                                          workflow feature → incremental additions
                                                          workflow test    → run & fix tests
                                                          workflow debug   → diagnose & fix errors
```

1. **Define** what you want in `specs/core-spec/` (data model, API, frontend, etc.)
2. **Generate** derived specs and code via the workflow CLI
3. **Iterate** by adding feature requests to `specs/new-features/` and running `workflow feature`

## Commands

| Command | Description |
|---------|-------------|
| `workflow init` | Generate derived specs from core specs |
| `workflow code` | Generate full backend + frontend from derived specs |
| `workflow feature` | Add a feature: generate spec → patch code → test |
| `workflow test` | Run all tests, fix failures via Claude Code |
| `workflow test-backend` | Run and fix backend tests only |
| `workflow test-frontend` | Run and fix frontend tests only |
| `workflow debug <error>` | Analyze an error, apply fix, re-run tests |

## Tech Stack

| Layer | Technology |
|-------|------------|
| CLI | TypeScript + Commander.js |
| Backend | NestJS + TypeORM + PostgreSQL |
| Frontend | React + Vite |
| Backend Tests | Jest + Supertest (E2E) |
| Frontend Tests | Playwright (E2E) |
| Engine | Claude Code |

## Prerequisites

- Node.js 18+
- PostgreSQL
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed and authenticated

## Setup

```bash
cd workflow
npm install
npm run build
npm link
```

## Adding a Feature

1. Create a feature request in `specs/new-features/my-feature.md`
2. Run `workflow feature`
3. The CLI generates a feature spec, patches the code, and runs tests

## Project Structure

```
├── specs/
│   ├── core-spec/          # Base project specifications
│   ├── derived-spec/       # Generated implementation specs
│   ├── features-spec/      # Generated feature specs (incremental)
│   └── new-features/       # Feature requests (input)
├── workflow/               # CLI source code and workflow specs
├── backend/                # Generated NestJS backend
└── frontend/               # Generated React frontend
```
