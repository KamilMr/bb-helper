# BB Scripts

Internal Bitbucket Cloud CLI helper for routine repository, project, and pull-request work. It provides an interactive terminal UI for people and JSON output for scripts and agents.

## Quick Start

```bash
pnpm install
cp .env.example .env
```

Set your credentials in `.env`:

```dotenv
BB_EMAIL=your-email@example.com
BB_TOKEN=your-api-token
```

Then run:

```bash
pnpm bb --help
pnpm bb me
pnpm bb workspaces
```

## Common Commands

```bash
pnpm bb repos <workspace>
pnpm bb pr list <workspace> <repo>
pnpm bb pr view <workspace> <repo> <id>
pnpm bb pr create
pnpm bb pr merge <workspace> <repo> <id>
```

Add `--json` for machine-readable output:

```bash
pnpm bb pr list <workspace> <repo> --json
```

## Global Use

```bash
pnpm build
pnpm link --global

export BB_EMAIL="you@example.com"
export BB_TOKEN="your-token"
bb me
```

The global command does not load the project `.env`; export both credentials first.

## Current Constraints

- This is an internal helper, not a complete replacement for Bitbucket's web interface.
- Workspace, repository, and comment listings currently return only the first API page.
- `repo delete --json` requires `--force` to complete.
- API requests currently have no timeout or retry policy.

## Development

```bash
pnpm dev <command>
pnpm build
pnpm test
```

See [`docs/README.md`](docs/README.md) for the full command reference, known limitations, and stability plan.
