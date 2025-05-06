import * as vscode from 'vscode';
import axios from 'axios';
import { AIRequestContext } from '../types/aiTypes';

interface AIModelResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export class AIService {
  private readonly API_KEY = 'API_KEY_HERE'; // Replace with your actual API key
  private readonly API_ENDPOINT = 'ENDPOIN_HERE'; // Replace with your actual API endpoint
  private readonly MODEL_NAME = 'qwen/qwen3-30b-a3b:free';
  private readonly maxRetries: number = 3;

  public async sendMessage(message: string, context?: AIRequestContext): Promise<string> {
    try {
      let systemPrompt = 'You are kalai, an AI programming assistant.';
      let userPrompt = message;

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

  private createSystemPrompt(context?: AIRequestContext): string {
    let prompt = `You are an AI programming assistant with expertise in ${context?.currentFile?.languageId || 'multiple programming languages'}. `;
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

\`\`\`${context.currentFile?.languageId || 'text'}
${code}
\`\`\`

Consider the current project context and dependencies. Respond only with the modified code.`;
  }

  private createProjectAnalysisPrompt(context: AIRequestContext): string {
    let prompt = 'Based on the following project context:\n\n';

    if (context.activeFile) {
      prompt += `Main file: ${context.activeFile.relativePath}\n`;
      prompt += `Type: ${context.activeFile.language}\n\n`;

      if (context.detectedFramework) {
        prompt += `Framework: ${context.detectedFramework}\n`;
      }

      if (context.dependencies) {
        prompt += 'Dependencies:\n';
        Object.entries(context.dependencies).forEach(([dep, version]) => {
          prompt += `- ${dep}@${version}\n`;
        });
        prompt += '\n';
      }

      prompt += 'File content:\n```\n';
      prompt += context.activeFile.content;
      prompt += '\n```\n\n';
    }

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
    if (!context.currentFile?.filePath) return context;

    try {
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
        this.API_ENDPOINT,
        {
          model: this.MODEL_NAME,
          messages: messages,
          temperature: 0.7,
          max_tokens: 4000,
          top_p: 0.95,
          presence_penalty: 0.5,
          frequency_penalty: 0.5
        },
        {
          headers: {
            'Authorization': `Bearer ${this.API_KEY}`,
            'HTTP-Referer': 'https://github.com/Odeneho-Calculus/kalai-agent',
            'X-Title': 'KalAI Agent',
            'Content-Type': 'application/json',
            'OpenAI-Organization': 'kalai-agent'
          },
          timeout: 45000
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

      if (error instanceof Error) {
        vscode.window.showErrorMessage(`Kalai Agent: ${error.message}`);
      }
      throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}