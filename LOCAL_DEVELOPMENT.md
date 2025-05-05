# KalAI Agent Local Development Guide

This guide provides detailed instructions for setting up, running, and testing the KalAI Agent VS Code extension locally before publishing to the marketplace.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.x or higher) - [Download](https://nodejs.org/)
- **npm** (v6.x or higher, comes with Node.js)
- **Visual Studio Code** - [Download](https://code.visualstudio.com/)
- **Git** (optional, for version control) - [Download](https://git-scm.com/)

## Quick Start

For the fastest setup, use the provided scripts:

### On Windows:
```
run.bat
```

### On macOS/Linux:
```
chmod +x run.sh
./run.sh
```

These scripts will check dependencies, run the setup process, and open VS Code with the extension ready for debugging.

## Manual Setup

If you prefer to set up manually or the scripts don't work for your environment, follow these steps:

### 1. Install Dependencies

```bash
npm install
```

This will install all required dependencies defined in `package.json`, including:
- VS Code Extension API
- TypeScript
- Webpack
- React (for the webview)
- Axios (for API calls)

### 2. Build the Extension

```bash
npm run compile
```

This command compiles the TypeScript code to JavaScript. Alternatively, you can use:

```bash
npm run watch
```

This will start the TypeScript compiler in watch mode, which automatically recompiles when you make changes.

## Running the Extension Locally

### Method 1: Using VS Code's Extension Development Host

1. Open the project in VS Code:
   ```bash
   code .
   ```

2. Press `F5` or select "Run and Debug" from the activity bar, then click the green play button.

   This will:
   - Build the extension
   - Launch a new VS Code window with the extension loaded
   - Attach the debugger

3. In the new VS Code window (Extension Development Host):
   - Click on the KalAI Agent icon in the activity bar to open the chat interface
   - Right-click on code to use the "Edit with AI" feature

### Method 2: Using the Command Line

1. Package the extension:
   ```bash
   npm run vscode:package
   ```

2. This creates a `.vsix` file in the root directory.

3. Install the extension from the `.vsix` file:
   ```bash
   code --install-extension kalai-agent-0.1.0.vsix
   ```

4. Restart VS Code to load the extension.

## Debugging the Extension

### Console Logs

- Extension logs appear in the Debug Console of your main VS Code window
- Webview logs appear in the Developer Tools of the Extension Development Host

To open Developer Tools in the Extension Development Host:
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
2. Type "Developer: Toggle Developer Tools"
3. Press Enter

### Using Breakpoints

1. Set breakpoints in your TypeScript files by clicking in the gutter next to the line numbers
2. Run the extension in debug mode (F5)
3. The debugger will pause execution when it hits a breakpoint

## Testing with Different AI Models

The extension is designed to work with various AI models through OpenRouter or other endpoints. To test with different models:

1. Open the Extension Development Host
2. Go to Settings (`Ctrl+,` or `Cmd+,` on macOS)
3. Search for "KalAI"
4. Configure the AI endpoint and model name

## Packaging for Publication

When you're ready to publish to the VS Code Marketplace:

1. Update the version in `package.json`
2. Package the extension:
   ```bash
   npm run vscode:package
   ```

3. This creates a `.vsix` file that can be published to the marketplace.

## Troubleshooting Common Issues

### "Cannot find module 'vscode'" Error

This is normal during development. The 'vscode' module is provided by VS Code at runtime and doesn't need to be installed as a dependency.

### Webview Not Loading

If the chat interface doesn't appear:
1. Check the Developer Tools console for errors
2. Verify that the webview HTML is being generated correctly in `getWebviewContent.ts`
3. Ensure all webview resources (CSS, JS) are properly referenced

### AI Service Connection Issues

If the AI service isn't responding:
1. Check your API endpoint configuration
2. Verify network connectivity
3. Look for CORS issues in the Developer Tools console

## Project Structure Overview

Understanding the project structure helps with development:

- `src/extension.ts` - Main entry point
- `src/providers/chatViewProvider.ts` - Chat interface provider
- `src/commands/editWithAI.ts` - Edit with AI command handler
- `src/services/aiService.ts` - AI API communication
- `webview/` - React components for the chat interface
- `media/` - CSS and other assets

## Development Workflow Tips

1. **Use watch mode**: Run `npm run watch` to automatically recompile on changes
2. **Frequent testing**: Press F5 often to test changes in the Extension Development Host
3. **Iterate on the UI**: Make small changes to the webview and refresh to see updates
4. **Check logs**: Monitor the Debug Console and Developer Tools for errors
5. **Version control**: Commit changes frequently if using Git

## Next Steps After Local Testing

Once you've verified the extension works locally:

1. Create a publisher account on the [VS Code Marketplace](https://marketplace.visualstudio.com/manage)
2. Install the vsce publishing tool:
   ```bash
   npm install -g vsce
   ```

3. Login and publish:
   ```bash
   vsce login <publisher>
   vsce publish
   ```

4. Your extension will be available on the marketplace for others to install!