import { readFileSync, existsSync } from 'fs';
import { globSync } from 'glob';
import { join, dirname } from 'path';

/**
 * Check for broken internal links in Next.js application
 * Scans for <Link> components and <a> tags with internal hrefs
 * Verifies that target routes exist in the app directory
 */

const projectRoot = process.cwd();
const appDir = join(projectRoot, 'app');

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

console.log(`Scanning ${files.length} files for internal links...\n`);

const brokenLinks = [];
const validLinks = new Set();
const linkPattern = /<Link[^>]*href=["']([^"']+)["'][^>]*>/g;
const anchorPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>/g;

// Helper to check if a route exists in the app directory
function routeExists(href) {
  // Skip external links
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return true;
  }

  // Skip hash links
  if (href.startsWith('#')) {
    return true;
  }

  // Remove query params and hash
  const cleanPath = href.split('?')[0].split('#')[0];

  // Skip empty or root path
  if (!cleanPath || cleanPath === '/') {
    return true;
  }

  // Check if route exists as a page.tsx or page.js file
  const possiblePaths = [
    join(appDir, cleanPath, 'page.tsx'),
    join(appDir, cleanPath, 'page.jsx'),
    join(appDir, cleanPath, 'page.js'),
    join(appDir, cleanPath + '.tsx'),
    join(appDir, cleanPath + '.jsx'),
    join(appDir, cleanPath + '.js'),
  ];

  // Check for dynamic routes (e.g., [id])
  const dynamicPath = cleanPath.replace(/\/[^/]+$/, '/[...catchall]');
  possiblePaths.push(join(appDir, dynamicPath, 'page.tsx'));
  possiblePaths.push(join(appDir, dynamicPath, 'page.jsx'));

  // Check for dynamic segments
  const segments = cleanPath.split('/').filter(Boolean);
  for (let i = 0; i < segments.length; i++) {
    const testSegments = [...segments];
    testSegments[i] = '[id]';
    const testPath = '/' + testSegments.join('/');
    possiblePaths.push(join(appDir, testPath, 'page.tsx'));
    possiblePaths.push(join(appDir, testPath, 'page.jsx'));

    testSegments[i] = '[slug]';
    const slugPath = '/' + testSegments.join('/');
    possiblePaths.push(join(appDir, slugPath, 'page.tsx'));
    possiblePaths.push(join(appDir, slugPath, 'page.jsx'));

    testSegments[i] = '[brandId]';
    const brandPath = '/' + testSegments.join('/');
    possiblePaths.push(join(appDir, brandPath, 'page.tsx'));
    possiblePaths.push(join(appDir, brandPath, 'page.jsx'));
  }

  return possiblePaths.some(path => existsSync(path));
}

// Process each file
files.forEach((filePath) => {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const relPath = filePath.replace(projectRoot, '.');

    // Find Link components
    let match;
    while ((match = linkPattern.exec(content)) !== null) {
      const href = match[1];

      // Skip if already checked
      if (validLinks.has(href)) continue;

      if (!routeExists(href)) {
        brokenLinks.push({
          file: relPath,
          href: href,
          type: 'Link',
          line: content.substring(0, match.index).split('\n').length
        });
      } else {
        validLinks.add(href);
      }
    }

    // Find anchor tags
    while ((match = anchorPattern.exec(content)) !== null) {
      const href = match[1];

      // Skip if already checked
      if (validLinks.has(href)) continue;

      // Only check internal links
      if (!href.startsWith('http') && !href.startsWith('mailto') && !href.startsWith('tel')) {
        if (!routeExists(href)) {
          brokenLinks.push({
            file: relPath,
            href: href,
            type: '<a>',
            line: content.substring(0, match.index).split('\n').length
          });
        } else {
          validLinks.add(href);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

// Report results
console.log(`✓ Scanned ${files.length} files`);
console.log(`✓ Found ${validLinks.size} valid internal links`);

if (brokenLinks.length > 0) {
  console.log(`\n⚠ Found ${brokenLinks.length} potentially broken links:\n`);
  brokenLinks.forEach(link => {
    console.log(`${link.file}:${link.line}`);
    console.log(`  Type: ${link.type}`);
    console.log(`  Link: ${link.href}`);
    console.log('');
  });
} else {
  console.log('\n✓ No broken internal links found!');
}
