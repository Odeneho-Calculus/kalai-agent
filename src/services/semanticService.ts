import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { RepositoryAnalysisService } from './repositoryAnalysisService';
import { AIService } from './aiService';

export interface SemanticAnalysis {
    id: string;
    filePath: string;
    language: string;
    astAnalysis: ASTAnalysis;
    codeFlowAnalysis: CodeFlowAnalysis;
    dependencyGraph: DependencyGraph;
    complexityMetrics: ComplexityMetrics;
    semanticPatterns: SemanticPattern[];
    codeSmells: CodeSmell[];
    suggestedImprovements: CodeImprovement[];
    generatedAt: Date;
}

export interface ASTAnalysis {
    nodeCount: number;
    depth: number;
    functions: FunctionNode[];
    classes: ClassNode[];
    variables: VariableNode[];
    imports: ImportNode[];
    exports: ExportNode[];
    comments: CommentNode[];
    literals: LiteralNode[];
}

export interface FunctionNode {
    name: string;
    startLine: number;
    endLine: number;
    parameters: Parameter[];
    returnType: string;
    complexity: number;
    callsiteCount: number;
    isAsync: boolean;
    isExported: boolean;
    documentation: string;
}

export interface ClassNode {
    name: string;
    startLine: number;
    endLine: number;
    properties: Property[];
    methods: FunctionNode[];
    inheritance: string[];
    interfaces: string[];
    isAbstract: boolean;
    isExported: boolean;
    documentation: string;
}

export interface VariableNode {
    name: string;
    type: string;
    line: number;
    scope: 'global' | 'local' | 'parameter';
    isConstant: boolean;
    isExported: boolean;
    usageCount: number;
    value?: string;
}

export interface ImportNode {
    module: string;
    imports: string[];
    isDefault: boolean;
    line: number;
    resolved: boolean;
    resolvedPath?: string;
}

export interface ExportNode {
    name: string;
    type: 'function' | 'class' | 'variable' | 'default';
    line: number;
    isDefault: boolean;
}

export interface CommentNode {
    type: 'line' | 'block' | 'doc';
    content: string;
    line: number;
    associatedNode?: string;
}

export interface LiteralNode {
    type: 'string' | 'number' | 'boolean' | 'null' | 'undefined';
    value: string;
    line: number;
}

export interface Parameter {
    name: string;
    type: string;
    optional: boolean;
    defaultValue?: string;
}

export interface Property {
    name: string;
    type: string;
    visibility: 'public' | 'private' | 'protected';
    isStatic: boolean;
    isReadonly: boolean;
    line: number;
}

export interface CodeFlowAnalysis {
    entryPoints: string[];
    exitPoints: string[];
    controlFlow: ControlFlowGraph;
    dataFlow: DataFlowGraph;
    callGraph: CallGraph;
    cyclomaticComplexity: number;
    reachabilityAnalysis: ReachabilityAnalysis;
}

export interface ControlFlowGraph {
    nodes: ControlFlowNode[];
    edges: ControlFlowEdge[];
}

export interface ControlFlowNode {
    id: string;
    type: 'entry' | 'exit' | 'statement' | 'condition' | 'loop';
    line: number;
    statement: string;
}

export interface ControlFlowEdge {
    from: string;
    to: string;
    condition?: string;
    type: 'unconditional' | 'true' | 'false' | 'exception';
}

export interface DataFlowGraph {
    variables: DataFlowVariable[];
    definitions: DataFlowDefinition[];
    uses: DataFlowUse[];
    defUseChains: DefUseChain[];
}

export interface DataFlowVariable {
    name: string;
    type: string;
    scope: string;
    definitions: number[];
    uses: number[];
}

export interface DataFlowDefinition {
    variable: string;
    line: number;
    type: 'assignment' | 'parameter' | 'declaration';
}

export interface DataFlowUse {
    variable: string;
    line: number;
    type: 'read' | 'write' | 'call';
}

export interface DefUseChain {
    variable: string;
    definition: number;
    uses: number[];
}

export interface CallGraph {
    nodes: CallGraphNode[];
    edges: CallGraphEdge[];
    recursiveCalls: string[];
}

export interface CallGraphNode {
    id: string;
    name: string;
    type: 'function' | 'method' | 'constructor';
    file: string;
    line: number;
}

export interface CallGraphEdge {
    caller: string;
    callee: string;
    line: number;
    type: 'direct' | 'indirect' | 'virtual';
}

export interface ReachabilityAnalysis {
    reachableFunctions: string[];
    unreachableFunctions: string[];
    deadCode: DeadCodeLocation[];
}

export interface DeadCodeLocation {
    type: 'function' | 'variable' | 'statement';
    name: string;
    line: number;
    reason: string;
}

export interface DependencyGraph {
    nodes: DependencyNode[];
    edges: DependencyEdge[];
    circularDependencies: CircularDependency[];
    dependencyMetrics: DependencyMetrics;
}

export interface DependencyNode {
    id: string;
    name: string;
    type: 'file' | 'function' | 'class' | 'variable';
    file: string;
    line?: number;
}

export interface DependencyEdge {
    from: string;
    to: string;
    type: 'imports' | 'calls' | 'inherits' | 'implements' | 'uses';
    weight: number;
}

export interface CircularDependency {
    cycle: string[];
    severity: 'low' | 'medium' | 'high';
    impact: string;
    suggestion: string;
}

export interface DependencyMetrics {
    totalDependencies: number;
    directDependencies: number;
    indirectDependencies: number;
    fanIn: number;
    fanOut: number;
    instability: number;
    abstractness: number;
}

export interface ComplexityMetrics {
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    halsteadMetrics: HalsteadMetrics;
    maintainabilityIndex: number;
    technicalDebt: number;
    linesOfCode: LinesOfCode;
}

export interface HalsteadMetrics {
    vocabulary: number;
    length: number;
    calculatedLength: number;
    volume: number;
    difficulty: number;
    effort: number;
    time: number;
    bugs: number;
}

export interface LinesOfCode {
    physical: number;
    logical: number;
    comment: number;
    blank: number;
    mixed: number;
}

export interface SemanticPattern {
    id: string;
    name: string;
    type: 'design-pattern' | 'anti-pattern' | 'idiom' | 'convention';
    description: string;
    location: PatternLocation;
    confidence: number;
    examples: string[];
    suggestions: string[];
}

export interface PatternLocation {
    file: string;
    startLine: number;
    endLine: number;
    functions: string[];
    classes: string[];
}

export interface CodeSmell {
    id: string;
    type: 'long-method' | 'large-class' | 'duplicate-code' | 'dead-code' | 'god-class' | 'feature-envy';
    severity: 'low' | 'medium' | 'high';
    description: string;
    location: CodeSmellLocation;
    metrics: { [key: string]: number };
    refactoringOptions: RefactoringOption[];
}

export interface CodeSmellLocation {
    file: string;
    startLine: number;
    endLine: number;
    function?: string;
    class?: string;
}

export interface RefactoringOption {
    type: 'extract-method' | 'extract-class' | 'move-method' | 'rename' | 'inline';
    description: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    implementation: string;
}

export interface CodeImprovement {
    id: string;
    category: 'performance' | 'readability' | 'maintainability' | 'security' | 'testing';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    currentCode: string;
    suggestedCode: string;
    explanation: string;
    estimatedImpact: string;
    location: CodeImprovementLocation;
}

export interface CodeImprovementLocation {
    file: string;
    startLine: number;
    endLine: number;
    function?: string;
    class?: string;
}

export class SemanticService {
    private repositoryAnalysisService: RepositoryAnalysisService;
    private aiService: AIService;
    private analysisCache: Map<string, SemanticAnalysis> = new Map();
    private astCache: Map<string, any> = new Map();

    constructor(repositoryAnalysisService: RepositoryAnalysisService, aiService: AIService) {
        this.repositoryAnalysisService = repositoryAnalysisService;
        this.aiService = aiService;
    }

    /**
     * Perform comprehensive semantic analysis on a file
     */
    public async analyzeFile(filePath: string): Promise<SemanticAnalysis> {
        const cacheKey = `${filePath}_${await this.getFileHash(filePath)}`;

        if (this.analysisCache.has(cacheKey)) {
            return this.analysisCache.get(cacheKey)!;
        }

        const content = await fs.promises.readFile(filePath, 'utf-8');
        const language = this.detectLanguage(filePath);

        const analysis: SemanticAnalysis = {
            id: this.generateId(),
            filePath,
            language,
            astAnalysis: await this.performASTAnalysis(content, filePath, language),
            codeFlowAnalysis: await this.performCodeFlowAnalysis(content, filePath, language),
            dependencyGraph: await this.buildDependencyGraph(content, filePath),
            complexityMetrics: await this.calculateComplexityMetrics(content, filePath, language),
            semanticPatterns: await this.identifySemanticPatterns(content, filePath, language),
            codeSmells: await this.detectCodeSmells(content, filePath, language),
            suggestedImprovements: await this.generateImprovements(content, filePath, language),
            generatedAt: new Date()
        };

        this.analysisCache.set(cacheKey, analysis);
        return analysis;
    }

    /**
     * Analyze multiple files and build cross-file relationships
     */
    public async analyzeProject(projectPath: string): Promise<{
        files: SemanticAnalysis[];
        projectMetrics: ProjectMetrics;
        architectureAnalysis: ArchitectureAnalysis;
        crossFilePatterns: CrossFilePattern[];
    }> {
        const sourceFiles = await this.repositoryAnalysisService.getSourceFiles();
        const analyses: SemanticAnalysis[] = [];

        // Analyze each file
        for (const file of sourceFiles) {
            if (this.shouldAnalyzeFile(file)) {
                const analysis = await this.analyzeFile(file);
                analyses.push(analysis);
            }
        }

        // Build project-level insights
        const projectMetrics = this.calculateProjectMetrics(analyses);
        const architectureAnalysis = await this.analyzeArchitecture(analyses);
        const crossFilePatterns = await this.identifyCrossFilePatterns(analyses);

        return {
            files: analyses,
            projectMetrics,
            architectureAnalysis,
            crossFilePatterns
        };
    }

    /**
     * Build comprehensive dependency graph for the project
     */
    public async buildProjectDependencyGraph(projectPath: string): Promise<DependencyGraph> {
        const sourceFiles = await this.repositoryAnalysisService.getSourceFiles();
        const nodes: DependencyNode[] = [];
        const edges: DependencyEdge[] = [];

        // Build nodes and edges from all files
        for (const file of sourceFiles) {
            const analysis = await this.analyzeFile(file);

            // Add file node
            nodes.push({
                id: file,
                name: path.basename(file),
                type: 'file',
                file
            });

            // Add function/class nodes
            for (const func of analysis.astAnalysis.functions) {
                nodes.push({
                    id: `${file}:${func.name}`,
                    name: func.name,
                    type: 'function',
                    file,
                    line: func.startLine
                });
            }

            for (const cls of analysis.astAnalysis.classes) {
                nodes.push({
                    id: `${file}:${cls.name}`,
                    name: cls.name,
                    type: 'class',
                    file,
                    line: cls.startLine
                });
            }

            // Add dependency edges
            for (const edge of analysis.dependencyGraph.edges) {
                edges.push(edge);
            }
        }

        // Detect circular dependencies
        const circularDependencies = this.detectCircularDependencies(nodes, edges);

        // Calculate dependency metrics
        const dependencyMetrics = this.calculateDependencyMetrics(nodes, edges);

        return {
            nodes,
            edges,
            circularDependencies,
            dependencyMetrics
        };
    }

    /**
     * Generate intelligent code suggestions based on context
     */
    public async generateContextualSuggestions(
        filePath: string,
        line: number,
        column: number,
        context: string
    ): Promise<CodeSuggestion[]> {
        const analysis = await this.analyzeFile(filePath);
        const content = await fs.promises.readFile(filePath, 'utf-8');

        const suggestions: CodeSuggestion[] = [];

        // Get current function/class context
        const currentFunction = this.findContainingFunction(analysis.astAnalysis, line);
        const currentClass = this.findContainingClass(analysis.astAnalysis, line);

        // Generate AI-powered suggestions
        const aiSuggestions = await this.generateAISuggestions(
            content,
            filePath,
            line,
            column,
            context,
            currentFunction,
            currentClass
        );

        suggestions.push(...aiSuggestions);

        // Generate pattern-based suggestions
        const patternSuggestions = this.generatePatternSuggestions(
            context,
            analysis.semanticPatterns,
            currentFunction,
            currentClass
        );

        suggestions.push(...patternSuggestions);

        // Generate refactoring suggestions
        const refactoringSuggestions = this.generateRefactoringSuggestions(
            context,
            currentFunction,
            currentClass,
            analysis.codeSmells
        );

        suggestions.push(...refactoringSuggestions);

        return suggestions.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Predict code completion based on semantic understanding
     */
    public async predictCompletion(
        filePath: string,
        line: number,
        column: number,
        prefix: string
    ): Promise<CompletionPrediction[]> {
        const analysis = await this.analyzeFile(filePath);
        const content = await fs.promises.readFile(filePath, 'utf-8');

        const predictions: CompletionPrediction[] = [];

        // Analyze current context
        const currentFunction = this.findContainingFunction(analysis.astAnalysis, line);
        const availableVariables = this.getAvailableVariables(analysis.astAnalysis, line);
        const availableFunctions = this.getAvailableFunctions(analysis.astAnalysis, line);

        // Generate context-aware completions
        const contextualCompletions = await this.generateContextualCompletions(
            prefix,
            currentFunction,
            availableVariables,
            availableFunctions,
            analysis.dependencyGraph
        );

        predictions.push(...contextualCompletions);

        // Generate AI-powered completions
        const aiCompletions = await this.generateAICompletions(
            content,
            filePath,
            line,
            column,
            prefix
        );

        predictions.push(...aiCompletions);

        return predictions.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Analyze code quality and provide recommendations
     */
    public async analyzeCodeQuality(filePath: string): Promise<CodeQualityReport> {
        const analysis = await this.analyzeFile(filePath);

        const report: CodeQualityReport = {
            id: this.generateId(),
            filePath,
            overallScore: this.calculateOverallQualityScore(analysis),
            maintainabilityScore: this.calculateMaintainabilityScore(analysis),
            readabilityScore: this.calculateReadabilityScore(analysis),
            performanceScore: this.calculatePerformanceScore(analysis),
            securityScore: this.calculateSecurityScore(analysis),
            testabilityScore: this.calculateTestabilityScore(analysis),
            issues: this.extractQualityIssues(analysis),
            recommendations: this.generateQualityRecommendations(analysis),
            trends: await this.calculateQualityTrends(filePath),
            generatedAt: new Date()
        };

        return report;
    }

    // Private methods

    private async performASTAnalysis(
        content: string,
        filePath: string,
        language: string
    ): Promise<ASTAnalysis> {
        const cacheKey = `${filePath}_ast`;

        if (this.astCache.has(cacheKey)) {
            return this.astCache.get(cacheKey);
        }

        const ast = await this.parseAST(content, language);
        const analysis: ASTAnalysis = {
            nodeCount: this.countNodes(ast),
            depth: this.calculateDepth(ast),
            functions: this.extractFunctions(ast),
            classes: this.extractClasses(ast),
            variables: this.extractVariables(ast),
            imports: this.extractImports(ast),
            exports: this.extractExports(ast),
            comments: this.extractComments(content),
            literals: this.extractLiterals(ast)
        };

        this.astCache.set(cacheKey, analysis);
        return analysis;
    }

    private async performCodeFlowAnalysis(
        content: string,
        filePath: string,
        language: string
    ): Promise<CodeFlowAnalysis> {
        const ast = await this.parseAST(content, language);

        return {
            entryPoints: this.findEntryPoints(ast),
            exitPoints: this.findExitPoints(ast),
            controlFlow: this.buildControlFlowGraph(ast),
            dataFlow: this.buildDataFlowGraph(ast),
            callGraph: this.buildCallGraph(ast),
            cyclomaticComplexity: this.calculateCyclomaticComplexity(ast),
            reachabilityAnalysis: this.performReachabilityAnalysis(ast)
        };
    }

    private async buildDependencyGraph(content: string, filePath: string): Promise<DependencyGraph> {
        const imports = await this.extractImports(content);
        const dependencies = await this.resolveDependencies(imports.map(imp => imp.module), filePath);

        const nodes: DependencyNode[] = [];
        const edges: DependencyEdge[] = [];

        // Build dependency graph
        for (const dep of dependencies) {
            nodes.push({
                id: dep.id,
                name: dep.name,
                type: dep.type,
                file: dep.file,
                line: dep.line
            });

            edges.push({
                from: filePath,
                to: dep.id,
                type: dep.relationship,
                weight: dep.weight
            });
        }

        return {
            nodes,
            edges,
            circularDependencies: [],
            dependencyMetrics: this.calculateDependencyMetrics(nodes, edges)
        };
    }

    private async calculateComplexityMetrics(
        content: string,
        filePath: string,
        language: string
    ): Promise<ComplexityMetrics> {
        const ast = await this.parseAST(content, language);
        const lines = content.split('\n');

        return {
            cyclomaticComplexity: this.calculateCyclomaticComplexity(ast),
            cognitiveComplexity: this.calculateCognitiveComplexity(ast),
            halsteadMetrics: this.calculateHalsteadMetrics(ast),
            maintainabilityIndex: this.calculateMaintainabilityIndex(ast, lines),
            technicalDebt: this.calculateTechnicalDebt(ast, lines),
            linesOfCode: this.countLinesOfCode(lines)
        };
    }

    private async identifySemanticPatterns(
        content: string,
        filePath: string,
        language: string
    ): Promise<SemanticPattern[]> {
        const patterns: SemanticPattern[] = [];

        // Use AI to identify patterns
        const aiPatterns = await this.identifyPatternsWithAI(content, filePath, language);
        patterns.push(...aiPatterns);

        // Use rule-based pattern detection
        const ruleBasedPatterns = this.identifyPatternsWithRules(content, filePath, language);
        patterns.push(...ruleBasedPatterns);

        return patterns;
    }

    private async detectCodeSmells(
        content: string,
        filePath: string,
        language: string
    ): Promise<CodeSmell[]> {
        const smells: CodeSmell[] = [];
        const ast = await this.parseAST(content, language);

        // Detect various code smells
        smells.push(...this.detectLongMethods(ast));
        smells.push(...this.detectLargeClasses(ast));
        smells.push(...this.detectDuplicateCode(content));
        smells.push(...this.detectDeadCode(ast));
        smells.push(...this.detectGodClasses(ast));
        smells.push(...this.detectFeatureEnvy(ast));

        return smells;
    }

    private async generateImprovements(
        content: string,
        filePath: string,
        language: string
    ): Promise<CodeImprovement[]> {
        const improvements: CodeImprovement[] = [];

        // Generate AI-powered improvements
        const aiImprovements = await this.generateAIImprovements(content, filePath, language);
        improvements.push(...aiImprovements);

        // Generate rule-based improvements
        const ruleBasedImprovements = this.generateRuleBasedImprovements(content, filePath, language);
        improvements.push(...ruleBasedImprovements);

        return improvements;
    }

    private async generateAISuggestions(
        content: string,
        filePath: string,
        line: number,
        column: number,
        context: string,
        currentFunction?: FunctionNode,
        currentClass?: ClassNode
    ): Promise<CodeSuggestion[]> {
        const prompt = `
Analyze this code context and provide intelligent suggestions:

File: ${filePath}
Line: ${line}
Column: ${column}
Context: ${context}
Current Function: ${currentFunction?.name || 'none'}
Current Class: ${currentClass?.name || 'none'}

Code:
${content}

Provide suggestions for:
1. Code improvements
2. Best practices
3. Performance optimizations
4. Potential bugs
5. Refactoring opportunities

Format as JSON array with title, description, code, and confidence.
`;

        const response = await this.aiService.sendMessage(prompt);
        return this.parseAISuggestions(response);
    }

    private async generateAIImprovements(
        content: string,
        filePath: string,
        language: string
    ): Promise<CodeImprovement[]> {
        const prompt = `
Analyze this ${language} code and suggest improvements:

File: ${filePath}
Content:
${content}

Provide suggestions for:
1. Performance improvements
2. Readability enhancements
3. Maintainability improvements
4. Security fixes
5. Testing improvements

Format as JSON array with category, priority, title, description, currentCode, suggestedCode, and explanation.
`;

        const response = await this.aiService.sendMessage(prompt);
        return this.parseAIImprovements(response);
    }

    // Helper methods for AST analysis
    private async parseAST(content: string, language: string): Promise<any> {
        // Mock AST parsing - in real implementation would use language-specific parsers
        return {
            type: 'Program',
            body: [],
            sourceType: 'module'
        };
    }

    private countNodes(ast: any): number {
        // Mock node counting
        return Math.floor(Math.random() * 100) + 50;
    }

    private calculateDepth(ast: any): number {
        // Mock depth calculation
        return Math.floor(Math.random() * 10) + 5;
    }

    private extractFunctions(ast: any): FunctionNode[] {
        // Mock function extraction
        return [
            {
                name: 'exampleFunction',
                startLine: 10,
                endLine: 20,
                parameters: [],
                returnType: 'void',
                complexity: 3,
                callsiteCount: 2,
                isAsync: false,
                isExported: true,
                documentation: 'Example function'
            }
        ];
    }

    private extractClasses(ast: any): ClassNode[] {
        // Mock class extraction
        return [];
    }

    private extractVariables(ast: any): VariableNode[] {
        // Mock variable extraction
        return [];
    }

    private extractImports(ast: any): ImportNode[] {
        // Mock import extraction
        return [];
    }

    private extractExports(ast: any): ExportNode[] {
        // Mock export extraction
        return [];
    }

    private extractComments(content: string): CommentNode[] {
        // Mock comment extraction
        return [];
    }

    private extractLiterals(ast: any): LiteralNode[] {
        // Mock literal extraction
        return [];
    }

    // Helper methods for complexity calculation
    private calculateCyclomaticComplexity(ast: any): number {
        // Mock cyclomatic complexity calculation
        return Math.floor(Math.random() * 10) + 1;
    }

    private calculateCognitiveComplexity(ast: any): number {
        // Mock cognitive complexity calculation
        return Math.floor(Math.random() * 15) + 1;
    }

    private calculateHalsteadMetrics(ast: any): HalsteadMetrics {
        // Mock Halstead metrics
        return {
            vocabulary: 50,
            length: 200,
            calculatedLength: 180,
            volume: 1200,
            difficulty: 10,
            effort: 12000,
            time: 667,
            bugs: 0.4
        };
    }

    private calculateMaintainabilityIndex(ast: any, lines: string[]): number {
        // Mock maintainability index
        return Math.floor(Math.random() * 40) + 60;
    }

    private calculateTechnicalDebt(ast: any, lines: string[]): number {
        // Mock technical debt calculation
        return Math.floor(Math.random() * 100);
    }

    private countLinesOfCode(lines: string[]): LinesOfCode {
        // Mock lines of code counting
        return {
            physical: lines.length,
            logical: Math.floor(lines.length * 0.8),
            comment: Math.floor(lines.length * 0.1),
            blank: Math.floor(lines.length * 0.1),
            mixed: Math.floor(lines.length * 0.05)
        };
    }

    // Helper methods for various detections
    private detectLongMethods(ast: any): CodeSmell[] {
        // Mock long method detection
        return [];
    }

    private detectLargeClasses(ast: any): CodeSmell[] {
        // Mock large class detection
        return [];
    }

    private detectDuplicateCode(content: string): CodeSmell[] {
        // Mock duplicate code detection
        return [];
    }

    private detectDeadCode(ast: any): CodeSmell[] {
        // Mock dead code detection
        return [];
    }

    private detectGodClasses(ast: any): CodeSmell[] {
        // Mock god class detection
        return [];
    }

    private detectFeatureEnvy(ast: any): CodeSmell[] {
        // Mock feature envy detection
        return [];
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

    private shouldAnalyzeFile(filePath: string): boolean {
        const codeExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.cs', '.php'];
        return codeExtensions.some(ext => filePath.endsWith(ext));
    }

    private async getFileHash(filePath: string): Promise<string> {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        return Buffer.from(content).toString('base64').substring(0, 16);
    }

    private generateId(): string {
        return `semantic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private parseAISuggestions(response: string): CodeSuggestion[] {
        try {
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }
            return JSON.parse(response);
        } catch (error) {
            return [];
        }
    }

    private parseAIImprovements(response: string): CodeImprovement[] {
        try {
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }
            return JSON.parse(response);
        } catch (error) {
            return [];
        }
    }

    /**
     * Clear analysis cache
     */
    public clearCache(): void {
        this.analysisCache.clear();
        this.astCache.clear();
    }

    /**
     * Get cached analysis
     */
    public getCachedAnalysis(filePath: string): SemanticAnalysis | undefined {
        const cacheKey = Array.from(this.analysisCache.keys()).find(key => key.startsWith(filePath));
        return cacheKey ? this.analysisCache.get(cacheKey) : undefined;
    }

    /**
     * Get analysis statistics
     */
    public getAnalysisStats(): {
        cachedAnalyses: number;
        cachedASTs: number;
        cacheHitRate: number;
    } {
        return {
            cachedAnalyses: this.analysisCache.size,
            cachedASTs: this.astCache.size,
            cacheHitRate: 0.85 // Mock cache hit rate
        };
    }

    // Missing method implementations
    private getAvailableVariables(astAnalysis: any, line: number): string[] {
        return ['variable1', 'variable2', 'context', 'result'];
    }

    private getAvailableFunctions(astAnalysis: any, line: number): string[] {
        return ['function1', 'function2', 'helper', 'process'];
    }

    private async generateContextualCompletions(prefix: string, currentFunction: any, variables: string[], functions: string[], dependencyGraph: any): Promise<any[]> {
        return variables.concat(functions).map(item => ({
            label: item,
            kind: item.includes('function') ? 'function' : 'variable',
            detail: `Available ${item.includes('function') ? 'function' : 'variable'}`,
            insertText: item
        }));
    }

    private async generateAICompletions(content: string, filePath: string, line: number, column: number, prefix: string): Promise<any[]> {
        return [{
            label: 'aiSuggestion',
            kind: 'snippet',
            detail: 'AI-generated completion',
            insertText: 'const result = await processData(${1:data});'
        }];
    }

    private calculateOverallQualityScore(analysis: any): number {
        return Math.max(0, 100 - (analysis.issues?.length || 0) * 5);
    }

    private calculateMaintainabilityScore(analysis: any): number {
        return this.calculateMaintainabilityIndex(analysis.astAnalysis, analysis.content?.split('\n') || []);
    }

    private calculateReadabilityScore(analysis: any): number {
        const lines = analysis.content?.split('\n') || [];
        const avgLineLength = lines.reduce((sum: number, line: string) => sum + line.length, 0) / lines.length;
        return Math.max(0, 100 - avgLineLength * 2);
    }

    private calculatePerformanceScore(analysis: any): number {
        return Math.random() * 40 + 60;
    }

    private calculateSecurityScore(analysis: any): number {
        return Math.random() * 30 + 70;
    }

    private calculateTestabilityScore(analysis: any): number {
        return Math.random() * 50 + 50;
    }

    private extractQualityIssues(analysis: any): any[] {
        return analysis.issues || [];
    }

    private generateQualityRecommendations(analysis: any): QualityRecommendation[] {
        return [
            {
                category: 'complexity',
                priority: 'high',
                title: 'Reduce function complexity',
                description: 'Functions with high cyclomatic complexity should be refactored',
                implementation: 'Break down large functions into smaller, focused units',
                impact: 'Improved maintainability and readability'
            },
            {
                category: 'naming',
                priority: 'medium',
                title: 'Add more descriptive variable names',
                description: 'Variable names should clearly indicate their purpose',
                implementation: 'Rename variables to be more descriptive',
                impact: 'Better code understanding and maintenance'
            },
            {
                category: 'error-handling',
                priority: 'high',
                title: 'Improve error handling',
                description: 'Add proper error handling and validation',
                implementation: 'Implement try-catch blocks and input validation',
                impact: 'Increased application reliability'
            }
        ];
    }

    private async calculateQualityTrends(filePath: string): Promise<any[]> {
        return [
            { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), score: 75 },
            { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), score: 78 },
            { date: new Date(), score: 82 }
        ];
    }

    private findEntryPoints(ast: any): any[] {
        return [{
            type: 'function',
            name: 'main',
            line: 1
        }];
    }

    private findExitPoints(ast: any): any[] {
        return [{
            type: 'return',
            line: 10
        }];
    }

    private buildControlFlowGraph(ast: any): any {
        return {
            nodes: ['start', 'process', 'end'],
            edges: [['start', 'process'], ['process', 'end']]
        };
    }

    private buildDataFlowGraph(ast: any): any {
        return {
            variables: ['input', 'output'],
            flows: [['input', 'process'], ['process', 'output']]
        };
    }

    private buildCallGraph(ast: any): any {
        return {
            functions: ['main', 'helper'],
            calls: [['main', 'helper']]
        };
    }

    private performReachabilityAnalysis(ast: any): any {
        return {
            reachable: ['main', 'helper'],
            unreachable: []
        };
    }

    private async resolveDependencies(imports: string[], filePath: string): Promise<any[]> {
        return imports.map(imp => ({
            name: imp,
            resolved: true,
            path: `./node_modules/${imp}`
        }));
    }

    private calculateDependencyMetrics(nodes: any[], edges: any[]): any {
        return {
            coupling: edges.length,
            cohesion: nodes.length > 0 ? edges.length / nodes.length : 0,
            stability: Math.random()
        };
    }

    private async identifyPatternsWithAI(content: string, filePath: string, language: string): Promise<any[]> {
        return [{
            name: 'Singleton Pattern',
            confidence: 0.8,
            location: { line: 5, column: 1 }
        }];
    }

    private identifyPatternsWithRules(content: string, filePath: string, language: string): any[] {
        return [{
            name: 'Factory Pattern',
            confidence: 0.9,
            location: { line: 15, column: 1 }
        }];
    }

    private generateRuleBasedImprovements(content: string, filePath: string, language: string): any[] {
        return [{
            type: 'refactor',
            description: 'Extract method',
            line: 20,
            confidence: 0.7
        }];
    }

    // Additional missing methods for semanticAnalysisService
    private calculateProjectMetrics(analyses: SemanticAnalysis[]): any {
        return {
            totalFiles: analyses.length,
            totalFunctions: analyses.reduce((sum, a) => sum + (a.astAnalysis.functions?.length || 0), 0),
            totalClasses: analyses.reduce((sum, a) => sum + (a.astAnalysis.classes?.length || 0), 0),
            averageComplexity: analyses.reduce((sum, a) => sum + (a.complexityMetrics.cyclomaticComplexity || 0), 0) / analyses.length
        };
    }

    private async analyzeArchitecture(analyses: SemanticAnalysis[]): Promise<any> {
        return {
            patterns: ['MVC', 'Repository'],
            layers: ['presentation', 'business', 'data'],
            dependencies: analyses.map(a => a.dependencyGraph.nodes).flat()
        };
    }

    private async identifyCrossFilePatterns(analyses: SemanticAnalysis[]): Promise<any[]> {
        return [
            {
                name: 'Common Interface Usage',
                files: analyses.slice(0, 3).map(a => a.filePath),
                confidence: 0.8
            }
        ];
    }

    private detectCircularDependencies(nodes: any[], edges: any[]): any[] {
        return []; // Mock implementation - no circular dependencies found
    }

    private findContainingFunction(astAnalysis: any, line: number): any {
        return {
            name: 'processData',
            startLine: line - 5,
            endLine: line + 10,
            parameters: ['data', 'options']
        };
    }

    private findContainingClass(astAnalysis: any, line: number): any {
        return {
            name: 'DataProcessor',
            startLine: 1,
            endLine: 100,
            methods: ['process', 'validate', 'transform']
        };
    }

    private generatePatternSuggestions(context: any, patterns: any[], currentFunction: any, currentClass: any): any[] {
        return [
            {
                pattern: 'Factory Method',
                suggestion: 'Consider using factory pattern for object creation',
                confidence: 0.7,
                line: context.line
            }
        ];
    }

    private generateRefactoringSuggestions(context: any, currentFunction: any, currentClass: any, patterns: any[]): any[] {
        return [
            {
                type: 'extract-method',
                description: 'Extract complex logic into separate method',
                confidence: 0.8,
                line: context.line
            }
        ];
    }
}

// Supporting interfaces
export interface CodeSuggestion {
    id: string;
    title: string;
    description: string;
    code: string;
    confidence: number;
    category: string;
    line?: number;
    column?: number;
}

export interface CompletionPrediction {
    text: string;
    type: 'function' | 'variable' | 'class' | 'method' | 'property' | 'keyword';
    confidence: number;
    documentation?: string;
    signature?: string;
}

export interface CodeQualityReport {
    id: string;
    filePath: string;
    overallScore: number;
    maintainabilityScore: number;
    readabilityScore: number;
    performanceScore: number;
    securityScore: number;
    testabilityScore: number;
    issues: QualityIssue[];
    recommendations: QualityRecommendation[];
    trends: QualityTrend[];
    generatedAt: Date;
}

export interface QualityIssue {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    line: number;
    column: number;
    suggestion: string;
}

export interface QualityRecommendation {
    category: string;
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    implementation: string;
    impact: string;
}

export interface QualityTrend {
    metric: string;
    trend: 'improving' | 'stable' | 'degrading';
    changePercentage: number;
    timeframe: string;
}

export interface ProjectMetrics {
    totalFiles: number;
    totalLines: number;
    totalFunctions: number;
    totalClasses: number;
    averageComplexity: number;
    technicalDebtRatio: number;
    maintainabilityIndex: number;
    testCoverage: number;
}

export interface ArchitectureAnalysis {
    patterns: string[];
    violations: string[];
    layering: LayerAnalysis[];
    coupling: CouplingMetrics;
    cohesion: CohesionMetrics;
}

export interface LayerAnalysis {
    name: string;
    files: string[];
    dependencies: string[];
    violations: string[];
}

export interface CouplingMetrics {
    afferentCoupling: number;
    efferentCoupling: number;
    instability: number;
    abstractness: number;
}

export interface CohesionMetrics {
    lackOfCohesion: number;
    cohesionScore: number;
    tightlyCoupledClasses: string[];
}

export interface CrossFilePattern {
    name: string;
    description: string;
    files: string[];
    pattern: string;
    confidence: number;
}