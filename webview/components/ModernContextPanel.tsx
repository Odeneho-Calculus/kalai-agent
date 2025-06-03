import React, { useState, useEffect } from 'react';
import './ModernContextPanel.css';

interface FileContext {
    path: string;
    name: string;
    language: string;
    content?: string;
    isActive: boolean;
}

interface ProjectInfo {
    name: string;
    files: string[];
    dependencies: Record<string, string>;
    framework?: string;
}

interface ModernContextPanelProps {
    isVisible: boolean;
    onClose: () => void;
    onFileSelect: (files: string[]) => void;
}

export const ModernContextPanel: React.FC<ModernContextPanelProps> = ({
    isVisible,
    onClose,
    onFileSelect
}) => {
    const [activeTab, setActiveTab] = useState<'files' | 'context' | 'search'>('files');
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isVisible) {
            loadProjectInfo();
        }
    }, [isVisible]);

    const loadProjectInfo = async () => {
        setIsLoading(true);
        try {
            window.vscode?.postMessage({
                type: 'getProjectInfo',
                data: {}
            });
        } catch (error) {
            console.error('Error loading project info:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsLoading(true);
        try {
            window.vscode?.postMessage({
                type: 'searchInFiles',
                query: query
            });
        } catch (error) {
            console.error('Error searching files:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFileSelection = (filePath: string) => {
        setSelectedFiles(prev => {
            const isSelected = prev.includes(filePath);
            if (isSelected) {
                return prev.filter(f => f !== filePath);
            } else {
                return [...prev, filePath];
            }
        });
    };

    const handleAddSelected = () => {
        onFileSelect(selectedFiles);
        setSelectedFiles([]);
    };

    const handleAddCurrentFile = () => {
        window.vscode?.postMessage({
            type: 'addCurrentFile',
            data: {}
        });
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'js':
            case 'jsx':
                return '📄';
            case 'ts':
            case 'tsx':
                return '📘';
            case 'py':
                return '🐍';
            case 'java':
                return '☕';
            case 'css':
                return '🎨';
            case 'html':
                return '🌐';
            case 'json':
                return '📋';
            case 'md':
                return '📝';
            default:
                return '📄';
        }
    };

    if (!isVisible) return null;

    return (
        <div className="modern-context-panel">
            <div className="context-header">
                <div className="header-title">
                    <span className="title-icon">📁</span>
                    <span>Project Context</span>
                </div>
                <button className="close-btn" onClick={onClose}>
                    ✕
                </button>
            </div>

            <div className="context-tabs">
                <button
                    className={`tab ${activeTab === 'files' ? 'active' : ''}`}
                    onClick={() => setActiveTab('files')}
                >
                    📁 Files
                </button>
                <button
                    className={`tab ${activeTab === 'context' ? 'active' : ''}`}
                    onClick={() => setActiveTab('context')}
                >
                    🔍 Context
                </button>
                <button
                    className={`tab ${activeTab === 'search' ? 'active' : ''}`}
                    onClick={() => setActiveTab('search')}
                >
                    🔎 Search
                </button>
            </div>

            <div className="context-content">
                {activeTab === 'files' && (
                    <div className="files-tab">
                        <div className="quick-actions">
                            <button
                                className="action-btn primary"
                                onClick={handleAddCurrentFile}
                            >
                                📄 Add Current File
                            </button>
                            {selectedFiles.length > 0 && (
                                <button
                                    className="action-btn secondary"
                                    onClick={handleAddSelected}
                                >
                                    ➕ Add Selected ({selectedFiles.length})
                                </button>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <span>Loading project files...</span>
                            </div>
                        ) : (
                            <div className="files-list">
                                {projectInfo?.files.map((file, index) => (
                                    <div
                                        key={index}
                                        className={`file-item ${selectedFiles.includes(file) ? 'selected' : ''}`}
                                        onClick={() => toggleFileSelection(file)}
                                    >
                                        <span className="file-icon">{getFileIcon(file)}</span>
                                        <span className="file-path">{file}</span>
                                        <span className="file-name">{file.split('/').pop()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'context' && (
                    <div className="context-tab">
                        <div className="context-info">
                            {projectInfo && (
                                <>
                                    <div className="info-section">
                                        <h3>Project Information</h3>
                                        <div className="info-item">
                                            <span className="label">Name:</span>
                                            <span className="value">{projectInfo.name}</span>
                                        </div>
                                        {projectInfo.framework && (
                                            <div className="info-item">
                                                <span className="label">Framework:</span>
                                                <span className="value">{projectInfo.framework}</span>
                                            </div>
                                        )}
                                        <div className="info-item">
                                            <span className="label">Files:</span>
                                            <span className="value">{projectInfo.files.length}</span>
                                        </div>
                                    </div>

                                    <div className="info-section">
                                        <h3>Dependencies</h3>
                                        <div className="dependencies-list">
                                            {Object.entries(projectInfo.dependencies).slice(0, 10).map(([name, version]) => (
                                                <div key={name} className="dependency-item">
                                                    <span className="dep-name">{name}</span>
                                                    <span className="dep-version">{version}</span>
                                                </div>
                                            ))}
                                            {Object.keys(projectInfo.dependencies).length > 10 && (
                                                <div className="more-deps">
                                                    +{Object.keys(projectInfo.dependencies).length - 10} more...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'search' && (
                    <div className="search-tab">
                        <div className="search-input-container">
                            <input
                                type="text"
                                placeholder="Search in files..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    handleSearch(e.target.value);
                                }}
                                className="search-input"
                            />
                            <button
                                className="search-btn"
                                onClick={() => handleSearch(searchQuery)}
                            >
                                🔍
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <span>Searching...</span>
                            </div>
                        ) : (
                            <div className="search-results">
                                {searchResults.map((result, index) => (
                                    <div key={index} className="search-result">
                                        <span className="result-icon">🔍</span>
                                        <span className="result-text">{result}</span>
                                    </div>
                                ))}
                                {searchQuery && searchResults.length === 0 && !isLoading && (
                                    <div className="no-results">
                                        No results found for "{searchQuery}"
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};