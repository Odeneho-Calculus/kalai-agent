import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { RepositoryAnalysisService } from './repositoryAnalysisService';
import { AIService } from './aiService';

export interface Plugin {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    homepage?: string;
    repository?: string;
    license: string;
    keywords: string[];
    category: PluginCategory;
    capabilities: PluginCapability[];
    dependencies: PluginDependency[];
    configuration: PluginConfiguration;
    lifecycle: PluginLifecycle;
    permissions: PluginPermission[];
    metadata: PluginMetadata;
    status: PluginStatus;
}

export interface PluginCategory {
    primary: 'analysis' | 'generation' | 'refactoring' | 'testing' | 'documentation' | 'collaboration' | 'workflow' | 'integration';
    secondary: string[];
    tags: string[];
}

export interface PluginCapability {
    type: 'command' | 'provider' | 'decorator' | 'analyzer' | 'transformer' | 'generator' | 'validator';
    name: string;
    description: string;
    inputs: CapabilityInput[];
    outputs: CapabilityOutput[];
    configuration: any;
    requirements: CapabilityRequirement[];
}

export interface CapabilityInput {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file' | 'directory' | 'selection' | 'context';
    description: string;
    required: boolean;
    default?: any;
    validation?: InputValidation;
}

export interface InputValidation {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
    custom?: string; // JavaScript function as string
}

export interface CapabilityOutput {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file' | 'notification' | 'ui';
    description: string;
    format?: string;
    schema?: any;
}

export interface CapabilityRequirement {
    type: 'vscode-version' | 'extension' | 'runtime' | 'system' | 'permission';
    value: string;
    optional: boolean;
}

export interface PluginDependency {
    id: string;
    version: string;
    optional: boolean;
    reason: string;
}

export interface PluginConfiguration {
    schema: ConfigurationSchema;
    defaults: any;
    userOverrides: any;
    environmentOverrides: any;
}

export interface ConfigurationSchema {
    type: 'object';
    properties: { [key: string]: ConfigurationProperty };
    required: string[];
    additionalProperties: boolean;
}

export interface ConfigurationProperty {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    default?: any;
    enum?: any[];
    pattern?: string;
    minimum?: number;
    maximum?: number;
    items?: ConfigurationProperty;
    properties?: { [key: string]: ConfigurationProperty };
}

export interface PluginLifecycle {
    activation: ActivationCondition[];
    deactivation: DeactivationCondition[];
    hooks: LifecycleHook[];
}

export interface ActivationCondition {
    type: 'startup' | 'workspace' | 'file-type' | 'command' | 'event' | 'dependency';
    value: string;
    priority: number;
}

export interface DeactivationCondition {
    type: 'shutdown' | 'workspace-close' | 'timeout' | 'error' | 'dependency';
    value: string;
    cleanup: boolean;
}

export interface LifecycleHook {
    event: 'pre-activate' | 'post-activate' | 'pre-deactivate' | 'post-deactivate' | 'config-change' | 'update';
    handler: string; // Function name
    priority: number;
    async: boolean;
}

export interface PluginPermission {
    type: 'file-read' | 'file-write' | 'network' | 'system' | 'vscode-api' | 'user-data' | 'workspace';
    scope: string;
    justification: string;
    required: boolean;
}

export interface PluginMetadata {
    installDate: Date;
    lastUpdateDate: Date;
    usageCount: number;
    errorCount: number;
    performanceMetrics: PluginPerformanceMetrics;
    userRating: number;
    userFeedback: PluginFeedback[];
    tags: string[];
}

export interface PluginPerformanceMetrics {
    averageExecutionTime: number;
    memoryUsage: number;
    cpuUsage: number;
    successRate: number;
    lastMeasurement: Date;
}

export interface PluginFeedback {
    rating: number;
    comment: string;
    timestamp: Date;
    version: string;
}

export interface PluginStatus {
    state: 'inactive' | 'active' | 'error' | 'disabled' | 'updating';
    health: 'healthy' | 'warning' | 'error' | 'unknown';
    lastError?: PluginError;
    diagnostics: PluginDiagnostic[];
}

export interface PluginError {
    code: string;
    message: string;
    stack?: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PluginDiagnostic {
    type: 'info' | 'warning' | 'error';
    message: string;
    source: string;
    timestamp: Date;
    details?: any;
}

export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    license: string;
    main: string;
    capabilities: PluginCapability[];
    dependencies: PluginDependency[];
    configuration: ConfigurationSchema;
    lifecycle: PluginLifecycle;
    permissions: PluginPermission[];
}

export interface PluginContext {
    plugin: Plugin;
    vscode: typeof vscode;
    kalai: KalaiAPI;
    configuration: any;
    workspace: WorkspaceContext;
    logger: PluginLogger;
    storage: PluginStorage;
}

export interface KalaiAPI {
    repo: RepositoryAnalysisService;
    ai: AIService;
    analysis: any;
    utils: KalaiUtils;
}

export interface KalaiUtils {
    file: FileUtils;
    ast: ASTUtils;
    git: GitUtils;
    project: ProjectUtils;
}

export interface FileUtils {
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    exists(path: string): Promise<boolean>;
    listFiles(directory: string, pattern?: string): Promise<string[]>;
    getFileInfo(path: string): Promise<FileInfo>;
    detectLanguage(extension: string): string;
}

export interface FileInfo {
    size: number;
    modified: Date;
    created: Date;
    type: 'file' | 'directory' | 'symlink';
    permissions: string;
    extension: string;
    language: string;
}

export interface ASTUtils {
    parse(code: string, language: string): Promise<any>;
    analyze(ast: any): Promise<any>;
    transform(ast: any, transformations: any[]): Promise<any>;
    generate(ast: any, language: string): Promise<string>;
}

export interface GitUtils {
    getCurrentBranch(): Promise<string>;
    getCommitHistory(limit?: number): Promise<GitCommit[]>;
    getChangedFiles(): Promise<string[]>;
    getDiff(file: string): Promise<string>;
    getBlame(file: string): Promise<GitBlame[]>;
}

export interface GitCommit {
    hash: string;
    message: string;
    author: string;
    date: Date;
    files: string[];
}

export interface GitBlame {
    line: number;
    commit: string;
    author: string;
    date: Date;
    content: string;
}

export interface ProjectUtils {
    getProjectType(): Promise<string>;
    getProjectStructure(): Promise<ProjectStructure>;
    getProjectMetrics(): Promise<ProjectMetrics>;
    findFiles(pattern: string): Promise<string[]>;
}

export interface ProjectStructure {
    type: string;
    framework: string;
    language: string;
    directories: DirectoryNode[];
    dependencies: any;
    configuration: any;
}

export interface DirectoryNode {
    name: string;
    path: string;
    type: 'directory' | 'file';
    children?: DirectoryNode[];
    size?: number;
    modified?: Date;
}

export interface ProjectMetrics {
    linesOfCode: number;
    fileCount: number;
    complexity: number;
    maintainability: number;
    testCoverage: number;
}

export interface WorkspaceContext {
    rootPath: string;
    activeFile?: string;
    selectedText?: string;
    openFiles: string[];
    gitRepository?: string;
}

export interface PluginLogger {
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    trace(message: string, ...args: any[]): void;
}

export interface PluginStorage {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
}

export interface PluginRegistry {
    plugins: Map<string, Plugin>;
    manifests: Map<string, PluginManifest>;
    contexts: Map<string, PluginContext>;
    capabilities: Map<string, PluginCapability>;
}

export interface PluginExecutionResult {
    success: boolean;
    output?: any;
    error?: PluginError;
    metrics: ExecutionMetrics;
}

export interface ExecutionMetrics {
    startTime: Date;
    endTime: Date;
    executionTime: number;
    memoryUsage: number;
    cpuUsage: number;
}

export interface PluginDiscovery {
    sources: DiscoverySource[];
    cache: DiscoveryCache;
    filters: DiscoveryFilter[];
}

export interface DiscoverySource {
    type: 'local' | 'remote' | 'marketplace' | 'git';
    url: string;
    credentials?: any;
    priority: number;
}

export interface DiscoveryCache {
    plugins: Map<string, PluginManifest>;
    lastUpdated: Date;
    ttl: number;
}

export interface DiscoveryFilter {
    type: 'category' | 'author' | 'version' | 'rating' | 'compatibility';
    value: any;
    operator: 'equals' | 'contains' | 'greater' | 'less' | 'matches';
}

export class PluginService {
    private registry: PluginRegistry;
    private discovery: PluginDiscovery;
    private repositoryAnalysisService: RepositoryAnalysisService;
    private aiService: AIService;
    private pluginDirectory: string;
    private isInitialized: boolean = false;

    constructor(
        repositoryAnalysisService: RepositoryAnalysisService,
        aiService: AIService,
        context: vscode.ExtensionContext
    ) {
        this.repositoryAnalysisService = repositoryAnalysisService;
        this.aiService = aiService;
        this.pluginDirectory = path.join(context.extensionPath, 'plugins');

        this.registry = {
            plugins: new Map(),
            manifests: new Map(),
            contexts: new Map(),
            capabilities: new Map()
        };

        this.discovery = {
            sources: [
                {
                    type: 'local',
                    url: this.pluginDirectory,
                    priority: 1
                },
                {
                    type: 'remote',
                    url: 'https://kalai-plugins.example.com',
                    priority: 2
                }
            ],
            cache: {
                plugins: new Map(),
                lastUpdated: new Date(),
                ttl: 3600000 // 1 hour
            },
            filters: []
        };

        this.initializePluginSystem();
    }

    /**
     * Initialize plugin system
     */
    private async initializePluginSystem(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Create plugin directory if it doesn't exist
            if (!fs.existsSync(this.pluginDirectory)) {
                fs.mkdirSync(this.pluginDirectory, { recursive: true });
            }

            // Discover and load plugins
            await this.discoverPlugins();
            await this.loadPlugins();

            // Register default plugins
            await this.registerDefaultPlugins();

            this.isInitialized = true;
            console.log('Plugin system initialized successfully');
        } catch (error) {
            console.error('Failed to initialize plugin system:', error);
        }
    }

    /**
     * Discover available plugins
     */
    private async discoverPlugins(): Promise<void> {
        for (const source of this.discovery.sources) {
            try {
                switch (source.type) {
                    case 'local':
                        await this.discoverLocalPlugins(source.url);
                        break;
                    case 'remote':
                        await this.discoverRemotePlugins(source.url);
                        break;
                    case 'marketplace':
                        await this.discoverMarketplacePlugins(source.url);
                        break;
                    case 'git':
                        await this.discoverGitPlugins(source.url);
                        break;
                }
            } catch (error) {
                console.error(`Failed to discover plugins from ${source.url}:`, error);
            }
        }
    }

    /**
     * Discover local plugins
     */
    private async discoverLocalPlugins(directory: string): Promise<void> {
        if (!fs.existsSync(directory)) return;

        const entries = fs.readdirSync(directory);
        for (const entry of entries) {
            const entryPath = path.join(directory, entry);
            const stat = fs.statSync(entryPath);

            if (stat.isDirectory()) {
                const manifestPath = path.join(entryPath, 'plugin.json');
                if (fs.existsSync(manifestPath)) {
                    try {
                        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
                        const manifest: PluginManifest = JSON.parse(manifestContent);
                        this.registry.manifests.set(manifest.id, manifest);
                    } catch (error) {
                        console.error(`Failed to parse manifest for ${entry}:`, error);
                    }
                }
            }
        }
    }

    /**
     * Discover remote plugins
     */
    private async discoverRemotePlugins(url: string): Promise<void> {
        // Implementation for remote plugin discovery
        // This would fetch plugin listings from remote repositories
        console.log(`Discovering remote plugins from ${url}`);
    }

    /**
     * Discover marketplace plugins
     */
    private async discoverMarketplacePlugins(url: string): Promise<void> {
        // Implementation for marketplace plugin discovery
        console.log(`Discovering marketplace plugins from ${url}`);
    }

    /**
     * Discover Git plugins
     */
    private async discoverGitPlugins(url: string): Promise<void> {
        // Implementation for Git repository plugin discovery
        console.log(`Discovering Git plugins from ${url}`);
    }

    /**
     * Load all discovered plugins
     */
    private async loadPlugins(): Promise<void> {
        for (const [id, manifest] of this.registry.manifests) {
            try {
                await this.loadPlugin(id, manifest);
            } catch (error) {
                console.error(`Failed to load plugin ${id}:`, error);
            }
        }
    }

    /**
     * Load a specific plugin
     */
    private async loadPlugin(id: string, manifest: PluginManifest): Promise<void> {
        const plugin: Plugin = {
            id,
            name: manifest.name,
            version: manifest.version,
            description: manifest.description,
            author: manifest.author,
            license: manifest.license,
            keywords: [],
            category: {
                primary: 'analysis',
                secondary: [],
                tags: []
            },
            capabilities: manifest.capabilities,
            dependencies: manifest.dependencies,
            configuration: {
                schema: manifest.configuration,
                defaults: {},
                userOverrides: {},
                environmentOverrides: {}
            },
            lifecycle: manifest.lifecycle,
            permissions: manifest.permissions,
            metadata: {
                installDate: new Date(),
                lastUpdateDate: new Date(),
                usageCount: 0,
                errorCount: 0,
                performanceMetrics: {
                    averageExecutionTime: 0,
                    memoryUsage: 0,
                    cpuUsage: 0,
                    successRate: 1,
                    lastMeasurement: new Date()
                },
                userRating: 0,
                userFeedback: [],
                tags: []
            },
            status: {
                state: 'inactive',
                health: 'unknown',
                diagnostics: []
            }
        };

        // Create plugin context
        const context = await this.createPluginContext(plugin);

        // Register plugin
        this.registry.plugins.set(id, plugin);
        this.registry.contexts.set(id, context);

        // Register capabilities
        for (const capability of manifest.capabilities) {
            this.registry.capabilities.set(`${id}.${capability.name}`, capability);
        }

        // Activate plugin if needed
        if (this.shouldActivatePlugin(plugin)) {
            await this.activatePlugin(id);
        }
    }

    /**
     * Create plugin context
     */
    private async createPluginContext(plugin: Plugin): Promise<PluginContext> {
        const context: PluginContext = {
            plugin,
            vscode,
            kalai: {
                repo: this.repositoryAnalysisService,
                ai: this.aiService,
                analysis: null,
                utils: {
                    file: this.createFileUtils(),
                    ast: this.createASTUtils(),
                    git: this.createGitUtils(),
                    project: this.createProjectUtils()
                }
            },
            configuration: plugin.configuration.defaults,
            workspace: {
                rootPath: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
                activeFile: vscode.window.activeTextEditor?.document.uri.fsPath,
                selectedText: vscode.window.activeTextEditor?.document.getText(vscode.window.activeTextEditor.selection),
                openFiles: vscode.workspace.textDocuments.map(doc => doc.uri.fsPath),
                gitRepository: undefined
            },
            logger: this.createPluginLogger(plugin.id),
            storage: this.createPluginStorage(plugin.id)
        };

        return context;
    }

    /**
     * Create file utils
     */
    private createFileUtils(): FileUtils {
        return {
            async readFile(filePath: string): Promise<string> {
                return fs.promises.readFile(filePath, 'utf8');
            },
            async writeFile(filePath: string, content: string): Promise<void> {
                return fs.promises.writeFile(filePath, content, 'utf8');
            },
            async exists(filePath: string): Promise<boolean> {
                try {
                    await fs.promises.access(filePath);
                    return true;
                } catch {
                    return false;
                }
            },
            async listFiles(directory: string, pattern?: string): Promise<string[]> {
                const files = await fs.promises.readdir(directory);
                if (pattern) {
                    const regex = new RegExp(pattern);
                    return files.filter(file => regex.test(file));
                }
                return files;
            },
            async getFileInfo(filePath: string): Promise<FileInfo> {
                const stats = await fs.promises.stat(filePath);
                const ext = path.extname(filePath);
                return {
                    size: stats.size,
                    modified: stats.mtime,
                    created: stats.ctime,
                    type: stats.isFile() ? 'file' : stats.isDirectory() ? 'directory' : 'symlink',
                    permissions: stats.mode.toString(8),
                    extension: ext,
                    language: this.detectLanguage(ext)
                };
            },
            detectLanguage: (extension: string): string => {
                return this.detectLanguage(extension);
            }
        };
    }

    /**
     * Detect programming language from file extension
     */
    private detectLanguage(extension: string): string {
        const languageMap: Record<string, string> = {
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
            '.vue': 'vue',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.sass': 'sass',
            '.json': 'json',
            '.xml': 'xml',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.md': 'markdown',
            '.sh': 'bash',
            '.sql': 'sql'
        };

        return languageMap[extension.toLowerCase()] || 'text';
    }

    /**
     * Create AST utils
     */
    private createASTUtils(): ASTUtils {
        return {
            async parse(code: string, language: string): Promise<any> {
                // Implementation would use appropriate parser for language
                return { type: 'Program', body: [] };
            },
            async analyze(ast: any): Promise<any> {
                // Implementation would analyze AST
                return { complexity: 1, functions: [], classes: [] };
            },
            async transform(ast: any, transformations: any[]): Promise<any> {
                // Implementation would apply transformations
                return ast;
            },
            async generate(ast: any, language: string): Promise<string> {
                // Implementation would generate code from AST
                return '';
            }
        };
    }

    /**
     * Create Git utils
     */
    private createGitUtils(): GitUtils {
        return {
            async getCurrentBranch(): Promise<string> {
                return 'main';
            },
            async getCommitHistory(limit?: number): Promise<GitCommit[]> {
                return [];
            },
            async getChangedFiles(): Promise<string[]> {
                return [];
            },
            async getDiff(file: string): Promise<string> {
                return '';
            },
            async getBlame(file: string): Promise<GitBlame[]> {
                return [];
            }
        };
    }

    /**
     * Create project utils
     */
    private createProjectUtils(): ProjectUtils {
        return {
            async getProjectType(): Promise<string> {
                return 'node';
            },
            async getProjectStructure(): Promise<ProjectStructure> {
                return {
                    type: 'node',
                    framework: 'express',
                    language: 'typescript',
                    directories: [],
                    dependencies: {},
                    configuration: {}
                };
            },
            async getProjectMetrics(): Promise<ProjectMetrics> {
                return {
                    linesOfCode: 1000,
                    fileCount: 50,
                    complexity: 5,
                    maintainability: 0.8,
                    testCoverage: 0.7
                };
            },
            async findFiles(pattern: string): Promise<string[]> {
                return [];
            }
        };
    }

    /**
     * Create plugin logger
     */
    private createPluginLogger(pluginId: string): PluginLogger {
        return {
            debug: (message: string, ...args: any[]) => console.debug(`[${pluginId}] ${message}`, ...args),
            info: (message: string, ...args: any[]) => console.info(`[${pluginId}] ${message}`, ...args),
            warn: (message: string, ...args: any[]) => console.warn(`[${pluginId}] ${message}`, ...args),
            error: (message: string, ...args: any[]) => console.error(`[${pluginId}] ${message}`, ...args),
            trace: (message: string, ...args: any[]) => console.trace(`[${pluginId}] ${message}`, ...args)
        };
    }

    /**
     * Create plugin storage
     */
    private createPluginStorage(pluginId: string): PluginStorage {
        const storage = new Map<string, any>();

        return {
            async get(key: string): Promise<any> {
                return storage.get(`${pluginId}.${key}`);
            },
            async set(key: string, value: any): Promise<void> {
                storage.set(`${pluginId}.${key}`, value);
            },
            async delete(key: string): Promise<void> {
                storage.delete(`${pluginId}.${key}`);
            },
            async clear(): Promise<void> {
                for (const key of storage.keys()) {
                    if (key.startsWith(`${pluginId}.`)) {
                        storage.delete(key);
                    }
                }
            },
            async keys(): Promise<string[]> {
                return Array.from(storage.keys())
                    .filter(key => key.startsWith(`${pluginId}.`))
                    .map(key => key.substring(pluginId.length + 1));
            }
        };
    }

    /**
     * Check if plugin should be activated
     */
    private shouldActivatePlugin(plugin: Plugin): boolean {
        return plugin.lifecycle.activation.some(condition => {
            switch (condition.type) {
                case 'startup':
                    return true;
                case 'workspace':
                    return !!vscode.workspace.workspaceFolders;
                default:
                    return false;
            }
        });
    }

    /**
     * Activate plugin
     */
    public async activatePlugin(pluginId: string): Promise<void> {
        const plugin = this.registry.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }

        if (plugin.status.state === 'active') {
            return;
        }

        try {
            plugin.status.state = 'active';
            plugin.status.health = 'healthy';
            plugin.metadata.usageCount++;

            // Run activation hooks
            await this.runLifecycleHooks(plugin, 'pre-activate');

            // Register plugin commands and providers
            await this.registerPluginCapabilities(plugin);

            // Run post-activation hooks
            await this.runLifecycleHooks(plugin, 'post-activate');

            console.log(`Plugin ${pluginId} activated successfully`);
        } catch (error) {
            plugin.status.state = 'error';
            plugin.status.health = 'error';
            plugin.status.lastError = {
                code: 'ACTIVATION_FAILED',
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date(),
                severity: 'high'
            };
            plugin.metadata.errorCount++;
            throw error;
        }
    }

    /**
     * Deactivate plugin
     */
    public async deactivatePlugin(pluginId: string): Promise<void> {
        const plugin = this.registry.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }

        if (plugin.status.state === 'inactive') {
            return;
        }

        try {
            // Run pre-deactivation hooks
            await this.runLifecycleHooks(plugin, 'pre-deactivate');

            // Unregister plugin capabilities
            await this.unregisterPluginCapabilities(plugin);

            // Run post-deactivation hooks
            await this.runLifecycleHooks(plugin, 'post-deactivate');

            plugin.status.state = 'inactive';
            plugin.status.health = 'unknown';

            console.log(`Plugin ${pluginId} deactivated successfully`);
        } catch (error) {
            plugin.status.lastError = {
                code: 'DEACTIVATION_FAILED',
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date(),
                severity: 'medium'
            };
            plugin.metadata.errorCount++;
            throw error;
        }
    }

    /**
     * Execute plugin capability
     */
    public async executePluginCapability(
        pluginId: string,
        capabilityName: string,
        inputs: any
    ): Promise<PluginExecutionResult> {
        const startTime = new Date();
        const capability = this.registry.capabilities.get(`${pluginId}.${capabilityName}`);

        if (!capability) {
            throw new Error(`Capability ${capabilityName} not found in plugin ${pluginId}`);
        }

        const plugin = this.registry.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }

        if (plugin.status.state !== 'active') {
            throw new Error(`Plugin ${pluginId} is not active`);
        }

        try {
            // Validate inputs
            await this.validateInputs(capability, inputs);

            // Execute capability
            const output = await this.executeCapability(plugin, capability, inputs);

            const endTime = new Date();
            const executionTime = endTime.getTime() - startTime.getTime();

            // Update performance metrics
            this.updatePerformanceMetrics(plugin, executionTime, true);

            return {
                success: true,
                output,
                metrics: {
                    startTime,
                    endTime,
                    executionTime,
                    memoryUsage: process.memoryUsage().heapUsed,
                    cpuUsage: process.cpuUsage().user
                }
            };
        } catch (error) {
            const endTime = new Date();
            const executionTime = endTime.getTime() - startTime.getTime();

            // Update performance metrics
            this.updatePerformanceMetrics(plugin, executionTime, false);

            return {
                success: false,
                error: {
                    code: 'EXECUTION_FAILED',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined,
                    timestamp: new Date(),
                    severity: 'medium'
                },
                metrics: {
                    startTime,
                    endTime,
                    executionTime,
                    memoryUsage: process.memoryUsage().heapUsed,
                    cpuUsage: process.cpuUsage().user
                }
            };
        }
    }

    /**
     * Install plugin
     */
    public async installPlugin(source: string, type: 'local' | 'remote' | 'marketplace'): Promise<void> {
        console.log(`Installing plugin from ${source} (${type})`);

        switch (type) {
            case 'local':
                await this.installLocalPlugin(source);
                break;
            case 'remote':
                await this.installRemotePlugin(source);
                break;
            case 'marketplace':
                await this.installMarketplacePlugin(source);
                break;
        }
    }

    /**
     * Uninstall plugin
     */
    public async uninstallPlugin(pluginId: string): Promise<void> {
        const plugin = this.registry.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }

        // Deactivate plugin first
        if (plugin.status.state === 'active') {
            await this.deactivatePlugin(pluginId);
        }

        // Remove plugin files
        const pluginPath = path.join(this.pluginDirectory, pluginId);
        if (fs.existsSync(pluginPath)) {
            fs.rmSync(pluginPath, { recursive: true, force: true });
        }

        // Remove from registry
        this.registry.plugins.delete(pluginId);
        this.registry.manifests.delete(pluginId);
        this.registry.contexts.delete(pluginId);

        // Remove capabilities
        for (const capabilityKey of this.registry.capabilities.keys()) {
            if (capabilityKey.startsWith(`${pluginId}.`)) {
                this.registry.capabilities.delete(capabilityKey);
            }
        }

        console.log(`Plugin ${pluginId} uninstalled successfully`);
    }

    /**
     * Get all plugins
     */
    public getPlugins(): Plugin[] {
        return Array.from(this.registry.plugins.values());
    }

    /**
     * Get plugin by ID
     */
    public getPlugin(pluginId: string): Plugin | undefined {
        return this.registry.plugins.get(pluginId);
    }

    /**
     * Get plugin capabilities
     */
    public getPluginCapabilities(pluginId: string): PluginCapability[] {
        const plugin = this.registry.plugins.get(pluginId);
        return plugin ? plugin.capabilities : [];
    }

    /**
     * Register default plugins
     */
    private async registerDefaultPlugins(): Promise<void> {
        // Register built-in plugins
        await this.registerBuiltinAnalyzerPlugin();
        await this.registerBuiltinGeneratorPlugin();
        await this.registerBuiltinRefactorPlugin();
    }

    /**
     * Register built-in analyzer plugin
     */
    private async registerBuiltinAnalyzerPlugin(): Promise<void> {
        const manifest: PluginManifest = {
            id: 'builtin-analyzer',
            name: 'Built-in Code Analyzer',
            version: '1.0.0',
            description: 'Built-in code analysis capabilities',
            author: 'Kalai Agent',
            license: 'MIT',
            main: 'index.js',
            capabilities: [
                {
                    type: 'analyzer',
                    name: 'analyze-complexity',
                    description: 'Analyze code complexity',
                    inputs: [
                        {
                            name: 'code',
                            type: 'string',
                            description: 'Code to analyze',
                            required: true
                        },
                        {
                            name: 'language',
                            type: 'string',
                            description: 'Programming language',
                            required: true
                        }
                    ],
                    outputs: [
                        {
                            name: 'complexity',
                            type: 'object',
                            description: 'Complexity metrics'
                        }
                    ],
                    configuration: {},
                    requirements: []
                }
            ],
            dependencies: [],
            configuration: {
                type: 'object',
                properties: {},
                required: [],
                additionalProperties: false
            },
            lifecycle: {
                activation: [
                    { type: 'startup', value: '', priority: 1 }
                ],
                deactivation: [
                    { type: 'shutdown', value: '', cleanup: true }
                ],
                hooks: []
            },
            permissions: [
                {
                    type: 'file-read',
                    scope: 'workspace',
                    justification: 'Analyze code files',
                    required: true
                }
            ]
        };

        await this.loadPlugin(manifest.id, manifest);
    }

    /**
     * Register built-in generator plugin
     */
    private async registerBuiltinGeneratorPlugin(): Promise<void> {
        // Similar implementation for generator plugin
        console.log('Registering built-in generator plugin');
    }

    /**
     * Register built-in refactor plugin
     */
    private async registerBuiltinRefactorPlugin(): Promise<void> {
        // Similar implementation for refactor plugin
        console.log('Registering built-in refactor plugin');
    }

    // Helper methods

    private async runLifecycleHooks(plugin: Plugin, event: string): Promise<void> {
        const hooks = plugin.lifecycle.hooks.filter(hook => hook.event === event);
        for (const hook of hooks) {
            try {
                // Execute hook handler
                console.log(`Running ${event} hook for plugin ${plugin.id}`);
            } catch (error) {
                console.error(`Hook ${event} failed for plugin ${plugin.id}:`, error);
            }
        }
    }

    private async registerPluginCapabilities(plugin: Plugin): Promise<void> {
        // Register VS Code commands, providers, etc.
        for (const capability of plugin.capabilities) {
            if (capability.type === 'command') {
                const commandId = `kalai-plugin.${plugin.id}.${capability.name}`;
                vscode.commands.registerCommand(commandId, async (...args) => {
                    return this.executePluginCapability(plugin.id, capability.name, args);
                });
            }
        }
    }

    private async unregisterPluginCapabilities(plugin: Plugin): Promise<void> {
        // Unregister VS Code commands, providers, etc.
        console.log(`Unregistering capabilities for plugin ${plugin.id}`);
    }

    private async validateInputs(capability: PluginCapability, inputs: any): Promise<void> {
        for (const input of capability.inputs) {
            if (input.required && inputs[input.name] === undefined) {
                throw new Error(`Required input ${input.name} is missing`);
            }

            if (input.validation) {
                await this.validateInput(input, inputs[input.name]);
            }
        }
    }

    private async validateInput(input: CapabilityInput, value: any): Promise<void> {
        const validation = input.validation!;

        if (validation.pattern && typeof value === 'string') {
            const regex = new RegExp(validation.pattern);
            if (!regex.test(value)) {
                throw new Error(`Input ${input.name} does not match pattern ${validation.pattern}`);
            }
        }

        if (validation.min !== undefined && typeof value === 'number') {
            if (value < validation.min) {
                throw new Error(`Input ${input.name} is below minimum ${validation.min}`);
            }
        }

        if (validation.max !== undefined && typeof value === 'number') {
            if (value > validation.max) {
                throw new Error(`Input ${input.name} is above maximum ${validation.max}`);
            }
        }

        if (validation.enum && !validation.enum.includes(value)) {
            throw new Error(`Input ${input.name} is not in allowed values: ${validation.enum.join(', ')}`);
        }
    }

    private async executeCapability(plugin: Plugin, capability: PluginCapability, inputs: any): Promise<any> {
        const context = this.registry.contexts.get(plugin.id);
        if (!context) {
            throw new Error(`No context found for plugin ${plugin.id}`);
        }

        // This would execute the actual plugin capability
        // For now, return mock data based on capability type
        switch (capability.type) {
            case 'analyzer':
                return { complexity: 5, maintainability: 0.8 };
            case 'generator':
                return { code: 'generated code', files: ['file1.js'] };
            case 'transformer':
                return { transformedCode: 'transformed code' };
            default:
                return { result: 'success' };
        }
    }

    private updatePerformanceMetrics(plugin: Plugin, executionTime: number, success: boolean): void {
        const metrics = plugin.metadata.performanceMetrics;
        const count = plugin.metadata.usageCount;

        metrics.averageExecutionTime = (metrics.averageExecutionTime * (count - 1) + executionTime) / count;
        metrics.successRate = success ?
            (metrics.successRate * (count - 1) + 1) / count :
            (metrics.successRate * (count - 1)) / count;
        metrics.lastMeasurement = new Date();

        if (!success) {
            plugin.metadata.errorCount++;
        }
    }

    private async installLocalPlugin(source: string): Promise<void> {
        console.log(`Installing local plugin from ${source}`);
    }

    private async installRemotePlugin(source: string): Promise<void> {
        console.log(`Installing remote plugin from ${source}`);
    }

    private async installMarketplacePlugin(source: string): Promise<void> {
        console.log(`Installing marketplace plugin from ${source}`);
    }

    /**
     * Clear all plugin data
     */
    public clearAllData(): void {
        this.registry.plugins.clear();
        this.registry.manifests.clear();
        this.registry.contexts.clear();
        this.registry.capabilities.clear();
    }
}