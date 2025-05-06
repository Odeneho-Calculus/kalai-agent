import * as vscode from 'vscode';

interface ChatSession {
    id: string;
    messages: any[];
    timestamp: number;
    preview: string;
}

export class ChatHistoryService {
    private static readonly STORAGE_KEY = 'kalai-agent.chatHistory';
    private history: ChatSession[] = [];

    constructor(private context: vscode.ExtensionContext) {
        if (!context) {
            throw new Error('Extension context is required for ChatHistoryService');
        }
        this.loadHistory();
    }

    private loadHistory() {
        try {
            this.history = this.context.globalState.get<ChatSession[]>(ChatHistoryService.STORAGE_KEY, []);
        } catch (error) {
            console.error('Failed to load chat history:', error);
            this.history = [];
        }
    }

    private async saveHistory() {
        await this.context.globalState.update(ChatHistoryService.STORAGE_KEY, this.history);
    }

    async addSession(messages: any[]) {
        try {
            const preview = messages[messages.length - 1]?.text?.substring(0, 100) + '...' || 'Empty chat';
            const session: ChatSession = {
                id: `session-${Date.now()}`,
                messages,
                timestamp: Date.now(),
                preview
            };

            this.history.unshift(session);
            if (this.history.length > 50) {
                this.history.pop(); // Keep only last 50 sessions
            }
            await this.context.globalState.update(ChatHistoryService.STORAGE_KEY, this.history);
            return session;
        } catch (error) {
            console.error('Failed to add chat session:', error);
            throw error;
        }
    }

    async getSessions(): Promise<ChatSession[]> {
        return this.history;
    }

    async clearHistory() {
        this.history = [];
        await this.saveHistory();
    }
}
