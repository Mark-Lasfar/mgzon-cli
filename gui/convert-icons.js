const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertIcon() {
  const svgPath = path.join(__dirname, 'mgzon-logo.svg');
  const outputDir = path.join(__dirname, 'build', 'icons');

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Icon sizes needed for Electron
  const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];

  console.log('Converting MGZON logo to PNG icons...');

  try {
    // Read SVG content
    const svgBuffer = fs.readFileSync(svgPath);

    // Convert to different sizes
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon_${size}x${size}.png`);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✓ Created ${outputPath}`);
    }

    console.log('\n✅ All icons converted successfully!');
    console.log(`Icons saved to: ${outputDir}`);

  } catch (error) {
    console.error('❌ Error converting icons:', error);
    process.exit(1);
  }
}

convertIcon();