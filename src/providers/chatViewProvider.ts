import * as vscode from 'vscode';
import { getWebviewContent } from '../utils/getWebviewContent';
import { AIService } from '../services/aiService';
import { ChatHistoryService } from '../services/chatHistoryService';
import { CodeContextManager, ProjectContext, FileContext } from '../services/codeContextManager';
import { ContextSelectorService } from '../services/contextSelectorService';
import { AIRequestContext } from '../types/aiTypes';

interface ChatViewState {
  messages: any[];
  lastUpdate?: number;
}

interface WebviewMessage {
  command: string;
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
  private static _persistedState: ChatViewState;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {
    this._aiService = new AIService();
    this._contextSelector = new ContextSelectorService();
    this._historyService = new ChatHistoryService(this._context);
    this._codeContextManager = new CodeContextManager();

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
      localResourceRoots: [this._extensionUri]
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

  private convertToAIContext(projectContext: ProjectContext): AIRequestContext {
    return {
      files: projectContext.files || [],
      dependencies: projectContext.dependencies,
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
      switch (message.command) {
        case 'sendMessage':
          const projectContext = message.text.includes('@context') ?
            await this._codeContextManager.getFullContext() :
            this._codeContextManager.getRelevantContext(message.text);

          const aiContext = this.convertToAIContext(projectContext);
          const response = await this._aiService.sendMessage(message.text || '', aiContext);

          this.updateState({
            messages: [...this._state.messages, { text: message.text, type: 'user' }, { text: response, type: 'ai' }]
          });
          webviewView.webview.postMessage({
            command: 'receiveMessage',
            text: response,
            isError: false
          });
          break;

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

        case 'clearChat':
          this.updateState({
            messages: [{
              text: "Chat cleared! How else can I help you?",
              type: "ai",
              timestamp: Date.now()
            }]
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

  public sendMessage(message: string) {
    if (this._view) {
      this._view.webview.postMessage({
        command: 'receiveMessage',
        text: message,
        isError: false
      });
    }
  }
}