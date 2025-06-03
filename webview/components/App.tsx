import React, { useState, useEffect } from 'react';
import { ModernChatInterface } from './ModernChatInterface';

declare global {
    interface Window {
        acquireVsCodeApi: () => {
            postMessage: (message: any) => void;
        };
        vscode: {
            postMessage: (message: any) => void;
        };
    }
}

// Initialize VS Code API once
const vscode = window.acquireVsCodeApi();
window.vscode = vscode;

export const App: React.FC = () => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Ensure VS Code API is available globally
        window.vscode = vscode;
        setIsReady(true);

        // Send ready message to extension
        vscode.postMessage({
            type: 'webviewReady',
            data: {}
        });
    }, []);

    if (!isReady) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'var(--vscode-sideBar-background)',
                color: 'var(--vscode-foreground)',
                fontFamily: 'var(--vscode-font-family)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: '48px',
                        marginBottom: '16px',
                        animation: 'pulse 2s infinite'
                    }}>🤖</div>
                    <div style={{
                        fontSize: '18px',
                        fontWeight: '500',
                        marginBottom: '8px'
                    }}>Kalai Agent</div>
                    <div style={{
                        fontSize: '14px',
                        color: 'var(--vscode-descriptionForeground)'
                    }}>Initializing AI assistant...</div>
                </div>
                <style>{`
                    @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.7; transform: scale(1.05); }
                    }
                `}</style>
            </div>
        );
    }

    return <ModernChatInterface />;
};
