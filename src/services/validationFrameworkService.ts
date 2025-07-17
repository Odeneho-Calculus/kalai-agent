import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { RepoGrokkingService } from './repoGrokkingService';
import { AIService } from './aiService';

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
    confidence: number;
}

export interface ValidationError {
    type: 'syntax' | 'semantic' | 'reference' | 'performance' | 'security';
    message: string;
    file: string;
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
    fixable: boolean;
    suggestedFix?: string;
}

export interface ValidationWarning {
    type: 'style' | 'performance' | 'maintainability' | 'compatibility';
    message: string;
    file: string;
    line: number;
    column: number;
    suggestedFix?: string;
}

export interface ValidationSuggestion {
    type: 'optimization' | 'refactoring' | 'pattern' | 'documentation';
    message: string;
    file: string;
    line?: number;
    column?: number;
    priority: 'high' | 'medium' | 'low';
    implementation?: string;
}

export interface ValidationContext {
    files: string[];
    validationTypes: string[];
    strictMode: boolean;
    customRules: ValidationRule[];
}

export interface ValidationRule {
    id: string;
    name: string;
    description: string;
    type: 'syntax' | 'semantic' | 'style' | 'performance' | 'security';
    pattern?: RegExp;
    validator: (content: string, filePath: string) => Promise<ValidationError[]>;
    autoFix?: (content: string, error: ValidationError) => string;
}

export class ValidationFrameworkService {
    private repoGrokkingService: RepoGrokkingService;
    private aiService: AIService;
    private validationRules: Map<string, ValidationRule> = new Map();
    private validationCache: Map<string, ValidationResult> = new Map();

    constructor(repoGrokkingService: RepoGrokkingService, aiService: AIService) {
        this.repoGrokkingService = repoGrokkingService;
        this.aiService = aiService;
        this.initializeDefaultRules();
    }

    /**
     * Initialize default validation rules
     */
    private initializeDefaultRules(): void {
        const defaultRules: ValidationRule[] = [
            {
                id: 'syntax-check',
                name: 'Syntax Validation',
                description: 'Check for syntax errors in code',
                type: 'syntax',
                validator: this.validateSyntax.bind(this),
                autoFix: this.fixSyntaxErrors.bind(this)
            },
            {
                id: 'import-validation',
                name: 'Import/Export Validation',
                description: 'Validate import and export statements',
                type: 'semantic',
                validator: this.validateImports.bind(this),
                autoFix: this.fixImportIssues.bind(this)
            },
            {
                id: 'naming-conventions',
                name: 'Naming Convention Check',
                description: 'Check naming conventions consistency',
                type: 'style',
                validator: this.validateNamingConventions.bind(this)
            },
            {
                id: 'performance-check',
                name: 'Performance Analysis',
                description: 'Identify performance issues',
                type: 'performance',
                validator: this.validatePerformance.bind(this)
            },
            {
                id: 'security-check',
                name: 'Security Analysis',
                description: 'Check for security vulnerabilities',
                type: 'security',
                validator: this.validateSecurity.bind(this)
            }
        ];

        defaultRules.forEach(rule => this.validationRules.set(rule.id, rule));
    }

    /**
     * Validate code with comprehensive checks
     */
    public async validateCode(
        filePath: string,
        content?: string,
        context?: ValidationContext
    ): Promise<ValidationResult> {
        const cacheKey = `${filePath}_${content ? content.length : 'file'}`;

        // Check cache first
        if (this.validationCache.has(cacheKey)) {
            return this.validationCache.get(cacheKey)!;
        }

        const fileContent = content || await fs.promises.readFile(filePath, 'utf-8');
        const language = this.detectLanguage(filePath);

        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: [],
            confidence: 0.95
        };

        try {
            // Run validation rules
            const validationTypes = context?.validationTypes || ['syntax', 'semantic', 'style', 'performance', 'security'];

            for (const [ruleId, rule] of this.validationRules) {
                if (validationTypes.includes(rule.type)) {
                    const errors = await rule.validator(fileContent, filePath);
                    result.errors.push(...errors);
                }
            }

            // Run custom rules if provided
            if (context?.customRules) {
                for (const rule of context.customRules) {
                    const errors = await rule.validator(fileContent, filePath);
                    result.errors.push(...errors);
                }
            }

            // AI-powered validation
            const aiValidation = await this.performAIValidation(fileContent, filePath, language);
            result.warnings.push(...aiValidation.warnings);
            result.suggestions.push(...aiValidation.suggestions);

            // Cross-file validation
            const crossFileValidation = await this.performCrossFileValidation(filePath, fileContent);
            result.errors.push(...crossFileValidation.errors);
            result.warnings.push(...crossFileValidation.warnings);

            // Integration testing
            const integrationValidation = await this.performIntegrationValidation(filePath, fileContent);
            result.errors.push(...integrationValidation.errors);
            result.warnings.push(...integrationValidation.warnings);

            // Performance impact analysis
            const performanceAnalysis = await this.analyzePerformanceImpact(filePath, fileContent);
            result.suggestions.push(...performanceAnalysis.suggestions);

            // Set overall validity
            result.isValid = result.errors.filter(e => e.severity === 'error').length === 0;

            // Cache result
            this.validationCache.set(cacheKey, result);

            return result;

        } catch (error) {
            console.error('Validation failed:', error);
            result.isValid = false;
            result.errors.push({
                type: 'semantic',
                message: `Validation failed: ${error}`,
                file: filePath,
                line: 0,
                column: 0,
                severity: 'error',
                fixable: false
            });
            result.confidence = 0.5;

            return result;
        }
    }

    /**
     * Validate multiple files with dependency awareness
     */
    public async validateMultipleFiles(
        files: string[],
        context?: ValidationContext
    ): Promise<Map<string, ValidationResult>> {
        const results = new Map<string, ValidationResult>();

        // Sort files by dependency order
        const sortedFiles = await this.sortFilesByDependencies(files);

        // Validate each file
        for (const filePath of sortedFiles) {
            const result = await this.validateCode(filePath, undefined, context);
            results.set(filePath, result);
        }

        // Cross-file validation
        await this.validateFileDependencies(sortedFiles, results);

        return results;
    }

    /**
     * Auto-fix validation errors
     */
    public async autoFixErrors(
        filePath: string,
        errors: ValidationError[],
        options: { applyFixes: boolean; createBackup: boolean } = { applyFixes: true, createBackup: true }
    ): Promise<{ fixedErrors: ValidationError[]; appliedFixes: string[] }> {
        const fixedErrors: ValidationError[] = [];
        const appliedFixes: string[] = [];

        if (options.createBackup) {
            await this.createBackup(filePath);
        }

        let content = await fs.promises.readFile(filePath, 'utf-8');

        // Sort errors by line number (descending) to avoid offset issues
        const sortedErrors = errors
            .filter(error => error.fixable)
            .sort((a, b) => b.line - a.line);

        for (const error of sortedErrors) {
            const rule = this.validationRules.get(error.type);
            if (rule && rule.autoFix) {
                try {
                    const fixedContent = rule.autoFix(content, error);
                    if (fixedContent !== content) {
                        content = fixedContent;
                        fixedErrors.push(error);
                        appliedFixes.push(`Fixed ${error.type}: ${error.message}`);
                    }
                } catch (fixError) {
                    console.error(`Failed to fix error ${error.type}:`, fixError);
                }
            }
        }

        // Apply fixes if requested
        if (options.applyFixes && appliedFixes.length > 0) {
            await fs.promises.writeFile(filePath, content, 'utf-8');

            // Update repository index
            await this.repoGrokkingService.updateIndex([filePath]);
        }

        return { fixedErrors, appliedFixes };
    }

    /**
     * Validate syntax
     */
    private async validateSyntax(content: string, filePath: string): Promise<ValidationError[]> {
        const errors: ValidationError[] = [];
        const language = this.detectLanguage(filePath);

        try {
            await this.parseAST(content, language);
        } catch (error: any) {
            errors.push({
                type: 'syntax',
                message: `Syntax error: ${error.message}`,
                file: filePath,
                line: error.line || 0,
                column: error.column || 0,
                severity: 'error',
                fixable: false
            });
        }

        return errors;
    }

    /**
     * Validate imports and exports
     */
    private async validateImports(content: string, filePath: string): Promise<ValidationError[]> {
        const errors: ValidationError[] = [];
        const imports = await this.extractImports(content);

        for (const importInfo of imports) {
            const resolvedPath = await this.resolveImportPath(importInfo.path, filePath);

            if (!resolvedPath || !fs.existsSync(resolvedPath)) {
                errors.push({
                    type: 'reference',
                    message: `Cannot resolve import: ${importInfo.path}`,
                    file: filePath,
                    line: importInfo.line,
                    column: importInfo.column,
                    severity: 'error',
                    fixable: true,
                    suggestedFix: await this.suggestImportFix(importInfo.path, filePath)
                });
            }
        }

        return errors;
    }

    /**
     * Validate naming conventions
     */
    private async validateNamingConventions(content: string, filePath: string): Promise<ValidationError[]> {
        const errors: ValidationError[] = [];
        const projectPatterns = await this.repoGrokkingService.getProjectPatterns();

        // Check function naming
        const functionRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        let match;

        while ((match = functionRegex.exec(content)) !== null) {
            const functionName = match[1];
            if (!this.followsNamingConvention(functionName, 'function', projectPatterns)) {
                errors.push({
                    type: 'semantic',
                    message: `Function name '${functionName}' doesn't follow project naming convention`,
                    file: filePath,
                    line: this.getLineNumber(content, match.index),
                    column: match.index,
                    severity: 'warning',
                    fixable: true
                });
            }
        }

        return errors;
    }

    /**
     * Validate performance
     */
    private async validatePerformance(content: string, filePath: string): Promise<ValidationError[]> {
        const errors: ValidationError[] = [];

        // Check for performance anti-patterns
        const performanceIssues = [
            {
                pattern: /for\s*\(\s*var\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*[^;]+\.length\s*;\s*\w+\+\+\s*\)/g,
                message: 'Consider caching array length in for loop',
                type: 'performance' as const
            },
            {
                pattern: /document\.getElementById\([^)]+\)/g,
                message: 'Consider caching DOM queries',
                type: 'performance' as const
            }
        ];

        for (const issue of performanceIssues) {
            let match;
            while ((match = issue.pattern.exec(content)) !== null) {
                errors.push({
                    type: issue.type,
                    message: issue.message,
                    file: filePath,
                    line: this.getLineNumber(content, match.index),
                    column: match.index,
                    severity: 'warning',
                    fixable: false
                });
            }
        }

        return errors;
    }

    /**
     * Validate security
     */
    private async validateSecurity(content: string, filePath: string): Promise<ValidationError[]> {
        const errors: ValidationError[] = [];

        // Check for security vulnerabilities
        const securityIssues = [
            {
                pattern: /eval\s*\(/g,
                message: 'Use of eval() is dangerous and should be avoided',
                severity: 'error' as const
            },
            {
                pattern: /innerHTML\s*=\s*[^;]+/g,
                message: 'Direct innerHTML assignment may lead to XSS vulnerabilities',
                severity: 'warning' as const
            },
            {
                pattern: /document\.write\s*\(/g,
                message: 'document.write() should be avoided for security reasons',
                severity: 'warning' as const
            }
        ];

        for (const issue of securityIssues) {
            let match;
            while ((match = issue.pattern.exec(content)) !== null) {
                errors.push({
                    type: 'security',
                    message: issue.message,
                    file: filePath,
                    line: this.getLineNumber(content, match.index),
                    column: match.index,
                    severity: issue.severity,
                    fixable: false
                });
            }
        }

        return errors;
    }

    /**
     * Perform AI-powered validation
     */
    private async performAIValidation(
        content: string,
        filePath: string,
        language: string
    ): Promise<{ warnings: ValidationWarning[]; suggestions: ValidationSuggestion[] }> {
        const prompt = `
Analyze the following ${language} code for potential issues and improvements:

File: ${filePath}
Content:
${content}

Please provide:
1. Code quality warnings
2. Improvement suggestions
3. Best practice recommendations
4. Potential bugs or issues

Focus on:
- Code maintainability
- Performance optimizations
- Security considerations
- Best practices for ${language}

Format your response as JSON with warnings and suggestions arrays.
`;

        try {
            const response = await this.aiService.sendMessage(prompt);
            const analysis = this.parseAIResponse(response);

            return {
                warnings: analysis.warnings || [],
                suggestions: analysis.suggestions || []
            };
        } catch (error) {
            console.error('AI validation failed:', error);
            return { warnings: [], suggestions: [] };
        }
    }

    /**
     * Perform cross-file validation
     */
    private async performCrossFileValidation(
        filePath: string,
        content: string
    ): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        // Check for unused imports
        const imports = await this.extractImports(content);
        const usedImports = await this.findUsedImports(content, imports);

        for (const importInfo of imports) {
            if (!usedImports.includes(importInfo.name)) {
                warnings.push({
                    type: 'maintainability',
                    message: `Unused import: ${importInfo.name}`,
                    file: filePath,
                    line: importInfo.line,
                    column: importInfo.column,
                    suggestedFix: 'Remove unused import'
                });
            }
        }

        // Check for circular dependencies
        const dependencies = await this.repoGrokkingService.getFileDependencies(filePath);
        const circularDeps = await this.detectCircularDependencies(filePath, dependencies);

        if (circularDeps.length > 0) {
            errors.push({
                type: 'semantic',
                message: `Circular dependency detected: ${circularDeps.join(' -> ')}`,
                file: filePath,
                line: 0,
                column: 0,
                severity: 'error',
                fixable: false
            });
        }

        return { errors, warnings };
    }

    /**
     * Perform integration validation
     */
    private async performIntegrationValidation(
        filePath: string,
        content: string
    ): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        // Check API compatibility
        const apiCalls = await this.extractAPICalls(content);

        for (const apiCall of apiCalls) {
            const compatibility = await this.checkAPICompatibility(apiCall);
            if (!compatibility.isCompatible) {
                warnings.push({
                    type: 'compatibility',
                    message: `API compatibility issue: ${compatibility.message}`,
                    file: filePath,
                    line: apiCall.line,
                    column: apiCall.column,
                    suggestedFix: compatibility.suggestedFix
                });
            }
        }

        return { errors, warnings };
    }

    /**
     * Analyze performance impact
     */
    private async analyzePerformanceImpact(
        filePath: string,
        content: string
    ): Promise<{ suggestions: ValidationSuggestion[] }> {
        const suggestions: ValidationSuggestion[] = [];

        // Analyze complexity
        const complexity = await this.calculateComplexity(content);
        if (complexity > 10) {
            suggestions.push({
                type: 'refactoring',
                message: `High complexity detected (${complexity}). Consider refactoring.`,
                file: filePath,
                priority: 'high',
                implementation: 'Break down into smaller functions'
            });
        }

        // Check for optimization opportunities
        const optimizations = await this.findOptimizationOpportunities(content);
        suggestions.push(...optimizations);

        return { suggestions };
    }

    /**
     * Fix syntax errors
     */
    private fixSyntaxErrors(content: string, error: ValidationError): string {
        // Basic syntax error fixes
        if (error.message.includes('missing semicolon')) {
            const lines = content.split('\n');
            if (lines[error.line - 1] && !lines[error.line - 1].trim().endsWith(';')) {
                lines[error.line - 1] += ';';
                return lines.join('\n');
            }
        }

        return content;
    }

    /**
     * Fix import issues
     */
    private fixImportIssues(content: string, error: ValidationError): string {
        if (error.suggestedFix) {
            // Apply suggested fix
            const lines = content.split('\n');
            lines[error.line - 1] = error.suggestedFix;
            return lines.join('\n');
        }

        return content;
    }

    // Helper methods
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

    private async parseAST(content: string, language: string): Promise<any> {
        // Mock AST parsing - would use actual parsers
        if (content.includes('syntax error')) {
            throw new Error('Syntax error detected');
        }
        return { type: 'Program', body: [] };
    }

    private async extractImports(content: string): Promise<any[]> {
        const imports: any[] = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            const importMatch = line.match(/import\s+(.+?)\s+from\s+['"]([^'"]+)['"]/);
            if (importMatch) {
                imports.push({
                    name: importMatch[1],
                    path: importMatch[2],
                    line: index + 1,
                    column: line.indexOf('import')
                });
            }
        });

        return imports;
    }

    private async resolveImportPath(importPath: string, fromFile: string): Promise<string | null> {
        // Mock import resolution
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
            return path.resolve(path.dirname(fromFile), importPath);
        }

        // Check if it's a node module
        if (!importPath.startsWith('.')) {
            return importPath; // Assume it's a valid module
        }

        return null;
    }

    private async suggestImportFix(importPath: string, fromFile: string): Promise<string> {
        // Mock import fix suggestion
        return `// Fix: Check if path '${importPath}' is correct`;
    }

    private followsNamingConvention(name: string, type: string, patterns: any): boolean {
        // Mock naming convention check
        if (type === 'function') {
            return /^[a-z][a-zA-Z0-9]*$/.test(name);
        }
        return true;
    }

    private getLineNumber(content: string, index: number): number {
        return content.substring(0, index).split('\n').length;
    }

    private parseAIResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }
            return JSON.parse(response);
        } catch (error) {
            return { warnings: [], suggestions: [] };
        }
    }

    private async findUsedImports(content: string, imports: any[]): Promise<string[]> {
        const usedImports: string[] = [];

        for (const importInfo of imports) {
            if (content.includes(importInfo.name.split(',')[0].trim())) {
                usedImports.push(importInfo.name);
            }
        }

        return usedImports;
    }

    private async sortFilesByDependencies(files: string[]): Promise<string[]> {
        // Mock dependency sorting
        return files;
    }

    private async validateFileDependencies(
        files: string[],
        results: Map<string, ValidationResult>
    ): Promise<void> {
        // Mock cross-file validation
    }

    private async detectCircularDependencies(filePath: string, dependencies: string[]): Promise<string[]> {
        // Mock circular dependency detection
        return [];
    }

    private async extractAPICalls(content: string): Promise<any[]> {
        // Mock API call extraction
        return [];
    }

    private async checkAPICompatibility(apiCall: any): Promise<any> {
        // Mock API compatibility check
        return { isCompatible: true, message: '', suggestedFix: '' };
    }

    private async calculateComplexity(content: string): Promise<number> {
        // Mock complexity calculation
        const lines = content.split('\n').length;
        return Math.floor(lines / 10);
    }

    private async findOptimizationOpportunities(content: string): Promise<ValidationSuggestion[]> {
        // Mock optimization suggestions
        return [];
    }

    private async createBackup(filePath: string): Promise<void> {
        const backupPath = `${filePath}.backup`;
        await fs.promises.copyFile(filePath, backupPath);
    }

    /**
     * Add custom validation rule
     */
    public addValidationRule(rule: ValidationRule): void {
        this.validationRules.set(rule.id, rule);
    }

    /**
     * Remove validation rule
     */
    public removeValidationRule(ruleId: string): void {
        this.validationRules.delete(ruleId);
    }

    /**
     * Get all validation rules
     */
    public getValidationRules(): ValidationRule[] {
        return Array.from(this.validationRules.values());
    }

    /**
     * Clear validation cache
     */
    public clearCache(): void {
        this.validationCache.clear();
    }
}