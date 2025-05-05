# KalAI Agent

KalAI Agent is a next-generation AI coding assistant extension for Visual Studio Code, designed to empower developers with real-time code editing, intelligent suggestions, and conversational support.

## Features

- 🧠 **AI Chat Interface**: Context-aware conversational assistant embedded directly in the VS Code sidebar to answer questions, explain code, suggest solutions, and generate snippets in multiple languages.

- ✍️ **Inline Code Editing**: Smart "edit with AI" functionality allows users to highlight code and instruct KalAI Agent to refactor, optimize, document, or rewrite it instantly.

- 🗂️ **Multi-file Awareness** (Planned): Experimental ability to scan and understand relationships across multiple open files to provide smarter suggestions.

- ⚙️ **No API Key Required**: Unlike commercial tools, KalAI Agent is powered by a freely available, local or cloud-hosted AI model (e.g., Meta's Code Llama or OpenRouter access to Mixtral/Zephyr) — removing the need for paid APIs or authentication.

## Quick Start

To get started with KalAI Agent development:

1. Clone this repository
2. Run the setup script to initialize the project:
   ```bash
   node setup.js
   ```
3. Open the project in VS Code:
   ```bash
   code .
   ```
4. Press F5 to run the extension in development mode

For detailed instructions, see the [Development Guide](DEVELOPMENT.md).

## Installation

1. Install the extension from the VS Code Marketplace
2. Open the KalAI Agent sidebar by clicking on its icon in the activity bar
3. Start chatting with the AI or use the "Edit with AI" command on selected code

## Usage

### AI Chat

1. Click on the KalAI Agent icon in the activity bar to open the chat interface
2. Type your question or request in the input box
3. Press Enter or click the Send button to get a response
4. Use the "Get File Context" button to include the current file in your conversation

### Edit with AI

1. Select the code you want to modify
2. Right-click and select "KalAI: Edit with AI" from the context menu (or use the command palette)
3. Enter your instructions for how to modify the code
4. Review and accept the changes

## Requirements

- Visual Studio Code version 1.60.0 or higher
- Node.js v14.x or higher
- npm v6.x or higher

## Extension Settings

This extension contributes the following settings:

* `kalai-agent.aiEndpoint`: API endpoint for AI model (OpenRouter, Hugging Face, etc.)
* `kalai-agent.modelName`: AI model to use for code assistance

## Development Resources

- [Development Guide](DEVELOPMENT.md) - Detailed instructions for setup, running, and testing
- `setup.js` - Automated setup script for initializing the project
- [VS Code Extension API](https://code.visualstudio.com/api) - Official VS Code extension documentation

## Known Issues

- This is an experimental extension and may have limitations in understanding complex code structures
- Performance depends on the selected AI model and endpoint

## Release Notes

### 0.1.0

- Initial release with basic chat and code editing functionality

## Future Plans

- Self-hosted model support via Ollama or LM Studio
- Improved multi-file context awareness
- Code completion suggestions
- Custom prompt templates

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by tools like GitHub Copilot and Blackbox
- Powered by open-source AI models