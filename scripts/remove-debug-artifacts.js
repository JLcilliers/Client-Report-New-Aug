import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';
import { join } from 'path';

/**
 * Remove console.log, alert(), and debugger statements from code
 * Preserves code structure and handles multi-line statements
 */

const projectRoot = process.cwd();

// Find all TypeScript/JavaScript files
const files = globSync('**/*.{ts,tsx,js,jsx}', {
  cwd: projectRoot,
  ignore: [
    'node_modules/**',
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'scripts/**', // Don't modify scripts
    '**/*.config.js',
    '**/*.config.ts',
  ],
  absolute: true,
});

console.log(`Found ${files.length} files to process...`);

let totalRemoved = 0;
let filesModified = 0;

files.forEach((filePath) => {
  try {
    let content = readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let removedCount = 0;

    // Remove console.log statements (including multi-line)
    // Matches: console.log(...) including nested parentheses
    content = content.replace(/console\.log\s*\([^)]*(?:\([^)]*\)[^)]*)*\)\s*;?/g, () => {
      removedCount++;
      return '';
    });

    // Remove console.error, console.warn, console.debug (optional - comment out if needed)
    content = content.replace(/console\.(error|warn|debug)\s*\([^)]*(?:\([^)]*\)[^)]*)*\)\s*;?/g, () => {
      removedCount++;
      return '';
    });

    // Remove alert() statements
    content = content.replace(/\balert\s*\([^)]*(?:\([^)]*\)[^)]*)*\)\s*;?/g, () => {
      removedCount++;
      return '';
    });

    // Remove standalone debugger statements
    content = content.replace(/^\s*debugger\s*;?\s*$/gm, () => {
      removedCount++;
      return '';
    });

    // Clean up excessive blank lines (more than 2 consecutive)
    content = content.replace(/\n{3,}/g, '\n\n');

    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf-8');
      filesModified++;
      totalRemoved += removedCount;
      console.log(`✓ ${filePath.replace(projectRoot, '.')}: removed ${removedCount} debug statements`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n✓ Complete! Modified ${filesModified} files, removed ${totalRemoved} debug statements.`);
