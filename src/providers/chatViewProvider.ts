import * as vscode from 'vscode';
import * as path from 'path';
import { getWebviewContent } from '../utils/getWebviewContent';
import { AIService } from '../services/aiService';
import { ChatHistoryService } from '../services/chatHistoryService';
import { CodeContextManager, ProjectContext, FileContext } from '../services/codeContextManager';
import { ContextSelectorService } from '../services/contextService';
import { FileSearchService } from '../services/fileSearchService';
import { WebSearchService } from '../services/webSearchService';
import { AIRequestContext } from '../types/aiTypes';

interface ChatViewState {
  messages: any[];
  lastUpdate?: number;
}

interface WebviewMessage {
  type: string;
  data?: any;
  command?: string;
  text?: string;
  context?: AIRequestContext;
  state?: any;
}

export class ChatViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _aiService: AIService;
  private _state: ChatViewState;
  private readonly _historyService: ChatHistoryService;
  private readonly _codeContextManager: CodeContextManager;
  private readonly _contextSelector: ContextSelectorService;
  private readonly _fileSearchService: FileSearchService;
  private readonly _webSearchService: WebSearchService;
  private static _persistedState: ChatViewState;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext,
    aiService?: AIService
  ) {
    this._aiService = aiService || new AIService();
    this._contextSelector = new ContextSelectorService();
    this._historyService = new ChatHistoryService(this._context);
    this._codeContextManager = new CodeContextManager();
    this._fileSearchService = new FileSearchService();
    this._webSearchService = new WebSearchService();

    // Initialize or restore state
    if (!ChatViewProvider._persistedState) {
      ChatViewProvider._persistedState = {
        messages: [{
          text: "👋 Hi! I'm kalai. How can I help you with your code today?",
          type: "ai",
          timestamp: Date.now()
        }]
      };
    }
    this._state = ChatViewProvider._persistedState;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    console.log('Resolving webview view...');
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
      enableCommandUris: true,
      enableForms: true
    };

    // Initialize state with logging
    console.log('Initializing chat state...');
    this._state = ChatViewProvider._persistedState;

    const html = getWebviewContent(webviewView.webview, this._extensionUri);
    console.log('Setting webview HTML...');
    webviewView.webview.html = html;

    // Send initial state to webview
    webviewView.webview.postMessage({
      command: 'restoreState',
      state: this._state
    });

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
      try {
        await this.handleMessage(message, webviewView);
      } catch (error) {
        webviewView.webview.postMessage({
          command: 'receiveMessage',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          isError: true
        });
      }
    });
  }

  private updateState(partialState: Partial<ChatViewState>) {
    this._state = { ...this._state, ...partialState, lastUpdate: Date.now() };
    // Update persisted state
    ChatViewProvider._persistedState = this._state;

    if (this._view) {
      // Update webview state
      this._view.webview.postMessage({
        command: 'updateState',
        state: this._state
      });
    }
  }

  private async handleFileContext(webviewView: vscode.WebviewView) {
    try {
      const contextSelection = await this._contextSelector.showContextPicker();
      if (!contextSelection) {
        webviewView.webview.postMessage({
          command: 'fileContext',
          text: 'No context selected.',
          isError: true
        });
        return;
      }

      const projectContext = await this._codeContextManager.getContextFromSelection(contextSelection);

      // Create AIRequestContext with the required currentFile property
      const aiContext: AIRequestContext = this.convertToAIContext(projectContext);

      const formattedContext = this.formatContextForDisplay(projectContext);

      webviewView.webview.postMessage({
        command: 'fileContext',
        text: formattedContext,
        fileName: aiContext.currentFile.fileName,
        languageId: aiContext.currentFile.languageId,
        context: aiContext
      });
    } catch (error) {
      console.error('Error getting file context:', error);
      webviewView.webview.postMessage({
        command: 'fileContext',
        text: 'Error getting file context.',
        isError: true
      });
    }
  }

  private formatContextForDisplay(context: ProjectContext): string {
    let output = '';

    if (context.activeFile) {
      output += `Active File: ${context.activeFile.path}\n`;
      output += `Language: ${context.activeFile.language}\n\n`;
      output += `Content:\n${context.activeFile.content}\n\n`;
    }

    if (context.files && context.files.length > 0) {
      output += 'Related Files:\n';
      context.files.forEach((file: FileContext) => {
        output += `- ${file.path}\n`;
      });
      output += '\n';
    }

    if (context.dependencies) {
      output += 'Project Dependencies:\n';
      Object.entries(context.dependencies)
        .slice(0, 5)
        .forEach(([dep, version]) => {
          output += `${dep}: ${version}\n`;
        });
      output += '\n';
    }

    return output;
  }

  private convertToAIContext(projectContext: ProjectContext | null | undefined): AIRequestContext {
    // Handle null/undefined projectContext
    if (!projectContext) {
      return {
        files: [],
        dependencies: {},
        activeFile: undefined,
        detectedFramework: undefined,
        currentFile: {
          fileName: '',
          languageId: 'plaintext',
          filePath: '',
          instruction: undefined
        }
      };
    }

    return {
      files: projectContext.files || [],
      dependencies: projectContext.dependencies || {},
      activeFile: projectContext.activeFile,
      detectedFramework: projectContext.detectedFramework,
      currentFile: {
        fileName: projectContext.activeFile?.path || '',
        languageId: projectContext.activeFile?.language || 'plaintext',
        filePath: projectContext.activeFile?.path || '',
        instruction: undefined
      }
    };
  }

  private async handleMessage(message: any, webviewView: vscode.WebviewView) {
    try {
      // Handle new message format
      const messageType = message.type || message.command;

      switch (messageType) {
        case 'sendMessage':
          await this.handleSendMessage(message, webviewView);
          break;

        case 'modeChanged':
          // Handle mode change (chat vs coding)
          webviewView.webview.postMessage({
            type: 'modeChangeConfirmed',
            data: { mode: message.data.mode }
          });
          break;

        case 'getContext':
          await this.handleGetContext(webviewView);
          break;

        case 'refreshContext':
          await this.handleRefreshContext(webviewView);
          break;

        case 'getFileList':
          await this.handleGetFileList(webviewView);
          break;

        case 'addCurrentFile':
          await this.handleAddCurrentFile(webviewView);
          break;

        case 'openFile':
          const filePath = message.data?.path || message.path;
          if (filePath) {
            await this.handleOpenFile(filePath);
          }
          break;

        case 'showFilePreview':
          await this.handleShowFilePreview(message.data.path, webviewView);
          break;

        case 'exportContext':
          await this.handleExportContext(message.data.context);
          break;

        case 'regenerateResponse':
          await this.handleRegenerateResponse(message.data.messageId, webviewView, message.data);
          break;

        case 'codeAction':
          await this.handleCodeAction(message.data, webviewView);
          break;

        case 'clearConversation':
        case 'clearChat':
          this.handleClearConversation(webviewView);
          break;

        case 'webviewReady':
          // Send initial context when webview is ready
          await this.handleWebviewReady(webviewView);
          break;

        // Legacy support
        case 'getFileContext':
          this.handleFileContext(webviewView);
          break;

        case 'saveState':
          this.updateState(message.state);
          break;

        case 'getHistory':
          const sessions = await this._historyService.getSessions();
          webviewView.webview.postMessage({
            command: 'historyResponse',
            history: sessions
          });
          break;

        case 'saveToHistory':
          if (message.messages?.length > 1) {
            await this._historyService.addSession(message.messages);
          }
          break;

        case 'loadChatSession':
          const allSessions = await this._historyService.getSessions();
          const session = allSessions.find(s => s.id === message.sessionId);
          if (session) {
            webviewView.webview.postMessage({
              command: 'restoreState',
              state: { messages: session.messages }
            });
          }
          break;



        case 'getProjectInfo':
          const projectInfo = await this._fileSearchService.getProjectStructure();
          webviewView.webview.postMessage({
            command: 'projectInfo',
            data: projectInfo
          });
          break;

        case 'searchInFiles':
          const searchResults = await this._fileSearchService.searchInFiles(message.query);
          webviewView.webview.postMessage({
            command: 'searchResults',
            data: searchResults
          });
          break;



        case 'runTool':
          const toolResult = await this.handleToolExecution(message.toolId, message.action);
          webviewView.webview.postMessage({
            command: 'toolResult',
            toolId: message.toolId,
            result: toolResult
          });
          break;

        case 'webSearch':
          const webSearchResult = await this._webSearchService.searchTechnicalInfo(message.query);
          webviewView.webview.postMessage({
            command: 'webSearchResult',
            data: webSearchResult
          });
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      webviewView.webview.postMessage({
        command: 'receiveMessage',
        text: 'An error occurred while processing your request.',
        isError: true
      });
    }
  }

  private async handleToolExecution(toolId: string, action: string): Promise<any> {
    try {
      switch (action) {
        case 'analyzeCodebase':
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (workspaceFolders) {
            return await this._aiService.analyzeCodebase(workspaceFolders[0].uri.fsPath);
          }
          return 'No workspace folder found';

        case 'findIssues':
          const projectContext = await this._codeContextManager.getFullContext();
          const aiContext = this.convertToAIContext(projectContext);
          return await this._aiService.sendMessage(
            'Analyze this code for potential issues, bugs, and code smells. Provide specific recommendations.',
            aiContext
          );

        case 'generateDocs':
          const fullContext = await this._codeContextManager.getFullContext();
          const docContext = this.convertToAIContext(fullContext);
          return await this._aiService.sendMessage(
            'Generate comprehensive documentation for this project including API docs, README, and code comments.',
            docContext
          );

        case 'optimizeCode':
          const optimizeContext = await this._codeContextManager.getFullContext();
          const optContext = this.convertToAIContext(optimizeContext);
          return await this._aiService.sendMessage(
            'Analyze this code for performance optimizations and suggest improvements.',
            optContext
          );

        case 'refactorSuggestions':
          const refactorContext = await this._codeContextManager.getFullContext();
          const refContext = this.convertToAIContext(refactorContext);
          return await this._aiService.sendMessage(
            'Suggest refactoring opportunities to improve code structure, maintainability, and readability.',
            refContext
          );

        case 'analyzeDependencies':
          const depContext = await this._codeContextManager.getFullContext();
          if (depContext.dependencies) {
            let analysis = 'Dependency Analysis:\n\n';
            for (const [dep, version] of Object.entries(depContext.dependencies)) {
              const versionInfo = await this._webSearchService.getLatestVersionInfo(dep);
              if (versionInfo) {
                analysis += `${dep}: ${version} (Latest: ${versionInfo.version})\n`;
              }
            }
            return analysis;
          }
          return 'No dependencies found';

        case 'securityAudit':
          const secContext = await this._codeContextManager.getFullContext();
          const secAiContext = this.convertToAIContext(secContext);
          return await this._aiService.sendMessage(
            'Perform a security audit of this code. Check for vulnerabilities, security best practices, and potential security issues.',
            secAiContext
          );

        case 'testCoverage':
          const testContext = await this._codeContextManager.getFullContext();
          const testFiles = await this._fileSearchService.searchInFiles('test', '**/*.{test,spec}.{js,ts,jsx,tsx}');
          return `Test Coverage Analysis:\n\nFound ${testFiles.length} test files.\n\nSuggestions:\n- Add unit tests for core functions\n- Implement integration tests\n- Consider end-to-end testing`;

        case 'performanceAnalysis':
          const perfContext = await this._codeContextManager.getFullContext();
          const perfAiContext = this.convertToAIContext(perfContext);
          return await this._aiService.sendMessage(
            'Analyze this code for performance bottlenecks and suggest optimizations.',
            perfAiContext
          );

        case 'codeComplexity':
          const complexityContext = await this._codeContextManager.getFullContext();
          let complexityReport = 'Code Complexity Analysis:\n\n';

          for (const file of complexityContext.files) {
            if (file.analysis) {
              complexityReport += `${file.relativePath}:\n`;
              complexityReport += `  - Cyclomatic Complexity: ${file.analysis.cyclomaticComplexity}\n`;
              complexityReport += `  - Lines of Code: ${file.analysis.linesOfCode}\n`;
              complexityReport += `  - Maintainability Index: ${file.analysis.maintainabilityIndex}\n`;
              complexityReport += `  - Code Quality: ${file.analysis.codeQuality}%\n\n`;
            }
          }

          return complexityReport;

        case 'webSearch':
          return await this._webSearchService.searchTechnicalInfo('latest best practices for current project');

        case 'apiIntegration':
          const apiContext = await this._codeContextManager.getFullContext();
          const apiAiContext = this.convertToAIContext(apiContext);
          return await this._aiService.sendMessage(
            'Help with API integration. Suggest best practices for API design, error handling, and documentation.',
            apiAiContext
          );

        default:
          return `Tool ${toolId} not implemented yet`;
      }
    } catch (error) {
      console.error(`Error executing tool ${toolId}:`, error);
      return `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  public sendMessage(message: string) {
    if (this._view) {
      this._view.webview.postMessage({
        command: 'receiveMessage',
        text: message,
        isError: false
      });
    }
  }

  // New enhanced message handlers
  private async handleSendMessage(message: any, webviewView: vscode.WebviewView) {
    console.log('Received sendMessage:', message);

    // Safely extract data with null checks
    const messageData = message.data || {};
    const { text, message: messageText, mode, files, context } = messageData;
    const userMessage = text || messageText;

    // Validate required data
    if (!userMessage || typeof userMessage !== 'string') {
      console.error('Invalid message data:', message);
      webviewView.webview.postMessage({
        type: 'assistantResponse',
        data: {
          content: 'Error: Invalid message format received.',
          type: 'error'
        }
      });
      return;
    }

    console.log('Processing message:', userMessage);

    try {
      // Get project context based on mode and files
      let projectContext: ProjectContext | null = null;

      try {
        if (files && Array.isArray(files) && files.length > 0) {
          // Use specific files as context
          const validPaths = files
            .filter((f: any) => f && typeof f.path === 'string')
            .map((f: any) => f.path);

          if (validPaths.length > 0) {
            projectContext = await this._codeContextManager.getContextFromSelection({
              type: 'file',
              paths: validPaths
            });
          }
        } else if (mode === 'coding') {
          // Get current file context for coding mode
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor) {
            projectContext = await this._codeContextManager.getContextFromSelection({
              type: 'file',
              paths: [activeEditor.document.uri.fsPath]
            });
          }
        }

        // Fallback to full context if no specific context was obtained
        if (!projectContext) {
          projectContext = await this._codeContextManager.getFullContext();
        }
      } catch (contextError) {
        console.error('Error getting project context:', contextError);
        // Use empty context as fallback
        projectContext = null;
      }

      const aiContext = this.convertToAIContext(projectContext);

      // Provide immediate response with code editing capabilities
      let response: string;
      try {
        // Try AI service first, but with timeout
        const aiPromise = this._aiService.sendMessage(userMessage, aiContext);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI service timeout')), 10000)
        );

        response = await Promise.race([aiPromise, timeoutPromise]);
      } catch (aiError) {
        console.error('AI Service error:', aiError);
        // Provide intelligent fallback response based on message content
        response = this.generateIntelligentFallback(userMessage, aiContext);
      }

      console.log('Sending response:', response);

      // Generate sample code actions for demonstration
      let codeActions: any[] = [];
      try {
        codeActions = this.generateSampleCodeActions(userMessage, aiContext);
      } catch (actionError) {
        console.error('Error generating code actions:', actionError);
        codeActions = [];
      }

      // Send response back to webview
      try {
        webviewView.webview.postMessage({
          type: 'assistantResponse',
          data: {
            content: response,
            type: 'text',
            codeActions: codeActions,
            metadata: {
              files: Array.isArray(files) ? files.map((f: any) => f?.path).filter(Boolean) : [],
              mode: mode
            }
          }
        });
      } catch (postError) {
        console.error('Error posting message to webview:', postError);
      }

    } catch (error) {
      webviewView.webview.postMessage({
        type: 'assistantResponse',
        data: {
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error'
        }
      });
    }
  }

  private generateIntelligentFallback(userMessage: string, aiContext: any): string {
    const message = userMessage.toLowerCase();

    // Check for specific error types
    if (message.includes('rate limit') || message.includes('429')) {
      return `⚠️ **Rate Limit Reached**

The AI service is currently rate-limited. This is a temporary issue that will resolve automatically.

**What you can do:**
- Wait a few minutes and try again
- The extension will automatically retry with exponential backoff
- Consider using a different model if available in settings

**Current Status:** The extension is working but the AI model has usage limits.`;
    }

    if (message.includes('token') || message.includes('400')) {
      return `⚠️ **Token Limit Exceeded**

Your request contains too much text for the AI model to process at once.

**What you can do:**
- Try breaking your request into smaller parts
- The extension will automatically truncate long messages
- Consider asking about specific files rather than the entire codebase

**Current Status:** The extension is working but needs shorter inputs.`;
    }

    // Detect code editing requests
    if (message.includes('fix') || message.includes('error') || message.includes('bug')) {
      return this.generateFixSuggestion(userMessage, aiContext);
    }

    if (message.includes('refactor') || message.includes('improve') || message.includes('optimize')) {
      return this.generateRefactorSuggestion(userMessage, aiContext);
    }

    if (message.includes('explain') || message.includes('what') || message.includes('how')) {
      return this.generateExplanation(userMessage, aiContext);
    }

    if (message.includes('create') || message.includes('generate') || message.includes('add')) {
      return this.generateCodeSuggestion(userMessage, aiContext);
    }

    // Default helpful response
    return `I understand you're asking: "${userMessage}"

I'm currently experiencing connectivity issues with the AI service, but I can still help you! Here are some things I can assist with:

## Code Analysis & Fixes
- Identify and fix syntax errors
- Suggest performance improvements
- Code refactoring recommendations

## Code Generation
- Create new functions and classes
- Generate boilerplate code
- Add missing imports and dependencies

## Project Insights
- Analyze your codebase structure
- Identify potential issues
- Suggest best practices

## Quick Actions
Try asking me to:
- "Fix the errors in this file"
- "Explain this function"
- "Refactor this code"
- "Create a new component"

**Note:** I'm working to restore full AI capabilities. In the meantime, I can provide code analysis based on your project structure.`;
  }

  private generateFixSuggestion(userMessage: string, aiContext: any): string {
    const activeFile = aiContext?.activeFile;

    if (activeFile) {
      return `## 🔧 Code Fix Analysis

I'm analyzing your request: "${userMessage}"

**File:** \`${activeFile.relativePath}\`
**Language:** ${activeFile.language}

### Common Fix Strategies:

1. **Syntax Errors**
   - Check for missing semicolons, brackets, or quotes
   - Verify proper indentation
   - Ensure all imports are correct

2. **Type Errors** (if TypeScript/JavaScript)
   - Add proper type annotations
   - Check variable declarations
   - Verify function signatures

3. **Logic Errors**
   - Review conditional statements
   - Check loop conditions
   - Validate variable scope

### Quick Actions Available:
- **Apply Fix**: I can suggest specific code changes
- **Explain Error**: Get detailed error explanations
- **Best Practices**: Learn how to prevent similar issues

Would you like me to analyze a specific error message or code snippet?`;
    }

    return `## 🔧 Error Fix Assistant

I can help you fix errors! To provide the best assistance:

1. **Share the error message** - Copy the exact error text
2. **Show the problematic code** - Highlight the specific lines
3. **Describe what you're trying to achieve** - Your intended outcome

### Common Fix Categories:
- **Syntax Errors** - Missing brackets, semicolons, quotes
- **Import/Export Issues** - Module resolution problems
- **Type Errors** - TypeScript type mismatches
- **Runtime Errors** - Logic and execution issues

I'll provide specific code fixes with **Apply** and **Revert** options once the AI service is restored.`;
  }

  private generateRefactorSuggestion(userMessage: string, aiContext: any): string {
    return `## Code Refactoring Assistant

I can help refactor your code for better:
- **Performance** - Optimize algorithms and data structures
- **Readability** - Improve code clarity and organization
- **Maintainability** - Make code easier to update and extend
- **Best Practices** - Follow modern coding standards

### Refactoring Techniques:
1. **Extract Functions** - Break down large functions
2. **Rename Variables** - Use descriptive names
3. **Remove Duplication** - DRY principle
4. **Simplify Logic** - Reduce complexity
5. **Update Patterns** - Modern language features

### Next Steps:
1. Select the code you want to refactor
2. I'll analyze and suggest improvements
3. Review changes with **Apply All** / **Revert** options

*Note: Full refactoring capabilities will be available once AI service is restored.*`;
  }

  private generateExplanation(userMessage: string, aiContext: any): string {
    return `## Code Explanation

I can explain:
- **Functions and Classes** - How they work and their purpose
- **Algorithms** - Step-by-step logic breakdown
- **Design Patterns** - Architecture and best practices
- **Framework Features** - Library-specific functionality

### Analysis Available:
- Code complexity metrics
- Dependency relationships
- Performance characteristics
- Security considerations

### Learning Resources:
- Interactive code examples
- Best practice recommendations
- Common pitfalls to avoid

Share the specific code or concept you'd like explained, and I'll provide detailed insights!`;
  }

  private generateCodeSuggestion(userMessage: string, aiContext: any): string {
    return `## ✨ Code Generation Assistant

I can help create:
- **Functions & Methods** - Custom logic implementation
- **Classes & Components** - Object-oriented structures
- **Configuration Files** - Setup and config templates
- **Test Cases** - Unit and integration tests
- **Documentation** - Comments and README files

### Generation Features:
- **Smart Templates** - Based on your project structure
- **Best Practices** - Following coding standards
- **Type Safety** - Proper TypeScript types
- **Error Handling** - Robust error management

### To Generate Code:
1. Describe what you need
2. Specify the programming language
3. Mention any specific requirements
4. I'll provide complete, ready-to-use code

*Full code generation with **Apply All** functionality coming soon!*`;
  }

  private generateSampleCodeActions(userMessage: string, aiContext: any): any[] {
    try {
      const message = userMessage?.toLowerCase() || '';
      const actions: any[] = [];

      // Get current active file for context
      let currentFile: string | undefined;
      try {
        const activeEditor = vscode.window.activeTextEditor;
        currentFile = activeEditor?.document.uri.fsPath;
      } catch (editorError) {
        console.warn('Could not get active editor:', editorError);
        currentFile = undefined;
      }

      if (message.includes('fix') || message.includes('error') || message.includes('bug')) {
        actions.push({
          id: 'fix-error-1',
          label: 'Apply Error Fix',
          type: 'apply',
          code: '// Fixed code will be generated here\nconsole.log("Error fixed!");',
          filePath: currentFile || 'current-file.js',
          startLine: 0,
          endLine: 0
        });

        actions.push({
          id: 'explain-error-1',
          label: 'Explain Error',
          type: 'explain'
        });
      }

      if (message.includes('refactor') || message.includes('improve') || message.includes('optimize')) {
        actions.push({
          id: 'apply-refactor-1',
          label: 'Apply Refactoring',
          type: 'apply',
          code: '// Refactored code will be generated here\nfunction improvedFunction() {\n  return "Better implementation";\n}',
          filePath: currentFile || 'current-file.js'
        });

        actions.push({
          id: 'improve-code-1',
          label: 'Suggest Improvements',
          type: 'improve'
        });
      }

      if (message.includes('create') || message.includes('generate') || message.includes('add')) {
        actions.push({
          id: 'apply-generation-1',
          label: 'Apply Generated Code',
          type: 'apply',
          code: '// Generated code will be created here\nfunction newFunction() {\n  // Implementation\n}',
          filePath: currentFile || 'new-file.js'
        });
      }

      // Always add explain and improve options for assistant responses
      if (actions.length === 0) {
        actions.push({
          id: 'explain-response-1',
          label: 'Explain This Response',
          type: 'explain'
        });

        actions.push({
          id: 'improve-suggestion-1',
          label: 'Get More Suggestions',
          type: 'improve'
        });
      }

      // Add revert option if there are apply actions
      if (actions.some(a => a.type === 'apply')) {
        actions.push({
          id: 'revert-changes-1',
          label: 'Revert Last Change',
          type: 'revert'
        });
      }

      return actions;
    } catch (error) {
      console.error('Error in generateSampleCodeActions:', error);
      return [];
    }
  }

  private async handleCodeAction(actionData: any, webviewView: vscode.WebviewView) {
    try {
      console.log('Handling code action:', actionData);

      switch (actionData.action) {
        case 'apply':
          await this.applyCodeChange(actionData);
          break;
        case 'revert':
          await this.revertCodeChange(actionData);
          break;
        case 'explain':
          await this.explainCode(actionData, webviewView);
          break;
        case 'improve':
          await this.improveCode(actionData, webviewView);
          break;
        default:
          console.warn('Unknown code action:', actionData.action);
      }

      // Send confirmation back to webview
      webviewView.webview.postMessage({
        type: 'codeActionComplete',
        data: {
          actionId: actionData.actionId,
          action: actionData.action,
          success: true
        }
      });

    } catch (error) {
      console.error('Error handling code action:', error);
      webviewView.webview.postMessage({
        type: 'codeActionComplete',
        data: {
          actionId: actionData.actionId,
          action: actionData.action,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  private async applyCodeChange(actionData: any) {
    if (!actionData.filePath || !actionData.code) {
      throw new Error('Missing file path or code for apply action');
    }

    try {
      const uri = vscode.Uri.file(actionData.filePath);
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document);

      if (actionData.startLine !== undefined && actionData.endLine !== undefined) {
        // Replace specific lines with bounds checking
        const maxLine = document.lineCount - 1;
        const startLine = Math.max(0, Math.min(actionData.startLine, maxLine));
        const endLine = Math.max(0, Math.min(actionData.endLine, maxLine));

        const startPos = new vscode.Position(startLine, 0);
        const endLineText = document.lineAt(endLine).text;
        const endPos = new vscode.Position(endLine, endLineText.length);
        const range = new vscode.Range(startPos, endPos);

        await editor.edit(editBuilder => {
          editBuilder.replace(range, actionData.code);
        });
      } else {
        // Insert at current cursor position or end of file
        const position = editor.selection.active;
        await editor.edit(editBuilder => {
          editBuilder.insert(position, actionData.code);
        });
      }

      vscode.window.showInformationMessage(`Code applied successfully to ${actionData.filePath.split('/').pop()}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to apply code: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async revertCodeChange(actionData: any) {
    // For now, just show undo command
    await vscode.commands.executeCommand('undo');
    vscode.window.showInformationMessage('Last change reverted');
  }

  private async explainCode(actionData: any, webviewView: vscode.WebviewView) {
    const explanation = `## Code Explanation

**Action:** ${actionData.label}

This code action would help you understand the selected code better. Here's what it does:

- **Purpose**: Provides detailed explanation of code functionality
- **Benefits**: Helps you learn and understand complex logic
- **Usage**: Select code and click "Explain" for detailed breakdown

*Full explanation capabilities will be available once AI service is restored.*`;

    webviewView.webview.postMessage({
      type: 'assistantResponse',
      data: {
        content: explanation,
        type: 'text'
      }
    });
  }

  private async improveCode(actionData: any, webviewView: vscode.WebviewView) {
    const improvement = `## Code Improvement Suggestions

**Action:** ${actionData.label}

Here are some ways to improve your code:

### Performance Optimizations
- Use efficient algorithms and data structures
- Minimize unnecessary computations
- Implement proper caching strategies

### 📖 Readability Improvements
- Use descriptive variable and function names
- Add meaningful comments
- Follow consistent formatting

### Best Practices
- Handle errors gracefully
- Follow SOLID principles
- Write unit tests

*Specific improvement suggestions will be available once AI service is restored.*`;

    webviewView.webview.postMessage({
      type: 'assistantResponse',
      data: {
        content: improvement,
        type: 'text'
      }
    });
  }

  private async handleGetContext(webviewView: vscode.WebviewView) {
    try {
      const projectContext = await this._codeContextManager.getFullContext();

      webviewView.webview.postMessage({
        type: 'contextData',
        data: {
          projectStructure: projectContext.projectStructure,
          files: projectContext.files.map(f => ({
            relativePath: f.relativePath,
            language: f.language
          })),
          dependencies: projectContext.dependencies,
          buildConfig: projectContext.buildConfig,
          gitInfo: projectContext.gitInfo,
          detectedFramework: projectContext.detectedFramework
        }
      });
    } catch (error) {
      console.error('Error getting context:', error);
    }
  }

  private async handleRefreshContext(webviewView: vscode.WebviewView) {
    // Get fresh context (no cache clearing method available)
    await this.handleGetContext(webviewView);
  }

  private async handleGetFileList(webviewView: vscode.WebviewView) {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        return;
      }

      // Get files using VS Code's workspace API
      const filePattern = '**/*.{ts,js,tsx,jsx,py,java,vue,html,css,json}';
      const files = await vscode.workspace.findFiles(filePattern, '**/node_modules/**', 100);

      const fileReferences = files.map(uri => {
        const filePath = uri.fsPath;
        const fileName = path.basename(filePath);
        const extension = path.extname(filePath);

        return {
          path: filePath,
          name: fileName,
          language: this.getLanguageFromExtension(extension),
          isActive: false
        };
      });

      webviewView.webview.postMessage({
        type: 'fileListResponse',
        data: { files: fileReferences }
      });
    } catch (error) {
      console.error('Error getting file list:', error);
    }
  }

  private async handleAddCurrentFile(webviewView: vscode.WebviewView) {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return;
    }

    const document = activeEditor.document;
    const selection = activeEditor.selection;

    try {
      const fileReference = {
        path: document.uri.fsPath,
        name: document.fileName.split('/').pop() || document.fileName,
        language: document.languageId,
        content: document.getText(),
        lineRange: selection.isEmpty ? undefined : {
          start: selection.start.line + 1,
          end: selection.end.line + 1
        },
        isActive: true
      };

      webviewView.webview.postMessage({
        type: 'fileAdded',
        data: fileReference
      });
    } catch (error) {
      console.error('Error adding current file:', error);
    }
  }

  private async handleOpenFile(filePath: string) {
    try {
      // Sanitize file path - decode URI components and normalize
      let cleanPath = filePath;

      // Decode URL encoding
      try {
        cleanPath = decodeURIComponent(filePath);
      } catch (decodeError) {
        console.warn('Could not decode file path:', filePath);
      }

      // Remove duplicate path segments
      cleanPath = cleanPath.replace(/([^:])\/\/+/g, '$1/');

      // Handle Windows paths
      if (process.platform === 'win32') {
        cleanPath = cleanPath.replace(/\//g, '\\');
      }

      console.log('Opening file:', cleanPath);
      const uri = vscode.Uri.file(cleanPath);
      await vscode.window.showTextDocument(uri);
    } catch (error) {
      console.error('Error opening file:', error);
      vscode.window.showErrorMessage(`Failed to open file: ${filePath}`);
    }
  }

  private async handleShowFilePreview(filePath: string, webviewView: vscode.WebviewView) {
    try {
      const uri = vscode.Uri.file(filePath);
      const document = await vscode.workspace.openTextDocument(uri);

      webviewView.webview.postMessage({
        type: 'filePreview',
        data: {
          path: filePath,
          content: document.getText(),
          language: document.languageId
        }
      });
    } catch (error) {
      console.error('Error showing file preview:', error);
    }
  }

  private async handleExportContext(contextData: any) {
    try {
      const content = JSON.stringify(contextData, null, 2);
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file('project-context.json'),
        filters: {
          'JSON files': ['json']
        }
      });

      if (uri) {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
        vscode.window.showInformationMessage('Context exported successfully!');
      }
    } catch (error) {
      console.error('Error exporting context:', error);
      vscode.window.showErrorMessage('Failed to export context');
    }
  }

  private async handleRegenerateResponse(messageId: string, webviewView: vscode.WebviewView, data?: any) {
    try {
      // Get the original message from the data passed by the frontend
      const originalMessage = data?.originalMessage;
      const context = data?.context;

      if (!originalMessage) {
        webviewView.webview.postMessage({
          command: 'receiveMessage',
          text: 'Unable to regenerate response: original message not found.',
          isError: true
        });
        return;
      }

      // Show regenerating indicator
      webviewView.webview.postMessage({
        command: 'streamingUpdate',
        content: '',
        messageId: `regenerated_${Date.now()}`
      });

      // Get current context for regeneration
      const projectContext = await this._codeContextManager.getFullContext();
      const aiContext: AIRequestContext = this.convertToAIContext(projectContext);

      // Add regeneration instruction to make the response different
      const regenerationPrompt = `${originalMessage}\n\n[Please provide an alternative response with a different approach or perspective]`;

      // Generate new response
      const response = await this._aiService.sendMessage(regenerationPrompt, aiContext);

      // Send the regenerated response
      webviewView.webview.postMessage({
        command: 'receiveMessage',
        text: response,
        type: 'ai',
        timestamp: Date.now(),
        isRegenerated: true
      });

      // Complete streaming
      webviewView.webview.postMessage({
        command: 'streamingComplete',
        messageId: `regenerated_${Date.now()}`
      });

    } catch (error) {
      console.error('Error regenerating response:', error);
      webviewView.webview.postMessage({
        command: 'receiveMessage',
        text: `Error regenerating response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isError: true
      });
    }
  }

  private handleClearConversation(webviewView: vscode.WebviewView) {
    this.updateState({
      messages: [{
        text: "👋 Hi! I'm Kalai Agent. How can I help you with your code today?",
        type: "ai",
        timestamp: Date.now()
      }]
    });

    webviewView.webview.postMessage({
      type: 'clearConversation',
      data: {}
    });
  }

  private async handleWebviewReady(webviewView: vscode.WebviewView) {
    // Send initial context and state when webview is ready
    await this.handleGetContext(webviewView);

    webviewView.webview.postMessage({
      type: 'webviewInitialized',
      data: {
        state: this._state,
        ready: true
      }
    });
  }

  private getLanguageFromExtension(extension: string): string {
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.vue': 'vue',
      '.html': 'html',
      '.css': 'css',
      '.json': 'json',
      '.md': 'markdown',
      '.yml': 'yaml',
      '.yaml': 'yaml'
    };
    return languageMap[extension] || 'text';
  }
}