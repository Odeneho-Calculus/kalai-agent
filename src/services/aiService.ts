import * as vscode from 'vscode';
import axios from 'axios';

interface AIRequestContext {
  fileName?: string;
  languageId?: string;
  instruction?: string;
  [key: string]: any;
}

interface AIModelResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export class AIService {
  private readonly apiEndpoint: string;
  private readonly modelName: string;
  private readonly apiKey: string;
  private readonly maxRetries: number = 3;

  constructor() {
    const config = vscode.workspace.getConfiguration('kalai-agent');
    this.apiEndpoint = config.get<string>('aiEndpoint') || 'https://openrouter.ai/api/v1/chat/completions';
    this.modelName = config.get<string>('modelName') || 'qwen/qwen3-30b-a3b:free';
    this.apiKey = config.get<string>('apiKey') || '';
  }

  /**
   * Send a message to the AI model and get a response
   */
  public async sendMessage(message: string, context?: AIRequestContext): Promise<string> {
    const systemPrompt = this.createSystemPrompt(context);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    return this.callAIModel(messages);
  }

  /**
   * Edit code based on user instructions
   */
  public async editCode(code: string, context: AIRequestContext): Promise<string> {
    const instruction = context.instruction || 'Improve this code';
    const language = context.languageId || 'unknown';
    const fileName = context.fileName || 'unknown';

    const systemPrompt = `You are KalAI Agent, an expert code assistant. 
You are working with a ${language} file named ${fileName}.
Your task is to: ${instruction}
Respond ONLY with the improved code, without explanations or markdown formatting.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: code }
    ];

    return this.callAIModel(messages);
  }

  /**
   * Create a system prompt based on context
   */
  private createSystemPrompt(context?: AIRequestContext): string {
    let prompt = 'You are KalAI Agent, an AI coding assistant for VS Code. ';

    if (context?.languageId) {
      prompt += `You are currently working with ${context.languageId} code. `;
    }

    prompt += 'Provide clear, concise, and helpful responses. Include code examples when appropriate.';

    return prompt;
  }

  /**
   * Call the AI model API with retry logic
   */
  private async callAIModel(messages: any[], retryCount = 0): Promise<string> {
    try {
      const response = await axios.post<AIModelResponse>(
        this.apiEndpoint,
        {
          model: "qwen/qwen3-30b-a3b:free", // Full model identifier required
          messages: messages,
          temperature: 0.7,
          max_tokens: 4000, // Increased for better responses
          top_p: 0.95, // Added for better response quality
          presence_penalty: 0.5, // Helps prevent repetition
          frequency_penalty: 0.5 // Helps with response diversity
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://github.com/Odeneho-Calculus/kalai-agent', // Updated referer
            'X-Title': 'KalAI Agent',
            'Content-Type': 'application/json',
            'OpenAI-Organization': 'kalai-agent' // Added for tracking
          },
          timeout: 45000 // Increased timeout for longer responses
        }
      );

      if (!response.data?.choices?.[0]?.message?.content) {
        console.error('API Response:', JSON.stringify(response.data, null, 2));
        throw new Error('Invalid response format from AI model');
      }

      return response.data.choices[0].message.content;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('API Error Details:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });

        // Check for specific error cases
        if (error.response?.status === 400) {
          throw new Error(`API Error (400): ${JSON.stringify(error.response.data)}`);
        } else if (error.response?.status === 401) {
          throw new Error('Invalid API key or authentication error');
        }
      }

      if (retryCount < this.maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callAIModel(messages, retryCount + 1);
      }

      throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}