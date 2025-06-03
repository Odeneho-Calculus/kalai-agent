import React, { useState, useEffect } from 'react';
import './ModernSettingsPanel.css';

interface SettingsData {
    theme: 'auto' | 'light' | 'dark';
    fontSize: number;
    autoSave: boolean;
    showLineNumbers: boolean;
    enableSuggestions: boolean;
    maxTokens: number;
    temperature: number;
    model: string;
}

interface ModernSettingsPanelProps {
    isVisible: boolean;
    onClose: () => void;
    onSettingsChange: (settings: Partial<SettingsData>) => void;
}

export const ModernSettingsPanel: React.FC<ModernSettingsPanelProps> = ({
    isVisible,
    onClose,
    onSettingsChange
}) => {
    const [settings, setSettings] = useState<SettingsData>({
        theme: 'auto',
        fontSize: 14,
        autoSave: true,
        showLineNumbers: true,
        enableSuggestions: true,
        maxTokens: 4000,
        temperature: 0.7,
        model: 'gpt-4'
    });

    const [activeTab, setActiveTab] = useState<'general' | 'editor' | 'ai' | 'advanced'>('general');

    useEffect(() => {
        if (isVisible) {
            // Load settings from extension
            window.vscode?.postMessage({
                type: 'getSettings',
                data: {}
            });
        }
    }, [isVisible]);

    const handleSettingChange = <K extends keyof SettingsData>(
        key: K,
        value: SettingsData[K]
    ) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        onSettingsChange({ [key]: value });
    };

    const handleReset = () => {
        const defaultSettings: SettingsData = {
            theme: 'auto',
            fontSize: 14,
            autoSave: true,
            showLineNumbers: true,
            enableSuggestions: true,
            maxTokens: 4000,
            temperature: 0.7,
            model: 'gpt-4'
        };
        setSettings(defaultSettings);
        onSettingsChange(defaultSettings);
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'kalai-settings.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedSettings = JSON.parse(e.target?.result as string);
                    setSettings({ ...settings, ...importedSettings });
                    onSettingsChange(importedSettings);
                } catch (error) {
                    console.error('Error importing settings:', error);
                }
            };
            reader.readAsText(file);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="modern-settings-panel">
            <div className="settings-header">
                <div className="header-title">
                    <span className="title-icon">⚙️</span>
                    <span>Settings</span>
                </div>
                <button className="close-btn" onClick={onClose}>
                    ✕
                </button>
            </div>

            <div className="settings-tabs">
                <button
                    className={`tab ${activeTab === 'general' ? 'active' : ''}`}
                    onClick={() => setActiveTab('general')}
                >
                    🏠 General
                </button>
                <button
                    className={`tab ${activeTab === 'editor' ? 'active' : ''}`}
                    onClick={() => setActiveTab('editor')}
                >
                    📝 Editor
                </button>
                <button
                    className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ai')}
                >
                    🤖 AI
                </button>
                <button
                    className={`tab ${activeTab === 'advanced' ? 'active' : ''}`}
                    onClick={() => setActiveTab('advanced')}
                >
                    🔧 Advanced
                </button>
            </div>

            <div className="settings-content">
                {activeTab === 'general' && (
                    <div className="settings-section">
                        <h3>General Settings</h3>

                        <div className="setting-item">
                            <label className="setting-label">Theme</label>
                            <select
                                value={settings.theme}
                                onChange={(e) => handleSettingChange('theme', e.target.value as any)}
                                className="setting-select"
                            >
                                <option value="auto">Auto (Follow VS Code)</option>
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                            <span className="setting-description">Choose the color theme for the interface</span>
                        </div>

                        <div className="setting-item">
                            <label className="setting-label">Auto Save</label>
                            <label className="setting-toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.autoSave}
                                    onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                            <span className="setting-description">Automatically save conversation history</span>
                        </div>

                        <div className="setting-item">
                            <label className="setting-label">Enable Suggestions</label>
                            <label className="setting-toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.enableSuggestions}
                                    onChange={(e) => handleSettingChange('enableSuggestions', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                            <span className="setting-description">Show quick suggestion prompts</span>
                        </div>
                    </div>
                )}

                {activeTab === 'editor' && (
                    <div className="settings-section">
                        <h3>Editor Settings</h3>

                        <div className="setting-item">
                            <label className="setting-label">Font Size</label>
                            <div className="setting-range">
                                <input
                                    type="range"
                                    min="10"
                                    max="24"
                                    value={settings.fontSize}
                                    onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
                                    className="setting-slider"
                                />
                                <span className="range-value">{settings.fontSize}px</span>
                            </div>
                            <span className="setting-description">Adjust the font size for better readability</span>
                        </div>

                        <div className="setting-item">
                            <label className="setting-label">Show Line Numbers</label>
                            <label className="setting-toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.showLineNumbers}
                                    onChange={(e) => handleSettingChange('showLineNumbers', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                            <span className="setting-description">Display line numbers in code blocks</span>
                        </div>
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="settings-section">
                        <h3>AI Settings</h3>

                        <div className="setting-item">
                            <label className="setting-label">Model</label>
                            <select
                                value={settings.model}
                                onChange={(e) => handleSettingChange('model', e.target.value)}
                                className="setting-select"
                            >
                                <option value="gpt-4">GPT-4</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                <option value="claude-3">Claude 3</option>
                                <option value="gemini-pro">Gemini Pro</option>
                            </select>
                            <span className="setting-description">Choose the AI model for responses</span>
                        </div>

                        <div className="setting-item">
                            <label className="setting-label">Max Tokens</label>
                            <div className="setting-range">
                                <input
                                    type="range"
                                    min="1000"
                                    max="8000"
                                    step="500"
                                    value={settings.maxTokens}
                                    onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value))}
                                    className="setting-slider"
                                />
                                <span className="range-value">{settings.maxTokens}</span>
                            </div>
                            <span className="setting-description">Maximum tokens for AI responses</span>
                        </div>

                        <div className="setting-item">
                            <label className="setting-label">Temperature</label>
                            <div className="setting-range">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={settings.temperature}
                                    onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
                                    className="setting-slider"
                                />
                                <span className="range-value">{settings.temperature}</span>
                            </div>
                            <span className="setting-description">Controls randomness in AI responses (0 = focused, 1 = creative)</span>
                        </div>
                    </div>
                )}

                {activeTab === 'advanced' && (
                    <div className="settings-section">
                        <h3>Advanced Settings</h3>

                        <div className="setting-actions">
                            <button className="action-btn primary" onClick={handleExport}>
                                📤 Export Settings
                            </button>

                            <label className="action-btn secondary">
                                📥 Import Settings
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImport}
                                    style={{ display: 'none' }}
                                />
                            </label>

                            <button className="action-btn danger" onClick={handleReset}>
                                🔄 Reset to Defaults
                            </button>
                        </div>

                        <div className="setting-info">
                            <h4>About Kalai Agent</h4>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Version:</span>
                                    <span className="info-value">2.0.0</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Build:</span>
                                    <span className="info-value">Modern UI</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Author:</span>
                                    <span className="info-value">Kalculus</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};