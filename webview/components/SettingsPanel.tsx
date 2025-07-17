import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './SettingsPanel.css';

// Enhanced interfaces with comprehensive settings structure
interface AIModelConfig {
    id: string;
    name: string;
    provider: string;
    maxTokens: number;
    supportedFeatures: string[];
    costPerToken?: number;
    description: string;
}

interface PerformanceSettings {
    enableCaching: boolean;
    cacheSize: number;
    parallelProcessing: boolean;
    maxConcurrentRequests: number;
    requestTimeout: number;
    enableCompression: boolean;
}

interface SecuritySettings {
    enableDataEncryption: boolean;
    allowTelemetry: boolean;
    enableAuditLogging: boolean;
    restrictedDomains: string[];
    enableSandboxMode: boolean;
    requireAuthentication: boolean;
}

interface DeveloperSettings {
    enableDebugMode: boolean;
    showPerformanceMetrics: boolean;
    enableExperimentalFeatures: boolean;
    customPluginPath: string;
    enableHotReload: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace';
}

interface IntegrationSettings {
    enableGitIntegration: boolean;
    enableJiraIntegration: boolean;
    enableSlackIntegration: boolean;
    enableTeamsIntegration: boolean;
    customWebhooks: string[];
    enableCICD: boolean;
}

interface AdvancedSettingsData {
    theme: 'auto' | 'light' | 'dark' | 'high-contrast';
    fontSize: number;
    fontFamily: string;
    autoSave: boolean;
    autoSaveInterval: number;
    showLineNumbers: boolean;
    enableSuggestions: boolean;
    suggestionDelay: number;
    maxTokens: number;
    temperature: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    model: string;
    customModels: AIModelConfig[];
    performance: PerformanceSettings;
    security: SecuritySettings;
    developer: DeveloperSettings;
    integrations: IntegrationSettings;
    shortcuts: Record<string, string>;
    customPrompts: Array<{ name: string; prompt: string; category: string }>;
    workspaceSettings: Record<string, any>;
}

interface SettingsPanelProps {
    isVisible: boolean;
    onClose: () => void;
    onSettingsChange: (settings: Partial<AdvancedSettingsData>) => void;
    currentWorkspace?: string;
}

// Available AI models with comprehensive configuration
const AVAILABLE_MODELS: AIModelConfig[] = [
    {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'OpenAI',
        maxTokens: 128000,
        supportedFeatures: ['code-generation', 'analysis', 'refactoring', 'documentation'],
        costPerToken: 0.00003,
        description: 'Most capable model for complex coding tasks'
    },
    {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'OpenAI',
        maxTokens: 8192,
        supportedFeatures: ['code-generation', 'analysis', 'refactoring'],
        costPerToken: 0.00006,
        description: 'High-quality responses with excellent reasoning'
    },
    {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'OpenAI',
        maxTokens: 16384,
        supportedFeatures: ['code-generation', 'basic-analysis'],
        costPerToken: 0.000002,
        description: 'Fast and cost-effective for most tasks'
    },
    {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'Anthropic',
        maxTokens: 200000,
        supportedFeatures: ['code-generation', 'analysis', 'refactoring', 'documentation', 'long-context'],
        costPerToken: 0.000075,
        description: 'Excellent for large codebases and complex analysis'
    },
    {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'Anthropic',
        maxTokens: 200000,
        supportedFeatures: ['code-generation', 'analysis', 'refactoring'],
        costPerToken: 0.000015,
        description: 'Balanced performance and cost'
    },
    {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'Google',
        maxTokens: 32768,
        supportedFeatures: ['code-generation', 'analysis', 'multimodal'],
        costPerToken: 0.000001,
        description: 'Google\'s advanced multimodal model'
    }
];

const DEFAULT_SHORTCUTS = {
    'kalai-agent.startChat': 'Ctrl+Shift+K',
    'kalai-agent.editWithAI': 'Ctrl+Shift+E',
    'kalai-agent.explainCode': 'Ctrl+Shift+X',
    'kalai-agent.generateTests': 'Ctrl+Shift+T',
    'kalai-agent.refactorCode': 'Ctrl+Shift+R'
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    isVisible,
    onClose,
    onSettingsChange,
    currentWorkspace
}) => {
    const [settings, setSettings] = useState<AdvancedSettingsData>({
        theme: 'auto',
        fontSize: 14,
        fontFamily: 'Consolas, Monaco, monospace',
        autoSave: true,
        autoSaveInterval: 30,
        showLineNumbers: true,
        enableSuggestions: true,
        suggestionDelay: 500,
        maxTokens: 4000,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        model: 'gpt-4-turbo',
        customModels: [],
        performance: {
            enableCaching: true,
            cacheSize: 100,
            parallelProcessing: true,
            maxConcurrentRequests: 5,
            requestTimeout: 30000,
            enableCompression: true
        },
        security: {
            enableDataEncryption: true,
            allowTelemetry: false,
            enableAuditLogging: true,
            restrictedDomains: [],
            enableSandboxMode: false,
            requireAuthentication: false
        },
        developer: {
            enableDebugMode: false,
            showPerformanceMetrics: false,
            enableExperimentalFeatures: false,
            customPluginPath: '',
            enableHotReload: false,
            logLevel: 'info'
        },
        integrations: {
            enableGitIntegration: true,
            enableJiraIntegration: false,
            enableSlackIntegration: false,
            enableTeamsIntegration: false,
            customWebhooks: [],
            enableCICD: false
        },
        shortcuts: DEFAULT_SHORTCUTS,
        customPrompts: [],
        workspaceSettings: {}
    });

    const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'performance' | 'security' | 'developer' | 'integrations' | 'shortcuts' | 'advanced'>('general');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Load settings from extension
    useEffect(() => {
        if (isVisible) {
            window.vscode?.postMessage({
                type: 'getSettings',
                data: { workspace: currentWorkspace }
            });
        }
    }, [isVisible, currentWorkspace]);

    // Listen for settings from extension
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'settingsLoaded') {
                setSettings(prevSettings => ({ ...prevSettings, ...message.data }));
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Validation logic
    const validateSettings = useCallback((newSettings: AdvancedSettingsData): Record<string, string> => {
        const errors: Record<string, string> = {};

        if (newSettings.fontSize < 8 || newSettings.fontSize > 32) {
            errors.fontSize = 'Font size must be between 8 and 32';
        }

        if (newSettings.temperature < 0 || newSettings.temperature > 2) {
            errors.temperature = 'Temperature must be between 0 and 2';
        }

        if (newSettings.maxTokens < 100 || newSettings.maxTokens > 200000) {
            errors.maxTokens = 'Max tokens must be between 100 and 200,000';
        }

        if (newSettings.performance.requestTimeout < 5000 || newSettings.performance.requestTimeout > 300000) {
            errors.requestTimeout = 'Request timeout must be between 5 and 300 seconds';
        }

        return errors;
    }, []);

    // Handle setting changes with validation
    const handleSettingChange = useCallback(<K extends keyof AdvancedSettingsData>(
        key: K,
        value: AdvancedSettingsData[K]
    ) => {
        const newSettings = { ...settings, [key]: value };
        const errors = validateSettings(newSettings);

        setValidationErrors(errors);
        setSettings(newSettings);
        setIsDirty(true);

        if (Object.keys(errors).length === 0) {
            onSettingsChange({ [key]: value });
        }
    }, [settings, validateSettings, onSettingsChange]);

    // Handle nested setting changes
    const handleNestedSettingChange = useCallback(<T extends keyof AdvancedSettingsData, K extends keyof AdvancedSettingsData[T]>(
        section: T,
        key: K,
        value: AdvancedSettingsData[T][K]
    ) => {
        const newSectionSettings = { ...settings[section] as any, [key]: value };
        handleSettingChange(section, newSectionSettings);
    }, [settings, handleSettingChange]);

    // Save settings
    const handleSave = useCallback(() => {
        if (Object.keys(validationErrors).length === 0) {
            window.vscode?.postMessage({
                type: 'saveSettings',
                data: { settings, workspace: currentWorkspace }
            });
            setIsDirty(false);
        }
    }, [settings, validationErrors, currentWorkspace]);

    // Reset to defaults
    const handleReset = useCallback(() => {
        const defaultSettings: AdvancedSettingsData = {
            theme: 'auto',
            fontSize: 14,
            fontFamily: 'Consolas, Monaco, monospace',
            autoSave: true,
            autoSaveInterval: 30,
            showLineNumbers: true,
            enableSuggestions: true,
            suggestionDelay: 500,
            maxTokens: 4000,
            temperature: 0.7,
            topP: 1.0,
            frequencyPenalty: 0.0,
            presencePenalty: 0.0,
            model: 'gpt-4-turbo',
            customModels: [],
            performance: {
                enableCaching: true,
                cacheSize: 100,
                parallelProcessing: true,
                maxConcurrentRequests: 5,
                requestTimeout: 30000,
                enableCompression: true
            },
            security: {
                enableDataEncryption: true,
                allowTelemetry: false,
                enableAuditLogging: true,
                restrictedDomains: [],
                enableSandboxMode: false,
                requireAuthentication: false
            },
            developer: {
                enableDebugMode: false,
                showPerformanceMetrics: false,
                enableExperimentalFeatures: false,
                customPluginPath: '',
                enableHotReload: false,
                logLevel: 'info'
            },
            integrations: {
                enableGitIntegration: true,
                enableJiraIntegration: false,
                enableSlackIntegration: false,
                enableTeamsIntegration: false,
                customWebhooks: [],
                enableCICD: false
            },
            shortcuts: DEFAULT_SHORTCUTS,
            customPrompts: [],
            workspaceSettings: {}
        };

        setSettings(defaultSettings);
        setValidationErrors({});
        setIsDirty(true);
        onSettingsChange(defaultSettings);
    }, [onSettingsChange]);

    // Export settings
    const handleExport = useCallback(() => {
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kalai-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }, [settings]);

    // Import settings
    const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedSettings = JSON.parse(e.target?.result as string);
                    const errors = validateSettings(importedSettings);

                    if (Object.keys(errors).length === 0) {
                        setSettings({ ...settings, ...importedSettings });
                        setIsDirty(true);
                        onSettingsChange(importedSettings);
                    } else {
                        setValidationErrors(errors);
                    }
                } catch (error) {
                    console.error('Error importing settings:', error);
                    setValidationErrors({ import: 'Invalid settings file format' });
                }
            };
            reader.readAsText(file);
        }
    }, [settings, validateSettings, onSettingsChange]);

    // Filter settings based on search
    const filteredTabs = useMemo(() => {
        if (!searchQuery) return null;

        const query = searchQuery.toLowerCase();
        const matchingTabs = new Set<string>();

        // Search through all settings
        Object.entries(settings).forEach(([key, value]) => {
            if (key.toLowerCase().includes(query) ||
                (typeof value === 'string' && value.toLowerCase().includes(query))) {
                // Map settings to their respective tabs
                if (['theme', 'fontSize', 'fontFamily', 'autoSave', 'showLineNumbers'].includes(key)) {
                    matchingTabs.add('general');
                } else if (['model', 'temperature', 'maxTokens', 'topP'].includes(key)) {
                    matchingTabs.add('ai');
                } else if (key === 'performance') {
                    matchingTabs.add('performance');
                } else if (key === 'security') {
                    matchingTabs.add('security');
                } else if (key === 'developer') {
                    matchingTabs.add('developer');
                } else if (key === 'integrations') {
                    matchingTabs.add('integrations');
                } else if (key === 'shortcuts') {
                    matchingTabs.add('shortcuts');
                }
            }
        });

        return Array.from(matchingTabs);
    }, [searchQuery, settings]);

    if (!isVisible) return null;

    const selectedModel = AVAILABLE_MODELS.find(m => m.id === settings.model);

    return (
        <div className="modern-settings-panel">
            <div className="settings-container">
                {/* Enhanced Header */}
                <div className="settings-header">
                    <div className="header-content">
                        <div className="header-title">
                            <span className="title-icon">⚙️</span>
                            <div className="title-text">
                                <span className="main-title">Kalai Agent Settings</span>
                                {currentWorkspace && (
                                    <span className="workspace-indicator">
                                        📁 {currentWorkspace}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="header-actions">
                            {isDirty && (
                                <button
                                    className="save-btn primary"
                                    onClick={handleSave}
                                    disabled={Object.keys(validationErrors).length > 0}
                                >
                                    💾 Save Changes
                                </button>
                            )}
                            <button className="close-btn" onClick={onClose}>
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="🔍 Search settings..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                            aria-label="Search settings"
                            title="Search for specific settings"
                        />
                    </div>
                </div>

                {/* Enhanced Tabs */}
                <div className="settings-tabs">
                    {[
                        { id: 'general', label: '🏠 General', icon: '🏠' },
                        { id: 'ai', label: '🤖 AI Models', icon: '🤖' },
                        { id: 'performance', label: '⚡ Performance', icon: '⚡' },
                        { id: 'security', label: '🔒 Security', icon: '🔒' },
                        { id: 'developer', label: '👨‍💻 Developer', icon: '👨‍💻' },
                        { id: 'integrations', label: '🔗 Integrations', icon: '🔗' },
                        { id: 'shortcuts', label: '⌨️ Shortcuts', icon: '⌨️' },
                        { id: 'advanced', label: '🔧 Advanced', icon: '🔧' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={`tab ${activeTab === tab.id ? 'active' : ''} ${filteredTabs && !filteredTabs.includes(tab.id) ? 'dimmed' : ''
                                }`}
                            onClick={() => setActiveTab(tab.id as any)}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            <span className="tab-label">{tab.label.replace(tab.icon + ' ', '')}</span>
                        </button>
                    ))}
                </div>

                {/* Settings Content */}
                <div className="settings-content">
                    {/* General Settings */}
                    {activeTab === 'general' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <h3>🏠 General Settings</h3>
                                <p className="section-description">Configure basic appearance and behavior</p>
                            </div>

                            <div className="settings-grid">
                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Theme</label>
                                        <span className="setting-badge">Visual</span>
                                    </div>
                                    <select
                                        value={settings.theme}
                                        onChange={(e) => handleSettingChange('theme', e.target.value as any)}
                                        className="setting-select"
                                        aria-label="Theme selection"
                                        title="Choose the color theme for the interface"
                                    >
                                        <option value="auto">🔄 Auto (Follow VS Code)</option>
                                        <option value="light">☀️ Light</option>
                                        <option value="dark">🌙 Dark</option>
                                        <option value="high-contrast">🔆 High Contrast</option>
                                    </select>
                                    <span className="setting-description">Choose the color theme for the interface</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Font Size</label>
                                        <span className="setting-badge">Typography</span>
                                    </div>
                                    <div className="setting-range">
                                        <input
                                            type="range"
                                            min="8"
                                            max="32"
                                            value={settings.fontSize}
                                            onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
                                            className="setting-slider"
                                            aria-label="Font size slider"
                                            title="Adjust the font size for better readability"
                                        />
                                        <span className="range-value">{settings.fontSize}px</span>
                                    </div>
                                    {validationErrors.fontSize && (
                                        <span className="error-message">{validationErrors.fontSize}</span>
                                    )}
                                    <span className="setting-description">Adjust the font size for better readability</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Font Family</label>
                                        <span className="setting-badge">Typography</span>
                                    </div>
                                    <select
                                        value={settings.fontFamily}
                                        onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
                                        className="setting-select"
                                        aria-label="Font family selection"
                                        title="Choose your preferred coding font"
                                    >
                                        <option value="Consolas, Monaco, monospace">Consolas</option>
                                        <option value="'Fira Code', monospace">Fira Code</option>
                                        <option value="'Source Code Pro', monospace">Source Code Pro</option>
                                        <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                                        <option value="'Cascadia Code', monospace">Cascadia Code</option>
                                    </select>
                                    <span className="setting-description">Choose your preferred coding font</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Auto Save</label>
                                        <span className="setting-badge">Behavior</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.autoSave}
                                            onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                                            aria-label="Auto save toggle"
                                            title="Automatically save changes"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Automatically save conversation history</span>
                                </div>

                                {settings.autoSave && (
                                    <div className="setting-card">
                                        <div className="setting-header">
                                            <label className="setting-label">Auto Save Interval</label>
                                            <span className="setting-badge">Timing</span>
                                        </div>
                                        <div className="setting-range">
                                            <input
                                                type="range"
                                                min="10"
                                                max="300"
                                                step="10"
                                                value={settings.autoSaveInterval}
                                                onChange={(e) => handleSettingChange('autoSaveInterval', parseInt(e.target.value))}
                                                className="setting-slider"
                                                aria-label="Auto save interval slider"
                                                title="Set how often to save automatically"
                                            />
                                            <span className="range-value">{settings.autoSaveInterval}s</span>
                                        </div>
                                        <span className="setting-description">How often to save automatically</span>
                                    </div>
                                )}

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Show Line Numbers</label>
                                        <span className="setting-badge">Display</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.showLineNumbers}
                                            onChange={(e) => handleSettingChange('showLineNumbers', e.target.checked)}
                                            aria-label="Show line numbers toggle"
                                            title="Display line numbers in code blocks"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Display line numbers in code blocks</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Enable Suggestions</label>
                                        <span className="setting-badge">AI</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.enableSuggestions}
                                            onChange={(e) => handleSettingChange('enableSuggestions', e.target.checked)}
                                            aria-label="Enable suggestions toggle"
                                            title="Show quick suggestion prompts"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Show quick suggestion prompts</span>
                                </div>

                                {settings.enableSuggestions && (
                                    <div className="setting-card">
                                        <div className="setting-header">
                                            <label className="setting-label">Suggestion Delay</label>
                                            <span className="setting-badge">Timing</span>
                                        </div>
                                        <div className="setting-range">
                                            <input
                                                type="range"
                                                min="100"
                                                max="2000"
                                                step="100"
                                                value={settings.suggestionDelay}
                                                onChange={(e) => handleSettingChange('suggestionDelay', parseInt(e.target.value))}
                                                className="setting-slider"
                                                aria-label="Suggestion delay slider"
                                                title="Set delay before showing suggestions"
                                            />
                                            <span className="range-value">{settings.suggestionDelay}ms</span>
                                        </div>
                                        <span className="setting-description">Delay before showing suggestions</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* AI Models Settings */}
                    {activeTab === 'ai' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <h3>🤖 AI Model Configuration</h3>
                                <p className="section-description">Configure AI models and generation parameters</p>
                            </div>

                            <div className="settings-grid">
                                <div className="setting-card featured">
                                    <div className="setting-header">
                                        <label className="setting-label">Primary Model</label>
                                        <span className="setting-badge primary">Core</span>
                                    </div>
                                    <select
                                        value={settings.model}
                                        onChange={(e) => handleSettingChange('model', e.target.value)}
                                        className="setting-select"
                                        aria-label="Primary AI model selection"
                                        title="Select the primary AI model to use"
                                    >
                                        {AVAILABLE_MODELS.map(model => (
                                            <option key={model.id} value={model.id}>
                                                {model.name} ({model.provider})
                                            </option>
                                        ))}
                                    </select>
                                    {selectedModel && (
                                        <div className="model-info">
                                            <div className="model-details">
                                                <span className="model-description">{selectedModel.description}</span>
                                                <div className="model-specs">
                                                    <span className="spec">Max Tokens: {selectedModel.maxTokens.toLocaleString()}</span>
                                                    {selectedModel.costPerToken && (
                                                        <span className="spec">Cost: ${selectedModel.costPerToken}/token</span>
                                                    )}
                                                </div>
                                                <div className="model-features">
                                                    {selectedModel.supportedFeatures.map(feature => (
                                                        <span key={feature} className="feature-tag">{feature}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Max Tokens</label>
                                        <span className="setting-badge">Limits</span>
                                    </div>
                                    <div className="setting-range">
                                        <input
                                            type="range"
                                            min="100"
                                            max={selectedModel?.maxTokens || 8000}
                                            step="100"
                                            value={settings.maxTokens}
                                            onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value))}
                                            className="setting-slider"
                                            aria-label="Max tokens slider"
                                            title="Set maximum tokens for AI responses"
                                        />
                                        <span className="range-value">{settings.maxTokens.toLocaleString()}</span>
                                    </div>
                                    {validationErrors.maxTokens && (
                                        <span className="error-message">{validationErrors.maxTokens}</span>
                                    )}
                                    <span className="setting-description">Maximum tokens for AI responses</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Temperature</label>
                                        <span className="setting-badge">Creativity</span>
                                    </div>
                                    <div className="setting-range">
                                        <input
                                            type="range"
                                            min="0"
                                            max="2"
                                            step="0.1"
                                            value={settings.temperature}
                                            onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
                                            className="setting-slider"
                                            aria-label="Temperature slider"
                                            title="Adjust AI creativity and randomness"
                                        />
                                        <span className="range-value">{settings.temperature}</span>
                                    </div>
                                    {validationErrors.temperature && (
                                        <span className="error-message">{validationErrors.temperature}</span>
                                    )}
                                    <span className="setting-description">
                                        Controls randomness: 0 = focused, 2 = very creative
                                    </span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Top P</label>
                                        <span className="setting-badge">Sampling</span>
                                    </div>
                                    <div className="setting-range">
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="1"
                                            step="0.1"
                                            value={settings.topP}
                                            onChange={(e) => handleSettingChange('topP', parseFloat(e.target.value))}
                                            className="setting-slider"
                                            aria-label="Top P slider"
                                            title="Nucleus sampling parameter"
                                        />
                                        <span className="range-value">{settings.topP}</span>
                                    </div>
                                    <span className="setting-description">Nucleus sampling parameter</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Frequency Penalty</label>
                                        <span className="setting-badge">Repetition</span>
                                    </div>
                                    <div className="setting-range">
                                        <input
                                            type="range"
                                            min="-2"
                                            max="2"
                                            step="0.1"
                                            value={settings.frequencyPenalty}
                                            onChange={(e) => handleSettingChange('frequencyPenalty', parseFloat(e.target.value))}
                                            className="setting-slider"
                                            aria-label="Frequency penalty slider"
                                            title="Reduce repetition in AI responses"
                                        />
                                        <span className="range-value">{settings.frequencyPenalty}</span>
                                    </div>
                                    <span className="setting-description">Reduces repetition of frequent tokens</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Presence Penalty</label>
                                        <span className="setting-badge">Diversity</span>
                                    </div>
                                    <div className="setting-range">
                                        <input
                                            type="range"
                                            min="-2"
                                            max="2"
                                            step="0.1"
                                            value={settings.presencePenalty}
                                            onChange={(e) => handleSettingChange('presencePenalty', parseFloat(e.target.value))}
                                            className="setting-slider"
                                            aria-label="Presence penalty slider"
                                            title="Encourage talking about new topics"
                                        />
                                        <span className="range-value">{settings.presencePenalty}</span>
                                    </div>
                                    <span className="setting-description">Encourages talking about new topics</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Performance Settings */}
                    {activeTab === 'performance' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <h3>⚡ Performance Optimization</h3>
                                <p className="section-description">Configure performance and resource usage</p>
                            </div>

                            <div className="settings-grid">
                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Enable Caching</label>
                                        <span className="setting-badge">Speed</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.performance.enableCaching}
                                            onChange={(e) => handleNestedSettingChange('performance', 'enableCaching', e.target.checked)}
                                            aria-label="Enable caching toggle"
                                            title="Enable caching for better performance"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Cache responses for faster retrieval</span>
                                </div>

                                {settings.performance.enableCaching && (
                                    <div className="setting-card">
                                        <div className="setting-header">
                                            <label className="setting-label">Cache Size (MB)</label>
                                            <span className="setting-badge">Memory</span>
                                        </div>
                                        <div className="setting-range">
                                            <input
                                                type="range"
                                                min="10"
                                                max="1000"
                                                step="10"
                                                value={settings.performance.cacheSize}
                                                onChange={(e) => handleNestedSettingChange('performance', 'cacheSize', parseInt(e.target.value))}
                                                className="setting-slider"
                                                aria-label="Cache size slider"
                                                title="Set maximum cache size in MB"
                                            />
                                            <span className="range-value">{settings.performance.cacheSize}MB</span>
                                        </div>
                                        <span className="setting-description">Maximum cache size</span>
                                    </div>
                                )}

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Parallel Processing</label>
                                        <span className="setting-badge">Concurrency</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.performance.parallelProcessing}
                                            onChange={(e) => handleNestedSettingChange('performance', 'parallelProcessing', e.target.checked)}
                                            aria-label="Parallel processing toggle"
                                            title="Process multiple requests simultaneously"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Process multiple requests simultaneously</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Max Concurrent Requests</label>
                                        <span className="setting-badge">Limits</span>
                                    </div>
                                    <div className="setting-range">
                                        <input
                                            type="range"
                                            min="1"
                                            max="20"
                                            value={settings.performance.maxConcurrentRequests}
                                            onChange={(e) => handleNestedSettingChange('performance', 'maxConcurrentRequests', parseInt(e.target.value))}
                                            className="setting-slider"
                                            aria-label="Max concurrent requests slider"
                                            title="Set maximum number of concurrent requests"
                                        />
                                        <span className="range-value">{settings.performance.maxConcurrentRequests}</span>
                                    </div>
                                    <span className="setting-description">Maximum simultaneous API requests</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Request Timeout</label>
                                        <span className="setting-badge">Network</span>
                                    </div>
                                    <div className="setting-range">
                                        <input
                                            type="range"
                                            min="5000"
                                            max="300000"
                                            step="5000"
                                            value={settings.performance.requestTimeout}
                                            onChange={(e) => handleNestedSettingChange('performance', 'requestTimeout', parseInt(e.target.value))}
                                            className="setting-slider"
                                            aria-label="Request timeout slider"
                                            title="Set request timeout in milliseconds"
                                        />
                                        <span className="range-value">{Math.round(settings.performance.requestTimeout / 1000)}s</span>
                                    </div>
                                    {validationErrors.requestTimeout && (
                                        <span className="error-message">{validationErrors.requestTimeout}</span>
                                    )}
                                    <span className="setting-description">Maximum time to wait for responses</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Enable Compression</label>
                                        <span className="setting-badge">Bandwidth</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.performance.enableCompression}
                                            onChange={(e) => handleNestedSettingChange('performance', 'enableCompression', e.target.checked)}
                                            aria-label="Enable compression toggle"
                                            title="Compress data to reduce bandwidth usage"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Compress data to reduce bandwidth usage</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Settings */}
                    {activeTab === 'security' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <h3>🔒 Security & Privacy</h3>
                                <p className="section-description">Configure security and privacy settings</p>
                            </div>

                            <div className="settings-grid">
                                <div className="setting-card featured">
                                    <div className="setting-header">
                                        <label className="setting-label">Data Encryption</label>
                                        <span className="setting-badge security">Critical</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.security.enableDataEncryption}
                                            onChange={(e) => handleNestedSettingChange('security', 'enableDataEncryption', e.target.checked)}
                                            aria-label="Data encryption toggle"
                                            title="Encrypt sensitive data at rest and in transit"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Encrypt sensitive data at rest and in transit</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Allow Telemetry</label>
                                        <span className="setting-badge">Privacy</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.security.allowTelemetry}
                                            onChange={(e) => handleNestedSettingChange('security', 'allowTelemetry', e.target.checked)}
                                            aria-label="Allow telemetry toggle"
                                            title="Send anonymous usage data to improve the extension"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Send anonymous usage data to improve the extension</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Audit Logging</label>
                                        <span className="setting-badge">Compliance</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.security.enableAuditLogging}
                                            onChange={(e) => handleNestedSettingChange('security', 'enableAuditLogging', e.target.checked)}
                                            aria-label="Audit logging toggle"
                                            title="Log all actions for security auditing"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Log all actions for security auditing</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Sandbox Mode</label>
                                        <span className="setting-badge">Isolation</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.security.enableSandboxMode}
                                            onChange={(e) => handleNestedSettingChange('security', 'enableSandboxMode', e.target.checked)}
                                            aria-label="Sandbox mode toggle"
                                            title="Run AI operations in isolated environment"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Run AI operations in isolated environment</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Require Authentication</label>
                                        <span className="setting-badge">Access</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.security.requireAuthentication}
                                            onChange={(e) => handleNestedSettingChange('security', 'requireAuthentication', e.target.checked)}
                                            aria-label="Require authentication toggle"
                                            title="Require authentication for sensitive operations"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Require authentication for sensitive operations</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Developer Settings */}
                    {activeTab === 'developer' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <h3>👨‍💻 Developer Options</h3>
                                <p className="section-description">Advanced settings for developers and debugging</p>
                            </div>

                            <div className="settings-grid">
                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Debug Mode</label>
                                        <span className="setting-badge">Development</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.developer.enableDebugMode}
                                            onChange={(e) => handleNestedSettingChange('developer', 'enableDebugMode', e.target.checked)}
                                            aria-label="Debug mode toggle"
                                            title="Enable detailed debugging information"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Enable detailed debugging information</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Performance Metrics</label>
                                        <span className="setting-badge">Monitoring</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.developer.showPerformanceMetrics}
                                            onChange={(e) => handleNestedSettingChange('developer', 'showPerformanceMetrics', e.target.checked)}
                                            aria-label="Performance metrics toggle"
                                            title="Display performance metrics in the UI"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Display performance metrics in the UI</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Experimental Features</label>
                                        <span className="setting-badge warning">Beta</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.developer.enableExperimentalFeatures}
                                            onChange={(e) => handleNestedSettingChange('developer', 'enableExperimentalFeatures', e.target.checked)}
                                            aria-label="Experimental features toggle"
                                            title="Enable experimental and beta features"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Enable experimental and beta features</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Log Level</label>
                                        <span className="setting-badge">Logging</span>
                                    </div>
                                    <select
                                        value={settings.developer.logLevel}
                                        onChange={(e) => handleNestedSettingChange('developer', 'logLevel', e.target.value as any)}
                                        className="setting-select"
                                        aria-label="Log level selection"
                                        title="Select the logging level for debugging"
                                    >
                                        <option value="error">🔴 Error</option>
                                        <option value="warn">🟡 Warning</option>
                                        <option value="info">🔵 Info</option>
                                        <option value="debug">🟢 Debug</option>
                                        <option value="trace">🔍 Trace</option>
                                    </select>
                                    <span className="setting-description">Set the minimum log level to display</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Hot Reload</label>
                                        <span className="setting-badge">Development</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.developer.enableHotReload}
                                            onChange={(e) => handleNestedSettingChange('developer', 'enableHotReload', e.target.checked)}
                                            aria-label="Hot reload toggle"
                                            title="Enable hot reload for development"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Automatically reload on code changes</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Custom Plugin Path</label>
                                        <span className="setting-badge">Plugins</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={settings.developer.customPluginPath}
                                        onChange={(e) => handleNestedSettingChange('developer', 'customPluginPath', e.target.value)}
                                        placeholder="Enter custom plugin directory path..."
                                        className="setting-input"
                                    />
                                    <span className="setting-description">Path to custom plugin directory</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Integrations Settings */}
                    {activeTab === 'integrations' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <h3>🔗 External Integrations</h3>
                                <p className="section-description">Configure third-party service integrations</p>
                            </div>

                            <div className="settings-grid">
                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Git Integration</label>
                                        <span className="setting-badge">VCS</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.integrations.enableGitIntegration}
                                            onChange={(e) => handleNestedSettingChange('integrations', 'enableGitIntegration', e.target.checked)}
                                            aria-label="Git integration toggle"
                                            title="Enable Git repository integration"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Enable Git repository integration</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Jira Integration</label>
                                        <span className="setting-badge">Project</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.integrations.enableJiraIntegration}
                                            onChange={(e) => handleNestedSettingChange('integrations', 'enableJiraIntegration', e.target.checked)}
                                            aria-label="Jira integration toggle"
                                            title="Connect with Jira for issue tracking"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Connect with Jira for issue tracking</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Slack Integration</label>
                                        <span className="setting-badge">Communication</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.integrations.enableSlackIntegration}
                                            onChange={(e) => handleNestedSettingChange('integrations', 'enableSlackIntegration', e.target.checked)}
                                            aria-label="Slack integration toggle"
                                            title="Send notifications to Slack"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Send notifications to Slack</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">Teams Integration</label>
                                        <span className="setting-badge">Communication</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.integrations.enableTeamsIntegration}
                                            onChange={(e) => handleNestedSettingChange('integrations', 'enableTeamsIntegration', e.target.checked)}
                                            aria-label="Teams integration toggle"
                                            title="Send notifications to Microsoft Teams"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Send notifications to Microsoft Teams</span>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">CI/CD Integration</label>
                                        <span className="setting-badge">DevOps</span>
                                    </div>
                                    <label className="setting-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.integrations.enableCICD}
                                            onChange={(e) => handleNestedSettingChange('integrations', 'enableCICD', e.target.checked)}
                                            aria-label="CI/CD integration toggle"
                                            title="Integrate with CI/CD pipelines"
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="setting-description">Integrate with CI/CD pipelines</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Shortcuts Settings */}
                    {activeTab === 'shortcuts' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <h3>⌨️ Keyboard Shortcuts</h3>
                                <p className="section-description">Customize keyboard shortcuts for quick access</p>
                            </div>

                            <div className="shortcuts-grid">
                                {Object.entries(settings.shortcuts).map(([command, shortcut]) => (
                                    <div key={command} className="shortcut-card">
                                        <div className="shortcut-info">
                                            <span className="command-name">
                                                {command.replace('kalai-agent.', '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                            </span>
                                            <span className="command-id">{command}</span>
                                        </div>
                                        <div className="shortcut-input">
                                            <input
                                                type="text"
                                                value={shortcut}
                                                onChange={(e) => {
                                                    const newShortcuts = { ...settings.shortcuts, [command]: e.target.value };
                                                    handleSettingChange('shortcuts', newShortcuts);
                                                }}
                                                placeholder="Enter shortcut..."
                                                className="shortcut-field"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Advanced Settings */}
                    {activeTab === 'advanced' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <h3>🔧 Advanced Configuration</h3>
                                <p className="section-description">Advanced settings and system information</p>
                            </div>

                            <div className="advanced-actions">
                                <div className="action-group">
                                    <h4>Settings Management</h4>
                                    <div className="action-buttons">
                                        <button className="action-btn primary" onClick={handleExport}>
                                            📤 Export Settings
                                        </button>
                                        <label className="action-btn secondary">
                                            📥 Import Settings
                                            <input
                                                type="file"
                                                accept=".json"
                                                onChange={handleImport}
                                                className="hidden-file-input"
                                                aria-label="Import settings file"
                                                title="Select a JSON file to import settings"
                                            />
                                        </label>
                                        <button className="action-btn danger" onClick={handleReset}>
                                            🔄 Reset to Defaults
                                        </button>
                                    </div>
                                </div>

                                <div className="system-info">
                                    <h4>System Information</h4>
                                    <div className="info-grid">
                                        <div className="info-card">
                                            <span className="info-label">Extension Version:</span>
                                            <span className="info-value">2.0.0</span>
                                        </div>
                                        <div className="info-card">
                                            <span className="info-label">Build Type:</span>
                                            <span className="info-value">Production</span>
                                        </div>
                                        <div className="info-card">
                                            <span className="info-label">Current Model:</span>
                                            <span className="info-value">{selectedModel?.name || 'Unknown'}</span>
                                        </div>
                                        <div className="info-card">
                                            <span className="info-label">Cache Status:</span>
                                            <span className="info-value">
                                                {settings.performance.enableCaching ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                        <div className="info-card">
                                            <span className="info-label">Security Level:</span>
                                            <span className="info-value">
                                                {settings.security.enableDataEncryption ? 'High' : 'Standard'}
                                            </span>
                                        </div>
                                        <div className="info-card">
                                            <span className="info-label">Workspace:</span>
                                            <span className="info-value">{currentWorkspace || 'Global'}</span>
                                        </div>
                                    </div>
                                </div>

                                {validationErrors.import && (
                                    <div className="error-banner">
                                        <span className="error-icon">⚠️</span>
                                        <span className="error-text">{validationErrors.import}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="settings-footer">
                    <div className="footer-info">
                        <span className="footer-text">
                            Kalai Agent v2.0.0 - Advanced AI-Powered Development Assistant
                        </span>
                        {isDirty && (
                            <span className="unsaved-indicator">
                                ● Unsaved changes
                            </span>
                        )}
                    </div>
                    <div className="footer-actions">
                        {Object.keys(validationErrors).length > 0 && (
                            <span className="validation-summary">
                                ⚠️ {Object.keys(validationErrors).length} validation error(s)
                            </span>
                        )}
                        <button className="footer-btn secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="footer-btn primary"
                            onClick={handleSave}
                            disabled={Object.keys(validationErrors).length > 0}
                        >
                            {isDirty ? 'Save Changes' : 'Close'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};