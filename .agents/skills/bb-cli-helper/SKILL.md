---
name: bb-cli-helper
description: Operate this repository's internal Bitbucket Cloud CLI safely. Use when listing workspaces, repositories, pull requests, or comments; creating or reviewing pull requests; managing approvals, change requests, comments, merges, projects, or repositories; or validating an existing bb command.
compatibility: Requires Node.js, pnpm, Bitbucket network access, and BB_EMAIL and BB_TOKEN credentials.
---

# BB CLI Helper

Use the CLI from the repository root. Read `../../../docs/README.md` when a command or option is not covered here.

## Operating Rules

1. Use `pnpm bb` for repository-local execution.
2. Use `--json` for agent-driven commands. Parse the result and check the exit status before reporting success.
3. Never print, read back, or expose `BB_TOKEN` or the contents of `.env`.
4. Start with read-only commands when identifiers or current state are uncertain.
5. Before a mutation, state the exact workspace, repository, pull-request ID, comment ID, and action. Proceed only when the user's request authorizes that exact target.
6. Never retry a mutation automatically. The API may have completed it even if the response was interrupted.

## Setup

For local development usage:

```bash
pnpm install
cp .env.example .env
```

The user must set `BB_EMAIL` and `BB_TOKEN` in `.env`. `pnpm bb` loads that file automatically. A globally linked `bb` command requires both variables to be exported in its environment.

Do not create, overwrite, or display `.env` unless the user explicitly asks.

## Read-Only Commands

```bash
pnpm bb me --json
pnpm bb workspaces --json
pnpm bb repos <workspace> --json
pnpm bb pr list <workspace> <repo> --state=OPEN --json
pnpm bb pr view <workspace> <repo> <id> --json
pnpm bb pr comment list <workspace> <repo> <id> --json
```

If a workspace, repository slug, or pull-request ID is missing, discover it with these commands instead of guessing.

## Mutations

Use complete, non-interactive arguments:

```bash
pnpm bb repo create -w <workspace> -n <name> --json
pnpm bb project create -w <workspace> -n <name> -k <key> --json
pnpm bb pr create -w <workspace> -r <repo> -s <source> -d <destination> -t <title> --json
pnpm bb pr approve <workspace> <repo> <id> --json
pnpm bb pr unapprove <workspace> <repo> <id> --json
pnpm bb pr request-changes <workspace> <repo> <id> --json
pnpm bb pr remove-change-request <workspace> <repo> <id> --json
pnpm bb pr comment add <workspace> <repo> <id> --content=<text> --json
```

Quote user-provided text and identifiers so the shell does not split or expand them.

### Merge

Fetch and show the pull request first. A non-interactive merge requires an exact repeated ID:

```bash
pnpm bb pr view <workspace> <repo> <id> --json
pnpm bb pr merge <workspace> <repo> <id> --confirm-id=<id> --json
```

Do not merge when the confirmation differs, the target changed, or the pull request cannot be inspected.

### Destructive Commands

Declining pull requests and deleting comments execute immediately. Repository deletion requires `--force` in JSON mode and bypasses the prompt:

```bash
pnpm bb pr decline <workspace> <repo> <id> --json
pnpm bb pr comment delete <workspace> <repo> <id> <comment-id> --json
pnpm bb repo delete <workspace> <repo> --force --json
```

Run these only after explicit authorization for the exact target.

## Known Constraints

- Workspace, repository, and comment listings currently return only the first API page.
- API requests currently have no timeout or retry policy.
- Some interactive failures return status `0`; prefer JSON mode for automation.
- The CLI supports only the operations documented in `../../../docs/README.md`.

## Development Validation

After changing the CLI, run:

```bash
pnpm build
pnpm test
```

Do not report completion unless both commands pass. If pnpm is unavailable, report that environment problem rather than silently changing package managers.
