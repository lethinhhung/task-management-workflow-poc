# Command: `workflow init`

## Purpose

Generate derived specs from the core spec. This bootstraps the project by producing structured specification files that downstream commands (`code`, `feature`, `debug`) consume.

## Input

- `specs/core-spec/` — the source of truth directory containing project requirement files (`*.md`).

## Flow

1. Read all `*.md` files from `specs/core-spec/`.
2. Parse project name, goal, requirements, and testing sections.
3. Generate derived spec files at `specs/derived-spec/`.
4. Done.

## Behavior

1. Read all `*.md` files from `specs/core-spec/`.
2. Parse project name, goal, requirements, and testing sections.
3. Generate `specs/derived-spec/architecture.md` — high-level architecture and module breakdown.
4. Generate `specs/derived-spec/implementation.md` — implementation plan with steps and dependencies.
5. Generate `specs/derived-spec/tests.md` — test cases derived from the requirements.
6. Print a summary of generated files to stdout.

## Proposed Solutions

Propose 3 solutions for implementing this command. For each solution, provide a brief description, pros, and cons. Create a separate workspace to run it separately with naming: `workspace/{index}-{command}-{short-description}-{timestamp}`.

## Error Handling

- Exit with error if `specs/core-spec/` does not exist.
- Exit with error if `specs/derived-spec/` already exists (use `--force` to overwrite).

## Example

```
$ workflow init
✓ Read specs/core-spec/
✓ Generated specs/derived-spec/architecture.md
✓ Generated specs/derived-spec/implementation.md
✓ Generated specs/derived-spec/tests.md
Init complete — 3 files generated.
```
