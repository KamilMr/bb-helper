# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (uses tsx with hot reload)
pnpm bb <command>              # Run CLI in development mode
pnpm dev <command>             # Watch mode with auto-reload

# Build
pnpm build                     # Compile TypeScript to ./build/

# Type check
pnpm tsc --noEmit              # Check types without emitting

# After build, run globally
bb <command>                   # If linked: pnpm link --global
```

## Architecture

**Bitbucket CLI built with Pastel (React/Ink framework) for terminal UI.**

### Stack
- **Pastel**: CLI framework based on Ink (React for terminals)
- **Ink + @inkjs/ui**: Terminal UI components (Box, Text, Spinner, Select, etc.)
- **Zod**: Options/arguments parsing and validation

### Structure
```
source/
├── cli.tsx              # Entry point - Pastel app initialization
├── commands/            # Each file = CLI command (file-based routing)
│   ├── me.tsx           # bb me
│   ├── workspaces.tsx   # bb workspaces
│   ├── repos.tsx        # bb repos <workspace>
│   └── repo/
│       ├── create.tsx   # bb repo create
│       └── delete.tsx   # bb repo delete
├── services/
│   └── bitbucket.ts     # API client (uses curl via child_process)
├── hooks/
│   └── useApi.ts        # React hook for async API calls
├── components/          # Shared UI components
│   ├── Layout.tsx       # Page wrapper with title
│   ├── LoadingState.tsx # Spinner with label
│   ├── Table.tsx        # Generic table component
│   └── JsonOutput.tsx   # Machine-readable output mode
└── types/
    └── api.ts           # Bitbucket API types (User, Workspace, Repository, etc.)
```

### Command Pattern
Commands export:
- `options` - Zod schema for CLI flags (optional)
- `args` - Zod tuple for positional arguments (optional)
- `default` - React component receiving `{options, args}`

All commands support `--json` flag for machine-readable output (for agents/scripts).

### Dual Output Mode
Commands render either:
1. **Interactive UI** (default): Ink components with colors, spinners, tables
2. **JSON mode** (`--json`): Raw JSON output via `<JsonOutput>` component

### Environment
Requires `.env` with:
```
BB_EMAIL=your-email@example.com
BB_TOKEN=your-api-token
```
