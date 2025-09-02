# Claude Code + VS Code Integration Setup

## Configuration Files Created

### 1. `.vscode/settings.json`
Local workspace settings with Claude Code and MCP integration enabled.

### 2. `claude_mcp_config.json`
MCP server configurations for various tools and integrations.

### 3. `.claude/agents/`
Custom subagents for specialized tasks (debugger, api-designer, backend-developer).

## How to Use

### Starting Claude with MCP Servers

```bash
# With specific MCP configuration
claude --mcp-config claude_mcp_config.json

# With IDE integration
claude --ide

# With verbose debugging
claude --verbose --debug mcp
```

### VS Code Integration Features

1. **Auto-discovery of MCP servers**: `"chat.mcp.discovery.enabled": true`
2. **Chat agents enabled**: `"chat.agent.enabled": true`
3. **Support for 128+ tools**: `"github.copilot.chat.virtualTools.threshold": true`

### Available MCP Servers

1. **IDE Server**: Direct VS Code integration
   - Get diagnostics
   - Execute code in notebooks
   - Access editor state

2. **Filesystem Server**: Enhanced file operations
   - Advanced file manipulation
   - Directory operations

3. **GitHub Server**: GitHub API integration
   - Repository management
   - Issues and PRs
   - (Requires GitHub token)

4. **Memory Server**: Persistent memory across sessions
   - Store context
   - Recall previous interactions

5. **Puppeteer Server**: Browser automation
   - Web scraping
   - UI testing
   - Screenshot capture

6. **Postgres Server**: Database operations
   - Direct SQL queries
   - Schema management

### Using MCP Tools in Claude

Once started with MCP config, you'll have access to additional tools:

```bash
# Example commands after starting Claude with MCP
"Get all TypeScript errors in the project"
"Open a browser and test the login page"
"Query the database for all reports"
"Remember this API key for later: xyz123"
```

### VS Code Commands

Access Claude Code features through VS Code Command Palette (Ctrl+Shift+P):
- `Claude: Start Chat`
- `Claude: Configure MCP Servers`
- `Claude: View Active Tools`

### Troubleshooting

1. **MCP Server Not Starting**
   ```bash
   # Check if npx works
   npx --version
   
   # Install globally if needed
   npm install -g @anthropic/mcp-server-ide
   ```

2. **IDE Integration Issues**
   ```bash
   # Ensure VS Code CLI is available
   code --version
   
   # Start with debug mode
   claude --debug mcp --ide
   ```

3. **Tool Discovery Issues**
   ```bash
   # List available tools
   claude --mcp-config claude_mcp_config.json --print "List all available tools"
   ```

## Quick Start Commands

```bash
# Standard Claude with project MCP servers
claude --mcp-config claude_mcp_config.json

# Claude with IDE integration only
claude --ide

# Claude with specific allowed tools
claude --allowed-tools "Read Write Edit Bash mcp__ide__*"

# Non-interactive mode with MCP
claude --print --mcp-config claude_mcp_config.json "Your prompt here"
```

## Environment Variables (Optional)

Add to your `.env` file for persistent configuration:
```env
CLAUDE_MCP_CONFIG=./claude_mcp_config.json
CLAUDE_IDE_AUTO_CONNECT=true
CLAUDE_VERBOSE=true
```