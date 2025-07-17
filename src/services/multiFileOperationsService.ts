import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { RepoGrokkingService } from './repoGrokkingService';
import { AIService } from './aiService';

export interface FileOperation {
    type: 'create' | 'modify' | 'delete' | 'rename';
    filePath: string;
    content?: string;
    oldPath?: string;
    newPath?: string;
}

export interface MultiFileTask {
    id: string;
    name: string;
    description: string;
    operations: FileOperation[];
    dependencies: string[];
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    rollbackOperations?: FileOperation[];
}

export interface RefactoringContext {
    targetFiles: string[];
    refactoringType: 'rename' | 'extract' | 'move' | 'restructure';
    parameters: { [key: string]: any };
    safetyChecks: boolean;
}

export class MultiFileOperationsService {
    private repoGrokkingService: RepoGrokkingService;
    private aiService: AIService;
    private activeTasks: Map<string, MultiFileTask> = new Map();
    private operationHistory: FileOperation[] = [];

    constructor(repoGrokkingService: RepoGrokkingService, aiService: AIService) {
        this.repoGrokkingService = repoGrokkingService;
        this.aiService = aiService;
    }

    /**
     * Generate code across multiple files with dependency awareness
     */
    public async generateMultiFileCode(
        prompt: string,
        targetDirectory: string,
        options: {
            followPatterns?: boolean;
            maintainConsistency?: boolean;
            generateTests?: boolean;
            validateReferences?: boolean;
        } = {}
    ): Promise<MultiFileTask> {
        const taskId = this.generateTaskId();
        const task: MultiFileTask = {
            id: taskId,
            name: 'Multi-File Code Generation',
            description: prompt,
            operations: [],
            dependencies: [],
            status: 'pending',
            rollbackOperations: []
        };

        this.activeTasks.set(taskId, task);
        task.status = 'in-progress';

        try {
            // Analyze target directory and existing patterns
            const directoryContext = await this.analyzeTargetDirectory(targetDirectory);
            const projectPatterns = await this.repoGrokkingService.getProjectPatterns();

            // Generate code structure with AI
            const codeStructure = await this.generateCodeStructure(prompt, directoryContext, projectPatterns);

            // Create file operations
            const operations = await this.createFileOperations(codeStructure, targetDirectory, options);
            task.operations = operations;

            // Validate dependencies and references
            if (options.validateReferences) {
                await this.validateReferences(operations);
            }

            // Execute operations
            await this.executeOperations(operations);

            // Generate tests if requested
            if (options.generateTests) {
                const testOperations = await this.generateTests(operations, targetDirectory);
                task.operations.push(...testOperations);
                await this.executeOperations(testOperations);
            }

            task.status = 'completed';
            await this.updateRepoIndex(operations);

            return task;

        } catch (error) {
            task.status = 'failed';
            console.error('Multi-file generation failed:', error);

            // Attempt rollback
            if (task.rollbackOperations && task.rollbackOperations.length > 0) {
                await this.rollbackOperations(task.rollbackOperations);
            }

            throw error;
        }
    }

    /**
     * Perform advanced refactoring across multiple files
     */
    public async performAdvancedRefactoring(context: RefactoringContext): Promise<MultiFileTask> {
        const taskId = this.generateTaskId();
        const task: MultiFileTask = {
            id: taskId,
            name: `Advanced Refactoring: ${context.refactoringType}`,
            description: `Refactoring ${context.targetFiles.length} files`,
            operations: [],
            dependencies: [],
            status: 'pending',
            rollbackOperations: []
        };

        this.activeTasks.set(taskId, task);
        task.status = 'in-progress';

        try {
            // Analyze impact of refactoring
            const impactAnalysis = await this.analyzeRefactoringImpact(context);

            // Create rollback operations first
            task.rollbackOperations = await this.createRollbackOperations(context.targetFiles);

            // Generate refactoring operations
            const operations = await this.generateRefactoringOperations(context, impactAnalysis);
            task.operations = operations;

            // Perform safety checks
            if (context.safetyChecks) {
                await this.performSafetyChecks(operations);
            }

            // Execute refactoring operations
            await this.executeOperations(operations);

            // Validate integrity after refactoring
            await this.validateIntegrity(operations);

            task.status = 'completed';
            await this.updateRepoIndex(operations);

            return task;

        } catch (error) {
            task.status = 'failed';
            console.error('Advanced refactoring failed:', error);

            // Rollback changes
            if (task.rollbackOperations && task.rollbackOperations.length > 0) {
                await this.rollbackOperations(task.rollbackOperations);
            }

            throw error;
        }
    }

    /**
     * Analyze target directory for patterns and context
     */
    private async analyzeTargetDirectory(targetDirectory: string): Promise<any> {
        const files = await this.getDirectoryFiles(targetDirectory);
        const fileAnalysis = await Promise.all(
            files.map(async (file) => {
                const content = await fs.promises.readFile(file, 'utf-8');
                return {
                    path: file,
                    language: this.detectLanguage(file),
                    patterns: await this.extractPatterns(content),
                    imports: await this.extractImports(content),
                    exports: await this.extractExports(content)
                };
            })
        );

        return {
            files: fileAnalysis,
            commonPatterns: this.findCommonPatterns(fileAnalysis),
            namingConventions: this.detectNamingConventions(fileAnalysis),
            architecturalStyle: this.detectArchitecturalStyle(fileAnalysis)
        };
    }

    /**
     * Generate code structure using AI
     */
    private async generateCodeStructure(
        prompt: string,
        directoryContext: any,
        projectPatterns: any
    ): Promise<any> {
        const contextPrompt = `
Generate a multi-file code structure for: ${prompt}

Directory Context:
- Common patterns: ${JSON.stringify(directoryContext.commonPatterns)}
- Naming conventions: ${JSON.stringify(directoryContext.namingConventions)}
- Architectural style: ${directoryContext.architecturalStyle}

Project Patterns:
${JSON.stringify(projectPatterns)}

Please provide a detailed file structure with:
1. File names and paths
2. Code content for each file
3. Dependencies between files
4. Import/export statements
5. Consistent naming and patterns

Respond in JSON format with the structure:
{
  "files": [
    {
      "path": "relative/path/to/file.ts",
      "content": "file content",
      "dependencies": ["other/file.ts"],
      "language": "typescript"
    }
  ],
  "dependencies": {
    "file1": ["file2", "file3"],
    "file2": ["file3"]
  }
}
`;

        const response = await this.aiService.sendMessage(contextPrompt);

        try {
            // Extract JSON from response
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }

            // Fallback: try to parse the entire response
            return JSON.parse(response);
        } catch (error) {
            console.error('Failed to parse AI response:', error);
            throw new Error('Failed to generate code structure');
        }
    }

    /**
     * Create file operations from code structure
     */
    private async createFileOperations(
        codeStructure: any,
        targetDirectory: string,
        options: any
    ): Promise<FileOperation[]> {
        const operations: FileOperation[] = [];

        for (const file of codeStructure.files) {
            const fullPath = path.join(targetDirectory, file.path);

            // Ensure directory exists
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                await fs.promises.mkdir(dir, { recursive: true });
            }

            // Apply consistency checks
            let content = file.content;
            if (options.maintainConsistency) {
                content = await this.applyConsistencyRules(content, file.language);
            }

            operations.push({
                type: 'create',
                filePath: fullPath,
                content: content
            });
        }

        return operations;
    }

    /**
     * Validate references between files
     */
    private async validateReferences(operations: FileOperation[]): Promise<void> {
        const fileMap = new Map<string, string>();

        // Build file content map
        operations.forEach(op => {
            if (op.type === 'create' && op.content) {
                fileMap.set(op.filePath, op.content);
            }
        });

        // Validate imports and references
        for (const [filePath, content] of fileMap) {
            const imports = await this.extractImports(content);

            for (const importPath of imports) {
                const resolvedPath = this.resolveImportPath(importPath, filePath);

                if (!fileMap.has(resolvedPath) && !fs.existsSync(resolvedPath)) {
                    throw new Error(`Invalid import reference: ${importPath} in ${filePath}`);
                }
            }
        }
    }

    /**
     * Execute file operations
     */
    private async executeOperations(operations: FileOperation[]): Promise<void> {
        for (const operation of operations) {
            try {
                switch (operation.type) {
                    case 'create':
                        if (operation.content) {
                            await fs.promises.writeFile(operation.filePath, operation.content, 'utf-8');
                        }
                        break;

                    case 'modify':
                        if (operation.content) {
                            await fs.promises.writeFile(operation.filePath, operation.content, 'utf-8');
                        }
                        break;

                    case 'delete':
                        if (fs.existsSync(operation.filePath)) {
                            await fs.promises.unlink(operation.filePath);
                        }
                        break;

                    case 'rename':
                        if (operation.oldPath && operation.newPath) {
                            await fs.promises.rename(operation.oldPath, operation.newPath);
                        }
                        break;
                }

                this.operationHistory.push(operation);
            } catch (error) {
                console.error(`Failed to execute operation ${operation.type} on ${operation.filePath}:`, error);
                throw error;
            }
        }
    }

    /**
     * Generate tests for created files
     */
    private async generateTests(operations: FileOperation[], targetDirectory: string): Promise<FileOperation[]> {
        const testOperations: FileOperation[] = [];

        for (const operation of operations) {
            if (operation.type === 'create' && operation.content) {
                const testContent = await this.generateTestContent(operation.filePath, operation.content);
                const testPath = this.getTestFilePath(operation.filePath, targetDirectory);

                testOperations.push({
                    type: 'create',
                    filePath: testPath,
                    content: testContent
                });
            }
        }

        return testOperations;
    }

    /**
     * Generate test content for a file
     */
    private async generateTestContent(filePath: string, content: string): Promise<string> {
        const language = this.detectLanguage(filePath);
        const testPrompt = `
Generate comprehensive unit tests for the following ${language} code:

File: ${filePath}
Content:
${content}

Please generate tests that cover:
1. Main functionality
2. Edge cases
3. Error handling
4. Integration points

Use appropriate testing framework for ${language}.
`;

        return await this.aiService.sendMessage(testPrompt);
    }

    /**
     * Analyze refactoring impact
     */
    private async analyzeRefactoringImpact(context: RefactoringContext): Promise<any> {
        const analysis = {
            affectedFiles: new Set<string>(),
            dependencyChanges: [] as any[],
            riskLevel: 'low' as 'low' | 'medium' | 'high',
            estimatedChanges: 0
        };

        // Analyze each target file
        for (const filePath of context.targetFiles) {
            const dependencies = await this.repoGrokkingService.getFileDependencies(filePath);
            dependencies.forEach(dep => analysis.affectedFiles.add(dep));
        }

        // Calculate risk level
        analysis.estimatedChanges = analysis.affectedFiles.size;
        if (analysis.estimatedChanges > 20) {
            analysis.riskLevel = 'high';
        } else if (analysis.estimatedChanges > 10) {
            analysis.riskLevel = 'medium';
        }

        return analysis;
    }

    /**
     * Create rollback operations
     */
    private async createRollbackOperations(targetFiles: string[]): Promise<FileOperation[]> {
        const rollbackOps: FileOperation[] = [];

        for (const filePath of targetFiles) {
            if (fs.existsSync(filePath)) {
                const content = await fs.promises.readFile(filePath, 'utf-8');
                rollbackOps.push({
                    type: 'modify',
                    filePath: filePath,
                    content: content
                });
            }
        }

        return rollbackOps;
    }

    /**
     * Generate refactoring operations
     */
    private async generateRefactoringOperations(
        context: RefactoringContext,
        impactAnalysis: any
    ): Promise<FileOperation[]> {
        const operations: FileOperation[] = [];

        for (const filePath of context.targetFiles) {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const refactoredContent = await this.performRefactoring(content, context, filePath);

            operations.push({
                type: 'modify',
                filePath: filePath,
                content: refactoredContent
            });
        }

        return operations;
    }

    /**
     * Perform specific refactoring on content
     */
    private async performRefactoring(
        content: string,
        context: RefactoringContext,
        filePath: string
    ): Promise<string> {
        const refactoringPrompt = `
Perform ${context.refactoringType} refactoring on the following code:

File: ${filePath}
Content:
${content}

Refactoring Parameters:
${JSON.stringify(context.parameters)}

Please ensure:
1. Code functionality remains intact
2. Consistent naming conventions
3. Proper imports/exports
4. No breaking changes to public interfaces
5. Maintain code quality and readability

Return only the refactored code.
`;

        return await this.aiService.sendMessage(refactoringPrompt);
    }

    /**
     * Perform safety checks on operations
     */
    private async performSafetyChecks(operations: FileOperation[]): Promise<void> {
        for (const operation of operations) {
            // Check for syntax errors
            if (operation.content && operation.type !== 'delete') {
                const language = this.detectLanguage(operation.filePath);
                await this.validateSyntax(operation.content, language);
            }

            // Check for breaking changes
            if (operation.type === 'modify') {
                await this.checkBreakingChanges(operation.filePath, operation.content || '');
            }
        }
    }

    /**
     * Validate syntax of content
     */
    private async validateSyntax(content: string, language: string): Promise<void> {
        // This would integrate with language-specific parsers
        // For now, basic validation
        if (language === 'typescript' || language === 'javascript') {
            try {
                // Basic syntax check using AST parsing
                const ast = await this.parseAST(content, language);
                if (!ast) {
                    throw new Error('Invalid syntax');
                }
            } catch (error) {
                throw new Error(`Syntax error in ${language}: ${error}`);
            }
        }
    }

    /**
     * Check for breaking changes
     */
    private async checkBreakingChanges(filePath: string, newContent: string): Promise<void> {
        if (!fs.existsSync(filePath)) return;

        const oldContent = await fs.promises.readFile(filePath, 'utf-8');
        const oldExports = await this.extractExports(oldContent);
        const newExports = await this.extractExports(newContent);

        // Check if any exports were removed
        const removedExports = oldExports.filter(exp => !newExports.includes(exp));
        if (removedExports.length > 0) {
            throw new Error(`Breaking change detected: Removed exports ${removedExports.join(', ')}`);
        }
    }

    /**
     * Validate integrity after operations
     */
    private async validateIntegrity(operations: FileOperation[]): Promise<void> {
        // Check that all modified files still compile/parse correctly
        for (const operation of operations) {
            if (operation.type !== 'delete' && fs.existsSync(operation.filePath)) {
                const content = await fs.promises.readFile(operation.filePath, 'utf-8');
                const language = this.detectLanguage(operation.filePath);
                await this.validateSyntax(content, language);
            }
        }
    }

    /**
     * Rollback operations
     */
    private async rollbackOperations(operations: FileOperation[]): Promise<void> {
        for (const operation of operations.reverse()) {
            await this.executeOperations([operation]);
        }
    }

    /**
     * Update repository index after operations
     */
    private async updateRepoIndex(operations: FileOperation[]): Promise<void> {
        const changedFiles = operations.map(op => op.filePath);
        await this.repoGrokkingService.updateIndex(changedFiles);
    }

    // Helper methods
    private generateTaskId(): string {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private async getDirectoryFiles(directory: string): Promise<string[]> {
        const files: string[] = [];
        const items = await fs.promises.readdir(directory, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(directory, item.name);
            if (item.isDirectory()) {
                files.push(...await this.getDirectoryFiles(fullPath));
            } else if (this.isCodeFile(item.name)) {
                files.push(fullPath);
            }
        }

        return files;
    }

    private isCodeFile(fileName: string): boolean {
        const codeExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.cs', '.php'];
        return codeExtensions.some(ext => fileName.endsWith(ext));
    }

    private detectLanguage(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase();
        const languageMap: { [key: string]: string } = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.php': 'php'
        };

        return languageMap[ext] || 'text';
    }

    private async extractPatterns(content: string): Promise<string[]> {
        // Extract coding patterns from content
        const patterns: string[] = [];

        // Look for common patterns
        if (content.includes('class ')) patterns.push('class-based');
        if (content.includes('function ')) patterns.push('function-based');
        if (content.includes('const ') && content.includes('=> ')) patterns.push('arrow-functions');
        if (content.includes('async ')) patterns.push('async-await');
        if (content.includes('import ')) patterns.push('es6-modules');

        return patterns;
    }

    private async extractImports(content: string): Promise<string[]> {
        const imports: string[] = [];
        const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
        let match;

        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }

        return imports;
    }

    private async extractExports(content: string): Promise<string[]> {
        const exports: string[] = [];
        const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
        let match;

        while ((match = exportRegex.exec(content)) !== null) {
            exports.push(match[1]);
        }

        return exports;
    }

    private findCommonPatterns(fileAnalysis: any[]): string[] {
        const patternCounts: { [key: string]: number } = {};

        fileAnalysis.forEach(file => {
            file.patterns.forEach((pattern: string) => {
                patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
            });
        });

        return Object.entries(patternCounts)
            .filter(([, count]) => count > 1)
            .map(([pattern]) => pattern);
    }

    private detectNamingConventions(fileAnalysis: any[]): any {
        // Analyze naming conventions across files
        return {
            fileNaming: 'camelCase', // This would be analyzed
            functionNaming: 'camelCase',
            classNaming: 'PascalCase',
            constantNaming: 'UPPER_CASE'
        };
    }

    private detectArchitecturalStyle(fileAnalysis: any[]): string {
        // Analyze architectural patterns
        const patterns = fileAnalysis.flatMap(file => file.patterns);

        if (patterns.includes('class-based')) return 'object-oriented';
        if (patterns.includes('function-based')) return 'functional';
        return 'mixed';
    }

    private async applyConsistencyRules(content: string, language: string): Promise<string> {
        // Apply project-specific consistency rules
        return content; // This would apply formatting and style rules
    }

    private resolveImportPath(importPath: string, fromFile: string): string {
        // Resolve relative import paths
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
            return path.resolve(path.dirname(fromFile), importPath);
        }
        return importPath;
    }

    private getTestFilePath(filePath: string, baseDirectory: string): string {
        const relativePath = path.relative(baseDirectory, filePath);
        const parsedPath = path.parse(relativePath);
        return path.join(baseDirectory, '__tests__', parsedPath.dir, `${parsedPath.name}.test${parsedPath.ext}`);
    }

    private async parseAST(content: string, language: string): Promise<any> {
        // This would use language-specific parsers
        // For now, return a mock AST
        return { type: 'Program', body: [] };
    }

    /**
     * Get active tasks
     */
    public getActiveTasks(): MultiFileTask[] {
        return Array.from(this.activeTasks.values());
    }

    /**
     * Get task by ID
     */
    public getTask(taskId: string): MultiFileTask | undefined {
        return this.activeTasks.get(taskId);
    }

    /**
     * Get operation history
     */
    public getOperationHistory(): FileOperation[] {
        return [...this.operationHistory];
    }
}