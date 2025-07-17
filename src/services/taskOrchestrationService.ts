import * as vscode from 'vscode';
import * as path from 'path';
import { RepositoryAnalysisService } from './repositoryAnalysisService';
import { AIService } from './aiService';

export interface TaskDefinition {
    id: string;
    name: string;
    description: string;
    type: TaskType;
    priority: TaskPriority;
    status: TaskStatus;
    createdAt: Date;
    updatedAt: Date;
    context: TaskContext;
    constraints: TaskConstraints;
    dependencies: string[];
    metadata: TaskMetadata;
}

export type TaskType =
    | 'code-generation'
    | 'code-refactoring'
    | 'code-validation'
    | 'code-repair'
    | 'testing'
    | 'documentation'
    | 'analysis'
    | 'optimization';

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'running' | 'validating' | 'repairing' | 'completed' | 'failed' | 'cancelled';

export interface TaskContext {
    workspaceRoot: string;
    targetFiles: string[];
    activeFile?: string;
    selectedText?: string;
    cursorPosition?: vscode.Position;
    language?: string;
    framework?: string;
    userPrompt?: string;
    repositoryContext?: any;
}

export interface TaskConstraints {
    maxExecutionTime?: number;
    maxRetries?: number;
    requiresValidation?: boolean;
    requiresTesting?: boolean;
    safetyChecks?: boolean;
    preserveFormatting?: boolean;
    maintainCompatibility?: boolean;
}

export interface TaskMetadata {
    estimatedDuration?: number;
    complexity?: 'low' | 'medium' | 'high';
    riskLevel?: 'low' | 'medium' | 'high';
    tags?: string[];
    requiredCapabilities?: string[];
    expectedOutput?: string;
}

export interface TaskExecution {
    taskId: string;
    executionId: string;
    startTime: Date;
    endTime?: Date;
    status: ExecutionStatus;
    progress: TaskProgress;
    stages: ExecutionStage[];
    results: TaskResult[];
    errors: TaskError[];
    metrics: ExecutionMetrics;
}

export type ExecutionStatus = 'initializing' | 'analyzing' | 'processing' | 'validating' | 'repairing' | 'completed' | 'failed';

export interface TaskProgress {
    currentStage: string;
    completedStages: string[];
    totalStages: number;
    progressPercentage: number;
    estimatedTimeRemaining?: number;
    details?: string;
}

export interface ExecutionStage {
    name: string;
    description: string;
    status: StageStatus;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    output?: any;
    errors?: TaskError[];
    validationResults?: ValidationResult[];
}

export type StageStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface TaskResult {
    type: 'code' | 'file' | 'analysis' | 'validation' | 'suggestion';
    content: any;
    filePath?: string;
    confidence: number;
    metadata?: any;
}

export interface TaskError {
    code: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    stage: string;
    timestamp: Date;
    context?: any;
    suggestedFix?: string;
    fixable: boolean;
}

export interface ValidationResult {
    isValid: boolean;
    score: number;
    issues: ValidationIssue[];
    suggestions: string[];
    metadata?: any;
}

export interface ValidationIssue {
    type: 'syntax' | 'semantic' | 'style' | 'security' | 'performance' | 'compatibility';
    severity: 'error' | 'warning' | 'info';
    message: string;
    location?: CodeLocation;
    rule?: string;
    fixable: boolean;
    suggestedFix?: string;
}

export interface CodeLocation {
    filePath: string;
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
}

export interface ExecutionMetrics {
    totalDuration: number;
    stageMetrics: { [stageName: string]: StageMetrics };
    resourceUsage: ResourceUsage;
    qualityMetrics: QualityMetrics;
}

export interface StageMetrics {
    duration: number;
    attempts: number;
    successRate: number;
    errors: number;
    warnings: number;
}

export interface ResourceUsage {
    memoryUsage: number;
    cpuUsage: number;
    apiCalls: number;
    tokensUsed: number;
}

export interface QualityMetrics {
    validationScore: number;
    codeQuality: number;
    testCoverage?: number;
    securityScore?: number;
    performanceScore?: number;
}

export interface TaskOrchestrationConfig {
    maxConcurrentTasks: number;
    defaultTimeout: number;
    maxRetries: number;
    enableAutoRepair: boolean;
    validationThreshold: number;
    qualityThreshold: number;
}

export class TaskOrchestrationService {
    private tasks: Map<string, TaskDefinition> = new Map();
    private executions: Map<string, TaskExecution> = new Map();
    private activeExecutions: Map<string, TaskExecution> = new Map();
    private taskQueue: TaskDefinition[] = [];
    private config: TaskOrchestrationConfig;
    private repositoryAnalysisService: RepositoryAnalysisService;
    private aiService: AIService;

    constructor(
        repositoryAnalysisService: RepositoryAnalysisService,
        aiService: AIService,
        config?: Partial<TaskOrchestrationConfig>
    ) {
        this.repositoryAnalysisService = repositoryAnalysisService;
        this.aiService = aiService;
        this.config = {
            maxConcurrentTasks: 3,
            defaultTimeout: 300000, // 5 minutes
            maxRetries: 3,
            enableAutoRepair: true,
            validationThreshold: 0.8,
            qualityThreshold: 0.7,
            ...config
        };
    }

    /**
     * Create a new task and add it to the orchestration pipeline
     */
    async createTask(
        type: TaskType,
        description: string,
        context: Partial<TaskContext>,
        constraints: Partial<TaskConstraints> = {},
        metadata: Partial<TaskMetadata> = {}
    ): Promise<string> {
        const taskId = this.generateTaskId();
        const now = new Date();

        const task: TaskDefinition = {
            id: taskId,
            name: this.generateTaskName(type, description),
            description,
            type,
            priority: metadata.riskLevel === 'high' ? 'high' : 'normal',
            status: 'pending',
            createdAt: now,
            updatedAt: now,
            context: {
                workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
                targetFiles: [],
                ...context
            },
            constraints: {
                maxExecutionTime: this.config.defaultTimeout,
                maxRetries: this.config.maxRetries,
                requiresValidation: true,
                requiresTesting: type === 'code-generation',
                safetyChecks: true,
                preserveFormatting: true,
                maintainCompatibility: true,
                ...constraints
            },
            dependencies: [],
            metadata: {
                complexity: 'medium',
                riskLevel: 'medium',
                tags: [],
                requiredCapabilities: this.getRequiredCapabilities(type),
                ...metadata
            }
        };

        this.tasks.set(taskId, task);
        this.taskQueue.push(task);

        console.log(`Created task: ${task.name} (${taskId})`);
        return taskId;
    }

    /**
     * Execute a task through the three-stage pipeline
     */
    async executeTask(taskId: string): Promise<TaskExecution> {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }

        const executionId = this.generateExecutionId();
        const execution: TaskExecution = {
            taskId,
            executionId,
            startTime: new Date(),
            status: 'initializing',
            progress: {
                currentStage: 'initializing',
                completedStages: [],
                totalStages: 3,
                progressPercentage: 0
            },
            stages: [],
            results: [],
            errors: [],
            metrics: {
                totalDuration: 0,
                stageMetrics: {},
                resourceUsage: {
                    memoryUsage: 0,
                    cpuUsage: 0,
                    apiCalls: 0,
                    tokensUsed: 0
                },
                qualityMetrics: {
                    validationScore: 0,
                    codeQuality: 0
                }
            }
        };

        this.executions.set(executionId, execution);
        this.activeExecutions.set(taskId, execution);

        try {
            // Stage 1: Analyze and Validate
            await this.executeStage(execution, 'analyze', 'Analyzing code context and validating requirements', async () => {
                return await this.analyzeAndValidate(task);
            });

            // Stage 2: Process and Generate
            await this.executeStage(execution, 'process', 'Processing task and generating solution', async () => {
                return await this.processAndGenerate(task, execution);
            });

            // Stage 3: Validate and Repair
            await this.executeStage(execution, 'validate', 'Validating output and applying repairs', async () => {
                return await this.validateAndRepair(task, execution);
            });

            execution.status = 'completed';
            execution.endTime = new Date();
            execution.metrics.totalDuration = execution.endTime.getTime() - execution.startTime.getTime();

            task.status = 'completed';
            task.updatedAt = new Date();

            console.log(`Task completed successfully: ${task.name} (${taskId})`);

        } catch (error) {
            execution.status = 'failed';
            execution.endTime = new Date();

            const taskError: TaskError = {
                code: 'EXECUTION_FAILED',
                message: error instanceof Error ? error.message : String(error),
                severity: 'critical',
                stage: execution.progress.currentStage,
                timestamp: new Date(),
                context: { taskId, executionId },
                fixable: false
            };

            execution.errors.push(taskError);
            task.status = 'failed';
            task.updatedAt = new Date();

            console.error(`Task execution failed: ${task.name} (${taskId})`, error);
            throw error;
        } finally {
            this.activeExecutions.delete(taskId);
        }

        return execution;
    }

    /**
     * Stage 1: Analyze and Validate
     */
    private async analyzeAndValidate(task: TaskDefinition): Promise<any> {
        const analysis = {
            repositoryContext: this.repositoryAnalysisService.getRepositoryIndex(),
            codePatterns: await this.repositoryAnalysisService.getProjectPatterns(),
            dependencies: await this.analyzeDependencies(task.context.targetFiles),
            compatibility: await this.checkCompatibility(task),
            risks: await this.assessRisks(task)
        };

        return analysis;
    }

    /**
     * Stage 2: Process and Generate
     */
    private async processAndGenerate(task: TaskDefinition, execution: TaskExecution): Promise<any> {
        const context = task.context;
        const prompt = this.buildPrompt(task, execution);

        const result = await this.aiService.processMessage(prompt, {
            files: [],
            workspaceRoot: context.workspaceRoot,
            selectedText: context.selectedText,
            language: context.language,
            framework: context.framework,
            detectedFramework: context.framework,
            currentFile: context.activeFile ? {
                fileName: path.basename(context.activeFile),
                languageId: context.language || 'typescript',
                filePath: context.activeFile
            } : {
                fileName: 'unknown',
                languageId: 'typescript'
            }
        });

        execution.results.push({
            type: 'code',
            content: result,
            confidence: 0.8,
            metadata: { stage: 'generation' }
        });

        return result;
    }

    /**
     * Stage 3: Validate and Repair
     */
    private async validateAndRepair(task: TaskDefinition, execution: TaskExecution): Promise<any> {
        const results = execution.results;
        const validationResults: ValidationResult[] = [];
        const repairedResults: any[] = [];

        for (const result of results) {
            if (result.type === 'code') {
                // Perform validation
                const validation = await this.validateCode(result.content, task);
                validationResults.push(validation);

                if (!validation.isValid && this.config.enableAutoRepair) {
                    // Attempt repair
                    const repaired = await this.repairCode(result.content, validation.issues, task);
                    repairedResults.push(repaired);
                } else {
                    repairedResults.push(result.content);
                }
            }
        }

        // Update execution with validation results
        execution.stages.forEach(stage => {
            if (stage.name === 'validate') {
                stage.validationResults = validationResults;
            }
        });

        return repairedResults;
    }

    /**
     * Execute a stage with error handling and metrics
     */
    private async executeStage(
        execution: TaskExecution,
        stageName: string,
        description: string,
        stageFunction: () => Promise<any>
    ): Promise<void> {
        const stage: ExecutionStage = {
            name: stageName,
            description,
            status: 'running',
            startTime: new Date(),
            errors: []
        };

        execution.stages.push(stage);
        execution.progress.currentStage = stageName;
        execution.progress.progressPercentage = (execution.progress.completedStages.length / execution.progress.totalStages) * 100;

        try {
            stage.output = await stageFunction();
            stage.status = 'completed';
            stage.endTime = new Date();
            stage.duration = stage.endTime.getTime() - stage.startTime.getTime();

            execution.progress.completedStages.push(stageName);
            execution.progress.progressPercentage = (execution.progress.completedStages.length / execution.progress.totalStages) * 100;

            // Update metrics
            execution.metrics.stageMetrics[stageName] = {
                duration: stage.duration,
                attempts: 1,
                successRate: 1,
                errors: 0,
                warnings: 0
            };

        } catch (error) {
            stage.status = 'failed';
            stage.endTime = new Date();
            stage.duration = stage.endTime.getTime() - stage.startTime.getTime();

            const stageError: TaskError = {
                code: `STAGE_${stageName.toUpperCase()}_FAILED`,
                message: error instanceof Error ? error.message : String(error),
                severity: 'high',
                stage: stageName,
                timestamp: new Date(),
                context: { stageName, executionId: execution.executionId },
                fixable: true
            };

            stage.errors?.push(stageError);
            execution.errors.push(stageError);

            throw error;
        }
    }

    /**
     * Get task by ID
     */
    getTask(taskId: string): TaskDefinition | undefined {
        return this.tasks.get(taskId);
    }

    /**
     * Get task progress
     */
    getTaskProgress(taskId: string): TaskProgress | undefined {
        const execution = this.activeExecutions.get(taskId);
        return execution?.progress;
    }

    /**
     * Get task execution by ID
     */
    getExecution(executionId: string): TaskExecution | undefined {
        return this.executions.get(executionId);
    }

    /**
     * Get all active tasks
     */
    getActiveTasks(): TaskDefinition[] {
        return Array.from(this.tasks.values()).filter(task =>
            task.status === 'running' || task.status === 'validating' || task.status === 'repairing'
        );
    }

    /**
     * Cancel a task
     */
    async cancelTask(taskId: string): Promise<void> {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }

        const execution = this.activeExecutions.get(taskId);
        if (execution) {
            execution.status = 'failed';
            execution.endTime = new Date();
            this.activeExecutions.delete(taskId);
        }

        task.status = 'cancelled';
        task.updatedAt = new Date();

        // Remove from queue if pending
        this.taskQueue = this.taskQueue.filter(t => t.id !== taskId);
    }

    // Helper methods

    private generateTaskId(): string {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateExecutionId(): string {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateTaskName(type: TaskType, description: string): string {
        const typeNames = {
            'code-generation': 'Code Generation',
            'code-refactoring': 'Code Refactoring',
            'code-validation': 'Code Validation',
            'code-repair': 'Code Repair',
            'testing': 'Testing',
            'documentation': 'Documentation',
            'analysis': 'Analysis',
            'optimization': 'Optimization'
        };

        return `${typeNames[type]}: ${description.slice(0, 50)}${description.length > 50 ? '...' : ''}`;
    }

    private getRequiredCapabilities(type: TaskType): string[] {
        const capabilities = {
            'code-generation': ['generation', 'validation', 'formatting'],
            'code-refactoring': ['refactoring', 'validation', 'dependency-analysis'],
            'code-validation': ['validation', 'static-analysis'],
            'code-repair': ['repair', 'validation', 'error-detection'],
            'testing': ['test-generation', 'validation', 'coverage-analysis'],
            'documentation': ['documentation', 'analysis'],
            'analysis': ['static-analysis', 'dependency-analysis'],
            'optimization': ['optimization', 'performance-analysis', 'validation']
        };

        return capabilities[type] || [];
    }

    private buildPrompt(task: TaskDefinition, execution: TaskExecution): string {
        const analysisResult = execution.stages.find(s => s.name === 'analyze')?.output;

        return `
Task: ${task.description}
Type: ${task.type}
Context: ${JSON.stringify(task.context, null, 2)}
Analysis: ${JSON.stringify(analysisResult, null, 2)}
Constraints: ${JSON.stringify(task.constraints, null, 2)}

Please generate the appropriate solution based on the above information.
        `.trim();
    }

    private async analyzeDependencies(targetFiles: string[]): Promise<any> {
        const dependencies = [];
        for (const file of targetFiles) {
            const fileDeps = await this.repositoryAnalysisService.getFileDependencies(file);
            dependencies.push(...fileDeps);
        }
        return dependencies;
    }

    private async checkCompatibility(task: TaskDefinition): Promise<any> {
        // Implementation for compatibility checking
        return { compatible: true, issues: [] };
    }

    private async assessRisks(task: TaskDefinition): Promise<any> {
        // Implementation for risk assessment
        return { level: 'medium', factors: [] };
    }

    private async validateCode(code: string, task: TaskDefinition): Promise<ValidationResult> {
        // Implementation for code validation
        return {
            isValid: true,
            score: 0.85,
            issues: [],
            suggestions: [],
            metadata: { timestamp: new Date() }
        };
    }

    private async repairCode(code: string, issues: ValidationIssue[], task: TaskDefinition): Promise<string> {
        // Implementation for code repair
        return code;
    }
}

// Export the AgenticTask type for backward compatibility
export type AgenticTask = TaskDefinition;