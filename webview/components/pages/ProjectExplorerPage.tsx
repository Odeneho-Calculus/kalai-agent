import React, { useState, useEffect } from 'react';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
  extension?: string;
  size?: number;
  lastModified?: string;
}

interface ProjectInfo {
  root: string;
  structure: FileNode;
  summary: {
    totalFiles: number;
    fileTypes: Record<string, number>;
    languages: Record<string, number>;
  };
}

interface ProjectExplorerPageProps {
  vscode: any;
  onClose: () => void;
}

export const ProjectExplorerPage: React.FC<ProjectExplorerPageProps> = ({ vscode, onClose }) => {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProjectInfo();

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.command) {
        case 'projectInfo':
          setProjectInfo(message.data);
          setLoading(false);
          break;
        case 'searchResults':
          setSearchResults(message.data);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const loadProjectInfo = () => {
    setLoading(true);
    vscode.postMessage({ command: 'getProjectInfo' });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      vscode.postMessage({
        command: 'searchInFiles',
        query: searchQuery.trim()
      });
    }
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const openFile = (filePath: string) => {
    vscode.postMessage({
      command: 'openFile',
      path: filePath
    });
    setSelectedFile(filePath);
  };

  const renderFileTree = (node: FileNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile === node.path;

    return (
      <div key={node.path} style={{ marginLeft: depth * 16 }}>
        <div
          className={`file-item ${isSelected ? 'selected' : ''}`}
          onClick={() => {
            if (node.type === 'directory') {
              toggleFolder(node.path);
            } else {
              openFile(node.path);
            }
          }}
        >
          <span className="file-icon">
            {node.type === 'directory' ? (isExpanded ? '📂' : '📁') : getFileIcon(node.extension)}
          </span>
          <span className="file-name">{node.name}</span>
          {node.type === 'file' && node.size && (
            <span className="file-size">{formatFileSize(node.size)}</span>
          )}
        </div>

        {node.type === 'directory' && isExpanded && node.children && (
          <div className="folder-children">
            {node.children.map(child => renderFileTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const getFileIcon = (extension?: string): string => {
    const iconMap: Record<string, string> = {
      '.js': '📄',
      '.ts': '📘',
      '.jsx': '⚛️',
      '.tsx': '⚛️',
      '.vue': '💚',
      '.py': '🐍',
      '.java': '☕',
      '.cpp': '⚙️',
      '.c': '⚙️',
      '.cs': '🔷',
      '.php': '🐘',
      '.rb': '💎',
      '.go': '🐹',
      '.rs': '🦀',
      '.json': '📋',
      '.md': '📝',
      '.txt': '📄',
      '.css': '🎨',
      '.scss': '🎨',
      '.html': '🌐',
      '.xml': '📄',
      '.yml': '⚙️',
      '.yaml': '⚙️'
    };

    return iconMap[extension || ''] || '📄';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="project-explorer loading">
        <div className="explorer-header">
          <h3>🗂️ Project Explorer</h3>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        <div className="loading-spinner">Loading project structure...</div>
      </div>
    );
  }

  return (
    <div className="project-explorer">
      <style>{`
        .project-explorer {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--vscode-sideBar-background);
          color: var(--vscode-sideBar-foreground);
          font-family: var(--vscode-font-family);
        }

        .explorer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--vscode-panel-border);
          background: var(--vscode-sideBarSectionHeader-background);
        }

        .explorer-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .close-button {
          background: none;
          border: none;
          color: var(--vscode-sideBar-foreground);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 16px;
        }

        .close-button:hover {
          background: var(--vscode-toolbar-hoverBackground);
        }

        .search-section {
          padding: 12px 16px;
          border-bottom: 1px solid var(--vscode-panel-border);
        }

        .search-input {
          width: 100%;
          padding: 8px 12px;
          background: var(--vscode-input-background);
          border: 1px solid var(--vscode-input-border);
          border-radius: 4px;
          color: var(--vscode-input-foreground);
          font-size: 13px;
        }

        .search-button {
          margin-top: 8px;
          padding: 6px 12px;
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .search-button:hover {
          background: var(--vscode-button-hoverBackground);
        }

        .project-summary {
          padding: 12px 16px;
          border-bottom: 1px solid var(--vscode-panel-border);
          font-size: 12px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          margin: 4px 0;
        }

        .file-tree {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .file-item {
          display: flex;
          align-items: center;
          padding: 4px 8px;
          cursor: pointer;
          border-radius: 4px;
          font-size: 13px;
          margin: 1px 0;
        }

        .file-item:hover {
          background: var(--vscode-list-hoverBackground);
        }

        .file-item.selected {
          background: var(--vscode-list-activeSelectionBackground);
          color: var(--vscode-list-activeSelectionForeground);
        }

        .file-icon {
          margin-right: 8px;
          font-size: 14px;
        }

        .file-name {
          flex: 1;
        }

        .file-size {
          font-size: 11px;
          color: var(--vscode-descriptionForeground);
          margin-left: 8px;
        }

        .folder-children {
          margin-left: 16px;
        }

        .search-results {
          max-height: 200px;
          overflow-y: auto;
          border-top: 1px solid var(--vscode-panel-border);
          padding: 8px;
        }

        .search-result {
          padding: 8px;
          border-radius: 4px;
          margin: 4px 0;
          background: var(--vscode-editor-background);
          border: 1px solid var(--vscode-panel-border);
          cursor: pointer;
          font-size: 12px;
        }

        .search-result:hover {
          background: var(--vscode-list-hoverBackground);
        }

        .result-file {
          font-weight: 600;
          color: var(--vscode-textLink-foreground);
        }

        .result-line {
          color: var(--vscode-descriptionForeground);
          margin: 2px 0;
        }

        .result-content {
          font-family: var(--vscode-editor-font-family);
          background: var(--vscode-textCodeBlock-background);
          padding: 4px;
          border-radius: 2px;
          margin: 4px 0;
        }

        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
          color: var(--vscode-descriptionForeground);
        }
      `}</style>

      <div className="explorer-header">
        <h3>🗂️ Project Explorer</h3>
        <button onClick={onClose} className="close-button">✕</button>
      </div>

      <div className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="Search in files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} className="search-button">
          🔍 Search
        </button>
      </div>

      {projectInfo && (
        <div className="project-summary">
          <div className="summary-item">
            <span>Total Files:</span>
            <span>{projectInfo.summary.totalFiles}</span>
          </div>
          <div className="summary-item">
            <span>Root:</span>
            <span>{projectInfo.root.split('/').pop()}</span>
          </div>
        </div>
      )}

      <div className="file-tree">
        {projectInfo && renderFileTree(projectInfo.structure)}
      </div>

      {searchResults.length > 0 && (
        <div className="search-results">
          <h4>Search Results ({searchResults.length})</h4>
          {searchResults.map((result, index) => (
            <div
              key={index}
              className="search-result"
              onClick={() => openFile(result.file)}
            >
              <div className="result-file">{result.file.split('/').pop()}</div>
              <div className="result-line">Line {result.line}</div>
              <div className="result-content">{result.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};