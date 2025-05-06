import * as vscode from 'vscode';
import axios from 'axios';
import { ProjectContext } from './codeContextManager';

interface CodeContext {
  prefix: string;        // Code before cursor
  suffix: string;        // Code after cursor
  filePath: string;     // Current file path
  language: string;     // Programming language
  indent: string;       // Current line indentation
  relativePath: string; // File path relative to workspace
  siblingFiles?: string[]; // Related files in the same directory
  dependencies?: Record<string, string>; // Project dependencies
}

interface AIRequestContext extends ProjectContext {
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
  private contextWindow: number = 2048; // Number of tokens to include for context

  constructor() {
    const config = vscode.workspace.getConfiguration('kalai-agent');
    this.apiEndpoint = config.get<string>('aiEndpoint') || 'https://openrouter.ai/api/v1/chat/completions';
    this.modelName = config.get<string>('modelName') || 'qwen/qwen3-30b-a3b:free';
    this.apiKey = config.get<string>('apiKey') || '';
  }

  public async sendMessage(message: string, context?: AIRequestContext): Promise<string> {
    try {
      let systemPrompt = 'You are kalai, an AI programming assistant.';
      let userPrompt = message;

      // Enhance prompt based on message type
      if (message.toLowerCase().includes('what is') ||
        message.toLowerCase().includes('explain') ||
        message.toLowerCase().includes('about')) {
        systemPrompt += ' When explaining projects or code, analyze:\n';
        systemPrompt += '1. Project type and framework\n';
        systemPrompt += '2. Main dependencies and their purposes\n';
        systemPrompt += '3. Project structure and architecture\n';
        systemPrompt += '4. Key features and functionality\n';

        if (context) {
          userPrompt = this.createProjectAnalysisPrompt(context) + '\n' + message;
        }
      }

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      return await this.callAIModel(messages);
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  public async editCode(code: string, context: AIRequestContext): Promise<string> {
    const enhancedContext = await this.getEnhancedContext(context);
    const prompt = this.createEditPrompt(code, enhancedContext);

    const messages = [
      { role: 'system', content: this.createSystemPrompt(context) },
      { role: 'user', content: prompt }
    ];

    return this.callAIModel(messages);
  }

  private async createEnhancedPrompt(message: string, context?: AIRequestContext): Promise<string> {
    let prompt = message;

    if (context?.currentFile) {
      prompt = `Context for ${context.currentFile.language} file ${context.currentFile.relativePath}:\n\n`;

      // Add relevant code context
      if (context.currentFile.prefix) {
        prompt += '```' + context.currentFile.language + '\n';
        prompt += context.currentFile.prefix + '\n';
        prompt += '```\n\n';
      }

      // Add user's question/instruction
      prompt += `Question: ${message}\n`;

      // Add project context if available
      if (context.currentFile.dependencies) {
        prompt += '\nProject dependencies:\n';
        Object.entries(context.currentFile.dependencies)
          .forEach(([dep, version]) => prompt += `${dep}@${version}\n`);
      }
    }

    return prompt;
  }

  private createSystemPrompt(context?: AIRequestContext): string {
    let prompt = `You are an AI programming assistant with expertise in ${context?.currentFile?.language || 'multiple programming languages'}. `;
    prompt += 'Follow these guidelines:\n';
    prompt += '1. Provide clear, concise, and practical solutions\n';
    prompt += '2. Include only necessary code without explanations unless asked\n';
    prompt += '3. Follow the current code style and conventions\n';
    prompt += '4. Consider project dependencies and context\n';
    prompt += '5. Focus on production-quality, maintainable code\n';
    return prompt;
  }

  private createEditPrompt(code: string, context: AIRequestContext): string {
    return `Please ${context.instruction || 'improve'} the following code while maintaining its core functionality:

\`\`\`${context.currentFile?.language || 'text'}
${code}
\`\`\`

Consider the current project context and dependencies. Respond only with the modified code.`;
  }

  private createProjectAnalysisPrompt(context: ProjectContext): string {
    let prompt = 'Based on the following project context:\n\n';

    // Add file structure context
    if (context.activeFile) {
      prompt += `Main file: ${context.activeFile.relativePath}\n`;
      prompt += `Type: ${context.activeFile.language}\n\n`;

      // Add framework detection
      if (context.detectedFramework) {
        prompt += `Framework: ${context.detectedFramework}\n`;
      }

      // Add dependencies context
      if (context.dependencies) {
        prompt += 'Dependencies:\n';
        Object.entries(context.dependencies).forEach(([dep, version]) => {
          prompt += `- ${dep}@${version}\n`;
        });
        prompt += '\n';
      }

      // Add file content
      prompt += 'File content:\n```\n';
      prompt += context.activeFile.content;
      prompt += '\n```\n\n';
    }

    // Add project structure understanding
    prompt += 'Project analysis:\n';
    if (context.files.length > 1) {
      prompt += 'Related files:\n';
      context.files.slice(0, 3).forEach(file => {
        prompt += `- ${file.relativePath} (${file.language})\n`;
      });
    }

    return prompt;
  }

  private async getEnhancedContext(context: AIRequestContext): Promise<AIRequestContext> {
    if (!context.currentFile) return context;

    try {
      // Get sibling files
      const currentDir = vscode.Uri.file(context.currentFile.filePath).fsPath;
      const files = await vscode.workspace.findFiles(
        new vscode.RelativePattern(currentDir, '**/*'),
        '**/node_modules/**'
      );

      context.currentFile.siblingFiles = files
        .map(f => f.fsPath)
        .filter(f => f !== context.currentFile?.filePath);

      return context;
    } catch (error) {
      console.warn('Error enhancing context:', error);
      return context;
    }
  }

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