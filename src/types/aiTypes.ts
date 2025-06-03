import { ProjectContext } from '../services/codeContextManager';

export interface AIRequestContext extends ProjectContext {
    instruction?: string;
    currentFile: {
        fileName: string;
        languageId: string;
        instruction?: string;
        filePath?: string;
        prefix?: string;
        suffix?: string;
        relativePath?: string;
        siblingFiles?: string[];
        dependencies?: Record<string, string>;
    };
}

export interface TaskProgress {
    currentTask?: string;
    currentStep: number;
    totalSteps: number;
    steps: string[];
    completed: boolean;
}

export interface ConversationContext {
    messages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp?: number;
    }>;
    projectContext?: AIRequestContext;
    currentTask?: string;
    stepsPlan?: string[];
    currentStep?: number;
}

export interface ToolExecutionResult {
    success: boolean;
    result: any;
    error?: string;
    executionTime?: number;
}

export interface SearchQuery {
    query: string;
    filePattern?: string;
    includeContent?: boolean;
    maxResults?: number;
}

export interface WebSearchResult {
    title: string;
    url: string;
    snippet: string;
    source: string;
    relevanceScore: number;
}
