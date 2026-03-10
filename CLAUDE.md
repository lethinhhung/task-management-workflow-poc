# Task Management Workflow POC

## Purpose

This repository is an experiment in AI-assisted software development. It contains a custom workflow CLI that orchestrates development using Claude Code internally, and a Task Management application built entirely through that workflow.

## Architecture

1. **`workflow/`** — Specifications for the development workflow CLI and its commands.
2. **Generated project** — A full-stack Task Management app produced by the workflow.

## Execution Engine

All workflow commands use **Claude Code** as the agentic execution engine. The workflow CLI orchestrates the pipeline — reading specs, invoking Claude Code for generation and analysis, running tests via shell, and managing file operations. No manual code editing occurs; all code originates from Claude Code interpreting specs.

## Target Project Tech Stack

- **Frontend**: React
- **Backend**: NestJS
- **Database**: PostgreSQL
- **Frontend Testing**: Playwright
- **Backend Testing**: Jest + Supertest

## Rules

- **All development goes through the workflow.** Do not manually write or edit application source code. The workflow CLI is responsible for invoking Claude Code to generate and update all artifacts.
- **Manual code editing is prohibited.** Changes to the generated project must originate from specs, processed through workflow commands (`init`, `code`, `feature`, `debug`).
- **Follow the workflow specs.** All workflow behavior is defined in `workflow/specs/`. Read and follow these specifications when implementing or running workflow commands.

## Workflow Commands

| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `workflow init`    | Generate derived specs from the core spec        |
| `workflow code`    | Generate source code and tests from derived specs |
| `workflow feature` | Add features through the full spec-to-code pipeline |
| `workflow debug`   | Analyze errors, apply fixes, re-run tests        |

## Development Loop

```
specs/core-spec/*.md → workflow init → specs/derived-spec/ → workflow code → backend/ + frontend/
                                                       workflow feature → iterative additions
                                                       workflow debug   → fix and verify
```
