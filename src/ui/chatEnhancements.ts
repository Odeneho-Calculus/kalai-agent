import * as vscode from 'vscode';
import { AIService } from '../services/aiService';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: {
        mode?: string;
        capabilities?: string[];
        processingTime?: number;
        confidence?: number;
        sources?: string[];
    };
}

export interface ChatEnhancementState {
    messages: ChatMessage[];
    isProcessing: boolean;
    currentMode: string;
    capabilities: any;
    sessionStartTime: Date;
}

export class ChatEnhancements {
    private aiService: AIService;
    private state: ChatEnhancementState;
    private messageIdCounter = 0;

    constructor(aiService: AIService) {
        this.aiService = aiService;
        this.state = {
            messages: [],
            isProcessing: false,
            currentMode: aiService.getCurrentMode(),
            capabilities: aiService.getCapabilities(),
            sessionStartTime: new Date()
        };
    }

    /**
     * Get enhanced webview content with new UI features
     */
    public getEnhancedWebviewContent(extensionUri: vscode.Uri): string {
        const scriptUri = vscode.Uri.joinPath(extensionUri, 'out', 'webview.js');
        const styleUri = vscode.Uri.joinPath(extensionUri, 'out', 'webview.css');

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kalai Agent Chat</title>
    <link href="${styleUri}" rel="stylesheet">
    <style>
        .chat-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }

        .chat-header {
            display: flex;
            align-items: center;
            padding: 8px 16px;
            border-bottom: 1px solid var(--vscode-panel-border);
            background: var(--vscode-panel-background);
        }

        .mode-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }

        .mode-badge {
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
        }

        .mode-chat { background: var(--vscode-button-background); }
        .mode-coding-agent { background: var(--vscode-button-secondaryBackground); }
        .mode-coffee { background: var(--vscode-notificationsWarningIcon-foreground); }

        .capabilities-indicator {
            margin-left: auto;
            display: flex;
            gap: 4px;
        }

        .capability-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--vscode-charts-green);
        }

        .capability-dot.disabled {
            background: var(--vscode-charts-gray);
        }

        .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .message {
            display: flex;
            flex-direction: column;
            max-width: 80%;
            word-wrap: break-word;
        }

        .message.user {
            align-self: flex-end;
            align-items: flex-end;
        }

        .message.assistant {
            align-self: flex-start;
            align-items: flex-start;
        }

        .message-content {
            padding: 12px 16px;
            border-radius: 8px;
            white-space: pre-wrap;
            line-height: 1.4;
        }

        .message.user .message-content {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .message.assistant .message-content {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
        }

        .message-metadata {
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
            display: flex;
            gap: 12px;
        }

        .processing-indicator {
            display: none;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: var(--vscode-panel-background);
            border-top: 1px solid var(--vscode-panel-border);
        }

        .processing-indicator.active {
            display: flex;
        }

        .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid var(--vscode-progressBar-background);
            border-top: 2px solid var(--vscode-progressBar-foreground);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .input-container {
            padding: 16px;
            border-top: 1px solid var(--vscode-panel-border);
            background: var(--vscode-panel-background);
        }

        .input-wrapper {
            display: flex;
            gap: 8px;
            align-items: flex-end;
        }

        .input-field {
            flex: 1;
            min-height: 60px;
            max-height: 120px;
            padding: 8px 12px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: var(--vscode-font-family);
            font-size: 13px;
            resize: vertical;
        }

        .send-button {
            padding: 8px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }

        .send-button:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .quick-actions {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }

        .quick-action {
            padding: 4px 8px;
            font-size: 10px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }

        .quick-action:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .session-info {
            position: absolute;
            top: 8px;
            right: 8px;
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <div class="mode-indicator">
                <span class="mode-badge" id="modeIndicator">Chat</span>
                <span id="modeDescription">Interactive chat mode</span>
            </div>
            <div class="capabilities-indicator" id="capabilitiesIndicator">
                <!-- Capability dots will be added here -->
            </div>
        </div>

        <div class="session-info" id="sessionInfo">
            Session: 0 messages, 0 min
        </div>

        <div class="messages-container" id="messagesContainer">
            <!-- Messages will be added here -->
        </div>

        <div class="processing-indicator" id="processingIndicator">
            <div class="spinner"></div>
            <span>Kalai is thinking...</span>
        </div>

        <div class="input-container">
            <div class="input-wrapper">
                <textarea
                    id="messageInput"
                    class="input-field"
                    placeholder="Ask Kalai anything..."
                    rows="3"
                ></textarea>
                <button id="sendButton" class="send-button">Send</button>
            </div>
            <div class="quick-actions">
                <button class="quick-action" onclick="insertQuickAction('Explain this code')">Explain</button>
                <button class="quick-action" onclick="insertQuickAction('Generate tests for this')">Test</button>
                <button class="quick-action" onclick="insertQuickAction('Refactor this code')">Refactor</button>
                <button class="quick-action" onclick="insertQuickAction('Find bugs in this')">Debug</button>
                <button class="quick-action" onclick="insertQuickAction('Optimize this code')">Optimize</button>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let isProcessing = false;
        let sessionStartTime = new Date();
        let messageCount = 0;

        // Get DOM elements
        const messagesContainer = document.getElementById('messagesContainer');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const processingIndicator = document.getElementById('processingIndicator');
        const modeIndicator = document.getElementById('modeIndicator');
        const modeDescription = document.getElementById('modeDescription');
        const capabilitiesIndicator = document.getElementById('capabilitiesIndicator');
        const sessionInfo = document.getElementById('sessionInfo');

        // Initialize
        updateSessionInfo();
        setInterval(updateSessionInfo, 30000); // Update every 30 seconds

        // Event listeners
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        sendButton.addEventListener('click', sendMessage);

        // Listen for messages from extension
        window.addEventListener('message', (event) => {
            const message = event.data;

            switch (message.type) {
                case 'addMessage':
                    addMessage(message.data);
                    break;
                case 'updateState':
                    updateState(message.data);
                    break;
                case 'showProcessing':
                    showProcessing(message.data.message);
                    break;
                case 'hideProcessing':
                    hideProcessing();
                    break;
                case 'updateMode':
                    updateMode(message.data);
                    break;
                case 'updateCapabilities':
                    updateCapabilities(message.data);
                    break;
            }
        });

        function sendMessage() {
            if (isProcessing) return;

            const text = messageInput.value.trim();
            if (!text) return;

            // Add user message
            addMessage({
                id: Date.now().toString(),
                role: 'user',
                content: text,
                timestamp: new Date()
            });

            // Clear input
            messageInput.value = '';

            // Show processing
            showProcessing('Kalai is thinking...');

            // Send to extension
            vscode.postMessage({
                type: 'sendMessage',
                data: { text }
            });

            messageCount++;
            updateSessionInfo();
        }

        function addMessage(message) {
            const messageElement = document.createElement('div');
            messageElement.className = \`message \${message.role}\`;

            const contentElement = document.createElement('div');
            contentElement.className = 'message-content';
            contentElement.textContent = message.content;

            const metadataElement = document.createElement('div');
            metadataElement.className = 'message-metadata';

            const timeSpan = document.createElement('span');
            timeSpan.textContent = new Date(message.timestamp).toLocaleTimeString();
            metadataElement.appendChild(timeSpan);

            if (message.metadata) {
                if (message.metadata.mode) {
                    const modeSpan = document.createElement('span');
                    modeSpan.textContent = \`Mode: \${message.metadata.mode}\`;
                    metadataElement.appendChild(modeSpan);
                }

                if (message.metadata.confidence) {
                    const confidenceSpan = document.createElement('span');
                    confidenceSpan.textContent = \`Confidence: \${Math.round(message.metadata.confidence * 100)}%\`;
                    metadataElement.appendChild(confidenceSpan);
                }

                if (message.metadata.processingTime) {
                    const timeSpan = document.createElement('span');
                    timeSpan.textContent = \`\${message.metadata.processingTime}ms\`;
                    metadataElement.appendChild(timeSpan);
                }
            }

            messageElement.appendChild(contentElement);
            messageElement.appendChild(metadataElement);

            messagesContainer.appendChild(messageElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function showProcessing(message) {
            isProcessing = true;
            processingIndicator.classList.add('active');
            processingIndicator.querySelector('span').textContent = message;
            sendButton.disabled = true;
        }

        function hideProcessing() {
            isProcessing = false;
            processingIndicator.classList.remove('active');
            sendButton.disabled = false;
        }

        function updateState(state) {
            // Update messages
            messagesContainer.innerHTML = '';
            state.messages.forEach(message => addMessage(message));

            // Update mode and capabilities
            updateMode({ mode: state.currentMode });
            updateCapabilities(state.capabilities);

            // Update processing state
            if (state.isProcessing) {
                showProcessing('Processing...');
            } else {
                hideProcessing();
            }
        }

        function updateMode(data) {
            const modes = {
                'chat': { name: 'Chat', class: 'mode-chat', desc: 'Interactive chat mode' },
                'coding-agent': { name: 'Coding Agent', class: 'mode-coding-agent', desc: 'Advanced coding assistance' },
                'coffee-mode': { name: 'Coffee Mode', class: 'mode-coffee', desc: 'Autonomous mode' }
            };

            const mode = modes[data.mode] || modes['chat'];
            modeIndicator.textContent = mode.name;
            modeIndicator.className = \`mode-badge \${mode.class}\`;
            modeDescription.textContent = mode.desc;
        }

        function updateCapabilities(capabilities) {
            capabilitiesIndicator.innerHTML = '';

            const capabilityNames = {
                'repoGrokking': 'Repo Understanding',
                'agenticPipeline': 'Autonomous Tasks',
                'webSearch': 'Web Search',
                'multiFileOperations': 'Multi-File Ops',
                'realTimeValidation': 'Real-time Validation',
                'contextAwareGeneration': 'Context-Aware'
            };

            Object.entries(capabilities).forEach(([key, enabled]) => {
                if (capabilityNames[key]) {
                    const dot = document.createElement('div');
                    dot.className = \`capability-dot \${enabled ? '' : 'disabled'}\`;
                    dot.title = \`\${capabilityNames[key]}: \${enabled ? 'Enabled' : 'Disabled'}\`;
                    capabilitiesIndicator.appendChild(dot);
                }
            });
        }

        function updateSessionInfo() {
            const elapsed = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000 / 60);
            sessionInfo.textContent = \`Session: \${messageCount} messages, \${elapsed} min\`;
        }

        function insertQuickAction(text) {
            messageInput.value = text;
            messageInput.focus();
        }

        // Request initial state
        vscode.postMessage({ type: 'requestState' });
    </script>
</body>
</html>
`;
    }

    /**
     * Handle messages from webview
     */
    public async handleWebviewMessage(message: any): Promise<any> {
        switch (message.type) {
            case 'sendMessage':
                return this.handleSendMessage(message.data);
            case 'requestState':
                return this.getState();
            case 'switchMode':
                return this.handleSwitchMode(message.data);
            case 'clearHistory':
                return this.clearHistory();
            default:
                return null;
        }
    }

    /**
     * Handle send message from webview
     */
    private async handleSendMessage(data: { text: string }): Promise<void> {
        const userMessage: ChatMessage = {
            id: this.generateMessageId(),
            role: 'user',
            content: data.text,
            timestamp: new Date(),
            metadata: {
                mode: this.state.currentMode,
                capabilities: Object.keys(this.state.capabilities).filter(k => this.state.capabilities[k])
            }
        };

        this.state.messages.push(userMessage);
        this.state.isProcessing = true;

        try {
            const startTime = Date.now();
            const response = await this.aiService.sendMessage(data.text);
            const processingTime = Date.now() - startTime;

            const assistantMessage: ChatMessage = {
                id: this.generateMessageId(),
                role: 'assistant',
                content: response,
                timestamp: new Date(),
                metadata: {
                    mode: this.state.currentMode,
                    processingTime,
                    confidence: 0.85, // This would come from the AI service
                    capabilities: Object.keys(this.state.capabilities).filter(k => this.state.capabilities[k])
                }
            };

            this.state.messages.push(assistantMessage);
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: this.generateMessageId(),
                role: 'assistant',
                content: `Error: ${error}`,
                timestamp: new Date(),
                metadata: {
                    mode: this.state.currentMode,
                    confidence: 0
                }
            };

            this.state.messages.push(errorMessage);
        } finally {
            this.state.isProcessing = false;
        }
    }

    /**
     * Handle mode switch
     */
    private async handleSwitchMode(data: { mode: string }): Promise<void> {
        try {
            await this.aiService.switchMode(data.mode as any);
            this.state.currentMode = this.aiService.getCurrentMode();
            this.state.capabilities = this.aiService.getCapabilities();
        } catch (error) {
            console.error('Failed to switch mode:', error);
        }
    }

    /**
     * Clear chat history
     */
    private clearHistory(): void {
        this.state.messages = [];
        this.aiService.clearConversationHistory();
    }

    /**
     * Get current state
     */
    private getState(): ChatEnhancementState {
        return {
            ...this.state,
            currentMode: this.aiService.getCurrentMode(),
            capabilities: this.aiService.getCapabilities()
        };
    }

    /**
     * Generate unique message ID
     */
    private generateMessageId(): string {
        return `msg_${Date.now()}_${++this.messageIdCounter}`;
    }

    /**
     * Add message programmatically
     */
    public addMessage(role: 'user' | 'assistant' | 'system', content: string, metadata?: any): void {
        const message: ChatMessage = {
            id: this.generateMessageId(),
            role,
            content,
            timestamp: new Date(),
            metadata
        };

        this.state.messages.push(message);
    }

    /**
     * Get chat history
     */
    public getHistory(): ChatMessage[] {
        return [...this.state.messages];
    }

    /**
     * Set processing state
     */
    public setProcessing(isProcessing: boolean): void {
        this.state.isProcessing = isProcessing;
    }

    /**
     * Update capabilities
     */
    public updateCapabilities(): void {
        this.state.capabilities = this.aiService.getCapabilities();
        this.state.currentMode = this.aiService.getCurrentMode();
    }
}