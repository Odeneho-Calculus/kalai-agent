import * as vscode from 'vscode';
import { FileContext } from '../types/codeTypes';

export interface ContextSelection {
    type: 'file' | 'folder' | 'workspace' | 'selection';
    paths: string[];
    content?: string;
}

export class ContextSelectorService {
    private lastSelection?: ContextSelection;

    async showContextPicker(): Promise<ContextSelection | undefined> {
        const options = [
            'Current Selection',
            'Current File',
            'Current Folder',
            'Entire Workspace'
        ];

        const choice = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select context scope'
        });

        switch (choice) {
            case 'Current Selection':
                return this.getSelectionContext();
            case 'Current File':
                return this.getFileContext();
            case 'Current Folder':
                return this.getFolderContext();
            case 'Entire Workspace':
                return this.getWorkspaceContext();
            default:
                return this.lastSelection;
        }
    }

    private async getSelectionContext(): Promise<ContextSelection | undefined> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.selection;
        const text = editor.document.getText(selection);

        this.lastSelection = {
            type: 'selection',
            paths: [editor.document.uri.fsPath],
            content: text
        };
        return this.lastSelection;
    }

    private async getFileContext(): Promise<ContextSelection | undefined> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        this.lastSelection = {
            type: 'file',
            paths: [editor.document.uri.fsPath],
            content: editor.document.getText()
        };
        return this.lastSelection;
    }

    private async getFileInfo(path: string, content?: string): Promise<FileContext | undefined> {
        try {
            const uri = vscode.Uri.file(path);
            const document = await vscode.workspace.openTextDocument(uri);

            return {
                content: content || document.getText(),
                language: document.languageId,
                path: document.uri.fsPath,
                relativePath: vscode.workspace.asRelativePath(document.uri)
            };
        } catch (error) {
            console.warn(`Failed to get file info for ${path}:`, error);
            return undefined;  // Changed from null to undefined
        }
    }

    private async getFolderContext(): Promise<ContextSelection | undefined> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const folderPath = vscode.workspace.getWorkspaceFolder(editor.document.uri)?.uri.fsPath;
        if (!folderPath) return;

        const files = await vscode.workspace.findFiles(
            new vscode.RelativePattern(folderPath, '**/*'),
            '**/node_modules/**'
        );

        this.lastSelection = {
            type: 'folder',
            paths: files.map(f => f.fsPath)
        };
        return this.lastSelection;
    }

    private async getWorkspaceContext(): Promise<ContextSelection | undefined> {
        const files = await vscode.workspace.findFiles(
            '**/*',
            '**/node_modules/**'
        );

        this.lastSelection = {
            type: 'workspace',
            paths: files.map(f => f.fsPath)
        };
        return this.lastSelection;
    }
}
