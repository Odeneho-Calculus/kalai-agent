/**
 * Secure Configuration Template for Kalai Agent
 *
 * SETUP INSTRUCTIONS:
 * 1. Copy this file to 'secure.config.ts' in the same directory
 * 2. Replace 'your-openrouter-api-key-here' with your actual OpenRouter API key
 * 3. The secure.config.ts file is automatically ignored by git for security
 *
 * To get an OpenRouter API key:
 * 1. Visit https://openrouter.ai/
 * 2. Sign up or log in
 * 3. Go to Keys section
 * 4. Create a new key
 * 5. Copy the key (starts with sk-or-v1-...)
 */

export interface SecureConfig {
    defaultApiKey: string;
    defaultApiEndpoint: string;
    defaultModelName: string;
    fallbackModels: string[];
    rateLimits: {
        requestsPerMinute: number;
        tokensPerMinute: number;
    };
}

export const SECURE_CONFIG: SecureConfig = {
    // 🔑 REPLACE THIS WITH YOUR ACTUAL OPENROUTER API KEY
    defaultApiKey: 'your-openrouter-api-key-here',

    defaultApiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',

    defaultModelName: 'qwen/qwen-2.5-7b-instruct:free',

    fallbackModels: [
        'qwen/qwen-2.5-7b-instruct:free',
        'meta-llama/llama-3.1-8b-instruct:free',
        'microsoft/phi-3-mini-128k-instruct:free',
        'google/gemma-2-9b-it:free'
    ],

    rateLimits: {
        requestsPerMinute: 60,
        tokensPerMinute: 100000
    }
};

// Validation function to ensure configuration is properly set
export function validateSecureConfig(): boolean {
    if (!SECURE_CONFIG.defaultApiKey || SECURE_CONFIG.defaultApiKey === 'your-openrouter-api-key-here') {
        console.warn('⚠️  Kalai Agent: Default API key not configured in secure.config.ts');
        return false;
    }

    if (!SECURE_CONFIG.defaultApiEndpoint) {
        console.warn('⚠️  Kalai Agent: Default API endpoint not configured');
        return false;
    }

    return true;
}