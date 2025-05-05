# KalAI Agent Usage Guide

This guide provides step-by-step instructions for using the KalAI Agent VS Code extension.

## Table of Contents

- [Installation](#installation)
- [Getting Started](#getting-started)
- [AI Chat Interface](#ai-chat-interface)
- [Edit with AI](#edit-with-ai)
- [Tips and Tricks](#tips-and-tricks)
- [Troubleshooting](#troubleshooting)

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Click on the Extensions icon in the Activity Bar
3. Search for "KalAI Agent"
4. Click "Install"

### From VSIX File

1. Download the .vsix file
2. Open VS Code
3. Go to Extensions (Ctrl+Shift+X)
4. Click the "..." menu at the top of the Extensions view
5. Select "Install from VSIX..."
6. Navigate to and select the downloaded .vsix file

## Getting Started

After installation, you'll see the KalAI Agent icon in the Activity Bar:

```
[ICON DESCRIPTION: A brain icon representing KalAI Agent in the VS Code activity bar]
```

Click on this icon to open the KalAI Agent sidebar.

## AI Chat Interface

The AI Chat Interface allows you to have conversations with the AI assistant about your code.

### Opening the Chat

1. Click on the KalAI Agent icon in the Activity Bar
2. The chat interface will appear in the sidebar

```
[SCREENSHOT DESCRIPTION: The KalAI Agent chat interface showing a welcome message and an input box at the bottom]
```

### Asking Questions

1. Type your question or request in the input box at the bottom of the chat
2. Press Enter or click the Send button
3. The AI will respond with helpful information, code snippets, or explanations

```
[SCREENSHOT DESCRIPTION: A conversation with the AI showing a user question about React hooks and the AI's detailed response]
```

### Including File Context

To help the AI understand your code better, you can include the current file in your conversation:

1. Click the "Get File Context" button at the top of the chat
2. The current file's content will be added to your input
3. Add your question and send

```
[SCREENSHOT DESCRIPTION: The chat interface showing file context being added to the input box]
```

### Clearing the Chat

To start a new conversation:

1. Click the "Clear Chat" button at the top of the chat
2. The chat history will be cleared, and a new welcome message will appear

## Edit with AI

The Edit with AI feature allows you to modify selected code using natural language instructions.

### Using Edit with AI

1. Select the code you want to modify in the editor
2. Right-click and select "KalAI: Edit with AI" from the context menu (or use the Command Palette)
3. Enter your instructions for how to modify the code
4. Review and accept the changes

```
[SCREENSHOT DESCRIPTION: A sequence showing code selection, right-click menu, instruction input, and the resulting modified code]
```

### Example Instructions

Here are some example instructions you can use with Edit with AI:

- "Add error handling to this function"
- "Optimize this code for better performance"
- "Convert this to use async/await instead of promises"
- "Add JSDoc comments to this function"
- "Refactor this to follow the repository pattern"

## Tips and Tricks

### Effective Prompting

For best results:

- Be specific in your requests
- Provide context about what you're trying to achieve
- Break complex tasks into smaller steps
- Use the "Get File Context" button when discussing specific code

### Keyboard Shortcuts

- Open KalAI Agent: `Ctrl+Shift+A` (Windows/Linux) or `Cmd+Shift+A` (Mac)
- Edit with AI: `Ctrl+Shift+E` (Windows/Linux) or `Cmd+Shift+E` (Mac)

## Troubleshooting

### Common Issues

**Issue**: AI responses are slow or timing out
**Solution**: Check your internet connection or try a different AI model in the settings

**Issue**: AI doesn't understand my code context
**Solution**: Use the "Get File Context" button to include your code in the conversation

**Issue**: Extension is not activating
**Solution**: Make sure you have the latest version of VS Code installed

### Getting Help

If you encounter any issues not covered here:

1. Check the [GitHub repository](https://github.com/yourusername/kalai-agent) for known issues
2. Submit a new issue with details about your problem
3. Contact support at support@kalai-agent.com