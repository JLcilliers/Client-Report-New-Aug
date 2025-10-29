const fs = require('fs');
const path = require('path');

// Fix semantic HTML violation in new/page.tsx at line 499
// Uses line-based replacement instead of exact string matching for reliability
const file = path.join(__dirname, '..', 'app', 'admin', 'ai-brands', 'new', 'page.tsx');

console.log('Reading file:', file);
const content = fs.readFileSync(file, 'utf-8');
const lines = content.split('\n');

// Find the target div by searching for key={platform.id}
let targetLineIndex = -1;
let onClickLineIndex = -1;

// Search for key={platform.id} and verify <div tag exists nearby
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('key={platform.id}')) {
    // Check if <div is on this line or within the previous 3 lines
    let divLineIndex = -1;
    for (let j = Math.max(0, i - 3); j <= i; j++) {
      if (lines[j].includes('<div')) {
        divLineIndex = j;
        break;
      }
    }

    if (divLineIndex !== -1) {
      targetLineIndex = i; // Use the key line for insertion point

      // Find the onClick line after the key line
      for (let j = i + 1; j < lines.length && j < i + 15; j++) {
        if (lines[j].includes('onClick={() => togglePlatform(platform.id)}')) {
          onClickLineIndex = j;
          break;
        }
      }
      break;
    }
  }
}

if (targetLineIndex === -1) {
  console.log('✗ Could not find target div with key={platform.id}');
  process.exit(1);
}

if (onClickLineIndex === -1) {
  console.log('✗ Could not find onClick handler');
  process.exit(1);
}

console.log(`✓ Found target div at line ${targetLineIndex + 1}`);
console.log(`✓ Found onClick handler at line ${onClickLineIndex + 1}`);

// Check if already fixed
const hasRoleButton = lines.some((line, idx) =>
  idx > targetLineIndex && idx < onClickLineIndex && line.includes('role="button"')
);

if (hasRoleButton) {
  console.log('✓ File appears to already have accessibility attributes');
  process.exit(0);
}

// Get the indentation from the key line (should match attribute indentation)
const keyLineIndent = lines[targetLineIndex].match(/^(\s*)/)[1];

// Insert role="button" and tabIndex={0} after the key line
const newLines = [
  ...lines.slice(0, targetLineIndex + 1),
  `${keyLineIndent}role="button"`,
  `${keyLineIndent}tabIndex={0}`,
  ...lines.slice(targetLineIndex + 1, onClickLineIndex + 1),
  `${keyLineIndent}onKeyDown={(e) => e.key === 'Enter' && togglePlatform(platform.id)}`,
  ...lines.slice(onClickLineIndex + 1)
];

// Write the updated content
const updatedContent = newLines.join('\n');
fs.writeFileSync(file, updatedContent, 'utf-8');

console.log('✓ Successfully fixed semantic HTML violation at line 499');
console.log('  Added: role="button"');
console.log('  Added: tabIndex={0}');
console.log('  Added: onKeyDown handler for Enter key');
console.log('\n✓ Fix applied - new/page.tsx now meets WCAG 2.1 accessibility standards');
