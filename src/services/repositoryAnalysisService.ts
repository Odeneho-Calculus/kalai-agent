import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { FileContext, ProjectContext } from './codeContextManager';

export interface CodeElement {
    id: string;
    type: 'function' | 'class' | 'variable' | 'interface' | 'method' | 'property';
    name: string;
    filePath: string;
    startLine: number;
    endLine: number;
    signature: string;
    embedding?: number[];
    dependencies: string[];
    usage: CodeUsage[];
    complexity: number;
    semanticTags: string[];
}

export interface CodeUsage {
    filePath: string;
    line: number;
    context: string;
    type: 'definition' | 'reference' | 'call' | 'inheritance' | 'import';
}

export interface DependencyGraph {
    nodes: Map<string, DependencyNode>;
    edges: Map<string, DependencyEdge[]>;
}

export interface DependencyNode {
    id: string;
    filePath: string;
    type: 'file' | 'module' | 'function' | 'class';
    metadata: {
        size: number;
        complexity: number;
        lastModified: Date;
        imports: string[];
        exports: string[];
    };
}

export interface DependencyEdge {
    from: string;
    to: string;
    type: 'import' | 'call' | 'inheritance' | 'composition';
    weight: number;
}

export interface SemanticIndex {
    elements: Map<string, CodeElement>;
    relationships: Map<string, string[]>;
    patterns: Map<string, PatternMatch>;
    embeddings: Map<string, number[]>;
}

export interface PatternMatch {
    pattern: string;
    confidence: number;
    locations: Array<{
        filePath: string;
        line: number;
        match: string;
    }>;
}

export interface RepositoryIndex {
    version: string;
    timestamp: Date;
    rootPath: string;
    semanticIndex: SemanticIndex;
    dependencyGraph: DependencyGraph;
    fileIndex: Map<string, FileIndexEntry>;
    namingConventions: NamingConventions;
    architecturalPatterns: ArchitecturalPattern[];
}

export interface FileIndexEntry {
    filePath: string;
    relativePath: string;
    language: string;
    size: number;
    lastModified: Date;
    hash: string;
    elements: CodeElement[];
    imports: string[];
    exports: string[];
    complexity: number;
    semanticVector?: number[];
}

export interface NamingConventions {
    camelCase: number;
    pascalCase: number;
    snakeCase: number;
    kebabCase: number;
    conventions: Map<string, string>;
}

export interface ArchitecturalPattern {
    name: string;
    confidence: number;
    description: string;
    files: string[];
    characteristics: string[];
}

export class RepositoryAnalysisService {
    private repositoryIndex: RepositoryIndex | null = null;
    private indexingInProgress = false;
    private fileWatcher: vscode.FileSystemWatcher | null = null;
    private updateQueue: Set<string> = new Set();
    private readonly CACHE_VERSION = '1.0.0';
    private readonly MAX_FILE_SIZE = 1024 * 1024; // 1MB
    private readonly SUPPORTED_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs', '.vue'];

    constructor() {
        this.setupFileWatcher();
    }

    /**
     * Initialize the repository index for the current workspace
     */
    public async initializeRepository(): Promise<void> {
        if (this.indexingInProgress) {
            return;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }

        this.indexingInProgress = true;

        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Repo Grokking™: Initializing repository understanding...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Analyzing repository structure...' });

                this.repositoryIndex = await this.buildRepositoryIndex(workspaceFolder.uri.fsPath);

                progress.report({ increment: 100, message: 'Repository indexing complete!' });
            });
        } finally {
            this.indexingInProgress = false;
        }
    }

    /**
     * Build comprehensive repository index
     */
    private async buildRepositoryIndex(rootPath: string): Promise<RepositoryIndex> {
        const index: RepositoryIndex = {
            version: this.CACHE_VERSION,
            timestamp: new Date(),
            rootPath,
            semanticIndex: {
                elements: new Map(),
                relationships: new Map(),
                patterns: new Map(),
                embeddings: new Map()
            },
            dependencyGraph: {
                nodes: new Map(),
                edges: new Map()
            },
            fileIndex: new Map(),
            namingConventions: {
                camelCase: 0,
                pascalCase: 0,
                snakeCase: 0,
                kebabCase: 0,
                conventions: new Map()
            },
            architecturalPatterns: []
        };

        // Step 1: Discover and index all files
        const files = await this.discoverFiles(rootPath);

        // Step 2: Parse and analyze each file
        for (const file of files) {
            const fileEntry = await this.analyzeFile(file);
            if (fileEntry) {
                index.fileIndex.set(file, fileEntry);
            }
        }

        // Step 3: Build dependency graph
        await this.buildDependencyGraph(index);

        // Step 4: Analyze semantic relationships
        await this.analyzeSemanticRelationships(index);

        // Step 5: Detect patterns and conventions
        await this.detectPatterns(index);

        // Step 6: Generate embeddings
        await this.generateEmbeddings(index);

        return index;
    }

    /**
     * Discover all relevant files in the repository
     */
    private async discoverFiles(rootPath: string): Promise<string[]> {
        const files: string[] = [];

        const pattern = `**/*{${this.SUPPORTED_EXTENSIONS.join(',')}}`;
        const exclude = '{**/node_modules/**,**/.git/**,**/dist/**,**/build/**,**/coverage/**,**/.vscode/**,**/.idea/**}';

        const foundFiles = await vscode.workspace.findFiles(pattern, exclude);

        for (const file of foundFiles) {
            // Additional filtering for problematic files
            if (this.shouldSkipFile(file.fsPath)) {
                continue;
            }

            try {
                const stat = await vscode.workspace.fs.stat(file);

                // Skip files that are too large
                if (stat.size <= this.MAX_FILE_SIZE) {
                    files.push(file.fsPath);
                }
            } catch (error) {
                // Skip files that can't be accessed
                console.warn(`Skipping file due to access error: ${file.fsPath}`, error);
                continue;
            }
        }

        return files;
    }

    /**
     * Check if a file should be skipped during analysis
     */
    private shouldSkipFile(filePath: string): boolean {
        const skipPatterns = [
            /\.git[\/\\]/,
            /\.lock$/,
            /\.tmp$/,
            /\.temp$/,
            /\.cache$/,
            /\.log$/,
            /node_modules[\/\\]/,
            /dist[\/\\]/,
            /build[\/\\]/,
            /coverage[\/\\]/,
            /\.vscode[\/\\]/,
            /\.idea[\/\\]/,
            /\.DS_Store$/,
            /Thumbs\.db$/,
            /\.min\./,
            /\.bundle\./,
            /\.chunk\./
        ];

        return skipPatterns.some(pattern => pattern.test(filePath));
    }

    /**
     * Analyze individual file and extract code elements
     */
    public async analyzeFile(filePath: string): Promise<FileIndexEntry | null> {
        try {
            // Skip problematic files
            if (this.shouldSkipFile(filePath)) {
                console.log(`Skipping file due to filter: ${filePath}`);
                return null;
            }

            const uri = vscode.Uri.file(filePath);

            // Check if file exists and is accessible
            try {
                await vscode.workspace.fs.stat(uri);
            } catch (statError) {
                console.warn(`File not accessible, skipping: ${filePath}`, statError);
                return null;
            }

            const document = await vscode.workspace.openTextDocument(uri);
            const content = document.getText();
            const stat = await vscode.workspace.fs.stat(uri);

            const hash = this.calculateFileHash(content);
            const language = this.detectLanguage(filePath, content);

            // Parse code elements
            const elements = await this.parseCodeElements(content, filePath, language);

            // Extract imports and exports
            const imports = this.extractImports(content, language);
            const exports = this.extractExports(content, language);

            // Calculate complexity
            const complexity = this.calculateFileComplexity(content);

            return {
                filePath,
                relativePath: vscode.workspace.asRelativePath(uri),
                language,
                size: stat.size,
                lastModified: new Date(stat.mtime),
                hash,
                elements,
                imports,
                exports,
                complexity
            };
        } catch (error) {
            console.error(`Error analyzing file ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Parse code elements from file content
     */
    private async parseCodeElements(content: string, filePath: string, language: string): Promise<CodeElement[]> {
        const elements: CodeElement[] = [];

        switch (language) {
            case 'javascript':
            case 'typescript':
                elements.push(...this.parseJavaScriptElements(content, filePath));
                break;
            case 'python':
                elements.push(...this.parsePythonElements(content, filePath));
                break;
            case 'java':
                elements.push(...this.parseJavaElements(content, filePath));
                break;
            default:
                elements.push(...this.parseGenericElements(content, filePath));
        }

        return elements;
    }

    /**
     * Parse JavaScript/TypeScript elements
     */
    private parseJavaScriptElements(content: string, filePath: string): CodeElement[] {
        const elements: CodeElement[] = [];
        const lines = content.split('\n');

        // Parse functions
        const functionRegex = /(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|\([^)]*\)\s*\{|function))/g;
        let match;

        while ((match = functionRegex.exec(content)) !== null) {
            const name = match[1] || match[2];
            const startLine = content.substring(0, match.index).split('\n').length;

            elements.push({
                id: `${filePath}:${name}:${startLine}`,
                type: 'function',
                name,
                filePath,
                startLine,
                endLine: startLine, // Will be updated with proper parsing
                signature: this.extractSignature(content, match.index),
                dependencies: [],
                usage: [],
                complexity: 1,
                semanticTags: []
            });
        }

        // Parse classes
        const classRegex = /(?:export\s+)?class\s+(\w+)/g;
        while ((match = classRegex.exec(content)) !== null) {
            const name = match[1];
            const startLine = content.substring(0, match.index).split('\n').length;

            elements.push({
                id: `${filePath}:${name}:${startLine}`,
                type: 'class',
                name,
                filePath,
                startLine,
                endLine: startLine,
                signature: match[0],
                dependencies: [],
                usage: [],
                complexity: 1,
                semanticTags: []
            });
        }

        return elements;
    }

    /**
     * Parse Python elements
     */
    private parsePythonElements(content: string, filePath: string): CodeElement[] {
        const elements: CodeElement[] = [];

        // Parse functions
        const functionRegex = /def\s+(\w+)\s*\([^)]*\):/g;
        let match;

        while ((match = functionRegex.exec(content)) !== null) {
            const name = match[1];
            const startLine = content.substring(0, match.index).split('\n').length;

            elements.push({
                id: `${filePath}:${name}:${startLine}`,
                type: 'function',
                name,
                filePath,
                startLine,
                endLine: startLine,
                signature: match[0],
                dependencies: [],
                usage: [],
                complexity: 1,
                semanticTags: []
            });
        }

        // Parse classes
        const classRegex = /class\s+(\w+)(?:\([^)]*\))?:/g;
        while ((match = classRegex.exec(content)) !== null) {
            const name = match[1];
            const startLine = content.substring(0, match.index).split('\n').length;

            elements.push({
                id: `${filePath}:${name}:${startLine}`,
                type: 'class',
                name,
                filePath,
                startLine,
                endLine: startLine,
                signature: match[0],
                dependencies: [],
                usage: [],
                complexity: 1,
                semanticTags: []
            });
        }

        return elements;
    }

    /**
     * Parse Java elements
     */
    private parseJavaElements(content: string, filePath: string): CodeElement[] {
        const elements: CodeElement[] = [];

        // Parse classes
        const classRegex = /(?:public\s+|private\s+|protected\s+)?class\s+(\w+)/g;
        let match;

        while ((match = classRegex.exec(content)) !== null) {
            const name = match[1];
            const startLine = content.substring(0, match.index).split('\n').length;

            elements.push({
                id: `${filePath}:${name}:${startLine}`,
                type: 'class',
                name,
                filePath,
                startLine,
                endLine: startLine,
                signature: match[0],
                dependencies: [],
                usage: [],
                complexity: 1,
                semanticTags: []
            });
        }

        // Parse methods
        const methodRegex = /(?:public\s+|private\s+|protected\s+)?(?:static\s+)?(?:\w+\s+)?(\w+)\s*\([^)]*\)\s*\{/g;
        while ((match = methodRegex.exec(content)) !== null) {
            const name = match[1];
            const startLine = content.substring(0, match.index).split('\n').length;

            // Filter out control flow keywords
            if (!['if', 'for', 'while', 'switch', 'catch', 'try'].includes(name)) {
                elements.push({
                    id: `${filePath}:${name}:${startLine}`,
                    type: 'method',
                    name,
                    filePath,
                    startLine,
                    endLine: startLine,
                    signature: match[0],
                    dependencies: [],
                    usage: [],
                    complexity: 1,
                    semanticTags: []
                });
            }
        }

        return elements;
    }

    /**
     * Parse generic elements for unsupported languages
     */
    private parseGenericElements(content: string, filePath: string): CodeElement[] {
        const elements: CodeElement[] = [];
        const lines = content.split('\n');

        // Look for function-like patterns
        const functionPatterns = [
            /function\s+(\w+)/g,
            /def\s+(\w+)/g,
            /(\w+)\s*=\s*function/g,
            /(\w+)\s*:\s*function/g
        ];

        for (const pattern of functionPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const name = match[1];
                const startLine = content.substring(0, match.index).split('\n').length;

                elements.push({
                    id: `${filePath}:${name}:${startLine}`,
                    type: 'function',
                    name,
                    filePath,
                    startLine,
                    endLine: startLine,
                    signature: match[0],
                    dependencies: [],
                    usage: [],
                    complexity: 1,
                    semanticTags: []
                });
            }
        }

        return elements;
    }

    /**
     * Extract function/method signature
     */
    private extractSignature(content: string, startIndex: number): string {
        const lines = content.split('\n');
        const lineNumber = content.substring(0, startIndex).split('\n').length - 1;
        const line = lines[lineNumber];

        // Extract up to the opening brace or arrow
        const match = line.match(/.*?(?=\{|=>|$)/);
        return match ? match[0].trim() : line.trim();
    }

    /**
     * Extract imports from file content
     */
    private extractImports(content: string, language: string): string[] {
        const imports: string[] = [];

        switch (language) {
            case 'javascript':
            case 'typescript':
                const jsImportRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
                let match;
                while ((match = jsImportRegex.exec(content)) !== null) {
                    imports.push(match[1]);
                }
                break;

            case 'python':
                const pyImportRegex = /(?:from\s+(\w+(?:\.\w+)*)\s+import|import\s+(\w+(?:\.\w+)*))/g;
                while ((match = pyImportRegex.exec(content)) !== null) {
                    imports.push(match[1] || match[2]);
                }
                break;

            case 'java':
                const javaImportRegex = /import\s+(?:static\s+)?([^;]+);/g;
                while ((match = javaImportRegex.exec(content)) !== null) {
                    imports.push(match[1]);
                }
                break;
        }

        return imports;
    }

    /**
     * Extract exports from file content
     */
    private extractExports(content: string, language: string): string[] {
        const exports: string[] = [];

        switch (language) {
            case 'javascript':
            case 'typescript':
                const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g;
                let match;
                while ((match = exportRegex.exec(content)) !== null) {
                    exports.push(match[1]);
                }

                // Named exports
                const namedExportRegex = /export\s*\{\s*([^}]+)\s*\}/g;
                while ((match = namedExportRegex.exec(content)) !== null) {
                    const names = match[1].split(',').map(n => n.trim().split(' as ')[0]);
                    exports.push(...names);
                }
                break;

            case 'python':
                // Python doesn't have explicit exports, use __all__ if available
                const allRegex = /__all__\s*=\s*\[([^\]]+)\]/g;
                while ((match = allRegex.exec(content)) !== null) {
                    const names = match[1].split(',').map(n => n.trim().replace(/['"`]/g, ''));
                    exports.push(...names);
                }
                break;
        }

        return exports;
    }

    /**
     * Calculate file complexity
     */
    private calculateFileComplexity(content: string): number {
        let complexity = 1;

        // Count control flow keywords
        const controlFlowKeywords = ['if', 'else', 'elif', 'for', 'while', 'switch', 'case', 'catch', 'try', 'except'];
        for (const keyword of controlFlowKeywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = content.match(regex);
            if (matches) {
                complexity += matches.length;
            }
        }

        // Count logical operators
        const logicalOperators = ['&&', '||', '?'];
        for (const operator of logicalOperators) {
            const escaped = operator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escaped, 'g');
            const matches = content.match(regex);
            if (matches) {
                complexity += matches.length;
            }
        }

        return complexity;
    }

    /**
     * Build dependency graph between files and code elements
     */
    private async buildDependencyGraph(index: RepositoryIndex): Promise<void> {
        // Implementation for dependency graph construction
        // This will analyze imports/exports and build the graph

        for (const [filePath, fileEntry] of index.fileIndex) {
            // Create file node
            const nodeId = `file:${filePath}`;
            index.dependencyGraph.nodes.set(nodeId, {
                id: nodeId,
                filePath,
                type: 'file',
                metadata: {
                    size: fileEntry.size,
                    complexity: fileEntry.complexity,
                    lastModified: fileEntry.lastModified,
                    imports: fileEntry.imports,
                    exports: fileEntry.exports
                }
            });

            // Create edges for imports
            const edges: DependencyEdge[] = [];
            for (const importPath of fileEntry.imports) {
                const targetPath = this.resolveImportPath(importPath, filePath);
                if (targetPath && index.fileIndex.has(targetPath)) {
                    edges.push({
                        from: nodeId,
                        to: `file:${targetPath}`,
                        type: 'import',
                        weight: 1
                    });
                }
            }

            index.dependencyGraph.edges.set(nodeId, edges);
        }
    }

    /**
     * Analyze semantic relationships between code elements
     */
    private async analyzeSemanticRelationships(index: RepositoryIndex): Promise<void> {
        // Implementation for semantic relationship analysis
        // This will find relationships between functions, classes, etc.

        for (const [filePath, fileEntry] of index.fileIndex) {
            for (const element of fileEntry.elements) {
                index.semanticIndex.elements.set(element.id, element);

                // Find relationships with other elements
                const relationships = this.findElementRelationships(element, index);
                index.semanticIndex.relationships.set(element.id, relationships);
            }
        }
    }

    /**
     * Detect patterns and naming conventions
     */
    private async detectPatterns(index: RepositoryIndex): Promise<void> {
        // Analyze naming conventions
        for (const [filePath, fileEntry] of index.fileIndex) {
            for (const element of fileEntry.elements) {
                this.analyzeNamingConvention(element.name, index.namingConventions);
            }
        }

        // Detect architectural patterns
        index.architecturalPatterns = this.detectArchitecturalPatterns(index);
    }

    /**
     * Generate embeddings for code elements
     */
    private async generateEmbeddings(index: RepositoryIndex): Promise<void> {
        // Implementation for generating vector embeddings
        // This would typically use a machine learning model

        for (const [elementId, element] of index.semanticIndex.elements) {
            const embedding = await this.generateElementEmbedding(element);
            index.semanticIndex.embeddings.set(elementId, embedding);
        }
    }

    /**
     * Utility methods
     */
    private calculateFileHash(content: string): string {
        // Simple hash implementation
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }

    private detectLanguage(filePath: string, content: string): string {
        const ext = path.extname(filePath).toLowerCase();

        const languageMap: { [key: string]: string } = {
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.php': 'php',
            '.rb': 'ruby',
            '.go': 'go',
            '.rs': 'rust',
            '.vue': 'vue'
        };

        return languageMap[ext] || 'unknown';
    }

    private resolveImportPath(importPath: string, fromFile: string): string | null {
        // Implementation for resolving import paths
        if (importPath.startsWith('.')) {
            // Relative import
            const dir = path.dirname(fromFile);
            return path.resolve(dir, importPath);
        }

        // Absolute or package import - would need more sophisticated resolution
        return null;
    }

    private findElementRelationships(element: CodeElement, index: RepositoryIndex): string[] {
        // Implementation for finding relationships between elements
        const relationships: string[] = [];

        // Find elements that reference this element
        for (const [otherElementId, otherElement] of index.semanticIndex.elements) {
            if (otherElement.id !== element.id) {
                // Check if other element references this element
                if (this.isElementReferenced(element, otherElement)) {
                    relationships.push(otherElementId);
                }
            }
        }

        return relationships;
    }

    private isElementReferenced(target: CodeElement, source: CodeElement): boolean {
        // Implementation for checking if target element is referenced by source
        // This would analyze the source element's content for references to target
        return false; // Placeholder
    }

    private analyzeNamingConvention(name: string, conventions: NamingConventions): void {
        if (/^[a-z][a-zA-Z0-9]*$/.test(name)) {
            conventions.camelCase++;
        } else if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
            conventions.pascalCase++;
        } else if (/^[a-z][a-z0-9_]*$/.test(name)) {
            conventions.snakeCase++;
        } else if (/^[a-z][a-z0-9-]*$/.test(name)) {
            conventions.kebabCase++;
        }
    }

    private detectArchitecturalPatterns(index: RepositoryIndex): ArchitecturalPattern[] {
        const patterns: ArchitecturalPattern[] = [];

        // MVC Pattern Detection
        const mvcPattern = this.detectMVCPattern(index);
        if (mvcPattern) {
            patterns.push(mvcPattern);
        }

        // Repository Pattern Detection
        const repositoryPattern = this.detectRepositoryPattern(index);
        if (repositoryPattern) {
            patterns.push(repositoryPattern);
        }

        return patterns;
    }

    private detectMVCPattern(index: RepositoryIndex): ArchitecturalPattern | null {
        const modelFiles: string[] = [];
        const viewFiles: string[] = [];
        const controllerFiles: string[] = [];

        for (const [filePath] of index.fileIndex) {
            const fileName = path.basename(filePath).toLowerCase();

            if (fileName.includes('model')) {
                modelFiles.push(filePath);
            } else if (fileName.includes('view') || fileName.includes('component')) {
                viewFiles.push(filePath);
            } else if (fileName.includes('controller') || fileName.includes('service')) {
                controllerFiles.push(filePath);
            }
        }

        if (modelFiles.length > 0 && viewFiles.length > 0 && controllerFiles.length > 0) {
            return {
                name: 'MVC Pattern',
                confidence: 0.8,
                description: 'Model-View-Controller architectural pattern detected',
                files: [...modelFiles, ...viewFiles, ...controllerFiles],
                characteristics: ['Separation of concerns', 'Layered architecture']
            };
        }

        return null;
    }

    private detectRepositoryPattern(index: RepositoryIndex): ArchitecturalPattern | null {
        const repositoryFiles: string[] = [];

        for (const [filePath] of index.fileIndex) {
            const fileName = path.basename(filePath).toLowerCase();

            if (fileName.includes('repository') || fileName.includes('dao')) {
                repositoryFiles.push(filePath);
            }
        }

        if (repositoryFiles.length > 0) {
            return {
                name: 'Repository Pattern',
                confidence: 0.7,
                description: 'Repository pattern for data access abstraction',
                files: repositoryFiles,
                characteristics: ['Data access abstraction', 'Centralized query logic']
            };
        }

        return null;
    }

    private async generateElementEmbedding(element: CodeElement): Promise<number[]> {
        // Placeholder for ML-based embedding generation
        // In a real implementation, this would use a trained model
        const signature = element.signature;
        const embedding = new Array(128).fill(0);

        // Simple hash-based embedding for demonstration
        for (let i = 0; i < signature.length; i++) {
            const char = signature.charCodeAt(i);
            embedding[i % 128] += char;
        }

        return embedding;
    }

    private setupFileWatcher(): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }

        this.fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');

        this.fileWatcher.onDidChange(uri => {
            this.updateQueue.add(uri.fsPath);
            this.scheduleIncrementalUpdate();
        });

        this.fileWatcher.onDidCreate(uri => {
            this.updateQueue.add(uri.fsPath);
            this.scheduleIncrementalUpdate();
        });

        this.fileWatcher.onDidDelete(uri => {
            this.removeFromIndex(uri.fsPath);
        });
    }

    private scheduleIncrementalUpdate(): void {
        // Debounced update to avoid excessive processing
        setTimeout(() => {
            if (this.updateQueue.size > 0) {
                this.performIncrementalUpdate();
            }
        }, 1000);
    }

    private async performIncrementalUpdate(): Promise<void> {
        if (!this.repositoryIndex || this.indexingInProgress) {
            return;
        }

        const filesToUpdate = Array.from(this.updateQueue);
        this.updateQueue.clear();

        for (const filePath of filesToUpdate) {
            const fileEntry = await this.analyzeFile(filePath);
            if (fileEntry) {
                this.repositoryIndex.fileIndex.set(filePath, fileEntry);

                // Update semantic index
                for (const element of fileEntry.elements) {
                    this.repositoryIndex.semanticIndex.elements.set(element.id, element);
                }
            }
        }

        // Rebuild affected parts of dependency graph
        await this.updateDependencyGraph(filesToUpdate);
    }

    private async updateDependencyGraph(updatedFiles: string[]): Promise<void> {
        if (!this.repositoryIndex) return;

        // Update nodes and edges for affected files
        for (const filePath of updatedFiles) {
            const fileEntry = this.repositoryIndex.fileIndex.get(filePath);
            if (fileEntry) {
                const nodeId = `file:${filePath}`;

                // Update node
                this.repositoryIndex.dependencyGraph.nodes.set(nodeId, {
                    id: nodeId,
                    filePath,
                    type: 'file',
                    metadata: {
                        size: fileEntry.size,
                        complexity: fileEntry.complexity,
                        lastModified: fileEntry.lastModified,
                        imports: fileEntry.imports,
                        exports: fileEntry.exports
                    }
                });

                // Update edges
                const edges: DependencyEdge[] = [];
                for (const importPath of fileEntry.imports) {
                    const targetPath = this.resolveImportPath(importPath, filePath);
                    if (targetPath && this.repositoryIndex.fileIndex.has(targetPath)) {
                        edges.push({
                            from: nodeId,
                            to: `file:${targetPath}`,
                            type: 'import',
                            weight: 1
                        });
                    }
                }

                this.repositoryIndex.dependencyGraph.edges.set(nodeId, edges);
            }
        }
    }

    private removeFromIndex(filePath: string): void {
        if (!this.repositoryIndex) return;

        // Remove from file index
        const fileEntry = this.repositoryIndex.fileIndex.get(filePath);
        if (fileEntry) {
            // Remove elements from semantic index
            for (const element of fileEntry.elements) {
                this.repositoryIndex.semanticIndex.elements.delete(element.id);
                this.repositoryIndex.semanticIndex.relationships.delete(element.id);
                this.repositoryIndex.semanticIndex.embeddings.delete(element.id);
            }
        }

        this.repositoryIndex.fileIndex.delete(filePath);

        // Remove from dependency graph
        const nodeId = `file:${filePath}`;
        this.repositoryIndex.dependencyGraph.nodes.delete(nodeId);
        this.repositoryIndex.dependencyGraph.edges.delete(nodeId);
    }

    /**
     * Public API methods
     */
    public getRepositoryIndex(): RepositoryIndex | null {
        return this.repositoryIndex;
    }

    public async searchCodeElements(query: string, limit: number = 10): Promise<CodeElement[]> {
        if (!this.repositoryIndex) {
            return [];
        }

        const results: CodeElement[] = [];
        const searchTerms = query.toLowerCase().split(' ');

        for (const [elementId, element] of this.repositoryIndex.semanticIndex.elements) {
            let score = 0;

            // Score based on name match
            if (element.name.toLowerCase().includes(query.toLowerCase())) {
                score += 10;
            }

            // Score based on signature match
            for (const term of searchTerms) {
                if (element.signature.toLowerCase().includes(term)) {
                    score += 5;
                }
            }

            // Score based on semantic tags
            for (const tag of element.semanticTags) {
                for (const term of searchTerms) {
                    if (tag.toLowerCase().includes(term)) {
                        score += 3;
                    }
                }
            }

            if (score > 0) {
                results.push({ ...element, complexity: score }); // Reuse complexity field for score
            }
        }

        // Sort by score and return top results
        return results
            .sort((a, b) => b.complexity - a.complexity)
            .slice(0, limit);
    }

    public async findSimilarElements(element: CodeElement, limit: number = 5): Promise<CodeElement[]> {
        if (!this.repositoryIndex) {
            return [];
        }

        const targetEmbedding = this.repositoryIndex.semanticIndex.embeddings.get(element.id);
        if (!targetEmbedding) {
            return [];
        }

        const similarities: Array<{ element: CodeElement; similarity: number }> = [];

        for (const [elementId, otherElement] of this.repositoryIndex.semanticIndex.elements) {
            if (elementId === element.id) continue;

            const otherEmbedding = this.repositoryIndex.semanticIndex.embeddings.get(elementId);
            if (!otherEmbedding) continue;

            const similarity = this.calculateCosineSimilarity(targetEmbedding, otherEmbedding);
            similarities.push({ element: otherElement, similarity });
        }

        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)
            .map(s => s.element);
    }

    private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
        if (vectorA.length !== vectorB.length) {
            return 0;
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += vectorA[i] * vectorA[i];
            normB += vectorB[i] * vectorB[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    public getDependencyGraph(): DependencyGraph | null {
        return this.repositoryIndex?.dependencyGraph || null;
    }

    public getArchitecturalPatterns(): ArchitecturalPattern[] {
        return this.repositoryIndex?.architecturalPatterns || [];
    }

    public getNamingConventions(): NamingConventions | null {
        return this.repositoryIndex?.namingConventions || null;
    }

    /**
     * Get all source files in the repository
     */
    public async getSourceFiles(): Promise<string[]> {
        if (!this.repositoryIndex) {
            await this.initializeRepository();
        }

        return Array.from(this.repositoryIndex?.fileIndex.keys() || []);
    }

    /**
     * Get project patterns and conventions
     */
    public async getProjectPatterns(): Promise<ArchitecturalPattern[]> {
        if (!this.repositoryIndex) {
            await this.initializeRepository();
        }

        return this.repositoryIndex?.architecturalPatterns || [];
    }

    /**
     * Get file dependencies for a specific file
     */
    public async getFileDependencies(filePath: string): Promise<string[]> {
        if (!this.repositoryIndex) {
            await this.initializeRepository();
        }

        const fileEntry = this.repositoryIndex?.fileIndex.get(filePath);
        if (!fileEntry) {
            return [];
        }

        return fileEntry.imports || [];
    }

    /**
     * Update the repository index with changed files
     */
    public async updateIndex(changedFiles: string[]): Promise<void> {
        if (!this.repositoryIndex) {
            return;
        }

        for (const filePath of changedFiles) {
            if (fs.existsSync(filePath)) {
                const fileEntry = await this.analyzeFile(filePath);
                if (fileEntry) {
                    this.repositoryIndex.fileIndex.set(filePath, fileEntry);
                }
            } else {
                // File was deleted
                this.repositoryIndex.fileIndex.delete(filePath);
            }
        }

        // Update timestamp
        this.repositoryIndex.timestamp = new Date();
    }

    /**
     * Get repository statistics
     */
    public async getRepositoryStats(): Promise<{
        totalFiles: number;
        totalLines: number;
        languages: Record<string, number>;
        complexity: number;
    }> {
        if (!this.repositoryIndex) {
            await this.initializeRepository();
        }

        const stats = {
            totalFiles: this.repositoryIndex?.fileIndex.size || 0,
            totalLines: 0,
            languages: {} as Record<string, number>,
            complexity: 0
        };

        if (this.repositoryIndex) {
            for (const [, fileEntry] of this.repositoryIndex.fileIndex) {
                stats.totalLines += fileEntry.size;
                stats.complexity += fileEntry.complexity;

                const lang = fileEntry.language;
                stats.languages[lang] = (stats.languages[lang] || 0) + 1;
            }
        }

        return stats;
    }

    /**
     * Get project dependencies
     */
    public async getProjectDependencies(): Promise<Record<string, string>> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return {};
        }

        const packageJsonPath = path.join(workspaceFolder.uri.fsPath, 'package.json');

        try {
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                return {
                    ...packageJson.dependencies || {},
                    ...packageJson.devDependencies || {}
                };
            }
        } catch (error) {
            console.error('Error reading package.json:', error);
        }

        return {};
    }

    /**
     * Get project structure
     */
    public async getProjectStructure(): Promise<{
        directories: string[];
        files: string[];
        structure: any;
    }> {
        if (!this.repositoryIndex) {
            await this.initializeRepository();
        }

        const directories = new Set<string>();
        const files: string[] = [];

        if (this.repositoryIndex) {
            for (const [filePath] of this.repositoryIndex.fileIndex) {
                files.push(filePath);

                // Extract directory path
                const dir = path.dirname(filePath);
                directories.add(dir);
            }
        }

        return {
            directories: Array.from(directories),
            files,
            structure: this.buildDirectoryTree(files)
        };
    }

    /**
     * Get repository path
     */
    public getRepositoryPath(): string {
        return this.repositoryIndex?.rootPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    }

    /**
     * Build directory tree structure
     */
    private buildDirectoryTree(files: string[]): any {
        const tree: any = {};

        for (const filePath of files) {
            const parts = filePath.split(path.sep);
            let current = tree;

            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }

            // Add file
            const fileName = parts[parts.length - 1];
            current[fileName] = null; // null indicates it's a file
        }

        return tree;
    }

    public dispose(): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }
    }
}