import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProjectExplorerPage } from './pages/ProjectExplorerPage';
import { ToolsPage } from './pages/ToolsPage';

interface Message {
    id: string;
    text: string;
    type: 'user' | 'ai';
    isError?: boolean;
    timestamp: number;
}

interface VSCodeAPI {
    postMessage: (message: any) => void;
    getState: () => any;
    setState: (state: any) => void;
}

interface ChatProps {
    vscode: VSCodeAPI;
}

type Page = 'chat' | 'history' | 'settings' | 'explorer' | 'tools';

export const Chat: React.FC<ChatProps> = ({ vscode }) => {
    const [messages, setMessages] = useState<Message[]>([{
        id: 'welcome',
        text: "👋 Hi! I'm kalai. How can I help you with your code today?",
        type: "ai",
        timestamp: Date.now()
    }]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showScrollIndicator, setShowScrollIndicator] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [currentPage, setCurrentPage] = useState<Page>('chat');

    const startNewChat = () => {
        // Clear messages but keep welcome message
        setMessages([{
            id: 'welcome',
            text: "👋 Hi! I'm kalai Agent. How can I help you with your code today?",
            type: "ai",
            timestamp: Date.now()
        }]);

        // Save current chat to history if it has messages
        if (messages.length > 1) {
            vscode.postMessage({
                command: 'saveToHistory',
                messages: messages
            });
        }
    };

    const getContext = () => {
        setIsLoading(true);
        vscode.postMessage({ command: 'getFileContext' });

        // Add timeout to prevent infinite loading
        setTimeout(() => {
            if (isLoading) {
                setIsLoading(false);
                setMessages(prev => [...prev, {
                    id: `error-${Date.now()}`,
                    text: "Sorry, couldn't get file context. Please try again.",
                    type: 'ai',
                    isError: true,
                    timestamp: Date.now()
                }]);
            }
        }, 5000); // 5 second timeout
    };

    // Auto-resize textarea as content grows
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [inputText]);

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
        setShowScrollIndicator(false);
    };

    // Check if user has scrolled up from bottom
    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const atBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 20;
            setIsAtBottom(atBottom);

            if (atBottom) {
                setShowScrollIndicator(false);
            }
        }
    };

    // Scroll to bottom on new messages
    useEffect(() => {
        if (isAtBottom || messages[messages.length - 1]?.type === 'user') {
            scrollToBottom();
        } else {
            setShowScrollIndicator(true);
        }
    }, [messages]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.command) {
                case 'receiveMessage':
                    setMessages(prev => [...prev, {
                        id: `ai-${Date.now()}`,
                        text: message.text,
                        type: 'ai',
                        isError: message.isError,
                        timestamp: Date.now()
                    }]);
                    setIsLoading(false);
                    break;
                case 'restoreState':
                    if (message.state?.messages) {
                        // Ensure all messages have IDs
                        const messagesWithIds = message.state.messages.map((msg: any) => ({
                            ...msg,
                            id: msg.id || `restored-${msg.type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                            timestamp: msg.timestamp || Date.now()
                        }));
                        setMessages(messagesWithIds);
                    }
                    break;
                case 'fileContext':
                    setIsLoading(false);
                    setMessages(prev => [...prev, {
                        id: `ai-${Date.now()}`,
                        text: `I'm looking at: ${message.fileName}\n\n${message.text}`,
                        type: 'ai',
                        timestamp: Date.now()
                    }]);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || isLoading) return;

        const newMessage = {
            id: `user-${Date.now()}`,
            text: inputText.trim(),
            type: 'user' as const,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, newMessage]);
        setIsLoading(true);

        vscode.postMessage({
            command: 'sendMessage',
            text: inputText.trim()
        });

        setInputText('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        // Save the state
        vscode.setState({ messages: [...messages, newMessage] });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const clearChat = () => {
        setMessages([{
            id: 'welcome-new',
            text: "Chat cleared! How else can I help you?",
            type: "ai",
            timestamp: Date.now()
        }]);
        vscode.postMessage({ command: 'clearChat' });
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'history':
                return <HistoryPage vscode={vscode} onClose={() => setCurrentPage('chat')} />;
            case 'settings':
                return <SettingsPage vscode={vscode} onClose={() => setCurrentPage('chat')} />;
            case 'explorer':
                return <ProjectExplorerPage vscode={vscode} onClose={() => setCurrentPage('chat')} />;
            case 'tools':
                return <ToolsPage vscode={vscode} onClose={() => setCurrentPage('chat')} />;
            default:
                return (
                    <div className="chat-container">
                        <style>{`
                            /* Enhanced Styles */
                            :root {
                                --primary-color: var(--vscode-button-background);
                                --secondary-color: var(--vscode-button-hoverBackground);
                                --dark-bg: var(--vscode-editor-background);
                                --darker-bg: var(--vscode-sideBar-background);
                                --lighter-bg: var(--vscode-input-background);
                                --border-color: var(--vscode-panel-border);
                                --text-color: var(--vscode-foreground);
                                --icon-size: 18px;
                            }

                            .chat-container {
                                display: flex;
                                flex-direction: column;
                                height: 100vh;
                                max-width: 100%;
                                margin: 0 auto;
                                background: var(--dark-bg);
                                color: var(--text-color);
                                font-family: var(--vscode-font-family);
                                box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
                            }

                            .chat-header {
                                display: flex;
                                align-items: center;
                                padding: 12px 16px;
                                background: var(--darker-bg);
                                border-bottom: 1px solid var(--border-color);
                                z-index: 10;
                            }

                            .header-title {
                                font-size: 16px;
                                font-weight: 500;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            }

                            .header-title::before {
                                content: "🤖";
                                font-size: 18px;
                            }

                            .header-actions {
                                margin-left: auto;
                                display: flex;
                                align-items: center;
                                gap: 14px;
                            }

                            .icon-button {
                                background: transparent;
                                border: none;
                                padding: 6px;
                                border-radius: 4px;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: var(--text-color);
                                opacity: 0.8;
                                transition: all 0.2s ease;
                            }

                            .icon-button:hover {
                                opacity: 1;
                                background: rgba(255, 255, 255, 0.1);
                                transform: translateY(-1px);
                            }

                            .icon-button svg {
                                width: var(--icon-size);
                                height: var(--icon-size);
                            }

                            .messages-container {
                                flex: 1;
                                overflow-y: auto;
                                padding: 20px;
                                display: flex;
                                flex-direction: column;
                                gap: 24px;
                                scroll-behavior: smooth;
                            }

                            .message {
                                display: flex;
                                gap: 16px;
                                max-width: 85%;
                                animation: fadeIn 0.4s ease forwards, slideIn 0.3s ease forwards;
                            }

                            .message-user {
                                margin-left: auto;
                                flex-direction: row-reverse;
                            }

                            @keyframes fadeIn {
                                from {
                                    opacity: 0;
                                }
                                to {
                                    opacity: 1;
                                }
                            }

                            @keyframes slideIn {
                                from {
                                    transform: translateY(10px);
                                }
                                to {
                                    transform: translateY(0);
                                }
                            }

                            .message-avatar {
                                width: 36px;
                                height: 36px;
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 16px;
                                flex-shrink: 0;
                                background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
                                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                            }

                            .message-user .message-avatar {
                                background: linear-gradient(135deg, #484848, #2c2c2c);
                            }

                            .message-content {
                                padding: 14px;
                                border-radius: 12px;
                                background: var(--lighter-bg);
                                line-height: 1.5;
                                position: relative;
                                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                                border: 1px solid var(--border-color);
                                overflow-wrap: break-word;
                            }

                            .message-ai .message-content {
                                border-top-left-radius: 0;
                            }

                            .message-user .message-content {
                                background: #2a3b52;
                                color: white;
                                border-top-right-radius: 0;
                            }

                            .message-content.error {
                                background: rgba(255, 80, 80, 0.1);
                                border: 1px solid rgba(255, 80, 80, 0.3);
                            }

                            .input-container {
                                padding: 12px 16px;
                                border-top: 1px solid var(--border-color);
                                background: var(--darker-bg);
                            }

                            .input-wrapper {
                                display: flex;
                                gap: 12px;
                                background: var(--lighter-bg);
                                border-radius: 12px;
                                padding: 4px 4px 4px 16px;
                                transition: all 0.3s ease;
                                border: 1px solid var(--border-color);
                            }

                            .input-wrapper:focus-within {
                                box-shadow: 0 0 0 2px var(--primary-color);
                                border-color: var(--primary-color);
                            }

                            .message-input {
                                flex: 1;
                                background: transparent;
                                border: none;
                                color: var(--text-color);
                                font-size: 14px;
                                line-height: 1.5;
                                padding: 10px 0;
                                min-height: 42px;
                                resize: none;
                            }

                            .message-input:focus {
                                outline: none;
                            }

                            .send-button {
                                width: 42px;
                                height: 42px;
                                padding: 0;
                                border-radius: 10px;
                                border: none;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                background: var(--primary-color);
                                cursor: pointer;
                                transition: all 0.2s ease;
                            }

                            .send-button:hover:not(:disabled) {
                                filter: brightness(1.1);
                                transform: translateY(-2px);
                            }

                            .send-button:disabled {
                                opacity: 0.5;
                                cursor: not-allowed;
                            }

                            .send-button svg {
                                width: 20px;
                                height: 20px;
                                fill: white;
                            }

                            /* Typing animation */
                            .thinking {
                                display: flex;
                                gap: 6px;
                                padding: 12px;
                                align-items: center;
                            }

                            .thinking-dot {
                                width: 8px;
                                height: 8px;
                                border-radius: 50%;
                                background: var(--primary-color);
                                animation: blink 1.4s infinite both;
                            }

                            .thinking-dot:nth-child(2) {
                                animation-delay: 0.2s;
                            }

                            .thinking-dot:nth-child(3) {
                                animation-delay: 0.4s;
                            }

                            @keyframes blink {
                                0%, 80%, 100% {
                                    transform: scale(0.5);
                                    opacity: 0.6;
                                }
                                40% {
                                    transform: scale(1);
                                    opacity: 1;
                                }
                            }

                            /* New message indicator */
                            .new-message-indicator {
                                position: fixed;
                                bottom: 80px;
                                left: 50%;
                                transform: translateX(-50%) translateY(100%);
                                background: var(--primary-color);
                                color: white;
                                padding: 8px 16px;
                                border-radius: 20px;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                cursor: pointer;
                                opacity: 0;
                                transition: all 0.3s ease;
                                font-size: 13px;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                                z-index: 100;
                            }

                            .new-message-indicator.visible {
                                transform: translateX(-50%) translateY(0);
                                opacity: 1;
                            }

                            /* Code block styling */
                            .message pre {
                                margin: 10px 0;
                                padding: 12px;
                                background: var(--dark-bg);
                                border-radius: 6px;
                                overflow-x: auto;
                                position: relative;
                                border: 1px solid var(--border-color);
                            }

                            .message pre::before {
                                content: "";
                                position: absolute;
                                top: 0;
                                left: 0;
                                width: 100%;
                                height: 3px;
                                background: linear-gradient(90deg, var(--primary-color), transparent);
                            }

                            .message code {
                                font-family: 'Courier New', monospace;
                                font-size: 14px;
                            }
                        `}</style>

                        <div className="chat-header">
                            <div className="header-title">kalai Agent</div>
                            <div className="header-actions">
                                <button className="icon-button" onClick={startNewChat} title="New Chat">
                                    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                </button>
                                <button className="icon-button" onClick={() => setCurrentPage('explorer')} title="Project Explorer">
                                    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                </button>
                                <button className="icon-button" onClick={() => setCurrentPage('tools')} title="Developer Tools">
                                    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                    </svg>
                                </button>
                                <button className="icon-button" onClick={getContext} title="Get Context">
                                    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                                        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
                                    </svg>
                                </button>
                                <button className="icon-button" onClick={() => setCurrentPage('history')} title="History">
                                    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </button>
                                <button className="icon-button" onClick={clearChat} title="Clear Chat">
                                    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                                <button className="icon-button" onClick={() => setCurrentPage('settings')} title="Settings">
                                    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div
                            className="messages-container"
                            ref={messagesContainerRef}
                            onScroll={handleScroll}
                        >
                            {messages.map((msg) => (
                                <div key={msg.id} className={`message message-${msg.type}`}>
                                    <div className="message-avatar">
                                        {msg.type === 'ai' ? '🤖' : '👤'}
                                    </div>
                                    <div className={`message-content ${msg.isError ? 'error' : ''}`}>
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="message message-ai">
                                    <div className="message-avatar">🤖</div>
                                    <div className="message-content thinking">
                                        <div className="thinking-dot"></div>
                                        <div className="thinking-dot"></div>
                                        <div className="thinking-dot"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {showScrollIndicator && !isAtBottom && (
                            <div
                                className={`new-message-indicator ${!isAtBottom ? 'visible' : ''}`}
                                onClick={() => scrollToBottom()}
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                                    <path d="M18 15l-6 6-6-6" />
                                    <path d="M12 3v18" />
                                </svg>
                                New messages
                            </div>
                        )}

                        <div className="input-container">
                            <form onSubmit={handleSubmit} className="input-wrapper">
                                <textarea
                                    ref={textareaRef}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Ask me anything or use @ for files, # for commands..."
                                    className="message-input"
                                    onKeyDown={handleKeyDown}
                                />
                                <button
                                    type="submit"
                                    className="send-button"
                                    disabled={isLoading || !inputText.trim()}
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                );
        }
    };

    return renderPage();
};