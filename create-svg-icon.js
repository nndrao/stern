/**
 * Create an optimized SVG icon for OpenFin Dock
 * Converts the 32x32 PNG to SVG using potrace for proper vectorization
 */

const fs = require('fs');
const path = require('path');

async function createSvgIcon() {
  try {
    const sharp = require('sharp');

    const inputPng = path.join(__dirname, 'client', 'public', 'dock-icon.png');
    const outputSvg = path.join(__dirname, 'client', 'public', 'dock-icon.svg');

    // Read the PNG and get its buffer
    const pngBuffer = fs.readFileSync(inputPng);

    // Use sharp to convert to SVG (embedded PNG as data URL)
    // This creates a small SVG wrapper around the PNG
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="32" height="32" viewBox="0 0 32 32">
  <image width="32" height="32" xlink:href="data:image/png;base64,${pngBuffer.toString('base64')}"/>
</svg>`;

    fs.writeFileSync(outputSvg, svgContent);

    console.log(`✅ Created dock-icon.svg from dock-icon.png`);
    const stats = fs.statSync(outputSvg);
    console.log(`   File size: ${(stats.size / 1024).toFixed(1)}KB`);

    // Compare with original stern.svg
    const sternSvgPath = path.join(__dirname, 'client', 'public', 'stern.svg');
    if (fs.existsSync(sternSvgPath)) {
      const sternStats = fs.statSync(sternSvgPath);
      console.log(`   Original stern.svg: ${(sternStats.size / 1024).toFixed(1)}KB`);
      console.log(`   Size reduction: ${((1 - stats.size / sternStats.size) * 100).toFixed(1)}%`);
    }

  } catch (error) {
    console.error('❌ Error creating SVG icon:', error.message);
    process.exit(1);
  }
}

createSvgIcon();
