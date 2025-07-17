import * as vscode from 'vscode';
import { ChatViewProvider } from './providers/chatViewProvider';
import { AdvancedCommands } from './commands/advancedCommands';
import { handleEditWithAI } from './commands/editWithAI';
import { RepositoryAnalysisService } from './services/repositoryAnalysisService';
import { TaskOrchestrationService } from './services/taskOrchestrationService';
import { AIService } from './services/aiService';
import { WebSearchService } from './services/webSearchService';
import { StatusBarManager } from './ui/statusBarManager';
import { ProgressIndicator } from './ui/progressIndicator';
import { ModeSelector } from './ui/modeSelector';
import { ChatEnhancements } from './ui/chatEnhancements';
import { FileOperationsService } from './services/fileOperationsService';
import { ValidationService } from './services/validationService';
import { AutomationService } from './services/automationService';
import { RealTimeFeedbackUI } from './ui/realTimeFeedbackUI';
import { TestingService } from './services/testingService';
import { PerformanceService } from './services/performanceService';
import { SemanticService } from './services/semanticService';
import { InsightsService } from './services/insightsService';
import { ModelService } from './services/modelService';
import { CollaborationService } from './services/collaborationService';
import { PluginService } from './services/pluginService';
import { IntegrationService } from './services/integrationService';

export function activate(context: vscode.ExtensionContext) {
  console.log('🚀 Kalai Agent with Repo Grokking™ is now active!');

  // Initialize enhanced services
  const repositoryAnalysisService = new RepositoryAnalysisService();
  const webSearchService = new WebSearchService();
  const taskOrchestrationService = new TaskOrchestrationService(repositoryAnalysisService, new AIService());
  const enhancedAIService = new AIService(repositoryAnalysisService, taskOrchestrationService, webSearchService);

  // Initialize Phase 3 services
  const validationService = new ValidationService(repositoryAnalysisService, enhancedAIService);
  const fileOperationsService = new FileOperationsService(repositoryAnalysisService, enhancedAIService);

  // Initialize Phase 4 services
  const automationService = new AutomationService(
    repositoryAnalysisService,
    enhancedAIService,
    taskOrchestrationService,
    validationService,
    fileOperationsService
  );

  // Initialize Phase 5 services
  const testingService = new TestingService(repositoryAnalysisService, enhancedAIService, validationService);
  const performanceService = new PerformanceService(repositoryAnalysisService);

  // Initialize Phase 6 services
  const semanticService = new SemanticService(repositoryAnalysisService, enhancedAIService);
  const insightsService = new InsightsService(
    repositoryAnalysisService,
    enhancedAIService,
    semanticService
  );

  // Initialize Phase 7 services
  const modelService = new ModelService(enhancedAIService, repositoryAnalysisService);
  const collaborationService = new CollaborationService(repositoryAnalysisService, enhancedAIService);
  const pluginService = new PluginService(repositoryAnalysisService, enhancedAIService, context);
  const integrationService = new IntegrationService(repositoryAnalysisService, enhancedAIService);

  // Initialize UI components
  const statusBarManager = new StatusBarManager(enhancedAIService);
  const progressIndicator = new ProgressIndicator();
  const modeSelector = new ModeSelector(enhancedAIService);
  const chatEnhancements = new ChatEnhancements(enhancedAIService);
  const realTimeFeedbackUI = new RealTimeFeedbackUI(enhancedAIService, validationService, automationService);

  // Initialize advanced commands with enhanced services
  const advancedCommands = new AdvancedCommands(enhancedAIService);

  // Register Chat View Provider with enhanced context
  const chatViewProvider = new ChatViewProvider(context.extensionUri, context, enhancedAIService);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'kalai-agent.chatView',
      chatViewProvider
    )
  );

  // Initialize repository grokking with enhanced progress
  const initializeWithProgress = async () => {
    const steps = [
      { name: 'discovery', message: 'Discovering files...', weight: 20 },
      { name: 'analysis', message: 'Analyzing code structure...', weight: 40 },
      { name: 'indexing', message: 'Building semantic index...', weight: 30 },
      { name: 'finalization', message: 'Finalizing setup...', weight: 10 }
    ];

    try {
      statusBarManager.showProgress('Initializing Kalai Agent...');

      await progressIndicator.startProgress('Initializing Kalai Agent', steps, vscode.ProgressLocation.Window);

      progressIndicator.nextStep(); // Discovery
      await enhancedAIService.initializeRepoGrokking();

      progressIndicator.nextStep(); // Analysis
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing

      progressIndicator.nextStep(); // Indexing
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing

      progressIndicator.nextStep(); // Finalization
      statusBarManager.updateStatus();

      progressIndicator.complete();
      statusBarManager.showSuccess('Kalai Agent with Repo Grokking™ is ready!');

      vscode.window.showInformationMessage('🎉 Kalai Agent with Repo Grokking™ is ready!');
    } catch (error) {
      console.error('Error initializing Repo Grokking:', error);
      progressIndicator.cancel();
      statusBarManager.showError('Initialization failed');
      vscode.window.showWarningMessage('Kalai Agent initialized with limited capabilities');
    }
  };

  // Start initialization
  initializeWithProgress();

  // Register all commands
  const commands = [
    // Original commands
    vscode.commands.registerCommand('kalai-agent.startChat', () => {
      vscode.commands.executeCommand('kalai-agent.chatView.focus');
    }),

    vscode.commands.registerCommand('kalai-agent.editWithAI', async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await handleEditWithAI(editor);
      } else {
        vscode.window.showErrorMessage('No active editor found');
      }
    }),

    // Advanced commands
    vscode.commands.registerCommand('kalai-agent.explainCode', () => advancedCommands.explainCode()),
    vscode.commands.registerCommand('kalai-agent.generateTests', () => advancedCommands.generateTests()),
    vscode.commands.registerCommand('kalai-agent.optimizePerformance', () => advancedCommands.optimizePerformance()),
    vscode.commands.registerCommand('kalai-agent.findSecurityIssues', () => advancedCommands.findSecurityIssues()),
    vscode.commands.registerCommand('kalai-agent.generateDocumentation', () => advancedCommands.generateDocumentation()),
    vscode.commands.registerCommand('kalai-agent.refactorCode', () => advancedCommands.refactorCode()),
    vscode.commands.registerCommand('kalai-agent.searchCodebase', () => advancedCommands.searchCodebase()),
    vscode.commands.registerCommand('kalai-agent.analyzeArchitecture', () => advancedCommands.analyzeProjectArchitecture()),
    vscode.commands.registerCommand('kalai-agent.getLatestTechInfo', () => advancedCommands.getLatestTechInfo()),

    // Context menu commands
    vscode.commands.registerCommand('kalai-agent.explainSelection', () => advancedCommands.explainCode()),
    vscode.commands.registerCommand('kalai-agent.refactorSelection', () => advancedCommands.refactorCode()),

    // Enhanced commands for new features
    vscode.commands.registerCommand('kalai-agent.switchToChatMode', async () => {
      await enhancedAIService.switchMode('chat');
    }),

    vscode.commands.registerCommand('kalai-agent.switchToCodingAgentMode', async () => {
      await enhancedAIService.switchMode('coding-agent');
    }),

    vscode.commands.registerCommand('kalai-agent.switchToCoffeeMode', async () => {
      const result = await vscode.window.showWarningMessage(
        'Coffee Mode enables autonomous code modifications. Are you sure?',
        'Yes, I trust Kalai',
        'Cancel'
      );
      if (result === 'Yes, I trust Kalai') {
        await enhancedAIService.switchMode('coffee-mode');
      }
    }),

    vscode.commands.registerCommand('kalai-agent.showCapabilities', () => {
      const capabilities = enhancedAIService.getCapabilities();
      const capabilityList = Object.entries(capabilities)
        .filter(([, enabled]) => enabled)
        .map(([name, enabled]) => `✅ ${name}: ${enabled ? 'Enabled' : 'Disabled'}`)
        .join('\n');

      vscode.window.showInformationMessage(
        `Kalai Agent Capabilities:\n\n${capabilityList}`,
        { modal: true }
      );
    }),

    vscode.commands.registerCommand('kalai-agent.getSessionSummary', () => {
      const summary = enhancedAIService.getConversationSummary();
      vscode.window.showInformationMessage(summary, { modal: true });
    }),

    vscode.commands.registerCommand('kalai-agent.reinitializeRepo', async () => {
      await initializeWithProgress();
    }),

    vscode.commands.registerCommand('kalai-agent.showModeSelector', async () => {
      await modeSelector.showModeSelector();
    }),

    vscode.commands.registerCommand('kalai-agent.showModeDetails', async () => {
      await modeSelector.showModeDetails();
    }),

    // Phase 3 commands - Multi-File Operations
    vscode.commands.registerCommand('kalai-agent.generateMultiFileCode', async () => {
      const prompt = await vscode.window.showInputBox({
        prompt: 'Describe what you want to generate',
        placeHolder: 'e.g., Create a React component with tests and documentation'
      });

      if (prompt) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
          const targetDir = workspaceFolder.uri.fsPath;
          try {
            const task = await fileOperationsService.generateMultiFileCode(prompt, targetDir, {
              followPatterns: true,
              maintainConsistency: true,
              generateTests: true,
              validateReferences: true
            });

            vscode.window.showInformationMessage(`Multi-file generation completed: ${task.name}`);
          } catch (error) {
            vscode.window.showErrorMessage(`Multi-file generation failed: ${error}`);
          }
        }
      }
    }),

    vscode.commands.registerCommand('kalai-agent.performAdvancedRefactoring', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      const refactoringType = await vscode.window.showQuickPick([
        'rename',
        'extract',
        'move',
        'restructure'
      ], {
        placeHolder: 'Select refactoring type'
      });

      if (refactoringType) {
        try {
          const task = await fileOperationsService.performAdvancedRefactoring({
            targetFiles: [editor.document.uri.fsPath],
            refactoringType: refactoringType as any,
            parameters: {},
            safetyChecks: true
          });

          vscode.window.showInformationMessage(`Advanced refactoring completed: ${task.name}`);
        } catch (error) {
          vscode.window.showErrorMessage(`Advanced refactoring failed: ${error}`);
        }
      }
    }),

    vscode.commands.registerCommand('kalai-agent.validateCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      try {
        const validation = await validationService.validateCode(editor.document.uri.fsPath);
        const message = validation.isValid
          ? 'Code validation passed!'
          : `Code validation found ${validation.errors.length} errors`;

        if (validation.isValid) {
          vscode.window.showInformationMessage(message);
        } else {
          vscode.window.showWarningMessage(message, 'Show Details').then(selection => {
            if (selection === 'Show Details') {
              realTimeFeedbackUI.showFeedbackPanel();
            }
          });
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Code validation failed: ${error}`);
      }
    }),

    vscode.commands.registerCommand('kalai-agent.autoFixErrors', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      try {
        const validation = await validationService.validateCode(editor.document.uri.fsPath);
        const fixableErrors = validation.errors.filter(error => error.fixable);

        if (fixableErrors.length === 0) {
          vscode.window.showInformationMessage('No fixable errors found');
          return;
        }

        const result = await vscode.window.showWarningMessage(
          `Found ${fixableErrors.length} fixable errors. Apply fixes?`,
          'Apply Fixes',
          'Cancel'
        );

        if (result === 'Apply Fixes') {
          const { fixedErrors, appliedFixes } = await validationService.autoFixErrors(
            editor.document.uri.fsPath,
            fixableErrors
          );

          vscode.window.showInformationMessage(`Fixed ${fixedErrors.length} errors`);
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Auto-fix failed: ${error}`);
      }
    }),

    // Phase 4 commands - Coffee Mode
    vscode.commands.registerCommand('kalai-agent.enableCoffeeMode', async () => {
      try {
        await automationService.enableCoffeeMode();
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to enable Coffee Mode: ${error}`);
      }
    }),

    vscode.commands.registerCommand('kalai-agent.disableCoffeeMode', async () => {
      try {
        await automationService.disableCoffeeMode();
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to disable Coffee Mode: ${error}`);
      }
    }),

    vscode.commands.registerCommand('kalai-agent.showCoffeeModeStatus', async () => {
      const status = automationService.getStatus();
      const message = `Coffee Mode Status:
- Enabled: ${status.enabled}
- Running: ${status.isRunning}
- Active Tasks: ${status.activeTasks}
- Queued Tasks: ${status.queuedTasks}
- Safety Level: ${status.config.safetyLevel}`;

      vscode.window.showInformationMessage(message, { modal: true });
    }),

    vscode.commands.registerCommand('kalai-agent.viewCoffeeModeTask', async (taskId: string) => {
      const task = automationService.getActiveTasks().find(t => t.id === taskId);
      if (task) {
        const message = `Coffee Mode Task: ${task.name}
Description: ${task.description}
Status: ${task.status}
Priority: ${task.priority}
Estimated Time: ${task.estimatedTime} minutes
Files: ${task.files.length}`;

        vscode.window.showInformationMessage(message, { modal: true });
      }
    }),

    vscode.commands.registerCommand('kalai-agent.showRealTimeFeedback', () => {
      realTimeFeedbackUI.showFeedbackPanel();
    }),

    vscode.commands.registerCommand('kalai-agent.showValidationResults', () => {
      realTimeFeedbackUI.showFeedbackPanel();
    }),

    // Phase 5 commands - Testing & Performance
    vscode.commands.registerCommand('kalai-agent.generateTestSuite', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      const options = await vscode.window.showQuickPick([
        'Unit Tests',
        'Integration Tests',
        'E2E Tests',
        'Performance Tests',
        'Complete Test Suite'
      ], {
        placeHolder: 'Select test type to generate'
      });

      if (options) {
        try {
          const testTypes = options === 'Complete Test Suite'
            ? ['unit', 'integration', 'e2e'] as const
            : [options.toLowerCase().replace(' tests', '').replace(' ', '-')] as const;

          const testSuite = await testingService.generateTestSuite(
            editor.document.uri.fsPath,
            undefined,
            {
              testTypes: testTypes as any,
              coverageTarget: 80,
              includeEdgeCases: true,
              includePerformanceTests: options === 'Performance Tests'
            }
          );

          vscode.window.showInformationMessage(
            `Generated ${testSuite.tests.length} tests for ${testSuite.name}`,
            'Run Tests'
          ).then(selection => {
            if (selection === 'Run Tests') {
              vscode.commands.executeCommand('kalai-agent.runTestSuite', testSuite.id);
            }
          });
        } catch (error) {
          vscode.window.showErrorMessage(`Test generation failed: ${error}`);
        }
      }
    }),

    vscode.commands.registerCommand('kalai-agent.runTestSuite', async (testSuiteId?: string) => {
      if (!testSuiteId) {
        const testSuites = testingService.getAllTestSuites();
        if (testSuites.length === 0) {
          vscode.window.showInformationMessage('No test suites available');
          return;
        }

        const selected = await vscode.window.showQuickPick(
          testSuites.map(suite => ({
            label: suite.name,
            description: `${suite.tests.length} tests`,
            detail: suite.description,
            id: suite.id
          })),
          { placeHolder: 'Select test suite to run' }
        );

        if (!selected) return;
        testSuiteId = selected.id;
      }

      try {
        const results = await testingService.runTestSuite(testSuiteId);
        const message = `Test Results: ${results.passedTests}/${results.totalTests} passed (${results.duration}ms)`;

        if (results.failedTests > 0) {
          vscode.window.showWarningMessage(message, 'View Details').then(selection => {
            if (selection === 'View Details') {
              vscode.commands.executeCommand('kalai-agent.showTestResults', testSuiteId);
            }
          });
        } else {
          vscode.window.showInformationMessage(message);
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Test execution failed: ${error}`);
      }
    }),

    vscode.commands.registerCommand('kalai-agent.showTestResults', async (testSuiteId: string) => {
      const results = testingService.getTestResults(testSuiteId);
      if (!results) {
        vscode.window.showErrorMessage('Test results not found');
        return;
      }

      const details = `Test Results Summary:
- Total Tests: ${results.totalTests}
- Passed: ${results.passedTests}
- Failed: ${results.failedTests}
- Duration: ${results.duration}ms
- Coverage: ${results.coverage.percentage}%

${results.failureDetails.length > 0 ? `\nFailures:\n${results.failureDetails.map(f => `- ${f.testName}: ${f.errorMessage}`).join('\n')}` : ''}`;

      vscode.window.showInformationMessage(details, { modal: true });
    }),

    vscode.commands.registerCommand('kalai-agent.runPerformanceBenchmark', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      try {
        const results = await testingService.runPerformanceBenchmarks(editor.document.uri.fsPath);
        const message = results.passed
          ? `Performance benchmark passed: ${results.metrics.executionTime.toFixed(2)}ms`
          : `Performance benchmark failed: ${results.violations.join(', ')}`;

        if (results.passed) {
          vscode.window.showInformationMessage(message);
        } else {
          vscode.window.showWarningMessage(message);
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Performance benchmark failed: ${error}`);
      }
    }),

    vscode.commands.registerCommand('kalai-agent.startPerformanceMonitoring', () => {
      try {
        performanceService.startMonitoring();
        vscode.window.showInformationMessage('Performance monitoring started');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to start performance monitoring: ${error}`);
      }
    }),

    vscode.commands.registerCommand('kalai-agent.stopPerformanceMonitoring', () => {
      try {
        performanceService.stopMonitoring();
        vscode.window.showInformationMessage('Performance monitoring stopped');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to stop performance monitoring: ${error}`);
      }
    }),

    vscode.commands.registerCommand('kalai-agent.showPerformanceReport', async () => {
      const status = performanceService.getPerformanceStatus();
      const message = `Performance Status: ${status.status.toUpperCase()}
Active Alerts: ${status.activeAlerts.length}
Uptime: ${Math.round(status.uptime / 1000)}s

${status.metrics ? `Current Metrics:
- Memory: ${Math.round(status.metrics.memoryMetrics.heapUsed / 1024 / 1024)}MB
- CPU: ${status.metrics.cpuMetrics.cpuUsage.toFixed(1)}%
- Response Time: ${status.metrics.responseTimeMetrics.averageResponseTime.toFixed(0)}ms` : ''}`;

      vscode.window.showInformationMessage(message, { modal: true });
    }),

    vscode.commands.registerCommand('kalai-agent.generatePerformanceReport', async () => {
      const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
      const endTime = new Date();

      try {
        const report = await performanceService.generatePerformanceReport(startTime, endTime);
        const message = `Performance Report Generated:
Period: ${report.period.start.toLocaleString()} - ${report.period.end.toLocaleString()}
Total Requests: ${report.summary.totalRequests}
Average Response Time: ${report.summary.averageResponseTime.toFixed(0)}ms
Error Rate: ${report.summary.errorRate.toFixed(2)}%
Reliability: ${report.summary.reliability.toFixed(1)}%

Alerts: ${report.alerts.length}
Recommendations: ${report.recommendations.length}`;

        vscode.window.showInformationMessage(message, { modal: true });
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to generate performance report: ${error}`);
      }
    }),

    // Phase 6 commands - Semantic Analysis & Repository Insights
    vscode.commands.registerCommand('kalai-agent.analyzeSemantics', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      try {
        const analysis = await semanticService.analyzeFile(editor.document.uri.fsPath);
        const message = `Semantic Analysis Complete:
Functions: ${analysis.astAnalysis.functions.length}
Classes: ${analysis.astAnalysis.classes.length}
Complexity: ${analysis.complexityMetrics.cyclomaticComplexity}
Code Smells: ${analysis.codeSmells.length}
Patterns: ${analysis.semanticPatterns.length}
Suggestions: ${analysis.suggestedImprovements.length}`;

        vscode.window.showInformationMessage(message, 'View Details').then(selection => {
          if (selection === 'View Details') {
            vscode.commands.executeCommand('kalai-agent.showSemanticAnalysis', analysis.id);
          }
        });
      } catch (error) {
        vscode.window.showErrorMessage(`Semantic analysis failed: ${error}`);
      }
    }),

    vscode.commands.registerCommand('kalai-agent.showSemanticAnalysis', async (analysisId: string) => {
      // This would show detailed semantic analysis in a webview
      vscode.window.showInformationMessage('Detailed semantic analysis view would be shown here');
    }),

    vscode.commands.registerCommand('kalai-agent.analyzeCodeQuality', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      try {
        const report = await semanticService.analyzeCodeQuality(editor.document.uri.fsPath);
        const message = `Code Quality Report:
Overall Score: ${report.overallScore}/100
Maintainability: ${report.maintainabilityScore}/100
Readability: ${report.readabilityScore}/100
Performance: ${report.performanceScore}/100
Security: ${report.securityScore}/100
Testability: ${report.testabilityScore}/100

Issues: ${report.issues.length}
Recommendations: ${report.recommendations.length}`;

        vscode.window.showInformationMessage(message, { modal: true });
      } catch (error) {
        vscode.window.showErrorMessage(`Code quality analysis failed: ${error}`);
      }
    }),

    vscode.commands.registerCommand('kalai-agent.generateRepositoryInsights', async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
      }

      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: '🔍 Generating Repository Insights',
        cancellable: false
      }, async (progress) => {
        progress.report({ increment: 0, message: 'Analyzing repository structure...' });

        try {
          const insights = await insightsService.generateRepositoryInsights(
            workspaceFolder.uri.fsPath
          );

          progress.report({ increment: 100, message: 'Complete!' });

          const summary = insightsService.getInsightsSummary(insights);
          vscode.window.showInformationMessage(
            `Repository insights generated successfully!`,
            'View Summary',
            'View Details'
          ).then(selection => {
            if (selection === 'View Summary') {
              vscode.window.showInformationMessage(summary, { modal: true });
            } else if (selection === 'View Details') {
              vscode.commands.executeCommand('kalai-agent.showRepositoryInsights', insights.id);
            }
          });
        } catch (error) {
          vscode.window.showErrorMessage(`Repository insights generation failed: ${error}`);
        }
      });
    }),

    vscode.commands.registerCommand('kalai-agent.showRepositoryInsights', async (insightsId: string) => {
      const insights = insightsService.getRepositoryInsights(insightsId);
      if (!insights) {
        vscode.window.showErrorMessage('Repository insights not found');
        return;
      }

      const details = `Repository Health Dashboard:
Overall Health: ${insights.healthScore.overall}/100
Technical Debt: ${insights.technicalDebt.totalDebt} hours
Security Risk: ${insights.security.riskScore}/100
Performance Score: ${insights.performance.metrics.complexity}/100
Test Coverage: ${insights.testability.coverage.overall}%

Top Issues:
${insights.recommendations.slice(0, 3).map(r => `- ${r.title} (${r.priority})`).join('\n')}`;

      vscode.window.showInformationMessage(details, { modal: true });
    }),

    vscode.commands.registerCommand('kalai-agent.predictCodeSuggestions', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      const position = editor.selection.active;
      const line = position.line;
      const column = position.character;
      const context = editor.document.getText(new vscode.Range(
        new vscode.Position(Math.max(0, line - 5), 0),
        new vscode.Position(line + 5, 0)
      ));

      try {
        const suggestions = await semanticService.generateContextualSuggestions(
          editor.document.uri.fsPath,
          line,
          column,
          context
        );

        if (suggestions.length === 0) {
          vscode.window.showInformationMessage('No suggestions available for current context');
          return;
        }

        const selected = await vscode.window.showQuickPick(
          suggestions.map(s => ({
            label: s.title,
            description: `${s.category} (${Math.round(s.confidence * 100)}% confidence)`,
            detail: s.description,
            suggestion: s
          })),
          { placeHolder: 'Select suggestion to apply' }
        );

        if (selected) {
          // Apply the suggestion
          const suggestion = selected.suggestion;
          if (suggestion.code) {
            await editor.edit(editBuilder => {
              editBuilder.replace(editor.selection, suggestion.code);
            });
            vscode.window.showInformationMessage(`Applied suggestion: ${suggestion.title}`);
          }
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to generate suggestions: ${error}`);
      }
    }),

    vscode.commands.registerCommand('kalai-agent.clearAnalysisCache', () => {
      try {
        semanticService.clearCache();
        insightsService.clearCache();
        vscode.window.showInformationMessage('Analysis cache cleared successfully');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to clear cache: ${error}`);
      }
    }),

    vscode.commands.registerCommand('kalai-agent.showAnalysisStats', async () => {
      const stats = semanticService.getAnalysisStats();
      const message = `Analysis Statistics:
Cached Analyses: ${stats.cachedAnalyses}
Cached ASTs: ${stats.cachedASTs}
Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%

Performance Monitoring: ${performanceService.getPerformanceStatus().status}
Testing Service: ${testingService.getStatus().totalSuites} test suites`;

      vscode.window.showInformationMessage(message, { modal: true });
    }),

    // Phase 7 commands - Enterprise Features
    vscode.commands.registerCommand('kalai-agent.switchAIModel', async () => {
      const availableModels = modelService.getAvailableModels();
      const modelOptions = availableModels.map(model => ({
        label: model.name,
        description: `${model.performance.speed} speed, ${Math.round(model.performance.accuracy * 100)}% accuracy`,
        detail: model.description,
        id: model.id
      }));

      const selected = await vscode.window.showQuickPick(modelOptions, {
        placeHolder: 'Select AI model for this session'
      });

      if (selected) {
        try {
          // Update AI service to use selected model
          await enhancedAIService.switchModel(selected.id);
          vscode.window.showInformationMessage(`Switched to ${selected.label} model`);
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to switch model: ${error}`);
        }
      }
    }),

    vscode.commands.registerCommand('kalai-agent.showModelPerformance', async () => {
      const performanceHistory = modelService.getModelPerformanceHistory();
      if (performanceHistory.length === 0) {
        vscode.window.showInformationMessage('No model performance data available');
        return;
      }

      const performanceData = performanceHistory.map(p =>
        `${p.modelId}: ${p.successRate.toFixed(1)}% success, ${p.averageResponseTime.toFixed(0)}ms avg`
      ).join('\n');

      const message = `Model Performance History:
${performanceData}

Use Command Palette > "Kalai: Switch AI Model" to change models`;

      vscode.window.showInformationMessage(message, { modal: true });
    }),

    vscode.commands.registerCommand('kalai-agent.shareCodeContext', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText) {
        vscode.window.showErrorMessage('Please select code to share');
        return;
      }

      const shareOptions = await vscode.window.showQuickPick([
        'Share with Team',
        'Create Code Review Session',
        'Start Pair Programming',
        'Add to Knowledge Base'
      ], {
        placeHolder: 'How would you like to share this code?'
      });

      if (shareOptions) {
        try {
          const contextContent = {
            code: selectedText,
            file: editor.document.uri.fsPath,
            language: editor.document.languageId,
            selection: {
              start: selection.start,
              end: selection.end
            }
          };

          switch (shareOptions) {
            case 'Share with Team':
              const context = await collaborationService.shareContext(
                vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
                'code-selection',
                contextContent,
                ['team'], // Would get actual team members
                []
              );
              vscode.window.showInformationMessage(`Code shared with team (ID: ${context.id})`);
              break;

            case 'Create Code Review Session':
              const reviewSession = await collaborationService.createCodeReviewSession(
                [editor.document.uri.fsPath],
                ['team-member-1', 'team-member-2'], // Would get actual reviewers
                'Code review for selected code'
              );
              vscode.window.showInformationMessage(`Code review session created: ${reviewSession.name}`);
              break;

            case 'Start Pair Programming':
              const pairSession = await collaborationService.startCollaborationSession(
                'Pair Programming',
                'Collaborative coding session',
                'pair-programming',
                'context-id',
                ['pair-partner']
              );
              vscode.window.showInformationMessage(`Pair programming session started: ${pairSession.name}`);
              break;

            case 'Add to Knowledge Base':
              const knowledgeItem = await collaborationService.createKnowledgeItem(
                'Code Example',
                `\`\`\`${editor.document.languageId}\n${selectedText}\n\`\`\``,
                'pattern',
                ['code-example', editor.document.languageId]
              );
              vscode.window.showInformationMessage(`Added to knowledge base: ${knowledgeItem.title}`);
              break;
          }
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to share code: ${error}`);
        }
      }
    }),

    vscode.commands.registerCommand('kalai-agent.searchKnowledgeBase', async () => {
      const query = await vscode.window.showInputBox({
        placeHolder: 'Search knowledge base (patterns, examples, documentation...)',
        prompt: 'Enter search query'
      });

      if (query) {
        try {
          const results = await collaborationService.searchKnowledgeBase(query, {});

          if (results.length === 0) {
            vscode.window.showInformationMessage('No results found');
            return;
          }

          const resultOptions = results.slice(0, 10).map(item => ({
            label: item.title,
            description: item.type,
            detail: item.content.substring(0, 100) + '...',
            item
          }));

          const selected = await vscode.window.showQuickPick(resultOptions, {
            placeHolder: `Found ${results.length} results`
          });

          if (selected) {
            vscode.window.showInformationMessage(selected.item.content, { modal: true });
          }
        } catch (error) {
          vscode.window.showErrorMessage(`Knowledge base search failed: ${error}`);
        }
      }
    }),

    vscode.commands.registerCommand('kalai-agent.generateTeamInsights', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const endDate = new Date();

      try {
        const insights = await collaborationService.generateTeamInsights('default-team', {
          start: startDate,
          end: endDate
        });

        const message = `Team Insights (Last 30 Days):

📊 Productivity:
- Total Commits: ${insights.productivity.totalCommits}
- Features Completed: ${insights.productivity.featuresCompleted}
- Bugs Fixed: ${insights.productivity.bugsFixed}
- Code Reviews: ${insights.productivity.reviewsCompleted}

🤝 Collaboration:
- Pair Programming: ${insights.collaboration.pairProgrammingSessions} sessions
- Knowledge Sharing: ${insights.collaboration.knowledgeSharing} activities
- Code Review Participation: ${(insights.collaboration.codeReviewParticipation * 100).toFixed(1)}%

⭐ Code Quality:
- Average Quality: ${(insights.codeQuality.averageQuality * 100).toFixed(1)}%
- Test Coverage: ${(insights.codeQuality.testCoverage * 100).toFixed(1)}%
- Technical Debt: ${(insights.codeQuality.technicalDebt * 100).toFixed(1)}%

📚 Knowledge:
- Documentation Coverage: ${(insights.knowledge.documentationCoverage * 100).toFixed(1)}%
- Learning Progress: ${(insights.knowledge.learningProgress * 100).toFixed(1)}%

🔍 Top Recommendations:
${insights.recommendations.slice(0, 3).map(r => `- ${r.title}`).join('\n')}`;

        vscode.window.showInformationMessage(message, { modal: true });
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to generate team insights: ${error}`);
      }
    }),

    vscode.commands.registerCommand('kalai-agent.managePlugins', async () => {
      const plugins = pluginService.getPlugins();
      const pluginOptions = plugins.map(plugin => ({
        label: plugin.name,
        description: `v${plugin.version} - ${plugin.status.state}`,
        detail: plugin.description,
        plugin
      }));

      const selected = await vscode.window.showQuickPick(pluginOptions, {
        placeHolder: 'Select plugin to manage'
      });

      if (selected) {
        const plugin = selected.plugin;
        const actions = [];

        if (plugin.status.state === 'active') {
          actions.push('Deactivate');
        } else if (plugin.status.state === 'inactive') {
          actions.push('Activate');
        }

        actions.push('Show Info', 'Show Capabilities', 'Uninstall');

        const action = await vscode.window.showQuickPick(actions, {
          placeHolder: `What would you like to do with ${plugin.name}?`
        });

        if (action) {
          try {
            switch (action) {
              case 'Activate':
                await pluginService.activatePlugin(plugin.id);
                vscode.window.showInformationMessage(`Activated ${plugin.name}`);
                break;
              case 'Deactivate':
                await pluginService.deactivatePlugin(plugin.id);
                vscode.window.showInformationMessage(`Deactivated ${plugin.name}`);
                break;
              case 'Show Info':
                const info = `Plugin: ${plugin.name} v${plugin.version}
Author: ${plugin.author}
Status: ${plugin.status.state}
Health: ${plugin.status.health}
Usage: ${plugin.metadata.usageCount} times
Rating: ${plugin.metadata.userRating}/5

${plugin.description}`;
                vscode.window.showInformationMessage(info, { modal: true });
                break;
              case 'Show Capabilities':
                const capabilities = plugin.capabilities.map(cap =>
                  `- ${cap.name} (${cap.type}): ${cap.description}`
                ).join('\n');
                vscode.window.showInformationMessage(`Capabilities:\n${capabilities}`, { modal: true });
                break;
              case 'Uninstall':
                const confirm = await vscode.window.showWarningMessage(
                  `Are you sure you want to uninstall ${plugin.name}?`,
                  'Yes', 'No'
                );
                if (confirm === 'Yes') {
                  await pluginService.uninstallPlugin(plugin.id);
                  vscode.window.showInformationMessage(`Uninstalled ${plugin.name}`);
                }
                break;
            }
          } catch (error) {
            vscode.window.showErrorMessage(`Plugin action failed: ${error}`);
          }
        }
      }
    }),

    vscode.commands.registerCommand('kalai-agent.installPlugin', async () => {
      const installOptions = await vscode.window.showQuickPick([
        'Install from Local File',
        'Install from URL',
        'Browse Plugin Marketplace'
      ], {
        placeHolder: 'How would you like to install a plugin?'
      });

      if (installOptions) {
        try {
          switch (installOptions) {
            case 'Install from Local File':
              const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                  'Plugin Files': ['zip', 'tar.gz']
                }
              });
              if (fileUri && fileUri[0]) {
                await pluginService.installPlugin(fileUri[0].fsPath, 'local');
                vscode.window.showInformationMessage('Plugin installed successfully');
              }
              break;

            case 'Install from URL':
              const url = await vscode.window.showInputBox({
                placeHolder: 'Enter plugin URL (Git repository or download link)',
                prompt: 'Plugin URL'
              });
              if (url) {
                await pluginService.installPlugin(url, 'remote');
                vscode.window.showInformationMessage('Plugin installed successfully');
              }
              break;

            case 'Browse Plugin Marketplace':
              vscode.window.showInformationMessage('Plugin marketplace browser would open here');
              break;
          }
        } catch (error) {
          vscode.window.showErrorMessage(`Plugin installation failed: ${error}`);
        }
      }
    }),

    vscode.commands.registerCommand('kalai-agent.manageIntegrations', async () => {
      const integrations = integrationService.getIntegrations();
      const integrationOptions = integrations.map(integration => ({
        label: integration.name,
        description: `${integration.type.provider} - ${integration.status.state}`,
        detail: integration.type.category,
        integration
      }));

      const selected = await vscode.window.showQuickPick(integrationOptions, {
        placeHolder: 'Select integration to manage'
      });

      if (selected) {
        const integration = selected.integration;
        const actions = [];

        if (integration.status.state === 'connected') {
          actions.push('Disconnect', 'Test Connection', 'Show Status');
        } else {
          actions.push('Connect');
        }

        actions.push('Show Info', 'Show Capabilities', 'Remove');

        const action = await vscode.window.showQuickPick(actions, {
          placeHolder: `What would you like to do with ${integration.name}?`
        });

        if (action) {
          try {
            switch (action) {
              case 'Connect':
                const credentials = await vscode.window.showInputBox({
                  placeHolder: 'Enter API key or token',
                  prompt: `Connect to ${integration.name}`,
                  password: true
                });
                if (credentials) {
                  await integrationService.connectIntegration(integration.id, { token: credentials });
                  vscode.window.showInformationMessage(`Connected to ${integration.name}`);
                }
                break;

              case 'Disconnect':
                await integrationService.disconnectIntegration(integration.id);
                vscode.window.showInformationMessage(`Disconnected from ${integration.name}`);
                break;

              case 'Test Connection':
                await integrationService.checkIntegrationHealth(integration.id);
                vscode.window.showInformationMessage(`Connection test completed for ${integration.name}`);
                break;

              case 'Show Status':
                const status = integration.status;
                const statusMessage = `Status: ${status.state}
Health: ${status.health}
Last Check: ${status.lastCheck.toLocaleString()}
Uptime: ${(status.uptime / 1000).toFixed(0)}s
Requests: ${status.metrics.requestCount}
Success Rate: ${(status.metrics.successRate * 100).toFixed(1)}%
Errors: ${status.errors.length}`;
                vscode.window.showInformationMessage(statusMessage, { modal: true });
                break;

              case 'Show Info':
                const info = `Integration: ${integration.name}
Provider: ${integration.type.provider}
Category: ${integration.type.category}
Version: ${integration.metadata.version}

${integration.type.category === 'cicd' ? 'CI/CD pipeline integration' :
                    integration.type.category === 'cloud' ? 'Cloud platform integration' :
                      integration.type.category === 'security' ? 'Security scanning integration' :
                        'Enterprise integration'}`;
                vscode.window.showInformationMessage(info, { modal: true });
                break;

              case 'Show Capabilities':
                const capabilities = integration.capabilities.map(cap =>
                  `- ${cap.name} (${cap.type}): ${cap.description}`
                ).join('\n');
                vscode.window.showInformationMessage(`Capabilities:\n${capabilities}`, { modal: true });
                break;

              case 'Remove':
                const confirm = await vscode.window.showWarningMessage(
                  `Are you sure you want to remove ${integration.name}?`,
                  'Yes', 'No'
                );
                if (confirm === 'Yes') {
                  await integrationService.removeIntegration(integration.id);
                  vscode.window.showInformationMessage(`Removed ${integration.name}`);
                }
                break;
            }
          } catch (error) {
            vscode.window.showErrorMessage(`Integration action failed: ${error}`);
          }
        }
      }
    }),

    vscode.commands.registerCommand('kalai-agent.triggerCIPipeline', async () => {
      const cicdIntegrations = integrationService.getIntegrationsByCategory('cicd');

      if (cicdIntegrations.length === 0) {
        vscode.window.showErrorMessage('No CI/CD integrations configured');
        return;
      }

      const connected = cicdIntegrations.filter(i => i.status.state === 'connected');
      if (connected.length === 0) {
        vscode.window.showErrorMessage('No connected CI/CD integrations');
        return;
      }

      const integrationOptions = connected.map(integration => ({
        label: integration.name,
        description: integration.type.provider,
        id: integration.id
      }));

      const selected = await vscode.window.showQuickPick(integrationOptions, {
        placeHolder: 'Select CI/CD integration'
      });

      if (selected) {
        const pipelineId = await vscode.window.showInputBox({
          placeHolder: 'Enter pipeline/workflow ID',
          prompt: 'Pipeline ID'
        });

        if (pipelineId) {
          try {
            const result = await integrationService.triggerPipeline(
              selected.id,
              pipelineId,
              {}
            );
            vscode.window.showInformationMessage(`Pipeline triggered: ${result.workflowId || result.pipelineId}`);
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to trigger pipeline: ${error}`);
          }
        }
      }
    }),

    vscode.commands.registerCommand('kalai-agent.sendTeamNotification', async () => {
      const collaborationIntegrations = integrationService.getIntegrationsByCategory('collaboration');

      if (collaborationIntegrations.length === 0) {
        vscode.window.showErrorMessage('No collaboration integrations configured');
        return;
      }

      const connected = collaborationIntegrations.filter(i => i.status.state === 'connected');
      if (connected.length === 0) {
        vscode.window.showErrorMessage('No connected collaboration integrations');
        return;
      }

      const integrationOptions = connected.map(integration => ({
        label: integration.name,
        description: integration.type.provider,
        id: integration.id
      }));

      const selected = await vscode.window.showQuickPick(integrationOptions, {
        placeHolder: 'Select collaboration platform'
      });

      if (selected) {
        const channel = await vscode.window.showInputBox({
          placeHolder: 'Enter channel/room name',
          prompt: 'Channel'
        });

        if (channel) {
          const message = await vscode.window.showInputBox({
            placeHolder: 'Enter notification message',
            prompt: 'Message'
          });

          if (message) {
            try {
              await integrationService.sendNotification(
                selected.id,
                channel,
                message,
                'medium'
              );
              vscode.window.showInformationMessage('Notification sent successfully');
            } catch (error) {
              vscode.window.showErrorMessage(`Failed to send notification: ${error}`);
            }
          }
        }
      }
    }),

    vscode.commands.registerCommand('kalai-agent.runSecurityScan', async () => {
      const securityIntegrations = integrationService.getIntegrationsByCategory('security');

      if (securityIntegrations.length === 0) {
        vscode.window.showErrorMessage('No security integrations configured');
        return;
      }

      const connected = securityIntegrations.filter(i => i.status.state === 'connected');
      if (connected.length === 0) {
        vscode.window.showErrorMessage('No connected security integrations');
        return;
      }

      const integrationOptions = connected.map(integration => ({
        label: integration.name,
        description: integration.type.provider,
        id: integration.id
      }));

      const selected = await vscode.window.showQuickPick(integrationOptions, {
        placeHolder: 'Select security scanner'
      });

      if (selected) {
        const scanTypes = ['SAST', 'DAST', 'Dependency Scan', 'Container Scan'];
        const scanType = await vscode.window.showQuickPick(scanTypes, {
          placeHolder: 'Select scan type'
        });

        if (scanType) {
          const target = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '.';

          try {
            const result = await integrationService.runSecurityScan(
              selected.id,
              target,
              scanType.toLowerCase().replace(' ', '-')
            );
            vscode.window.showInformationMessage(`Security scan started: ${result.scanId}`);
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to start security scan: ${error}`);
          }
        }
      }
    }),

    vscode.commands.registerCommand('kalai-agent.showCloudResources', async () => {
      const cloudIntegrations = integrationService.getIntegrationsByCategory('cloud');

      if (cloudIntegrations.length === 0) {
        vscode.window.showErrorMessage('No cloud integrations configured');
        return;
      }

      const connected = cloudIntegrations.filter(i => i.status.state === 'connected');
      if (connected.length === 0) {
        vscode.window.showErrorMessage('No connected cloud integrations');
        return;
      }

      const integrationOptions = connected.map(integration => ({
        label: integration.name,
        description: integration.type.provider,
        id: integration.id
      }));

      const selected = await vscode.window.showQuickPick(integrationOptions, {
        placeHolder: 'Select cloud provider'
      });

      if (selected) {
        try {
          const resources = await integrationService.getCloudResources(selected.id);
          vscode.window.showInformationMessage(
            `Cloud resources: ${resources.instances?.length || 0} instances, Total: ${resources.total || 0}`,
            { modal: true }
          );
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to get cloud resources: ${error}`);
        }
      }
    }),

    // Chat utility commands
    vscode.commands.registerCommand('kalai-agent.clearConversation', () => {
      enhancedAIService.clearConversationHistory();
      chatViewProvider.sendMessage('Conversation cleared!');
    })
  ];

  // Add all commands to subscriptions
  commands.forEach(command => context.subscriptions.push(command));

  // Add service disposal to subscriptions
  context.subscriptions.push({
    dispose: () => {
      repositoryAnalysisService.dispose();
      statusBarManager.dispose();
      realTimeFeedbackUI.dispose();
      performanceService.dispose();
      semanticService.clearCache();
      insightsService.clearCache();
      modelService.clearPerformanceHistory();
      collaborationService.clearAllData();
      pluginService.clearAllData();
      integrationService.clearAllData();
    }
  });
}

export function deactivate() {
  console.log('🔄 Kalai Agent is now deactivated');
}