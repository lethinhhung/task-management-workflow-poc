# Derived Spec Schema

## Purpose

Defines the required structure and content for each file generated in `specs/derived-spec/`. These files are produced by `workflow init` (from core specs) and updated by `workflow feature` (merging core + feature specs). They serve as the input for `workflow code`.

All derived spec generation is performed by **Claude Code**. Claude reads the core and feature specs, synthesizes the information, and writes the derived spec files following the schema below. The schema ensures Claude produces consistent, structured output that downstream commands can rely on.

## Files

### `architecture.md`

High-level architecture and module breakdown. The `workflow code` command reads this to determine what directories, modules, and files to generate.

#### Required Sections

```markdown
# Architecture

## Overview
Brief description of the system architecture (monolith, microservices, monorepo, etc.)
and how frontend and backend interact.

## Project Structure
Full directory tree of the generated project, listing every directory and file
with a one-line description. This is the authoritative list of files that
`workflow code` must produce.

## Modules
For each module (e.g., auth, todos, users):
### <Module Name>
- **Responsibility**: What this module does.
- **Location**: File paths (e.g., `backend/src/auth/`).
- **Dependencies**: Other modules or external packages it depends on.
- **Exports**: Public interfaces, controllers, services, or components.

## Data Flow
How data moves through the system for key operations:
- Authentication flow (signup, login, token validation).
- CRUD flow (create, read, update, delete through API to database).
- Frontend-to-backend communication pattern.

## External Dependencies
List of npm packages required, grouped by project:
### Backend
| Package | Purpose |
### Frontend
| Package | Purpose |
```

### `implementation.md`

Step-by-step implementation plan with ordering and dependencies. The `workflow code` command reads this to determine the implementation sequence and configuration.

#### Required Sections

```markdown
# Implementation Plan

## Setup
Project initialization steps:
- Package initialization (package.json contents for each sub-project).
- TypeScript configuration (tsconfig.json contents).
- Environment configuration (.env structure, docker-compose.yml).
- Build tool configuration (Vite, NestJS CLI, etc.).

## Implementation Order
Numbered list of implementation steps, ordered by dependency:
1. Step name — what to implement, which files, key details.
   - **Files**: List of files created or modified.
   - **Depends on**: Previous steps required.
   - **Key details**: Important implementation notes (e.g., "use bcrypt salt rounds 10").

## Configuration Files
Exact content for each configuration file:
### `backend/package.json`
### `frontend/package.json`
### `backend/tsconfig.json`
### `frontend/tsconfig.json`
### `docker-compose.yml`
### Other config files as needed

## Environment Variables
Complete list of environment variables with types, defaults, and which
sub-project uses them.
```

### `tests.md`

Test cases derived from requirements, organized by test runner. The `workflow code` command reads this to generate test files.

#### Required Sections

```markdown
# Test Specification

## Test Strategy
Overview of testing approach:
- Backend test framework, database strategy, setup/teardown.
- Frontend test framework, server requirements, browser config.

## Backend Tests

### Test Setup
- Test database configuration.
- App bootstrapping for tests.
- Helper utilities (e.g., create test user, get auth token).

### Test Suites
For each test suite (e.g., Auth, Todos):
#### <Suite Name> (`<file-path>`)
For each test case:
- **Test name**: Descriptive name.
- **Setup**: Any preconditions (e.g., "create a user first").
- **Action**: HTTP method, path, headers, body.
- **Assertion**: Expected status code, response body, side effects.

## Frontend Tests

### Test Setup
- Playwright configuration.
- Base URL and server requirements.
- Helper utilities (e.g., signup and login helper).

### Test Suites
For each test suite:
#### <Suite Name> (`<file-path>`)
For each test case:
- **Test name**: Descriptive name.
- **Steps**: Numbered user actions (navigate, click, fill, etc.).
- **Assertions**: Expected UI state after each key step.

## Test Commands
Exact commands to run each test suite:
- Backend: `cd backend && npm test`
- Frontend: `cd frontend && npx playwright test`
```

## Feature Specs

When `workflow feature` adds a new feature, it generates a self-contained feature spec at `specs/features-spec/{index}-{name}-{timestamp}.md`. This feature spec serves as the implementation guide for patching existing code — derived specs are NOT regenerated. Derived specs remain the baseline from `workflow init`, and feature specs layer incremental changes on top.
