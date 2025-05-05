import * as vscode from 'vscode';
import { AIService } from '../services/aiService';

export async function handleEditWithAI(editor: vscode.TextEditor): Promise<void> {
  const selection = editor.selection;

  // Get the selected text or the entire document if nothing is selected
  const text = editor.document.getText(selection.isEmpty ? undefined : selection);
  const fileName = editor.document.fileName;
  const languageId = editor.document.languageId;

  if (!text) {
    vscode.window.showErrorMessage('No text selected or document is empty');
    return;
  }

  // Show input box for user instructions
  const instruction = await vscode.window.showInputBox({
    prompt: 'What would you like to do with this code?',
    placeHolder: 'e.g., Refactor, optimize, add comments, fix bugs...'
  });

  if (!instruction) {
    // User cancelled the input
    return;
  }

  // Show progress indicator
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'KalAI Agent is processing your code...',
      cancellable: true
    },
    async (progress: vscode.Progress<{ message?: string; increment?: number }>,
      token: vscode.CancellationToken) => {
      try {
        // Show progress
        progress.report({
          message: 'Analyzing code...',
          increment: 30
        });

        const aiService = new AIService();

        // Create context object with file information
        const context = {
          fileName,
          languageId,
          instruction
        };

        // Send to AI service
        const result = await aiService.editCode(text, context);

        if (token.isCancellationRequested) {
          return;
        }

        // Update progress
        progress.report({
          message: 'Applying changes...',
          increment: 70
        });

        // Apply the edit
        editor.edit((editBuilder: vscode.TextEditorEdit) => {
          const range = selection.isEmpty
            ? new vscode.Range(0, 0, editor.document.lineCount, 0)
            : selection;

          editBuilder.replace(range, result);
        });

        vscode.window.showInformationMessage('Code updated successfully!');
      } catch (error) {
        vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );
}