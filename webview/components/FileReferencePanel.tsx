import React, { useState } from 'react';
import { FileReference } from './ChatInterface';
import './FileReferencePanel.css';
import {
    Javascript,
    Code,
    DataObject,
    Html,
    Css,
    Storage,
    Terminal,
    Description,
    Settings,
    Build,
    Computer,
    Favorite,
    Edit,
    Visibility,
    AttachFile,
    GpsFixed,
    Folder,
    Save,
    Straighten
} from '@mui/icons-material';

declare global {
    interface Window {
        vscode: {
            postMessage: (message: any) => void;
        };
    }
}

interface FileReferencePanelProps {
    files: FileReference[];
    onFileRemove: (filePath: string) => void;
}

export const FileReferencePanel: React.FC<FileReferencePanelProps> = ({
    files,
    onFileRemove
}) => {
    const [expandedFile, setExpandedFile] = useState<string | null>(null);

    const getFileIcon = (language: string) => {
        const iconProps = { fontSize: 'small' as const, style: { fontSize: '16px' } };

        switch (language.toLowerCase()) {
            case 'javascript':
            case 'js':
                return <Javascript {...iconProps} style={{ ...iconProps.style, color: '#f7df1e' }} />;
            case 'typescript':
            case 'ts':
                return <Code {...iconProps} style={{ ...iconProps.style, color: '#3178c6' }} />;
            case 'python':
            case 'py':
                return <Code {...iconProps} style={{ ...iconProps.style, color: '#3776ab' }} />;
            case 'java':
                return <Code {...iconProps} style={{ ...iconProps.style, color: '#ed8b00' }} />;
            case 'html':
                return <Html {...iconProps} style={{ ...iconProps.style, color: '#e34f26' }} />;
            case 'css':
                return <Css {...iconProps} style={{ ...iconProps.style, color: '#1572b6' }} />;
            case 'json':
                return <DataObject {...iconProps} style={{ ...iconProps.style, color: '#000000' }} />;
            case 'markdown':
            case 'md':
                return <Description {...iconProps} style={{ ...iconProps.style, color: '#083fa1' }} />;
            case 'yaml':
            case 'yml':
                return <Settings {...iconProps} style={{ ...iconProps.style, color: '#cb171e' }} />;
            case 'xml':
                return <Description {...iconProps} style={{ ...iconProps.style, color: '#ff6600' }} />;
            case 'sql':
                return <Storage {...iconProps} style={{ ...iconProps.style, color: '#336791' }} />;
            case 'shell':
            case 'sh':
            case 'bash':
                return <Terminal {...iconProps} style={{ ...iconProps.style, color: '#4eaa25' }} />;
            case 'dockerfile':
                return <Build {...iconProps} style={{ ...iconProps.style, color: '#2496ed' }} />;
            case 'vue':
                return <Code {...iconProps} style={{ ...iconProps.style, color: '#4fc08d' }} />;
            case 'react':
            case 'jsx':
            case 'tsx':
                return <Code {...iconProps} style={{ ...iconProps.style, color: '#61dafb' }} />;
            case 'angular':
                return <Code {...iconProps} style={{ ...iconProps.style, color: '#dd0031' }} />;
            default:
                return <Description {...iconProps} />;
        }
    };

    const getLanguageColor = (language: string) => {
        const colorMap: Record<string, string> = {
            'javascript': '#f7df1e',
            'typescript': '#3178c6',
            'python': '#3776ab',
            'java': '#ed8b00',
            'html': '#e34f26',
            'css': '#1572b6',
            'json': '#000000',
            'markdown': '#083fa1',
            'yaml': '#cb171e',
            'vue': '#4fc08d',
            'react': '#61dafb'
        };
        return colorMap[language.toLowerCase()] || '#6b7280';
    };

    const toggleFileExpansion = (filePath: string) => {
        setExpandedFile(expandedFile === filePath ? null : filePath);
    };

    const formatFileSize = (content?: string) => {
        if (!content) return 'Unknown size';
        const bytes = new Blob([content]).size;
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getLineCount = (content?: string) => {
        if (!content) return 0;
        return content.split('\n').length;
    };

    return (
        <div className="file-reference-panel">
            <div className="panel-header">
                <div className="header-left">
                    <AttachFile fontSize="small" style={{ marginRight: '8px' }} />
                    <span className="panel-title">Referenced Files</span>
                    <span className="file-count">({files.length})</span>
                </div>
                <div className="header-actions">
                    <button
                        className="clear-all-btn"
                        onClick={() => files.forEach(f => onFileRemove(f.path))}
                        title="Remove all files"
                    >
                        Clear All
                    </button>
                </div>
            </div>

            <div className="files-list">
                {files.map((file, index) => (
                    <div key={index} className="file-item">
                        <div className="file-header" onClick={() => toggleFileExpansion(file.path)}>
                            <div className="file-info">
                                <span className="file-icon">{getFileIcon(file.language || 'text')}</span>
                                <div className="file-details">
                                    <span className="file-name">{file.name}</span>
                                    <span className="file-path">{file.path}</span>
                                </div>
                            </div>

                            <div className="file-meta">
                                <span
                                    className={`language-tag language-${(file.language || 'text').toLowerCase()}`}
                                >
                                    {file.language}
                                </span>
                                <button
                                    className="expand-btn"
                                    title={expandedFile === file.path ? 'Collapse' : 'Expand'}
                                >
                                    {expandedFile === file.path ? '▼' : '▶'}
                                </button>
                                <button
                                    className="remove-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFileRemove(file.path);
                                    }}
                                    title="Remove file"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {expandedFile === file.path && (
                            <div className="file-content">
                                <div className="content-header">
                                    <div className="content-stats">
                                        <span className="stat">
                                            <Straighten fontSize="small" style={{ marginRight: '4px' }} />
                                            {getLineCount(file.content)} lines
                                        </span>
                                        <span className="stat">
                                            <Save fontSize="small" style={{ marginRight: '4px' }} />
                                            {formatFileSize(file.content)}
                                        </span>
                                        {file.lineRange && (
                                            <span className="stat">
                                                <GpsFixed fontSize="small" style={{ marginRight: '4px' }} />
                                                Lines {file.lineRange.start}-{file.lineRange.end}
                                            </span>
                                        )}
                                    </div>
                                    <div className="content-actions">
                                        <button
                                            className="action-btn"
                                            onClick={() => {
                                                window.vscode.postMessage({
                                                    type: 'openFile',
                                                    data: { path: file.path }
                                                });
                                            }}
                                            title="Open in editor"
                                        >
                                            <Edit fontSize="small" style={{ marginRight: '4px' }} />
                                            Open
                                        </button>
                                        <button
                                            className="action-btn"
                                            onClick={() => {
                                                window.vscode.postMessage({
                                                    type: 'showFilePreview',
                                                    data: { path: file.path }
                                                });
                                            }}
                                            title="Show preview"
                                        >
                                            <Visibility fontSize="small" style={{ marginRight: '4px' }} />
                                            Preview
                                        </button>
                                    </div>
                                </div>

                                {file.content && (
                                    <div className="content-preview">
                                        <pre className="code-preview">
                                            <code className={`language-${file.language}`}>
                                                {file.lineRange
                                                    ? file.content.split('\n')
                                                        .slice(file.lineRange.start - 1, file.lineRange.end)
                                                        .join('\n')
                                                    : file.content.length > 500
                                                        ? file.content.substring(0, 500) + '...'
                                                        : file.content
                                                }
                                            </code>
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {files.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">
                        <Folder fontSize="large" style={{ color: 'var(--vscode-foreground, #cccccc)', opacity: 0.5 }} />
                    </div>
                    <div className="empty-text">No files referenced</div>
                    <div className="empty-hint">
                        Use the <AttachFile fontSize="small" style={{ verticalAlign: 'middle' }} /> button to attach files or <Description fontSize="small" style={{ verticalAlign: 'middle' }} /> to add the current file
                    </div>
                </div>
            )}
        </div>
    );
};