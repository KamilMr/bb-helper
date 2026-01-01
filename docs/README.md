# BB Scripts - Bitbucket CLI

A command-line interface for Bitbucket built with React/Ink for terminal UI.

## Installation

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Link globally (optional)
pnpm link --global
```

## Configuration

Create a `.env` file in the project root:

```
BB_EMAIL=your-email@example.com
BB_TOKEN=your-api-token
```

Get your API token from: https://bitbucket.org/account/settings/app-passwords/

## Usage

```bash
# Development mode
pnpm bb <command>

# After global link
bb <command>
```

All commands support `--json` flag for machine-readable output (useful for scripts/agents).

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

# Create PR
bb pr create                      # Interactive mode
bb pr create -w <workspace> -r <repo> -s <source-branch> -d <dest-branch> -t "Title"
bb pr create --description="PR description" --close-source
```

#### PR Create Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--workspace` | `-w` | Workspace slug |
| `--repo` | `-r` | Repository slug |
| `--source` | `-s` | Source branch |
| `--dest` | `-d` | Destination branch |
| `--title` | `-t` | PR title |
| `--description` | | PR description |
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
