# Claude Code CLI - Real Commands Reference

## Basic Usage
```bash
# Start interactive session
claude

# Print mode (non-interactive)
claude -p "Your prompt here"

# Continue last conversation
claude -c
claude --continue

# Resume specific session
claude -r
claude --resume [sessionId]
```

## Permission Modes
```bash
# Skip all permission prompts (use with caution)
claude --dangerously-skip-permissions

# Plan mode (review before executing)
claude --permission-mode plan

# Accept all edits automatically
claude --permission-mode acceptEdits

# Bypass permissions
claude --permission-mode bypassPermissions
```

## Debugging & Verbose Output
```bash
# Debug mode with all categories
claude --debug

# Debug specific categories
claude --debug api,hooks
claude --debug "!statsig,!file"  # Exclude categories

# MCP debugging (deprecated, use --debug instead)
claude --mcp-debug

# Verbose mode
claude --verbose
```

## Output Formats (with --print)
```bash
# Standard text output
claude -p "Fix this bug" --output-format text

# JSON output (single result)
claude -p "Analyze code" --output-format json

# Streaming JSON (real-time)
claude -p "Refactor this" --output-format stream-json
```

## MCP Configuration
```bash
# Load MCP servers from config
claude --mcp-config claude_mcp_config.json

# Multiple MCP configs
claude --mcp-config config1.json config2.json

# Strict MCP (only use specified configs)
claude --strict-mcp-config --mcp-config myconfig.json

# Auto-connect to IDE
claude --ide
```

## Tool Management
```bash
# Allow specific tools
claude --allowed-tools "Read Write Edit Bash"
claude --allowed-tools "Bash(git:*) Edit"

# Disallow specific tools
claude --disallowed-tools "Bash(rm:*) Write"
```

## Model Selection
```bash
# Use specific model
claude --model sonnet
claude --model opus
claude --model "claude-sonnet-4-20250514"

# With fallback model
claude -p "Task" --model opus --fallback-model sonnet
```

## Advanced Options
```bash
# Add directories for tool access
claude --add-dir /path/to/dir1 /path/to/dir2

# Custom system prompt
claude --append-system-prompt "Always use TypeScript"

# Custom settings file
claude --settings ./my-settings.json

# Specific session ID
claude --session-id "550e8400-e29b-41d4-a716-446655440000"
```

## Configuration Management
```bash
# Set global config
claude config set -g theme dark
claude config set -g model opus

# View config
claude config get theme
```

## MCP Server Management
```bash
# Configure MCP servers
claude mcp

# List MCP servers
claude mcp list

# Add MCP server
claude mcp add servername
```

## Updates & Maintenance
```bash
# Check Claude Code health
claude doctor

# Check for updates
claude update

# Install specific version
claude install stable
claude install latest
claude install 1.2.3
```

## Common Workflows

### Uninterrupted Coding Session
```bash
claude --dangerously-skip-permissions --verbose
```

### Automated Script Execution
```bash
claude -p "Fix all linting errors" --dangerously-skip-permissions --output-format json
```

### Debugging Session with MCP
```bash
claude --debug mcp --mcp-config claude_mcp_config.json
```

### Plan Before Execute
```bash
claude --permission-mode plan
```

## Important Notes

1. **There is NO --agent flag** - Use natural language to request specific expertise
2. **MCP servers** provide additional tools when configured
3. **Permission modes** control how Claude interacts with your system
4. **Debug mode** helps troubleshoot issues with MCP and API calls
5. **Print mode (-p)** is for non-interactive, scriptable usage

## Getting Help
```bash
# Show help
claude --help
claude -h

# Show version
claude --version
claude -v
```