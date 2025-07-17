import * as vscode from 'vscode';
import { AIService } from '../services/aiService';
import { ValidationFrameworkService } from '../services/validationFrameworkService';
import { CoffeeModeService } from '../services/coffeeModeService';

export interface FeedbackItem {
    id: string;
    type: 'validation' | 'suggestion' | 'progress' | 'success' | 'error' | 'warning';
    title: string;
    message: string;
    file?: string;
    line?: number;
    column?: number;
    severity: 'info' | 'warning' | 'error';
    timestamp: Date;
    dismissible: boolean;
    actions?: FeedbackAction[];
}

export interface FeedbackAction {
    title: string;
    command: string;
    args?: any[];
}

export interface ProgressFeedback {
    id: string;
    title: string;
    message: string;
    progress: number; // 0-100
    cancellable: boolean;
    onCancel?: () => void;
}

export interface ValidationFeedback {
    file: string;
    issues: {
        line: number;
        column: number;
        severity: 'error' | 'warning' | 'info';
        message: string;
        quickFix?: string;
    }[];
}

export class RealTimeFeedbackUI {
    private aiService: AIService;
    private validationService: ValidationFrameworkService;
    private coffeeModeService: CoffeeModeService;

    private feedbackPanel: vscode.WebviewPanel | undefined;
    private statusBarItems: Map<string, vscode.StatusBarItem> = new Map();
    private activeProgress: Map<string, ProgressFeedback> = new Map();
    private diagnosticCollection: vscode.DiagnosticCollection;
    private feedbackItems: Map<string, FeedbackItem> = new Map();

    private documentChangeListener: vscode.Disposable | undefined;
    private workspaceWatcher: vscode.FileSystemWatcher | undefined;

    constructor(
        aiService: AIService,
        validationService: ValidationFrameworkService,
        coffeeModeService: CoffeeModeService
    ) {
        this.aiService = aiService;
        this.validationService = validationService;
        this.coffeeModeService = coffeeModeService;

        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('kalai-agent');
        this.initializeFeedbackSystem();
    }

    /**
     * Initialize the feedback system
     */
    private initializeFeedbackSystem(): void {
        // Listen for document changes
        this.documentChangeListener = vscode.workspace.onDidChangeTextDocument(
            this.handleDocumentChange.bind(this)
        );

        // Listen for file system changes
        this.workspaceWatcher = vscode.workspace.createFileSystemWatcher('**/*');
        this.workspaceWatcher.onDidChange(this.handleFileChange.bind(this));
        this.workspaceWatcher.onDidCreate(this.handleFileCreate.bind(this));
        this.workspaceWatcher.onDidDelete(this.handleFileDelete.bind(this));

        // Listen for active editor changes
        vscode.window.onDidChangeActiveTextEditor(this.handleEditorChange.bind(this));

        // Initialize status bar items
        this.createStatusBarItems();
    }

    /**
     * Show real-time feedback panel
     */
    public showFeedbackPanel(): void {
        if (this.feedbackPanel) {
            this.feedbackPanel.reveal();
            return;
        }

        this.feedbackPanel = vscode.window.createWebviewPanel(
            'kalai-feedback',
            'Kalai Real-Time Feedback',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.feedbackPanel.webview.html = this.getFeedbackPanelContent();
        this.feedbackPanel.webview.onDidReceiveMessage(this.handleWebviewMessage.bind(this));

        this.feedbackPanel.onDidDispose(() => {
            this.feedbackPanel = undefined;
        });

        // Send initial data
        this.updateFeedbackPanel();
    }

    /**
     * Get feedback panel HTML content
     */
    private getFeedbackPanelContent(): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kalai Real-Time Feedback</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
            padding: 16px;
        }

        .feedback-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
            max-width: 100%;
        }

        .feedback-header {
            display: flex;
            justify-content: between;
            align-items: center;
            padding: 12px;
            background: var(--vscode-panel-background);
            border-radius: 6px;
            border: 1px solid var(--vscode-panel-border);
        }

        .feedback-title {
            font-size: 16px;
            font-weight: 600;
            margin: 0;
        }

        .feedback-controls {
            display: flex;
            gap: 8px;
        }

        .control-button {
            padding: 4px 8px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }

        .control-button:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .feedback-sections {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .feedback-section {
            background: var(--vscode-panel-background);
            border-radius: 6px;
            border: 1px solid var(--vscode-panel-border);
            overflow: hidden;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: var(--vscode-tab-activeBackground);
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .section-title {
            font-size: 14px;
            font-weight: 500;
            margin: 0;
        }

        .section-badge {
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 600;
        }

        .section-content {
            padding: 16px;
        }

        .feedback-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px;
            margin-bottom: 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .feedback-item:hover {
            background: var(--vscode-list-hoverBackground);
        }

        .feedback-item.error {
            border-left: 3px solid var(--vscode-errorForeground);
        }

        .feedback-item.warning {
            border-left: 3px solid var(--vscode-warningForeground);
        }

        .feedback-item.info {
            border-left: 3px solid var(--vscode-infoForeground);
        }

        .feedback-item.success {
            border-left: 3px solid var(--vscode-charts-green);
        }

        .feedback-icon {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
            margin-top: 2px;
        }

        .feedback-content {
            flex: 1;
        }

        .feedback-title-item {
            font-size: 13px;
            font-weight: 500;
            margin: 0 0 4px 0;
        }

        .feedback-message {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin: 0 0 4px 0;
            line-height: 1.4;
        }

        .feedback-meta {
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            margin: 0;
        }

        .feedback-actions {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }

        .feedback-action {
            padding: 4px 8px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
        }

        .feedback-action:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .progress-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            margin-bottom: 8px;
            border-radius: 4px;
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
        }

        .progress-info {
            flex: 1;
        }

        .progress-title {
            font-size: 13px;
            font-weight: 500;
            margin: 0 0 4px 0;
        }

        .progress-message {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin: 0 0 8px 0;
        }

        .progress-bar {
            width: 100%;
            height: 4px;
            background: var(--vscode-progressBar-background);
            border-radius: 2px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: var(--vscode-progressBar-foreground);
            transition: width 0.3s ease;
        }

        .progress-cancel {
            padding: 4px 8px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
        }

        .empty-state {
            text-align: center;
            padding: 32px;
            color: var(--vscode-descriptionForeground);
        }

        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }

        .empty-state-message {
            font-size: 14px;
            margin: 0;
        }

        .collapsible {
            transition: max-height 0.3s ease;
            overflow: hidden;
        }

        .collapsed {
            max-height: 0;
        }

        .expanded {
            max-height: 1000px;
        }
    </style>
</head>
<body>
    <div class="feedback-container">
        <div class="feedback-header">
            <h1 class="feedback-title">🔄 Real-Time Feedback</h1>
            <div class="feedback-controls">
                <button class="control-button" onclick="clearAll()">Clear All</button>
                <button class="control-button" onclick="refresh()">Refresh</button>
                <button class="control-button" onclick="toggleAutoRefresh()">Auto-Refresh</button>
            </div>
        </div>

        <div class="feedback-sections">
            <!-- Progress Section -->
            <div class="feedback-section">
                <div class="section-header" onclick="toggleSection('progress')">
                    <h3 class="section-title">⏳ Active Progress</h3>
                    <span class="section-badge" id="progressBadge">0</span>
                </div>
                <div class="section-content collapsible expanded" id="progressContent">
                    <div id="progressItems"></div>
                </div>
            </div>

            <!-- Validation Section -->
            <div class="feedback-section">
                <div class="section-header" onclick="toggleSection('validation')">
                    <h3 class="section-title">🔍 Validation Results</h3>
                    <span class="section-badge" id="validationBadge">0</span>
                </div>
                <div class="section-content collapsible expanded" id="validationContent">
                    <div id="validationItems"></div>
                </div>
            </div>

            <!-- Suggestions Section -->
            <div class="feedback-section">
                <div class="section-header" onclick="toggleSection('suggestions')">
                    <h3 class="section-title">💡 AI Suggestions</h3>
                    <span class="section-badge" id="suggestionsBadge">0</span>
                </div>
                <div class="section-content collapsible expanded" id="suggestionsContent">
                    <div id="suggestionsItems"></div>
                </div>
            </div>

            <!-- Coffee Mode Section -->
            <div class="feedback-section">
                <div class="section-header" onclick="toggleSection('coffee')">
                    <h3 class="section-title">☕ Coffee Mode Activity</h3>
                    <span class="section-badge" id="coffeeBadge">0</span>
                </div>
                <div class="section-content collapsible expanded" id="coffeeContent">
                    <div id="coffeeItems"></div>
                </div>
            </div>

            <!-- Recent Activity Section -->
            <div class="feedback-section">
                <div class="section-header" onclick="toggleSection('recent')">
                    <h3 class="section-title">📋 Recent Activity</h3>
                    <span class="section-badge" id="recentBadge">0</span>
                </div>
                <div class="section-content collapsible expanded" id="recentContent">
                    <div id="recentItems"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let autoRefresh = true;
        let autoRefreshInterval;

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            startAutoRefresh();
            requestUpdate();
        });

        // Handle messages from extension
        window.addEventListener('message', (event) => {
            const message = event.data;

            switch (message.type) {
                case 'updateFeedback':
                    updateFeedback(message.data);
                    break;
                case 'addFeedbackItem':
                    addFeedbackItem(message.data);
                    break;
                case 'removeFeedbackItem':
                    removeFeedbackItem(message.data.id);
                    break;
                case 'updateProgress':
                    updateProgress(message.data);
                    break;
                case 'removeProgress':
                    removeProgress(message.data.id);
                    break;
            }
        });

        function updateFeedback(data) {
            updateProgressItems(data.progress || []);
            updateValidationItems(data.validation || []);
            updateSuggestionItems(data.suggestions || []);
            updateCoffeeItems(data.coffee || []);
            updateRecentItems(data.recent || []);
        }

        function updateProgressItems(items) {
            const container = document.getElementById('progressItems');
            const badge = document.getElementById('progressBadge');

            badge.textContent = items.length;

            if (items.length === 0) {
                container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div><p class="empty-state-message">No active progress</p></div>';
                return;
            }

            container.innerHTML = items.map(item =>
                \`<div class="progress-item">
                    <div class="progress-info">
                        <div class="progress-title">\${item.title}</div>
                        <div class="progress-message">\${item.message}</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: \${item.progress}%"></div>
                        </div>
                    </div>
                    \${item.cancellable ? \`<button class="progress-cancel" onclick="cancelProgress('\${item.id}')">Cancel</button>\` : ''}
                </div>\`
            ).join('');
        }

        function updateValidationItems(items) {
            const container = document.getElementById('validationItems');
            const badge = document.getElementById('validationBadge');

            badge.textContent = items.length;

            if (items.length === 0) {
                container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><p class="empty-state-message">No validation issues</p></div>';
                return;
            }

            container.innerHTML = items.map(item =>
                \`<div class="feedback-item \${item.severity}" onclick="goToLocation('\${item.file}', \${item.line}, \${item.column})">
                    <div class="feedback-icon">\${getIcon(item.severity)}</div>
                    <div class="feedback-content">
                        <div class="feedback-title-item">\${item.title}</div>
                        <div class="feedback-message">\${item.message}</div>
                        <div class="feedback-meta">\${item.file}:\${item.line}:\${item.column}</div>
                        \${item.actions ? \`<div class="feedback-actions">\${item.actions.map(action => \`<button class="feedback-action" onclick="executeAction('\${action.command}', \${JSON.stringify(action.args || [])})">\${action.title}</button>\`).join('')}</div>\` : ''}
                    </div>
                </div>\`
            ).join('');
        }

        function updateSuggestionItems(items) {
            const container = document.getElementById('suggestionsItems');
            const badge = document.getElementById('suggestionsBadge');

            badge.textContent = items.length;

            if (items.length === 0) {
                container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💡</div><p class="empty-state-message">No suggestions available</p></div>';
                return;
            }

            container.innerHTML = items.map(item =>
                \`<div class="feedback-item info">
                    <div class="feedback-icon">💡</div>
                    <div class="feedback-content">
                        <div class="feedback-title-item">\${item.title}</div>
                        <div class="feedback-message">\${item.message}</div>
                        <div class="feedback-meta">\${item.file ? \`\${item.file}:\${item.line || 0}\` : 'General'}</div>
                        \${item.actions ? \`<div class="feedback-actions">\${item.actions.map(action => \`<button class="feedback-action" onclick="executeAction('\${action.command}', \${JSON.stringify(action.args || [])})">\${action.title}</button>\`).join('')}</div>\` : ''}
                    </div>
                </div>\`
            ).join('');
        }

        function updateCoffeeItems(items) {
            const container = document.getElementById('coffeeItems');
            const badge = document.getElementById('coffeeBadge');

            badge.textContent = items.length;

            if (items.length === 0) {
                container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">☕</div><p class="empty-state-message">Coffee Mode inactive</p></div>';
                return;
            }

            container.innerHTML = items.map(item =>
                \`<div class="feedback-item \${item.type}">
                    <div class="feedback-icon">☕</div>
                    <div class="feedback-content">
                        <div class="feedback-title-item">\${item.title}</div>
                        <div class="feedback-message">\${item.message}</div>
                        <div class="feedback-meta">\${item.timestamp}</div>
                        \${item.actions ? \`<div class="feedback-actions">\${item.actions.map(action => \`<button class="feedback-action" onclick="executeAction('\${action.command}', \${JSON.stringify(action.args || [])})">\${action.title}</button>\`).join('')}</div>\` : ''}
                    </div>
                </div>\`
            ).join('');
        }

        function updateRecentItems(items) {
            const container = document.getElementById('recentItems');
            const badge = document.getElementById('recentBadge');

            badge.textContent = items.length;

            if (items.length === 0) {
                container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p class="empty-state-message">No recent activity</p></div>';
                return;
            }

            container.innerHTML = items.map(item =>
                \`<div class="feedback-item \${item.severity}">
                    <div class="feedback-icon">\${getIcon(item.type)}</div>
                    <div class="feedback-content">
                        <div class="feedback-title-item">\${item.title}</div>
                        <div class="feedback-message">\${item.message}</div>
                        <div class="feedback-meta">\${formatTime(item.timestamp)}</div>
                    </div>
                </div>\`
            ).join('');
        }

        function getIcon(type) {
            const icons = {
                'error': '❌',
                'warning': '⚠️',
                'info': 'ℹ️',
                'success': '✅',
                'validation': '🔍',
                'suggestion': '💡',
                'progress': '⏳'
            };
            return icons[type] || 'ℹ️';
        }

        function formatTime(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleTimeString();
        }

        function toggleSection(sectionId) {
            const content = document.getElementById(sectionId + 'Content');
            const isExpanded = content.classList.contains('expanded');

            if (isExpanded) {
                content.classList.remove('expanded');
                content.classList.add('collapsed');
            } else {
                content.classList.remove('collapsed');
                content.classList.add('expanded');
            }
        }

        function clearAll() {
            vscode.postMessage({ type: 'clearAll' });
        }

        function refresh() {
            requestUpdate();
        }

        function toggleAutoRefresh() {
            autoRefresh = !autoRefresh;
            if (autoRefresh) {
                startAutoRefresh();
            } else {
                stopAutoRefresh();
            }
        }

        function startAutoRefresh() {
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
            }
            autoRefreshInterval = setInterval(requestUpdate, 5000);
        }

        function stopAutoRefresh() {
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                autoRefreshInterval = null;
            }
        }

        function requestUpdate() {
            vscode.postMessage({ type: 'requestUpdate' });
        }

        function goToLocation(file, line, column) {
            vscode.postMessage({
                type: 'goToLocation',
                data: { file, line, column }
            });
        }

        function executeAction(command, args) {
            vscode.postMessage({
                type: 'executeAction',
                data: { command, args }
            });
        }

        function cancelProgress(id) {
            vscode.postMessage({
                type: 'cancelProgress',
                data: { id }
            });
        }
    </script>
</body>
</html>
`;
    }

    /**
     * Handle document changes for real-time validation
     */
    private async handleDocumentChange(event: vscode.TextDocumentChangeEvent): Promise<void> {
        if (event.document.uri.scheme !== 'file') return;

        const filePath = event.document.uri.fsPath;

        // Debounce validation
        setTimeout(async () => {
            await this.validateDocument(event.document);
        }, 500);
    }

    /**
     * Validate document and show real-time feedback
     */
    private async validateDocument(document: vscode.TextDocument): Promise<void> {
        const filePath = document.uri.fsPath;
        const content = document.getText();

        try {
            const validation = await this.validationService.validateCode(filePath, content);

            // Update diagnostics
            const diagnostics: vscode.Diagnostic[] = validation.errors.map(error => ({
                range: new vscode.Range(
                    Math.max(0, error.line - 1),
                    Math.max(0, error.column),
                    Math.max(0, error.line - 1),
                    Math.max(0, error.column + 10)
                ),
                message: error.message,
                severity: this.convertSeverity(error.severity),
                source: 'Kalai Agent',
                code: error.type
            }));

            this.diagnosticCollection.set(document.uri, diagnostics);

            // Update feedback panel
            this.updateValidationFeedback(filePath, validation);

            // Show suggestions
            if (validation.suggestions.length > 0) {
                this.showSuggestions(validation.suggestions);
            }

        } catch (error) {
            console.error('Real-time validation failed:', error);
        }
    }

    /**
     * Handle file changes
     */
    private async handleFileChange(uri: vscode.Uri): Promise<void> {
        const filePath = uri.fsPath;

        // Update feedback
        this.addFeedbackItem({
            id: this.generateId(),
            type: 'progress',
            title: 'File Changed',
            message: `File modified: ${vscode.workspace.asRelativePath(filePath)}`,
            file: filePath,
            severity: 'info',
            timestamp: new Date(),
            dismissible: true
        });

        // Trigger validation if it's a code file
        if (this.isCodeFile(filePath)) {
            const document = await vscode.workspace.openTextDocument(uri);
            await this.validateDocument(document);
        }
    }

    /**
     * Handle file creation
     */
    private async handleFileCreate(uri: vscode.Uri): Promise<void> {
        const filePath = uri.fsPath;

        this.addFeedbackItem({
            id: this.generateId(),
            type: 'success',
            title: 'File Created',
            message: `New file: ${vscode.workspace.asRelativePath(filePath)}`,
            file: filePath,
            severity: 'info',
            timestamp: new Date(),
            dismissible: true
        });
    }

    /**
     * Handle file deletion
     */
    private async handleFileDelete(uri: vscode.Uri): Promise<void> {
        const filePath = uri.fsPath;

        this.addFeedbackItem({
            id: this.generateId(),
            type: 'warning',
            title: 'File Deleted',
            message: `File removed: ${vscode.workspace.asRelativePath(filePath)}`,
            file: filePath,
            severity: 'warning',
            timestamp: new Date(),
            dismissible: true
        });

        // Clear diagnostics for deleted file
        this.diagnosticCollection.delete(uri);
    }

    /**
     * Handle active editor changes
     */
    private async handleEditorChange(editor: vscode.TextEditor | undefined): Promise<void> {
        if (!editor) return;

        const filePath = editor.document.uri.fsPath;

        // Validate new active file
        await this.validateDocument(editor.document);

        // Show AI suggestions for current file
        this.showAISuggestions(filePath);
    }

    /**
     * Show AI suggestions for current file
     */
    private async showAISuggestions(filePath: string): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(filePath);
            const content = document.getText();

            // Get AI suggestions (simplified)
            const suggestions = await this.getAISuggestions(content, filePath);

            for (const suggestion of suggestions) {
                this.addFeedbackItem({
                    id: this.generateId(),
                    type: 'suggestion',
                    title: suggestion.title,
                    message: suggestion.message,
                    file: filePath,
                    line: suggestion.line,
                    severity: 'info',
                    timestamp: new Date(),
                    dismissible: true,
                    actions: [{
                        title: 'Apply',
                        command: 'kalai-agent.applySuggestion',
                        args: [suggestion]
                    }]
                });
            }

        } catch (error) {
            console.error('Failed to get AI suggestions:', error);
        }
    }

    /**
     * Get AI suggestions for content
     */
    private async getAISuggestions(content: string, filePath: string): Promise<any[]> {
        // This would use the AI service to get suggestions
        // For now, return mock suggestions
        return [
            {
                title: 'Optimize Performance',
                message: 'Consider using array methods instead of for loops',
                line: 10,
                implementation: 'Use .map() or .filter() for better readability'
            }
        ];
    }

    /**
     * Create status bar items
     */
    private createStatusBarItems(): void {
        // Validation status
        const validationStatus = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            90
        );
        validationStatus.text = '$(check) Validation: OK';
        validationStatus.command = 'kalai-agent.showValidationResults';
        validationStatus.show();
        this.statusBarItems.set('validation', validationStatus);

        // Coffee Mode status
        const coffeeStatus = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            89
        );
        coffeeStatus.text = '$(coffee) Coffee Mode: Ready';
        coffeeStatus.command = 'kalai-agent.showCoffeeModeStatus';
        coffeeStatus.show();
        this.statusBarItems.set('coffee', coffeeStatus);
    }

    /**
     * Update feedback panel
     */
    private updateFeedbackPanel(): void {
        if (!this.feedbackPanel) return;

        const data = {
            progress: Array.from(this.activeProgress.values()),
            validation: this.getValidationFeedback(),
            suggestions: this.getSuggestionFeedback(),
            coffee: this.getCoffeeFeedback(),
            recent: this.getRecentFeedback()
        };

        this.feedbackPanel.webview.postMessage({
            type: 'updateFeedback',
            data
        });
    }

    /**
     * Handle webview messages
     */
    private async handleWebviewMessage(message: any): Promise<void> {
        switch (message.type) {
            case 'requestUpdate':
                this.updateFeedbackPanel();
                break;

            case 'goToLocation':
                await this.goToLocation(message.data.file, message.data.line, message.data.column);
                break;

            case 'executeAction':
                await vscode.commands.executeCommand(message.data.command, ...message.data.args);
                break;

            case 'cancelProgress':
                this.cancelProgress(message.data.id);
                break;

            case 'clearAll':
                this.clearAllFeedback();
                break;
        }
    }

    /**
     * Go to specific location in code
     */
    private async goToLocation(file: string, line: number, column: number): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(file);
            const editor = await vscode.window.showTextDocument(document);

            const position = new vscode.Position(Math.max(0, line - 1), Math.max(0, column));
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
        } catch (error) {
            console.error('Failed to go to location:', error);
        }
    }

    /**
     * Add feedback item
     */
    public addFeedbackItem(item: FeedbackItem): void {
        this.feedbackItems.set(item.id, item);

        if (this.feedbackPanel) {
            this.feedbackPanel.webview.postMessage({
                type: 'addFeedbackItem',
                data: item
            });
        }

        // Update status bar
        this.updateStatusBar();
    }

    /**
     * Remove feedback item
     */
    public removeFeedbackItem(id: string): void {
        this.feedbackItems.delete(id);

        if (this.feedbackPanel) {
            this.feedbackPanel.webview.postMessage({
                type: 'removeFeedbackItem',
                data: { id }
            });
        }

        this.updateStatusBar();
    }

    /**
     * Show progress
     */
    public showProgress(progress: ProgressFeedback): void {
        this.activeProgress.set(progress.id, progress);

        if (this.feedbackPanel) {
            this.feedbackPanel.webview.postMessage({
                type: 'updateProgress',
                data: progress
            });
        }
    }

    /**
     * Update progress
     */
    public updateProgress(id: string, progress: number, message?: string): void {
        const item = this.activeProgress.get(id);
        if (item) {
            item.progress = progress;
            if (message) {
                item.message = message;
            }

            if (this.feedbackPanel) {
                this.feedbackPanel.webview.postMessage({
                    type: 'updateProgress',
                    data: item
                });
            }
        }
    }

    /**
     * Remove progress
     */
    public removeProgress(id: string): void {
        this.activeProgress.delete(id);

        if (this.feedbackPanel) {
            this.feedbackPanel.webview.postMessage({
                type: 'removeProgress',
                data: { id }
            });
        }
    }

    /**
     * Cancel progress
     */
    private cancelProgress(id: string): void {
        const progress = this.activeProgress.get(id);
        if (progress && progress.onCancel) {
            progress.onCancel();
        }
        this.removeProgress(id);
    }

    // Helper methods
    private convertSeverity(severity: string): vscode.DiagnosticSeverity {
        switch (severity) {
            case 'error': return vscode.DiagnosticSeverity.Error;
            case 'warning': return vscode.DiagnosticSeverity.Warning;
            case 'info': return vscode.DiagnosticSeverity.Information;
            default: return vscode.DiagnosticSeverity.Information;
        }
    }

    private updateValidationFeedback(filePath: string, validation: any): void {
        // Update validation feedback in the panel
        this.updateFeedbackPanel();
    }

    private showSuggestions(suggestions: any[]): void {
        // Show suggestions in the feedback panel
        this.updateFeedbackPanel();
    }

    private generateId(): string {
        return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private isCodeFile(filePath: string): boolean {
        const codeExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.cs', '.php'];
        return codeExtensions.some(ext => filePath.endsWith(ext));
    }

    private getValidationFeedback(): any[] {
        return Array.from(this.feedbackItems.values())
            .filter(item => item.type === 'validation')
            .map(item => ({
                id: item.id,
                title: item.title,
                message: item.message,
                file: item.file,
                line: item.line,
                column: item.column,
                severity: item.severity,
                actions: item.actions
            }));
    }

    private getSuggestionFeedback(): any[] {
        return Array.from(this.feedbackItems.values())
            .filter(item => item.type === 'suggestion')
            .map(item => ({
                id: item.id,
                title: item.title,
                message: item.message,
                file: item.file,
                line: item.line,
                actions: item.actions
            }));
    }

    private getCoffeeFeedback(): any[] {
        const coffeeStatus = this.coffeeModeService.getStatus();
        const activeTasks = this.coffeeModeService.getActiveTasks();

        return activeTasks.map(task => ({
            id: task.id,
            title: task.name,
            message: task.description,
            type: task.status,
            timestamp: task.createdAt.toISOString(),
            actions: [
                {
                    title: 'View Details',
                    command: 'kalai-agent.viewCoffeeModeTask',
                    args: [task.id]
                }
            ]
        }));
    }

    private getRecentFeedback(): any[] {
        return Array.from(this.feedbackItems.values())
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10)
            .map(item => ({
                id: item.id,
                title: item.title,
                message: item.message,
                type: item.type,
                severity: item.severity,
                timestamp: item.timestamp.toISOString()
            }));
    }

    private updateStatusBar(): void {
        const validationErrors = Array.from(this.feedbackItems.values())
            .filter(item => item.type === 'validation' && item.severity === 'error').length;

        const validationStatus = this.statusBarItems.get('validation');
        if (validationStatus) {
            if (validationErrors > 0) {
                validationStatus.text = `$(error) Validation: ${validationErrors} errors`;
                validationStatus.color = new vscode.ThemeColor('errorForeground');
            } else {
                validationStatus.text = '$(check) Validation: OK';
                validationStatus.color = new vscode.ThemeColor('charts.green');
            }
        }

        const coffeeStatus = this.statusBarItems.get('coffee');
        if (coffeeStatus) {
            const coffeeMode = this.coffeeModeService.getStatus();
            if (coffeeMode.enabled) {
                coffeeStatus.text = `$(coffee) Coffee Mode: ${coffeeMode.activeTasks} active`;
                coffeeStatus.color = new vscode.ThemeColor('charts.orange');
            } else {
                coffeeStatus.text = '$(coffee) Coffee Mode: Ready';
                coffeeStatus.color = undefined;
            }
        }
    }

    private clearAllFeedback(): void {
        this.feedbackItems.clear();
        this.updateFeedbackPanel();
        this.updateStatusBar();
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        this.documentChangeListener?.dispose();
        this.workspaceWatcher?.dispose();
        this.feedbackPanel?.dispose();
        this.diagnosticCollection.dispose();

        this.statusBarItems.forEach(item => item.dispose());
        this.statusBarItems.clear();
    }
}