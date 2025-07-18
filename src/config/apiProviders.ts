/**
 * API Provider Configuration
 * Maps AI models to their respective API providers and signup URLs
 */

export interface ApiProvider {
    name: string;
    displayName: string;
    signupUrl: string;
    apiKeyUrl: string;
    helpUrl: string;
    testEndpoint: string;
    keyFormat: RegExp;
    freeModels: string[];
    paidModels: string[];
}

export const API_PROVIDERS: Record<string, ApiProvider> = {
    openrouter: {
        name: 'openrouter',
        displayName: 'OpenRouter',
        signupUrl: 'https://openrouter.ai/signup',
        apiKeyUrl: 'https://openrouter.ai/keys',
        helpUrl: 'https://openrouter.ai/docs',
        testEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
        keyFormat: /^sk-or-v1-[a-zA-Z0-9]{32,}$/,
        freeModels: [
            'moonshotai/kimi-k2:free',
            'meta-llama/llama-3.3-70b-instruct:free',
            'meta-llama/llama-3.1-8b-instruct:free',
            'microsoft/phi-3-mini-128k-instruct:free',
            'google/gemma-2-9b-it:free'
        ],
        paidModels: [
            'gpt-4-turbo',
            'gpt-4',
            'claude-3-opus',
            'claude-3-sonnet',
            'gemini-pro'
        ]
    },
    openai: {
        name: 'openai',
        displayName: 'OpenAI',
        signupUrl: 'https://platform.openai.com/signup',
        apiKeyUrl: 'https://platform.openai.com/api-keys',
        helpUrl: 'https://platform.openai.com/docs',
        testEndpoint: 'https://api.openai.com/v1/chat/completions',
        keyFormat: /^sk-[a-zA-Z0-9]{32,}$/,
        freeModels: [],
        paidModels: [
            'gpt-4-turbo',
            'gpt-4',
            'gpt-3.5-turbo'
        ]
    },
    anthropic: {
        name: 'anthropic',
        displayName: 'Anthropic',
        signupUrl: 'https://console.anthropic.com/signup',
        apiKeyUrl: 'https://console.anthropic.com/settings/keys',
        helpUrl: 'https://docs.anthropic.com/claude/reference',
        testEndpoint: 'https://api.anthropic.com/v1/messages',
        keyFormat: /^sk-ant-[a-zA-Z0-9]{32,}$/,
        freeModels: [],
        paidModels: [
            'claude-3-opus',
            'claude-3-sonnet',
            'claude-3-haiku'
        ]
    },
    google: {
        name: 'google',
        displayName: 'Google AI',
        signupUrl: 'https://cloud.google.com/ai/generative-ai',
        apiKeyUrl: 'https://console.cloud.google.com/apis/credentials',
        helpUrl: 'https://cloud.google.com/ai/docs',
        testEndpoint: 'https://generativelanguage.googleapis.com/v1/models',
        keyFormat: /^[a-zA-Z0-9_-]{32,}$/,
        freeModels: [],
        paidModels: [
            'gemini-pro',
            'gemini-1.5-pro',
            'palm-2'
        ]
    }
};

/**
 * Model to Provider mapping
 */
export const MODEL_TO_PROVIDER: Record<string, string> = {
    // OpenRouter models (free)
    'moonshotai/kimi-k2:free': 'openrouter',
    'meta-llama/llama-3.3-70b-instruct:free': 'openrouter',
    'meta-llama/llama-3.1-8b-instruct:free': 'openrouter',
    'microsoft/phi-3-mini-128k-instruct:free': 'openrouter',
    'google/gemma-2-9b-it:free': 'openrouter',

    // OpenAI models
    'gpt-4-turbo': 'openai',
    'gpt-4': 'openai',
    'gpt-3.5-turbo': 'openai',

    // Anthropic models
    'claude-3-opus': 'anthropic',
    'claude-3-sonnet': 'anthropic',
    'claude-3-haiku': 'anthropic',

    // Google models
    'gemini-pro': 'google',
    'gemini-1.5-pro': 'google',
    'palm-2': 'google'
};

/**
 * Get provider for a given model
 */
export function getProviderForModel(modelName: string): ApiProvider | null {
    const providerName = MODEL_TO_PROVIDER[modelName];
    return providerName ? API_PROVIDERS[providerName] : null;
}

/**
 * Get all available models for a provider
 */
export function getModelsForProvider(providerName: string): string[] {
    const provider = API_PROVIDERS[providerName];
    if (!provider) return [];

    return [...provider.freeModels, ...provider.paidModels];
}

/**
 * Check if a model is free
 */
export function isModelFree(modelName: string): boolean {
    const provider = getProviderForModel(modelName);
    return provider ? provider.freeModels.includes(modelName) : false;
}

/**
 * Validate API key format for a provider
 */
export function validateApiKeyFormat(apiKey: string, providerName: string): boolean {
    const provider = API_PROVIDERS[providerName];
    if (!provider) return false;

    return provider.keyFormat.test(apiKey);
}

/**
 * Get setup instructions for a provider
 */
export function getSetupInstructions(providerName: string): string {
    const provider = API_PROVIDERS[providerName];
    if (!provider) return '';

    return `To use ${provider.displayName} models:
1. Sign up at: ${provider.signupUrl}
2. Get your API key from: ${provider.apiKeyUrl}
3. Configure it in Kalai Agent settings
4. For help, visit: ${provider.helpUrl}`;
}