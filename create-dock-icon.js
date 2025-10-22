/**
 * Create a 32x32 PNG icon for OpenFin Dock from stern.svg
 *
 * This script uses sharp (if available) or creates a simple placeholder
 */

const fs = require('fs');
const path = require('path');

async function createDockIcon() {
  try {
    // Try to use sharp for proper image conversion
    const sharp = require('sharp');

    const inputSvg = path.join(__dirname, 'client', 'public', 'stern.svg');
    const outputPng = path.join(__dirname, 'client', 'public', 'dock-icon.png');

    await sharp(inputSvg)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPng);

    console.log(`✅ Created dock-icon.png (32x32) from stern.svg`);
    const stats = fs.statSync(outputPng);
    console.log(`   File size: ${(stats.size / 1024).toFixed(1)}KB`);

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('❌ sharp module not found. Install it with: npm install sharp');
      console.log('\nAlternatively, manually create a 32x32 PNG icon from stern.svg');
    } else {
      console.error('❌ Error creating dock icon:', error.message);
    }
    process.exit(1);
  }
}

createDockIcon();
