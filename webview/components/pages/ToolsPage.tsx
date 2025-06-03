import React, { useState, useEffect } from 'react';
import {
  Search,
  Speed,
  BarChart,
  Language,
  Build,
  Folder,
  MenuBook,
  Engineering,
  BugReport,
  Science,
  TrendingUp,
  Extension,
  Close,
  Security,
  Inventory
} from '@mui/icons-material';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactElement;
  category: string;
  action: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactElement;
}

interface ToolsPageProps {
  vscode: any;
  onClose: () => void;
}

export const ToolsPage: React.FC<ToolsPageProps> = ({ vscode, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toolResults, setToolResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const tools: Tool[] = [
    {
      id: 'analyze-codebase',
      name: 'Analyze Codebase',
      description: 'Perform comprehensive analysis of the entire codebase',
      icon: <Search fontSize="small" />,
      category: 'analysis',
      action: 'analyzeCodebase'
    },
    {
      id: 'find-issues',
      name: 'Find Issues',
      description: 'Scan for potential bugs, security issues, and code smells',
      icon: <BugReport fontSize="small" />,
      category: 'analysis',
      action: 'findIssues'
    },
    {
      id: 'generate-docs',
      name: 'Generate Documentation',
      description: 'Auto-generate documentation for your project',
      icon: <MenuBook fontSize="small" />,
      category: 'documentation',
      action: 'generateDocs'
    },
    {
      id: 'optimize-code',
      name: 'Optimize Code',
      description: 'Suggest performance optimizations and improvements',
      icon: <Speed fontSize="small" />,
      category: 'optimization',
      action: 'optimizeCode'
    },
    {
      id: 'refactor-suggestions',
      name: 'Refactor Suggestions',
      description: 'Get suggestions for code refactoring and restructuring',
      icon: <Engineering fontSize="small" />,
      category: 'refactoring',
      action: 'refactorSuggestions'
    },
    {
      id: 'dependency-analysis',
      name: 'Dependency Analysis',
      description: 'Analyze project dependencies and suggest updates',
      icon: <Inventory fontSize="small" />,
      category: 'dependencies',
      action: 'analyzeDependencies'
    },
    {
      id: 'security-audit',
      name: 'Security Audit',
      description: 'Check for security vulnerabilities and best practices',
      icon: <Security fontSize="small" />,
      category: 'security',
      action: 'securityAudit'
    },
    {
      id: 'test-coverage',
      name: 'Test Coverage',
      description: 'Analyze test coverage and suggest improvements',
      icon: <Science fontSize="small" />,
      category: 'testing',
      action: 'testCoverage'
    },
    {
      id: 'performance-analysis',
      name: 'Performance Analysis',
      description: 'Analyze code performance and bottlenecks',
      icon: <BarChart fontSize="small" />,
      category: 'performance',
      action: 'performanceAnalysis'
    },
    {
      id: 'code-complexity',
      name: 'Code Complexity',
      description: 'Measure and analyze code complexity metrics',
      icon: <TrendingUp fontSize="small" />,
      category: 'metrics',
      action: 'codeComplexity'
    },
    {
      id: 'web-search',
      name: 'Web Search',
      description: 'Search for latest information and best practices',
      icon: <Language fontSize="small" />,
      category: 'research',
      action: 'webSearch'
    },
    {
      id: 'api-integration',
      name: 'API Integration',
      description: 'Help with API integration and external services',
      icon: <Extension fontSize="small" />,
      category: 'integration',
      action: 'apiIntegration'
    }
  ];

  const categories: Category[] = [
    { id: 'all', name: 'All Tools', icon: <Build fontSize="small" /> },
    { id: 'analysis', name: 'Analysis', icon: <Search fontSize="small" /> },
    { id: 'documentation', name: 'Documentation', icon: <MenuBook fontSize="small" /> },
    { id: 'optimization', name: 'Optimization', icon: <Speed fontSize="small" /> },
    { id: 'refactoring', name: 'Refactoring', icon: <Engineering fontSize="small" /> },
    { id: 'dependencies', name: 'Dependencies', icon: <Inventory fontSize="small" /> },
    { id: 'security', name: 'Security', icon: <Security fontSize="small" /> },
    { id: 'testing', name: 'Testing', icon: <Science fontSize="small" /> },
    { id: 'performance', name: 'Performance', icon: <BarChart fontSize="small" /> },
    { id: 'metrics', name: 'Metrics', icon: <TrendingUp fontSize="small" /> },
    { id: 'research', name: 'Research', icon: <Language fontSize="small" /> },
    { id: 'integration', name: 'Integration', icon: <Extension fontSize="small" /> }
  ];

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === 'toolResult') {
        setToolResults(prev => ({
          ...prev,
          [message.toolId]: message.result
        }));
        setLoading(prev => ({
          ...prev,
          [message.toolId]: false
        }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const runTool = (tool: Tool) => {
    setLoading(prev => ({ ...prev, [tool.id]: true }));
    vscode.postMessage({
      command: 'runTool',
      toolId: tool.id,
      action: tool.action
    });
  };

  const filteredTools = selectedCategory === 'all'
    ? tools
    : tools.filter(tool => tool.category === selectedCategory);

  const renderToolResult = (toolId: string, result: any) => {
    if (!result) return null;

    return (
      <div className="tool-result">
        <div className="result-header">
          <span className="result-title">Results</span>
          <button
            className="close-result"
            onClick={() => setToolResults(prev => {
              const newResults = { ...prev };
              delete newResults[toolId];
              return newResults;
            })}
          >
            ✕
          </button>
        </div>
        <div className="result-content">
          {typeof result === 'string' ? (
            <pre>{result}</pre>
          ) : (
            <div>
              {Object.entries(result).map(([key, value]) => (
                <div key={key} className="result-item">
                  <strong>{key}:</strong> {JSON.stringify(value, null, 2)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="tools-page">
      <style>{`
        .tools-page {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
          font-family: var(--vscode-font-family);
        }

        .tools-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--vscode-panel-border);
          background: var(--vscode-sideBarSectionHeader-background);
        }

        .tools-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .close-button {
          background: none;
          border: none;
          color: var(--vscode-foreground);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 16px;
        }

        .close-button:hover {
          background: var(--vscode-toolbar-hoverBackground);
        }

        .tools-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .categories-sidebar {
          width: 200px;
          background: var(--vscode-sideBar-background);
          border-right: 1px solid var(--vscode-panel-border);
          overflow-y: auto;
        }

        .category-item {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 13px;
          border-bottom: 1px solid var(--vscode-panel-border);
        }

        .category-item:hover {
          background: var(--vscode-list-hoverBackground);
        }

        .category-item.active {
          background: var(--vscode-list-activeSelectionBackground);
          color: var(--vscode-list-activeSelectionForeground);
        }

        .category-icon {
          margin-right: 8px;
          font-size: 14px;
        }

        .tools-grid {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
          align-content: start;
        }

        .tool-card {
          background: var(--vscode-input-background);
          border: 1px solid var(--vscode-input-border);
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .tool-card:hover {
          border-color: var(--vscode-focusBorder);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .tool-card.loading {
          opacity: 0.7;
          pointer-events: none;
        }

        .tool-header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }

        .tool-icon {
          font-size: 24px;
          margin-right: 12px;
        }

        .tool-name {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .tool-description {
          font-size: 13px;
          color: var(--vscode-descriptionForeground);
          line-height: 1.4;
          margin-bottom: 12px;
        }

        .tool-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .run-button {
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        }

        .run-button:hover {
          background: var(--vscode-button-hoverBackground);
        }

        .run-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid var(--vscode-progressBar-background);
          border-radius: 50%;
          border-top-color: var(--vscode-button-foreground);
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .tool-result {
          margin-top: 12px;
          background: var(--vscode-editor-background);
          border: 1px solid var(--vscode-panel-border);
          border-radius: 4px;
          overflow: hidden;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: var(--vscode-sideBarSectionHeader-background);
          border-bottom: 1px solid var(--vscode-panel-border);
        }

        .result-title {
          font-size: 12px;
          font-weight: 600;
        }

        .close-result {
          background: none;
          border: none;
          color: var(--vscode-foreground);
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 2px;
          font-size: 12px;
        }

        .close-result:hover {
          background: var(--vscode-toolbar-hoverBackground);
        }

        .result-content {
          padding: 12px;
          max-height: 200px;
          overflow-y: auto;
          font-size: 12px;
          font-family: var(--vscode-editor-font-family);
        }

        .result-content pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .result-item {
          margin: 8px 0;
          padding: 8px;
          background: var(--vscode-textCodeBlock-background);
          border-radius: 4px;
        }
      `}</style>

      <div className="tools-header">
        <h3>
          <Build fontSize="small" style={{ marginRight: '8px' }} />
          Developer Tools
        </h3>
        <button onClick={onClose} className="close-button">
          <Close fontSize="small" />
        </button>
      </div>

      <div className="tools-content">
        <div className="categories-sidebar">
          {categories.map(category => (
            <div
              key={category.id}
              className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span>{category.name}</span>
            </div>
          ))}
        </div>

        <div className="tools-grid">
          {filteredTools.map(tool => (
            <div
              key={tool.id}
              className={`tool-card ${loading[tool.id] ? 'loading' : ''}`}
            >
              <div className="tool-header">
                <span className="tool-icon">{tool.icon}</span>
                <h4 className="tool-name">{tool.name}</h4>
              </div>

              <p className="tool-description">{tool.description}</p>

              <div className="tool-actions">
                <button
                  className="run-button"
                  onClick={() => runTool(tool)}
                  disabled={loading[tool.id]}
                >
                  {loading[tool.id] ? (
                    <>
                      <span className="loading-spinner"></span>
                      <span style={{ marginLeft: '8px' }}>Running...</span>
                    </>
                  ) : (
                    'Run Tool'
                  )}
                </button>
              </div>

              {toolResults[tool.id] && renderToolResult(tool.id, toolResults[tool.id])}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};