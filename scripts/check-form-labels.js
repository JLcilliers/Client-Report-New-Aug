import { readFileSync } from 'fs';
import { globSync } from 'glob';

/**
 * Check for form label accessibility violations in Next.js application
 * Scans for Input, Textarea, and Select components missing proper label associations
 * WCAG 2.1 Level A requires all form inputs to have associated labels
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

console.log(`Scanning ${files.length} files for form label violations...\n`);

const violations = [];
const validFormElements = [];

// Regex patterns for form elements
const inputPattern = /<Input\s+([^>\/]*)(\/?>)/gi;
const textareaPattern = /<Textarea\s+([^>\/]*)(\/?>)/gi;

// Helper to check if element has id attribute
function hasIdAttribute(elementText) {
  return /id\s*=\s*["']([^"']+)["']/i.test(elementText) || /id\s*=\s*\{([^}]+)\}/i.test(elementText);
}

// Helper to extract id value
function extractId(elementText) {
  const stringMatch = elementText.match(/id\s*=\s*["']([^"']+)["']/i);
  const expressionMatch = elementText.match(/id\s*=\s*\{([^}]+)\}/i);
  return stringMatch ? stringMatch[1] : (expressionMatch ? expressionMatch[1] : null);
}

// Helper to check if preceding Label has htmlFor
function checkPrecedingLabel(content, elementIndex, elementId) {
  // Look back up to 500 characters for a Label component
  const searchStart = Math.max(0, elementIndex - 500);
  const precedingContent = content.substring(searchStart, elementIndex);
  
  // Find the last Label tag before this input
  const labelPattern = /<Label\s+([^>]*)>/gi;
  let lastLabelMatch = null;
  let match;
  
  while ((match = labelPattern.exec(precedingContent)) !== null) {
    lastLabelMatch = match;
  }
  
  if (!lastLabelMatch) {
    return { hasLabel: false, hasHtmlFor: false };
  }
  
  // Check if the Label has htmlFor attribute
  const labelAttrs = lastLabelMatch[1];
  const htmlForMatch = labelAttrs.match(/htmlFor\s*=\s*["']([^"']+)["']/i);
  
  if (!htmlForMatch) {
    return { hasLabel: true, hasHtmlFor: false };
  }
  
  // Check if htmlFor matches the element's id
  const htmlForValue = htmlForMatch[1];
  if (elementId && htmlForValue === elementId) {
    return { hasLabel: true, hasHtmlFor: true, matches: true };
  }
  
  return { hasLabel: true, hasHtmlFor: true, matches: false };
}

// Helper to extract element preview
function getElementPreview(fullTag) {
  return fullTag.substring(0, 120) + (fullTag.length > 120 ? '...' : '');
}

// Process each file
files.forEach((filePath) => {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const relPath = filePath.replace(projectRoot, '.');

    // Find Input elements
    let match;
    const inputRegex = new RegExp(inputPattern);
    while ((match = inputRegex.exec(content)) !== null) {
      const attributes = match[1];
      const fullTag = match[0];
      const startIndex = match.index;
      const lineNumber = content.substring(0, startIndex).split('\n').length;

      if (hasIdAttribute(attributes)) {
        const elementId = extractId(attributes);
        const labelCheck = checkPrecedingLabel(content, startIndex, elementId);
        
        if (labelCheck.hasLabel && labelCheck.hasHtmlFor && labelCheck.matches) {
          validFormElements.push({ file: relPath, type: 'Input with proper Label' });
        } else if (!labelCheck.hasLabel) {
          violations.push({
            file: relPath,
            line: lineNumber,
            type: '<Input>',
            tag: getElementPreview(fullTag),
            issue: 'No preceding <Label> component found',
            recommendation: 'Add <Label htmlFor="elementId"> before this input'
          });
        } else if (!labelCheck.hasHtmlFor) {
          violations.push({
            file: relPath,
            line: lineNumber,
            type: '<Input>',
            tag: getElementPreview(fullTag),
            issue: 'Preceding <Label> missing htmlFor attribute',
            recommendation: 'Add htmlFor attribute to Label component'
          });
        } else if (!labelCheck.matches) {
          violations.push({
            file: relPath,
            line: lineNumber,
            type: '<Input>',
            tag: getElementPreview(fullTag),
            issue: 'Label htmlFor does not match Input id',
            recommendation: 'Ensure Label htmlFor matches Input id'
          });
        }
      } else {
        violations.push({
          file: relPath,
          line: lineNumber,
          type: '<Input>',
          tag: getElementPreview(fullTag),
          issue: 'Missing id attribute',
          recommendation: 'Add id attribute to Input component'
        });
      }
    }

    // Find Textarea elements
    const textareaRegex = new RegExp(textareaPattern);
    while ((match = textareaRegex.exec(content)) !== null) {
      const attributes = match[1];
      const fullTag = match[0];
      const startIndex = match.index;
      const lineNumber = content.substring(0, startIndex).split('\n').length;

      if (hasIdAttribute(attributes)) {
        const elementId = extractId(attributes);
        const labelCheck = checkPrecedingLabel(content, startIndex, elementId);
        
        if (labelCheck.hasLabel && labelCheck.hasHtmlFor && labelCheck.matches) {
          validFormElements.push({ file: relPath, type: 'Textarea with proper Label' });
        } else if (!labelCheck.hasLabel) {
          violations.push({
            file: relPath,
            line: lineNumber,
            type: '<Textarea>',
            tag: getElementPreview(fullTag),
            issue: 'No preceding <Label> component found',
            recommendation: 'Add <Label htmlFor="elementId"> before this textarea'
          });
        } else if (!labelCheck.hasHtmlFor) {
          violations.push({
            file: relPath,
            line: lineNumber,
            type: '<Textarea>',
            tag: getElementPreview(fullTag),
            issue: 'Preceding <Label> missing htmlFor attribute',
            recommendation: 'Add htmlFor attribute to Label component'
          });
        } else if (!labelCheck.matches) {
          violations.push({
            file: relPath,
            line: lineNumber,
            type: '<Textarea>',
            tag: getElementPreview(fullTag),
            issue: 'Label htmlFor does not match Textarea id',
            recommendation: 'Ensure Label htmlFor matches Textarea id'
          });
        }
      } else {
        violations.push({
          file: relPath,
          line: lineNumber,
          type: '<Textarea>',
          tag: getElementPreview(fullTag),
          issue: 'Missing id attribute',
          recommendation: 'Add id attribute to Textarea component'
        });
      }
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

// Report results
console.log(`✓ Scanned ${files.length} files`);
console.log(`✓ Found ${validFormElements.length} properly labeled form elements`);

if (violations.length > 0) {
  console.log(`\n⚠ Found ${violations.length} form label violations:\n`);
  violations.forEach(violation => {
    console.log(`${violation.file}:${violation.line}`);
    console.log(`  Type: ${violation.type}`);
    console.log(`  Issue: ${violation.issue}`);
    console.log(`  Tag: ${violation.tag}`);
    console.log(`  Fix: ${violation.recommendation}`);
    console.log('');
  });
} else {
  console.log('\n✓ No form label violations found!');
}

// Summary
console.log('\n=== SUMMARY ===');
console.log(`Total form elements scanned: ${validFormElements.length + violations.length}`);
console.log(`Properly labeled elements: ${validFormElements.length}`);
console.log(`Form label violations: ${violations.length}`);
console.log(`\nAccessibility compliance: ${violations.length === 0 ? '✓ PASS' : '✗ FAIL'}`);

if (violations.length > 0) {
  console.log('\n⚠ WCAG 2.1 Level A Requirement:');
  console.log('All form inputs must have associated labels for screen reader accessibility.');
  console.log('Use <Label htmlFor="elementId"> with matching Input/Textarea id attributes.');
}
