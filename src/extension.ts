import * as vscode from 'vscode';
import { ChatViewProvider } from './providers/chatViewProvider';
import { AdvancedCommands } from './commands/advancedCommands';
import { handleEditWithAI } from './commands/editWithAI';

export function activate(context: vscode.ExtensionContext) {
  console.log('kalai Agent is now active!');

  // Initialize advanced commands
  const advancedCommands = new AdvancedCommands();

  // Register Chat View Provider with context
  const chatViewProvider = new ChatViewProvider(context.extensionUri, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'kalai-agent.chatView',
      chatViewProvider
    )
  );

  // Register all commands
  const commands = [
    // Original commands
    vscode.commands.registerCommand('kalai-agent.startChat', () => {
      vscode.commands.executeCommand('kalai-agent.chatView.focus');
    }),

    vscode.commands.registerCommand('kalai-agent.editWithAI', async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await handleEditWithAI(editor);
      } else {
        vscode.window.showErrorMessage('No active editor found');
      }
    }),

    // Advanced commands
    vscode.commands.registerCommand('kalai-agent.explainCode', () => advancedCommands.explainCode()),
    vscode.commands.registerCommand('kalai-agent.generateTests', () => advancedCommands.generateTests()),
    vscode.commands.registerCommand('kalai-agent.optimizePerformance', () => advancedCommands.optimizePerformance()),
    vscode.commands.registerCommand('kalai-agent.findSecurityIssues', () => advancedCommands.findSecurityIssues()),
    vscode.commands.registerCommand('kalai-agent.generateDocumentation', () => advancedCommands.generateDocumentation()),
    vscode.commands.registerCommand('kalai-agent.refactorCode', () => advancedCommands.refactorCode()),
    vscode.commands.registerCommand('kalai-agent.searchCodebase', () => advancedCommands.searchCodebase()),
    vscode.commands.registerCommand('kalai-agent.analyzeArchitecture', () => advancedCommands.analyzeProjectArchitecture()),
    vscode.commands.registerCommand('kalai-agent.getLatestTechInfo', () => advancedCommands.getLatestTechInfo()),

    // Context menu commands
    vscode.commands.registerCommand('kalai-agent.explainSelection', () => advancedCommands.explainCode()),
    vscode.commands.registerCommand('kalai-agent.refactorSelection', () => advancedCommands.refactorCode()),

    // Chat utility commands
    vscode.commands.registerCommand('kalai-agent.clearConversation', () => {
      chatViewProvider.sendMessage('Conversation cleared!');
    })
  ];

  // Add all commands to subscriptions
  commands.forEach(command => context.subscriptions.push(command));
}

export function deactivate() {
  console.log('kalai Agent is now deactivated');
}