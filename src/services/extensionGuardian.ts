/**
 * Extension Guardian
 * Controls access to extension features based on API key configuration
 */

import * as vscode from 'vscode';
import { ApiKeyManager } from './apiKeyManager';
import { getProviderForModel, isModelFree } from '../config/apiProviders';

export class ExtensionGuardian {
    private apiKeyManager: ApiKeyManager;
    private isInitialized = false;
    private setupInProgress = false;

    constructor(apiKeyManager: ApiKeyManager) {
        this.apiKeyManager = apiKeyManager;
    }

    /**
     * Check if user can use the extension
     */
    async canUseExtension(): Promise<boolean> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return await this.apiKeyManager.canUseExtension();
    }

    /**
     * Initialize the guardian
     */
    async initialize(): Promise<void> {
        try {
            const canUse = await this.apiKeyManager.canUseExtension();

            if (!canUse) {
                await this.showWelcomeSetup();
            } else {
                await this.showWelcomeMessage();
            }

            this.isInitialized = true;
        } catch (error) {
            console.error('Guardian initialization failed:', error);
            await this.showWelcomeSetup();
        }
    }

    /**
     * Guard a command execution
     */
    async guardCommand(commandName: string, execution: () => Promise<void>): Promise<void> {
        const canUse = await this.canUseExtension();

        if (!canUse) {
            await this.showSetupRequired(commandName);
            return;
        }

        try {
            await execution();
        } catch (error: any) {
            if (error.message?.includes('API key') || error.message?.includes('unauthorized')) {
                await this.handleApiKeyError(error);
            } else {
                throw error;
            }
        }
    }

    /**
     * Show welcome setup for new users
     */
    private async showWelcomeSetup(): Promise<void> {
        if (this.setupInProgress) return;
        this.setupInProgress = true;

        const config = vscode.workspace.getConfiguration('kalai-agent');
        const modelName = config.get<string>('modelName', 'moonshotai/kimi-k2:free');
        const provider = getProviderForModel(modelName);
        const isFree = isModelFree(modelName);

        const message = `🎉 Welcome to Kalai Agent!

Your AI-powered coding assistant is ready to help, but first you need to configure an API key.

📋 Current Configuration:
• Model: ${modelName}
• Provider: ${provider?.displayName || 'Unknown'}
• Cost: ${isFree ? 'Free (with account)' : 'Paid subscription required'}

To get started, you'll need to:
1. Create a ${provider?.displayName || 'provider'} account
2. Get your API key
3. Configure it in Kalai Agent

Would you like help setting this up?`;

        const action = await vscode.window.showInformationMessage(
            message,
            { modal: true },
            'Setup API Key',
            'Choose Different Model',
            'Learn More',
            'Skip for Now'
        );

        switch (action) {
            case 'Setup API Key':
                await this.startApiKeySetup(modelName);
                break;

            case 'Choose Different Model':
                await this.apiKeyManager.showModelSelector();
                break;

            case 'Learn More':
                vscode.env.openExternal(vscode.Uri.parse(provider?.helpUrl || 'https://github.com/Odeneho-Calculus/kalai-agent'));
                break;
        }

        this.setupInProgress = false;
    }

    /**
     * Show welcome message for configured users
     */
    private async showWelcomeMessage(): Promise<void> {
        const config = vscode.workspace.getConfiguration('kalai-agent');
        const modelName = config.get<string>('modelName', 'moonshotai/kimi-k2:free');
        const provider = getProviderForModel(modelName);

        vscode.window.showInformationMessage(
            `🎉 Kalai Agent is ready! Using ${provider?.displayName || 'your configured'} API with ${modelName} model.`,
            'Start Coding',
            'Settings'
        ).then(selection => {
            if (selection === 'Start Coding') {
                vscode.commands.executeCommand('kalai-agent.startChat');
            } else if (selection === 'Settings') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'kalai-agent');
            }
        });
    }

    /**
     * Show setup required message
     */
    private async showSetupRequired(commandName: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('kalai-agent');
        const modelName = config.get<string>('modelName', 'moonshotai/kimi-k2:free');
        const provider = getProviderForModel(modelName);

        const message = `🔑 API Key Required

To use "${commandName}", you need to configure an API key for ${provider?.displayName || 'your AI provider'}.

Current model: ${modelName}
Provider: ${provider?.displayName || 'Unknown'}

This is a one-time setup that takes just 2 minutes.`;

        const action = await vscode.window.showWarningMessage(
            message,
            'Setup Now',
            'Choose Different Model',
            'Cancel'
        );

        switch (action) {
            case 'Setup Now':
                await this.startApiKeySetup(modelName);
                break;

            case 'Choose Different Model':
                await this.apiKeyManager.showModelSelector();
                break;
        }
    }

    /**
     * Start API key setup process
     */
    private async startApiKeySetup(modelName: string): Promise<void> {
        const provider = getProviderForModel(modelName);
        if (!provider) {
            vscode.window.showErrorMessage('Unknown model provider');
            return;
        }

        await this.apiKeyManager.promptForApiKeySetup(modelName, provider.name);
    }

    /**
     * Handle API key errors during execution
     */
    private async handleApiKeyError(error: Error): Promise<void> {
        const config = vscode.workspace.getConfiguration('kalai-agent');
        const modelName = config.get<string>('modelName', 'moonshotai/kimi-k2:free');
        const provider = getProviderForModel(modelName);

        const message = `🔑 API Key Error

${error.message}

This might be due to:
• Invalid or expired API key
• Rate limit exceeded
• Account issues

Would you like to:`;

        const action = await vscode.window.showErrorMessage(
            message,
            'Fix API Key',
            'Check Account',
            'Contact Support'
        );

        switch (action) {
            case 'Fix API Key':
                if (provider) {
                    await this.apiKeyManager.promptApiKeyInput(provider.name);
                }
                break;

            case 'Check Account':
                if (provider) {
                    vscode.env.openExternal(vscode.Uri.parse(provider.apiKeyUrl));
                }
                break;

            case 'Contact Support':
                vscode.env.openExternal(vscode.Uri.parse('https://github.com/Odeneho-Calculus/kalai-agent/issues'));
                break;
        }
    }

    /**
     * Show API key status
     */
    async showApiKeyStatus(): Promise<void> {
        const config = vscode.workspace.getConfiguration('kalai-agent');
        const modelName = config.get<string>('modelName', 'moonshotai/kimi-k2:free');
        const provider = getProviderForModel(modelName);

        if (!provider) {
            vscode.window.showErrorMessage('Unknown model provider');
            return;
        }

        const keyInfo = this.apiKeyManager.getKeyInfo(provider.name);
        const canUse = await this.apiKeyManager.canUseExtension();

        const status = canUse ? '✅ Ready' : '❌ Not Configured';
        const keyStatus = keyInfo ? `Stored: ${keyInfo.storedAt.toLocaleDateString()}` : 'Not stored';

        const message = `🔑 API Key Status

Model: ${modelName}
Provider: ${provider.displayName}
Status: ${status}
Key: ${keyStatus}
Last Validated: ${keyInfo?.lastValidated.toLocaleString() || 'Never'}

${canUse ? 'Your extension is ready to use!' : 'Please configure an API key to use the extension.'}`;

        const actions = canUse ?
            ['Refresh Key', 'Change Model', 'Usage Stats'] :
            ['Setup API Key', 'Change Model'];

        const action = await vscode.window.showInformationMessage(
            message,
            { modal: true },
            ...actions
        );

        switch (action) {
            case 'Setup API Key':
                await this.startApiKeySetup(modelName);
                break;

            case 'Refresh Key':
                await this.apiKeyManager.promptApiKeyInput(provider.name);
                break;

            case 'Change Model':
                await this.apiKeyManager.showModelSelector();
                break;

            case 'Usage Stats':
                await this.showUsageStats();
                break;
        }
    }

    /**
     * Show usage statistics
     */
    private async showUsageStats(): Promise<void> {
        const stats = this.apiKeyManager.getUsageStats();

        if (Object.keys(stats).length === 0) {
            vscode.window.showInformationMessage('No usage statistics available');
            return;
        }

        const statsText = Object.entries(stats).map(([provider, stat]) => {
            return `${provider}:
  Requests: ${stat.requests}
  Last Used: ${stat.lastUsed ? new Date(stat.lastUsed).toLocaleString() : 'Never'}
  Status: ${stat.isValid ? 'Valid' : 'Invalid'}`;
        }).join('\n\n');

        const message = `📊 API Key Usage Statistics

${statsText}

These statistics help you monitor your API usage and detect any issues.`;

        vscode.window.showInformationMessage(message, { modal: true });
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        // Clean up any resources
    }
}