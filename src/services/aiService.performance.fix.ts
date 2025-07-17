/**
 * Performance Fix for AI Service
 *
 * This addresses the extension host unresponsiveness issues causing AI timeouts
 */

import * as vscode from 'vscode';

export class AIServicePerformanceFix {
    private static instance: AIServicePerformanceFix;
    private requestQueue: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }> = new Map();
    private isProcessing: boolean = false;
    private maxConcurrentRequests: number = 2;
    private activeRequests: number = 0;

    static getInstance(): AIServicePerformanceFix {
        if (!AIServicePerformanceFix.instance) {
            AIServicePerformanceFix.instance = new AIServicePerformanceFix();
        }
        return AIServicePerformanceFix.instance;
    }

    public async processWithTimeout<T>(
        operation: () => Promise<T>,
        timeoutMs: number = 30000,
        requestId?: string
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const id = requestId || Date.now().toString();

            // Set up timeout
            const timeout = setTimeout(() => {
                this.requestQueue.delete(id);
                this.activeRequests--;
                reject(new Error(`Operation timed out after ${timeoutMs}ms`));
            }, timeoutMs);

            this.requestQueue.set(id, { resolve, reject, timeout });

            // Process immediately if not at capacity
            if (this.activeRequests < this.maxConcurrentRequests) {
                this.executeOperation(id, operation);
            }
        });
    }

    private async executeOperation<T>(id: string, operation: () => Promise<T>): Promise<void> {
        const request = this.requestQueue.get(id);
        if (!request) return;

        this.activeRequests++;

        try {
            const result = await operation();
            clearTimeout(request.timeout);
            request.resolve(result);
        } catch (error) {
            clearTimeout(request.timeout);
            request.reject(error);
        } finally {
            this.requestQueue.delete(id);
            this.activeRequests--;
        }
    }

    public clearQueue(): void {
        this.requestQueue.forEach(({ timeout, reject }) => {
            clearTimeout(timeout);
            reject(new Error('Request queue cleared'));
        });
        this.requestQueue.clear();
        this.activeRequests = 0;
    }
}