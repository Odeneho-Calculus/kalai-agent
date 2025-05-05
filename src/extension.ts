import * as vscode from 'vscode';
import { ChatViewProvider } from './providers/chatViewProvider';
import { handleEditWithAI } from './commands/editWithAI';

export function activate(context: vscode.ExtensionContext) {
  console.log('KalAI Agent is now active!');

  // Register Chat View Provider
  const chatViewProvider = new ChatViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'kalai-agent.chatView',
      chatViewProvider
    )
  );

  // Register Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('kalai-agent.startChat', () => {
      vscode.commands.executeCommand('kalai-agent.chatView.focus');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kalai-agent.editWithAI', async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await handleEditWithAI(editor);
      } else {
        vscode.window.showErrorMessage('No active editor found');
      }
    })
  );
}

export function deactivate() {
  console.log('KalAI Agent is now deactivated');
}