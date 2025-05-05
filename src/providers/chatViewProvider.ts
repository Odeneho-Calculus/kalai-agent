import * as vscode from 'vscode';
import { getWebviewContent } from '../utils/getWebviewContent';
import { AIService } from '../services/aiService';

interface ChatViewState {
  messages: any[];
  lastUpdate?: number;
}

interface WebviewMessage {
  command: string;
  text?: string;
  context?: any;
  state?: any;
}

export class ChatViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _aiService: AIService;
  private _state: ChatViewState;

  constructor(private readonly _extensionUri: vscode.Uri) {
    this._aiService = new AIService();
    this._state = { messages: [] };
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
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
    this._state = {
      messages: [{
        text: "👋 Hi! I'm KalAI. How can I help you with your code today?",
        type: "ai"
      }]
    };

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
        switch (message.command) {
          case 'sendMessage':
            const response = await this._aiService.sendMessage(message.text || '', message.context);
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
        }
      } catch (error) {
        webviewView.webview.postMessage({
          command: 'receiveMessage',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          isError: true
        });
      }
    });
  }

  private getPersistedState(context: vscode.WebviewViewResolveContext): ChatViewState {
    if (context.state) {
      try {
        return JSON.parse(context.state.toString()) as ChatViewState;
      } catch (e) {
        console.error('Failed to parse persisted state:', e);
      }
    }
    return { messages: [] };
  }

  private updateState(partialState: Partial<ChatViewState>) {
    this._state = { ...this._state, ...partialState, lastUpdate: Date.now() };
    if (this._view) {
      // Update webview state
      this._view.webview.postMessage({
        command: 'updateState',
        state: this._state
      });
    }
  }

  private handleFileContext(webviewView: vscode.WebviewView) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const document = editor.document;
      const selection = editor.selection;
      const text = document.getText(selection.isEmpty ? undefined : selection);

      webviewView.webview.postMessage({
        command: 'fileContext',
        text,
        fileName: document.fileName,
        languageId: document.languageId
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