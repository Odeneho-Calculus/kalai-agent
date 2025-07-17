import * as vscode from 'vscode';
import { AIService } from './aiService';
import { RepositoryAnalysisService, CodeElement } from './repositoryAnalysisService';
import { FileContext, ProjectContext } from './codeContextManager';

export interface AgenticTask {
    id: string;
    type: 'code-generation' | 'refactoring' | 'analysis' | 'testing' | 'documentation';
    description: string;
    priority: number;
    status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    context: TaskContext;
    steps: TaskStep[];
    currentStep: number;
    result?: TaskResult;
    error?: string;
}

export interface TaskContext {
    workspaceRoot: string;
    targetFiles: string[];
    selectedText?: string;
    userInstructions: string;
    projectContext: ProjectContext;
    repoIndex: any; // From RepoGrokkingService
    constraints: TaskConstraints;
}

export interface TaskConstraints {
    maxFilesToModify: number;
    preserveExistingTests: boolean;
    maintainBackwardCompatibility: boolean;
    followProjectConventions: boolean;
    requireValidation: boolean;
    allowExternalDependencies: boolean;
}

export interface TaskStep {
    id: string;
    type: 'analysis' | 'planning' | 'implementation' | 'validation' | 'testing' | 'documentation';
    description: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped';
    input: any;
    output?: any;
    error?: string;
    duration?: number;
    validation?: ValidationResult;
}

export interface TaskResult {
    success: boolean;
    filesModified: FileModification[];
    filesCreated: FileCreation[];
    filesDeleted: string[];
    summary: string;
    metrics: TaskMetrics;
    recommendations: string[];
}

export interface FileModification {
    filePath: string;
    originalContent: string;
    modifiedContent: string;
    changes: Change[];
    impact: ImpactAnalysis;
}

export interface FileCreation {
    filePath: string;
    content: string;
    purpose: string;
    impact: ImpactAnalysis;
}

export interface Change {
    type: 'addition' | 'deletion' | 'modification';
    startLine: number;
    endLine: number;
    originalText: string;
    newText: string;
    reason: string;
}

export interface ImpactAnalysis {
    affectedFiles: string[];
    breakingChanges: BreakingChange[];
    performanceImpact: 'positive' | 'negative' | 'neutral';
    securityImpact: 'improved' | 'degraded' | 'neutral';
    complexity: number;
    testCoverage: number;
}

export interface BreakingChange {
    type: 'api' | 'signature' | 'behavior' | 'dependency';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    mitigation: string;
    affectedElements: string[];
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: string[];
    confidence: number;
}

export interface ValidationError {
    type: 'syntax' | 'semantic' | 'logical' | 'performance' | 'security';
    message: string;
    file: string;
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
    type: 'style' | 'convention' | 'performance' | 'maintainability';
    message: string;
    file: string;
    line: number;
    column: number;
    suggestion: string;
}

export interface TaskMetrics {
    executionTime: number;
    linesOfCodeModified: number;
    filesAffected: number;
    testCoverage: number;
    codeQuality: number;
    complexity: number;
    performanceScore: number;
}

export interface PipelineConfiguration {
    enableValidation: boolean;
    enableTesting: boolean;
    enableErrorCorrection: boolean;
    maxRetries: number;
    timeout: number;
    parallelExecution: boolean;
    validationThreshold: number;
    autoFixErrors: boolean;
}

export class AgenticPipelineService {
    private aiService: AIService;
    private repositoryAnalysisService: RepositoryAnalysisService;
    private activeTasks: Map<string, AgenticTask> = new Map();
    private taskQueue: AgenticTask[] = [];
    private isProcessing = false;
    private config: PipelineConfiguration;

    constructor(aiService: AIService, repositoryAnalysisService: RepositoryAnalysisService) {
        this.aiService = aiService;
        this.repositoryAnalysisService = repositoryAnalysisService;
        this.config = {
            enableValidation: true,
            enableTesting: true,
            enableErrorCorrection: true,
            maxRetries: 3,
            timeout: 300000, // 5 minutes
            parallelExecution: false,
            validationThreshold: 0.8,
            autoFixErrors: true
        };
    }

    /**
     * Create and queue a new agentic task
     */
    public async createTask(
        type: AgenticTask['type'],
        description: string,
        context: Partial<TaskContext>,
        constraints: Partial<TaskConstraints> = {}
    ): Promise<string> {
        const taskId = this.generateTaskId();

        // Get current project context
        const projectContext = await this.getProjectContext();
        const repoIndex = this.repositoryAnalysisService.getRepositoryIndex();

        const task: AgenticTask = {
            id: taskId,
            type,
            description,
            priority: 1,
            status: 'pending',
            createdAt: new Date(),
            context: {
                workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
                targetFiles: context.targetFiles || [],
                selectedText: context.selectedText,
                userInstructions: context.userInstructions || description,
                projectContext,
                repoIndex,
                constraints: {
                    maxFilesToModify: 10,
                    preserveExistingTests: true,
                    maintainBackwardCompatibility: true,
                    followProjectConventions: true,
                    requireValidation: true,
                    allowExternalDependencies: false,
                    ...constraints
                }
            },
            steps: this.generateTaskSteps(type, description, context),
            currentStep: 0
        };

        this.activeTasks.set(taskId, task);
        this.taskQueue.push(task);

        // Start processing if not already running
        if (!this.isProcessing) {
            this.processTaskQueue();
        }

        return taskId;
    }

    /**
     * Generate task steps based on task type
     */
    private generateTaskSteps(
        type: AgenticTask['type'],
        description: string,
        context: Partial<TaskContext>
    ): TaskStep[] {
        const baseSteps: TaskStep[] = [
            {
                id: `${type}-analysis`,
                type: 'analysis',
                description: 'Analyze current codebase and requirements',
                status: 'pending',
                input: { description, context }
            }
        ];

        switch (type) {
            case 'code-generation':
                return [
                    ...baseSteps,
                    {
                        id: `${type}-planning`,
                        type: 'planning',
                        description: 'Plan code generation strategy',
                        status: 'pending',
                        input: null
                    },
                    {
                        id: `${type}-implementation`,
                        type: 'implementation',
                        description: 'Generate code implementation',
                        status: 'pending',
                        input: null
                    },
                    {
                        id: `${type}-validation`,
                        type: 'validation',
                        description: 'Validate generated code',
                        status: 'pending',
                        input: null
                    },
                    {
                        id: `${type}-testing`,
                        type: 'testing',
                        description: 'Test generated code',
                        status: 'pending',
                        input: null
                    }
                ];

            case 'refactoring':
                return [
                    ...baseSteps,
                    {
                        id: `${type}-impact-analysis`,
                        type: 'analysis',
                        description: 'Analyze refactoring impact',
                        status: 'pending',
                        input: null
                    },
                    {
                        id: `${type}-implementation`,
                        type: 'implementation',
                        description: 'Perform refactoring',
                        status: 'pending',
                        input: null
                    },
                    {
                        id: `${type}-validation`,
                        type: 'validation',
                        description: 'Validate refactored code',
                        status: 'pending',
                        input: null
                    },
                    {
                        id: `${type}-testing`,
                        type: 'testing',
                        description: 'Test refactored code',
                        status: 'pending',
                        input: null
                    }
                ];

            case 'analysis':
                return [
                    ...baseSteps,
                    {
                        id: `${type}-deep-analysis`,
                        type: 'analysis',
                        description: 'Perform deep code analysis',
                        status: 'pending',
                        input: null
                    },
                    {
                        id: `${type}-documentation`,
                        type: 'documentation',
                        description: 'Document analysis results',
                        status: 'pending',
                        input: null
                    }
                ];

            case 'testing':
                return [
                    ...baseSteps,
                    {
                        id: `${type}-test-planning`,
                        type: 'planning',
                        description: 'Plan test strategy',
                        status: 'pending',
                        input: null
                    },
                    {
                        id: `${type}-test-generation`,
                        type: 'implementation',
                        description: 'Generate test cases',
                        status: 'pending',
                        input: null
                    },
                    {
                        id: `${type}-test-execution`,
                        type: 'testing',
                        description: 'Execute tests',
                        status: 'pending',
                        input: null
                    }
                ];

            case 'documentation':
                return [
                    ...baseSteps,
                    {
                        id: `${type}-content-generation`,
                        type: 'implementation',
                        description: 'Generate documentation content',
                        status: 'pending',
                        input: null
                    },
                    {
                        id: `${type}-formatting`,
                        type: 'implementation',
                        description: 'Format documentation',
                        status: 'pending',
                        input: null
                    }
                ];

            default:
                return baseSteps;
        }
    }

    /**
     * Process task queue
     */
    private async processTaskQueue(): Promise<void> {
        if (this.isProcessing || this.taskQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.taskQueue.length > 0) {
            const task = this.taskQueue.shift()!;
            await this.executeTask(task);
        }

        this.isProcessing = false;
    }

    /**
     * Execute a single task
     */
    private async executeTask(task: AgenticTask): Promise<void> {
        try {
            task.status = 'in-progress';
            task.startedAt = new Date();

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Agentic Pipeline: ${task.description}`,
                cancellable: true
            }, async (progress, token) => {
                const totalSteps = task.steps.length;

                for (let i = 0; i < totalSteps; i++) {
                    if (token.isCancellationRequested) {
                        task.status = 'cancelled';
                        return;
                    }

                    const step = task.steps[i];
                    task.currentStep = i;

                    progress.report({
                        increment: (100 / totalSteps),
                        message: `Step ${i + 1}/${totalSteps}: ${step.description}`
                    });

                    await this.executeTaskStep(task, step);

                    if (step.status === 'failed' && !this.config.enableErrorCorrection) {
                        task.status = 'failed';
                        task.error = step.error;
                        break;
                    }
                }
            });

            if (task.status === 'in-progress') {
                task.status = 'completed';
                task.completedAt = new Date();
            }

        } catch (error) {
            task.status = 'failed';
            task.error = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Task ${task.id} failed:`, error);
        }
    }

    /**
     * Execute a single task step
     */
    private async executeTaskStep(task: AgenticTask, step: TaskStep): Promise<void> {
        const startTime = Date.now();
        step.status = 'in-progress';

        try {
            switch (step.type) {
                case 'analysis':
                    step.output = await this.performAnalysis(task, step);
                    break;
                case 'planning':
                    step.output = await this.performPlanning(task, step);
                    break;
                case 'implementation':
                    step.output = await this.performImplementation(task, step);
                    break;
                case 'validation':
                    step.output = await this.performValidation(task, step);
                    break;
                case 'testing':
                    step.output = await this.performTesting(task, step);
                    break;
                case 'documentation':
                    step.output = await this.performDocumentation(task, step);
                    break;
            }

            step.status = 'completed';
            step.duration = Date.now() - startTime;

        } catch (error) {
            step.status = 'failed';
            step.error = error instanceof Error ? error.message : 'Unknown error';
            step.duration = Date.now() - startTime;

            // Attempt error correction if enabled
            if (this.config.enableErrorCorrection && this.config.autoFixErrors) {
                await this.attemptErrorCorrection(task, step);
            }
        }
    }

    /**
     * Perform analysis step
     */
    private async performAnalysis(task: AgenticTask, step: TaskStep): Promise<any> {
        const { context } = task;
        const repoIndex = this.repositoryAnalysisService.getRepositoryIndex();

        // Analyze target files
        const fileAnalysis = await this.analyzeTargetFiles(context.targetFiles);

        // Analyze dependencies
        const dependencyAnalysis = await this.analyzeDependencies(context.targetFiles);

        // Analyze architectural patterns
        const architecturalAnalysis = this.repositoryAnalysisService.getArchitecturalPatterns();

        // Analyze naming conventions
        const namingAnalysis = this.repositoryAnalysisService.getNamingConventions();

        return {
            fileAnalysis,
            dependencyAnalysis,
            architecturalAnalysis,
            namingAnalysis,
            repoIndex: repoIndex ? {
                totalFiles: repoIndex.fileIndex.size,
                totalElements: repoIndex.semanticIndex.elements.size,
                complexityScore: this.calculateOverallComplexity(repoIndex)
            } : null
        };
    }

    /**
     * Perform planning step
     */
    private async performPlanning(task: AgenticTask, step: TaskStep): Promise<any> {
        const analysisResult = this.getPreviousStepOutput(task, 'analysis');

        // Generate implementation plan using AI
        const planningPrompt = this.createPlanningPrompt(task, analysisResult);
        const planResponse = await this.aiService.sendMessage(planningPrompt);

        // Parse plan into structured format
        const plan = this.parsePlanResponse(planResponse);

        return {
            rawPlan: planResponse,
            structuredPlan: plan,
            estimatedComplexity: this.estimateImplementationComplexity(plan),
            risks: this.identifyImplementationRisks(plan),
            prerequisites: this.identifyPrerequisites(plan)
        };
    }

    /**
     * Perform implementation step
     */
    private async performImplementation(task: AgenticTask, step: TaskStep): Promise<any> {
        const planningResult = this.getPreviousStepOutput(task, 'planning');
        const analysisResult = this.getPreviousStepOutput(task, 'analysis');

        // Generate implementation using AI
        const implementationPrompt = this.createImplementationPrompt(task, planningResult, analysisResult);
        const implementation = await this.aiService.sendMessage(implementationPrompt);

        // Parse implementation into file changes
        const fileChanges = await this.parseImplementationResponse(implementation);

        // Apply changes (dry run for validation)
        const simulationResult = await this.simulateChanges(fileChanges);

        return {
            rawImplementation: implementation,
            fileChanges,
            simulationResult,
            impactAnalysis: await this.analyzeImplementationImpact(fileChanges)
        };
    }

    /**
     * Perform validation step
     */
    private async performValidation(task: AgenticTask, step: TaskStep): Promise<ValidationResult> {
        const implementationResult = this.getPreviousStepOutput(task, 'implementation');

        const validationResult: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: [],
            confidence: 0
        };

        // Syntax validation
        const syntaxErrors = await this.validateSyntax(implementationResult.fileChanges);
        validationResult.errors.push(...syntaxErrors);

        // Semantic validation
        const semanticErrors = await this.validateSemantics(implementationResult.fileChanges);
        validationResult.errors.push(...semanticErrors);

        // Style validation
        const styleWarnings = await this.validateStyle(implementationResult.fileChanges);
        validationResult.warnings.push(...styleWarnings);

        // Performance validation
        const performanceWarnings = await this.validatePerformance(implementationResult.fileChanges);
        validationResult.warnings.push(...performanceWarnings);

        // Security validation
        const securityErrors = await this.validateSecurity(implementationResult.fileChanges);
        validationResult.errors.push(...securityErrors);

        validationResult.isValid = validationResult.errors.length === 0;
        validationResult.confidence = this.calculateValidationConfidence(validationResult);

        return validationResult;
    }

    /**
     * Perform testing step
     */
    private async performTesting(task: AgenticTask, step: TaskStep): Promise<any> {
        const implementationResult = this.getPreviousStepOutput(task, 'implementation');

        // Generate test cases
        const testCases = await this.generateTestCases(task, implementationResult);

        // Execute tests
        const testResults = await this.executeTests(testCases);

        return {
            testCases,
            testResults,
            coverage: this.calculateTestCoverage(testResults),
            passed: testResults.filter(r => r.passed).length,
            failed: testResults.filter(r => !r.passed).length
        };
    }

    /**
     * Perform documentation step
     */
    private async performDocumentation(task: AgenticTask, step: TaskStep): Promise<any> {
        const implementationResult = this.getPreviousStepOutput(task, 'implementation');

        // Generate documentation
        const documentationPrompt = this.createDocumentationPrompt(task, implementationResult);
        const documentation = await this.aiService.sendMessage(documentationPrompt);

        return {
            documentation,
            format: 'markdown',
            sections: this.parseDocumentationSections(documentation)
        };
    }

    /**
     * Attempt error correction for failed steps
     */
    private async attemptErrorCorrection(task: AgenticTask, step: TaskStep): Promise<void> {
        if (!step.error) return;

        const correctionPrompt = this.createErrorCorrectionPrompt(task, step);
        const correction = await this.aiService.sendMessage(correctionPrompt);

        // Apply correction and retry step
        try {
            // Parse correction and apply fixes
            const fixes = this.parseErrorCorrection(correction);
            await this.applyErrorFixes(task, step, fixes);

            // Retry step execution
            await this.executeTaskStep(task, step);
        } catch (error) {
            // If correction fails, mark step as failed
            step.status = 'failed';
            step.error = `Error correction failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }

    /**
     * Utility methods
     */
    private generateTaskId(): string {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private async getProjectContext(): Promise<ProjectContext> {
        // Implementation depends on CodeContextManager
        return {
            files: [],
            dependencies: {},
            detectedFramework: 'unknown'
        };
    }

    private async analyzeTargetFiles(filePaths: string[]): Promise<any> {
        const analysis = [];

        for (const filePath of filePaths) {
            try {
                const uri = vscode.Uri.file(filePath);
                const document = await vscode.workspace.openTextDocument(uri);
                const content = document.getText();

                analysis.push({
                    filePath,
                    language: document.languageId,
                    size: content.length,
                    complexity: this.calculateFileComplexity(content),
                    structure: this.analyzeFileStructure(content, document.languageId)
                });
            } catch (error) {
                console.error(`Error analyzing file ${filePath}:`, error);
            }
        }

        return analysis;
    }

    private async analyzeDependencies(filePaths: string[]): Promise<any> {
        const dependencies = new Map<string, string[]>();

        for (const filePath of filePaths) {
            try {
                const uri = vscode.Uri.file(filePath);
                const document = await vscode.workspace.openTextDocument(uri);
                const content = document.getText();

                const imports = this.extractImports(content, document.languageId);
                dependencies.set(filePath, imports);
            } catch (error) {
                console.error(`Error analyzing dependencies for ${filePath}:`, error);
            }
        }

        return Object.fromEntries(dependencies);
    }

    private calculateOverallComplexity(repoIndex: any): number {
        let totalComplexity = 0;
        let fileCount = 0;

        for (const [, fileEntry] of repoIndex.fileIndex) {
            totalComplexity += fileEntry.complexity;
            fileCount++;
        }

        return fileCount > 0 ? totalComplexity / fileCount : 0;
    }

    private getPreviousStepOutput(task: AgenticTask, stepType: string): any {
        const step = task.steps.find(s => s.type === stepType && s.status === 'completed');
        return step?.output || null;
    }

    private createPlanningPrompt(task: AgenticTask, analysisResult: any): string {
        return `
Based on the following analysis, create a detailed implementation plan:

Task: ${task.description}
Type: ${task.type}

Analysis Results:
${JSON.stringify(analysisResult, null, 2)}

Create a step-by-step implementation plan that includes:
1. Required file modifications
2. New files to create
3. Dependencies to consider
4. Potential risks and mitigation strategies
5. Testing approach
6. Quality assurance measures

Ensure the plan follows best practices and maintains code quality.
`;
    }

    private createImplementationPrompt(task: AgenticTask, planningResult: any, analysisResult: any): string {
        return `
Implement the following task based on the analysis and plan:

Task: ${task.description}
Type: ${task.type}

Implementation Plan:
${JSON.stringify(planningResult, null, 2)}

Analysis Results:
${JSON.stringify(analysisResult, null, 2)}

Generate the complete implementation including:
1. All necessary code changes
2. Proper error handling
3. Documentation
4. Following project conventions
5. Maintaining backward compatibility

Provide the implementation in a structured format that can be parsed and applied.
`;
    }

    private createDocumentationPrompt(task: AgenticTask, implementationResult: any): string {
        return `
Generate comprehensive documentation for the following implementation:

Task: ${task.description}
Implementation: ${JSON.stringify(implementationResult, null, 2)}

Create documentation that includes:
1. Overview of changes
2. API documentation
3. Usage examples
4. Migration guide (if applicable)
5. Known limitations
6. Future improvements

Format the documentation in Markdown.
`;
    }

    private createErrorCorrectionPrompt(task: AgenticTask, step: TaskStep): string {
        return `
The following step failed during execution:

Task: ${task.description}
Step: ${step.description}
Error: ${step.error}
Input: ${JSON.stringify(step.input, null, 2)}

Analyze the error and provide corrections to fix the issue.
Consider:
1. Root cause of the error
2. Specific fixes needed
3. Alternative approaches
4. Prevention strategies

Provide actionable corrections that can be applied automatically.
`;
    }

    private parsePlanResponse(response: string): any {
        // Parse structured plan from AI response
        // This would include more sophisticated parsing
        return {
            steps: [],
            requirements: [],
            timeline: 'TBD',
            risks: []
        };
    }

    private async parseImplementationResponse(response: string): Promise<any[]> {
        // Parse file changes from AI response
        return [];
    }

    private async simulateChanges(fileChanges: any[]): Promise<any> {
        // Simulate applying changes without actually modifying files
        return {
            success: true,
            conflicts: [],
            warnings: []
        };
    }

    private async analyzeImplementationImpact(fileChanges: any[]): Promise<ImpactAnalysis> {
        return {
            affectedFiles: [],
            breakingChanges: [],
            performanceImpact: 'neutral',
            securityImpact: 'neutral',
            complexity: 1,
            testCoverage: 0
        };
    }

    private async validateSyntax(fileChanges: any[]): Promise<ValidationError[]> {
        return [];
    }

    private async validateSemantics(fileChanges: any[]): Promise<ValidationError[]> {
        return [];
    }

    private async validateStyle(fileChanges: any[]): Promise<ValidationWarning[]> {
        return [];
    }

    private async validatePerformance(fileChanges: any[]): Promise<ValidationWarning[]> {
        return [];
    }

    private async validateSecurity(fileChanges: any[]): Promise<ValidationError[]> {
        return [];
    }

    private calculateValidationConfidence(result: ValidationResult): number {
        const totalIssues = result.errors.length + result.warnings.length;
        return Math.max(0, 1 - (totalIssues * 0.1));
    }

    private async generateTestCases(task: AgenticTask, implementationResult: any): Promise<any[]> {
        return [];
    }

    private async executeTests(testCases: any[]): Promise<any[]> {
        return [];
    }

    private calculateTestCoverage(testResults: any[]): number {
        return 0;
    }

    private parseDocumentationSections(documentation: string): any[] {
        return [];
    }

    private parseErrorCorrection(correction: string): any[] {
        return [];
    }

    private async applyErrorFixes(task: AgenticTask, step: TaskStep, fixes: any[]): Promise<void> {
        // Apply error fixes
    }

    private calculateFileComplexity(content: string): number {
        // Reuse complexity calculation from existing services
        return 1;
    }

    private analyzeFileStructure(content: string, language: string): any {
        // Analyze file structure
        return {};
    }

    private extractImports(content: string, language: string): string[] {
        // Extract imports based on language
        return [];
    }

    private estimateImplementationComplexity(plan: any): number {
        return 1;
    }

    private identifyImplementationRisks(plan: any): string[] {
        return [];
    }

    private identifyPrerequisites(plan: any): string[] {
        return [];
    }

    /**
     * Public API methods
     */
    public getTask(taskId: string): AgenticTask | undefined {
        return this.activeTasks.get(taskId);
    }

    public getActiveTasks(): AgenticTask[] {
        return Array.from(this.activeTasks.values());
    }

    public async cancelTask(taskId: string): Promise<boolean> {
        const task = this.activeTasks.get(taskId);
        if (task && task.status === 'pending') {
            task.status = 'cancelled';
            this.activeTasks.delete(taskId);
            return true;
        }
        return false;
    }

    public getTaskProgress(taskId: string): { current: number; total: number; currentStep: string } | null {
        const task = this.activeTasks.get(taskId);
        if (!task) return null;

        return {
            current: task.currentStep + 1,
            total: task.steps.length,
            currentStep: task.steps[task.currentStep]?.description || 'Unknown'
        };
    }

    public updateConfiguration(config: Partial<PipelineConfiguration>): void {
        this.config = { ...this.config, ...config };
    }

    public getConfiguration(): PipelineConfiguration {
        return { ...this.config };
    }
}