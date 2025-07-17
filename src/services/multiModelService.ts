import * as vscode from 'vscode';
import { AIService } from './aiService';
import { RepoGrokkingService } from './repoGrokkingService';

export interface ModelProvider {
    id: string;
    name: string;
    description: string;
    capabilities: ModelCapability[];
    performance: ModelPerformance;
    cost: ModelCost;
    availability: ModelAvailability;
    constraints: ModelConstraints;
}

export interface ModelCapability {
    type: 'text-generation' | 'code-generation' | 'code-analysis' | 'reasoning' | 'math' | 'vision' | 'audio';
    level: 'basic' | 'intermediate' | 'advanced' | 'expert';
    specialization: string[];
    supportedLanguages: string[];
    maxTokens: number;
    contextWindow: number;
}

export interface ModelPerformance {
    speed: 'slow' | 'medium' | 'fast' | 'ultra-fast';
    accuracy: number; // 0-1
    consistency: number; // 0-1
    latency: number; // ms
    throughput: number; // tokens/second
    reliability: number; // 0-1
}

export interface ModelCost {
    inputCost: number; // per token
    outputCost: number; // per token
    tier: 'free' | 'basic' | 'premium' | 'enterprise';
    rateLimits: RateLimit[];
}

export interface RateLimit {
    type: 'requests' | 'tokens';
    limit: number;
    window: number; // seconds
    burst: number;
}

export interface ModelAvailability {
    status: 'available' | 'limited' | 'maintenance' | 'unavailable';
    regions: string[];
    uptime: number; // 0-1
    lastChecked: Date;
}

export interface ModelConstraints {
    maxConcurrentRequests: number;
    cooldownPeriod: number;
    contentFiltering: boolean;
    dataRetention: number; // days
    compliance: string[];
}

export interface ModelRoutingStrategy {
    strategy: 'performance' | 'cost' | 'accuracy' | 'balanced' | 'custom';
    weights: {
        performance: number;
        cost: number;
        accuracy: number;
        availability: number;
    };
    fallbackModels: string[];
    retryPolicy: RetryPolicy;
}

export interface RetryPolicy {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoffDelay: number;
    retriableErrors: string[];
}

export interface ModelRequest {
    id: string;
    taskType: TaskType;
    complexity: TaskComplexity;
    priority: TaskPriority;
    requirements: TaskRequirements;
    context: RequestContext;
    constraints: RequestConstraints;
}

export interface TaskType {
    category: 'code-generation' | 'analysis' | 'refactoring' | 'testing' | 'documentation' | 'debugging';
    subcategory: string;
    language: string;
    domain: string;
}

export interface TaskComplexity {
    level: 'simple' | 'moderate' | 'complex' | 'expert';
    factors: ComplexityFactor[];
    estimatedTokens: number;
    estimatedTime: number;
}

export interface ComplexityFactor {
    type: 'file-count' | 'function-count' | 'dependency-depth' | 'logic-complexity' | 'domain-knowledge';
    value: number;
    weight: number;
}

export interface TaskPriority {
    level: 'low' | 'medium' | 'high' | 'critical';
    deadline?: Date;
    userWaiting: boolean;
    batchable: boolean;
}

export interface TaskRequirements {
    accuracy: number; // 0-1
    speed: number; // 0-1
    creativity: number; // 0-1
    consistency: number; // 0-1
    specialization: string[];
    constraints: string[];
}

export interface RequestContext {
    repositoryPath: string;
    fileContext: string[];
    semanticContext: any;
    userPreferences: UserPreferences;
    sessionHistory: SessionHistory;
}

export interface UserPreferences {
    preferredModels: string[];
    avoidedModels: string[];
    costSensitivity: 'low' | 'medium' | 'high';
    speedPriority: 'low' | 'medium' | 'high';
    qualityPriority: 'low' | 'medium' | 'high';
}

export interface SessionHistory {
    previousRequests: PreviousRequest[];
    modelPerformance: ModelPerformanceHistory[];
    userFeedback: UserFeedback[];
}

export interface PreviousRequest {
    requestId: string;
    modelUsed: string;
    success: boolean;
    responseTime: number;
    userSatisfaction: number;
    timestamp: Date;
}

export interface ModelPerformanceHistory {
    modelId: string;
    averageResponseTime: number;
    successRate: number;
    userSatisfactionScore: number;
    usageCount: number;
    lastUsed: Date;
}

export interface UserFeedback {
    requestId: string;
    rating: number; // 1-5
    feedback: string;
    issues: string[];
    suggestions: string[];
    timestamp: Date;
}

export interface RequestConstraints {
    maxCost: number;
    maxTime: number;
    modelRestrictions: string[];
    complianceRequirements: string[];
}

export interface ModelRoutingDecision {
    selectedModel: string;
    reasoning: string;
    confidence: number;
    alternatives: AlternativeModel[];
    expectedPerformance: ExpectedPerformance;
}

export interface AlternativeModel {
    modelId: string;
    score: number;
    reasoning: string;
    tradeoffs: string[];
}

export interface ExpectedPerformance {
    responseTime: number;
    accuracy: number;
    cost: number;
    reliability: number;
}

export interface ModelResponse {
    requestId: string;
    modelUsed: string;
    response: any;
    metadata: ResponseMetadata;
    performance: ActualPerformance;
}

export interface ResponseMetadata {
    tokensUsed: number;
    processingTime: number;
    confidence: number;
    alternatives: any[];
    warnings: string[];
}

export interface ActualPerformance {
    responseTime: number;
    accuracy: number;
    cost: number;
    satisfaction: number;
}

export class MultiModelService {
    private models: Map<string, ModelProvider> = new Map();
    private routingStrategy: ModelRoutingStrategy;
    private performanceHistory: Map<string, ModelPerformanceHistory> = new Map();
    private aiService: AIService;
    private repoGrokkingService: RepoGrokkingService;
    private requestHistory: Map<string, ModelRequest> = new Map();
    private responseCache: Map<string, ModelResponse> = new Map();

    constructor(aiService: AIService, repoGrokkingService: RepoGrokkingService) {
        this.aiService = aiService;
        this.repoGrokkingService = repoGrokkingService;
        this.routingStrategy = this.getDefaultRoutingStrategy();
        this.initializeModels();
    }

    /**
     * Initialize supported models
     */
    private initializeModels(): void {
        // Add OpenRouter models
        this.models.set('qwen-2.5-7b', {
            id: 'qwen-2.5-7b',
            name: 'Qwen 2.5 7B Instruct',
            description: 'High-performance coding model with excellent reasoning',
            capabilities: [
                {
                    type: 'code-generation',
                    level: 'expert',
                    specialization: ['javascript', 'typescript', 'python', 'java'],
                    supportedLanguages: ['en', 'zh'],
                    maxTokens: 4096,
                    contextWindow: 32768
                },
                {
                    type: 'code-analysis',
                    level: 'advanced',
                    specialization: ['debugging', 'refactoring', 'optimization'],
                    supportedLanguages: ['en'],
                    maxTokens: 4096,
                    contextWindow: 32768
                }
            ],
            performance: {
                speed: 'fast',
                accuracy: 0.92,
                consistency: 0.89,
                latency: 800,
                throughput: 150,
                reliability: 0.95
            },
            cost: {
                inputCost: 0.0001,
                outputCost: 0.0002,
                tier: 'premium',
                rateLimits: [
                    { type: 'requests', limit: 1000, window: 3600, burst: 10 },
                    { type: 'tokens', limit: 100000, window: 3600, burst: 1000 }
                ]
            },
            availability: {
                status: 'available',
                regions: ['us-east-1', 'us-west-2', 'eu-west-1'],
                uptime: 0.999,
                lastChecked: new Date()
            },
            constraints: {
                maxConcurrentRequests: 5,
                cooldownPeriod: 1000,
                contentFiltering: true,
                dataRetention: 0,
                compliance: ['GDPR', 'SOC2']
            }
        });

        // Add GPT-4 models
        this.models.set('gpt-4-turbo', {
            id: 'gpt-4-turbo',
            name: 'GPT-4 Turbo',
            description: 'Advanced reasoning and code generation with large context',
            capabilities: [
                {
                    type: 'code-generation',
                    level: 'expert',
                    specialization: ['all-languages', 'architecture', 'complex-algorithms'],
                    supportedLanguages: ['en', 'es', 'fr', 'de', 'zh'],
                    maxTokens: 8192,
                    contextWindow: 128000
                },
                {
                    type: 'reasoning',
                    level: 'expert',
                    specialization: ['problem-solving', 'architecture-design', 'optimization'],
                    supportedLanguages: ['en'],
                    maxTokens: 8192,
                    contextWindow: 128000
                }
            ],
            performance: {
                speed: 'medium',
                accuracy: 0.96,
                consistency: 0.94,
                latency: 2000,
                throughput: 80,
                reliability: 0.98
            },
            cost: {
                inputCost: 0.01,
                outputCost: 0.03,
                tier: 'enterprise',
                rateLimits: [
                    { type: 'requests', limit: 500, window: 3600, burst: 5 },
                    { type: 'tokens', limit: 50000, window: 3600, burst: 5000 }
                ]
            },
            availability: {
                status: 'available',
                regions: ['global'],
                uptime: 0.995,
                lastChecked: new Date()
            },
            constraints: {
                maxConcurrentRequests: 3,
                cooldownPeriod: 2000,
                contentFiltering: true,
                dataRetention: 30,
                compliance: ['GDPR', 'SOC2', 'HIPAA']
            }
        });

        // Add Claude models
        this.models.set('claude-3-haiku', {
            id: 'claude-3-haiku',
            name: 'Claude 3 Haiku',
            description: 'Fast, efficient model for quick coding tasks',
            capabilities: [
                {
                    type: 'code-generation',
                    level: 'advanced',
                    specialization: ['quick-fixes', 'simple-functions', 'documentation'],
                    supportedLanguages: ['en'],
                    maxTokens: 4096,
                    contextWindow: 200000
                }
            ],
            performance: {
                speed: 'ultra-fast',
                accuracy: 0.88,
                consistency: 0.91,
                latency: 400,
                throughput: 200,
                reliability: 0.97
            },
            cost: {
                inputCost: 0.00025,
                outputCost: 0.00125,
                tier: 'basic',
                rateLimits: [
                    { type: 'requests', limit: 2000, window: 3600, burst: 20 },
                    { type: 'tokens', limit: 200000, window: 3600, burst: 2000 }
                ]
            },
            availability: {
                status: 'available',
                regions: ['us-east-1', 'us-west-2'],
                uptime: 0.998,
                lastChecked: new Date()
            },
            constraints: {
                maxConcurrentRequests: 10,
                cooldownPeriod: 500,
                contentFiltering: true,
                dataRetention: 0,
                compliance: ['GDPR', 'SOC2']
            }
        });

        // Add local models (hypothetical)
        this.models.set('local-codellama', {
            id: 'local-codellama',
            name: 'Local CodeLlama',
            description: 'Local code generation model for privacy-sensitive tasks',
            capabilities: [
                {
                    type: 'code-generation',
                    level: 'intermediate',
                    specialization: ['python', 'javascript', 'cpp'],
                    supportedLanguages: ['en'],
                    maxTokens: 2048,
                    contextWindow: 16384
                }
            ],
            performance: {
                speed: 'medium',
                accuracy: 0.82,
                consistency: 0.85,
                latency: 1500,
                throughput: 60,
                reliability: 0.90
            },
            cost: {
                inputCost: 0,
                outputCost: 0,
                tier: 'free',
                rateLimits: []
            },
            availability: {
                status: 'available',
                regions: ['local'],
                uptime: 0.95,
                lastChecked: new Date()
            },
            constraints: {
                maxConcurrentRequests: 1,
                cooldownPeriod: 0,
                contentFiltering: false,
                dataRetention: 0,
                compliance: []
            }
        });
    }

    /**
     * Get default routing strategy
     */
    private getDefaultRoutingStrategy(): ModelRoutingStrategy {
        return {
            strategy: 'balanced',
            weights: {
                performance: 0.3,
                cost: 0.2,
                accuracy: 0.4,
                availability: 0.1
            },
            fallbackModels: ['qwen-2.5-7b', 'claude-3-haiku', 'local-codellama'],
            retryPolicy: {
                maxRetries: 3,
                backoffMultiplier: 2,
                maxBackoffDelay: 10000,
                retriableErrors: ['timeout', 'rate_limit', 'server_error']
            }
        };
    }

    /**
     * Route request to best model
     */
    public async routeRequest(request: ModelRequest): Promise<ModelRoutingDecision> {
        const availableModels = Array.from(this.models.values()).filter(
            model => model.availability.status === 'available'
        );

        if (availableModels.length === 0) {
            throw new Error('No available models');
        }

        const scores = await this.calculateModelScores(request, availableModels);
        const bestModel = this.selectBestModel(scores);
        const alternatives = this.getAlternatives(scores, bestModel.modelId);

        return {
            selectedModel: bestModel.modelId,
            reasoning: bestModel.reasoning,
            confidence: bestModel.confidence,
            alternatives,
            expectedPerformance: {
                responseTime: bestModel.expectedResponseTime,
                accuracy: bestModel.expectedAccuracy,
                cost: bestModel.expectedCost,
                reliability: bestModel.expectedReliability
            }
        };
    }

    /**
     * Calculate model scores for request
     */
    private async calculateModelScores(
        request: ModelRequest,
        models: ModelProvider[]
    ): Promise<ModelScore[]> {
        const scores: ModelScore[] = [];

        for (const model of models) {
            const capabilityScore = this.calculateCapabilityScore(request, model);
            const performanceScore = this.calculatePerformanceScore(request, model);
            const costScore = this.calculateCostScore(request, model);
            const availabilityScore = this.calculateAvailabilityScore(request, model);
            const historyScore = this.calculateHistoryScore(request, model);

            const weightedScore = (
                capabilityScore * 0.3 +
                performanceScore * this.routingStrategy.weights.performance +
                costScore * this.routingStrategy.weights.cost +
                availabilityScore * this.routingStrategy.weights.availability +
                historyScore * 0.1
            );

            scores.push({
                modelId: model.id,
                score: weightedScore,
                capabilityScore,
                performanceScore,
                costScore,
                availabilityScore,
                historyScore,
                reasoning: this.generateScoreReasoning(model, {
                    capabilityScore,
                    performanceScore,
                    costScore,
                    availabilityScore,
                    historyScore
                }),
                confidence: this.calculateConfidence(model, request),
                expectedResponseTime: model.performance.latency,
                expectedAccuracy: model.performance.accuracy,
                expectedCost: this.estimateCost(request, model),
                expectedReliability: model.performance.reliability
            });
        }

        return scores.sort((a, b) => b.score - a.score);
    }

    /**
     * Calculate capability score
     */
    private calculateCapabilityScore(request: ModelRequest, model: ModelProvider): number {
        const relevantCapabilities = model.capabilities.filter(
            cap => cap.type === request.taskType.category
        );

        if (relevantCapabilities.length === 0) {
            return 0;
        }

        const capability = relevantCapabilities[0];
        let score = 0;

        // Level scoring
        const levelScores = { 'basic': 0.4, 'intermediate': 0.6, 'advanced': 0.8, 'expert': 1.0 };
        score += levelScores[capability.level] * 0.4;

        // Specialization scoring
        const hasSpecialization = capability.specialization.some(spec =>
            request.taskType.language.includes(spec) ||
            request.taskType.subcategory.includes(spec)
        );
        score += hasSpecialization ? 0.3 : 0;

        // Context window scoring
        const contextRatio = Math.min(request.complexity.estimatedTokens / capability.contextWindow, 1);
        score += (1 - contextRatio) * 0.3;

        return Math.min(score, 1);
    }

    /**
     * Calculate performance score
     */
    private calculatePerformanceScore(request: ModelRequest, model: ModelProvider): number {
        const speedWeight = request.priority.level === 'critical' ? 0.5 : 0.3;
        const accuracyWeight = request.requirements.accuracy;
        const reliabilityWeight = 0.2;

        const speedScore = this.normalizeSpeedScore(model.performance.speed);
        const accuracyScore = model.performance.accuracy;
        const reliabilityScore = model.performance.reliability;

        return (
            speedScore * speedWeight +
            accuracyScore * accuracyWeight +
            reliabilityScore * reliabilityWeight
        );
    }

    /**
     * Calculate cost score
     */
    private calculateCostScore(request: ModelRequest, model: ModelProvider): number {
        const estimatedCost = this.estimateCost(request, model);
        const costSensitivity = request.context.userPreferences.costSensitivity;

        if (costSensitivity === 'low') {
            return 0.8; // Don't penalize expensive models much
        }

        if (estimatedCost === 0) {
            return 1.0; // Free models get full score
        }

        // Normalize cost (lower cost = higher score)
        const maxCost = 1.0; // Define maximum acceptable cost
        return Math.max(0, 1 - (estimatedCost / maxCost));
    }

    /**
     * Calculate availability score
     */
    private calculateAvailabilityScore(request: ModelRequest, model: ModelProvider): number {
        if (model.availability.status !== 'available') {
            return 0;
        }

        const uptimeScore = model.availability.uptime;
        const rateLimitScore = this.calculateRateLimitScore(model);
        const concurrencyScore = this.calculateConcurrencyScore(model);

        return (uptimeScore * 0.5 + rateLimitScore * 0.3 + concurrencyScore * 0.2);
    }

    /**
     * Calculate history score
     */
    private calculateHistoryScore(request: ModelRequest, model: ModelProvider): number {
        const history = this.performanceHistory.get(model.id);
        if (!history) {
            return 0.5; // Neutral score for new models
        }

        const successRate = history.successRate;
        const satisfactionScore = history.userSatisfactionScore / 5; // Normalize to 0-1
        const recentUsage = this.calculateRecentUsageScore(history);

        return (successRate * 0.4 + satisfactionScore * 0.4 + recentUsage * 0.2);
    }

    /**
     * Select best model from scores
     */
    private selectBestModel(scores: ModelScore[]): ModelScore {
        return scores[0]; // Already sorted by score
    }

    /**
     * Get alternative models
     */
    private getAlternatives(scores: ModelScore[], selectedModelId: string): AlternativeModel[] {
        return scores
            .filter(score => score.modelId !== selectedModelId)
            .slice(0, 3)
            .map(score => ({
                modelId: score.modelId,
                score: score.score,
                reasoning: score.reasoning,
                tradeoffs: this.generateTradeoffs(score)
            }));
    }

    /**
     * Execute request with selected model
     */
    public async executeRequest(request: ModelRequest, routingDecision: ModelRoutingDecision): Promise<ModelResponse> {
        const startTime = Date.now();
        const model = this.models.get(routingDecision.selectedModel);

        if (!model) {
            throw new Error(`Model ${routingDecision.selectedModel} not found`);
        }

        try {
            // Execute the request using the selected model
            const response = await this.executeModelRequest(request, model);
            const endTime = Date.now();

            const modelResponse: ModelResponse = {
                requestId: request.id,
                modelUsed: model.id,
                response,
                metadata: {
                    tokensUsed: this.estimateTokensUsed(request, response),
                    processingTime: endTime - startTime,
                    confidence: routingDecision.confidence,
                    alternatives: routingDecision.alternatives,
                    warnings: []
                },
                performance: {
                    responseTime: endTime - startTime,
                    accuracy: await this.measureAccuracy(request, response),
                    cost: this.calculateActualCost(request, model, response),
                    satisfaction: 0 // Will be updated with user feedback
                }
            };

            // Update performance history
            this.updatePerformanceHistory(model.id, modelResponse);

            // Cache response
            this.responseCache.set(request.id, modelResponse);

            return modelResponse;
        } catch (error) {
            // Try fallback models
            return this.handleRequestFailure(request, routingDecision, error);
        }
    }

    /**
     * Execute model request
     */
    private async executeModelRequest(request: ModelRequest, model: ModelProvider): Promise<any> {
        // This would integrate with the actual model APIs
        // For now, delegate to the existing AI service
        return this.aiService.processMessage(`Task: ${request.taskType.category} - ${request.taskType.subcategory}`, {
            repositoryPath: request.context.repositoryPath,
            fileContext: request.context.fileContext,
            requirements: request.requirements,
            files: [],
            currentFile: {
                fileName: 'unknown',
                languageId: 'typescript',
                filePath: request.context.repositoryPath
            }
        });
    }

    // Helper methods
    private normalizeSpeedScore(speed: string): number {
        const speedScores: Record<string, number> = { 'slow': 0.25, 'medium': 0.5, 'fast': 0.75, 'ultra-fast': 1.0 };
        return speedScores[speed] || 0.5;
    }

    private estimateCost(request: ModelRequest, model: ModelProvider): number {
        const estimatedTokens = request.complexity.estimatedTokens;
        return (estimatedTokens * model.cost.inputCost) + (estimatedTokens * 0.3 * model.cost.outputCost);
    }

    private calculateRateLimitScore(model: ModelProvider): number {
        // Simplified rate limit scoring
        const requestLimit = model.cost.rateLimits.find(rl => rl.type === 'requests')?.limit || 1000;
        return Math.min(requestLimit / 1000, 1);
    }

    private calculateConcurrencyScore(model: ModelProvider): number {
        return Math.min(model.constraints.maxConcurrentRequests / 10, 1);
    }

    private calculateRecentUsageScore(history: ModelPerformanceHistory): number {
        const daysSinceLastUse = (Date.now() - history.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
        return Math.max(0, 1 - (daysSinceLastUse / 30)); // Decay over 30 days
    }

    private generateScoreReasoning(model: ModelProvider, scores: any): string {
        const strengths = [];
        const weaknesses = [];

        if (scores.capabilityScore > 0.8) strengths.push('excellent capability match');
        if (scores.performanceScore > 0.8) strengths.push('high performance');
        if (scores.costScore > 0.8) strengths.push('cost-effective');
        if (scores.availabilityScore > 0.9) strengths.push('high availability');

        if (scores.capabilityScore < 0.5) weaknesses.push('limited capability match');
        if (scores.performanceScore < 0.5) weaknesses.push('performance concerns');
        if (scores.costScore < 0.5) weaknesses.push('high cost');
        if (scores.availabilityScore < 0.7) weaknesses.push('availability issues');

        return `${strengths.join(', ')}${weaknesses.length ? ` but ${weaknesses.join(', ')}` : ''}`;
    }

    private calculateConfidence(model: ModelProvider, request: ModelRequest): number {
        const capabilityMatch = this.calculateCapabilityScore(request, model);
        const reliability = model.performance.reliability;
        const availability = model.availability.uptime;

        return (capabilityMatch * 0.5 + reliability * 0.3 + availability * 0.2);
    }

    private generateTradeoffs(score: ModelScore): string[] {
        const tradeoffs = [];

        if (score.performanceScore < 0.7) tradeoffs.push('slower response time');
        if (score.costScore < 0.7) tradeoffs.push('higher cost');
        if (score.capabilityScore < 0.8) tradeoffs.push('less specialized');
        if (score.availabilityScore < 0.9) tradeoffs.push('potential availability issues');

        return tradeoffs;
    }

    private estimateTokensUsed(request: ModelRequest, response: any): number {
        // Simplified token estimation
        return request.complexity.estimatedTokens + (response?.length || 0) / 4;
    }

    private async measureAccuracy(request: ModelRequest, response: any): Promise<number> {
        // Simplified accuracy measurement
        return 0.85; // Would implement actual accuracy measurement
    }

    private calculateActualCost(request: ModelRequest, model: ModelProvider, response: any): number {
        const tokensUsed = this.estimateTokensUsed(request, response);
        const inputTokens = request.complexity.estimatedTokens;
        const outputTokens = tokensUsed - inputTokens;

        return (inputTokens * model.cost.inputCost) + (outputTokens * model.cost.outputCost);
    }

    private updatePerformanceHistory(modelId: string, response: ModelResponse): void {
        const history = this.performanceHistory.get(modelId) || {
            modelId,
            averageResponseTime: 0,
            successRate: 0,
            userSatisfactionScore: 0,
            usageCount: 0,
            lastUsed: new Date()
        };

        history.usageCount++;
        history.averageResponseTime = (history.averageResponseTime * (history.usageCount - 1) + response.performance.responseTime) / history.usageCount;
        history.successRate = (history.successRate * (history.usageCount - 1) + 1) / history.usageCount;
        history.lastUsed = new Date();

        this.performanceHistory.set(modelId, history);
    }

    private async handleRequestFailure(request: ModelRequest, routingDecision: ModelRoutingDecision, error: any): Promise<ModelResponse> {
        // Implement retry logic with fallback models
        const fallbackModels = this.routingStrategy.fallbackModels;

        for (const fallbackModelId of fallbackModels) {
            if (fallbackModelId === routingDecision.selectedModel) continue;

            const fallbackModel = this.models.get(fallbackModelId);
            if (!fallbackModel || fallbackModel.availability.status !== 'available') continue;

            try {
                const response = await this.executeModelRequest(request, fallbackModel);
                return {
                    requestId: request.id,
                    modelUsed: fallbackModel.id,
                    response,
                    metadata: {
                        tokensUsed: this.estimateTokensUsed(request, response),
                        processingTime: 0,
                        confidence: 0.7,
                        alternatives: [],
                        warnings: [`Fallback used due to ${error.message}`]
                    },
                    performance: {
                        responseTime: 0,
                        accuracy: 0.8,
                        cost: this.calculateActualCost(request, fallbackModel, response),
                        satisfaction: 0
                    }
                };
            } catch (fallbackError) {
                continue;
            }
        }

        throw new Error(`All models failed: ${error.message}`);
    }

    /**
     * Get available models
     */
    public getAvailableModels(): ModelProvider[] {
        return Array.from(this.models.values());
    }

    /**
     * Get model performance history
     */
    public getModelPerformanceHistory(): ModelPerformanceHistory[] {
        return Array.from(this.performanceHistory.values());
    }

    /**
     * Update routing strategy
     */
    public updateRoutingStrategy(strategy: ModelRoutingStrategy): void {
        this.routingStrategy = strategy;
    }

    /**
     * Clear performance history
     */
    public clearPerformanceHistory(): void {
        this.performanceHistory.clear();
    }

    /**
     * Add custom model
     */
    public addCustomModel(model: ModelProvider): void {
        this.models.set(model.id, model);
    }

    /**
     * Remove model
     */
    public removeModel(modelId: string): void {
        this.models.delete(modelId);
    }
}

interface ModelScore {
    modelId: string;
    score: number;
    capabilityScore: number;
    performanceScore: number;
    costScore: number;
    availabilityScore: number;
    historyScore: number;
    reasoning: string;
    confidence: number;
    expectedResponseTime: number;
    expectedAccuracy: number;
    expectedCost: number;
    expectedReliability: number;
}