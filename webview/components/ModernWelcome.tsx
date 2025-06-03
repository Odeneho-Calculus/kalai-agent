import React from 'react';
import './ModernWelcome.css';

interface ModernWelcomeProps {
    onStartChat: () => void;
    onOpenSettings: () => void;
    onOpenContext: () => void;
}

export const ModernWelcome: React.FC<ModernWelcomeProps> = ({
    onStartChat,
    onOpenSettings,
    onOpenContext
}) => {
    const features = [
        {
            icon: '🤖',
            title: 'AI-Powered Assistance',
            description: 'Get intelligent code suggestions, explanations, and solutions powered by advanced AI models.'
        },
        {
            icon: '📁',
            title: 'Smart Context Management',
            description: 'Automatically analyze your project structure and maintain relevant context for better responses.'
        },
        {
            icon: '🎨',
            title: 'Modern Interface',
            description: 'Beautiful, responsive design that adapts to your VS Code theme with smooth animations.'
        },
        {
            icon: '⚡',
            title: 'Real-time Streaming',
            description: 'See AI responses as they are generated with live typing indicators and smooth updates.'
        },
        {
            icon: '🔍',
            title: 'Advanced Search',
            description: 'Search through your codebase and find relevant files with intelligent filtering.'
        },
        {
            icon: '⚙️',
            title: 'Customizable Settings',
            description: 'Personalize your experience with comprehensive settings for AI models, themes, and behavior.'
        }
    ];

    const quickActions = [
        {
            icon: '💬',
            title: 'Start Chatting',
            description: 'Begin a conversation with Kalai',
            action: onStartChat,
            primary: true
        },
        {
            icon: '📁',
            title: 'Browse Context',
            description: 'Explore your project files',
            action: onOpenContext,
            primary: false
        },
        {
            icon: '⚙️',
            title: 'Open Settings',
            description: 'Customize your experience',
            action: onOpenSettings,
            primary: false
        }
    ];

    return (
        <div className="modern-welcome">
            <div className="welcome-header">
                <div className="logo-section">
                    <div className="logo-icon">🚀</div>
                    <div className="logo-text">
                        <h1>Kalai Agent</h1>
                        <p>Your Advanced AI Coding Assistant</p>
                    </div>
                </div>
                <div className="version-badge">v2.0.0</div>
            </div>

            <div className="welcome-content">
                <div className="intro-section">
                    <h2>Welcome to the Future of Coding</h2>
                    <p>
                        Kalai Agent brings you a completely redesigned experience with modern UI,
                        intelligent context management, and powerful AI capabilities. Get ready to
                        supercharge your development workflow!
                    </p>
                </div>

                <div className="quick-actions">
                    <h3>Quick Actions</h3>
                    <div className="actions-grid">
                        {quickActions.map((action, index) => (
                            <button
                                key={index}
                                className={`action-card ${action.primary ? 'primary' : 'secondary'}`}
                                onClick={action.action}
                            >
                                <div className="action-icon">{action.icon}</div>
                                <div className="action-content">
                                    <h4>{action.title}</h4>
                                    <p>{action.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="features-section">
                    <h3>What's New</h3>
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card">
                                <div className="feature-icon">{feature.icon}</div>
                                <div className="feature-content">
                                    <h4>{feature.title}</h4>
                                    <p>{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="tips-section">
                    <h3>Pro Tips</h3>
                    <div className="tips-list">
                        <div className="tip-item">
                            <span className="tip-icon">💡</span>
                            <span>Use <kbd>Ctrl+/</kbd> to quickly access suggestions while typing</span>
                        </div>
                        <div className="tip-item">
                            <span className="tip-icon">🔥</span>
                            <span>Add files to context for more accurate AI responses</span>
                        </div>
                        <div className="tip-item">
                            <span className="tip-icon">✨</span>
                            <span>Try different AI models in settings for varied response styles</span>
                        </div>
                        <div className="tip-item">
                            <span className="tip-icon">🎯</span>
                            <span>Use markdown formatting for better code discussions</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="welcome-footer">
                <p>Ready to start coding with AI? Click "Start Chatting" above!</p>
                <div className="footer-links">
                    <a href="#" className="footer-link">Documentation</a>
                    <a href="#" className="footer-link">GitHub</a>
                    <a href="#" className="footer-link">Support</a>
                </div>
            </div>
        </div>
    );
};