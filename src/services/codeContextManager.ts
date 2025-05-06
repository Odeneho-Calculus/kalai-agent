import * as vscode from 'vscode';
import { ContextSelection } from './contextSelectorService';
import { FileContext } from '../types/codeTypes';

export interface ProjectContext {
    files: FileContext[];
    dependencies?: Record<string, string>;
    activeFile?: FileContext;
    detectedFramework?: string;
}

export class CodeContextManager {
    private readonly maxContextFiles = 5;
    private currentContext: ProjectContext = { files: [] };

    constructor() {
        this.setupFileWatcher();
    }

    private setupFileWatcher() {
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document === vscode.window.activeTextEditor?.document) {
                this.updateActiveFileContext();
            }
        });

        vscode.window.onDidChangeActiveTextEditor(() => {
            this.updateActiveFileContext();
        });
    }

    private detectFileLanguage(fileName: string, content: string): string {
        const ext = fileName.split('.').pop()?.toLowerCase();

        switch (ext) {
            case 'js':
            case 'jsx':
                return 'javascript';
            case 'ts':
            case 'tsx':
                return 'typescript';
            case 'py':
                return 'python';
            case 'java':
                return 'java';
            case 'cpp':
            case 'cc':
                return 'cpp';
            case 'vue':
                return 'vue';
            case 'klx':
                return this.detectFrameworkFromContent(content);
            default:
                return this.detectLanguageFromContent(content);
        }
    }

    private detectFrameworkFromContent(content: string): string {
        if (content.includes('@kalxjs-framework')) return 'kalxjs';
        if (content.includes('import { ref }')) return 'vue';
        if (content.includes('import React')) return 'react';
        if (content.includes('import { Component }')) return 'angular';
        return 'unknown';
    }

    private parseFileContent(content: string, language: string): FileContext['parsed'] {
        const parsed: FileContext['parsed'] = {};

        if (language === 'vue' || language === 'kalxjs') {
            const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
            const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
            const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);

            parsed.structure = {
                template: templateMatch?.[1]?.trim(),
                script: scriptMatch?.[1]?.trim(),
                style: styleMatch?.[1]?.trim()
            };

            parsed.imports = scriptMatch?.[1]?.match(/import .+ from .+/g) || [];
            parsed.framework = this.detectFrameworkFromContent(content);
        }

        return parsed;
    }

    private detectLanguageFromContent(content: string): string {
        if (content.includes('<template>') && content.includes('<script>')) {
            return this.detectFrameworkFromContent(content);
        }
        if (content.includes('def ') || content.includes('import ') && content.includes(':')) {
            return 'python';
        }
        if (content.includes('function') || content.includes('const') || content.includes('let')) {
            return 'javascript';
        }
        return 'plaintext';
    }

    public async updateActiveFileContext() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        const content = document.getText();
        const language = this.detectFileLanguage(document.fileName, content);

        const fileContext: FileContext = {
            content,
            language,
            path: document.fileName,
            relativePath: vscode.workspace.asRelativePath(document.uri),
            parsed: this.parseFileContent(content, language),
            selection: editor.selection && !editor.selection.isEmpty ? {
                start: document.offsetAt(editor.selection.start),
                end: document.offsetAt(editor.selection.end),
                text: document.getText(editor.selection)
            } : undefined
        };

        this.currentContext.activeFile = fileContext;
        this.currentContext.detectedFramework = fileContext.parsed?.framework;

        const existingIndex = this.currentContext.files.findIndex(f => f.path === fileContext.path);
        if (existingIndex >= 0) {
            this.currentContext.files[existingIndex] = fileContext;
        } else {
            this.currentContext.files.unshift(fileContext);
            if (this.currentContext.files.length > this.maxContextFiles) {
                this.currentContext.files.pop();
            }
        }
    }

    private async analyzeProjectStructure(mainFile: FileContext): Promise<string> {
        let projectType = 'unknown';

        // Detect project type from dependencies and files
        if (this.currentContext.dependencies) {
            if (this.currentContext.dependencies['@kalxjs-framework/runtime']) {
                projectType = 'KalxJS Application';
            } else if (this.currentContext.dependencies['react']) {
                projectType = 'React Application';
            } else if (this.currentContext.dependencies['vue']) {
                projectType = 'Vue Application';
            }
        }

        // Detect from entry files
        const entryFiles = await vscode.workspace.findFiles(
            '{index.html,index.js,main.js,app.js}',
            '**/node_modules/**'
        );

        return projectType;
    }

    public async getFullContext(): Promise<ProjectContext> {
        await this.updateActiveFileContext();
        await this.updateProjectDependencies();

        if (this.currentContext.activeFile) {
            const projectType = await this.analyzeProjectStructure(this.currentContext.activeFile);
            this.currentContext.detectedFramework = projectType;
        }

        return this.currentContext;
    }

    private async updateProjectDependencies(context?: ProjectContext) {
        try {
            const packageJsonFiles = await vscode.workspace.findFiles('**/package.json', '**/node_modules/**');
            if (packageJsonFiles.length > 0) {
                const content = await vscode.workspace.fs.readFile(packageJsonFiles[0]);
                const packageJson = JSON.parse(content.toString());
                const targetContext = context || this.currentContext;
                targetContext.dependencies = {
                    ...packageJson.dependencies,
                    ...packageJson.devDependencies
                };
            }
        } catch (error) {
            console.warn('Failed to read package.json:', error);
        }
    }

    public getRelevantContext(query: string): ProjectContext {
        const relevantFiles = this.currentContext.files
            .filter(file => this.isFileRelevant(file, query))
            .slice(0, 3);

        return {
            ...this.currentContext,
            files: relevantFiles
        };
    }

    private isFileRelevant(file: FileContext, query: string): boolean {
        const queryTerms = query.toLowerCase().split(/\s+/);
        const content = file.content.toLowerCase();

        return queryTerms.some(term =>
            content.includes(term) ||
            file.path.toLowerCase().includes(term) ||
            file.language.toLowerCase().includes(term)
        );
    }

    public async getContextFromSelection(selection: ContextSelection): Promise<ProjectContext> {
        const context: ProjectContext = { files: [] };

        switch (selection.type) {
            case 'selection':
            case 'file':
                if (selection.content) {
                    const file = await this.getFileInfo(selection.paths[0], selection.content);
                    if (file) {  // Add null check
                        context.files = [file];
                        context.activeFile = file;
                    }
                }
                break;

            case 'folder':
            case 'workspace':
                const fileContents = await Promise.all(
                    selection.paths.slice(0, 5).map(path => this.getFileInfo(path))
                );
                context.files = fileContents.filter((f): f is FileContext => f !== undefined);
                if (vscode.window.activeTextEditor) {
                    const activeFile = context.files.find(
                        f => f.path === vscode.window.activeTextEditor?.document.uri.fsPath
                    );
                    if (activeFile) {
                        context.activeFile = activeFile;
                    }
                }
                break;
        }

        await this.updateProjectDependencies(context);
        return context;
    }

    private async getFileInfo(path: string, content?: string): Promise<FileContext | null> {
        try {
            const uri = vscode.Uri.file(path);
            const document = await vscode.workspace.openTextDocument(uri);

            return {
                content: content || document.getText(),
                language: document.languageId,
                path: document.uri.fsPath,
                relativePath: vscode.workspace.asRelativePath(document.uri),
                parsed: this.parseFileContent(document.getText(), document.languageId)
            };
        } catch (error) {
            console.warn(`Failed to get file info for ${path}:`, error);
            return null;
        }
    }
}
