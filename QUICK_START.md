# KalAI Agent Quick Start Guide

This guide provides the essential steps to get KalAI Agent running locally in the fastest way possible.

## Prerequisites

- Node.js (v14.x or higher)
- npm (v6.x or higher)
- Visual Studio Code

## Step 1: Install Dependencies

```bash
# Install all required dependencies
npm install

# If you encounter any issues, try:
npm install --legacy-peer-deps
```

## Step 2: Build the Extension

```bash
# Compile TypeScript to JavaScript
npm run compile

# Or use watch mode to automatically recompile on changes
npm run watch
```

## Step 3: Run the Extension

### Method A: Using VS Code's Debug Feature (Recommended)

1. Open VS Code
2. Press F5 (or select "Run and Debug" from the activity bar)
3. Select "Extension" as the debug configuration
4. A new VS Code window will open with the extension loaded

### Method B: Using the Command Line

```bash
# Package the extension
npm run vscode:package

# Install the packaged extension
code --install-extension kalai-agent-0.1.0.vsix

# Restart VS Code
```

## Step 4: Using the Extension

1. In the Extension Development Host window, click on the KalAI Agent icon in the activity bar
2. The chat interface will open in the sidebar
3. To use "Edit with AI", select some code, right-click, and choose "KalAI: Edit with AI"

## Troubleshooting

### Common Issues

- **"Cannot find module 'vscode'"**: This is normal during development. The 'vscode' module is provided by VS Code at runtime.
- **TypeScript errors**: Run `npm install @types/vscode` to install VS Code type definitions.
- **React errors**: Run `npm install @types/react @types/react-dom` to install React type definitions.

### If the Extension Doesn't Appear

1. Check the Debug Console for errors
2. Verify that the extension is activated by running the command "Developer: Show Running Extensions"
3. Try restarting VS Code

## Next Steps

For more detailed information, see:
- [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) - Comprehensive development guide
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Detailed setup and testing instructions

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Compile once
npm run compile

# Compile in watch mode
npm run watch

# Package the extension
npm run vscode:package

# Clean build artifacts
npm run clean