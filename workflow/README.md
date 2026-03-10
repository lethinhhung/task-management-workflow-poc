# Workflow CLI

A spec-driven development CLI that orchestrates a full-stack project pipeline using **Claude Code** as its execution engine.

## Install

```bash
cd workflow
npm install
npm run build
npm link
```

## Commands

### `workflow init [--force]`

Generates derived specs from core specs.

```bash
workflow init           # fails if specs/derived-spec/ exists
workflow init --force   # overwrites existing derived specs
```

**Input**: `specs/core-spec/*.md`
**Output**: `specs/derived-spec/{architecture,implementation,tests}.md`

### `workflow code [--force]`

Generates project source code, tests, and config from derived specs.

```bash
workflow code           # fails if backend/ or frontend/ exist
workflow code --force   # overwrites existing project
```

**Input**: `specs/derived-spec/*.md`
**Output**: `backend/`, `frontend/`, `docker-compose.yml`

### `workflow feature`

Adds new features through the full spec-to-code pipeline.

```bash
workflow feature
```

**Input**: `specs/new-features/*.md`
**Pipeline**: feature request → feature spec → regenerate derived specs → regenerate code → run tests → archive request

### `workflow debug "<error>"`

Analyzes errors, applies fixes, and re-runs tests (up to 3 attempts).

```bash
workflow debug "TypeError: createTask is not a function"
```

## Development Loop

```
specs/core-spec/*.md
       ↓ workflow init
specs/derived-spec/
       ↓ workflow code
backend/ + frontend/ + docker-compose.yml
       ↓ workflow feature
specs/new-features/*.md → iterative additions
       ↓ workflow debug
error analysis → fix → verify
```

## Project Structure

```
workflow/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/
│   │   ├── init.ts           # init command
│   │   ├── code.ts           # code command
│   │   ├── feature.ts        # feature command
│   │   └── debug.ts          # debug command
│   ├── claude/
│   │   └── client.ts         # Claude Code subprocess invocation
│   └── utils/
│       ├── files.ts          # File I/O utilities
│       └── logger.ts         # Console logger (→, ✓, ✗)
├── specs/                    # Workflow spec definitions
├── package.json
└── tsconfig.json
```
