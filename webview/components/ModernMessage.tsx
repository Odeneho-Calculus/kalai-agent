import React, { useState } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import './ModernMessage.css';
import {
    Refresh,
    Edit,
    MoreHoriz,
    CheckCircle,
    Undo,
    Lightbulb,
    Bolt,
    FlashOn,
    ContentCopy
} from '@mui/icons-material';

export interface CodeAction {
    id: string;
    label: string;
    type: 'apply' | 'revert' | 'explain' | 'improve';
    code?: string;
    filePath?: string;
    startLine?: number;
    endLine?: number;
}

export interface Message {
    id: string;
    content: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
    type?: 'text' | 'code' | 'error' | 'system';
    isStreaming?: boolean;
    codeActions?: CodeAction[];
    metadata?: {
        files?: string[];
        context?: any;
        language?: string;
        model?: string;
        tokens?: number;
    };
}

interface ModernMessageProps {
    message: Message;
    onRegenerate?: (messageId: string) => void;
    onCopy?: (content: string) => void;
    onEdit?: (messageId: string, newContent: string) => void;
    onCodeAction?: (action: CodeAction) => void;
    isLast?: boolean;
}

export const ModernMessage: React.FC<ModernMessageProps> = ({
    message,
    onRegenerate,
    onCopy,
    onEdit,
    onCodeAction,
    isLast = false
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        onCopy?.(message.content);
    };

    const handleEdit = () => {
        if (isEditing) {
            onEdit?.(message.id, editContent);
            setIsEditing(false);
        } else {
            setIsEditing(true);
        }
    };

    const handleRegenerate = () => {
        onRegenerate?.(message.id);
    };

    const shouldUseMarkdown = (content: string) => {
        // Check if content contains markdown syntax
        return content.includes('```') ||
            content.includes('**') ||
            content.includes('`') ||
            content.includes('##') ||
            content.includes('- ') ||
            content.includes('* ') ||
            content.includes('[') && content.includes('](');
    };

    const getMessageIcon = () => {
        switch (message.sender) {
            case 'user':
                return '👤';
            case 'assistant':
                return '🤖';
            default:
                return '💬';
        }
    };

    const getMessageTypeClass = () => {
        switch (message.type) {
            case 'error':
                return 'message-error';
            case 'system':
                return 'message-system';
            case 'code':
                return 'message-code';
            default:
                return '';
        }
    };

    return (
        <div
            className={`modern-message ${message.sender} ${getMessageTypeClass()}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="message-header">
                <div className="message-avatar">
                    {getMessageIcon()}
                </div>
                <div className="message-info">
                    <span className="message-sender">
                        {message.sender === 'user' ? 'You' : 'Kalai'}
                    </span>
                    <span className="message-timestamp">
                        {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                    {message.metadata?.model && (
                        <span className="message-model">
                            {message.metadata.model}
                        </span>
                    )}
                </div>

                {(isHovered || showActions) && (
                    <div className="message-actions">
                        <button
                            className="action-btn"
                            onClick={handleCopy}
                            title="Copy message"
                        >
                            <ContentCopy fontSize="small" />
                        </button>

                        {message.sender === 'user' && (
                            <button
                                className="action-btn"
                                onClick={handleEdit}
                                title={isEditing ? "Save edit" : "Edit message"}
                            >
                                {isEditing ? <CheckCircle fontSize="small" /> : <Edit fontSize="small" />}
                            </button>
                        )}

                        {message.sender === 'assistant' && isLast && (
                            <button
                                className="action-btn regenerate-btn"
                                onClick={handleRegenerate}
                                title="Regenerate response"
                            >
                                <Refresh fontSize="small" />
                            </button>
                        )}

                        <button
                            className="action-btn"
                            onClick={() => setShowActions(!showActions)}
                            title="More actions"
                        >
                            <MoreHoriz fontSize="small" />
                        </button>
                    </div>
                )}
            </div>

            <div className="message-content">
                {isEditing ? (
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="edit-textarea"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                                handleEdit();
                            }
                            if (e.key === 'Escape') {
                                setIsEditing(false);
                                setEditContent(message.content);
                            }
                        }}
                    />
                ) : (
                    <div className={`message-text ${message.isStreaming ? 'streaming' : ''}`}>
                        {shouldUseMarkdown(message.content) ? (
                            <MarkdownRenderer content={message.content} />
                        ) : (
                            <div style={{ whiteSpace: 'pre-wrap' }}>
                                {message.content}
                            </div>
                        )}
                    </div>
                )}

                {message.isStreaming && (
                    <div className="streaming-indicator">
                        <span className="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                    </div>
                )}
            </div>

            {message.codeActions && message.codeActions.length > 0 && (
                <div className="code-actions">
                    <div className="code-actions-header">
                        <FlashOn fontSize="small" className="actions-icon" />
                        <span>Quick Actions</span>
                    </div>
                    <div className="code-actions-list">
                        {message.codeActions.map((action) => (
                            <button
                                key={action.id}
                                className={`code-action-btn ${action.type}`}
                                onClick={() => onCodeAction?.(action)}
                                title={`${action.label}${action.filePath ? ` in ${action.filePath}` : ''}`}
                            >
                                <span className="action-icon">
                                    {action.type === 'apply' && <CheckCircle fontSize="small" />}
                                    {action.type === 'revert' && <Undo fontSize="small" />}
                                    {action.type === 'explain' && <Lightbulb fontSize="small" />}
                                    {action.type === 'improve' && <Bolt fontSize="small" />}
                                </span>
                                <span className="action-label">{action.label}</span>
                                {action.filePath && (
                                    <span className="action-file">
                                        {action.filePath.split('/').pop()}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {message.metadata?.files && message.metadata.files.length > 0 && (
                <div className="message-files">
                    <div className="files-header">📎 Referenced files:</div>
                    <div className="files-list">
                        {message.metadata.files.map((file, index) => (
                            <span key={index} className="file-tag">
                                {file}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {message.metadata?.tokens && (
                <div className="message-metadata">
                    <span className="token-count">
                        {message.metadata.tokens} tokens
                    </span>
                </div>
            )}
        </div>
    );
};