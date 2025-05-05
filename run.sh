#!/bin/bash

echo "========================================"
echo " KalAI Agent VS Code Extension Runner"
echo "========================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is not installed or not in PATH"
    echo "Please install npm from https://www.npmjs.com/get-npm"
    exit 1
fi

# Check if VS Code is installed
if ! command -v code &> /dev/null; then
    echo "[ERROR] VS Code is not installed or not in PATH"
    echo "Please install VS Code from https://code.visualstudio.com/"
    exit 1
fi

# Run setup script if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Running setup script..."
    node setup.js
    if [ $? -ne 0 ]; then
        echo "[ERROR] Setup failed"
        exit 1
    fi
fi

# Open VS Code with the extension in development mode
echo
echo "Opening VS Code with KalAI Agent in development mode..."
echo
echo "Press F5 in VS Code to start debugging the extension"
echo
code .

echo
echo "Done! VS Code should now be open with KalAI Agent."
echo

# Make the script executable
chmod +x "$0"