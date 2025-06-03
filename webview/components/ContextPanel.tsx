import React, { useState } from 'react';
import './ContextPanel.css';
import {
    Build,
    Folder,
    Inventory,
    Assignment,
    Description,
    Edit,
    Refresh,
    AccountTree,
    Close
} from '@mui/icons-material';

declare global {
    interface Window {
        vscode: {
            postMessage: (message: any) => void;
        };
    }
}

interface ContextPanelProps {
    contextData: any;
    onClose: () => void;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
    contextData,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState<'project' | 'files' | 'dependencies' | 'git'>('project');

    const tabs = [
        { id: 'project', label: 'Project', icon: <Build fontSize="small" /> },
        { id: 'files', label: 'Files', icon: <Folder fontSize="small" /> },
        { id: 'dependencies', label: 'Dependencies', icon: <Inventory fontSize="small" /> },
        { id: 'git', label: 'Git', icon: <AccountTree fontSize="small" /> }
    ];

    const renderProjectInfo = () => (
        <div className="context-section">
            <h3>Project Overview</h3>
            {contextData?.projectStructure && (
                <div className="project-info">
                    <div className="info-item">
                        <span className="label">Framework:</span>
                        <span className="value">{contextData.detectedFramework || 'Unknown'}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Total Files:</span>
                        <span className="value">{contextData.files?.length || 0}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Languages:</span>
                        <div className="language-list">
                            {contextData.projectStructure.languages?.map((lang: string, index: number) => (
                                <span key={index} className="language-tag">{lang}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {contextData?.buildConfig && (
                <div className="build-info">
                    <h4>Build Configuration</h4>
                    <div className="config-item">
                        <span className="label">Build Tool:</span>
                        <span className="value">{contextData.buildConfig.tool}</span>
                    </div>
                    <div className="config-item">
                        <span className="label">Scripts:</span>
                        <div className="scripts-list">
                            {Object.entries(contextData.buildConfig.scripts || {}).map(([name, command]) => (
                                <div key={name} className="script-item">
                                    <span className="script-name">{name}:</span>
                                    <span className="script-command">{command as string}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderFilesInfo = () => (
        <div className="context-section">
            <h3>Project Files</h3>
            <div className="files-tree">
                {contextData?.files?.slice(0, 20).map((file: any, index: number) => (
                    <div key={index} className="file-tree-item">
                        <Description fontSize="small" style={{ marginRight: '8px' }} />
                        <span className="file-name">{file.relativePath}</span>
                        <span className="file-language">{file.language}</span>
                    </div>
                ))}
                {contextData?.files?.length > 20 && (
                    <div className="more-files">
                        ... and {contextData.files.length - 20} more files
                    </div>
                )}
            </div>
        </div>
    );

    const renderDependenciesInfo = () => (
        <div className="context-section">
            <h3>Dependencies</h3>
            {contextData?.dependencies && (
                <div className="dependencies-list">
                    {Object.entries(contextData.dependencies).map(([name, version]) => (
                        <div key={name} className="dependency-item">
                            <span className="dep-name">{name}</span>
                            <span className="dep-version">{version as string}</span>
                        </div>
                    ))}
                </div>
            )}

            {contextData?.projectStructure?.packageManagers && (
                <div className="package-managers">
                    <h4>Package Managers</h4>
                    {contextData.projectStructure.packageManagers.map((pm: string, index: number) => (
                        <span key={index} className="package-manager-tag">{pm}</span>
                    ))}
                </div>
            )}
        </div>
    );

    const renderGitInfo = () => (
        <div className="context-section">
            <h3>Git Information</h3>
            {contextData?.gitInfo ? (
                <div className="git-info">
                    <div className="info-item">
                        <span className="label">Current Branch:</span>
                        <span className="value">{contextData.gitInfo.currentBranch}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Remote URL:</span>
                        <span className="value">{contextData.gitInfo.remoteUrl}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Last Commit:</span>
                        <span className="value">{contextData.gitInfo.lastCommit}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Status:</span>
                        <span className="value">{contextData.gitInfo.hasChanges ? 'Has changes' : 'Clean'}</span>
                    </div>
                </div>
            ) : (
                <div className="no-git">
                    <Edit fontSize="small" style={{ marginRight: '8px' }} />
                    <span>No Git repository detected</span>
                </div>
            )}
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'project':
                return renderProjectInfo();
            case 'files':
                return renderFilesInfo();
            case 'dependencies':
                return renderDependenciesInfo();
            case 'git':
                return renderGitInfo();
            default:
                return null;
        }
    };

    return (
        <div className="context-panel">
            <div className="panel-header">
                <div className="header-left">
                    <Assignment fontSize="small" style={{ marginRight: '8px' }} />
                    <span className="panel-title">Project Context</span>
                </div>
                <button className="close-btn" onClick={onClose}>
                    <Close fontSize="small" />
                </button>
            </div>

            <div className="panel-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id as any)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="panel-content">
                {contextData ? (
                    renderTabContent()
                ) : (
                    <div className="loading-state">
                        <div className="loading-spinner">⏳</div>
                        <div className="loading-text">Loading context...</div>
                    </div>
                )}
            </div>

            <div className="panel-footer">
                <button
                    className="refresh-btn"
                    onClick={() => {
                        window.vscode.postMessage({
                            type: 'refreshContext',
                            data: {}
                        });
                    }}
                >
                    <Refresh fontSize="small" style={{ marginRight: '4px' }} />
                    Refresh
                </button>
                <button
                    className="export-btn"
                    onClick={() => {
                        window.vscode.postMessage({
                            type: 'exportContext',
                            data: { context: contextData }
                        });
                    }}
                >
                    📤 Export
                </button>
            </div>
        </div>
    );
};