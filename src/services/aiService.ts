import * as vscode from 'vscode';
import axios from 'axios';
import { AIRequestContext } from '../types/aiTypes';
import { RepoGrokkingService, CodeElement, RepositoryIndex } from './repoGrokkingService';
import { AgenticPipelineService, AgenticTask } from './agenticPipelineService';
import { WebSearchService } from './webSearchService';

interface AIModelResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface EnhancedConversationContext {
  messages: Array<{ role: string, content: string }>;
  projectContext?: AIRequestContext;
  repoContext?: RepositoryIndex;
  currentTask?: AgenticTask;
  stepsPlan?: string[];
  currentStep?: number;
  mode: 'chat' | 'coding-agent' | 'coffee-mode';
  capabilities: AICapabilities;
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
}

interface AICapabilities {
  repoGrokking: boolean;
  agenticPipeline: boolean;
  webSearch: boolean;
  multiFileOperations: boolean;
  autonomousMode: boolean;
  realTimeValidation: boolean;
  contextAwareGeneration: boolean;
}

interface EnhancedPromptContext {
  repoInsights: RepoInsights;
  semanticContext: SemanticContext;
  architecturalContext: ArchitecturalContext;
  projectMetadata: ProjectMetadata;
  userPreferences: UserPreferences;
}

interface RepoInsights {
  totalFiles: number;
  totalElements: number;
  complexity: number;
  patterns: string[];
  conventions: string[];
  frameworks: string[];
  quality: number;
}

interface SemanticContext {
  relatedElements: CodeElement[];
  dependencies: string[];
  usagePatterns: string[];
  similarImplementations: CodeElement[];
  refactoringOpportunities: string[];
}

interface ArchitecturalContext {
  patterns: string[];
  principles: string[];
  constraints: string[];
  recommendations: string[];
  bestPractices: string[];
}

interface ProjectMetadata {
  language: string;
  framework: string;
  buildTool: string;
  testFramework: string;
  dependencies: Record<string, string>;
  scripts: Record<string, string>;
}

interface UserPreferences {
  codeStyle: string;
  verbosity: 'minimal' | 'detailed' | 'comprehensive';
  autoFix: boolean;
  explanationLevel: 'beginner' | 'intermediate' | 'expert';
}

interface AIResponse {
  content: string;
  confidence: number;
  reasoning: string;
  suggestions: string[];
  actions: RecommendedAction[];
  metadata: ResponseMetadata;
}

interface RecommendedAction {
  type: 'file-edit' | 'file-create' | 'refactor' | 'test' | 'documentation' | 'search';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  parameters: any;
  impact: 'minimal' | 'moderate' | 'significant' | 'major';
}

interface ResponseMetadata {
  processingTime: number;
  tokensUsed: number;
  confidence: number;
  sources: string[];
  reasoning: string;
}

export class AIService {
  private readonly API_KEY = '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';
  private readonly API_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly MODEL_NAME = 'qwen/qwen-2.5-7b-instruct:free';
  private readonly maxRetries: number = 3;

  private conversationHistory: EnhancedConversationContext;
  private repoGrokkingService: RepoGrokkingService | null = null;
  private agenticPipelineService: AgenticPipelineService | null = null;
  private webSearchService: WebSearchService | null = null;
  private projectAnalysisCache: Map<string, any> = new Map();

  constructor(
    repoGrokkingService?: RepoGrokkingService,
    agenticPipelineService?: AgenticPipelineService,
    webSearchService?: WebSearchService
  ) {
    this.repoGrokkingService = repoGrokkingService || null;
    this.agenticPipelineService = agenticPipelineService || null;
    this.webSearchService = webSearchService || null;

    this.conversationHistory = this.initializeConversationContext();
  }

  private initializeConversationContext(): EnhancedConversationContext {
    return {
      messages: [],
      mode: 'chat',
      capabilities: {
        repoGrokking: !!this.repoGrokkingService,
        agenticPipeline: !!this.agenticPipelineService,
        webSearch: !!this.webSearchService,
        multiFileOperations: true,
        autonomousMode: false,
        realTimeValidation: true,
        contextAwareGeneration: true
      },
      sessionId: this.generateSessionId(),
      createdAt: new Date(),
      lastActivity: new Date()
    };
  }

  /**
   * Analyze message to determine processing strategy
   */
  private async analyzeMessage(message: string): Promise<{
    intent: string;
    complexity: 'low' | 'medium' | 'high';
    requiresAgenticPipeline: boolean;
    requiresWebSearch: boolean;
    requiresRepoAnalysis: boolean;
  }> {
    const lowerMessage = message.toLowerCase();

    // Detect complex tasks that require agentic pipeline
    const agenticIndicators = [
      'refactor', 'implement', 'create', 'build', 'generate', 'optimize',
      'fix', 'migrate', 'upgrade', 'restructure', 'redesign'
    ];

    // Detect web search requirements
    const webSearchIndicators = [
      'latest', 'current', 'recent', 'new', 'trending', 'update',
      'version', 'release', 'changelog', 'documentation'
    ];

    // Detect repo analysis requirements
    const repoAnalysisIndicators = [
      'analyze', 'overview', 'structure', 'architecture', 'patterns',
      'dependencies', 'complexity', 'quality', 'metrics'
    ];

    const requiresAgenticPipeline = agenticIndicators.some(indicator =>
      lowerMessage.includes(indicator)
    );

    const requiresWebSearch = webSearchIndicators.some(indicator =>
      lowerMessage.includes(indicator)
    );

    const requiresRepoAnalysis = repoAnalysisIndicators.some(indicator =>
      lowerMessage.includes(indicator)
    );

    // Determine complexity
    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (requiresAgenticPipeline) complexity = 'high';
    else if (requiresWebSearch || requiresRepoAnalysis) complexity = 'medium';

    return {
      intent: this.extractIntent(message),
      complexity,
      requiresAgenticPipeline,
      requiresWebSearch,
      requiresRepoAnalysis
    };
  }

  /**
   * Build enhanced context with repo grokking insights
   */
  private async buildEnhancedContext(message: string, context?: AIRequestContext): Promise<EnhancedPromptContext | null> {
    if (!this.repoGrokkingService) return null;

    const repoIndex = this.repoGrokkingService.getRepositoryIndex();
    const repoInsights = this.buildRepoInsights(repoIndex);
    const semanticContext = await this.buildSemanticContext(message, repoIndex);
    const architecturalContext = this.buildArchitecturalContext(repoIndex);
    const projectMetadata = await this.buildProjectMetadata(context);
    const userPreferences = this.getUserPreferences();

    return {
      repoInsights,
      semanticContext,
      architecturalContext,
      projectMetadata,
      userPreferences
    };
  }

  /**
   * Handle requests requiring agentic pipeline
   */
  private async handleAgenticRequest(message: string, context: EnhancedPromptContext | null): Promise<string> {
    if (!this.agenticPipelineService) {
      return await this.handleStandardRequest(message, context);
    }

    // Determine task type
    const taskType = this.determineTaskType(message);

    // Create agentic task
    const taskId = await this.agenticPipelineService.createTask(
      taskType,
      message,
      {
        userInstructions: message,
        targetFiles: this.extractTargetFiles(message),
        projectContext: this.conversationHistory.projectContext!
      }
    );

    // Set current task in conversation
    this.conversationHistory.currentTask = this.agenticPipelineService.getTask(taskId);

    // Generate response about task creation
    const response = await this.generateTaskResponse(taskId, message, context);

    return response;
  }

  /**
   * Handle requests requiring web search
   */
  private async handleWebSearchRequest(message: string, context: EnhancedPromptContext | null): Promise<string> {
    if (!this.webSearchService) {
      return await this.handleStandardRequest(message, context);
    }

    // Extract search query
    const searchQuery = this.extractSearchQuery(message);

    // Perform web search
    const searchResults = await this.webSearchService.search(searchQuery);

    // Generate enhanced response with search results
    const enhancedPrompt = this.buildWebSearchPrompt(message, searchResults, context);
    const response = await this.callAIModel(enhancedPrompt);

    return response;
  }

  /**
   * Handle standard requests with enhanced context
   */
  private async handleStandardRequest(message: string, context: EnhancedPromptContext | null, originalContext?: AIRequestContext): Promise<string> {
    let systemPrompt: string;
    let userPrompt: string;

    if (context) {
      systemPrompt = this.createEnhancedSystemPrompt(context);
      userPrompt = this.createEnhancedUserPrompt(message, context);
    } else {
      // Fallback to original system
      systemPrompt = this.createAdvancedSystemPrompt(originalContext);
      userPrompt = await this.enhanceUserPrompt(message, originalContext);
    }

    const messages = this.buildConversationMessages(systemPrompt, userPrompt);
    return await this.callAIModel(messages);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractIntent(message: string): string {
    const intents = {
      'explain': ['explain', 'what is', 'how does', 'why'],
      'generate': ['create', 'generate', 'build', 'make'],
      'refactor': ['refactor', 'improve', 'optimize', 'clean'],
      'debug': ['debug', 'fix', 'error', 'issue'],
      'analyze': ['analyze', 'review', 'examine', 'inspect'],
      'test': ['test', 'validate', 'check', 'verify']
    };

    const lowerMessage = message.toLowerCase();
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return intent;
      }
    }

    return 'general';
  }

  private determineTaskType(message: string): any {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('test')) return 'testing';
    if (lowerMessage.includes('refactor')) return 'refactoring';
    if (lowerMessage.includes('document')) return 'documentation';
    if (lowerMessage.includes('analyze')) return 'analysis';

    return 'code-generation';
  }

  private extractTargetFiles(message: string): string[] {
    const filePattern = /[^\s]+\.[a-zA-Z]+/g;
    const matches = message.match(filePattern);
    return matches || [];
  }

  private extractSearchQuery(message: string): string {
    const searchPatterns = [
      /latest (.+)/i,
      /current (.+)/i,
      /new (.+)/i,
      /about (.+)/i
    ];

    for (const pattern of searchPatterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return message;
  }

  private buildWebSearchPrompt(message: string, searchResults: any[], context: EnhancedPromptContext | null): any[] {
    const systemPrompt = context ?
      this.createEnhancedSystemPrompt(context) :
      this.createAdvancedSystemPrompt();

    const enhancedMessage = `${message}\n\nWeb Search Results:\n${JSON.stringify(searchResults, null, 2)}`;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: enhancedMessage }
    ];
  }

  private async generateTaskResponse(taskId: string, message: string, context: EnhancedPromptContext | null): Promise<string> {
    if (!this.agenticPipelineService) return "Task creation failed - pipeline not available";

    const task = this.agenticPipelineService.getTask(taskId);
    const progress = this.agenticPipelineService.getTaskProgress(taskId);

    return `I've created an agentic task to handle your request: "${message}"

Task Details:
- Task ID: ${taskId}
- Type: ${task?.type}
- Status: ${task?.status}
- Progress: ${progress?.current}/${progress?.total} steps

The task will be processed through multiple steps including analysis, planning, implementation, validation, and testing. You'll receive updates as the task progresses.

Current Step: ${progress?.currentStep || 'Initializing...'}

I'll keep you informed of the progress and results.`;
  }

  // Enhanced context building methods
  private buildRepoInsights(repoIndex: RepositoryIndex | null): RepoInsights {
    if (!repoIndex) {
      return {
        totalFiles: 0,
        totalElements: 0,
        complexity: 0,
        patterns: [],
        conventions: [],
        frameworks: [],
        quality: 0
      };
    }

    const patterns = repoIndex.architecturalPatterns.map(p => p.name);
    const conventions = this.extractConventions(repoIndex.namingConventions);
    const frameworks = this.extractFrameworks(repoIndex);

    return {
      totalFiles: repoIndex.fileIndex.size,
      totalElements: repoIndex.semanticIndex.elements.size,
      complexity: this.calculateAverageComplexity(repoIndex),
      patterns,
      conventions,
      frameworks,
      quality: this.calculateQualityScore(repoIndex)
    };
  }

  private async buildSemanticContext(message: string, repoIndex: RepositoryIndex | null): Promise<SemanticContext> {
    if (!repoIndex || !this.repoGrokkingService) {
      return {
        relatedElements: [],
        dependencies: [],
        usagePatterns: [],
        similarImplementations: [],
        refactoringOpportunities: []
      };
    }

    const relatedElements = await this.repoGrokkingService.searchCodeElements(message, 5);
    const dependencies = this.extractRelevantDependencies(message, repoIndex);
    const usagePatterns = this.analyzeUsagePatterns(relatedElements);
    const similarImplementations = await this.findSimilarImplementations(relatedElements);
    const refactoringOpportunities = this.identifyRefactoringOpportunities(relatedElements);

    return {
      relatedElements,
      dependencies,
      usagePatterns,
      similarImplementations,
      refactoringOpportunities
    };
  }

  private buildArchitecturalContext(repoIndex: RepositoryIndex | null): ArchitecturalContext {
    if (!repoIndex) {
      return {
        patterns: [],
        principles: [],
        constraints: [],
        recommendations: [],
        bestPractices: []
      };
    }

    const patterns = repoIndex.architecturalPatterns.map(p => p.name);
    const principles = this.extractArchitecturalPrinciples(repoIndex);
    const constraints = this.identifyArchitecturalConstraints(repoIndex);
    const recommendations = this.generateArchitecturalRecommendations(repoIndex);
    const bestPractices = this.identifyBestPractices(repoIndex);

    return {
      patterns,
      principles,
      constraints,
      recommendations,
      bestPractices
    };
  }

  private async buildProjectMetadata(context?: AIRequestContext): Promise<ProjectMetadata> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return {
        language: 'unknown',
        framework: 'unknown',
        buildTool: 'unknown',
        testFramework: 'unknown',
        dependencies: {},
        scripts: {}
      };
    }

    try {
      const packageJsonPath = vscode.Uri.joinPath(workspaceFolder.uri, 'package.json');
      const packageContent = await vscode.workspace.fs.readFile(packageJsonPath);
      const packageJson = JSON.parse(packageContent.toString());

      return {
        language: context?.currentFile?.languageId || 'unknown',
        framework: context?.detectedFramework || 'unknown',
        buildTool: 'npm',
        testFramework: this.detectTestFramework(packageJson.dependencies || {}),
        dependencies: packageJson.dependencies || {},
        scripts: packageJson.scripts || {}
      };
    } catch (error) {
      return {
        language: context?.currentFile?.languageId || 'unknown',
        framework: context?.detectedFramework || 'unknown',
        buildTool: 'unknown',
        testFramework: 'unknown',
        dependencies: {},
        scripts: {}
      };
    }
  }

  private getUserPreferences(): UserPreferences {
    const config = vscode.workspace.getConfiguration('kalai-agent');

    return {
      codeStyle: config.get('codeStyle', 'standard'),
      verbosity: config.get('verbosity', 'detailed'),
      autoFix: config.get('autoFix', true),
      explanationLevel: config.get('explanationLevel', 'intermediate')
    };
  }

  private createEnhancedSystemPrompt(context: EnhancedPromptContext): string {
    return `You are Kalai, an advanced AI coding agent with deep repository understanding and autonomous capabilities.

ENHANCED CAPABILITIES:
- Repository Grokking™: Deep understanding of entire codebase structure, patterns, and relationships
- Agentic Pipeline: Multi-step reasoning, validation, and error correction
- Context-Aware Generation: Code that follows project conventions and patterns
- Real-Time Validation: Continuous quality and correctness checking
- Multi-File Operations: Coordinated changes across multiple files
- Semantic Understanding: Deep comprehension of code relationships and intent

REPOSITORY INSIGHTS:
- Total Files: ${context.repoInsights.totalFiles}
- Code Elements: ${context.repoInsights.totalElements}
- Complexity Score: ${context.repoInsights.complexity}
- Patterns: ${context.repoInsights.patterns.join(', ')}
- Conventions: ${context.repoInsights.conventions.join(', ')}
- Frameworks: ${context.repoInsights.frameworks.join(', ')}
- Quality Score: ${context.repoInsights.quality}

ARCHITECTURAL CONTEXT:
- Patterns: ${context.architecturalContext.patterns.join(', ')}
- Principles: ${context.architecturalContext.principles.join(', ')}
- Constraints: ${context.architecturalContext.constraints.join(', ')}

PROJECT METADATA:
- Language: ${context.projectMetadata.language}
- Framework: ${context.projectMetadata.framework}
- Build Tool: ${context.projectMetadata.buildTool}
- Test Framework: ${context.projectMetadata.testFramework}

OPERATIONAL GUIDELINES:
1. Always consider the full repository context when making suggestions
2. Follow established patterns and conventions from the codebase
3. Provide multi-step reasoning for complex tasks
4. Validate all suggestions against project constraints
5. Consider performance, security, and maintainability impacts
6. Suggest refactoring opportunities when appropriate
7. Generate code that integrates seamlessly with existing architecture
8. Provide confidence scores and reasoning for recommendations

RESPONSE FORMAT:
- Be comprehensive yet concise
- Include reasoning behind suggestions
- Provide actionable recommendations
- Consider multiple solution approaches
- Highlight potential risks and trade-offs
- Suggest follow-up actions when appropriate

Current Mode: ${this.conversationHistory.mode}
User Expertise: ${context.userPreferences.explanationLevel}
`;
  }

  private createEnhancedUserPrompt(message: string, context: EnhancedPromptContext): string {
    let enhancedPrompt = message;

    // Add semantic context if available
    if (context.semanticContext.relatedElements.length > 0) {
      enhancedPrompt += `\n\nRelevant Code Elements:\n`;
      context.semanticContext.relatedElements.forEach(element => {
        enhancedPrompt += `- ${element.name} (${element.type}) in ${element.filePath}\n`;
      });
    }

    // Add similar implementations
    if (context.semanticContext.similarImplementations.length > 0) {
      enhancedPrompt += `\n\nSimilar Implementations:\n`;
      context.semanticContext.similarImplementations.forEach(impl => {
        enhancedPrompt += `- ${impl.name} in ${impl.filePath}\n`;
      });
    }

    // Add refactoring opportunities
    if (context.semanticContext.refactoringOpportunities.length > 0) {
      enhancedPrompt += `\n\nRefactoring Opportunities:\n`;
      context.semanticContext.refactoringOpportunities.forEach(opp => {
        enhancedPrompt += `- ${opp}\n`;
      });
    }

    return enhancedPrompt;
  }

  // Utility methods for enhanced context
  private extractConventions(namingConventions: any): string[] {
    const conventions = [];

    if (namingConventions?.camelCase > 0) conventions.push('camelCase');
    if (namingConventions?.pascalCase > 0) conventions.push('PascalCase');
    if (namingConventions?.snakeCase > 0) conventions.push('snake_case');
    if (namingConventions?.kebabCase > 0) conventions.push('kebab-case');

    return conventions;
  }

  private extractFrameworks(repoIndex: RepositoryIndex): string[] {
    const frameworks = new Set<string>();

    for (const [, fileEntry] of repoIndex.fileIndex) {
      for (const dep of fileEntry.imports) {
        if (dep.includes('react')) frameworks.add('React');
        if (dep.includes('vue')) frameworks.add('Vue');
        if (dep.includes('angular')) frameworks.add('Angular');
        if (dep.includes('express')) frameworks.add('Express');
      }
    }

    return Array.from(frameworks);
  }

  private calculateAverageComplexity(repoIndex: RepositoryIndex): number {
    let totalComplexity = 0;
    let count = 0;

    for (const [, fileEntry] of repoIndex.fileIndex) {
      totalComplexity += fileEntry.complexity;
      count++;
    }

    return count > 0 ? totalComplexity / count : 0;
  }

  private calculateQualityScore(repoIndex: RepositoryIndex): number {
    const complexity = this.calculateAverageComplexity(repoIndex);
    const patternScore = repoIndex.architecturalPatterns.length * 0.1;
    const conventionScore = Object.keys(repoIndex.namingConventions.conventions).length * 0.05;

    return Math.min(1, Math.max(0, 1 - (complexity * 0.1) + patternScore + conventionScore));
  }

  private extractRelevantDependencies(message: string, repoIndex: RepositoryIndex): string[] {
    const dependencies = new Set<string>();
    const keywords = message.toLowerCase().split(' ');

    for (const [, fileEntry] of repoIndex.fileIndex) {
      for (const dep of fileEntry.imports) {
        if (keywords.some(keyword => dep.toLowerCase().includes(keyword))) {
          dependencies.add(dep);
        }
      }
    }

    return Array.from(dependencies);
  }

  private analyzeUsagePatterns(elements: CodeElement[]): string[] {
    const patterns = new Set<string>();

    for (const element of elements) {
      if (element.type === 'function' && element.name.startsWith('handle')) {
        patterns.add('Event handler pattern');
      }
      if (element.type === 'class' && element.name.endsWith('Service')) {
        patterns.add('Service pattern');
      }
      if (element.type === 'function' && element.name.startsWith('use')) {
        patterns.add('React hook pattern');
      }
    }

    return Array.from(patterns);
  }

  private async findSimilarImplementations(elements: CodeElement[]): Promise<CodeElement[]> {
    const similar: CodeElement[] = [];

    if (this.repoGrokkingService) {
      for (const element of elements) {
        const similarElements = await this.repoGrokkingService.findSimilarElements(element, 3);
        similar.push(...similarElements);
      }
    }

    return similar;
  }

  private identifyRefactoringOpportunities(elements: CodeElement[]): string[] {
    const opportunities = [];

    for (const element of elements) {
      if (element.complexity > 10) {
        opportunities.push(`High complexity in ${element.name} - consider breaking down`);
      }
      if (element.dependencies.length > 5) {
        opportunities.push(`High coupling in ${element.name} - consider dependency injection`);
      }
    }

    return opportunities;
  }

  private extractArchitecturalPrinciples(repoIndex: RepositoryIndex): string[] {
    const principles = [];

    const patterns = repoIndex.architecturalPatterns.map(p => p.name);

    if (patterns.includes('MVC Pattern')) {
      principles.push('Separation of Concerns');
    }
    if (patterns.includes('Repository Pattern')) {
      principles.push('Data Access Abstraction');
    }

    return principles;
  }

  private identifyArchitecturalConstraints(repoIndex: RepositoryIndex): string[] {
    const constraints = [];

    const fileCount = repoIndex.fileIndex.size;
    const avgComplexity = this.calculateAverageComplexity(repoIndex);

    if (fileCount > 100) {
      constraints.push('Large codebase - maintain modularity');
    }
    if (avgComplexity > 5) {
      constraints.push('High complexity - prioritize simplicity');
    }

    return constraints;
  }

  private generateArchitecturalRecommendations(repoIndex: RepositoryIndex): string[] {
    const recommendations = [];

    const patterns = repoIndex.architecturalPatterns.map(p => p.name);

    if (!patterns.includes('Repository Pattern')) {
      recommendations.push('Consider implementing Repository pattern for data access');
    }
    if (!patterns.includes('MVC Pattern')) {
      recommendations.push('Consider implementing MVC pattern for better organization');
    }

    return recommendations;
  }

  private identifyBestPractices(repoIndex: RepositoryIndex): string[] {
    const practices = [];

    const conventions = this.extractConventions(repoIndex.namingConventions);

    if (conventions.includes('camelCase')) {
      practices.push('Consistent camelCase naming');
    }
    if (repoIndex.architecturalPatterns.length > 0) {
      practices.push('Architectural pattern implementation');
    }

    return practices;
  }

  private detectTestFramework(dependencies: Record<string, string>): string {
    if (dependencies.jest) return 'Jest';
    if (dependencies.mocha) return 'Mocha';
    if (dependencies.jasmine) return 'Jasmine';
    if (dependencies.vitest) return 'Vitest';

    return 'unknown';
  }



  private detectComplexTask(message: string): boolean {
    const complexTaskIndicators = [
      'create a', 'build a', 'implement', 'refactor', 'optimize',
      'analyze entire', 'full analysis', 'complete review',
      'step by step', 'plan for', 'architecture for'
    ];

    return complexTaskIndicators.some(indicator =>
      message.toLowerCase().includes(indicator)
    );
  }

  private async handleComplexTask(message: string, context?: AIRequestContext): Promise<string> {
    const planningPrompt = `
You are an expert software architect and developer. Break down this complex task into clear, actionable steps:

Task: ${message}

${context ? this.createProjectAnalysisPrompt(context) : ''}

Provide a detailed plan with:
1. Analysis phase
2. Implementation steps
3. Testing considerations
4. Potential challenges

Format your response as a structured plan with numbered steps.
`;

    const messages = [
      { role: 'system', content: this.createAdvancedSystemPrompt(context) },
      { role: 'user', content: planningPrompt }
    ];

    const planResponse = await this.callAIModel(messages);

    // Store the task and plan
    this.conversationHistory.currentTask = {
      id: `task_${Date.now()}`,
      type: 'analysis',
      description: message,
      priority: 1,
      status: 'pending',
      createdAt: new Date(),
      context: {
        workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
        targetFiles: [],
        userInstructions: message,
        projectContext: this.conversationHistory.projectContext || {} as any,
        repoIndex: this.repoGrokkingService?.getRepositoryIndex() || null,
        constraints: {
          maxFilesToModify: 10,
          preserveExistingTests: true,
          maintainBackwardCompatibility: true,
          followProjectConventions: true,
          requireValidation: true,
          allowExternalDependencies: false
        }
      },
      steps: this.extractStepsFromPlan(planResponse).map((step, index) => ({
        id: `step_${index}`,
        type: 'analysis' as const,
        description: step,
        status: 'pending' as const,
        input: {}
      })),
      currentStep: 0
    } as AgenticTask;
    this.conversationHistory.stepsPlan = this.extractStepsFromPlan(planResponse);
    this.conversationHistory.currentStep = 0;

    return `**Complex Task Detected: Planning Phase**\n\n${planResponse}\n\nI've created a structured plan for your task. Would you like me to start with the first step, or would you like to modify the plan?`;
  }

  private extractStepsFromPlan(plan: string): string[] {
    const lines = plan.split('\n');
    const steps: string[] = [];

    lines.forEach(line => {
      if (/^\d+\./.test(line.trim())) {
        steps.push(line.trim());
      }
    });

    return steps;
  }

  private createAdvancedSystemPrompt(context?: AIRequestContext): string {
    let prompt = `You are Kalai, an advanced AI programming assistant with expertise in software development, architecture, and best practices.

Core Capabilities:
- Deep code analysis and understanding
- Multi-step problem solving and planning
- Context-aware suggestions across entire codebases
- Advanced debugging and error resolution
- Code optimization and refactoring
- Documentation generation
- Best practices enforcement

Guidelines:
1. Always consider the full project context when making suggestions
2. Provide detailed explanations for complex concepts
3. Break down large tasks into manageable steps
4. Consider performance, security, and maintainability
5. Suggest modern best practices and patterns
6. Identify potential issues before they become problems
7. Provide code examples with proper formatting
8. Consider cross-file dependencies and impacts

`;

    if (context?.currentFile?.languageId) {
      prompt += `Current Language: ${context.currentFile.languageId}\n`;
    }

    if (context?.detectedFramework) {
      prompt += `Detected Framework: ${context.detectedFramework}\n`;
    }

    if (context?.dependencies) {
      prompt += `Project Dependencies: ${Object.keys(context.dependencies).join(', ')}\n`;
    }

    return prompt;
  }

  private async enhanceUserPrompt(message: string, context?: AIRequestContext): Promise<string> {
    let enhancedPrompt = message;

    // Add project context if available
    if (context) {
      enhancedPrompt = this.createProjectAnalysisPrompt(context) + '\n\n' + message;
    }

    // Detect specific request types and enhance accordingly
    if (message.toLowerCase().includes('explain') || message.toLowerCase().includes('what is')) {
      enhancedPrompt += '\n\nPlease provide a comprehensive explanation including examples and best practices.';
    }

    if (message.toLowerCase().includes('optimize') || message.toLowerCase().includes('improve')) {
      enhancedPrompt += '\n\nPlease consider performance, readability, maintainability, and modern best practices.';
    }

    if (message.toLowerCase().includes('debug') || message.toLowerCase().includes('error')) {
      enhancedPrompt += '\n\nPlease provide step-by-step debugging guidance and potential solutions.';
    }

    return enhancedPrompt;
  }

  private buildConversationMessages(systemPrompt: string, userPrompt: string): any[] {
    const messages = [{ role: 'system', content: systemPrompt }];

    // Add relevant conversation history
    const recentHistory = this.conversationHistory.messages.slice(-6); // Last 3 exchanges
    messages.push(...recentHistory);

    messages.push({ role: 'user', content: userPrompt });

    return messages;
  }

  public async analyzeCodebase(workspaceRoot: string): Promise<string> {
    const cacheKey = `codebase_${workspaceRoot}`;

    if (this.projectAnalysisCache.has(cacheKey)) {
      return this.projectAnalysisCache.get(cacheKey);
    }

    try {
      // Get project files
      const files = await vscode.workspace.findFiles(
        '**/*.{js,ts,jsx,tsx,py,java,cpp,c,cs,php,rb,go,rs}',
        '**/node_modules/**'
      );

      let analysis = 'Codebase Analysis:\n\n';

      // Analyze file structure
      const filesByType = new Map<string, number>();
      files.forEach(file => {
        const ext = file.fsPath.split('.').pop() || 'unknown';
        filesByType.set(ext, (filesByType.get(ext) || 0) + 1);
      });

      analysis += 'File Distribution:\n';
      filesByType.forEach((count, ext) => {
        analysis += `- ${ext}: ${count} files\n`;
      });

      // Cache the analysis
      this.projectAnalysisCache.set(cacheKey, analysis);

      return analysis;
    } catch (error) {
      console.error('Error analyzing codebase:', error);
      return 'Unable to analyze codebase at this time.';
    }
  }

  public clearConversationHistory(): void {
    this.conversationHistory.messages = [];
    this.conversationHistory.currentTask = undefined;
  }

  /**
   * Enhanced public API methods
   */
  public async switchMode(mode: 'chat' | 'coding-agent' | 'coffee-mode'): Promise<void> {
    this.conversationHistory.mode = mode;
    this.conversationHistory.capabilities.autonomousMode = mode === 'coffee-mode';

    // Notify about mode change
    const modeNames = {
      'chat': 'Chat Assistant',
      'coding-agent': 'Coding Agent',
      'coffee-mode': 'Coffee Mode (Autonomous)'
    };

    vscode.window.showInformationMessage(
      `Kalai switched to ${modeNames[mode]} mode`
    );
  }

  public getCurrentMode(): string {
    return this.conversationHistory.mode;
  }

  /**
   * Switch AI model for the service
   */
  public async switchModel(modelId: string): Promise<void> {
    // Implementation for switching AI models
    // This would typically involve updating the model configuration
    // For now, we'll update the current model in the service
    this.conversationHistory.mode = this.conversationHistory.mode; // Placeholder - model switching would be implemented here

    vscode.window.showInformationMessage(
      `Kalai switched to model: ${modelId}`
    );
  }

  /**
   * Process message with enhanced context and routing
   */
  public async processMessage(message: string, context?: AIRequestContext): Promise<string> {
    try {
      // Update conversation history
      this.conversationHistory.messages.push({
        role: 'user',
        content: message
      });
      this.conversationHistory.lastActivity = new Date();

      // Analyze message to determine processing strategy
      const analysis = await this.analyzeMessage(message);

      // Build enhanced context
      const enhancedContext = await this.buildEnhancedContext(message, context);

      let response: string;

      // Route to appropriate handler based on analysis
      if (analysis.requiresAgenticPipeline && this.agenticPipelineService) {
        response = await this.handleAgenticRequest(message, enhancedContext);
      } else if (analysis.requiresWebSearch && this.webSearchService) {
        response = await this.handleWebSearchRequest(message, enhancedContext);
      } else if (analysis.complexity === 'high') {
        response = await this.handleComplexTask(message, context);
      } else {
        response = await this.handleStandardRequest(message, enhancedContext, context);
      }

      // Add response to conversation history
      this.conversationHistory.messages.push({
        role: 'assistant',
        content: response
      });

      return response;
    } catch (error) {
      const errorMessage = `Error processing message: ${error instanceof Error ? error.message : 'Unknown error'}`;
      vscode.window.showErrorMessage(errorMessage);
      return errorMessage;
    }
  }

  /**
   * Send message to AI service
   */
  public async sendMessage(message: string, context?: any): Promise<string> {
    return this.processMessage(message, context);
  }

  public getCapabilities(): AICapabilities {
    return this.conversationHistory.capabilities;
  }

  public async getTaskStatus(taskId: string): Promise<string> {
    if (!this.agenticPipelineService) {
      return 'Agentic pipeline not available';
    }

    const task = this.agenticPipelineService.getTask(taskId);
    const progress = this.agenticPipelineService.getTaskProgress(taskId);

    if (!task) {
      return 'Task not found';
    }

    return `Task Status: ${task.status}\nProgress: ${progress?.current}/${progress?.total}\nCurrent Step: ${progress?.currentStep}`;
  }

  public getConversationSummary(): string {
    const messageCount = this.conversationHistory.messages.length;
    const sessionDuration = Date.now() - this.conversationHistory.createdAt.getTime();
    const currentTask = this.conversationHistory.currentTask;

    return `Session Summary:
- Messages: ${messageCount}
- Duration: ${Math.round(sessionDuration / 1000 / 60)} minutes
- Mode: ${this.conversationHistory.mode}
- Current Task: ${currentTask ? 'Active' : 'None'}
- Capabilities: ${Object.entries(this.conversationHistory.capabilities).filter(([, enabled]) => enabled).map(([name]) => name).join(', ')}`;
  }

  public async initializeRepoGrokking(): Promise<void> {
    if (this.repoGrokkingService) {
      await this.repoGrokkingService.initializeRepository();
    }
  }



  public async editCode(code: string, context: AIRequestContext): Promise<string> {
    const enhancedContext = await this.getEnhancedContext(context);
    const prompt = this.createEditPrompt(code, enhancedContext);

    const messages = [
      { role: 'system', content: this.createSystemPrompt(context) },
      { role: 'user', content: prompt }
    ];

    return this.callAIModel(messages);
  }

  private createSystemPrompt(context?: AIRequestContext): string {
    let prompt = `You are an AI programming assistant with expertise in ${context?.currentFile?.languageId || 'multiple programming languages'}. `;
    prompt += 'Follow these guidelines:\n';
    prompt += '1. Provide clear, concise, and practical solutions\n';
    prompt += '2. Include only necessary code without explanations unless asked\n';
    prompt += '3. Follow the current code style and conventions\n';
    prompt += '4. Consider project dependencies and context\n';
    prompt += '5. Focus on production-quality, maintainable code\n';
    return prompt;
  }

  private createEditPrompt(code: string, context: AIRequestContext): string {
    return `Please ${context.instruction || 'improve'} the following code while maintaining its core functionality:

\`\`\`${context.currentFile?.languageId || 'text'}
${code}
\`\`\`

Consider the current project context and dependencies. Respond only with the modified code.`;
  }

  private createProjectAnalysisPrompt(context: AIRequestContext): string {
    let prompt = 'Based on the following project context:\n\n';

    if (context.activeFile) {
      prompt += `Main file: ${context.activeFile.relativePath}\n`;
      prompt += `Type: ${context.activeFile.language}\n\n`;

      if (context.detectedFramework) {
        prompt += `Framework: ${context.detectedFramework}\n`;
      }

      if (context.dependencies) {
        prompt += 'Dependencies:\n';
        Object.entries(context.dependencies).forEach(([dep, version]) => {
          prompt += `- ${dep}@${version}\n`;
        });
        prompt += '\n';
      }

      prompt += 'File content:\n```\n';
      prompt += context.activeFile.content;
      prompt += '\n```\n\n';
    }

    prompt += 'Project analysis:\n';
    if (context.files.length > 1) {
      prompt += 'Related files:\n';
      context.files.slice(0, 3).forEach(file => {
        prompt += `- ${file.relativePath} (${file.language})\n`;
      });
    }

    return prompt;
  }

  private async getEnhancedContext(context: AIRequestContext): Promise<AIRequestContext> {
    if (!context.currentFile?.filePath) return context;

    try {
      const currentDir = vscode.Uri.file(context.currentFile.filePath).fsPath;
      const files = await vscode.workspace.findFiles(
        new vscode.RelativePattern(currentDir, '**/*'),
        '**/node_modules/**'
      );

      context.currentFile.siblingFiles = files
        .map(f => f.fsPath)
        .filter(f => f !== context.currentFile?.filePath);

      return context;
    } catch (error) {
      console.warn('Error enhancing context:', error);
      return context;
    }
  }

  private async callAIModel(messages: any[], retryCount = 0): Promise<string> {
    try {
      if (!this.API_KEY) {
        throw new Error('API key is not configured. Please check your settings.');
      }

      const headers = {
        'Authorization': `Bearer ${this.API_KEY}`,
        'HTTP-Referer': 'https://github.com/Odeneho-Calculus/kalai-agent',
        'X-Title': 'Kalai Agent',
        'Content-Type': 'application/json',
        'OpenAI-Organization': 'org-yourOrgId' // Add if required by your API
      };

      console.log('Making AI request with model:', this.MODEL_NAME);
      console.log('Request payload:', {
        model: this.MODEL_NAME,
        messages: messages.map(m => ({ role: m.role, content: m.content.substring(0, 100) + '...' })),
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.95
      });

      const response = await axios.post<AIModelResponse>(
        this.API_ENDPOINT,
        {
          model: this.MODEL_NAME,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
          top_p: 0.95
        },
        {
          headers,
          timeout: 60000, // Increased to 60 seconds
          validateStatus: (status) => status < 500 // Handle 4xx errors explicitly
        }
      );

      console.log('AI response status:', response.status);

      // Handle specific response status codes
      if (response.status === 401 || response.status === 403) {
        throw new Error('API authentication failed - please verify your API key and permissions');
      }

      if (response.status === 429) {
        if (retryCount < this.maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.callAIModel(messages, retryCount + 1);
        }
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from AI model');
      }

      return response.data.choices[0].message.content;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        console.error('API Error Details:', {
          status,
          data,
          message: error.message,
          code: error.code
        });

        // Handle timeout specifically
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          if (retryCount < this.maxRetries) {
            console.log(`Request timeout, retrying... (${retryCount + 1}/${this.maxRetries})`);
            const delay = Math.pow(2, retryCount) * 2000; // Longer delay for timeouts
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.callAIModel(messages, retryCount + 1);
          }
          throw new Error('AI service timeout - the model is taking too long to respond. Please try again.');
        }

        // Handle specific error cases
        if (status === 401) {
          throw new Error('API authentication failed - please verify your API key');
        } else if (status === 403) {
          throw new Error('API access forbidden - please check your account permissions');
        } else if (status === 429) {
          throw new Error('Rate limit exceeded - please try again later');
        } else if (status === 404) {
          throw new Error('Model not found - please check the model name configuration');
        }
      }

      // Re-throw unexpected errors
      console.error('Unexpected error in AI service:', error);
      throw error;
    }
  }
}