import React, { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ContextPanel } from './ContextPanel';
import { ModeToggle } from './ModeToggle';
import { FileReferencePanel } from './FileReferencePanel';
import './ChatInterface.css';
import { Assignment, Delete, Bolt, Chat } from '@mui/icons-material';

export interface Message {
    id: string;
    content: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
    type?: 'text' | 'code' | 'error' | 'system';
    metadata?: {
        files?: string[];
        context?: any;
        language?: string;
        isStreaming?: boolean;
    };
}

export interface FileReference {
    path: string;
    name: string;
    language: string;
    content?: string;
    lineRange?: { start: number; end: number };
    isActive: boolean;
}

export interface ChatMode {
    type: 'chat' | 'coding';
    label: string;
    icon: React.ReactElement;
    description: string;
}

export const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentMode, setCurrentMode] = useState<ChatMode>({
        type: 'chat',
        label: 'Chat Mode',
        icon: <Chat fontSize="small" />,
        description: 'General conversation and questions'
    });
    const [fileReferences, setFileReferences] = useState<FileReference[]>([]);
    const [showContextPanel, setShowContextPanel] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [contextData, setContextData] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const modes: ChatMode[] = [
        {
            type: 'chat',
            label: 'Chat Mode',
            icon: <Chat fontSize="small" />,
            description: 'General conversation and questions'
        },
        {
            type: 'coding',
            label: 'Coding Mode',
            icon: <Bolt fontSize="small" />,
            description: 'Code analysis, generation, and debugging'
        }
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (content: string, attachedFiles: FileReference[]) => {
        const userMessage: Message = {
            id: Date.now().toString(),
            content,
            sender: 'user',
            timestamp: new Date(),
            type: 'text',
            metadata: {
                files: attachedFiles.map(f => f.path)
            }
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        // Update file references
        setFileReferences(prev => {
            const newRefs = [...prev];
            attachedFiles.forEach(file => {
                const existingIndex = newRefs.findIndex(ref => ref.path === file.path);
                if (existingIndex >= 0) {
                    newRefs[existingIndex] = { ...file, isActive: true };
                } else {
                    newRefs.push({ ...file, isActive: true });
                }
            });
            return newRefs;
        });

        try {
            // Send message to extension
            const response = await window.vscode.postMessage({
                type: 'sendMessage',
                data: {
                    message: content,
                    mode: currentMode.type,
                    files: attachedFiles,
                    context: contextData
                }
            });

            // Handle response (this will be received via message listener)
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                sender: 'assistant',
                timestamp: new Date(),
                type: 'error'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleModeChange = (mode: ChatMode) => {
        setCurrentMode(mode);
        // Send mode change to extension
        window.vscode.postMessage({
            type: 'modeChanged',
            data: { mode: mode.type }
        });
    };

    const handleFileRemove = (filePath: string) => {
        setFileReferences(prev => prev.filter(ref => ref.path !== filePath));
    };

    const handleContextToggle = () => {
        setShowContextPanel(!showContextPanel);
        if (!showContextPanel) {
            // Request context data from extension
            window.vscode.postMessage({
                type: 'getContext',
                data: {}
            });
        }
    };

    // Listen for messages from extension
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;

            switch (message.type) {
                case 'assistantResponse':
                    const assistantMessage: Message = {
                        id: Date.now().toString(),
                        content: message.data.content,
                        sender: 'assistant',
                        timestamp: new Date(),
                        type: message.data.type || 'text',
                        metadata: message.data.metadata
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                    setIsLoading(false);
                    break;

                case 'contextData':
                    setContextData(message.data);
                    break;

                case 'fileAdded':
                    const newFile: FileReference = {
                        path: message.data.path,
                        name: message.data.name,
                        language: message.data.language,
                        content: message.data.content,
                        lineRange: message.data.lineRange,
                        isActive: true
                    };
                    setFileReferences(prev => [...prev, newFile]);
                    break;

                case 'clearConversation':
                    setMessages([]);
                    setFileReferences([]);
                    setContextData(null);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <div className="chat-interface">
            <div className="chat-header">
                <div className="header-top">
                    <h2 className="chat-title">
                        <span className="title-icon">🤖</span>
                        Kalai Agent
                    </h2>
                    <div className="header-actions">
                        <button
                            className={`context-toggle ${showContextPanel ? 'active' : ''}`}
                            onClick={handleContextToggle}
                            title="Toggle Context Panel"
                        >
                            <Assignment fontSize="small" />
                        </button>
                        <button
                            className="clear-chat"
                            onClick={() => {
                                setMessages([]);
                                setFileReferences([]);
                                window.vscode.postMessage({ type: 'clearConversation' });
                            }}
                            title="Clear Conversation"
                        >
                            <Delete fontSize="small" />
                        </button>
                    </div>
                </div>

                <ModeToggle
                    modes={modes}
                    currentMode={currentMode}
                    onModeChange={handleModeChange}
                />

                {fileReferences.length > 0 && (
                    <FileReferencePanel
                        files={fileReferences}
                        onFileRemove={handleFileRemove}
                    />
                )}
            </div>

            <div className="chat-body">
                <div className="chat-main">
                    <MessageList
                        messages={messages}
                        isLoading={isLoading}
                        currentMode={currentMode.type}
                    />
                    <div ref={messagesEndRef} />
                </div>

                {showContextPanel && (
                    <ContextPanel
                        contextData={contextData}
                        onClose={() => setShowContextPanel(false)}
                    />
                )}
            </div>

            <div className="chat-footer">
                <MessageInput
                    onSendMessage={handleSendMessage}
                    currentMode={currentMode}
                    disabled={isLoading}
                    fileReferences={fileReferences}
                />
            </div>
        </div>
    );
};