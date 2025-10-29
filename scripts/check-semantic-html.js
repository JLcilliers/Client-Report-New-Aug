import { readFileSync } from 'fs';
import { globSync } from 'glob';

/**
 * Check for semantic HTML violations in Next.js application
 * Scans for <div> and <span> elements with onClick handlers
 * These should be <button> elements for proper accessibility
 */

const projectRoot = process.cwd();

// Find all TSX/JSX files
const files = globSync('**/*.{tsx,jsx}', {
  cwd: projectRoot,
  ignore: [
    'node_modules/**',
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'scripts/**',
  ],
  absolute: true,
});

console.log(`Scanning ${files.length} files for semantic HTML violations...\n`);

const violations = [];
const validInteractions = [];

// Regex patterns for interactive div/span elements
const divOnClickPattern = /<div[^>]*\s+onClick\s*=\s*[{]/gi;
const spanOnClickPattern = /<span[^>]*\s+onClick\s*=\s*[{]/gi;

// Helper to check if element has role="button"
function hasButtonRole(elementText) {
  return /role\s*=\s*["']button["']/i.test(elementText);
}

// Helper to extract element preview
function getElementPreview(fullTag) {
  return fullTag.substring(0, 100) + (fullTag.length > 100 ? '...' : '');
}

// Process each file
files.forEach((filePath) => {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const relPath = filePath.replace(projectRoot, '.');

    // Find div elements with onClick
    let match;
    const divRegex = new RegExp(divOnClickPattern);
    while ((match = divRegex.exec(content)) !== null) {
      const startIndex = match.index;
      const endIndex = content.indexOf('>', startIndex) + 1;
      const fullTag = content.substring(startIndex, endIndex);
      const lineNumber = content.substring(0, startIndex).split('\n').length;

      // Check if it has proper ARIA role
      if (hasButtonRole(fullTag)) {
        validInteractions.push({ file: relPath, type: 'div with role="button"' });
      } else {
        violations.push({
          file: relPath,
          line: lineNumber,
          type: '<div>',
          tag: getElementPreview(fullTag),
          recommendation: 'Replace with <button> element or add role="button" and appropriate keyboard handlers'
        });
      }
    }

    // Find span elements with onClick
    const spanRegex = new RegExp(spanOnClickPattern);
    while ((match = spanRegex.exec(content)) !== null) {
      const startIndex = match.index;
      const endIndex = content.indexOf('>', startIndex) + 1;
      const fullTag = content.substring(startIndex, endIndex);
      const lineNumber = content.substring(0, startIndex).split('\n').length;

      // Check if it has proper ARIA role
      if (hasButtonRole(fullTag)) {
        validInteractions.push({ file: relPath, type: 'span with role="button"' });
      } else {
        violations.push({
          file: relPath,
          line: lineNumber,
          type: '<span>',
          tag: getElementPreview(fullTag),
          recommendation: 'Replace with <button> element or add role="button" and appropriate keyboard handlers'
        });
      }
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

// Report results
console.log(`✓ Scanned ${files.length} files`);
console.log(`✓ Found ${validInteractions.length} properly accessible interactive elements`);

if (violations.length > 0) {
  console.log(`\n⚠ Found ${violations.length} semantic HTML violations:\n`);
  violations.forEach(violation => {
    console.log(`${violation.file}:${violation.line}`);
    console.log(`  Type: ${violation.type} with onClick`);
    console.log(`  Tag: ${violation.tag}`);
    console.log(`  Fix: ${violation.recommendation}`);
    console.log('');
  });
} else {
  console.log('\n✓ No semantic HTML violations found!');
}

// Summary
console.log('\n=== SUMMARY ===');
console.log(`Total interactive elements scanned: ${validInteractions.length + violations.length}`);
console.log(`Properly accessible elements: ${validInteractions.length}`);
console.log(`Semantic violations (div/span with onClick): ${violations.length}`);
console.log(`\nAccessibility compliance: ${violations.length === 0 ? '✓ PASS' : '✗ FAIL'}`);

if (violations.length > 0) {
  console.log('\n⚠ WCAG 2.1 Requirement:');
  console.log('Interactive elements must be keyboard accessible and properly labeled.');
  console.log('Use semantic <button> elements or add role="button" with onKeyDown handlers.');
}
