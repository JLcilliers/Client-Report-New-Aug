#!/usr/bin/env node

/**
 * MCP Server Connection Test Script
 * Tests all MCP servers to identify connection issues
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load MCP configurations
const mcpConfig = JSON.parse(readFileSync(path.join(__dirname, '.mcp.json'), 'utf8'));
const claudeConfig = JSON.parse(readFileSync(path.join(__dirname, 'claude_mcp_config.json'), 'utf8'));



// Test function for MCP servers
async function testMcpServer(name, config) {
  
  
  : 'none'}`);
  .join(', ') || 'none'}`);
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      `);
      resolve({ name, status: 'TIMEOUT', error: 'Server did not respond within 5 seconds' });
    }, 5000);
    
    try {
      const child = spawn(config.command, config.args || [], {
        env: { ...process.env, ...(config.env || {}) },
        cwd: config.cwd || __dirname,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('error', (error) => {
        clearTimeout(timeout);
        
        resolve({ name, status: 'ERROR', error: error.message, stderr });
      });
      
      child.on('exit', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          
          resolve({ name, status: 'OK', stdout, stderr });
        } else {
          
          resolve({ name, status: 'EXIT_ERROR', code, stdout, stderr });
        }
      });
      
      // Send a simple test message to check if server responds
      setTimeout(() => {
        if (child.stdin.writable) {
          child.kill('SIGTERM');
        }
      }, 2000);
      
    } catch (error) {
      clearTimeout(timeout);
      
      resolve({ name, status: 'EXCEPTION', error: error.message });
    }
  });
}

// Main test function
async function runTests() {
  const results = [];
  
  
  for (const [name, config] of Object.entries(mcpConfig.mcpServers || {})) {
    if (config.type === 'http') {
      
      
      `);
      results.push({ name, status: 'HTTP_SKIP', note: 'HTTP servers require network connection' });
      continue;
    }
    
    const result = await testMcpServer(name, config);
    results.push(result);
  }
  
  
  for (const [name, config] of Object.entries(claudeConfig.mcpServers || {})) {
    if (results.find(r => r.name === name)) {
      `);
      continue;
    }
    
    const result = await testMcpServer(name, config);
    results.push(result);
  }
  
  // Print summary
  
  
  
  const successful = results.filter(r => r.status === 'OK').length;
  const failed = results.filter(r => r.status !== 'OK' && r.status !== 'HTTP_SKIP').length;
  const skipped = results.filter(r => r.status === 'HTTP_SKIP').length;
  
  
  
  : ${skipped}`);
  
  if (failed > 0) {
    
    results.filter(r => r.status !== 'OK' && r.status !== 'HTTP_SKIP')
      .forEach(r => {
        
        if (r.stderr) {
          }`);
        }
      });
  }
  
  
  
  const timeouts = results.filter(r => r.status === 'TIMEOUT');
  if (timeouts.length > 0) {
    
    
    
    
  }
  
  const missingCommands = results.filter(r => r.status === 'ERROR' && r.error.includes('ENOENT'));
  if (missingCommands.length > 0) {
    
    missingCommands.forEach(r => {
      
    });
  }
  
  const zenServer = results.find(r => r.name === 'zen');
  if (zenServer && zenServer.status !== 'OK') {
    
  }
  
  
  
  
  
  
}

// Check environment variables
function checkEnvironment() {
  
  const requiredVars = [
    'GOOGLE_PSI_API_KEY',
    'GOOGLE_CRUX_API_KEY',
    'GITHUB_PERSONAL_ACCESS_TOKEN',
    'CONTEXT7_API_KEY'
  ];
  
  const missing = [];
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      
    }
  });
  
  if (missing.length > 0) {
    
    missing.forEach(varName => );
  }
  
  
}

// Run the tests
checkEnvironment();
runTests().catch(console.error);
