# KalAI Agent Demo Files

This directory contains demo files to help you test and explore the capabilities of the KalAI Agent VS Code extension.

## Contents

- **index.html**: A simple HTML page with JavaScript functions that you can use to test the "Edit with AI" feature
- **complex-example.js**: A more complex JavaScript file with classes and design patterns to test the AI chat interface

## How to Use These Demos

### Testing "Edit with AI" with index.html

1. Open `index.html` in VS Code
2. Select one of the JavaScript functions in the file
3. Right-click and select "KalAI: Edit with AI" from the context menu
4. Enter an instruction like "Add error handling" or "Optimize this code"
5. Review the AI's suggested changes
6. Click the "Run Demo" button to see the functions in action

### Testing the Chat Interface with complex-example.js

1. Open `complex-example.js` in VS Code
2. Click on the KalAI Agent icon in the Activity Bar to open the chat interface
3. Use the "Get File Context" button to include the file in your conversation
4. Ask questions about the code, such as:
   - "Explain how the UserManager class works"
   - "What design patterns are used in this code?"
   - "How could I improve the error handling in the fetchUserData function?"
   - "What's the purpose of the debounce function?"

## Example Workflows

### Workflow 1: Code Refactoring

1. Open `index.html`
2. Select the `calculateFactorial` function
3. Use "Edit with AI" with the prompt: "Refactor this to use recursion instead of a loop"
4. Apply the changes
5. Run the demo to verify it still works correctly

### Workflow 2: Code Understanding

1. Open `complex-example.js`
2. Open the KalAI Agent chat interface
3. Ask: "Can you explain the caching mechanism in the ApiService class?"
4. Follow up with: "How could this be improved for better performance?"

### Workflow 3: Adding Features

1. Open `index.html`
2. Select all three functions
3. Use "Edit with AI" with the prompt: "Add a timing feature that logs how long each function takes to execute"
4. Apply the changes
5. Run the demo to see the timing information

## Tips for Effective Testing

- Be specific in your instructions to get better results
- Try different types of requests (optimization, documentation, refactoring, etc.)
- Compare the AI's responses to your own understanding of the code
- Use the chat interface to ask follow-up questions if the AI's response isn't clear
- Experiment with different file types and programming paradigms

## Extending the Demos

Feel free to modify these demo files or add your own to test different aspects of the KalAI Agent extension. The more diverse the code examples, the better you can evaluate the AI's capabilities.