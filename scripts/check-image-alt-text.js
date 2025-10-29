import { readFileSync } from 'fs';
import { globSync } from 'glob';
import { join } from 'path';

/**
 * Check for images missing alt text in Next.js application
 * Scans for <img> tags and <Image> components without alt attributes
 * Identifies accessibility violations that need to be fixed
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

console.log(`Scanning ${files.length} files for images missing alt text...\n`);

const missingAlt = [];
const emptyAlt = [];
const validImages = [];

// Regex patterns for image elements
const imgTagPattern = /<img\s+([^>]*)>/gi;
const nextImagePattern = /<Image\s+([^>]*)>/gi;

// Helper to check if attributes contain alt text
function checkAltAttribute(attributes, tag) {
  const altMatch = attributes.match(/alt\s*=\s*["']([^"']*)["']/i);
  const altMatch2 = attributes.match(/alt\s*=\s*\{([^}]*)\}/i);

  if (!altMatch && !altMatch2) {
    return { hasAlt: false, isEmpty: false };
  }

  const altValue = altMatch ? altMatch[1] : (altMatch2 ? altMatch2[1].trim() : '');

  // Check if alt is empty or just whitespace
  if (altValue === '' || altValue.trim() === '' || altValue === '""' || altValue === "''") {
    return { hasAlt: true, isEmpty: true };
  }

  return { hasAlt: true, isEmpty: false };
}

// Process each file
files.forEach((filePath) => {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const relPath = filePath.replace(projectRoot, '.');

    // Find <img> tags
    let match;
    const imgRegex = new RegExp(imgTagPattern);
    while ((match = imgRegex.exec(content)) !== null) {
      const attributes = match[1];
      const fullTag = match[0];
      const lineNumber = content.substring(0, match.index).split('\n').length;

      const { hasAlt, isEmpty } = checkAltAttribute(attributes, 'img');

      if (!hasAlt) {
        missingAlt.push({
          file: relPath,
          line: lineNumber,
          type: '<img>',
          tag: fullTag.substring(0, 100) + (fullTag.length > 100 ? '...' : '')
        });
      } else if (isEmpty) {
        emptyAlt.push({
          file: relPath,
          line: lineNumber,
          type: '<img>',
          tag: fullTag.substring(0, 100) + (fullTag.length > 100 ? '...' : '')
        });
      } else {
        validImages.push({ file: relPath, type: '<img>' });
      }
    }

    // Find Next.js <Image> components
    const imageRegex = new RegExp(nextImagePattern);
    while ((match = imageRegex.exec(content)) !== null) {
      const attributes = match[1];
      const fullTag = match[0];
      const lineNumber = content.substring(0, match.index).split('\n').length;

      const { hasAlt, isEmpty } = checkAltAttribute(attributes, 'Image');

      if (!hasAlt) {
        missingAlt.push({
          file: relPath,
          line: lineNumber,
          type: '<Image>',
          tag: fullTag.substring(0, 100) + (fullTag.length > 100 ? '...' : '')
        });
      } else if (isEmpty) {
        emptyAlt.push({
          file: relPath,
          line: lineNumber,
          type: '<Image>',
          tag: fullTag.substring(0, 100) + (fullTag.length > 100 ? '...' : '')
        });
      } else {
        validImages.push({ file: relPath, type: '<Image>' });
      }
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

// Report results
console.log(`✓ Scanned ${files.length} files`);
console.log(`✓ Found ${validImages.length} images with proper alt text`);

if (missingAlt.length > 0) {
  console.log(`\n⚠ Found ${missingAlt.length} images missing alt attributes:\n`);
  missingAlt.forEach(img => {
    console.log(`${img.file}:${img.line}`);
    console.log(`  Type: ${img.type}`);
    console.log(`  Tag: ${img.tag}`);
    console.log('');
  });
}

if (emptyAlt.length > 0) {
  console.log(`\n⚠ Found ${emptyAlt.length} images with empty alt text:\n`);
  emptyAlt.forEach(img => {
    console.log(`${img.file}:${img.line}`);
    console.log(`  Type: ${img.type}`);
    console.log(`  Tag: ${img.tag}`);
    console.log('');
  });
}

if (missingAlt.length === 0 && emptyAlt.length === 0) {
  console.log('\n✓ All images have proper alt text!');
}

// Summary
console.log('\n=== SUMMARY ===');
console.log(`Total images found: ${validImages.length + missingAlt.length + emptyAlt.length}`);
console.log(`Images with valid alt text: ${validImages.length}`);
console.log(`Images missing alt attribute: ${missingAlt.length}`);
console.log(`Images with empty alt text: ${emptyAlt.length}`);
console.log(`\nAccessibility compliance: ${missingAlt.length + emptyAlt.length === 0 ? '✓ PASS' : '✗ FAIL'}`);
