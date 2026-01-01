#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing pkg configuration...');

// 1. Ensure axios CJS version exists
const axiosCjsPath = path.join(__dirname, 'node_modules', 'axios', 'dist', 'node', 'axios.cjs');
const axiosIndexPath = path.join(__dirname, 'node_modules', 'axios', 'index.js');

if (!fs.existsSync(axiosCjsPath)) {
    console.log('⚠️  axios.cjs not found, creating symlink...');
    
    // Read the ESM version and create CJS version
    if (fs.existsSync(axiosIndexPath)) {
        const content = fs.readFileSync(axiosIndexPath, 'utf8');
        // Create directory if it doesn't exist
        fs.mkdirSync(path.dirname(axiosCjsPath), { recursive: true });
        // Write as CJS
        fs.writeFileSync(axiosCjsPath, content);
        console.log('✅ Created axios.cjs');
    }
}

// 2. Update package.json pkg assets
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

packageJson.pkg = {
    scripts: "dist/**/*.js",
    assets: [
        "node_modules/open/xdg-open",
        "node_modules/axios/dist/node/axios.cjs"
    ],
    outputPath: "bin"
};

fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json pkg configuration');

// 3. Copy xdg-open to bin directory
const xdgSource = path.join(__dirname, 'node_modules', 'open', 'xdg-open');
const xdgDest = path.join(__dirname, 'bin', 'xdg-open');

if (fs.existsSync(xdgSource)) {
    fs.copyFileSync(xdgSource, xdgDest);
    fs.chmodSync(xdgDest, 0o755);
    console.log('✅ Copied xdg-open to bin/');
}

console.log('🎉 pkg fixes completed!');