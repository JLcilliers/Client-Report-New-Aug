@echo off
REM Fix MCP Connection Issues Script
REM This script addresses common MCP server connection problems

echo === MCP Connection Fix Script ===
echo.

REM 1. Kill any hanging Node.js and Python processes
echo 1. Cleaning up hanging processes...
taskkill /F /IM node.exe 2>NUL
taskkill /F /IM python.exe 2>NUL
echo Done.
echo.

REM 2. Set up environment PATH
echo 2. Setting up environment...
set PATH=%PATH%;C:\Program Files\nodejs;C:\Python313
echo Node.js and Python added to PATH
echo.

REM 3. Install missing MCP packages
echo 3. Installing missing MCP packages...
npm install -g @modelcontextprotocol/server-brave-search
npm install -g @anthropic/mcp-server-ide
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-memory
npm install -g @hisma/server-puppeteer
npm install -g @context7/mcp-server
npm install -g @modelcontextprotocol/server-postgres
npm install -g mcp-reddit-server
echo MCP packages installed.
echo.

REM 4. Test the fixed servers
echo 4. Testing fixed MCP servers...
node test-mcp-servers.js
echo.

echo === MCP Connection Fix Complete ===
echo.
echo Next steps:
echo 1. Restart Claude Desktop
echo 2. Check that MCP servers are now connecting
echo 3. If issues persist, check the logs in zen-mcp-server/logs/
echo.
pause