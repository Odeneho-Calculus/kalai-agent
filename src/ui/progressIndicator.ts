import * as vscode from 'vscode';

export interface ProgressStep {
    name: string;
    message: string;
    weight: number;
}

export class ProgressIndicator {
    private progressToken: vscode.CancellationTokenSource | null = null;
    private currentProgress: vscode.Progress<{ increment?: number; message?: string }> | null = null;
    private steps: ProgressStep[] = [];
    private currentStepIndex = 0;
    private totalProgress = 0;

    constructor() { }

    /**
     * Start progress indication with predefined steps
     */
    public async startProgress(
        title: string,
        steps: ProgressStep[],
        location: vscode.ProgressLocation = vscode.ProgressLocation.Notification
    ): Promise<void> {
        this.steps = steps;
        this.currentStepIndex = 0;
        this.totalProgress = 0;
        this.progressToken = new vscode.CancellationTokenSource();

        return vscode.window.withProgress(
            {
                location,
                title,
                cancellable: false
            },
            async (progress, token) => {
                this.currentProgress = progress;

                // Wait for external completion
                return new Promise<void>((resolve) => {
                    this.progressToken!.token.onCancellationRequested(() => {
                        resolve();
                    });
                });
            }
        );
    }

    /**
     * Move to next step
     */
    public nextStep(): void {
        if (!this.currentProgress || this.currentStepIndex >= this.steps.length) {
            return;
        }

        const step = this.steps[this.currentStepIndex];
        const increment = step.weight;

        this.currentProgress.report({
            increment,
            message: step.message
        });

        this.totalProgress += increment;
        this.currentStepIndex++;
    }

    /**
     * Update current step message
     */
    public updateStep(message: string): void {
        if (!this.currentProgress) return;

        this.currentProgress.report({
            increment: 0,
            message
        });
    }

    /**
     * Complete the progress
     */
    public complete(): void {
        if (!this.progressToken) return;

        // Complete any remaining progress
        const remainingProgress = 100 - this.totalProgress;
        if (remainingProgress > 0 && this.currentProgress) {
            this.currentProgress.report({
                increment: remainingProgress,
                message: 'Complete!'
            });
        }

        this.progressToken.cancel();
        this.progressToken = null;
        this.currentProgress = null;
    }

    /**
     * Cancel the progress
     */
    public cancel(): void {
        if (!this.progressToken) return;

        this.progressToken.cancel();
        this.progressToken = null;
        this.currentProgress = null;
    }

    /**
     * Start simple progress without predefined steps
     */
    public async startSimpleProgress(
        title: string,
        location: vscode.ProgressLocation = vscode.ProgressLocation.Window
    ): Promise<{
        update: (increment: number, message?: string) => void;
        complete: () => void;
        cancel: () => void;
    }> {
        this.progressToken = new vscode.CancellationTokenSource();
        let currentProgress: vscode.Progress<{ increment?: number; message?: string }> | null = null;

        const progressPromise = vscode.window.withProgress(
            {
                location,
                title,
                cancellable: false
            },
            async (progress, token) => {
                currentProgress = progress;

                return new Promise<void>((resolve) => {
                    this.progressToken!.token.onCancellationRequested(() => {
                        resolve();
                    });
                });
            }
        );

        // Give VS Code time to show the progress
        await new Promise(resolve => setTimeout(resolve, 100));

        return {
            update: (increment: number, message?: string) => {
                if (currentProgress) {
                    currentProgress.report({ increment, message });
                }
            },
            complete: () => {
                if (this.progressToken) {
                    this.progressToken.cancel();
                    this.progressToken = null;
                }
            },
            cancel: () => {
                if (this.progressToken) {
                    this.progressToken.cancel();
                    this.progressToken = null;
                }
            }
        };
    }

    /**
     * Show determinate progress with callback
     */
    public static async withProgress<T>(
        title: string,
        task: (progress: (increment: number, message?: string) => void) => Promise<T>,
        location: vscode.ProgressLocation = vscode.ProgressLocation.Notification
    ): Promise<T> {
        return vscode.window.withProgress(
            {
                location,
                title,
                cancellable: false
            },
            async (progress) => {
                const updateProgress = (increment: number, message?: string) => {
                    progress.report({ increment, message });
                };

                return await task(updateProgress);
            }
        );
    }

    /**
     * Show indeterminate progress
     */
    public static async withIndeterminateProgress<T>(
        title: string,
        task: () => Promise<T>,
        location: vscode.ProgressLocation = vscode.ProgressLocation.Window
    ): Promise<T> {
        return vscode.window.withProgress(
            {
                location,
                title,
                cancellable: false
            },
            async () => {
                return await task();
            }
        );
    }
}