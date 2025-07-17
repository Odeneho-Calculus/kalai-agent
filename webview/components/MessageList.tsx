import React, { useState } from 'react';
import { Message } from './ChatInterface';
import './MessageList.css';
import {
    ContentCopy,
    Error,
    Info,
    Refresh,
    AttachFile,
    Chat,
    Bolt
} from '@mui/icons-material';

interface MessageListProps {
    messages: Message[];
    isLoading: boolean;
    currentMode: 'chat' | 'coding';
}

export const MessageList: React.FC<MessageListProps> = ({
    messages,
    isLoading,
    currentMode
}) => {
    const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

    const toggleMessageExpansion = (messageId: string) => {
        const newExpanded = new Set(expandedMessages);
        if (newExpanded.has(messageId)) {
            newExpanded.delete(messageId);
        } else {
            newExpanded.add(messageId);
        }
        setExpandedMessages(newExpanded);
    };

    const formatTimestamp = (timestamp: Date) => {
        return timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast notification here
    };

    const renderCodeBlock = (content: string, language?: string) => {
        return (
            <div className="code-block">
                <div className="code-header">
                    <span className="language-label">{language || 'code'}</span>
                    <button
                        className="copy-btn"
                        onClick={() => copyToClipboard(content)}
                        title="Copy code"
                    >
                        <ContentCopy fontSize="small" />
                    </button>
                </div>
                <pre className="code-content">
                    <code className={language ? `language-${language}` : ''}>
                        {content}
                    </code>
                </pre>
            </div>
        );
    };

    const renderMessageContent = (message: Message) => {
        const { content, type, metadata } = message;

        // Handle different message types
        if (type === 'code') {
            return renderCodeBlock(content, metadata?.language);
        }

        if (type === 'error') {
            return (
                <div className="error-message">
                    <Error fontSize="small" style={{ color: '#f44336', marginRight: '8px' }} />
                    <span className="error-text">{content}</span>
                </div>
            );
        }

        if (type === 'system') {
            return (
                <div className="system-message">
                    <Info fontSize="small" style={{ color: '#2196f3', marginRight: '8px' }} />
                    <span className="system-text">{content}</span>
                </div>
            );
        }

        // Parse markdown-like content
        const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/);

        return (
            <div className="message-content">
                {parts.map((part: string, index: number) => {
                    if (part.startsWith('```') && part.endsWith('```')) {
                        const lines = part.slice(3, -3).split('\n');
                        const language = lines[0].trim();
                        const code = lines.slice(1).join('\n');
                        return (
                            <div key={index}>
                                {renderCodeBlock(code, language)}
                            </div>
                        );
                    } else if (part.startsWith('`') && part.endsWith('`')) {
                        return (
                            <code key={index} className="inline-code">
                                {part.slice(1, -1)}
                            </code>
                        );
                    } else {
                        return (
                            <span key={index} className="text-content">
                                {part}
                            </span>
                        );
                    }
                })}
            </div>
        );
    };

    const renderMessage = (message: Message) => {
        const isExpanded = expandedMessages.has(message.id);
        const isLongMessage = message.content.length > 500;

        return (
            <div
                key={message.id}
                className={`message ${message.sender} ${message.type || 'text'}`}
            >
                <div className="message-header">
                    <div className="sender-info">
                        <span className="sender-avatar">
                            {message.sender === 'user' ? '👤' : '🤖'}
                        </span>
                        <span className="sender-name">
                            {message.sender === 'user' ? 'You' : 'Kalai Agent'}
                        </span>
                        {message.metadata?.isStreaming && (
                            <span className="streaming-indicator">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </span>
                        )}
                    </div>

                    <div className="message-meta">
                        <span className="timestamp">
                            {formatTimestamp(message.timestamp)}
                        </span>
                        <div className="message-actions">
                            {isLongMessage && (
                                <button
                                    className="expand-btn"
                                    onClick={() => toggleMessageExpansion(message.id)}
                                    title={isExpanded ? 'Collapse' : 'Expand'}
                                >
                                    {isExpanded ? '▼' : '▶'}
                                </button>
                            )}
                            <button
                                className="copy-btn"
                                onClick={() => copyToClipboard(message.content)}
                                title="Copy message"
                            >
                                <ContentCopy fontSize="small" />
                            </button>
                            {message.sender === 'assistant' && (
                                <button
                                    className="regenerate-btn"
                                    onClick={() => {
                                        window.vscode.postMessage({
                                            type: 'regenerateResponse',
                                            data: { messageId: message.id }
                                        });
                                    }}
                                    title="Regenerate response"
                                >
                                    <Refresh fontSize="small" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className={`message-body ${isLongMessage && !isExpanded ? 'collapsed' : ''}`}>
                    {renderMessageContent(message)}

                    {message.metadata?.files && message.metadata.files.length > 0 && (
                        <div className="message-files">
                            <div className="files-header">
                                <AttachFile fontSize="small" style={{ marginRight: '4px' }} />
                                <span className="files-label">Referenced Files:</span>
                            </div>
                            <div className="files-list">
                                {message.metadata.files.map((filePath: string, index: number) => (
                                    <span key={index} className="file-tag">
                                        {filePath.split('/').pop()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {isLongMessage && !isExpanded && (
                    <div className="message-fade">
                        <button
                            className="show-more-btn"
                            onClick={() => toggleMessageExpansion(message.id)}
                        >
                            Show more...
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="message-list">
            {messages.length === 0 && !isLoading && (
                <div className="empty-state">
                    <div className="empty-icon">
                        {currentMode === 'coding' ? <Bolt fontSize="large" /> : <Chat fontSize="large" />}
                    </div>
                    <div className="empty-title">
                        {currentMode === 'coding'
                            ? 'Ready to help with your code!'
                            : 'Start a conversation!'
                        }
                    </div>
                    <div className="empty-description">
                        {currentMode === 'coding'
                            ? 'Ask me to analyze code, generate tests, find bugs, or optimize performance.'
                            : 'Ask me anything about your project, code, or development questions.'
                        }
                    </div>
                    <div className="example-prompts">
                        <div className="prompts-title">Try asking:</div>
                        <div className="prompts-list">
                            {currentMode === 'coding' ? [
                                "Explain this function",
                                "Generate unit tests",
                                "Find performance issues",
                                "Add error handling"
                            ] : [
                                "How does this code work?",
                                "What's the best approach here?",
                                "Can you help me understand this?",
                                "What would you recommend?"
                            ].map((prompt, index) => (
                                <button
                                    key={index}
                                    className="example-prompt"
                                    onClick={() => {
                                        window.vscode.postMessage({
                                            type: 'sendMessage',
                                            data: {
                                                message: prompt,
                                                mode: currentMode,
                                                files: [],
                                                context: null
                                            }
                                        });
                                    }}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {messages.map(renderMessage)}

            {isLoading && (
                <div className="loading-message">
                    <div className="message assistant loading">
                        <div className="message-header">
                            <div className="sender-info">
                                <span className="sender-avatar">🤖</span>
                                <span className="sender-name">Kalai Agent</span>
                                <span className="streaming-indicator">
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                </span>
                            </div>
                        </div>
                        <div className="message-body">
                            <div className="typing-indicator">
                                <span className="typing-text">Thinking...</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};