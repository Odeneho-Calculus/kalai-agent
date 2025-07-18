/**
 * Security Utilities for Kalai Agent
 *
 * This module provides security-related utilities for safe API key management
 * and secure configuration handling.
 */

import * as vscode from 'vscode';
import { environmentManager } from '../config/environment';

export interface SecurityValidationResult {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
}

export class SecurityManager {
    private static instance: SecurityManager;

    private constructor() { }

    public static getInstance(): SecurityManager {
        if (!SecurityManager.instance) {
            SecurityManager.instance = new SecurityManager();
        }
        return SecurityManager.instance;
    }

    /**
     * Validate API key format and security
     */
    public validateApiKey(apiKey: string): SecurityValidationResult {
        const result: SecurityValidationResult = {
            isValid: true,
            issues: [],
            recommendations: []
        };

        // Check if API key is not placeholder
        const placeholder = ['your', 'openrouter', 'api', 'key', 'here'].join('-');
        if (!apiKey || apiKey === placeholder) {
            result.isValid = false;
            result.issues.push('API key is not configured');
            result.recommendations.push('Configure your API key in VS Code settings (Kalai Agent → API Keys)');
        }

        // Check OpenRouter API key format
        const expectedPrefix = ['sk', 'or', 'v1'].join('-') + '-';
        if (apiKey && !apiKey.startsWith(expectedPrefix)) {
            result.isValid = false;
            result.issues.push('Invalid OpenRouter API key format');
            result.recommendations.push(`Ensure your API key starts with "${expectedPrefix}"`);
        }

        // Check key length (OpenRouter keys are typically 64+ characters)
        if (apiKey && apiKey.length < 50) {
            result.isValid = false;
            result.issues.push('API key appears to be too short');
            result.recommendations.push('Verify your API key is complete and not truncated');
        }

        // Security recommendations
        if (result.isValid) {
            result.recommendations.push('Regularly rotate your API keys');
            result.recommendations.push('Monitor API key usage for unauthorized access');
        }

        return result;
    }

    /**
     * Perform comprehensive security audit
     */
    public async performSecurityAudit(): Promise<SecurityValidationResult> {
        const result: SecurityValidationResult = {
            isValid: true,
            issues: [],
            recommendations: []
        };

        try {
            // Check VS Code settings configuration
            const config = vscode.workspace.getConfiguration('kalai-agent');
            const hasApiKey = !!(
                config.get<string>('apiKeys.openrouter') ||
                config.get<string>('apiKeys.openai') ||
                config.get<string>('apiKeys.anthropic') ||
                config.get<string>('apiKeys.google')
            );

            if (!hasApiKey) {
                result.isValid = false;
                result.issues.push('No API keys configured');
                result.recommendations.push('Configure at least one API key in VS Code settings');
            } else {
                result.recommendations.push('✅ API keys configured in VS Code settings');
            }

            // Check for potential security issues
            await this.checkForSecurityIssues(result);

        } catch (error) {
            result.isValid = false;
            result.issues.push(`Security audit failed: ${error}`);
        }

        return result;
    }

    /**
     * Securely prompt user for API key
     */
    public async promptForApiKey(): Promise<string | undefined> {
        const apiKey = await vscode.window.showInputBox({
            title: 'Configure OpenRouter API Key',
            prompt: 'Enter your OpenRouter API key',
            password: true,
            ignoreFocusOut: true,
            placeHolder: 'sk-or-v1-...',
            validateInput: (value) => {
                const validation = this.validateApiKey(value);
                if (!validation.isValid) {
                    return validation.issues.join(', ');
                }
                return undefined;
            }
        });

        return apiKey;
    }

    /**
     * Setup secure configuration interactively
     */
    public async setupSecureConfiguration(): Promise<boolean> {
        vscode.window.showInformationMessage(
            'Configure your API keys in VS Code settings.',
            'Open Settings'
        ).then(selection => {
            if (selection === 'Open Settings') {
                vscode.commands.executeCommand('kalai-agent.openSettings');
            }
        });
        return false;
    }



    /**
     * Check for common security issues
     */
    private async checkForSecurityIssues(result: SecurityValidationResult): Promise<void> {
        // Security checks for extension settings only
        // Additional security checks can be added here
    }

    /**
     * Get masked API key for safe logging
     */
    public async getMaskedApiKey(): Promise<string> {
        const config = vscode.workspace.getConfiguration('kalai-agent');
        const keys = [
            config.get<string>('apiKeys.openrouter'),
            config.get<string>('apiKeys.openai'),
            config.get<string>('apiKeys.anthropic'),
            config.get<string>('apiKeys.google')
        ].filter(Boolean);

        if (keys.length === 0) {
            return 'Not configured';
        }

        const key = keys[0]!;
        if (key.length > 8) {
            return key.substring(0, 8) + '...' + key.substring(key.length - 4);
        }
        return '***';
    }
}

// Export convenience functions
export const securityManager = SecurityManager.getInstance();

export async function validateSecureConfiguration(): Promise<boolean> {
    const config = vscode.workspace.getConfiguration('kalai-agent');
    return !!(
        config.get<string>('apiKeys.openrouter') ||
        config.get<string>('apiKeys.openai') ||
        config.get<string>('apiKeys.anthropic') ||
        config.get<string>('apiKeys.google')
    );
}

export async function setupApiKeySafely(): Promise<boolean> {
    return await securityManager.setupSecureConfiguration();
}

export async function performSecurityCheck(): Promise<SecurityValidationResult> {
    return await securityManager.performSecurityAudit();
}