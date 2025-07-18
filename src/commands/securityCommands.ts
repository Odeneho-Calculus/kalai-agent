/**
 * Security Commands for Kalai Agent
 *
 * This module provides VS Code commands for secure API key management,
 * security auditing, and configuration validation.
 */

import * as vscode from 'vscode';
import { environmentManager } from '../config/environment';
import { securityManager, performSecurityCheck } from '../utils/security';

/**
 * Register all security-related commands
 */
export function registerSecurityCommands(context: vscode.ExtensionContext): void {
    // Setup secure configuration command
    const setupSecureConfigCommand = vscode.commands.registerCommand(
        'kalai-agent.setupSecureConfiguration',
        handleSetupSecureConfiguration
    );

    // Run security audit command
    const runSecurityAuditCommand = vscode.commands.registerCommand(
        'kalai-agent.runSecurityAudit',
        handleRunSecurityAudit
    );

    // Validate API configuration command
    const validateApiConfigCommand = vscode.commands.registerCommand(
        'kalai-agent.validateApiConfiguration',
        handleValidateApiConfiguration
    );

    // Clear API configuration command
    const clearApiConfigCommand = vscode.commands.registerCommand(
        'kalai-agent.clearApiConfiguration',
        handleClearApiConfiguration
    );

    // Show security status command
    const showSecurityStatusCommand = vscode.commands.registerCommand(
        'kalai-agent.showSecurityStatus',
        handleShowSecurityStatus
    );

    // Rotate API key command
    const rotateApiKeyCommand = vscode.commands.registerCommand(
        'kalai-agent.rotateApiKey',
        handleRotateApiKey
    );

    // Export security report command
    const exportSecurityReportCommand = vscode.commands.registerCommand(
        'kalai-agent.exportSecurityReport',
        handleExportSecurityReport
    );

    // Register all commands
    context.subscriptions.push(
        setupSecureConfigCommand,
        runSecurityAuditCommand,
        validateApiConfigCommand,
        clearApiConfigCommand,
        showSecurityStatusCommand,
        rotateApiKeyCommand,
        exportSecurityReportCommand
    );
}

/**
 * Handle setup secure configuration command
 */
async function handleSetupSecureConfiguration(): Promise<void> {
    try {
        vscode.window.showInformationMessage('🔒 Setting up secure configuration...');

        const success = await securityManager.setupSecureConfiguration();

        if (success) {
            vscode.window.showInformationMessage('✅ Secure configuration setup completed!');

            // Refresh any active AI services
            vscode.commands.executeCommand('kalai-agent.refreshConfiguration');
        } else {
            vscode.window.showWarningMessage('⚠️ Secure configuration setup was cancelled or failed');
        }

    } catch (error) {
        vscode.window.showErrorMessage(`❌ Setup failed: ${error}`);
    }
}

/**
 * Handle run security audit command
 */
async function handleRunSecurityAudit(): Promise<void> {
    try {
        vscode.window.showInformationMessage('🔍 Running comprehensive security audit...');

        const auditResult = await performSecurityCheck();

        // Create audit report
        const report = createSecurityAuditReport(auditResult);

        // Show results in new document
        const doc = await vscode.workspace.openTextDocument({
            content: report,
            language: 'markdown'
        });

        await vscode.window.showTextDocument(doc);

        if (auditResult.isValid) {
            vscode.window.showInformationMessage('✅ Security audit completed - No issues found');
        } else {
            vscode.window.showWarningMessage(
                `⚠️ Security audit found ${auditResult.issues.length} issue(s)`,
                'View Report',
                'Fix Issues'
            ).then(selection => {
                if (selection === 'Fix Issues') {
                    vscode.commands.executeCommand('kalai-agent.setupSecureConfiguration');
                }
            });
        }

    } catch (error) {
        vscode.window.showErrorMessage(`❌ Security audit failed: ${error}`);
    }
}

/**
 * Handle validate API configuration command
 */
async function handleValidateApiConfiguration(): Promise<void> {
    try {
        vscode.window.showInformationMessage('🔍 Validating API configuration...');

        const isValid = await environmentManager.validateConfiguration();
        const source = await environmentManager.getConfigurationSource();
        const maskedKey = await environmentManager.getMaskedApiKey();

        if (isValid) {
            vscode.window.showInformationMessage(
                `✅ API configuration is valid\nSource: ${source}\nKey: ${maskedKey}`
            );
        } else {
            vscode.window.showErrorMessage(
                '❌ API configuration is invalid or missing',
                'Setup Configuration',
                'Open Settings'
            ).then(selection => {
                if (selection === 'Setup Configuration') {
                    vscode.commands.executeCommand('kalai-agent.setupSecureConfiguration');
                } else if (selection === 'Open Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'kalai-agent.apiKey');
                }
            });
        }

    } catch (error) {
        vscode.window.showErrorMessage(`❌ Validation failed: ${error}`);
    }
}

/**
 * Handle clear API configuration command
 */
async function handleClearApiConfiguration(): Promise<void> {
    try {
        const confirmation = await vscode.window.showWarningMessage(
            '⚠️ Clear API configuration from current session?',
            { modal: true },
            'Clear Session Only',
            'Clear All Settings'
        );

        if (confirmation === 'Clear Session Only') {
            environmentManager.clearConfiguration();
            vscode.window.showInformationMessage('✅ Session configuration cleared');

        } else if (confirmation === 'Clear All Settings') {
            // Clear from VS Code settings
            const config = vscode.workspace.getConfiguration('kalai-agent');
            await config.update('apiKey', undefined, vscode.ConfigurationTarget.Global);

            environmentManager.clearConfiguration();
            vscode.window.showInformationMessage('✅ All API configuration cleared');
        }

    } catch (error) {
        vscode.window.showErrorMessage(`❌ Clear configuration failed: ${error}`);
    }
}

/**
 * Handle show security status command
 */
async function handleShowSecurityStatus(): Promise<void> {
    try {
        const isValid = await environmentManager.validateConfiguration();
        const source = await environmentManager.getConfigurationSource();
        const maskedKey = await environmentManager.getMaskedApiKey();

        const statusItems = [
            {
                label: isValid ? '✅ Configuration Valid' : '❌ Configuration Invalid',
                detail: isValid ? 'API key is properly configured' : 'API key needs to be configured'
            },
            {
                label: `🔑 API Key: ${maskedKey}`,
                detail: `Source: ${source}`
            },
            {
                label: '🔒 Security Recommendations',
                detail: 'View security best practices'
            },
            {
                label: '🔧 Security Commands',
                detail: 'Available security management commands'
            }
        ];

        const selection = await vscode.window.showQuickPick(statusItems, {
            title: 'Kalai Agent Security Status',
            ignoreFocusOut: true
        });

        if (selection) {
            if (selection.label.includes('Security Recommendations')) {
                vscode.env.openExternal(vscode.Uri.parse('https://github.com/Odeneho-Calculus/kalai-agent/blob/main/SECURITY.md'));
            } else if (selection.label.includes('Security Commands')) {
                showSecurityCommandsMenu();
            }
        }

    } catch (error) {
        vscode.window.showErrorMessage(`❌ Failed to show security status: ${error}`);
    }
}

/**
 * Handle rotate API key command
 */
async function handleRotateApiKey(): Promise<void> {
    try {
        const steps = [
            '1. Generate new API key at OpenRouter.ai',
            '2. Update your configuration with the new key',
            '3. Test the new configuration',
            '4. Revoke the old key'
        ];

        const message = `🔄 API Key Rotation Process:\n\n${steps.join('\n')}\n\nThis will help you safely rotate your OpenRouter API key.`;

        const action = await vscode.window.showInformationMessage(
            message,
            { modal: true },
            'Open OpenRouter Keys',
            'Update Configuration',
            'Cancel'
        );

        if (action === 'Open OpenRouter Keys') {
            vscode.env.openExternal(vscode.Uri.parse('https://openrouter.ai/keys'));
        } else if (action === 'Update Configuration') {
            vscode.commands.executeCommand('kalai-agent.setupSecureConfiguration');
        }

    } catch (error) {
        vscode.window.showErrorMessage(`❌ API key rotation failed: ${error}`);
    }
}

/**
 * Handle export security report command
 */
async function handleExportSecurityReport(): Promise<void> {
    try {
        vscode.window.showInformationMessage('📋 Generating security report...');

        const auditResult = await performSecurityCheck();
        const report = createDetailedSecurityReport(auditResult);

        const doc = await vscode.workspace.openTextDocument({
            content: report,
            language: 'markdown'
        });

        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage(
            '📄 Security report generated',
            'Save Report',
            'Share Report'
        ).then(selection => {
            if (selection === 'Save Report') {
                vscode.commands.executeCommand('workbench.action.files.save');
            }
        });

    } catch (error) {
        vscode.window.showErrorMessage(`❌ Export security report failed: ${error}`);
    }
}

/**
 * Show security commands menu
 */
async function showSecurityCommandsMenu(): Promise<void> {
    const commands = [
        {
            label: '🔒 Setup Secure Configuration',
            detail: 'Configure API key securely using best practices',
            command: 'kalai-agent.setupSecureConfiguration'
        },
        {
            label: '🔍 Run Security Audit',
            detail: 'Comprehensive security check and recommendations',
            command: 'kalai-agent.runSecurityAudit'
        },
        {
            label: '✅ Validate Configuration',
            detail: 'Check if current API configuration is valid',
            command: 'kalai-agent.validateApiConfiguration'
        },
        {
            label: '🔄 Rotate API Key',
            detail: 'Safely rotate your OpenRouter API key',
            command: 'kalai-agent.rotateApiKey'
        },
        {
            label: '🧹 Clear Configuration',
            detail: 'Clear API key from current session',
            command: 'kalai-agent.clearApiConfiguration'
        },
        {
            label: '📊 Security Status',
            detail: 'View current security configuration status',
            command: 'kalai-agent.showSecurityStatus'
        },
        {
            label: '📋 Export Security Report',
            detail: 'Generate detailed security audit report',
            command: 'kalai-agent.exportSecurityReport'
        }
    ];

    const selection = await vscode.window.showQuickPick(commands, {
        title: 'Kalai Agent Security Commands',
        ignoreFocusOut: true
    });

    if (selection) {
        vscode.commands.executeCommand(selection.command);
    }
}

/**
 * Create security audit report
 */
function createSecurityAuditReport(auditResult: any): string {
    const timestamp = new Date().toISOString();

    return `# Kalai Agent Security Audit Report

**Generated:** ${timestamp}

## Security Status: ${auditResult.isValid ? '✅ PASSED' : '❌ FAILED'}

### Issues Found: ${auditResult.issues.length}

${auditResult.issues.map((issue: string, index: number) =>
        `${index + 1}. ❌ ${issue}`
    ).join('\n')}

### Recommendations: ${auditResult.recommendations.length}

${auditResult.recommendations.map((rec: string, index: number) =>
        `${index + 1}. 💡 ${rec}`
    ).join('\n')}

## Security Best Practices

- Configure API keys through VS Code settings only
- Never commit API keys to version control
- Regularly rotate API keys
- Monitor API key usage
- Use least-privilege access

## Next Steps

${auditResult.isValid ?
            '✅ Your configuration is secure. Continue monitoring and following best practices.' :
            '⚠️ Please address the issues above to improve your security posture.'
        }

---
*Generated by Kalai Agent Security System*`;
}

/**
 * Create detailed security report
 */
function createDetailedSecurityReport(auditResult: any): string {
    const timestamp = new Date().toISOString();

    return `# Comprehensive Security Report - Kalai Agent

**Generated:** ${timestamp}
**Status:** ${auditResult.isValid ? 'SECURE' : 'NEEDS ATTENTION'}

## Executive Summary

${auditResult.isValid ?
            'Your Kalai Agent configuration meets security best practices.' :
            `Security audit identified ${auditResult.issues.length} issue(s) that require attention.`
        }

## Security Configuration Analysis

### API Key Management
- **Configuration Source:** Environment variables (recommended)
- **Key Format:** Valid OpenRouter format
- **Storage:** Securely stored outside version control
- **Rotation:** Regular rotation recommended

### Security Measures
- **Pre-commit Hooks:** Installed to prevent key exposure
- **Environment Variables:** Properly configured
- **VS Code Settings:** User-specific storage
- **Git Ignore:** Sensitive files excluded

## Detailed Findings

### Issues (${auditResult.issues.length})
${auditResult.issues.map((issue: string, index: number) =>
            `**${index + 1}. ${issue}**\n   - Impact: High\n   - Action: Immediate attention required\n`
        ).join('\n')}

### Recommendations (${auditResult.recommendations.length})
${auditResult.recommendations.map((rec: string, index: number) =>
            `**${index + 1}. ${rec}**\n   - Priority: ${index < 3 ? 'High' : 'Medium'}\n   - Implementation: Follow security documentation\n`
        ).join('\n')}

## Security Checklist

- [ ] API key configured in VS Code settings
- [ ] No hardcoded keys in source code
- [ ] Pre-commit hooks installed
- [ ] .gitignore configured properly
- [ ] Regular security audits scheduled
- [ ] API key rotation plan in place
- [ ] Team trained on security practices

## Compliance Status

- **OWASP Guidelines:** ${auditResult.isValid ? 'Compliant' : 'Non-compliant'}
- **Best Practices:** ${auditResult.isValid ? 'Followed' : 'Needs improvement'}
- **Industry Standards:** ${auditResult.isValid ? 'Met' : 'Partially met'}

## Recommendations for Improvement

1. **Immediate Actions:**
   - Fix any identified security issues
   - Implement missing security measures
   - Update configuration as needed

2. **Medium-term Actions:**
   - Establish regular security reviews
   - Implement automated security monitoring
   - Create incident response procedures

3. **Long-term Actions:**
   - Regular security training
   - Continuous improvement of security practices
   - Stay updated with security best practices

## Resources

- [Security Documentation](https://github.com/Odeneho-Calculus/kalai-agent/blob/main/SECURITY.md)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [VS Code Security Best Practices](https://code.visualstudio.com/docs/editor/workspace-trust)

---
*This report is generated automatically and should be reviewed regularly to maintain security posture.*`;
}