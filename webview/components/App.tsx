import React from 'react';
import { Chat } from './Chat';

declare global {
    interface Window {
        acquireVsCodeApi: () => any;
    }
}

// Initialize VS Code API once
const vscode = window.acquireVsCodeApi();

export const App: React.FC = () => {
    return <Chat vscode={vscode} />;
};
