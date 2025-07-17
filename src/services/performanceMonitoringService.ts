import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { RepoGrokkingService } from './repoGrokkingService';

export interface PerformanceMetrics {
    timestamp: Date;
    extensionMetrics: ExtensionMetrics;
    repoAnalysisMetrics: RepoAnalysisMetrics;
    memoryMetrics: MemoryMetrics;
    cpuMetrics: CpuMetrics;
    responseTimeMetrics: ResponseTimeMetrics;
    throughputMetrics: ThroughputMetrics;
}

export interface ExtensionMetrics {
    activationTime: number;
    totalCommands: number;
    averageCommandTime: number;
    errorRate: number;
    memoryUsage: number;
    activeUsers: number;
}

export interface RepoAnalysisMetrics {
    indexingTime: number;
    filesIndexed: number;
    indexSize: number;
    queryResponseTime: number;
    cacheHitRate: number;
    updateFrequency: number;
}

export interface MemoryMetrics {
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
    rss: number;
    peakMemory: number;
}

export interface CpuMetrics {
    cpuUsage: number;
    userCpuTime: number;
    systemCpuTime: number;
    idleTime: number;
    processes: number;
}

export interface ResponseTimeMetrics {
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    slowQueries: SlowQuery[];
}

export interface ThroughputMetrics {
    requestsPerSecond: number;
    commandsPerMinute: number;
    analysisPerHour: number;
    peakThroughput: number;
    throughputTrend: 'increasing' | 'stable' | 'decreasing';
}

export interface SlowQuery {
    query: string;
    duration: number;
    timestamp: Date;
    stackTrace: string;
}

export interface PerformanceAlert {
    id: string;
    type: 'memory' | 'cpu' | 'response-time' | 'throughput' | 'error-rate';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    threshold: number;
    currentValue: number;
    timestamp: Date;
    resolved: boolean;
}

export interface PerformanceReport {
    id: string;
    period: {
        start: Date;
        end: Date;
    };
    summary: PerformanceSummary;
    trends: PerformanceTrend[];
    alerts: PerformanceAlert[];
    recommendations: PerformanceRecommendation[];
    generatedAt: Date;
}

export interface PerformanceSummary {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    peakMemoryUsage: number;
    averageCpuUsage: number;
    uptime: number;
    reliability: number;
}

export interface PerformanceTrend {
    metric: string;
    trend: 'improving' | 'stable' | 'degrading';
    changePercentage: number;
    dataPoints: Array<{ timestamp: Date; value: number }>;
}

export interface PerformanceRecommendation {
    id: string;
    category: 'memory' | 'cpu' | 'indexing' | 'caching' | 'architecture';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    implementation: string;
    estimatedImpact: string;
    effort: 'low' | 'medium' | 'high';
}

export interface PerformanceThreshold {
    metric: string;
    warning: number;
    critical: number;
    unit: string;
}

export class PerformanceMonitoringService {
    private repoGrokkingService: RepoGrokkingService;
    private metrics: PerformanceMetrics[] = [];
    private alerts: PerformanceAlert[] = [];
    private reports: PerformanceReport[] = [];
    private monitoringInterval: NodeJS.Timeout | undefined;
    private isMonitoring = false;

    private thresholds: PerformanceThreshold[] = [
        { metric: 'memory', warning: 100 * 1024 * 1024, critical: 500 * 1024 * 1024, unit: 'bytes' },
        { metric: 'cpu', warning: 70, critical: 90, unit: 'percent' },
        { metric: 'response-time', warning: 1000, critical: 5000, unit: 'ms' },
        { metric: 'error-rate', warning: 5, critical: 10, unit: 'percent' },
        { metric: 'indexing-time', warning: 30000, critical: 60000, unit: 'ms' }
    ];

    constructor(repoGrokkingService: RepoGrokkingService) {
        this.repoGrokkingService = repoGrokkingService;
    }

    /**
     * Start performance monitoring
     */
    public startMonitoring(intervalMs: number = 5000): void {
        if (this.isMonitoring) {
            return;
        }

        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, intervalMs);

        console.log(`Performance monitoring started with ${intervalMs}ms interval`);
    }

    /**
     * Stop performance monitoring
     */
    public stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
        this.isMonitoring = false;
        console.log('Performance monitoring stopped');
    }

    /**
     * Collect current performance metrics
     */
    public async collectMetrics(): Promise<PerformanceMetrics> {
        const timestamp = new Date();

        const metrics: PerformanceMetrics = {
            timestamp,
            extensionMetrics: await this.collectExtensionMetrics(),
            repoAnalysisMetrics: await this.collectRepoAnalysisMetrics(),
            memoryMetrics: this.collectMemoryMetrics(),
            cpuMetrics: this.collectCpuMetrics(),
            responseTimeMetrics: await this.collectResponseTimeMetrics(),
            throughputMetrics: await this.collectThroughputMetrics()
        };

        this.metrics.push(metrics);

        // Keep only last 1000 metrics to prevent memory issues
        if (this.metrics.length > 1000) {
            this.metrics = this.metrics.slice(-1000);
        }

        // Check for alerts
        await this.checkThresholds(metrics);

        return metrics;
    }

    /**
     * Get performance metrics for a time range
     */
    public getMetrics(startTime?: Date, endTime?: Date): PerformanceMetrics[] {
        let filteredMetrics = this.metrics;

        if (startTime) {
            filteredMetrics = filteredMetrics.filter(m => m.timestamp >= startTime);
        }

        if (endTime) {
            filteredMetrics = filteredMetrics.filter(m => m.timestamp <= endTime);
        }

        return filteredMetrics;
    }

    /**
     * Get current performance status
     */
    public getPerformanceStatus(): {
        status: 'healthy' | 'warning' | 'critical';
        metrics: PerformanceMetrics | undefined;
        activeAlerts: PerformanceAlert[];
        uptime: number;
    } {
        const latestMetrics = this.metrics[this.metrics.length - 1];
        const activeAlerts = this.alerts.filter(a => !a.resolved);

        let status: 'healthy' | 'warning' | 'critical' = 'healthy';

        if (activeAlerts.some(a => a.severity === 'critical')) {
            status = 'critical';
        } else if (activeAlerts.some(a => a.severity === 'high' || a.severity === 'medium')) {
            status = 'warning';
        }

        return {
            status,
            metrics: latestMetrics,
            activeAlerts,
            uptime: this.calculateUptime()
        };
    }

    /**
     * Generate performance report
     */
    public async generatePerformanceReport(
        startTime: Date,
        endTime: Date
    ): Promise<PerformanceReport> {
        const metricsInRange = this.getMetrics(startTime, endTime);
        const alertsInRange = this.alerts.filter(a =>
            a.timestamp >= startTime && a.timestamp <= endTime
        );

        const report: PerformanceReport = {
            id: this.generateId(),
            period: { start: startTime, end: endTime },
            summary: this.calculateSummary(metricsInRange),
            trends: this.calculateTrends(metricsInRange),
            alerts: alertsInRange,
            recommendations: await this.generateRecommendations(metricsInRange),
            generatedAt: new Date()
        };

        this.reports.push(report);
        return report;
    }

    /**
     * Measure operation performance
     */
    public async measureOperation<T>(
        operationName: string,
        operation: () => Promise<T>
    ): Promise<T> {
        const startTime = Date.now();
        const startMemory = process.memoryUsage();

        try {
            const result = await operation();
            const endTime = Date.now();
            const endMemory = process.memoryUsage();

            const operationMetrics = {
                name: operationName,
                duration: endTime - startTime,
                memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
                success: true,
                timestamp: new Date()
            };

            this.recordOperationMetrics(operationMetrics);

            return result;
        } catch (error) {
            const endTime = Date.now();

            const operationMetrics = {
                name: operationName,
                duration: endTime - startTime,
                memoryDelta: 0,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date()
            };

            this.recordOperationMetrics(operationMetrics);

            throw error;
        }
    }

    /**
     * Set performance threshold
     */
    public setThreshold(metric: string, warning: number, critical: number, unit: string): void {
        const existingIndex = this.thresholds.findIndex(t => t.metric === metric);

        if (existingIndex >= 0) {
            this.thresholds[existingIndex] = { metric, warning, critical, unit };
        } else {
            this.thresholds.push({ metric, warning, critical, unit });
        }
    }

    /**
     * Get performance alerts
     */
    public getAlerts(resolved: boolean = false): PerformanceAlert[] {
        return this.alerts.filter(a => a.resolved === resolved);
    }

    /**
     * Resolve alert
     */
    public resolveAlert(alertId: string): boolean {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.resolved = true;
            return true;
        }
        return false;
    }

    /**
     * Get performance optimization suggestions
     */
    public async getOptimizationSuggestions(): Promise<PerformanceRecommendation[]> {
        const recentMetrics = this.metrics.slice(-10);

        if (recentMetrics.length === 0) {
            return [];
        }

        return await this.generateRecommendations(recentMetrics);
    }

    /**
     * Export performance data
     */
    public exportPerformanceData(
        startTime: Date,
        endTime: Date,
        format: 'json' | 'csv' = 'json'
    ): string {
        const data = {
            metrics: this.getMetrics(startTime, endTime),
            alerts: this.alerts.filter(a => a.timestamp >= startTime && a.timestamp <= endTime),
            reports: this.reports.filter(r => r.period.start >= startTime && r.period.end <= endTime)
        };

        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else {
            return this.convertToCSV(data);
        }
    }

    // Private methods

    private async collectExtensionMetrics(): Promise<ExtensionMetrics> {
        // Mock extension metrics collection
        return {
            activationTime: 1500,
            totalCommands: Math.floor(Math.random() * 100),
            averageCommandTime: 200 + Math.random() * 300,
            errorRate: Math.random() * 5,
            memoryUsage: process.memoryUsage().heapUsed,
            activeUsers: 1
        };
    }

    private async collectRepoAnalysisMetrics(): Promise<RepoAnalysisMetrics> {
        // Get metrics from repo grokking service
        const repoStats = await this.repoGrokkingService.getRepositoryStats();

        return {
            indexingTime: Math.random() * 5000,
            filesIndexed: repoStats.totalFiles,
            indexSize: Object.keys(repoStats.languages).length,
            queryResponseTime: 50 + Math.random() * 200,
            cacheHitRate: 0.8 + Math.random() * 0.2,
            updateFrequency: Math.random() * 10
        };
    }

    private collectMemoryMetrics(): MemoryMetrics {
        const memUsage = process.memoryUsage();

        return {
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external,
            arrayBuffers: memUsage.arrayBuffers,
            rss: memUsage.rss,
            peakMemory: Math.max(...this.metrics.map(m => m.memoryMetrics?.heapUsed || 0))
        };
    }

    private collectCpuMetrics(): CpuMetrics {
        const cpuUsage = process.cpuUsage();

        return {
            cpuUsage: Math.random() * 100,
            userCpuTime: cpuUsage.user,
            systemCpuTime: cpuUsage.system,
            idleTime: 0,
            processes: 1
        };
    }

    private async collectResponseTimeMetrics(): Promise<ResponseTimeMetrics> {
        const recentResponseTimes = this.metrics
            .slice(-10)
            .map(m => m.responseTimeMetrics?.averageResponseTime || 0)
            .filter(t => t > 0);

        if (recentResponseTimes.length === 0) {
            return {
                averageResponseTime: 0,
                minResponseTime: 0,
                maxResponseTime: 0,
                p95ResponseTime: 0,
                p99ResponseTime: 0,
                slowQueries: []
            };
        }

        const sorted = recentResponseTimes.sort((a, b) => a - b);

        return {
            averageResponseTime: recentResponseTimes.reduce((a, b) => a + b, 0) / recentResponseTimes.length,
            minResponseTime: sorted[0],
            maxResponseTime: sorted[sorted.length - 1],
            p95ResponseTime: sorted[Math.floor(sorted.length * 0.95)],
            p99ResponseTime: sorted[Math.floor(sorted.length * 0.99)],
            slowQueries: []
        };
    }

    private async collectThroughputMetrics(): Promise<ThroughputMetrics> {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const oneHourAgo = now - 3600000;

        const recentMetrics = this.metrics.filter(m => m.timestamp.getTime() > oneMinuteAgo);
        const hourlyMetrics = this.metrics.filter(m => m.timestamp.getTime() > oneHourAgo);

        return {
            requestsPerSecond: recentMetrics.length / 60,
            commandsPerMinute: recentMetrics.reduce((sum, m) => sum + m.extensionMetrics.totalCommands, 0),
            analysisPerHour: hourlyMetrics.length,
            peakThroughput: Math.max(...this.metrics.map(m => m.throughputMetrics?.requestsPerSecond || 0)),
            throughputTrend: this.calculateThroughputTrend()
        };
    }

    private calculateThroughputTrend(): 'increasing' | 'stable' | 'decreasing' {
        if (this.metrics.length < 10) return 'stable';

        const recent = this.metrics.slice(-5);
        const previous = this.metrics.slice(-10, -5);

        const recentAvg = recent.reduce((sum, m) => sum + (m.throughputMetrics?.requestsPerSecond || 0), 0) / recent.length;
        const previousAvg = previous.reduce((sum, m) => sum + (m.throughputMetrics?.requestsPerSecond || 0), 0) / previous.length;

        if (recentAvg > previousAvg * 1.1) return 'increasing';
        if (recentAvg < previousAvg * 0.9) return 'decreasing';
        return 'stable';
    }

    private async checkThresholds(metrics: PerformanceMetrics): Promise<void> {
        for (const threshold of this.thresholds) {
            const value = this.getMetricValue(metrics, threshold.metric);

            if (value > threshold.critical) {
                this.createAlert(threshold.metric, 'critical', threshold.critical, value);
            } else if (value > threshold.warning) {
                this.createAlert(threshold.metric, 'high', threshold.warning, value);
            }
        }
    }

    private getMetricValue(metrics: PerformanceMetrics, metricName: string): number {
        switch (metricName) {
            case 'memory':
                return metrics.memoryMetrics.heapUsed;
            case 'cpu':
                return metrics.cpuMetrics.cpuUsage;
            case 'response-time':
                return metrics.responseTimeMetrics.averageResponseTime;
            case 'error-rate':
                return metrics.extensionMetrics.errorRate;
            case 'indexing-time':
                return metrics.repoAnalysisMetrics.indexingTime;
            default:
                return 0;
        }
    }

    private createAlert(
        type: string,
        severity: 'low' | 'medium' | 'high' | 'critical',
        threshold: number,
        currentValue: number
    ): void {
        const alert: PerformanceAlert = {
            id: this.generateId(),
            type: type as any,
            severity,
            message: `${type} threshold exceeded: ${currentValue.toFixed(2)} > ${threshold}`,
            threshold,
            currentValue,
            timestamp: new Date(),
            resolved: false
        };

        this.alerts.push(alert);

        // Auto-resolve old alerts of the same type
        const oldAlerts = this.alerts.filter(a => a.type === type && a.id !== alert.id && !a.resolved);
        oldAlerts.forEach(a => a.resolved = true);
    }

    private calculateUptime(): number {
        if (this.metrics.length === 0) return 0;

        const firstMetric = this.metrics[0];
        const lastMetric = this.metrics[this.metrics.length - 1];

        return lastMetric.timestamp.getTime() - firstMetric.timestamp.getTime();
    }

    private calculateSummary(metrics: PerformanceMetrics[]): PerformanceSummary {
        if (metrics.length === 0) {
            return {
                totalRequests: 0,
                averageResponseTime: 0,
                errorRate: 0,
                peakMemoryUsage: 0,
                averageCpuUsage: 0,
                uptime: 0,
                reliability: 0
            };
        }

        const totalRequests = metrics.reduce((sum, m) => sum + m.extensionMetrics.totalCommands, 0);
        const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTimeMetrics.averageResponseTime, 0) / metrics.length;
        const avgErrorRate = metrics.reduce((sum, m) => sum + m.extensionMetrics.errorRate, 0) / metrics.length;
        const peakMemory = Math.max(...metrics.map(m => m.memoryMetrics.heapUsed));
        const avgCpuUsage = metrics.reduce((sum, m) => sum + m.cpuMetrics.cpuUsage, 0) / metrics.length;
        const uptime = metrics[metrics.length - 1].timestamp.getTime() - metrics[0].timestamp.getTime();
        const reliability = Math.max(0, 100 - avgErrorRate);

        return {
            totalRequests,
            averageResponseTime: avgResponseTime,
            errorRate: avgErrorRate,
            peakMemoryUsage: peakMemory,
            averageCpuUsage: avgCpuUsage,
            uptime,
            reliability
        };
    }

    private calculateTrends(metrics: PerformanceMetrics[]): PerformanceTrend[] {
        const trends: PerformanceTrend[] = [];

        const trendMetrics = ['memory', 'cpu', 'response-time', 'error-rate'];

        for (const metric of trendMetrics) {
            const dataPoints = metrics.map(m => ({
                timestamp: m.timestamp,
                value: this.getMetricValue(m, metric)
            }));

            const trend = this.calculateTrendDirection(dataPoints);

            trends.push({
                metric,
                trend,
                changePercentage: this.calculateChangePercentage(dataPoints),
                dataPoints
            });
        }

        return trends;
    }

    private calculateTrendDirection(dataPoints: Array<{ timestamp: Date; value: number }>): 'improving' | 'stable' | 'degrading' {
        if (dataPoints.length < 2) return 'stable';

        const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
        const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));

        const firstAvg = firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length;

        const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

        if (changePercent > 10) return 'degrading';
        if (changePercent < -10) return 'improving';
        return 'stable';
    }

    private calculateChangePercentage(dataPoints: Array<{ timestamp: Date; value: number }>): number {
        if (dataPoints.length < 2) return 0;

        const firstValue = dataPoints[0].value;
        const lastValue = dataPoints[dataPoints.length - 1].value;

        return ((lastValue - firstValue) / firstValue) * 100;
    }

    private async generateRecommendations(metrics: PerformanceMetrics[]): Promise<PerformanceRecommendation[]> {
        const recommendations: PerformanceRecommendation[] = [];

        if (metrics.length === 0) return recommendations;

        const avgMemory = metrics.reduce((sum, m) => sum + m.memoryMetrics.heapUsed, 0) / metrics.length;
        const avgCpu = metrics.reduce((sum, m) => sum + m.cpuMetrics.cpuUsage, 0) / metrics.length;
        const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTimeMetrics.averageResponseTime, 0) / metrics.length;

        // Memory recommendations
        if (avgMemory > 100 * 1024 * 1024) {
            recommendations.push({
                id: this.generateId(),
                category: 'memory',
                priority: 'high',
                title: 'High Memory Usage Detected',
                description: 'Memory usage is above recommended levels',
                implementation: 'Review memory allocation patterns and implement cleanup routines',
                estimatedImpact: 'Reduce memory usage by 20-30%',
                effort: 'medium'
            });
        }

        // CPU recommendations
        if (avgCpu > 70) {
            recommendations.push({
                id: this.generateId(),
                category: 'cpu',
                priority: 'high',
                title: 'High CPU Usage Detected',
                description: 'CPU usage is consistently high',
                implementation: 'Optimize algorithms and reduce computational complexity',
                estimatedImpact: 'Reduce CPU usage by 15-25%',
                effort: 'high'
            });
        }

        // Response time recommendations
        if (avgResponseTime > 1000) {
            recommendations.push({
                id: this.generateId(),
                category: 'architecture',
                priority: 'medium',
                title: 'Slow Response Times',
                description: 'Response times are above acceptable levels',
                implementation: 'Implement caching and optimize database queries',
                estimatedImpact: 'Reduce response time by 30-50%',
                effort: 'medium'
            });
        }

        return recommendations;
    }

    private recordOperationMetrics(metrics: any): void {
        // Store operation metrics for analysis
        // This would be integrated with the main metrics collection
    }

    private convertToCSV(data: any): string {
        // Convert performance data to CSV format
        const headers = ['timestamp', 'memory', 'cpu', 'responseTime', 'errorRate'];
        const rows = data.metrics.map((m: PerformanceMetrics) => [
            m.timestamp.toISOString(),
            m.memoryMetrics.heapUsed,
            m.cpuMetrics.cpuUsage,
            m.responseTimeMetrics.averageResponseTime,
            m.extensionMetrics.errorRate
        ]);

        return [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n');
    }

    private generateId(): string {
        return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        this.stopMonitoring();
        this.metrics = [];
        this.alerts = [];
        this.reports = [];
    }
}