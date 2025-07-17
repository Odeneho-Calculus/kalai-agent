import * as vscode from 'vscode';
import { AIService } from '../services/aiService';
import { CodeContextManager } from '../services/codeContextManager';
import { FileSearchService } from '../services/fileSearchService';
import { WebSearchService } from '../services/webSearchService';

export class AdvancedCommands {
    private aiService: AIService;
    private codeContextManager: CodeContextManager;
    private fileSearchService: FileSearchService;
    private webSearchService: WebSearchService;

    constructor(aiService?: AIService) {
        this.aiService = aiService || new AIService();
        this.codeContextManager = new CodeContextManager();
        this.fileSearchService = new FileSearchService();
        this.webSearchService = new WebSearchService();
    }

    public async explainCode(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText) {
            vscode.window.showErrorMessage('Please select some code to explain');
            return;
        }

        try {
            const context = await this.codeContextManager.getFullContext();
            const aiContext = this.convertToAIContext(context);

            const explanation = await this.aiService.sendMessage(
                `Explain this code in detail:\n\n\`\`\`${editor.document.languageId}\n${selectedText}\n\`\`\`\n\nProvide:\n1. What this code does\n2. How it works\n3. Key concepts used\n4. Potential improvements`,
                aiContext
            );

            await this.showResultInNewDocument(explanation, 'Code Explanation');
        } catch (error) {
            vscode.window.showErrorMessage(`Error explaining code: ${error}`);
        }
    }

    public async generateTests(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        try {
            const context = await this.codeContextManager.getFullContext();
            const aiContext = this.convertToAIContext(context);

            const tests = await this.aiService.sendMessage(
                `Generate comprehensive unit tests for this code. Include:\n1. Test cases for normal functionality\n2. Edge cases\n3. Error handling\n4. Mock dependencies if needed\n5. Use appropriate testing framework for the language`,
                aiContext
            );

            const testFileName = this.generateTestFileName(editor.document.fileName);
            await this.createNewFile(testFileName, tests);
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating tests: ${error}`);
        }
    }

    public async optimizePerformance(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        try {
            const context = await this.codeContextManager.getFullContext();
            const aiContext = this.convertToAIContext(context);

            const optimization = await this.aiService.sendMessage(
                `Analyze this code for performance optimizations. Provide:\n1. Performance bottlenecks\n2. Optimized code suggestions\n3. Algorithmic improvements\n4. Memory usage optimizations\n5. Best practices for this language/framework`,
                aiContext
            );

            await this.showResultInNewDocument(optimization, 'Performance Optimization');
        } catch (error) {
            vscode.window.showErrorMessage(`Error optimizing code: ${error}`);
        }
    }

    public async findSecurityIssues(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        try {
            const context = await this.codeContextManager.getFullContext();
            const aiContext = this.convertToAIContext(context);

            const securityAnalysis = await this.aiService.sendMessage(
                `Perform a security analysis of this code. Check for:\n1. Common vulnerabilities (OWASP Top 10)\n2. Input validation issues\n3. Authentication/authorization problems\n4. Data exposure risks\n5. Injection vulnerabilities\n6. Provide specific fixes for each issue found`,
                aiContext
            );

            await this.showResultInNewDocument(securityAnalysis, 'Security Analysis');
        } catch (error) {
            vscode.window.showErrorMessage(`Error analyzing security: ${error}`);
        }
    }

    public async generateDocumentation(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        try {
            const context = await this.codeContextManager.getFullContext();
            const aiContext = this.convertToAIContext(context);

            const documentation = await this.aiService.sendMessage(
                `Generate comprehensive documentation for this code including:\n1. API documentation\n2. Function/method descriptions\n3. Parameter explanations\n4. Return value descriptions\n5. Usage examples\n6. Code comments\n7. README sections if applicable`,
                aiContext
            );

            await this.showResultInNewDocument(documentation, 'Generated Documentation');
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating documentation: ${error}`);
        }
    }

    public async refactorCode(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText) {
            vscode.window.showErrorMessage('Please select some code to refactor');
            return;
        }

        try {
            const context = await this.codeContextManager.getFullContext();
            const aiContext = this.convertToAIContext(context);

            const refactoredCode = await this.aiService.sendMessage(
                `Refactor this code to improve:\n1. Readability\n2. Maintainability\n3. Performance\n4. Follow best practices\n5. Reduce complexity\n\nOriginal code:\n\`\`\`${editor.document.languageId}\n${selectedText}\n\`\`\`\n\nProvide the refactored code with explanations of changes made.`,
                aiContext
            );

            await this.showResultInNewDocument(refactoredCode, 'Refactored Code');
        } catch (error) {
            vscode.window.showErrorMessage(`Error refactoring code: ${error}`);
        }
    }

    public async searchCodebase(): Promise<void> {
        const query = await vscode.window.showInputBox({
            prompt: 'Enter search query',
            placeHolder: 'Search for functions, classes, or patterns...'
        });

        if (!query) {
            return;
        }

        try {
            const results = await this.fileSearchService.searchInFiles(query);

            if (results.length === 0) {
                vscode.window.showInformationMessage('No results found');
                return;
            }

            // Create a quick pick with results
            const quickPickItems = results.map(result => ({
                label: `${result.file.split('/').pop()} (Line ${result.line})`,
                description: result.content.trim(),
                detail: result.file,
                result: result
            }));

            const selected = await vscode.window.showQuickPick(quickPickItems, {
                placeHolder: `Found ${results.length} results. Select one to open:`
            });

            if (selected) {
                const uri = vscode.Uri.file(selected.result.file);
                const document = await vscode.workspace.openTextDocument(uri);
                const editor = await vscode.window.showTextDocument(document);

                // Navigate to the line
                const position = new vscode.Position(selected.result.line - 1, selected.result.column - 1);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(new vscode.Range(position, position));
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error searching codebase: ${error}`);
        }
    }

    public async analyzeProjectArchitecture(): Promise<void> {
        try {
            const context = await this.codeContextManager.getFullContext();
            const aiContext = this.convertToAIContext(context);

            const analysis = await this.aiService.sendMessage(
                `Analyze the architecture of this project. Provide:\n1. Overall architecture pattern\n2. Project structure analysis\n3. Dependencies and their relationships\n4. Potential architectural improvements\n5. Scalability considerations\n6. Best practices recommendations`,
                aiContext
            );

            await this.showResultInNewDocument(analysis, 'Project Architecture Analysis');
        } catch (error) {
            vscode.window.showErrorMessage(`Error analyzing architecture: ${error}`);
        }
    }

    public async getLatestTechInfo(): Promise<void> {
        const query = await vscode.window.showInputBox({
            prompt: 'What would you like to search for?',
            placeHolder: 'e.g., "React 18 new features", "Node.js security best practices"'
        });

        if (!query) {
            return;
        }

        try {
            const searchResult = await this.webSearchService.searchTechnicalInfo(query);

            if (!searchResult) {
                vscode.window.showInformationMessage('No information found');
                return;
            }

            let content = `# ${searchResult.topic}\n\n`;
            content += `## Summary\n${searchResult.summary}\n\n`;
            content += `## Key Points\n`;
            searchResult.keyPoints.forEach(point => {
                content += `- ${point}\n`;
            });
            content += `\n## Sources\n`;
            searchResult.sources.forEach(source => {
                content += `- [${source.title}](${source.url})\n`;
            });

            await this.showResultInNewDocument(content, 'Latest Tech Info');
        } catch (error) {
            vscode.window.showErrorMessage(`Error searching for information: ${error}`);
        }
    }

    private convertToAIContext(projectContext: any): any {
        return {
            currentFile: projectContext.activeFile ? {
                fileName: projectContext.activeFile.relativePath,
                languageId: projectContext.activeFile.language,
                filePath: projectContext.activeFile.path,
                relativePath: projectContext.activeFile.relativePath
            } : undefined,
            projectFiles: projectContext.files,
            dependencies: projectContext.dependencies,
            detectedFramework: projectContext.detectedFramework,
            projectStructure: projectContext.projectStructure,
            gitInfo: projectContext.gitInfo,
            buildConfig: projectContext.buildConfig
        };
    }

    private async showResultInNewDocument(content: string, title: string): Promise<void> {
        const document = await vscode.workspace.openTextDocument({
            content: content,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(document);
    }

    private async createNewFile(fileName: string, content: string): Promise<void> {
        const uri = vscode.Uri.file(fileName);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document);
    }

    private generateTestFileName(originalFileName: string): string {
        const path = require('path');
        const dir = path.dirname(originalFileName);
        const ext = path.extname(originalFileName);
        const name = path.basename(originalFileName, ext);

        // Generate appropriate test file name based on language
        if (ext === '.js' || ext === '.ts') {
            return path.join(dir, `${name}.test${ext}`);
        } else if (ext === '.py') {
            return path.join(dir, `test_${name}.py`);
        } else if (ext === '.java') {
            return path.join(dir, `${name}Test.java`);
        } else {
            return path.join(dir, `${name}_test${ext}`);
        }
    }
}