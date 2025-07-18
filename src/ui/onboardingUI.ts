/**
 * Onboarding UI for new users
 * Provides a comprehensive setup experience
 */

import * as vscode from 'vscode';
import { ApiKeyManager } from '../services/apiKeyManager';
import { getProviderForModel, isModelFree, API_PROVIDERS } from '../config/apiProviders';

export class OnboardingUI {
    private apiKeyManager: ApiKeyManager;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext, apiKeyManager: ApiKeyManager) {
        this.context = context;
        this.apiKeyManager = apiKeyManager;
    }

    /**
     * Show welcome screen for new users
     */
    async showWelcomeScreen(): Promise<void> {
        const hasSeenWelcome = this.context.globalState.get('kalai-agent-welcome-seen', false);

        if (!hasSeenWelcome) {
            await this.showFirstTimeSetup();
            await this.context.globalState.update('kalai-agent-welcome-seen', true);
        }
    }

    /**
     * Show first-time setup wizard
     */
    private async showFirstTimeSetup(): Promise<void> {
        const config = vscode.workspace.getConfiguration('kalai-agent');
        const currentModel = config.get<string>('modelName', 'moonshotai/kimi-k2:free');

        const welcomeMessage = `🎉 Welcome to Kalai Agent!

Your AI-powered coding assistant with advanced features:
• 🔍 Code analysis and explanation
• 🧪 Test generation and optimization
• 📝 Documentation generation
• 🔄 Intelligent refactoring
• 🛡️ Security scanning
• 📊 Performance analysis

To get started, you need to configure an API key for AI models.

Current model: ${currentModel}
Cost: ${isModelFree(currentModel) ? 'Free (with account)' : 'Paid subscription required'}

Would you like to:`;

        const action = await vscode.window.showInformationMessage(
            welcomeMessage,
            { modal: true },
            'Quick Setup',
            'Choose Model First',
            'Learn More',
            'Skip Setup'
        );

        switch (action) {
            case 'Quick Setup':
                await this.startQuickSetup(currentModel);
                break;

            case 'Choose Model First':
                await this.showModelSelection();
                break;

            case 'Learn More':
                await this.showDetailedInfo();
                break;

            case 'Skip Setup':
                await this.showSkipWarning();
                break;
        }
    }

    /**
     * Quick setup for the current model
     */
    private async startQuickSetup(modelName: string): Promise<void> {
        const provider = getProviderForModel(modelName);
        if (!provider) {
            vscode.window.showErrorMessage('Unknown model provider');
            return;
        }

        const providerInfo = API_PROVIDERS[provider.name];
        const isFree = isModelFree(modelName);

        const setupMessage = `🚀 Quick Setup for ${providerInfo.displayName}

Model: ${modelName}
Provider: ${providerInfo.displayName}
Cost: ${isFree ? 'Free with account' : 'Paid subscription required'}

Steps:
1. ${isFree ? 'Create free account' : 'Subscribe to service'} at ${providerInfo.signupUrl}
2. Get API key from ${providerInfo.apiKeyUrl}
3. Enter API key in next step

${isFree ? '💡 This model is completely free to use!' : '💰 This model requires a paid subscription.'}

Ready to continue?`;

        const proceed = await vscode.window.showInformationMessage(
            setupMessage,
            { modal: true },
            'Open Signup Page',
            'I Have API Key',
            'Change Model',
            'Cancel'
        );

        switch (proceed) {
            case 'Open Signup Page':
                vscode.env.openExternal(vscode.Uri.parse(providerInfo.signupUrl));
                setTimeout(() => this.promptForApiKey(provider.name), 2000);
                break;

            case 'I Have API Key':
                await this.promptForApiKey(provider.name);
                break;

            case 'Change Model':
                await this.showModelSelection();
                break;
        }
    }

    /**
     * Show model selection with detailed info
     */
    private async showModelSelection(): Promise<void> {
        const modelOptions = Object.entries(API_PROVIDERS).flatMap(([providerName, provider]) => {
            const freeModels = provider.freeModels.map(model => ({
                label: `🆓 ${model}`,
                description: `${provider.displayName} - Free`,
                detail: 'No cost - requires free account signup',
                model,
                provider: providerName,
                isFree: true
            }));

            const paidModels = provider.paidModels.map(model => ({
                label: `💰 ${model}`,
                description: `${provider.displayName} - Paid`,
                detail: 'Requires paid subscription',
                model,
                provider: providerName,
                isFree: false
            }));

            return [...freeModels, ...paidModels];
        });

        const selected = await vscode.window.showQuickPick(modelOptions, {
            placeHolder: 'Choose an AI model for Kalai Agent',
            ignoreFocusOut: true,
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (selected) {
            // Update the configuration
            const config = vscode.workspace.getConfiguration('kalai-agent');
            await config.update('modelName', selected.model, vscode.ConfigurationTarget.Global);

            vscode.window.showInformationMessage(`Model changed to: ${selected.model}`);

            // Continue with setup for the new model
            await this.startQuickSetup(selected.model);
        }
    }

    /**
     * Show detailed information about the extension
     */
    private async showDetailedInfo(): Promise<void> {
        const infoMessage = `📚 About Kalai Agent

Kalai Agent is an advanced AI-powered coding assistant that provides:

🔍 Code Analysis:
• Intelligent code explanation
• Architecture analysis
• Code quality assessment
• Security vulnerability detection

🧪 Development Tools:
• Automated test generation
• Performance optimization suggestions
• Documentation generation
• Smart refactoring

🤖 AI Models Supported:
• OpenRouter (Free & Paid models)
• OpenAI (GPT-4, GPT-3.5)
• Anthropic (Claude)
• Google (Gemini)

🔐 Security Features:
• Secure API key storage
• Local data processing
• No code uploaded to servers
• Privacy-focused design

💡 Free Options Available:
Many models offer free tiers perfect for getting started!

Ready to set up your API key?`;

        const action = await vscode.window.showInformationMessage(
            infoMessage,
            { modal: true },
            'Setup Now',
            'Choose Model',
            'Visit Website'
        );

        switch (action) {
            case 'Setup Now':
                const config = vscode.workspace.getConfiguration('kalai-agent');
                const modelName = config.get<string>('modelName', 'moonshotai/kimi-k2:free');
                await this.startQuickSetup(modelName);
                break;

            case 'Choose Model':
                await this.showModelSelection();
                break;

            case 'Visit Website':
                vscode.env.openExternal(vscode.Uri.parse('https://github.com/Odeneho-Calculus/kalai-agent'));
                break;
        }
    }

    /**
     * Show warning when user skips setup
     */
    private async showSkipWarning(): Promise<void> {
        const warningMessage = `⚠️ Setup Skipped

Without an API key, Kalai Agent cannot:
• Analyze your code
• Generate tests or documentation
• Provide AI-powered suggestions
• Perform security scans

You can set up your API key anytime by:
1. Opening Command Palette (Ctrl+Shift+P)
2. Running "Kalai: Setup API Key"

Or visit the extension settings to configure manually.

Would you like to set up now or continue without AI features?`;

        const action = await vscode.window.showWarningMessage(
            warningMessage,
            { modal: true },
            'Setup Now',
            'Continue Without AI',
            'Remind Me Later'
        );

        switch (action) {
            case 'Setup Now':
                const config = vscode.workspace.getConfiguration('kalai-agent');
                const modelName = config.get<string>('modelName', 'moonshotai/kimi-k2:free');
                await this.startQuickSetup(modelName);
                break;

            case 'Continue Without AI':
                vscode.window.showInformationMessage('You can enable AI features anytime from the Command Palette');
                break;

            case 'Remind Me Later':
                // Set reminder for next session
                await this.context.globalState.update('kalai-agent-remind-setup', true);
                break;
        }
    }

    /**
     * Prompt user to enter API key
     */
    private async promptForApiKey(provider: string): Promise<void> {
        const providerInfo = API_PROVIDERS[provider];
        if (!providerInfo) return;

        const apiKey = await vscode.window.showInputBox({
            prompt: `Enter your ${providerInfo.displayName} API key`,
            password: true,
            placeHolder: 'sk-...',
            ignoreFocusOut: true,
            validateInput: (value) => {
                if (!value) return 'API key is required';
                if (!validateApiKeyFormat(value, provider)) {
                    return `Invalid ${providerInfo.displayName} API key format`;
                }
                return null;
            }
        });

        if (apiKey) {
            try {
                await this.apiKeyManager.storeApiKey(provider, apiKey);
                await this.showSetupComplete(provider);
            } catch (error) {
                await this.showSetupError(error as Error, provider);
            }
        }
    }

    /**
     * Show setup completion message
     */
    private async showSetupComplete(provider: string): Promise<void> {
        const providerInfo = API_PROVIDERS[provider];

        const successMessage = `✅ Setup Complete!

${providerInfo.displayName} API key configured successfully!

🎉 Kalai Agent is now ready to assist you with:
• Code analysis and explanation
• Test generation
• Documentation creation
• Performance optimization
• Security scanning
• And much more!

Ready to start coding?`;

        const action = await vscode.window.showInformationMessage(
            successMessage,
            'Start Coding',
            'Open Chat',
            'View Commands'
        );

        switch (action) {
            case 'Start Coding':
                vscode.window.showInformationMessage('💡 Tip: Right-click in any file to access Kalai Agent features!');
                break;

            case 'Open Chat':
                vscode.commands.executeCommand('kalai-agent.startChat');
                break;

            case 'View Commands':
                vscode.commands.executeCommand('workbench.action.showCommands');
                break;
        }
    }

    /**
     * Show setup error and recovery options
     */
    private async showSetupError(error: Error, provider: string): Promise<void> {
        const providerInfo = API_PROVIDERS[provider];

        const errorMessage = `❌ Setup Failed

Error: ${error.message}

This could be due to:
• Invalid API key format
• Network connectivity issues
• API service temporarily unavailable
• Expired or revoked API key

Would you like to:`;

        const action = await vscode.window.showErrorMessage(
            errorMessage,
            'Try Again',
            'Check API Key',
            'Contact Support',
            'Skip for Now'
        );

        switch (action) {
            case 'Try Again':
                await this.promptForApiKey(provider);
                break;

            case 'Check API Key':
                vscode.env.openExternal(vscode.Uri.parse(providerInfo.apiKeyUrl));
                break;

            case 'Contact Support':
                vscode.env.openExternal(vscode.Uri.parse('https://github.com/Odeneho-Calculus/kalai-agent/issues'));
                break;

            case 'Skip for Now':
                vscode.window.showInformationMessage('Setup skipped. You can configure API key anytime from Command Palette.');
                break;
        }
    }

    /**
     * Check if user needs reminder
     */
    async checkReminder(): Promise<void> {
        const needsReminder = this.context.globalState.get('kalai-agent-remind-setup', false);

        if (needsReminder) {
            const canUse = await this.apiKeyManager.canUseExtension();

            if (!canUse) {
                const action = await vscode.window.showInformationMessage(
                    '🔑 Reminder: Set up your API key to unlock Kalai Agent\'s full potential!',
                    'Setup Now',
                    'Not Now',
                    'Don\'t Remind'
                );

                switch (action) {
                    case 'Setup Now':
                        const config = vscode.workspace.getConfiguration('kalai-agent');
                        const modelName = config.get<string>('modelName', 'moonshotai/kimi-k2:free');
                        await this.startQuickSetup(modelName);
                        break;

                    case 'Don\'t Remind':
                        await this.context.globalState.update('kalai-agent-remind-setup', false);
                        break;
                }
            } else {
                // User has configured API key, remove reminder
                await this.context.globalState.update('kalai-agent-remind-setup', false);
            }
        }
    }
}