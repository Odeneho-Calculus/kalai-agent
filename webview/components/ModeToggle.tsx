import React from 'react';
import { ChatMode } from './ChatInterface';
import './ModeToggle.css';

interface ModeToggleProps {
    modes: ChatMode[];
    currentMode: ChatMode;
    onModeChange: (mode: ChatMode) => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({
    modes,
    currentMode,
    onModeChange
}) => {
    return (
        <div className="mode-toggle">
            <div className="mode-toggle-container">
                {modes.map((mode) => (
                    <button
                        key={mode.type}
                        className={`mode-button ${currentMode.type === mode.type ? 'active' : ''}`}
                        onClick={() => onModeChange(mode)}
                        title={mode.description}
                    >
                        <span className="mode-icon">{mode.icon}</span>
                        <span className="mode-label">{mode.label}</span>
                        {currentMode.type === mode.type && (
                            <span className="active-indicator">●</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="mode-description">
                <span className="description-text">
                    {currentMode.description}
                </span>
            </div>
        </div>
    );
};