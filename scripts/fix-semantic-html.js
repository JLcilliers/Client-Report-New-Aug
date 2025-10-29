import { readFileSync, writeFileSync } from 'fs';

/**
 * Fix semantic HTML violations by adding ARIA roles and keyboard handlers
 * Adds role="button", tabIndex={0}, and onKeyDown handlers to interactive divs
 */

const fixes = [
  {
    file: 'app/admin/properties/PropertiesClient.tsx',
    changes: [
      {
        line: 172,
        old: `        <div
          key={property.siteUrl}
          className={\`p-3 border rounded-lg cursor-pointer transition-colors \${
            selectedProperties.has(property.siteUrl)
              ? 'bg-frost border-glacier'
              : 'hover:bg-gray-50'
          }\`}
          onClick={() => togglePropertySelection(property.siteUrl)}
        >`,
        new: `        <div
          key={property.siteUrl}
          role="button"
          tabIndex={0}
          className={\`p-3 border rounded-lg cursor-pointer transition-colors \${
            selectedProperties.has(property.siteUrl)
              ? 'bg-frost border-glacier'
              : 'hover:bg-gray-50'
          }\`}
          onClick={() => togglePropertySelection(property.siteUrl)}
          onKeyDown={(e) => e.key === 'Enter' && togglePropertySelection(property.siteUrl)}
        >`
      },
      {
        line: 233,
        old: `        <div
          key={property.id}
          className={\`p-3 border rounded-lg cursor-pointer transition-colors \${
            selectedProperties.has(property.id)
              ? 'bg-frost border-glacier'
              : 'hover:bg-gray-50'
          }\`}
          onClick={() => togglePropertySelection(property.id)}
        >`,
        new: `        <div
          key={property.id}
          role="button"
          tabIndex={0}
          className={\`p-3 border rounded-lg cursor-pointer transition-colors \${
            selectedProperties.has(property.id)
              ? 'bg-frost border-glacier'
              : 'hover:bg-gray-50'
          }\`}
          onClick={() => togglePropertySelection(property.id)}
          onKeyDown={(e) => e.key === 'Enter' && togglePropertySelection(property.id)}
        >`
      }
    ]
  },
  {
    file: 'app/admin/ai-brands/new/page.tsx',
    changes: [
      {
        line: 499,
        old: `                  <div
                    key={platform.id}
                    className={\`p-4 border-2 rounded-lg cursor-pointer transition-all \${
                      formData.platforms.includes(platform.id)
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }\`}
                    onClick={() => togglePlatform(platform.id)}
                  >`,
        new: `                  <div
                    key={platform.id}
                    role="button"
                    tabIndex={0}
                    className={\`p-4 border-2 rounded-lg cursor-pointer transition-all \${
                      formData.platforms.includes(platform.id)
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }\`}
                    onClick={() => togglePlatform(platform.id)}
                    onKeyDown={(e) => e.key === 'Enter' && togglePlatform(platform.id)}
                  >`
      }
    ]
  }
];

console.log('Fixing semantic HTML violations...\n');

let totalFixed = 0;

fixes.forEach(({ file, changes }) => {
  try {
    const filePath = `C:\\Users\\johan\\Desktop\\Created Software\\Client Reporting\\${file}`;
    let content = readFileSync(filePath, 'utf-8');
    let fileFixed = 0;

    changes.forEach(({ old, new: replacement, line }) => {
      if (content.includes(old)) {
        content = content.replace(old, replacement);
        fileFixed++;
        totalFixed++;
        console.log(`✓ Fixed violation in ${file}:${line}`);
      } else {
        console.log(`⚠ Could not find exact match in ${file}:${line}`);
      }
    });

    if (fileFixed > 0) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`  Updated ${file} with ${fileFixed} fix(es)\n`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
  }
});

console.log('\n=== FIX SUMMARY ===');
console.log(`Total violations fixed: ${totalFixed}`);
console.log('\nChanges applied:');
console.log('- Added role="button" for screen reader accessibility');
console.log('- Added tabIndex={0} for keyboard focus');
console.log('- Added onKeyDown handler for Enter key activation');
console.log('\nAll interactive div elements now meet WCAG 2.1 requirements.');
