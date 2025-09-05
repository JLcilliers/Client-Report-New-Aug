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

console.log('🔍 Testing MCP Server Connections...\n');

// Test function for MCP servers
async function testMcpServer(name, config) {
  console.log(`\n📡 Testing ${name} server...`);
  console.log(`Command: ${config.command}`);
  console.log(`Args: ${config.args ? config.args.join(' ') : 'none'}`);
  console.log(`Environment: ${Object.keys(config.env || {}).join(', ') || 'none'}`);
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log(`❌ ${name}: TIMEOUT (server may be hanging)`);
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
        console.log(`❌ ${name}: ERROR - ${error.message}`);
        resolve({ name, status: 'ERROR', error: error.message, stderr });
      });
      
      child.on('exit', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          console.log(`✅ ${name}: OK`);
          resolve({ name, status: 'OK', stdout, stderr });
        } else {
          console.log(`❌ ${name}: EXIT CODE ${code}`);
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
      console.log(`❌ ${name}: EXCEPTION - ${error.message}`);
      resolve({ name, status: 'EXCEPTION', error: error.message });
    }
  });
}

// Main test function
async function runTests() {
  const results = [];
  
  console.log('Testing servers from .mcp.json...');
  for (const [name, config] of Object.entries(mcpConfig.mcpServers || {})) {
    if (config.type === 'http') {
      console.log(`\n🌐 Testing HTTP server: ${name}`);
      console.log(`URL: ${config.url}`);
      console.log(`✅ ${name}: HTTP servers cannot be tested locally (require network connection)`);
      results.push({ name, status: 'HTTP_SKIP', note: 'HTTP servers require network connection' });
      continue;
    }
    
    const result = await testMcpServer(name, config);
    results.push(result);
  }
  
  console.log('\n\nTesting servers from claude_mcp_config.json...');
  for (const [name, config] of Object.entries(claudeConfig.mcpServers || {})) {
    if (results.find(r => r.name === name)) {
      console.log(`\n⚠️ Skipping ${name} (already tested)`);
      continue;
    }
    
    const result = await testMcpServer(name, config);
    results.push(result);
  }
  
  // Print summary
  console.log('\n\n📊 Test Results Summary:');
  console.log('========================');
  
  const successful = results.filter(r => r.status === 'OK').length;
  const failed = results.filter(r => r.status !== 'OK' && r.status !== 'HTTP_SKIP').length;
  const skipped = results.filter(r => r.status === 'HTTP_SKIP').length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️ Skipped (HTTP): ${skipped}`);
  
  if (failed > 0) {
    console.log('\n🔧 Issues Found:');
    results.filter(r => r.status !== 'OK' && r.status !== 'HTTP_SKIP')
      .forEach(r => {
        console.log(`- ${r.name}: ${r.status} - ${r.error || 'Unknown error'}`);
        if (r.stderr) {
          console.log(`  stderr: ${r.stderr.trim()}`);
        }
      });
  }
  
  console.log('\n💡 Recommendations:');
  
  const timeouts = results.filter(r => r.status === 'TIMEOUT');
  if (timeouts.length > 0) {
    console.log('- TIMEOUT issues detected: MCP servers may be hanging on startup');
    console.log('  - This usually indicates missing dependencies or environment variables');
    console.log('  - Check that all required packages are installed');
    console.log('  - Verify API keys are set correctly');
  }
  
  const missingCommands = results.filter(r => r.status === 'ERROR' && r.error.includes('ENOENT'));
  if (missingCommands.length > 0) {
    console.log('- Missing commands detected:');
    missingCommands.forEach(r => {
      console.log(`  - Install missing dependency for ${r.name}`);
    });
  }
  
  const zenServer = results.find(r => r.name === 'zen');
  if (zenServer && zenServer.status !== 'OK') {
    console.log('- Zen MCP server issues: Check Python environment and dependencies');
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Fix failed servers based on error messages above');
  console.log('2. Ensure all environment variables are set in .env files');
  console.log('3. Kill any hanging Node.js/Python processes if needed');
  console.log('4. Restart Claude Desktop to reconnect to MCP servers');
}

// Check environment variables
function checkEnvironment() {
  console.log('🔍 Checking Environment Variables...');
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
      console.log(`✅ ${varName}: Set`);
    }
  });
  
  if (missing.length > 0) {
    console.log('\n❌ Missing environment variables:');
    missing.forEach(varName => console.log(`- ${varName}`));
  }
  
  console.log('');
}

// Run the tests
checkEnvironment();
runTests().catch(console.error);
