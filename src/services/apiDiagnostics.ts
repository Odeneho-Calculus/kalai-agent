/**
 * API Diagnostics Tool for Kalai Agent
 *
 * This tool diagnoses API connectivity issues and provides detailed feedback
 */

import * as vscode from 'vscode';
import axios from 'axios';

export class APIDiagnostics {
    private static instance: APIDiagnostics;

    static getInstance(): APIDiagnostics {
        if (!APIDiagnostics.instance) {
            APIDiagnostics.instance = new APIDiagnostics();
        }
        return APIDiagnostics.instance;
    }

    public async runFullDiagnostics(): Promise<DiagnosticReport> {
        const report: DiagnosticReport = {
            timestamp: new Date().toISOString(),
            configCheck: await this.checkConfiguration(),
            networkCheck: await this.checkNetworkConnectivity(),
            apiCheck: await this.checkAPIEndpoint(),
            modelCheck: await this.checkModelAvailability(),
            recommendations: []
        };

        // Generate recommendations based on findings
        report.recommendations = this.generateRecommendations(report);

        return report;
    }

    private async checkConfiguration(): Promise<ConfigCheck> {
        try {
            const config = vscode.workspace.getConfiguration('kalai-agent');

            // Check API keys configuration
            const openrouterKey = config.get<string>('apiKeys.openrouter');
            const openaiKey = config.get<string>('apiKeys.openai');
            const anthropicKey = config.get<string>('apiKeys.anthropic');
            const googleKey = config.get<string>('apiKeys.google');

            const apiEndpoint = config.get<string>('apiEndpoint');
            const modelName = config.get<string>('modelName');

            // Check if at least one API key is configured
            const hasApiKey = !!(openrouterKey || openaiKey || anthropicKey || googleKey);

            return {
                status: 'success',
                apiKeyConfigured: hasApiKey,
                apiEndpointConfigured: !!apiEndpoint,
                modelNameConfigured: !!modelName,
                currentModel: modelName || 'not configured',
                currentEndpoint: apiEndpoint || 'not configured'
            };
        } catch (error) {
            return {
                status: 'error',
                apiKeyConfigured: false,
                apiEndpointConfigured: false,
                modelNameConfigured: false,
                currentModel: 'error',
                currentEndpoint: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private async checkNetworkConnectivity(): Promise<NetworkCheck> {
        try {
            const response = await axios.get('https://httpbin.org/ip', { timeout: 5000 });
            return {
                status: 'success',
                internetConnected: true,
                publicIP: response.data.origin
            };
        } catch (error) {
            return {
                status: 'error',
                internetConnected: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private async checkAPIEndpoint(): Promise<APICheck> {
        try {
            const config = vscode.workspace.getConfiguration('kalai-agent');
            let secureConfig: any = null;

            try {
                secureConfig = require('../config/secure.config').SECURE_CONFIG;
            } catch (error) {
                // Secure config not available
            }

            const apiKey = config.get<string>('apiKey') || secureConfig?.defaultApiKey;
            const apiEndpoint = config.get<string>('apiEndpoint') || secureConfig?.defaultApiEndpoint || 'https://openrouter.ai/api/v1/chat/completions';

            if (!apiKey) {
                return {
                    status: 'error',
                    endpointReachable: false,
                    error: 'API key not configured'
                };
            }

            // Test with a minimal request
            const testResponse = await axios.post(
                apiEndpoint,
                {
                    model: 'meta-llama/llama-3.1-8b-instruct:free',
                    messages: [{ role: 'user', content: 'Hello' }],
                    max_tokens: 10
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': 'https://github.com/Odeneho-Calculus/kalai-agent',
                        'X-Title': 'Kalai Agent',
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            return {
                status: 'success',
                endpointReachable: true,
                responseStatus: testResponse.status,
                responseTime: Date.now()
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return {
                    status: 'error',
                    endpointReachable: false,
                    error: `HTTP ${error.response?.status}: ${error.response?.data?.error?.message || error.message}`,
                    responseStatus: error.response?.status
                };
            }
            return {
                status: 'error',
                endpointReachable: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private async checkModelAvailability(): Promise<ModelCheck> {
        try {
            const config = vscode.workspace.getConfiguration('kalai-agent');
            let secureConfig: any = null;

            try {
                secureConfig = require('../config/secure.config').SECURE_CONFIG;
            } catch (error) {
                // Secure config not available
            }

            const apiKey = config.get<string>('apiKey') || secureConfig?.defaultApiKey;
            const modelName = config.get<string>('modelName') || secureConfig?.defaultModelName;

            if (!apiKey || !modelName) {
                return {
                    status: 'error',
                    modelAvailable: false,
                    error: 'API key or model name not configured'
                };
            }

            // Check if model is available by trying to get models list
            const modelsResponse = await axios.get(
                'https://openrouter.ai/api/v1/models',
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': 'https://github.com/Odeneho-Calculus/kalai-agent',
                        'X-Title': 'Kalai Agent'
                    },
                    timeout: 10000
                }
            );

            const models = modelsResponse.data.data || [];
            const modelExists = models.some((model: any) => model.id === modelName);

            return {
                status: 'success',
                modelAvailable: modelExists,
                currentModel: modelName,
                availableModels: models.slice(0, 5).map((m: any) => ({ id: m.id, name: m.name }))
            };
        } catch (error) {
            return {
                status: 'error',
                modelAvailable: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private generateRecommendations(report: DiagnosticReport): string[] {
        const recommendations: string[] = [];

        if (!report.configCheck.apiKeyConfigured) {
            recommendations.push('Configure your API key in VS Code settings (Kalai Agent → API Keys)');
        }

        if (!report.networkCheck.internetConnected) {
            recommendations.push('Check your internet connection and firewall settings');
        }

        if (!report.apiCheck.endpointReachable) {
            recommendations.push('Verify API endpoint URL and check if OpenRouter service is available');
        }

        if (!report.modelCheck.modelAvailable) {
            recommendations.push('Check if the configured model is available on OpenRouter');
        }

        if (report.apiCheck.responseStatus === 429) {
            recommendations.push('You are being rate limited. Wait before making more requests');
        }

        if (report.apiCheck.responseStatus === 401 || report.apiCheck.responseStatus === 403) {
            recommendations.push('API key authentication failed. Check your API key validity');
        }

        if (recommendations.length === 0) {
            recommendations.push('Configuration appears correct. The issue might be temporary or related to extension performance');
        }

        return recommendations;
    }

    public async displayDiagnosticReport(): Promise<void> {
        const report = await this.runFullDiagnostics();

        const reportText = `
# Kalai Agent Diagnostic Report
Generated: ${report.timestamp}

## Configuration Check
✓ API Key: ${report.configCheck.apiKeyConfigured ? 'Configured' : 'Not configured'}
✓ API Endpoint: ${report.configCheck.apiEndpointConfigured ? 'Configured' : 'Not configured'}
✓ Model: ${report.configCheck.currentModel}
✓ Endpoint: ${report.configCheck.currentEndpoint}

## Network Connectivity
✓ Internet: ${report.networkCheck.internetConnected ? 'Connected' : 'Not connected'}
${report.networkCheck.publicIP ? `✓ Public IP: ${report.networkCheck.publicIP}` : ''}

## API Endpoint Test
✓ Reachable: ${report.apiCheck.endpointReachable ? 'Yes' : 'No'}
${report.apiCheck.responseStatus ? `✓ Status: ${report.apiCheck.responseStatus}` : ''}

## Model Availability
✓ Available: ${report.modelCheck.modelAvailable ? 'Yes' : 'No'}
${report.modelCheck.currentModel ? `✓ Current: ${report.modelCheck.currentModel}` : ''}

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Errors
${report.configCheck.error ? `Config: ${report.configCheck.error}` : ''}
${report.networkCheck.error ? `Network: ${report.networkCheck.error}` : ''}
${report.apiCheck.error ? `API: ${report.apiCheck.error}` : ''}
${report.modelCheck.error ? `Model: ${report.modelCheck.error}` : ''}
`;

        // Show in new untitled document
        const doc = await vscode.workspace.openTextDocument({
            content: reportText,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);
    }
}

interface DiagnosticReport {
    timestamp: string;
    configCheck: ConfigCheck;
    networkCheck: NetworkCheck;
    apiCheck: APICheck;
    modelCheck: ModelCheck;
    recommendations: string[];
}

interface ConfigCheck {
    status: 'success' | 'error';
    apiKeyConfigured: boolean;
    apiEndpointConfigured: boolean;
    modelNameConfigured: boolean;
    currentModel: string;
    currentEndpoint: string;
    error?: string;
}

interface NetworkCheck {
    status: 'success' | 'error';
    internetConnected: boolean;
    publicIP?: string;
    error?: string;
}

interface APICheck {
    status: 'success' | 'error';
    endpointReachable: boolean;
    responseStatus?: number;
    responseTime?: number;
    error?: string;
}

interface ModelCheck {
    status: 'success' | 'error';
    modelAvailable: boolean;
    currentModel?: string;
    availableModels?: { id: string; name: string }[];
    error?: string;
}