#!/bin/bash

# Complete setup and test script for MGZON CLI

echo "🚀 Starting complete MGZON CLI setup and test..."

# 0. Clean up first
echo "🧹 Cleaning up..."
rm -rf node_modules gui/node_modules dist bin
docker system prune -a -f 2>/dev/null || true

# 1. Install root dependencies
echo "📦 Installing root dependencies..."
npm ci

# 2. Fix axios version for pkg
echo "🔧 Fixing dependencies for pkg..."
npm run fix:deps

# 3. Build CLI
echo "🔨 Building CLI..."
npm run build
npm run package

# 4. Verify CLI build
echo "✅ CLI build verification..."
if [ -f "bin/mgzon-linux" ]; then
    echo "✓ CLI binary created: bin/mgzon-linux"
    echo "Testing binary execution..."
    if ./bin/mgzon-linux --version 2>/dev/null; then
        echo "🎉 Binary works perfectly!"
    else
        echo "⚠️ Binary has issues, testing with node..."
        node dist/index.js --version && echo "✓ Source works, binary issue with pkg"
    fi
else
    echo "✗ CLI binary not found!"
    ls -la bin/
    exit 1
fi

# 5. Setup GUI
echo "🎨 Setting up GUI..."
cd gui
npm ci

# 6. Convert icons
echo "🖼️ Converting icons..."
npm run convert-icons

# 7. Build GUI for current platform
echo "🔨 Building GUI..."
GUI_FILE=""
case "$(uname -s)" in
    Linux*)     
        echo "Building for Linux..."
        npm run package:linux
        GUI_FILE=$(find build -name "*.AppImage" | head -1)
        ;;
    Darwin*)    
        echo "Building for macOS..."
        npm run package:mac
        GUI_FILE=$(find build -name "*.dmg" | head -1)
        ;;
    *)          
        echo "Unknown OS, building for Linux..."
        npm run package:linux
        GUI_FILE=$(find build -name "*.AppImage" | head -1)
        ;;
esac

cd ..

# 8. Copy GUI to bin directory
echo "📁 Organizing GUI files..."
if [ -n "$GUI_FILE" ] && [ -f "$GUI_FILE" ]; then
    mkdir -p bin/gui
    cp "$GUI_FILE" bin/gui/
    echo "✓ GUI copied to bin/gui/$(basename "$GUI_FILE")"
    
    # Also copy from build directory if different
    if [ -d "gui/build" ]; then
        find gui/build -maxdepth 1 -type f \( -name "*.AppImage" -o -name "*.dmg" -o -name "*.exe" \) -exec cp {} bin/gui/ \;
    fi
else
    echo "⚠️  No GUI file found in expected location"
    echo "Checking build directory..."
    find gui/build -type f 2>/dev/null | head -10
fi

# 9. Run tests
echo "🧪 Running tests..."
npm test

# 10. Quick Docker test (without heavy build)
echo "🐳 Quick Docker test..."
docker run --rm node:20-alpine node --version && echo "✓ Docker works" || echo "⚠️ Docker issues"

# 11. Final verification
echo "📊 Final system status:"
echo ""
echo "=== Package versions ==="
echo "CLI: $(node -p "require('./package.json').version")"
echo "GUI: $(cd gui && node -p "require('./package.json').version" && cd ..)"
echo ""
echo "=== Files in bin/ ==="
ls -lh bin/ 2>/dev/null || echo "No bin directory"
echo ""
echo "=== Files in bin/gui/ ==="
ls -lh bin/gui/ 2>/dev/null || echo "No GUI in bin"
echo ""
echo "=== Summary ==="
echo "CLI Binary: $(ls -lh bin/mgzon-linux 2>/dev/null | awk '{print $5 " - " $9}' || echo "Not found")"
echo "GUI Binary: $(ls -lh bin/gui/* 2>/dev/null | head -1 | awk '{print $5 " - " $9}' || echo "Not found")"

echo ""
echo "🎉 Setup completed!"
echo ""
echo "💡 Next steps:"
echo "   1. Commit changes: git add . && git commit -m 'chore: fix axios and pkg issues'"
echo "   2. Push to trigger CI/CD: git push origin master"
echo "   3. Check GitHub Actions for automated builds"
echo "   4. Binaries will be available in GitHub Releases"