# SpacetimeDB MCP Server

Universal MCP server providing Convex-level developer experience for SpacetimeDB projects. Works with any SpacetimeDB repo without modification.

## Features

- **Workspace Intelligence**: Auto-detect project structure, find modules and bindings
- **CLI Operator**: Wrap `spacetime` commands (start, publish, generate, logs)
- **Debug Intelligence**: Parse panics, explain errors, check server health
- **Build Tools**: Run `cargo check` and `cargo test`
- **Schema Extraction**: Extract tables, reducers, views from source
- **Bindings Inspection**: Inspect generated client bindings
- **Capability Detection**: Check if runtime reducer invocation is possible

## Installation

### From GitHub (recommended)
```bash
npx github:karutoil/SpacetimeMCP
```

### From source
```bash
git clone https://github.com/karutoil/SpacetimeMCP.git
cd SpacetimeMCP
npm install && npm run build
node dist/index.js
```

### Using npm link (for global use)
```bash
git clone https://github.com/karutoil/SpacetimeMCP.git
cd SpacetimeMCP
npm install && npm run build
npm link
spacetimedb-mcp
```

## MCP Setup

Use the built-in `mcp add` command for your AI coding assistant:

### Claude Desktop
```bash
# Not supported - use JSON config below
```

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "spacetimedb": {
      "command": "npx",
      "args": ["github:karutoil/SpacetimeMCP"],
      "env": { "STDB_PROJECT_ROOT": "/path/to/project" }
    }
  }
}
```

### Cursor
```bash
Cursor > Settings > MCP > Add new server
```
Or edit `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "spacetimedb": {
      "command": "npx",
      "args": ["github:karutoil/SpacetimeMCP"],
      "env": { "STDB_PROJECT_ROOT": "${workspaceFolder}" }
    }
  }
}
```

### Cline (formerly Claude Dev)
```bash
cline mcp add
```
Then enter:
- Name: `spacetimedb`
- Command: `npx`
- Args: `github:karutoil/SpacetimeMCP`
- Env: `STDB_PROJECT_ROOT=.`

### Claude Code (CLI)
```bash
claude mcp add
```
Then enter the same values as Cline.

### Zed
```bash
zed: extensions > add mcp server
```
Or edit `~/.config/zed/settings.json`.

### Continue (VS Code / JetBrains)
```bash
# Use the VS Code command palette or edit .continue/config.json
```

## Tools

### Workspace Intelligence
- `workspace.summary` - Get project structure overview
- `workspace.search_code` - Search code patterns in Rust files
- `workspace.git_diff_summary` - Show modified files
- `workspace.detect_module_path` - Find module source (lib.rs/main.rs)
- `workspace.detect_bindings_path` - Find generated bindings file

### SpacetimeDB CLI
- `stdb.cli.status` - Check CLI and installed modules
- `stdb.cli.start` - Start SpacetimeDB server
- `stdb.cli.publish` - Publish a module
- `stdb.cli.generate_bindings` - Generate client bindings
- `stdb.cli.logs_tail` - Tail recent log entries
- `stdb.cli.logs_follow` - Get command to stream logs

### Debug Intelligence
- `stdb.debug.last_panic` - Get last panic from logs with suggestions
- `stdb.debug.explain_error` - Explain an error with actionable fixes
- `stdb.debug.server_health` - Check if server is healthy

### Build / Cargo
- `dev.cargo.check` - Run cargo check for compilation errors
- `dev.cargo.test` - Run cargo test

### Project Schema
- `stdb.project.describe` - Extract tables, reducers, views from source
- `stdb.project.agent_context` - Generate knowledge bundle for AI agents

### Client Bindings
- `stdb.bindings.inspect` - Inspect generated bindings (tables, reducers)

### Capabilities
- `stdb.capabilities` - Detect if runtime reducer calling is possible

### Client Runtime (requires STDB_MCP_ALLOW_WRITE=1)
- `stdb.client.connect` - Get connection guidance
- `stdb.client.subscribe` - Get subscription guidance
- `stdb.client.reducer.call` - Get reducer call guidance

## Configuration

### CLI Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--project-root` | Project root directory | Current directory |
| `--module-path` | Path to module source (lib.rs) | Auto-detect |
| `--db-name` | Database name | Auto-detect |
| `--bindings-path` | Path to generated bindings | Auto-detect |
| `--uri` | SpacetimeDB server URI | Auto-detect |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `STDB_PROJECT_ROOT` | Project root directory |
| `STDB_MODULE_PATH` | Path to module source |
| `STDB_DB_NAME` | Database name |
| `STDB_BINDINGS_PATH` | Path to generated bindings |
| `STDB_URI` | Server URI |
| `STDB_MCP_ALLOW_WRITE` | Enable write tools (set to "1") |
| `STDB_MCP_ALLOW_DANGEROUS` | Enable dangerous tools (set to "1") |

## SpacetimeDB Rules

This server follows SpacetimeDB conventions:

1. **Reducers don't return data** - Use tables or subscriptions to read data
2. **IDs are BigInt** - Use `0n` for auto-increment placeholders
3. **Deterministic** - Same input always produces same output
4. **Indexes in OPTIONS** - Not in column definitions
5. **Client bindings** - Generated by `spacetime generate`, never edited manually

## Troubleshooting

### "Module not found"
Run `spacetime generate <path-to-lib.rs>` to create bindings.

### "Database name required"
Set `STDB_PROJECT_ROOT` to your project directory.

### Write tools not working
Set `STDB_MCP_ALLOW_WRITE=1` in environment.

## Testing

```bash
npm run build
npm run smoke
```
