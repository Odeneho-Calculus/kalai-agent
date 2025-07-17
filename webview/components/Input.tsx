import React, { useState, useRef, useEffect } from 'react';
import './Input.css';

interface InputProps {
    onSendMessage: (content: string, files?: string[]) => void;
    disabled?: boolean;
    placeholder?: string;
}

export const Input: React.FC<InputProps> = ({
    onSendMessage,
    disabled = false,
    placeholder = "Type your message..."
}) => {
    const [message, setMessage] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const suggestions = [
        "Explain this code",
        "Find bugs in my code",
        "Optimize performance",
        "Generate tests",
        "Refactor this function",
        "Add documentation",
        "Review security issues"
    ];

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        }
    }, [message]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !disabled) {
            onSendMessage(message.trim(), attachedFiles.length > 0 ? attachedFiles : undefined);
            setMessage('');
            setAttachedFiles([]);
            setShowSuggestions(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
        if (e.key === 'Escape') {
            setMessage('');
            setShowSuggestions(false);
        }
        if (e.key === '/' && e.ctrlKey) {
            e.preventDefault();
            setShowSuggestions(!showSuggestions);
        }
    };

    const handleAddCurrentFile = () => {
        window.vscode?.postMessage({
            type: 'addCurrentFile',
            data: {}
        });
    };

    const handleGetContext = () => {
        window.vscode?.postMessage({
            type: 'getContext',
            data: {}
        });
    };

    const handleSuggestionClick = (suggestion: string) => {
        setMessage(suggestion);
        setShowSuggestions(false);
        textareaRef.current?.focus();
    };

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="modern-input-container">
            {attachedFiles.length > 0 && (
                <div className="attached-files">
                    <div className="files-header">📎 Attached files:</div>
                    <div className="files-list">
                        {attachedFiles.map((file, index) => (
                            <div key={index} className="attached-file">
                                <span className="file-name">{file}</span>
                                <button
                                    className="remove-file"
                                    onClick={() => removeFile(index)}
                                    title="Remove file"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showSuggestions && (
                <div className="suggestions-panel">
                    <div className="suggestions-header">💡 Quick suggestions:</div>
                    <div className="suggestions-list">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                className="suggestion-item"
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="input-form">
                <div className="input-wrapper">
                    <div className="input-actions-left">
                        <button
                            type="button"
                            className="action-button"
                            onClick={handleAddCurrentFile}
                            title="Add current file to context"
                        >
                            📄
                        </button>
                        <button
                            type="button"
                            className="action-button"
                            onClick={handleGetContext}
                            title="Get project context"
                        >
                            🔍
                        </button>
                        <button
                            type="button"
                            className="action-button"
                            onClick={() => setShowSuggestions(!showSuggestions)}
                            title="Show suggestions"
                        >
                            💡
                        </button>
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="message-textarea"
                        rows={1}
                    />

                    <div className="input-actions-right">
                        <button
                            type="submit"
                            disabled={!message.trim() || disabled}
                            className="send-button"
                            title="Send message (Enter)"
                        >
                            {disabled ? (
                                <div className="loading-spinner"></div>
                            ) : (
                                '➤'
                            )}
                        </button>
                    </div>
                </div>

                <div className="input-footer">
                    <div className="input-hints">
                        <span className="hint">Enter to send • Shift+Enter for new line • Ctrl+/ for suggestions • Esc to clear</span>
                    </div>
                    <div className="character-count">
                        {message.length > 0 && (
                            <span className={message.length > 4000 ? 'warning' : ''}>
                                {message.length}/4000
                            </span>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};