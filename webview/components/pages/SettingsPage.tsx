import React from 'react';
import { VSCodeAPI } from '../types/vscode';

interface SettingsPageProps {
    vscode: VSCodeAPI;
    onClose: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ vscode, onClose }) => {
    const [settings, setSettings] = React.useState({
        modelName: 'qwen/qwen3-30b-a3b:free',
        temperature: 0.7,
        maxTokens: 4000
    });

    const handleSave = () => {
        vscode.postMessage({
            command: 'updateSettings',
            settings
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

                .settings-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    max-width: 600px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-group label {
                    font-weight: 500;
                }

                .form-group input,
                .form-group select {
                    background: var(--lighter-bg);
                    border: 1px solid var(--border-color);
                    padding: 8px;
                    border-radius: 4px;
                    color: var(--text-color);
                }

                .buttons {
                    display: flex;
                    gap: 12px;
                    margin-top: 20px;
                }

                button {
                    padding: 8px 16px;
                    border-radius: 4px;
                    border: none;
                    cursor: pointer;
                }

                .save-button {
                    background: var(--primary-color);
                    color: white;
                }

                .cancel-button {
                    background: var(--lighter-bg);
                    color: var(--text-color);
                }
            `}</style>

            <div className="header">
                <h2>Settings</h2>
            </div>

            <div className="settings-form">
                <div className="form-group">
                    <label>Model</label>
                    <select
                        value={settings.modelName}
                        onChange={(e) => setSettings({ ...settings, modelName: e.target.value })}
                    >
                        <option value="qwen/qwen3-30b-a3b:free">Qwen3 30B (Free)</option>
                        <option value="mistralai/mixtral-8x7b-instruct">Mixtral 8x7B</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Temperature (0.1 - 1.0)</label>
                    <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={settings.temperature}
                        onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                    />
                    <span>{settings.temperature}</span>
                </div>

                <div className="form-group">
                    <label>Max Tokens</label>
                    <input
                        type="number"
                        value={settings.maxTokens}
                        onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                        min="100"
                        max="8000"
                    />
                </div>

                <div className="buttons">
                    <button className="save-button" onClick={handleSave}>
                        Save Changes
                    </button>
                    <button className="cancel-button" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
