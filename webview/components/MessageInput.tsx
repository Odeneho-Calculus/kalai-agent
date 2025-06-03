import React, { useState, useRef, useEffect } from 'react';
import { FileReference, ChatMode } from './ChatInterface';
import './MessageInput.css';
import {
    Folder,
    Description,
    AttachFile,
    Send,
    Lightbulb,
    Science,
    Speed,
    BugReport,
    Close
} from '@mui/icons-material';

declare global {
    interface Window {
        vscode: {
            postMessage: (message: any) => void;
        };
    }
}

interface MessageInputProps {
    onSendMessage: (content: string, attachedFiles: FileReference[]) => void;
    currentMode: ChatMode;
    disabled?: boolean;
    fileReferences: FileReference[];
}

export const MessageInput: React.FC<MessageInputProps> = ({
    onSendMessage,
    currentMode,
    disabled = false,
    fileReferences
}) => {
    const [message, setMessage] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showFileSelector, setShowFileSelector] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<FileReference[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [suggestions] = useState<string[]>([
        'Explain this code',
        'Generate unit tests',
        'Optimize performance',
        'Find security issues',
        'Refactor this function',
        'Add documentation',
        'Debug this error',
        'Convert to TypeScript'
    ]);

    const codingSuggestions = [
        'Analyze the current file',
        'Generate tests for this function',
        'Explain the algorithm used here',
        'Suggest performance improvements',
        'Find potential bugs',
        'Add error handling',
        'Create documentation',
        'Refactor for better readability'
    ];

    const chatSuggestions = [
        'How does this code work?',
        'What are the best practices for this?',
        'Can you help me understand this concept?',
        'What would you recommend here?',
        'How can I improve this?',
        'What are the alternatives?',
        'Explain this in simple terms',
        'What should I learn next?'
    ];

    const getCurrentSuggestions = () => {
        return currentMode.type === 'coding' ? codingSuggestions : chatSuggestions;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !disabled) {
            onSendMessage(message.trim(), attachedFiles);
            setMessage('');
            setAttachedFiles([]);
            setShowSuggestions(false);
            adjustTextareaHeight();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        } else if (e.key === 'Tab' && showSuggestions) {
            e.preventDefault();
            // Handle suggestion selection
        }
    };

    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        adjustTextareaHeight();

        // Show suggestions when typing
        if (e.target.value.length > 0 && !showSuggestions) {
            setShowSuggestions(true);
        } else if (e.target.value.length === 0) {
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setMessage(suggestion);
        setShowSuggestions(false);
        textareaRef.current?.focus();
    };

    const handleFileAttach = () => {
        setShowFileSelector(!showFileSelector);
        // Request file list from extension
        window.vscode.postMessage({
            type: 'getFileList',
            data: {}
        });
    };

    const handleFileSelect = (file: FileReference) => {
        if (!attachedFiles.find(f => f.path === file.path)) {
            setAttachedFiles(prev => [...prev, file]);
        }
        setShowFileSelector(false);
    };

    const removeAttachedFile = (filePath: string) => {
        setAttachedFiles(prev => prev.filter(f => f.path !== filePath));
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, []);

    const placeholderText = currentMode.type === 'coding'
        ? 'Ask about code, request analysis, or describe what you want to build...'
        : 'Ask me anything about your code or development...';

    return (
        <div className="message-input-container">
            {/* Suggestions Panel */}
            {showSuggestions && message.length === 0 && (
                <div className="suggestions-panel">
                    <div className="suggestions-header">
                        <span className="suggestions-title">
                            {currentMode.icon} {currentMode.type === 'coding' ? 'Coding' : 'Chat'} Suggestions
                        </span>
                    </div>
                    <div className="suggestions-grid">
                        {getCurrentSuggestions().map((suggestion, index) => (
                            <button
                                key={index}
                                className="suggestion-item"
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                <span className="suggestion-text">{suggestion}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* File Selector */}
            {showFileSelector && (
                <div className="file-selector-panel">
                    <div className="file-selector-header">
                        <span className="file-selector-title">
                            <Folder fontSize="small" style={{ marginRight: '4px' }} />
                            Select Files to Reference
                        </span>
                        <button
                            className="close-btn"
                            onClick={() => setShowFileSelector(false)}
                        >
                            <Close fontSize="small" />
                        </button>
                    </div>
                    <div className="file-list">
                        {fileReferences.map((file, index) => (
                            <button
                                key={index}
                                className="file-item"
                                onClick={() => handleFileSelect(file)}
                            >
                                <Description fontSize="small" style={{ marginRight: '4px' }} />
                                <span className="file-name">{file.name}</span>
                                <span className="file-path">{file.path}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Attached Files */}
            {attachedFiles.length > 0 && (
                <div className="attached-files">
                    <div className="attached-files-header">
                        <span className="attached-files-title">
                            <AttachFile fontSize="small" style={{ marginRight: '4px' }} />
                            Referenced Files
                        </span>
                    </div>
                    <div className="attached-files-list">
                        {attachedFiles.map((file, index) => (
                            <div key={index} className="attached-file">
                                <Description fontSize="small" style={{ marginRight: '4px' }} />
                                <span className="file-name">{file.name}</span>
                                <button
                                    className="remove-file"
                                    onClick={() => removeAttachedFile(file.path)}
                                    title="Remove file"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="input-form">
                <div className="input-wrapper">
                    <div className="input-actions-left">
                        <button
                            type="button"
                            className="action-btn file-attach-btn"
                            onClick={handleFileAttach}
                            title="Attach files"
                            disabled={disabled}
                        >
                            <AttachFile fontSize="small" />
                        </button>
                        <button
                            type="button"
                            className="action-btn context-btn"
                            onClick={() => {
                                window.vscode.postMessage({
                                    type: 'addCurrentFile',
                                    data: {}
                                });
                            }}
                            title="Add current file to context"
                            disabled={disabled}
                        >
                            <Description fontSize="small" />
                        </button>
                    </div>

                    <div className="textarea-container">
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholderText}
                            className="message-textarea"
                            disabled={disabled}
                            rows={1}
                        />
                        {message.length === 0 && (
                            <div className="input-hint">
                                <span className="mode-indicator">
                                    {currentMode.icon} {currentMode.label}
                                </span>
                                <span className="hint-text">
                                    Press Enter to send, Shift+Enter for new line
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="input-actions-right">
                        <div className="character-count">
                            {message.length}/4000
                        </div>
                        <button
                            type="submit"
                            className={`send-btn ${message.trim() ? 'active' : ''}`}
                            disabled={disabled || !message.trim()}
                            title="Send message"
                        >
                            {disabled ? (
                                <span className="loading-spinner">⏳</span>
                            ) : (
                                <Send fontSize="small" />
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* Quick Actions */}
            <div className="quick-actions">
                <button
                    className="quick-action"
                    onClick={() => handleSuggestionClick('Explain the selected code')}
                    disabled={disabled}
                >
                    <Lightbulb fontSize="small" style={{ marginRight: '4px' }} />
                    Explain
                </button>
                <button
                    className="quick-action"
                    onClick={() => handleSuggestionClick('Generate tests for this code')}
                    disabled={disabled}
                >
                    <Science fontSize="small" style={{ marginRight: '4px' }} />
                    Test
                </button>
                <button
                    className="quick-action"
                    onClick={() => handleSuggestionClick('Optimize this code')}
                    disabled={disabled}
                >
                    <Speed fontSize="small" style={{ marginRight: '4px' }} />
                    Optimize
                </button>
                <button
                    className="quick-action"
                    onClick={() => handleSuggestionClick('Find issues in this code')}
                    disabled={disabled}
                >
                    <BugReport fontSize="small" style={{ marginRight: '4px' }} />
                    Debug
                </button>
            </div>
        </div>
    );
};