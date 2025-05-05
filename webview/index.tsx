import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';

// Polyfill process
window.process = window.process || { env: {}, platform: 'web' };

try {
    const container = document.getElementById('root');
    if (!container) {
        throw new Error('Root container not found');
    }

    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
} catch (error) {
    console.error('Failed to initialize webview:', error);
}
