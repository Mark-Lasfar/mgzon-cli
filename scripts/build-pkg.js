#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building MGZON CLI binaries...');

// ===============================================
// 1. فحص إصدار axios (مهم جدًا لتوافق pkg)
// ===============================================
console.log('📦 Checking axios version...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (packageJson.dependencies && packageJson.dependencies.axios !== '^0.27.2') {
    console.error('❌ axios version must be ^0.27.2 for full pkg compatibility');
    console.error('   Current:', packageJson.dependencies?.axios || 'Not found');
    console.error('   Fix it by running: npm i axios@0.27.2');
    console.error('   Or add a script: "fix:deps": "npm i axios@0.27.2" in package.json');
    process.exit(1);
}
console.log('✅ axios version is compatible (^0.27.2)');

// ===============================================
// 2. التأكد من وجود مجلد bin
// ===============================================
const binDir = path.join(__dirname, '..', 'bin');
if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
    console.log('📁 Created bin directory');
}

// ===============================================
// 3. إصلاح axios لـ pkg (إنشاء axios.cjs إذا مفقود)
// ===============================================
console.log('🔧 Preparing dependencies for pkg...');
const axiosDir = path.join(__dirname, '..', 'node_modules', 'axios');
const axiosIndex = path.join(axiosDir, 'index.js');
const axiosCjsDir = path.join(axiosDir, 'dist', 'node');
const axiosCjs = path.join(axiosCjsDir, 'axios.cjs');

if (fs.existsSync(axiosIndex) && !fs.existsSync(axiosCjs)) {
    console.log('📦 Creating axios.cjs for pkg compatibility...');
    const content = `module.exports = require('./index.js');`;
    fs.mkdirSync(axiosCjsDir, { recursive: true });
    fs.writeFileSync(axiosCjs, content);
    console.log('✅ axios.cjs created');
}

// ===============================================
// 4. نسخ xdg-open ليتم تضمينه مع الـ binary
// ===============================================
const xdgSource = path.join(__dirname, '..', 'node_modules', 'open', 'xdg-open');
const xdgDest = path.join(binDir, 'xdg-open');

if (fs.existsSync(xdgSource)) {
    fs.copyFileSync(xdgSource, xdgDest);
    fs.chmodSync(xdgDest, 0o755);
    console.log('📋 Copied xdg-open to bin/');
} else {
    console.warn('⚠️  xdg-open script not found – open package might not work on Linux');
}

// ===============================================
// 5. بناء الـ binaries لكل المنصات (node20 لأفضل توافق)
// ===============================================
console.log('🔨 Building binaries for all platforms...');

try {
    // Linux
    console.log('🐧 Building for Linux (node20-linux-x64)...');
    execSync('pkg dist/index.js --targets node20-linux-x64 --output bin/mgzon-linux', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });

    // macOS
    console.log('🍎 Building for macOS (node20-macos-x64)...');
    execSync('pkg dist/index.js --targets node20-macos-x64 --output bin/mgzon-macos', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });

    // Windows
    console.log('🪟 Building for Windows (node20-win-x64)...');
    execSync('pkg dist/index.js --targets node20-win-x64 --output bin/mgzon-win.exe', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });

    console.log('✅ All binaries built successfully!');

    // عرض قائمة الملفات النهائية مع الحجم
    console.log('\n📁 Generated files in bin/:');
    const files = fs.readdirSync(binDir);
    files.forEach(file => {
        const filePath = path.join(binDir, file);
        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`   • ${file} (${sizeMB} MB)`);
    });

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}