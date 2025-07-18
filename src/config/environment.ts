/**
 * Simplified Environment Configuration Manager for Kalai Agent
 * Only handles basic configuration from VS Code settings
 */

import * as vscode from 'vscode';

interface EnvironmentConfig {
    apiEndpoint: string;
    modelName: string;
    fallbackModels: string[];
    rateLimits: {
        requestsPerMinute: number;
        tokensPerMinute: number;
    };
}

export class EnvironmentManager {
    private static instance: EnvironmentManager;
    private currentConfig: EnvironmentConfig | null = null;

    private constructor() { }

    public static getInstance(): EnvironmentManager {
        if (!EnvironmentManager.instance) {
            EnvironmentManager.instance = new EnvironmentManager();
        }
        return EnvironmentManager.instance;
    }

    /**
     * Get basic configuration from VS Code settings (no API keys)
     */
    public async getConfiguration(): Promise<EnvironmentConfig> {
        if (this.currentConfig) {
            return this.currentConfig;
        }

        // Get configuration from VS Code settings only
        const config = vscode.workspace.getConfiguration('kalai-agent');

        this.currentConfig = {
            apiEndpoint: config.get<string>('apiEndpoint') || 'https://openrouter.ai/api/v1/chat/completions',
            modelName: config.get<string>('modelName') || 'moonshotai/kimi-k2:free',
            fallbackModels: this.getDefaultFallbackModels(),
            rateLimits: this.getDefaultRateLimits()
        };

        return this.currentConfig;
    }

    /**
     * Clear current configuration (forces re-evaluation)
     */
    public clearConfiguration(): void {
        this.currentConfig = null;
    }

    private getDefaultFallbackModels(): string[] {
        return [
            'moonshotai/kimi-k2:free',
            'meta-llama/llama-3.3-70b-instruct:free',
            'meta-llama/llama-3.1-8b-instruct:free',
            'microsoft/phi-3-mini-128k-instruct:free',
            'google/gemma-2-9b-it:free'
        ];
    }

    private getDefaultRateLimits(): { requestsPerMinute: number; tokensPerMinute: number } {
        return {
            requestsPerMinute: 60,
            tokensPerMinute: 100000
        };
    }
}

// Export convenience functions
export const environmentManager = EnvironmentManager.getInstance();

export async function getApiEndpoint(): Promise<string> {
    const config = await environmentManager.getConfiguration();
    return config.apiEndpoint;
}

export async function getModelName(): Promise<string> {
    const config = await environmentManager.getConfiguration();
    return config.modelName;
}