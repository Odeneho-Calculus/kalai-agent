import React from 'react';
import { VSCodeAPI } from '../types/vscode';

interface HistoryPageProps {
    vscode: VSCodeAPI;
    onClose: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ vscode, onClose }) => {
    const [chatHistory, setChatHistory] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        // Request chat history from extension
        vscode.postMessage({ command: 'getHistory' });

        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.command === 'historyResponse') {
                setChatHistory(message.history || []);
                setIsLoading(false);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const loadChat = (sessionId: string) => {
        vscode.postMessage({
            command: 'loadChatSession',
            sessionId
        });
        onClose();
    };

    return (
        <div className="page-container">
            <style>{`
                .page-container {
                    height: 100vh;
                    background: var(--dark-bg);
                    color: var(--text-color);
                    padding: 20px;
                }

                .header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }

                .history-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .history-item {
                    background: var(--lighter-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .history-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }

                .back-button {
                    background: var(--primary-color);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    color: white;
                    cursor: pointer;
                }

                .loading {
                    text-align: center;
                    color: var(--text-color-secondary);
                }

                .empty-state {
                    text-align: center;
                    color: var(--text-color-secondary);
                }
            `}</style>

            <div className="header">
                <h2>Chat History</h2>
                <button className="back-button" onClick={onClose}>
                    Back to Chat
                </button>
            </div>

            <div className="history-list">
                {isLoading ? (
                    <div className="loading">Loading history...</div>
                ) : chatHistory.length === 0 ? (
                    <div className="empty-state">No chat history yet</div>
                ) : (
                    chatHistory.map((chat) => (
                        <div
                            key={chat.id}
                            className="history-item"
                            onClick={() => loadChat(chat.id)}
                        >
                            <h3>{new Date(chat.timestamp).toLocaleString()}</h3>
                            <p>{chat.preview}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
