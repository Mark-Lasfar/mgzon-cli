#!/bin/bash

# MGZON CLI Demo Script
# This script demonstrates common MGZON CLI usage patterns

echo "🚀 MGZON CLI Usage Examples"
echo "============================"
echo ""

# Check if CLI is available
if ! command -v mz &> /dev/null && ! command -v mgzon &> /dev/null && [ ! -f "./bin/mgzon-linux" ]; then
    echo "❌ MGZON CLI not found. Please install it first:"
    echo "   npm install -g @mgzon/cli"
    echo "   # or download from: https://github.com/Mark-Lasfar/mgzon-cli/releases"
    exit 1
fi

# Determine CLI command
CLI_CMD="mz"
if ! command -v mz &> /dev/null; then
    if command -v mgzon &> /dev/null; then
        CLI_CMD="mgzon"
    elif [ -f "./bin/mgzon-linux" ]; then
        CLI_CMD="./bin/mgzon-linux"
    fi
fi

echo "📋 CLI Command: $CLI_CMD"
echo ""

# Function to run CLI command with error handling
run_cmd() {
    echo "💻 $CLI_CMD $@"
    echo "   Output:"
    if $CLI_CMD "$@"; then
        echo "   ✅ Success"
    else
        echo "   ❌ Failed (this is expected if not authenticated)"
    fi
    echo ""
}

echo "🔧 Basic Commands:"
echo "-----------------"

run_cmd "--version"

echo "🔐 Authentication (requires login):"
echo "-----------------------------------"

run_cmd "whoami"

echo "📁 Project Management:"
echo "----------------------"

run_cmd "init --help"

echo "🌐 Server Commands:"
echo "------------------"

run_cmd "serve --help"

echo "🚀 Deployment:"
echo "-------------"

run_cmd "deploy --help"

echo "📊 App Management:"
echo "------------------"

run_cmd "apps --help"

echo "💡 Tips:"
echo "-------"
echo "• Run '$CLI_CMD login' to authenticate first"
echo "• Use '$CLI_CMD --help' for full command list"
echo "• Use '$CLI_CMD <command> --help' for command-specific help"
echo "• For GUI, download from: https://github.com/Mark-Lasfar/mgzon-cli/releases"
echo ""
echo "🎉 Demo completed!"