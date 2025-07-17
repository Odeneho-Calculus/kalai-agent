import * as vscode from 'vscode';
import { AIService } from '../services/aiService';

export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;
    private aiService: AIService;
    private isInitialized = false;

    constructor(aiService: AIService) {
        this.aiService = aiService;
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.command = 'kalai-agent.showCapabilities';
        this.initialize();
    }

    private initialize(): void {
        this.updateStatus();
        this.statusBarItem.show();
        this.isInitialized = true;
    }

    public updateStatus(): void {
        if (!this.isInitialized) return;

        const currentMode = this.aiService.getCurrentMode();
        const capabilities = this.aiService.getCapabilities();

        // Create status text with mode and active capabilities
        const activeCapabilities = Object.entries(capabilities)
            .filter(([, enabled]) => enabled)
            .length;

        const modeIcons = {
            'chat': '$(comment-discussion)',
            'coding-agent': '$(robot)',
            'coffee-mode': '$(coffee)'
        };

        const modeIcon = modeIcons[currentMode as keyof typeof modeIcons] || '$(question)';

        this.statusBarItem.text = `${modeIcon} Kalai ${currentMode} (${activeCapabilities} capabilities)`;
        this.statusBarItem.tooltip = this.createTooltip(currentMode, capabilities);
    }

    private createTooltip(mode: string, capabilities: any): string {
        const capabilityList = Object.entries(capabilities)
            .map(([name, enabled]) => `${enabled ? '✅' : '❌'} ${name}`)
            .join('\n');

        return `Kalai Agent Status:
Mode: ${mode}
Active Capabilities:
${capabilityList}

Click to view detailed capabilities`;
    }

    public showProgress(message: string): void {
        this.statusBarItem.text = `$(sync~spin) ${message}`;
        this.statusBarItem.tooltip = 'Kalai Agent is processing...';
    }

    public hideProgress(): void {
        this.updateStatus();
    }

    public showError(message: string): void {
        this.statusBarItem.text = `$(error) Kalai Error`;
        this.statusBarItem.tooltip = `Error: ${message}`;

        // Reset after 5 seconds
        setTimeout(() => {
            this.updateStatus();
        }, 5000);
    }

    public showSuccess(message: string): void {
        this.statusBarItem.text = `$(check) Kalai Success`;
        this.statusBarItem.tooltip = message;

        // Reset after 3 seconds
        setTimeout(() => {
            this.updateStatus();
        }, 3000);
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }
}