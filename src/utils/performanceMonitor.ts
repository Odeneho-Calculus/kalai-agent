import * as vscode from 'vscode';

interface PerformanceMetric {
    operation: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    success: boolean;
    error?: string;
}

export class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: PerformanceMetric[] = [];
    private readonly maxMetrics = 100; // Keep only last 100 metrics

    private constructor() { }

    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    /**
     * Start tracking a performance metric
     */
    public startOperation(operation: string): string {
        const id = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const metric: PerformanceMetric = {
            operation: `${operation}:${id}`,
            startTime: performance.now(),
            success: false
        };

        this.metrics.push(metric);

        // Keep only recent metrics
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }

        return id;
    }

    /**
     * End tracking a performance metric
     */
    public endOperation(operation: string, id: string, success: boolean = true, error?: string): void {
        const fullOperation = `${operation}:${id}`;
        const metric = this.metrics.find(m => m.operation === fullOperation);

        if (metric) {
            metric.endTime = performance.now();
            metric.duration = metric.endTime - metric.startTime;
            metric.success = success;
            metric.error = error;

            // Log slow operations
            if (metric.duration > 5000) { // 5 seconds
                console.warn(`⚠️ Slow operation detected: ${operation} took ${metric.duration.toFixed(2)}ms`);
            }

            // Log failed operations
            if (!success) {
                console.error(`❌ Operation failed: ${operation}`, error);
            }
        }
    }

    /**
     * Get performance statistics
     */
    public getStats(): {
        totalOperations: number;
        successRate: number;
        averageDuration: number;
        slowOperations: number;
        recentErrors: string[];
    } {
        const completedMetrics = this.metrics.filter(m => m.endTime !== undefined);
        const successfulMetrics = completedMetrics.filter(m => m.success);
        const slowMetrics = completedMetrics.filter(m => m.duration! > 5000);
        const recentErrors = completedMetrics
            .filter(m => !m.success && m.error)
            .slice(-5)
            .map(m => `${m.operation}: ${m.error}`);

        const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
        const averageDuration = completedMetrics.length > 0 ? totalDuration / completedMetrics.length : 0;

        return {
            totalOperations: completedMetrics.length,
            successRate: completedMetrics.length > 0 ? (successfulMetrics.length / completedMetrics.length) * 100 : 0,
            averageDuration,
            slowOperations: slowMetrics.length,
            recentErrors
        };
    }

    /**
     * Clear all metrics
     */
    public clearMetrics(): void {
        this.metrics = [];
    }

    /**
     * Show performance report in VS Code
     */
    public showPerformanceReport(): void {
        const stats = this.getStats();

        const report = `
# Kalai Agent Performance Report

## Overall Statistics
- **Total Operations**: ${stats.totalOperations}
- **Success Rate**: ${stats.successRate.toFixed(1)}%
- **Average Duration**: ${stats.averageDuration.toFixed(2)}ms
- **Slow Operations**: ${stats.slowOperations}

## Recent Errors
${stats.recentErrors.length > 0 ? stats.recentErrors.map(e => `- ${e}`).join('\n') : 'No recent errors'}

## Performance Tips
- If success rate is low, check your API key and network connection
- If average duration is high, consider reducing maxTokens in settings
- Slow operations may indicate network issues or complex requests

Generated at: ${new Date().toLocaleString()}
    `.trim();

        vscode.workspace.openTextDocument({
            content: report,
            language: 'markdown'
        }).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    }
}

/**
 * Wrapper function for tracking performance of async operations
 */
export async function withPerformanceTracking<T>(
    operationName: string,
    operation: () => Promise<T>
): Promise<T> {
    const monitor = PerformanceMonitor.getInstance();
    const id = monitor.startOperation(operationName);

    try {
        const result = await operation();
        monitor.endOperation(operationName, id, true);
        return result;
    } catch (error) {
        monitor.endOperation(operationName, id, false, error instanceof Error ? error.message : String(error));
        throw error;
    }
}

/**
 * Decorator for automatic performance tracking (simplified version)
 */
export function trackPerformance(operationName: string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            return withPerformanceTracking(operationName, () => originalMethod.apply(this, args));
        };

        return descriptor;
    };
}