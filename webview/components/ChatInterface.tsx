import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message as MessageComponent, Message } from './Message';
import { Input } from './Input';
import { ContextPanel } from './ContextPanel';
import { SettingsPanel } from './SettingsPanel';
import './ChatInterface.css';
import { Delete } from '@mui/icons-material';

// Export types for other components
export interface FileReference {
    path: string;
    name: string;
    type: string;
    size?: number;
    lastModified?: Date;
    content?: string;
    language?: string;
    lineRange?: {
        start: number;
        end: number;
    };
}

export interface ChatMode {
    type: string;
    label: string;
    icon: string;
    description: string;
}

export { Message };

interface ChatState {
    messages: Message[];
    isLoading: boolean;
    currentModel: string;
    context: any;
}

export const ChatInterface: React.FC = () => {
    const [chatState, setChatState] = useState<ChatState>({
        messages: [],
        isLoading: false,
        currentModel: 'Kalai Agent',
        context: null
    });

    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
    const [showContextPanel, setShowContextPanel] = useState(false);
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when new messages arrive
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [chatState.messages, scrollToBottom]);

    // Initialize VS Code API and message handling
    useEffect(() => {
        const vscode = window.vscode;
        if (!vscode) return;

        // Send ready message
        vscode.postMessage({
            type: 'webviewReady',
            data: {}
        });

        // Handle messages from extension
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;

            switch (message.command || message.type) {
                case 'receiveMessage':
                case 'assistantResponse':
                    handleReceiveMessage(message);
                    break;
                case 'restoreState':
                    handleRestoreState(message.state);
                    break;
                case 'updateState':
                    handleUpdateState(message.state);
                    break;
                case 'streamingUpdate':
                    handleStreamingUpdate(message);
                    break;
                case 'streamingComplete':
                    handleStreamingComplete(message);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleReceiveMessage = (message: any) => {
        const messageData = message.data || message;
        const newMessage: Message = {
            id: Date.now().toString(),
            content: messageData.content || messageData.text || message.text || '',
            sender: 'assistant',
            timestamp: new Date(),
            type: messageData.isError || message.isError ? 'error' : 'text',
            codeActions: messageData.codeActions || [],
            metadata: {
                model: chatState.currentModel,
                files: messageData.metadata?.files || messageData.files || message.files,
                context: messageData.metadata?.context || messageData.context || message.context
            }
        };

        setChatState(prev => ({
            ...prev,
            messages: [...prev.messages, newMessage],
            isLoading: false
        }));
        setStreamingMessageId(null);
    };

    const handleRestoreState = (state: any) => {
        if (state?.messages) {
            const convertedMessages: Message[] = state.messages.map((msg: any, index: number) => ({
                id: msg.id || index.toString(),
                content: msg.text || msg.content || '',
                sender: msg.type === 'ai' || msg.type === 'assistant' ? 'assistant' : 'user',
                timestamp: new Date(msg.timestamp || Date.now()),
                type: 'text',
                metadata: {
                    model: chatState.currentModel
                }
            }));

            setChatState(prev => ({
                ...prev,
                messages: convertedMessages
            }));
        }
    };

    const handleUpdateState = (state: any) => {
        if (state?.messages) {
            handleRestoreState(state);
        }
    };

    const handleStreamingUpdate = (message: any) => {
        const messageId = streamingMessageId || Date.now().toString();

        setChatState(prev => {
            const existingIndex = prev.messages.findIndex(m => m.id === messageId);
            const updatedMessage: Message = {
                id: messageId,
                content: message.content || '',
                sender: 'assistant',
                timestamp: new Date(),
                type: 'text',
                isStreaming: true,
                metadata: {
                    model: chatState.currentModel
                }
            };

            if (existingIndex >= 0) {
                const newMessages = [...prev.messages];
                newMessages[existingIndex] = updatedMessage;
                return { ...prev, messages: newMessages };
            } else {
                return { ...prev, messages: [...prev.messages, updatedMessage] };
            }
        });

        if (!streamingMessageId) {
            setStreamingMessageId(messageId);
        }
    };

    const handleStreamingComplete = (message: any) => {
        if (streamingMessageId) {
            setChatState(prev => {
                const newMessages = prev.messages.map(m =>
                    m.id === streamingMessageId
                        ? { ...m, isStreaming: false }
                        : m
                );
                return { ...prev, messages: newMessages, isLoading: false };
            });
            setStreamingMessageId(null);
        }
    };

    const handleSendMessage = (content: string, files?: string[]) => {
        console.log('Sending message:', content);

        const userMessage: Message = {
            id: Date.now().toString(),
            content,
            sender: 'user',
            timestamp: new Date(),
            type: 'text',
            metadata: {
                files
            }
        };

        setChatState(prev => ({
            ...prev,
            messages: [...prev.messages, userMessage],
            isLoading: true
        }));

        // Send to extension
        const messageData = {
            type: 'sendMessage',
            data: {
                text: content,
                files,
                context: chatState.context
            }
        };

        console.log('Posting message to extension:', messageData);
        window.vscode?.postMessage(messageData);
    };

    const handleRegenerate = (messageId: string) => {
        const messageIndex = chatState.messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return;

        // Find the user message that prompted this response
        let userMessageIndex = messageIndex - 1;
        while (userMessageIndex >= 0 && chatState.messages[userMessageIndex].sender !== 'user') {
            userMessageIndex--;
        }

        if (userMessageIndex >= 0) {
            const userMessage = chatState.messages[userMessageIndex];

            // Remove the assistant message and any subsequent messages
            setChatState(prev => ({
                ...prev,
                messages: prev.messages.slice(0, messageIndex),
                isLoading: true
            }));

            // Send regeneration request
            window.vscode?.postMessage({
                type: 'regenerateResponse',
                data: {
                    messageId,
                    originalMessage: userMessage.content,
                    context: chatState.context
                }
            });
        }
    };

    const handleCopy = (content: string) => {
        // Show a brief success indicator
        console.log('Copied to clipboard:', content);
    };

    const handleEdit = (messageId: string, newContent: string) => {
        setChatState(prev => ({
            ...prev,
            messages: prev.messages.map(m =>
                m.id === messageId
                    ? { ...m, content: newContent }
                    : m
            )
        }));

        // If editing a user message, we might want to regenerate the response
        const message = chatState.messages.find(m => m.id === messageId);
        if (message?.sender === 'user') {
            const messageIndex = chatState.messages.findIndex(m => m.id === messageId);
            // Remove subsequent assistant messages
            setChatState(prev => ({
                ...prev,
                messages: prev.messages.slice(0, messageIndex + 1),
                isLoading: true
            }));

            // Send the edited message
            window.vscode?.postMessage({
                type: 'sendMessage',
                data: {
                    text: newContent,
                    context: chatState.context
                }
            });
        }
    };

    const handleFileSelect = (files: string[]) => {
        // Add selected files to context
        window.vscode?.postMessage({
            type: 'addFilesToContext',
            data: { files }
        });
    };

    const handleSettingsChange = (settings: any) => {
        // Save settings to extension
        window.vscode?.postMessage({
            type: 'updateSettings',
            data: settings
        });
    };

    const handleClearChat = () => {
        setChatState(prev => ({
            ...prev,
            messages: [],
            isLoading: false
        }));
        setStreamingMessageId(null);

        // Notify extension
        window.vscode?.postMessage({
            type: 'clearChat',
            data: {}
        });
    };

    const handleCodeAction = (action: any) => {
        console.log('Code action triggered:', action);

        // Validate action data
        if (!action || !action.id || !action.type) {
            console.error('Invalid action data:', action);
            return;
        }

        // Send code action to extension
        try {
            const message = {
                type: 'codeAction',
                data: {
                    action: action.type,
                    actionId: action.id,
                    code: action.code,
                    filePath: action.filePath,
                    startLine: action.startLine,
                    endLine: action.endLine,
                    label: action.label
                }
            };

            console.log('Sending code action message:', message);
            window.vscode?.postMessage(message);
        } catch (error) {
            console.error('Error sending code action:', error);
        }
    };

    return (
        <div className="modern-chat-interface">
            <div className="chat-header">
                <div className="header-info">
                    <div className="chat-title">
                        <span className="title-icon">🤖</span>
                        <span className="title-text">Kalai Agent</span>
                    </div>
                    <div className="chat-status">
                        <span className="status-indicator online"></span>
                        <span className="status-text">Ready</span>
                    </div>
                </div>

                <div className="header-actions">
                    <button
                        className="header-btn"
                        onClick={() => setShowContextPanel(!showContextPanel)}
                        title="Toggle context panel"
                    >
                        📁
                    </button>
                    <button
                        className="header-btn"
                        onClick={handleClearChat}
                        title="Clear conversation"
                    >
                        <Delete fontSize="small" />
                    </button>
                    <button
                        className="header-btn"
                        onClick={() => setShowSettingsPanel(true)}
                        title="Settings"
                    >
                        ⚙️
                    </button>
                </div>
            </div>

            <div
                className="chat-messages"
                ref={chatContainerRef}
            >
                {chatState.messages.length === 0 ? (
                    <div className="welcome-message">
                        <div className="welcome-icon">👋</div>
                        <h2>Welcome to Kalai Agent</h2>
                        <p>I'm your AI-powered coding assistant. I can help you with:</p>
                        <ul>
                            <li>🔍 Code analysis and debugging</li>
                            <li>📝 Writing and refactoring code</li>
                            <li>📚 Generating documentation</li>
                            <li>🧪 Creating tests</li>
                            <li>🚀 Performance optimization</li>
                        </ul>
                        <p>Ask me anything about your code!</p>
                    </div>
                ) : (
                    chatState.messages.map((message, index) => (
                        <MessageComponent
                            key={message.id}
                            message={message}
                            onRegenerate={handleRegenerate}
                            onCopy={handleCopy}
                            onEdit={handleEdit}
                            onCodeAction={handleCodeAction}
                            isLast={index === chatState.messages.length - 1}
                        />
                    ))
                )}

                {chatState.isLoading && !streamingMessageId && (
                    <div className="loading-indicator">
                        <div className="loading-avatar">🤖</div>
                        <div className="loading-content">
                            <div className="loading-text">Kalai is thinking...</div>
                            <div className="loading-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <Input
                onSendMessage={handleSendMessage}
                disabled={chatState.isLoading}
                placeholder="Ask Kalai anything about your code..."
            />

            <ContextPanel
                isVisible={showContextPanel}
                onClose={() => setShowContextPanel(false)}
                onFileSelect={handleFileSelect}
            />

            <SettingsPanel
                isVisible={showSettingsPanel}
                onClose={() => setShowSettingsPanel(false)}
                onSettingsChange={handleSettingsChange}
            />
        </div>
    );
};