# Prompt: Build the Workflow CLI

You are building a CLI tool called `workflow` that orchestrates a spec-driven development pipeline. It uses **Claude Code** (`claude` CLI) as its execution engine — the workflow CLI handles orchestration, validation, and shell operations, while Claude Code handles spec analysis, code generation, and debugging.

## Before You Start

Read these files — they are the source of truth for everything you need to build:

- `CLAUDE.md` — Project rules
- `workflow/specs/core-spec.md` — Workflow architecture and principles
- `workflow/specs/derived-spec-schema.md` — Schema for derived spec outputs
- `workflow/specs/commands/init.md` — `workflow init` spec
- `workflow/specs/commands/code.md` — `workflow code` spec
- `workflow/specs/commands/feature.md` — `workflow feature` spec
- `workflow/specs/commands/debug.md` — `workflow debug` spec

## What to Build

A TypeScript CLI at `workflow/src/` with four commands. Each command's behavior, inputs, outputs, flow, error handling, and examples are fully defined in its spec file. Implement exactly what those specs describe.

```
workflow init          # See workflow/specs/commands/init.md
workflow code          # See workflow/specs/commands/code.md
workflow feature       # See workflow/specs/commands/feature.md
workflow debug <error> # See workflow/specs/commands/debug.md
```

## Architecture

Every command follows: **Validate** → **Read specs** → **Invoke Claude Code** → **Validate output** → **Post-process** → **Report**.

The CLI invokes Claude Code via `claude -p "<prompt>"` as a subprocess. When invoking, read the relevant spec files from disk and embed their content in the prompt so Claude Code has full context.

## Structure

```
workflow/
├── src/
│   ├── index.ts           # CLI entry point (Commander.js)
│   ├── commands/           # One file per command
│   ├── claude/client.ts    # Claude Code subprocess invocation
│   └── utils/              # File I/O, logger (→, ✓, ✗)
├── package.json
└── tsconfig.json
```

## Rules

1. **Spec files are the source of truth.** Do not invent behavior beyond what the specs describe.
2. **The CLI is project-agnostic orchestration.** It reads specs, invokes Claude Code, runs shell commands, and manages files. It contains no application-specific logic.
3. **Embed spec content in prompts.** Read relevant spec files from disk and include their content when invoking Claude Code.
4. **Keep it simple.** This is a POC.
