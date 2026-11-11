# BB Scripts — Internal Bitbucket CLI Helper

An internal command-line helper for common Bitbucket Cloud workflows. It provides an interactive terminal UI for people and JSON output for scripts and agents.

The tool is intentionally focused on routine repository, project, and pull-request tasks. It is not intended to replace the full Bitbucket web interface or support every Bitbucket API.

## What It Does

- Shows the authenticated Bitbucket user.
- Lists workspaces, repositories, pull requests, and pull-request comments.
- Creates projects, repositories, and pull requests; deletes repositories.
- Approves, unapproves, declines, and merges pull requests; manages change requests.
- Adds, edits, replies to, and deletes pull-request comments.
- Supports interactive terminal output and machine-readable JSON.

## Known Limitations

- Workspace, repository, and comment listings only return the first API page. Pull-request listings are fully paginated.
- `repo delete --json` does not complete unless `--force` is also supplied.
- Failure handling is inconsistent: some interactive errors exit with status `0`, some selector-loading errors are hidden, and advertised option values are not always validated locally.
- API requests have no timeout, retry policy, or explicit rate-limit handling.
- Runtime configuration and regression coverage are limited: the globally linked CLI does not load `.env` automatically, tests cover only merge confirmation and PR pagination, and no CI quality gate runs them.

## Stability Work

This work only hardens existing behavior; it does not add Bitbucket features.

1. **Make command outcomes deterministic.** Ensure every command terminates, emits exactly one JSON result in JSON mode, returns a non-zero status on failure, and displays loading errors. Cover the repository deletion hang and shared output behavior with tests.
2. **Harden the HTTP client.** Add request timeouts, clearer network and response errors, and bounded retries for safe read requests on rate limits or transient server failures. Never retry mutations automatically.
3. **Complete pagination for existing list commands.** Reuse one pagination helper for workspaces, repositories, pull requests, and comments, with protection against repeated or malformed next-page links.
4. **Validate current inputs and startup configuration.** Restrict documented states and merge strategies to supported values, reject empty identifiers, fail early when credentials are missing, and make development versus globally linked environment loading explicit.
5. **Establish regression gates.** Add service and CLI tests for every command group, success and failure exit codes, JSON output, pagination, timeout behavior, and mutation payloads. Run the build and test suite in CI.

## Quick Start

Install dependencies and create the development environment file:

```bash
pnpm install
cp .env.example .env
```

Set your Bitbucket credentials in `.env`:

```dotenv
BB_EMAIL=your-email@example.com
BB_TOKEN=your-api-token
```

Get an API token from https://bitbucket.org/account/settings/app-passwords/, then run the CLI:

```bash
pnpm bb --help
pnpm bb me
pnpm bb workspaces
```

The `pnpm bb` script loads `.env` automatically.

## Global Use

```bash
pnpm build
pnpm link --global

export BB_EMAIL="you@example.com"
export BB_TOKEN="your-token"
bb me
```

The globally linked `bb` command does not load the project `.env`; credentials must be exported in its environment.

All commands support `--json` for machine-readable output used by scripts and agents.

## Commands

### User

```bash
bb me                     # Show current user info
bb me --json              # JSON output
```

### Workspaces

```bash
bb workspaces             # List all workspaces
bb workspaces --json      # JSON output
```

### Repositories

```bash
bb repos <workspace>              # List repos in workspace
bb repos <workspace> --json       # JSON output

bb repo create                    # Create repo (interactive)
bb repo create -w <workspace> -n <name> --json    # Scripted mode

bb repo delete <workspace> <slug>         # Delete repo (with confirmation)
bb repo delete <workspace> <slug> --force # Skip confirmation
```

### Pull Requests

```bash
# List PRs
bb pr list <workspace> <repo>                 # List open PRs
bb pr list <workspace> <repo> --state=OPEN    # Filter by state
bb pr list <workspace> <repo> --state=MERGED
bb pr list <workspace> <repo> --state=DECLINED
bb pr list <workspace> <repo> --json          # JSON output

# Inspect and create PRs
bb pr view <workspace> <repo> <id>
bb pr create                      # Interactive mode
bb pr create -w <workspace> -r <repo> -s <source-branch> -d <dest-branch> -t "Title"
bb pr create --description="PR description" --reviewers="{uuid-1},{uuid-2}" --draft
bb pr create --close-source

# Review actions
bb pr approve <workspace> <repo> <id>
bb pr unapprove <workspace> <repo> <id>
bb pr request-changes <workspace> <repo> <id>
bb pr remove-change-request <workspace> <repo> <id>

# Lifecycle actions
bb pr decline <workspace> <repo> <id>
bb pr merge <workspace> <repo> <id> --strategy=squash --message="Merge PR"  # Shows PR details and asks you to type <id>
bb pr merge <workspace> <repo> <id> --confirm-id=<id> --json              # Scripted/JSON mode

# Comments
bb pr comment list <workspace> <repo> <id>
bb pr comment add <workspace> <repo> <id> --content="Review note"
bb pr comment edit <workspace> <repo> <id> <comment-id> --content="Updated note"
bb pr comment reply <workspace> <repo> <id> <parent-id> --content="Reply"
bb pr comment delete <workspace> <repo> <id> <comment-id>
```

All PR commands accept `--json`. Most mutation commands execute immediately, so verify IDs before running decline or comment deletion.

Every merge requires exact PR-ID confirmation. Interactive mode fetches and displays the PR title, author, state, branches, and URL, then asks you to type the positional ID. JSON and other non-interactive uses must pass the same value explicitly with `--confirm-id=<id>`. Missing or mismatched confirmation, including extra whitespace or leading zeroes, exits with an error without merging.

#### PR Merge Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--confirm-id` | | Exact positional PR ID; required in JSON/non-interactive mode |
| `--strategy` | | Merge strategy (`merge_commit`, `squash`, or `fast_forward`) |
| `--message` | `-m` | Merge commit message |
| `--close-source` | | Close the source branch |
| `--json` | | JSON output mode |

#### PR Create Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--workspace` | `-w` | Workspace slug |
| `--repo` | `-r` | Repository slug |
| `--source` | `-s` | Source branch |
| `--dest` | `-d` | Destination branch |
| `--title` | `-t` | PR title |
| `--description` | | PR description |
| `--reviewers` | | Comma-separated Bitbucket user UUIDs |
| `--draft` | | Create the PR as a draft |
| `--close-source` | | Close source branch on merge |
| `--json` | | JSON output mode |

### Projects

```bash
bb project create                 # Create project (interactive)
bb project create -w <workspace> -n <name> -k <key> --json
```

## Examples

### Create a PR from feature branch to main

```bash
bb pr create -w myteam -r myapp -s feature-login -d main -t "Add login feature"
```

### List all open PRs in a repo

```bash
bb pr list myteam myapp
```

### Get repo list as JSON for scripting

```bash
bb repos myteam --json | jq '.[].slug'
```

## Output Modes

1. **Interactive** (default): Colored terminal UI with spinners, tables, prompts
2. **JSON** (`--json`): Raw JSON output for scripting and automation
