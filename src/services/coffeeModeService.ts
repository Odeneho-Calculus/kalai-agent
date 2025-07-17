import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { RepoGrokkingService } from './repoGrokkingService';
import { AIService } from './aiService';
import { AgenticPipelineService } from './agenticPipelineService';
import { ValidationFrameworkService } from './validationFrameworkService';
import { MultiFileOperationsService } from './multiFileOperationsService';

export interface CoffeeModeTask {
    id: string;
    name: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    type: 'optimization' | 'refactoring' | 'documentation' | 'testing' | 'security' | 'maintenance';
    status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
    estimatedTime: number; // in minutes
    actualTime?: number;
    files: string[];
    dependencies: string[];
    userApprovalRequired: boolean;
    approved: boolean;
    changes: CoffeeModeChange[];
    rollbackPlan?: CoffeeModeRollback;
    createdAt: Date;
    completedAt?: Date;
}

export interface CoffeeModeChange {
    id: string;
    type: 'file-create' | 'file-modify' | 'file-delete' | 'file-rename';
    filePath: string;
    oldContent?: string;
    newContent?: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    reversible: boolean;
}

export interface CoffeeModeRollback {
    id: string;
    changes: CoffeeModeChange[];
    instructions: string;
    automated: boolean;
}

export interface CoffeeModeConfig {
    enabled: boolean;
    autoApprove: boolean;
    maxConcurrentTasks: number;
    approvalTimeout: number; // in minutes
    excludePatterns: string[];
    includePatterns: string[];
    safetyLevel: 'conservative' | 'moderate' | 'aggressive';
    scheduledRuns: ScheduledRun[];
}

export interface ScheduledRun {
    id: string;
    name: string;
    schedule: string; // cron expression
    taskTypes: string[];
    enabled: boolean;
}

export interface CoffeeModeAnalysis {
    codeQualityScore: number;
    technicalDebt: TechnicalDebtItem[];
    optimizationOpportunities: OptimizationOpportunity[];
    securityIssues: SecurityIssue[];
    performanceIssues: PerformanceIssue[];
    maintenanceNeeds: MaintenanceNeed[];
}

export interface TechnicalDebtItem {
    id: string;
    type: 'code-smell' | 'outdated-dependency' | 'deprecated-api' | 'poor-performance';
    description: string;
    file: string;
    line?: number;
    severity: 'low' | 'medium' | 'high';
    effortToFix: number; // in hours
    businessImpact: number; // 1-10 scale
}

export interface OptimizationOpportunity {
    id: string;
    type: 'performance' | 'memory' | 'bundle-size' | 'caching';
    description: string;
    files: string[];
    estimatedImprovement: string;
    implementation: string;
    effort: number; // in hours
}

export interface SecurityIssue {
    id: string;
    type: 'vulnerability' | 'weak-encryption' | 'input-validation' | 'authentication';
    description: string;
    file: string;
    line?: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    cveId?: string;
    fixSuggestion: string;
}

export interface PerformanceIssue {
    id: string;
    type: 'memory-leak' | 'cpu-intensive' | 'slow-query' | 'inefficient-algorithm';
    description: string;
    file: string;
    line?: number;
    impact: string;
    solution: string;
}

export interface MaintenanceNeed {
    id: string;
    type: 'documentation' | 'testing' | 'dependency-update' | 'code-cleanup';
    description: string;
    files: string[];
    priority: 'low' | 'medium' | 'high';
    effort: number; // in hours
}

export class CoffeeModeService {
    private repoGrokkingService: RepoGrokkingService;
    private aiService: AIService;
    private agenticPipelineService: AgenticPipelineService;
    private validationService: ValidationFrameworkService;
    private multiFileService: MultiFileOperationsService;

    private config: CoffeeModeConfig;
    private activeTasks: Map<string, CoffeeModeTask> = new Map();
    private taskQueue: CoffeeModeTask[] = [];
    private isRunning = false;
    private currentAnalysis?: CoffeeModeAnalysis;

    constructor(
        repoGrokkingService: RepoGrokkingService,
        aiService: AIService,
        agenticPipelineService: AgenticPipelineService,
        validationService: ValidationFrameworkService,
        multiFileService: MultiFileOperationsService
    ) {
        this.repoGrokkingService = repoGrokkingService;
        this.aiService = aiService;
        this.agenticPipelineService = agenticPipelineService;
        this.validationService = validationService;
        this.multiFileService = multiFileService;

        this.config = this.loadConfig();
        this.initializeCoffeeMode();
    }

    /**
     * Initialize Coffee Mode
     */
    private initializeCoffeeMode(): void {
        if (this.config.enabled) {
            this.startBackgroundAnalysis();
            this.setupScheduledRuns();
        }
    }

    /**
     * Enable Coffee Mode
     */
    public async enableCoffeeMode(): Promise<void> {
        // Show safety warning
        const userConsent = await this.showSafetyWarning();
        if (!userConsent) {
            return;
        }

        this.config.enabled = true;
        this.saveConfig();

        // Start background analysis
        this.startBackgroundAnalysis();

        // Show notification
        vscode.window.showInformationMessage(
            '☕ Coffee Mode enabled! Kalai will now work autonomously.',
            'View Settings'
        ).then(selection => {
            if (selection === 'View Settings') {
                this.showCoffeeModeSettings();
            }
        });
    }

    /**
     * Disable Coffee Mode
     */
    public async disableCoffeeMode(): Promise<void> {
        this.config.enabled = false;
        this.isRunning = false;
        this.saveConfig();

        // Cancel active tasks
        for (const task of this.activeTasks.values()) {
            if (task.status === 'in-progress') {
                task.status = 'cancelled';
            }
        }

        vscode.window.showInformationMessage('☕ Coffee Mode disabled.');
    }

    /**
     * Start background analysis
     */
    private async startBackgroundAnalysis(): Promise<void> {
        if (!this.config.enabled || this.isRunning) {
            return;
        }

        this.isRunning = true;

        try {
            // Perform comprehensive analysis
            await this.performComprehensiveAnalysis();

            // Generate improvement tasks
            await this.generateImprovementTasks();

            // Process task queue
            await this.processTaskQueue();

        } catch (error) {
            console.error('Background analysis failed:', error);
            vscode.window.showErrorMessage(`Coffee Mode analysis failed: ${error}`);
        } finally {
            this.isRunning = false;

            // Schedule next analysis
            setTimeout(() => {
                if (this.config.enabled) {
                    this.startBackgroundAnalysis();
                }
            }, 30 * 60 * 1000); // 30 minutes
        }
    }

    /**
     * Perform comprehensive codebase analysis
     */
    private async performComprehensiveAnalysis(): Promise<void> {
        const analysis: CoffeeModeAnalysis = {
            codeQualityScore: 0,
            technicalDebt: [],
            optimizationOpportunities: [],
            securityIssues: [],
            performanceIssues: [],
            maintenanceNeeds: []
        };

        // Get all source files
        const sourceFiles = await this.repoGrokkingService.getSourceFiles();

        // Analyze each file
        for (const filePath of sourceFiles) {
            if (this.shouldAnalyzeFile(filePath)) {
                const fileAnalysis = await this.analyzeFile(filePath);

                analysis.technicalDebt.push(...fileAnalysis.technicalDebt);
                analysis.optimizationOpportunities.push(...fileAnalysis.optimizations);
                analysis.securityIssues.push(...fileAnalysis.security);
                analysis.performanceIssues.push(...fileAnalysis.performance);
                analysis.maintenanceNeeds.push(...fileAnalysis.maintenance);
            }
        }

        // Calculate overall code quality score
        analysis.codeQualityScore = this.calculateCodeQualityScore(analysis);

        // Store analysis
        this.currentAnalysis = analysis;

        // Show analysis summary
        this.showAnalysisSummary(analysis);
    }

    /**
     * Analyze individual file
     */
    private async analyzeFile(filePath: string): Promise<any> {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const validation = await this.validationService.validateCode(filePath, content);

        const fileAnalysis = {
            technicalDebt: [] as TechnicalDebtItem[],
            optimizations: [] as OptimizationOpportunity[],
            security: [] as SecurityIssue[],
            performance: [] as PerformanceIssue[],
            maintenance: [] as MaintenanceNeed[]
        };

        // Analyze validation results
        for (const error of validation.errors) {
            if (error.type === 'security') {
                fileAnalysis.security.push({
                    id: this.generateId(),
                    type: 'vulnerability',
                    description: error.message,
                    file: filePath,
                    line: error.line,
                    severity: error.severity as any,
                    fixSuggestion: error.suggestedFix || 'Manual review required'
                });
            } else if (error.type === 'performance') {
                fileAnalysis.performance.push({
                    id: this.generateId(),
                    type: 'inefficient-algorithm',
                    description: error.message,
                    file: filePath,
                    line: error.line,
                    impact: 'Moderate performance impact',
                    solution: error.suggestedFix || 'Optimize algorithm'
                });
            }
        }

        // AI-powered analysis
        const aiAnalysis = await this.performAIAnalysis(filePath, content);
        fileAnalysis.technicalDebt.push(...aiAnalysis.technicalDebt);
        fileAnalysis.optimizations.push(...aiAnalysis.optimizations);
        fileAnalysis.maintenance.push(...aiAnalysis.maintenance);

        return fileAnalysis;
    }

    /**
     * Perform AI analysis on file
     */
    private async performAIAnalysis(filePath: string, content: string): Promise<any> {
        const prompt = `
Analyze this code file for Coffee Mode autonomous improvements:

File: ${filePath}
Content:
${content}

Please identify:
1. Technical debt items (code smells, outdated patterns, deprecated APIs)
2. Optimization opportunities (performance, memory, bundle size)
3. Maintenance needs (missing documentation, tests, dependency updates)

For each item, provide:
- Clear description
- Severity/priority
- Estimated effort to fix
- Specific implementation suggestions

Format as JSON with arrays for technicalDebt, optimizations, and maintenance.
`;

        try {
            const response = await this.aiService.sendMessage(prompt);
            return this.parseAIAnalysis(response);
        } catch (error) {
            console.error('AI analysis failed:', error);
            return { technicalDebt: [], optimizations: [], maintenance: [] };
        }
    }

    /**
     * Generate improvement tasks from analysis
     */
    private async generateImprovementTasks(): Promise<void> {
        if (!this.currentAnalysis) return;

        const tasks: CoffeeModeTask[] = [];

        // Create tasks for technical debt
        for (const debt of this.currentAnalysis.technicalDebt) {
            if (debt.severity === 'high' || debt.businessImpact > 7) {
                tasks.push(await this.createTechnicalDebtTask(debt));
            }
        }

        // Create tasks for optimizations
        for (const optimization of this.currentAnalysis.optimizationOpportunities) {
            if (optimization.effort <= 2) { // Low effort, high impact
                tasks.push(await this.createOptimizationTask(optimization));
            }
        }

        // Create tasks for security issues
        for (const security of this.currentAnalysis.securityIssues) {
            if (security.severity === 'high' || security.severity === 'critical') {
                tasks.push(await this.createSecurityTask(security));
            }
        }

        // Create tasks for maintenance
        for (const maintenance of this.currentAnalysis.maintenanceNeeds) {
            if (maintenance.priority === 'high' && maintenance.effort <= 1) {
                tasks.push(await this.createMaintenanceTask(maintenance));
            }
        }

        // Sort tasks by priority
        tasks.sort((a, b) => {
            const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        // Add to queue
        this.taskQueue.push(...tasks);
    }

    /**
     * Process task queue
     */
    private async processTaskQueue(): Promise<void> {
        while (this.taskQueue.length > 0 && this.activeTasks.size < this.config.maxConcurrentTasks) {
            const task = this.taskQueue.shift()!;

            if (task.userApprovalRequired && !this.config.autoApprove) {
                await this.requestUserApproval(task);
            } else {
                task.approved = true;
            }

            if (task.approved) {
                this.activeTasks.set(task.id, task);
                this.executeTask(task);
            }
        }
    }

    /**
     * Execute a Coffee Mode task
     */
    private async executeTask(task: CoffeeModeTask): Promise<void> {
        task.status = 'in-progress';
        const startTime = Date.now();

        try {
            // Show progress notification
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `☕ ${task.name}`,
                cancellable: true
            }, async (progress, token) => {
                progress.report({ increment: 0, message: task.description });

                // Execute task based on type
                switch (task.type) {
                    case 'optimization':
                        await this.executeOptimizationTask(task, progress);
                        break;
                    case 'refactoring':
                        await this.executeRefactoringTask(task, progress);
                        break;
                    case 'documentation':
                        await this.executeDocumentationTask(task, progress);
                        break;
                    case 'testing':
                        await this.executeTestingTask(task, progress);
                        break;
                    case 'security':
                        await this.executeSecurityTask(task, progress);
                        break;
                    case 'maintenance':
                        await this.executeMaintenanceTask(task, progress);
                        break;
                }

                progress.report({ increment: 100, message: 'Complete!' });
            });

            task.status = 'completed';
            task.completedAt = new Date();
            task.actualTime = Math.round((Date.now() - startTime) / 1000 / 60);

            // Show completion notification
            vscode.window.showInformationMessage(
                `☕ Task completed: ${task.name}`,
                'View Changes'
            ).then(selection => {
                if (selection === 'View Changes') {
                    this.showTaskChanges(task);
                }
            });

        } catch (error) {
            task.status = 'failed';
            console.error(`Task ${task.id} failed:`, error);

            // Attempt rollback
            if (task.rollbackPlan) {
                await this.rollbackTask(task);
            }

            vscode.window.showErrorMessage(`☕ Task failed: ${task.name} - ${error}`);
        } finally {
            this.activeTasks.delete(task.id);
        }
    }

    /**
     * Execute optimization task
     */
    private async executeOptimizationTask(
        task: CoffeeModeTask,
        progress: vscode.Progress<{ increment?: number; message?: string }>
    ): Promise<void> {
        progress.report({ increment: 25, message: 'Analyzing optimization opportunities...' });

        for (const filePath of task.files) {
            const content = await fs.promises.readFile(filePath, 'utf-8');

            progress.report({ increment: 50, message: `Optimizing ${path.basename(filePath)}...` });

            const optimizedContent = await this.optimizeCode(content, filePath);

            if (optimizedContent !== content) {
                const change: CoffeeModeChange = {
                    id: this.generateId(),
                    type: 'file-modify',
                    filePath: filePath,
                    oldContent: content,
                    newContent: optimizedContent,
                    description: `Optimized code in ${path.basename(filePath)}`,
                    impact: 'medium',
                    reversible: true
                };

                task.changes.push(change);
                await fs.promises.writeFile(filePath, optimizedContent, 'utf-8');
            }
        }

        progress.report({ increment: 75, message: 'Validating optimizations...' });

        // Validate changes
        await this.validateTaskChanges(task);
    }

    /**
     * Execute refactoring task
     */
    private async executeRefactoringTask(
        task: CoffeeModeTask,
        progress: vscode.Progress<{ increment?: number; message?: string }>
    ): Promise<void> {
        progress.report({ increment: 25, message: 'Planning refactoring...' });

        const refactoringContext = {
            targetFiles: task.files,
            refactoringType: 'restructure' as const,
            parameters: { safetyLevel: this.config.safetyLevel },
            safetyChecks: true
        };

        progress.report({ increment: 50, message: 'Executing refactoring...' });

        const refactoringResult = await this.multiFileService.performAdvancedRefactoring(refactoringContext);

        // Convert multi-file operations to Coffee Mode changes
        for (const operation of refactoringResult.operations) {
            const change: CoffeeModeChange = {
                id: this.generateId(),
                type: operation.type as any,
                filePath: operation.filePath,
                oldContent: operation.type === 'modify' ? 'previous content' : undefined,
                newContent: operation.content,
                description: `Refactored ${path.basename(operation.filePath)}`,
                impact: 'high',
                reversible: true
            };

            task.changes.push(change);
        }

        progress.report({ increment: 75, message: 'Validating refactoring...' });

        await this.validateTaskChanges(task);
    }

    /**
     * Execute documentation task
     */
    private async executeDocumentationTask(
        task: CoffeeModeTask,
        progress: vscode.Progress<{ increment?: number; message?: string }>
    ): Promise<void> {
        progress.report({ increment: 25, message: 'Analyzing documentation needs...' });

        for (const filePath of task.files) {
            const content = await fs.promises.readFile(filePath, 'utf-8');

            progress.report({ increment: 50, message: `Documenting ${path.basename(filePath)}...` });

            const documentedContent = await this.generateDocumentation(content, filePath);

            if (documentedContent !== content) {
                const change: CoffeeModeChange = {
                    id: this.generateId(),
                    type: 'file-modify',
                    filePath: filePath,
                    oldContent: content,
                    newContent: documentedContent,
                    description: `Added documentation to ${path.basename(filePath)}`,
                    impact: 'low',
                    reversible: true
                };

                task.changes.push(change);
                await fs.promises.writeFile(filePath, documentedContent, 'utf-8');
            }
        }

        progress.report({ increment: 75, message: 'Validating documentation...' });

        await this.validateTaskChanges(task);
    }

    /**
     * Execute testing task
     */
    private async executeTestingTask(
        task: CoffeeModeTask,
        progress: vscode.Progress<{ increment?: number; message?: string }>
    ): Promise<void> {
        progress.report({ increment: 25, message: 'Analyzing test coverage...' });

        for (const filePath of task.files) {
            const content = await fs.promises.readFile(filePath, 'utf-8');

            progress.report({ increment: 50, message: `Generating tests for ${path.basename(filePath)}...` });

            const testContent = await this.generateTests(content, filePath);
            const testPath = this.getTestPath(filePath);

            // Create test file
            await fs.promises.mkdir(path.dirname(testPath), { recursive: true });
            await fs.promises.writeFile(testPath, testContent, 'utf-8');

            const change: CoffeeModeChange = {
                id: this.generateId(),
                type: 'file-create',
                filePath: testPath,
                newContent: testContent,
                description: `Created tests for ${path.basename(filePath)}`,
                impact: 'low',
                reversible: true
            };

            task.changes.push(change);
        }

        progress.report({ increment: 75, message: 'Validating tests...' });

        await this.validateTaskChanges(task);
    }

    /**
     * Execute security task
     */
    private async executeSecurityTask(
        task: CoffeeModeTask,
        progress: vscode.Progress<{ increment?: number; message?: string }>
    ): Promise<void> {
        progress.report({ increment: 25, message: 'Analyzing security issues...' });

        for (const filePath of task.files) {
            const content = await fs.promises.readFile(filePath, 'utf-8');

            progress.report({ increment: 50, message: `Securing ${path.basename(filePath)}...` });

            const securedContent = await this.secureCode(content, filePath);

            if (securedContent !== content) {
                const change: CoffeeModeChange = {
                    id: this.generateId(),
                    type: 'file-modify',
                    filePath: filePath,
                    oldContent: content,
                    newContent: securedContent,
                    description: `Fixed security issues in ${path.basename(filePath)}`,
                    impact: 'high',
                    reversible: true
                };

                task.changes.push(change);
                await fs.promises.writeFile(filePath, securedContent, 'utf-8');
            }
        }

        progress.report({ increment: 75, message: 'Validating security fixes...' });

        await this.validateTaskChanges(task);
    }

    /**
     * Execute maintenance task
     */
    private async executeMaintenanceTask(
        task: CoffeeModeTask,
        progress: vscode.Progress<{ increment?: number; message?: string }>
    ): Promise<void> {
        progress.report({ increment: 25, message: 'Analyzing maintenance needs...' });

        // Update dependencies
        progress.report({ increment: 50, message: 'Updating dependencies...' });
        await this.updateDependencies(task);

        // Clean up code
        progress.report({ increment: 75, message: 'Cleaning up code...' });
        await this.cleanupCode(task);

        await this.validateTaskChanges(task);
    }

    // Helper methods for task execution
    private async optimizeCode(content: string, filePath: string): Promise<string> {
        const prompt = `
Optimize this code for better performance while maintaining functionality:

File: ${filePath}
Content:
${content}

Focus on:
1. Algorithm optimization
2. Memory efficiency
3. Reduce computational complexity
4. Remove redundant operations

Return only the optimized code.
`;

        return await this.aiService.sendMessage(prompt);
    }

    private async generateDocumentation(content: string, filePath: string): Promise<string> {
        const prompt = `
Add comprehensive documentation to this code:

File: ${filePath}
Content:
${content}

Add:
1. Function/method documentation
2. Parameter descriptions
3. Return value descriptions
4. Usage examples
5. JSDoc/equivalent comments

Return the code with added documentation.
`;

        return await this.aiService.sendMessage(prompt);
    }

    private async generateTests(content: string, filePath: string): Promise<string> {
        const prompt = `
Generate comprehensive unit tests for this code:

File: ${filePath}
Content:
${content}

Generate tests that cover:
1. All public methods/functions
2. Edge cases
3. Error conditions
4. Integration scenarios

Use appropriate testing framework for the language.
`;

        return await this.aiService.sendMessage(prompt);
    }

    private async secureCode(content: string, filePath: string): Promise<string> {
        const prompt = `
Fix security vulnerabilities in this code:

File: ${filePath}
Content:
${content}

Fix:
1. Input validation issues
2. SQL injection vulnerabilities
3. XSS vulnerabilities
4. Authentication/authorization issues
5. Cryptographic weaknesses

Return the secured code.
`;

        return await this.aiService.sendMessage(prompt);
    }

    // Helper methods
    private loadConfig(): CoffeeModeConfig {
        const config = vscode.workspace.getConfiguration('kalai-agent.coffeeMode');
        return {
            enabled: config.get('enabled', false),
            autoApprove: config.get('autoApprove', false),
            maxConcurrentTasks: config.get('maxConcurrentTasks', 3),
            approvalTimeout: config.get('approvalTimeout', 30),
            excludePatterns: config.get('excludePatterns', ['node_modules/**', '.git/**', 'dist/**']),
            includePatterns: config.get('includePatterns', ['src/**', 'lib/**']),
            safetyLevel: config.get('safetyLevel', 'moderate'),
            scheduledRuns: config.get('scheduledRuns', [])
        };
    }

    private saveConfig(): void {
        const config = vscode.workspace.getConfiguration('kalai-agent.coffeeMode');
        config.update('enabled', this.config.enabled, vscode.ConfigurationTarget.Global);
        config.update('autoApprove', this.config.autoApprove, vscode.ConfigurationTarget.Global);
        config.update('maxConcurrentTasks', this.config.maxConcurrentTasks, vscode.ConfigurationTarget.Global);
        config.update('approvalTimeout', this.config.approvalTimeout, vscode.ConfigurationTarget.Global);
        config.update('safetyLevel', this.config.safetyLevel, vscode.ConfigurationTarget.Global);
    }

    private async showSafetyWarning(): Promise<boolean> {
        const result = await vscode.window.showWarningMessage(
            '⚠️ Coffee Mode will allow Kalai to make autonomous changes to your code. This is an advanced feature that should be used with caution.',
            { modal: true },
            'I understand the risks',
            'Cancel'
        );

        return result === 'I understand the risks';
    }

    private async showAnalysisSummary(analysis: CoffeeModeAnalysis): Promise<void> {
        const summary = `
Coffee Mode Analysis Summary:
- Code Quality Score: ${analysis.codeQualityScore}/100
- Technical Debt Items: ${analysis.technicalDebt.length}
- Optimization Opportunities: ${analysis.optimizationOpportunities.length}
- Security Issues: ${analysis.securityIssues.length}
- Performance Issues: ${analysis.performanceIssues.length}
- Maintenance Needs: ${analysis.maintenanceNeeds.length}
`;

        vscode.window.showInformationMessage(summary, 'View Details').then(selection => {
            if (selection === 'View Details') {
                this.showDetailedAnalysis(analysis);
            }
        });
    }

    private generateId(): string {
        return `coffee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private shouldAnalyzeFile(filePath: string): boolean {
        const relativePath = vscode.workspace.asRelativePath(filePath);

        // Check exclude patterns
        for (const pattern of this.config.excludePatterns) {
            if (this.matchesPattern(relativePath, pattern)) {
                return false;
            }
        }

        // Check include patterns
        for (const pattern of this.config.includePatterns) {
            if (this.matchesPattern(relativePath, pattern)) {
                return true;
            }
        }

        return false;
    }

    private matchesPattern(filePath: string, pattern: string): boolean {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(filePath);
    }

    private calculateCodeQualityScore(analysis: CoffeeModeAnalysis): number {
        let score = 100;

        // Deduct points for issues
        score -= analysis.technicalDebt.length * 5;
        score -= analysis.securityIssues.length * 10;
        score -= analysis.performanceIssues.length * 8;
        score -= analysis.maintenanceNeeds.length * 3;

        return Math.max(0, Math.min(100, score));
    }

    private parseAIAnalysis(response: string): any {
        try {
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }
            return JSON.parse(response);
        } catch (error) {
            return { technicalDebt: [], optimizations: [], maintenance: [] };
        }
    }

    private async createTechnicalDebtTask(debt: TechnicalDebtItem): Promise<CoffeeModeTask> {
        return {
            id: this.generateId(),
            name: `Fix Technical Debt: ${debt.type}`,
            description: debt.description,
            priority: debt.severity as any,
            type: 'refactoring',
            status: 'pending',
            estimatedTime: debt.effortToFix * 60,
            files: [debt.file],
            dependencies: [],
            userApprovalRequired: debt.severity === 'high',
            approved: false,
            changes: [],
            createdAt: new Date()
        };
    }

    private async createOptimizationTask(optimization: OptimizationOpportunity): Promise<CoffeeModeTask> {
        return {
            id: this.generateId(),
            name: `Optimize: ${optimization.type}`,
            description: optimization.description,
            priority: 'medium',
            type: 'optimization',
            status: 'pending',
            estimatedTime: optimization.effort * 60,
            files: optimization.files,
            dependencies: [],
            userApprovalRequired: optimization.effort > 1,
            approved: false,
            changes: [],
            createdAt: new Date()
        };
    }

    private async createSecurityTask(security: SecurityIssue): Promise<CoffeeModeTask> {
        return {
            id: this.generateId(),
            name: `Fix Security: ${security.type}`,
            description: security.description,
            priority: security.severity as any,
            type: 'security',
            status: 'pending',
            estimatedTime: 30,
            files: [security.file],
            dependencies: [],
            userApprovalRequired: true,
            approved: false,
            changes: [],
            createdAt: new Date()
        };
    }

    private async createMaintenanceTask(maintenance: MaintenanceNeed): Promise<CoffeeModeTask> {
        return {
            id: this.generateId(),
            name: `Maintenance: ${maintenance.type}`,
            description: maintenance.description,
            priority: maintenance.priority,
            type: 'maintenance',
            status: 'pending',
            estimatedTime: maintenance.effort * 60,
            files: maintenance.files,
            dependencies: [],
            userApprovalRequired: false,
            approved: false,
            changes: [],
            createdAt: new Date()
        };
    }

    private async requestUserApproval(task: CoffeeModeTask): Promise<void> {
        const result = await vscode.window.showInformationMessage(
            `☕ Coffee Mode wants to: ${task.name}\n\n${task.description}`,
            { modal: true },
            'Approve',
            'Deny',
            'View Details'
        );

        if (result === 'Approve') {
            task.approved = true;
        } else if (result === 'View Details') {
            await this.showTaskDetails(task);
            await this.requestUserApproval(task); // Ask again after showing details
        }
    }

    private async showTaskDetails(task: CoffeeModeTask): Promise<void> {
        const details = `
Task: ${task.name}
Type: ${task.type}
Priority: ${task.priority}
Estimated Time: ${task.estimatedTime} minutes
Files: ${task.files.join(', ')}
Description: ${task.description}
`;

        await vscode.window.showInformationMessage(details, { modal: true });
    }

    private async showTaskChanges(task: CoffeeModeTask): Promise<void> {
        const changes = task.changes.map(change =>
            `${change.type}: ${change.filePath} - ${change.description}`
        ).join('\n');

        await vscode.window.showInformationMessage(
            `Changes made by ${task.name}:\n\n${changes}`,
            { modal: true }
        );
    }

    private async validateTaskChanges(task: CoffeeModeTask): Promise<void> {
        for (const change of task.changes) {
            if (change.type === 'file-modify' || change.type === 'file-create') {
                if (change.newContent && fs.existsSync(change.filePath)) {
                    const validation = await this.validationService.validateCode(change.filePath, change.newContent);
                    if (!validation.isValid) {
                        throw new Error(`Validation failed for ${change.filePath}: ${validation.errors[0]?.message}`);
                    }
                }
            }
        }
    }

    private async rollbackTask(task: CoffeeModeTask): Promise<void> {
        if (!task.rollbackPlan) return;

        for (const change of task.rollbackPlan.changes) {
            if (change.type === 'file-modify' && change.oldContent) {
                await fs.promises.writeFile(change.filePath, change.oldContent, 'utf-8');
            } else if (change.type === 'file-create') {
                if (fs.existsSync(change.filePath)) {
                    await fs.promises.unlink(change.filePath);
                }
            }
        }
    }

    private async showCoffeeModeSettings(): Promise<void> {
        vscode.commands.executeCommand('workbench.action.openSettings', 'kalai-agent.coffeeMode');
    }

    private async showDetailedAnalysis(analysis: CoffeeModeAnalysis): Promise<void> {
        // This would show a detailed webview with the analysis
        vscode.window.showInformationMessage('Detailed analysis view would be shown here');
    }

    private setupScheduledRuns(): void {
        // Setup scheduled runs based on config
        // This would use a cron library to schedule tasks
    }

    private getTestPath(filePath: string): string {
        const parsedPath = path.parse(filePath);
        return path.join(parsedPath.dir, '__tests__', `${parsedPath.name}.test${parsedPath.ext}`);
    }

    private async updateDependencies(task: CoffeeModeTask): Promise<void> {
        // Update package.json dependencies
        // This would analyze and update outdated dependencies
    }

    private async cleanupCode(task: CoffeeModeTask): Promise<void> {
        // Clean up unused imports, variables, etc.
        // This would run code cleanup operations
    }

    /**
     * Get Coffee Mode status
     */
    public getStatus(): any {
        return {
            enabled: this.config.enabled,
            isRunning: this.isRunning,
            activeTasks: this.activeTasks.size,
            queuedTasks: this.taskQueue.length,
            lastAnalysis: this.currentAnalysis,
            config: this.config
        };
    }

    /**
     * Get active tasks
     */
    public getActiveTasks(): CoffeeModeTask[] {
        return Array.from(this.activeTasks.values());
    }

    /**
     * Get task queue
     */
    public getTaskQueue(): CoffeeModeTask[] {
        return [...this.taskQueue];
    }

    /**
     * Cancel task
     */
    public async cancelTask(taskId: string): Promise<void> {
        const task = this.activeTasks.get(taskId);
        if (task) {
            task.status = 'cancelled';
            this.activeTasks.delete(taskId);

            if (task.rollbackPlan) {
                await this.rollbackTask(task);
            }
        }
    }
}