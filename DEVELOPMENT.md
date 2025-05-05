# KalAI Agent Development Guide

This document provides detailed instructions for setting up, running, and testing the KalAI Agent VS Code extension.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14.x or higher)
- [npm](https://www.npmjs.com/) (v6.x or higher)
- [Visual Studio Code](https://code.visualstudio.com/) (v1.60.0 or higher)

## Setup and Installation

1. **Initialize the project**:
   ```bash
   # Navigate to the project directory
   cd kalai-agent

   # Initialize npm
   npm init -y
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

   This will install all the dependencies specified in package.json, including:
   - VS Code extension API
   - React and React DOM
   - Axios for API requests
   - Webpack for bundling
   - TypeScript and related tools

## Building the Extension

1. **Compile TypeScript**:
   ```bash
   npm run compile
   ```

   This runs the webpack build process defined in the webpack.config.js file.

2. **Watch for changes** (during development):
   ```bash
   npm run watch
   ```

   This will continuously compile your TypeScript files as you make changes.

## Running and Testing

### Method 1: Using VS Code's Extension Development Host

1. Open the project in VS Code
2. Press `F5` or select "Run and Debug" from the sidebar
3. Choose "Extension Development Host" from the dropdown menu
4. A new VS Code window will open with your extension loaded

### Method 2: Using the Command Line

1. **Package the extension**:
   ```bash
   npm run package
   ```

   This creates a .vsix file in the project directory.

2. **Install the extension from the .vsix file**:
   ```bash
   code --install-extension kalai-agent-0.1.0.vsix
   ```

3. **Restart VS Code** to load the extension

## Testing the Extension Features

### Testing the Chat Interface

1. Click on the KalAI Agent icon in the activity bar (left sidebar)
2. The chat interface should appear in the sidebar
3. Type a message and press Enter or click Send
4. You should receive a response from the AI model

### Testing the Edit with AI Feature

1. Open a code file in VS Code
2. Select some code you want to modify
3. Right-click and select "KalAI: Edit with AI" from the context menu
4. Enter instructions for how to modify the code
5. The AI should process your request and apply the changes

## Debugging

### Extension Logs

To view logs from your extension:

1. Open the Output panel in VS Code (View > Output)
2. Select "KalAI Agent" from the dropdown menu

### Common Issues and Solutions

#### Issue: Extension not appearing in sidebar
- Check the extension activation events in package.json
- Verify that the extension is properly loaded by checking the Extensions view

#### Issue: AI responses not working
- Check the console for API errors
- Verify your internet connection
- Ensure the AI endpoint URL is correct in settings

#### Issue: React components not rendering
- Check the browser console in the webview (right-click > Inspect Element)
- Verify that the webview HTML is being generated correctly

## Extension Settings

You can customize the extension through VS Code settings:

1. Open VS Code settings (File > Preferences > Settings)
2. Search for "KalAI"
3. Adjust the following settings:
   - `kalai-agent.aiEndpoint`: API endpoint for AI model
   - `kalai-agent.modelName`: AI model to use for code assistance

## Packaging for Distribution

To create a distributable package:

```bash
npm run package
```

This will create a .vsix file that can be installed in VS Code.

## Publishing to VS Code Marketplace

1. Install vsce:
   ```bash
   npm install -g vsce
   ```

2. Login to Azure DevOps:
   ```bash
   vsce login <publisher-name>
   ```

3. Publish the extension:
   ```bash
   vsce publish
   ```

## Project Structure Overview

- `src/`: Main extension code
  - `extension.ts`: Entry point
  - `commands/`: Command handlers
  - `providers/`: VS Code providers
  - `services/`: Service classes
  - `utils/`: Utility functions
- `webview/`: React components for the UI
- `media/`: CSS and assets
- `dist/`: Compiled output (generated)