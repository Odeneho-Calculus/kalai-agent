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

interface ConversationContext {
  messages: Array<{ role: string, content: string }>;
  projectContext?: AIRequestContext;
  currentTask?: string;
  stepsPlan?: string[];
  currentStep?: number;
}

export class AIService {
  private readonly API_KEY = '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';
  private readonly API_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly MODEL_NAME = 'qwen/qwen-2.5-7b-instruct:free';
  private readonly maxRetries: number = 3;
  private conversationHistory: ConversationContext = { messages: [] };
  private projectAnalysisCache: Map<string, any> = new Map();

  public async sendMessage(message: string, context?: AIRequestContext): Promise<string> {
    try {
      // Update conversation context
      if (context) {
        this.conversationHistory.projectContext = context;
      }

      // Detect if this is a complex task requiring multi-step planning
      const isComplexTask = this.detectComplexTask(message);

      if (isComplexTask && !this.conversationHistory.currentTask) {
        return await this.handleComplexTask(message, context);
      }

      // Enhanced system prompt with advanced capabilities
      let systemPrompt = this.createAdvancedSystemPrompt(context);
      let userPrompt = await this.enhanceUserPrompt(message, context);

      // Add conversation history for context awareness
      const messages = this.buildConversationMessages(systemPrompt, userPrompt);

      const response = await this.callAIModel(messages);

      // Update conversation history
      this.conversationHistory.messages.push(
        { role: 'user', content: message },
        { role: 'assistant', content: response }
      );

      // Keep conversation history manageable (last 10 exchanges)
      if (this.conversationHistory.messages.length > 20) {
        this.conversationHistory.messages = this.conversationHistory.messages.slice(-20);
      }

      return response;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  private detectComplexTask(message: string): boolean {
    const complexTaskIndicators = [
      'create a', 'build a', 'implement', 'refactor', 'optimize',
      'analyze entire', 'full analysis', 'complete review',
      'step by step', 'plan for', 'architecture for'
    ];

    return complexTaskIndicators.some(indicator =>
      message.toLowerCase().includes(indicator)
    );
  }

  private async handleComplexTask(message: string, context?: AIRequestContext): Promise<string> {
    const planningPrompt = `
You are an expert software architect and developer. Break down this complex task into clear, actionable steps:

Task: ${message}

${context ? this.createProjectAnalysisPrompt(context) : ''}

Provide a detailed plan with:
1. Analysis phase
2. Implementation steps
3. Testing considerations
4. Potential challenges

Format your response as a structured plan with numbered steps.
`;

    const messages = [
      { role: 'system', content: this.createAdvancedSystemPrompt(context) },
      { role: 'user', content: planningPrompt }
    ];

    const planResponse = await this.callAIModel(messages);

    // Store the task and plan
    this.conversationHistory.currentTask = message;
    this.conversationHistory.stepsPlan = this.extractStepsFromPlan(planResponse);
    this.conversationHistory.currentStep = 0;

    return `**Complex Task Detected: Planning Phase**\n\n${planResponse}\n\nI've created a structured plan for your task. Would you like me to start with the first step, or would you like to modify the plan?`;
  }

  private extractStepsFromPlan(plan: string): string[] {
    const lines = plan.split('\n');
    const steps: string[] = [];

    lines.forEach(line => {
      if (/^\d+\./.test(line.trim())) {
        steps.push(line.trim());
      }
    });

    return steps;
  }

  private createAdvancedSystemPrompt(context?: AIRequestContext): string {
    let prompt = `You are Kalai, an advanced AI programming assistant with expertise in software development, architecture, and best practices.

Core Capabilities:
- Deep code analysis and understanding
- Multi-step problem solving and planning
- Context-aware suggestions across entire codebases
- Advanced debugging and error resolution
- Code optimization and refactoring
- Documentation generation
- Best practices enforcement

Guidelines:
1. Always consider the full project context when making suggestions
2. Provide detailed explanations for complex concepts
3. Break down large tasks into manageable steps
4. Consider performance, security, and maintainability
5. Suggest modern best practices and patterns
6. Identify potential issues before they become problems
7. Provide code examples with proper formatting
8. Consider cross-file dependencies and impacts

`;

    if (context?.currentFile?.languageId) {
      prompt += `Current Language: ${context.currentFile.languageId}\n`;
    }

    if (context?.detectedFramework) {
      prompt += `Detected Framework: ${context.detectedFramework}\n`;
    }

    if (context?.dependencies) {
      prompt += `Project Dependencies: ${Object.keys(context.dependencies).join(', ')}\n`;
    }

    return prompt;
  }

  private async enhanceUserPrompt(message: string, context?: AIRequestContext): Promise<string> {
    let enhancedPrompt = message;

    // Add project context if available
    if (context) {
      enhancedPrompt = this.createProjectAnalysisPrompt(context) + '\n\n' + message;
    }

    // Detect specific request types and enhance accordingly
    if (message.toLowerCase().includes('explain') || message.toLowerCase().includes('what is')) {
      enhancedPrompt += '\n\nPlease provide a comprehensive explanation including examples and best practices.';
    }

    if (message.toLowerCase().includes('optimize') || message.toLowerCase().includes('improve')) {
      enhancedPrompt += '\n\nPlease consider performance, readability, maintainability, and modern best practices.';
    }

    if (message.toLowerCase().includes('debug') || message.toLowerCase().includes('error')) {
      enhancedPrompt += '\n\nPlease provide step-by-step debugging guidance and potential solutions.';
    }

    return enhancedPrompt;
  }

  private buildConversationMessages(systemPrompt: string, userPrompt: string): any[] {
    const messages = [{ role: 'system', content: systemPrompt }];

    // Add relevant conversation history
    const recentHistory = this.conversationHistory.messages.slice(-6); // Last 3 exchanges
    messages.push(...recentHistory);

    messages.push({ role: 'user', content: userPrompt });

    return messages;
  }

  public async analyzeCodebase(workspaceRoot: string): Promise<string> {
    const cacheKey = `codebase_${workspaceRoot}`;

    if (this.projectAnalysisCache.has(cacheKey)) {
      return this.projectAnalysisCache.get(cacheKey);
    }

    try {
      // Get project files
      const files = await vscode.workspace.findFiles(
        '**/*.{js,ts,jsx,tsx,py,java,cpp,c,cs,php,rb,go,rs}',
        '**/node_modules/**'
      );

      let analysis = 'Codebase Analysis:\n\n';

      // Analyze file structure
      const filesByType = new Map<string, number>();
      files.forEach(file => {
        const ext = file.fsPath.split('.').pop() || 'unknown';
        filesByType.set(ext, (filesByType.get(ext) || 0) + 1);
      });

      analysis += 'File Distribution:\n';
      filesByType.forEach((count, ext) => {
        analysis += `- ${ext}: ${count} files\n`;
      });

      // Cache the analysis
      this.projectAnalysisCache.set(cacheKey, analysis);

      return analysis;
    } catch (error) {
      console.error('Error analyzing codebase:', error);
      return 'Unable to analyze codebase at this time.';
    }
  }

  public clearConversationHistory(): void {
    this.conversationHistory = { messages: [] };
  }

  public getCurrentTask(): string | undefined {
    return this.conversationHistory.currentTask;
  }

  public getTaskProgress(): { current: number, total: number, steps: string[] } | null {
    if (!this.conversationHistory.stepsPlan) {
      return null;
    }

    return {
      current: this.conversationHistory.currentStep || 0,
      total: this.conversationHistory.stepsPlan.length,
      steps: this.conversationHistory.stepsPlan
    };
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
      if (!this.API_KEY) {
        throw new Error('API key is not configured. Please check your settings.');
      }

      const headers = {
        'Authorization': `Bearer ${this.API_KEY}`,
        'HTTP-Referer': 'https://github.com/Odeneho-Calculus/kalai-agent',
        'X-Title': 'Kalai Agent',
        'Content-Type': 'application/json',
        'OpenAI-Organization': 'org-yourOrgId' // Add if required by your API
      };

      console.log('Making AI request with model:', this.MODEL_NAME);
      console.log('Request payload:', {
        model: this.MODEL_NAME,
        messages: messages.map(m => ({ role: m.role, content: m.content.substring(0, 100) + '...' })),
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.95
      });

      const response = await axios.post<AIModelResponse>(
        this.API_ENDPOINT,
        {
          model: this.MODEL_NAME,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
          top_p: 0.95
        },
        {
          headers,
          timeout: 60000, // Increased to 60 seconds
          validateStatus: (status) => status < 500 // Handle 4xx errors explicitly
        }
      );

      console.log('AI response status:', response.status);

      // Handle specific response status codes
      if (response.status === 401 || response.status === 403) {
        throw new Error('API authentication failed - please verify your API key and permissions');
      }

      if (response.status === 429) {
        if (retryCount < this.maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.callAIModel(messages, retryCount + 1);
        }
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from AI model');
      }

      return response.data.choices[0].message.content;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        console.error('API Error Details:', {
          status,
          data,
          message: error.message,
          code: error.code
        });

        // Handle timeout specifically
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          if (retryCount < this.maxRetries) {
            console.log(`Request timeout, retrying... (${retryCount + 1}/${this.maxRetries})`);
            const delay = Math.pow(2, retryCount) * 2000; // Longer delay for timeouts
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.callAIModel(messages, retryCount + 1);
          }
          throw new Error('AI service timeout - the model is taking too long to respond. Please try again.');
        }

        // Handle specific error cases
        if (status === 401) {
          throw new Error('API authentication failed - please verify your API key');
        } else if (status === 403) {
          throw new Error('API access forbidden - please check your account permissions');
        } else if (status === 429) {
          throw new Error('Rate limit exceeded - please try again later');
        } else if (status === 404) {
          throw new Error('Model not found - please check the model name configuration');
        }
      }

      // Re-throw unexpected errors
      console.error('Unexpected error in AI service:', error);
      throw error;
    }
  }
}