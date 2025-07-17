import * as vscode from 'vscode';
import * as path from 'path';
import { ContextSelection } from './contextService';

export interface FileContext {
    content: string;
    language: string;
    path: string;
    relativePath: string;
    size: number;
    lastModified: Date;
    parsed?: {
        structure?: {
            template?: string;
            script?: string;
            style?: string;
        };
        imports?: string[];
        exports?: string[];
        functions?: string[];
        classes?: string[];
        variables?: string[];
        framework?: string;
        complexity?: number;
        dependencies?: string[];
    };
    selection?: {
        start: number;
        end: number;
        text: string;
    };
    analysis?: {
        codeQuality: number;
        maintainabilityIndex: number;
        cyclomaticComplexity: number;
        linesOfCode: number;
        potentialIssues: string[];
    };
}

export interface ProjectContext {
    files: FileContext[];
    dependencies?: Record<string, string>;
    activeFile?: FileContext;
    detectedFramework?: string;
    relatedFiles?: FileContext[];
    projectStructure?: ProjectStructure;
    gitInfo?: GitInfo;
    buildConfig?: BuildConfig;
}

export interface ProjectStructure {
    type: string;
    framework: string;
    architecture: string;
    entryPoints: string[];
    configFiles: string[];
    testFiles: string[];
    documentationFiles: string[];
    totalFiles: number;
    totalLinesOfCode: number;
}

export interface GitInfo {
    branch: string;
    lastCommit: string;
    uncommittedChanges: boolean;
    remoteUrl?: string;
}

export interface BuildConfig {
    buildTool: string;
    scripts: Record<string, string>;
    outputDir: string;
    sourceDir: string;
}

export class CodeContextManager {
    private readonly maxContextFiles = 10;
    private currentContext: ProjectContext = { files: [] };
    private analysisCache: Map<string, FileContext['analysis']> = new Map();
    private projectCache: Map<string, ProjectStructure> = new Map();

    constructor() {
        this.setupFileWatcher();
        this.initializeProjectContext();
    }

    private async initializeProjectContext() {
        await this.updateProjectStructure();
        await this.updateGitInfo();
        await this.updateBuildConfig();
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
        const parsed: FileContext['parsed'] = {
            imports: [],
            exports: [],
            functions: [],
            classes: [],
            variables: [],
            dependencies: [],
            complexity: 0
        };

        // Parse based on language
        switch (language) {
            case 'vue':
            case 'kalxjs':
                this.parseVueFile(content, parsed);
                break;
            case 'javascript':
            case 'typescript':
                this.parseJavaScriptFile(content, parsed);
                break;
            case 'python':
                this.parsePythonFile(content, parsed);
                break;
            case 'java':
                this.parseJavaFile(content, parsed);
                break;
            default:
                this.parseGenericFile(content, parsed);
        }

        // Calculate complexity
        parsed.complexity = this.calculateComplexity(content);
        parsed.framework = this.detectFrameworkFromContent(content);

        return parsed;
    }

    private parseVueFile(content: string, parsed: FileContext['parsed']) {
        const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
        const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
        const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);

        if (parsed) {
            parsed.structure = {
                template: templateMatch?.[1]?.trim(),
                script: scriptMatch?.[1]?.trim(),
                style: styleMatch?.[1]?.trim()
            };
        }

        if (scriptMatch?.[1]) {
            this.parseJavaScriptContent(scriptMatch[1], parsed);
        }
    }

    private parseJavaScriptFile(content: string, parsed: FileContext['parsed']) {
        this.parseJavaScriptContent(content, parsed);
    }

    private parseJavaScriptContent(content: string, parsed: FileContext['parsed']) {
        if (!parsed) return;

        // Extract imports
        const importMatches = content.match(/import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g);
        if (importMatches) {
            parsed.imports = importMatches.map(imp => imp.trim());
            parsed.dependencies = importMatches.map(imp => {
                const match = imp.match(/from\s+['"`]([^'"`]+)['"`]/);
                return match ? match[1] : '';
            }).filter(dep => dep && !dep.startsWith('.'));
        }

        // Extract exports
        const exportMatches = content.match(/export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g);
        if (exportMatches && parsed) {
            parsed.exports = exportMatches.map(exp => exp.replace(/export\s+(?:default\s+)?(?:function|class|const|let|var)\s+/, ''));
        }

        // Extract functions
        const functionMatches = content.match(/(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*:\s*(?:async\s+)?\()/g);
        if (functionMatches && parsed) {
            parsed.functions = functionMatches.map(func => {
                const match = func.match(/(?:function\s+(\w+)|const\s+(\w+)|(\w+)\s*:)/);
                return match ? (match[1] || match[2] || match[3]) : '';
            }).filter(name => name);
        }

        // Extract classes
        const classMatches = content.match(/class\s+(\w+)/g);
        if (classMatches && parsed) {
            parsed.classes = classMatches.map(cls => cls.replace('class ', ''));
        }

        // Extract variables
        const variableMatches = content.match(/(?:const|let|var)\s+(\w+)/g);
        if (variableMatches && parsed) {
            parsed.variables = variableMatches.map(variable => variable.replace(/(?:const|let|var)\s+/, ''));
        }
    }

    private parsePythonFile(content: string, parsed: FileContext['parsed']) {
        if (!parsed) return;

        // Extract imports
        const importMatches = content.match(/(?:from\s+(\w+(?:\.\w+)*)\s+import|import\s+(\w+(?:\.\w+)*))/g);
        if (importMatches) {
            parsed.imports = importMatches;
            parsed.dependencies = importMatches.map(imp => {
                const fromMatch = imp.match(/from\s+(\w+)/);
                const importMatch = imp.match(/import\s+(\w+)/);
                return fromMatch ? fromMatch[1] : (importMatch ? importMatch[1] : '');
            }).filter(dep => dep);
        }

        // Extract functions
        const functionMatches = content.match(/def\s+(\w+)/g);
        if (functionMatches && parsed) {
            parsed.functions = functionMatches.map(func => func.replace('def ', ''));
        }

        // Extract classes
        const classMatches = content.match(/class\s+(\w+)/g);
        if (classMatches && parsed) {
            parsed.classes = classMatches.map(cls => cls.replace('class ', ''));
        }
    }

    private parseJavaFile(content: string, parsed: FileContext['parsed']) {
        if (!parsed) return;

        // Extract imports
        const importMatches = content.match(/import\s+(?:static\s+)?([^;]+);/g);
        if (importMatches) {
            parsed.imports = importMatches;
            parsed.dependencies = importMatches.map(imp => {
                const match = imp.match(/import\s+(?:static\s+)?([^;]+);/);
                return match ? match[1].split('.')[0] : '';
            }).filter(dep => dep);
        }

        // Extract classes
        const classMatches = content.match(/(?:public\s+|private\s+|protected\s+)?class\s+(\w+)/g);
        if (classMatches) {
            parsed.classes = classMatches.map(cls => cls.replace(/(?:public\s+|private\s+|protected\s+)?class\s+/, ''));
        }

        // Extract methods
        const methodMatches = content.match(/(?:public\s+|private\s+|protected\s+)?(?:static\s+)?(?:\w+\s+)?(\w+)\s*\([^)]*\)\s*\{/g);
        if (methodMatches && parsed) {
            parsed.functions = methodMatches.map(method => {
                const match = method.match(/(\w+)\s*\(/);
                return match ? match[1] : '';
            }).filter(name => name && !['if', 'for', 'while', 'switch'].includes(name));
        }
    }

    private parseGenericFile(content: string, parsed: FileContext['parsed']) {
        if (!parsed) return;

        // Basic parsing for unknown file types
        const lines = content.split('\n');
        parsed.variables = lines.filter(line => line.includes('=')).slice(0, 10);
    }

    private calculateComplexity(content: string): number {
        // Simple cyclomatic complexity calculation
        let complexity = 1; // Base complexity

        // Count control flow keywords
        const keywords = ['if', 'else', 'elif', 'for', 'while', 'switch', 'case', 'catch', 'try', 'except'];
        for (const keyword of keywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = content.match(regex);
            if (matches) {
                complexity += matches.length;
            }
        }

        // Count logical operators (need to escape special regex characters)
        const logicalOperators = [
            { pattern: '&&', count: (content.match(/&&/g) || []).length },
            { pattern: '||', count: (content.match(/\|\|/g) || []).length },
            { pattern: '?', count: (content.match(/\?/g) || []).length }
        ];

        for (const op of logicalOperators) {
            complexity += op.count;
        }

        return complexity;
    }

    private async analyzeCodeQuality(content: string, language: string): Promise<FileContext['analysis']> {
        const linesOfCode = content.split('\n').filter(line => line.trim().length > 0).length;
        const complexity = this.calculateComplexity(content);

        // Simple quality metrics
        const codeQuality = Math.max(0, 100 - (complexity * 2) - (linesOfCode > 500 ? 20 : 0));
        const maintainabilityIndex = Math.max(0, 100 - complexity - (linesOfCode / 10));

        const potentialIssues: string[] = [];

        // Check for potential issues
        if (complexity > 10) {
            potentialIssues.push('High cyclomatic complexity detected');
        }

        if (linesOfCode > 300) {
            potentialIssues.push('File is quite large, consider splitting');
        }

        if (content.includes('TODO') || content.includes('FIXME')) {
            potentialIssues.push('Contains TODO or FIXME comments');
        }

        if (language === 'javascript' && !content.includes('use strict')) {
            potentialIssues.push('Consider using strict mode');
        }

        return {
            codeQuality,
            maintainabilityIndex,
            cyclomaticComplexity: complexity,
            linesOfCode,
            potentialIssues
        };
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
        const stat = await vscode.workspace.fs.stat(document.uri);

        // Get or create analysis
        const cacheKey = `${document.uri.fsPath}_${stat.mtime}`;
        let analysis = this.analysisCache.get(cacheKey);
        if (!analysis) {
            analysis = await this.analyzeCodeQuality(content, language);
            this.analysisCache.set(cacheKey, analysis);
        }

        const fileContext: FileContext = {
            content,
            language,
            path: document.fileName,
            relativePath: vscode.workspace.asRelativePath(document.uri),
            size: stat.size,
            lastModified: new Date(stat.mtime),
            parsed: this.parseFileContent(content, language),
            analysis,
            selection: editor.selection && !editor.selection.isEmpty ? {
                start: document.offsetAt(editor.selection.start),
                end: document.offsetAt(editor.selection.end),
                text: document.getText(editor.selection)
            } : undefined
        };

        this.currentContext.activeFile = fileContext;
        this.currentContext.detectedFramework = fileContext.parsed?.framework;

        // Find related files
        this.currentContext.relatedFiles = await this.findRelatedFiles(fileContext);

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

    private async findRelatedFiles(fileContext: FileContext): Promise<FileContext[]> {
        const relatedFiles: FileContext[] = [];

        try {
            // Find files with similar imports/dependencies
            if (fileContext.parsed?.dependencies) {
                for (const dep of fileContext.parsed.dependencies) {
                    if (dep.startsWith('.')) {
                        // Local import
                        const resolvedPath = path.resolve(path.dirname(fileContext.path), dep);
                        const possibleExtensions = ['.js', '.ts', '.jsx', '.tsx', '.vue'];

                        for (const ext of possibleExtensions) {
                            try {
                                const fullPath = resolvedPath + ext;
                                const uri = vscode.Uri.file(fullPath);
                                const document = await vscode.workspace.openTextDocument(uri);
                                const relatedFile = await this.createFileContext(document);
                                if (relatedFile) {
                                    relatedFiles.push(relatedFile);
                                    break;
                                }
                            } catch {
                                // File doesn't exist, continue
                            }
                        }
                    }
                }
            }

            // Find files in the same directory
            const dirPath = path.dirname(fileContext.path);
            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(dirPath, '*'),
                null,
                5
            );

            for (const file of files) {
                if (file.fsPath !== fileContext.path && relatedFiles.length < 3) {
                    try {
                        const document = await vscode.workspace.openTextDocument(file);
                        const relatedFile = await this.createFileContext(document);
                        if (relatedFile) {
                            relatedFiles.push(relatedFile);
                        }
                    } catch {
                        // Skip files that can't be read
                    }
                }
            }
        } catch (error) {
            console.warn('Error finding related files:', error);
        }

        return relatedFiles.slice(0, 5);
    }

    private async createFileContext(document: vscode.TextDocument): Promise<FileContext | null> {
        try {
            const content = document.getText();
            const language = this.detectFileLanguage(document.fileName, content);
            const stat = await vscode.workspace.fs.stat(document.uri);

            const cacheKey = `${document.uri.fsPath}_${stat.mtime}`;
            let analysis = this.analysisCache.get(cacheKey);
            if (!analysis) {
                analysis = await this.analyzeCodeQuality(content, language);
                this.analysisCache.set(cacheKey, analysis);
            }

            return {
                content,
                language,
                path: document.fileName,
                relativePath: vscode.workspace.asRelativePath(document.uri),
                size: stat.size,
                lastModified: new Date(stat.mtime),
                parsed: this.parseFileContent(content, language),
                analysis
            };
        } catch (error) {
            console.warn(`Error creating file context for ${document.fileName}:`, error);
            return null;
        }
    }

    private async updateProjectStructure() {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) return;

            const rootPath = workspaceFolders[0].uri.fsPath;
            const cacheKey = `project_${rootPath}`;

            if (this.projectCache.has(cacheKey)) {
                this.currentContext.projectStructure = this.projectCache.get(cacheKey);
                return;
            }

            const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
            const structure: ProjectStructure = {
                type: 'unknown',
                framework: 'unknown',
                architecture: 'unknown',
                entryPoints: [],
                configFiles: [],
                testFiles: [],
                documentationFiles: [],
                totalFiles: files.length,
                totalLinesOfCode: 0
            };

            // Analyze files
            for (const file of files.slice(0, 100)) { // Limit for performance
                const fileName = path.basename(file.fsPath);
                const ext = path.extname(fileName);

                // Identify file types
                if (['package.json', 'tsconfig.json', 'webpack.config.js', '.eslintrc'].includes(fileName)) {
                    structure.configFiles.push(fileName);
                }

                if (fileName.includes('test') || fileName.includes('spec') || ext === '.test.js') {
                    structure.testFiles.push(fileName);
                }

                if (['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md'].includes(fileName)) {
                    structure.documentationFiles.push(fileName);
                }

                if (['index.js', 'main.js', 'app.js', 'index.ts', 'main.ts'].includes(fileName)) {
                    structure.entryPoints.push(file.fsPath);
                }
            }

            // Detect project type and framework
            if (structure.configFiles.includes('package.json')) {
                structure.type = 'Node.js';
                // Read package.json to detect framework
                try {
                    const packageJsonUri = vscode.Uri.file(path.join(rootPath, 'package.json'));
                    const content = await vscode.workspace.fs.readFile(packageJsonUri);
                    const packageJson = JSON.parse(content.toString());

                    if (packageJson.dependencies?.react) {
                        structure.framework = 'React';
                    } else if (packageJson.dependencies?.vue) {
                        structure.framework = 'Vue';
                    } else if (packageJson.dependencies?.angular) {
                        structure.framework = 'Angular';
                    } else if (packageJson.dependencies?.express) {
                        structure.framework = 'Express';
                    }
                } catch {
                    // Ignore errors reading package.json
                }
            }

            this.projectCache.set(cacheKey, structure);
            this.currentContext.projectStructure = structure;
        } catch (error) {
            console.warn('Error updating project structure:', error);
        }
    }

    private async updateGitInfo() {
        try {
            const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
            if (!gitExtension) return;

            const api = gitExtension.getAPI(1);
            if (api.repositories.length > 0) {
                const repo = api.repositories[0];

                this.currentContext.gitInfo = {
                    branch: repo.state.HEAD?.name || 'unknown',
                    lastCommit: repo.state.HEAD?.commit || 'unknown',
                    uncommittedChanges: repo.state.workingTreeChanges.length > 0,
                    remoteUrl: repo.state.remotes[0]?.fetchUrl
                };
            }
        } catch (error) {
            console.warn('Error getting git info:', error);
        }
    }

    private async updateBuildConfig() {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) return;

            const rootPath = workspaceFolders[0].uri.fsPath;

            // Check for package.json scripts
            try {
                const packageJsonUri = vscode.Uri.file(path.join(rootPath, 'package.json'));
                const content = await vscode.workspace.fs.readFile(packageJsonUri);
                const packageJson = JSON.parse(content.toString());

                this.currentContext.buildConfig = {
                    buildTool: 'npm',
                    scripts: packageJson.scripts || {},
                    outputDir: 'dist',
                    sourceDir: 'src'
                };
            } catch {
                // No package.json or error reading it
            }
        } catch (error) {
            console.warn('Error updating build config:', error);
        }
    }

    private async analyzeProjectStructure(): Promise<string> {
        let projectType = 'unknown';

        if (this.currentContext.dependencies) {
            if (this.currentContext.dependencies['@kalxjs-framework/runtime']) {
                projectType = 'KalxJS Application';
            } else if (this.currentContext.dependencies['react']) {
                projectType = 'React Application';
            } else if (this.currentContext.dependencies['vue']) {
                projectType = 'Vue Application';
            }
        }

        return projectType;
    }

    public async getFullContext(): Promise<ProjectContext> {
        await this.updateActiveFileContext();
        await this.updateProjectDependencies();

        if (this.currentContext.activeFile) {
            const projectType = await this.analyzeProjectStructure();
            this.currentContext.detectedFramework = projectType;
        }

        return this.currentContext;
    }

    private async updateProjectDependencies(context?: ProjectContext) {
        try {
            const packageJsonFiles = await vscode.workspace.findFiles('**/package.json', '**/node_modules/**');
            if (packageJsonFiles.length > 0) {
                const content = await vscode.workspace.fs.readFile(packageJsonFiles[0]);
                const contentString = content.toString().trim();

                // Check if content is empty or invalid
                if (!contentString || contentString.length === 0) {
                    console.warn('Package.json file is empty');
                    return;
                }

                // Validate JSON structure before parsing
                if (!contentString.startsWith('{') || !contentString.endsWith('}')) {
                    console.warn('Package.json file appears to be corrupted or incomplete');
                    return;
                }

                const packageJson = JSON.parse(contentString);
                const targetContext = context || this.currentContext;
                targetContext.dependencies = {
                    ...packageJson.dependencies,
                    ...packageJson.devDependencies
                };
            }
        } catch (error) {
            console.warn('Failed to read package.json:', error);
            // Initialize empty dependencies to prevent further errors
            const targetContext = context || this.currentContext;
            targetContext.dependencies = {};
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
            const stat = await vscode.workspace.fs.stat(uri);

            return {
                content: content || document.getText(),
                language: document.languageId,
                path: document.uri.fsPath,
                relativePath: vscode.workspace.asRelativePath(document.uri),
                size: stat.size,
                lastModified: new Date(stat.mtime),
                parsed: this.parseFileContent(document.getText(), document.languageId)
            };
        } catch (error) {
            console.warn(`Failed to get file info for ${path}:`, error);
            return null;
        }
    }
}
