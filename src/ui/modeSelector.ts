import * as vscode from 'vscode';
import { AIService } from '../services/aiService';

export interface ModeInfo {
    id: string;
    name: string;
    description: string;
    icon: string;
    features: string[];
    requirements: string[];
    warnings?: string[];
}

export class ModeSelector {
    private aiService: AIService;
    private modes: ModeInfo[] = [
        {
            id: 'chat',
            name: 'Chat Assistant',
            description: 'Interactive chat mode for questions and explanations',
            icon: '$(comment-discussion)',
            features: [
                'Code explanations',
                'General programming help',
                'Documentation assistance',
                'Quick answers'
            ],
            requirements: [
                'Active VS Code editor',
                'Internet connection for AI API'
            ]
        },
        {
            id: 'coding-agent',
            name: 'Coding Agent',
            description: 'Advanced coding assistance with multi-file awareness',
            icon: '$(robot)',
            features: [
                'Code generation and refactoring',
                'Multi-file operations',
                'Repository understanding',
                'Architectural guidance',
                'Test generation'
            ],
            requirements: [
                'Workspace with code files',
                'Repository grokking initialized',
                'Internet connection for AI API'
            ]
        },
        {
            id: 'coffee-mode',
            name: 'Coffee Mode',
            description: 'Autonomous mode - Kalai works independently',
            icon: '$(coffee)',
            features: [
                'Autonomous code modifications',
                'Continuous improvement suggestions',
                'Automated refactoring',
                'Background analysis',
                'Proactive optimization'
            ],
            requirements: [
                'Full repository access',
                'All services enabled',
                'User trust and approval'
            ],
            warnings: [
                'This mode allows Kalai to make autonomous changes to your code',
                'Always review changes before committing',
                'Use with caution in production environments',
                'Can be resource intensive'
            ]
        }
    ];

    constructor(aiService: AIService) {
        this.aiService = aiService;
    }

    /**
     * Show mode selection quick pick
     */
    public async showModeSelector(): Promise<void> {
        const currentMode = this.aiService.getCurrentMode();
        const capabilities = this.aiService.getCapabilities();

        const quickPickItems = this.modes.map(mode => ({
            label: `${mode.icon} ${mode.name}`,
            description: mode.description,
            detail: this.createModeDetail(mode, capabilities),
            mode: mode.id,
            picked: currentMode === mode.id
        }));

        const selected = await vscode.window.showQuickPick(quickPickItems, {
            title: 'Select Kalai Agent Mode',
            placeHolder: `Current mode: ${currentMode}`,
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (selected && selected.mode !== currentMode) {
            await this.switchMode(selected.mode);
        }
    }

    /**
     * Switch to specific mode with validation
     */
    private async switchMode(modeId: string): Promise<void> {
        const mode = this.modes.find(m => m.id === modeId);
        if (!mode) {
            vscode.window.showErrorMessage(`Invalid mode: ${modeId}`);
            return;
        }

        // Check requirements
        const canActivate = await this.checkModeRequirements(mode);
        if (!canActivate) {
            return;
        }

        // Show warnings for dangerous modes
        if (mode.warnings && mode.warnings.length > 0) {
            const proceed = await this.showModeWarnings(mode);
            if (!proceed) {
                return;
            }
        }

        try {
            await this.aiService.switchMode(modeId as any);
            vscode.window.showInformationMessage(
                `Switched to ${mode.name} mode`,
                'Show Capabilities'
            ).then(selection => {
                if (selection === 'Show Capabilities') {
                    vscode.commands.executeCommand('kalai-agent.showCapabilities');
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to switch mode: ${error}`);
        }
    }

    /**
     * Check if mode requirements are met
     */
    private async checkModeRequirements(mode: ModeInfo): Promise<boolean> {
        const capabilities = this.aiService.getCapabilities();
        const missingRequirements: string[] = [];

        // Check basic requirements
        if (!vscode.workspace.workspaceFolders && mode.id !== 'chat') {
            missingRequirements.push('Open workspace required');
        }

        // Check specific capabilities
        if (mode.id === 'coding-agent' && !capabilities.repoGrokking) {
            missingRequirements.push('Repository grokking not available');
        }

        if (mode.id === 'coffee-mode') {
            if (!capabilities.agenticPipeline) {
                missingRequirements.push('Agentic pipeline not available');
            }
            if (!capabilities.repoGrokking) {
                missingRequirements.push('Repository grokking not available');
            }
        }

        if (missingRequirements.length > 0) {
            const message = `Cannot activate ${mode.name} mode. Missing requirements:\n${missingRequirements.join('\n')}`;

            const result = await vscode.window.showErrorMessage(
                message,
                'Show Details',
                'Cancel'
            );

            if (result === 'Show Details') {
                await this.showModeDetails(mode);
            }

            return false;
        }

        return true;
    }

    /**
     * Show warnings for dangerous modes
     */
    private async showModeWarnings(mode: ModeInfo): Promise<boolean> {
        const warningMessage = `⚠️ ${mode.name} Mode Warnings:\n\n${mode.warnings!.join('\n\n')}`;

        const result = await vscode.window.showWarningMessage(
            warningMessage,
            { modal: true },
            'I Understand - Proceed',
            'Cancel'
        );

        return result === 'I Understand - Proceed';
    }

    /**
     * Show detailed mode information
     */
    public async showModeDetails(mode?: ModeInfo): Promise<void> {
        if (!mode) {
            // Show current mode details
            const currentMode = this.aiService.getCurrentMode();
            mode = this.modes.find(m => m.id === currentMode);
        }

        if (!mode) {
            vscode.window.showErrorMessage('Mode not found');
            return;
        }

        const capabilities = this.aiService.getCapabilities();
        const details = this.createDetailedModeInfo(mode, capabilities);

        await vscode.window.showInformationMessage(details, { modal: true });
    }

    /**
     * Create mode detail for quick pick
     */
    private createModeDetail(mode: ModeInfo, capabilities: any): string {
        const featuresText = mode.features.slice(0, 3).join(', ');
        const capabilityStatus = this.getModeCapabilityStatus(mode, capabilities);

        return `${featuresText} | ${capabilityStatus}`;
    }

    /**
     * Get mode capability status
     */
    private getModeCapabilityStatus(mode: ModeInfo, capabilities: any): string {
        if (mode.id === 'chat') {
            return 'Always available';
        }

        if (mode.id === 'coding-agent') {
            return capabilities.repoGrokking ? 'Ready' : 'Limited (No repo grokking)';
        }

        if (mode.id === 'coffee-mode') {
            const requiredCapabilities = ['repoGrokking', 'agenticPipeline'];
            const availableCount = requiredCapabilities.filter(cap => capabilities[cap]).length;

            if (availableCount === requiredCapabilities.length) {
                return 'Full capabilities';
            } else {
                return `Limited (${availableCount}/${requiredCapabilities.length} capabilities)`;
            }
        }

        return 'Unknown';
    }

    /**
     * Create detailed mode information
     */
    private createDetailedModeInfo(mode: ModeInfo, capabilities: any): string {
        const featuresText = mode.features.map(f => `• ${f}`).join('\n');
        const requirementsText = mode.requirements.map(r => `• ${r}`).join('\n');
        const warningsText = mode.warnings ? mode.warnings.map(w => `⚠️ ${w}`).join('\n') : '';

        return `${mode.icon} ${mode.name}

${mode.description}

Features:
${featuresText}

Requirements:
${requirementsText}

${warningsText ? `Warnings:\n${warningsText}\n` : ''}

Current Status: ${this.getModeCapabilityStatus(mode, capabilities)}`;
    }

    /**
     * Create status bar item for mode switching
     */
    public createModeStatusBarItem(): vscode.StatusBarItem {
        const statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );

        statusBarItem.command = 'kalai-agent.showModeSelector';
        this.updateModeStatusBarItem(statusBarItem);
        statusBarItem.show();

        return statusBarItem;
    }

    /**
     * Update mode status bar item
     */
    private updateModeStatusBarItem(statusBarItem: vscode.StatusBarItem): void {
        const currentMode = this.aiService.getCurrentMode();
        const mode = this.modes.find(m => m.id === currentMode);

        if (mode) {
            statusBarItem.text = `${mode.icon} ${mode.name}`;
            statusBarItem.tooltip = `Current mode: ${mode.name}\nClick to switch modes`;
        } else {
            statusBarItem.text = '$(question) Unknown Mode';
            statusBarItem.tooltip = 'Click to select mode';
        }
    }

    /**
     * Get all available modes
     */
    public getModes(): ModeInfo[] {
        return [...this.modes];
    }

    /**
     * Get current mode info
     */
    public getCurrentModeInfo(): ModeInfo | undefined {
        const currentMode = this.aiService.getCurrentMode();
        return this.modes.find(m => m.id === currentMode);
    }
}