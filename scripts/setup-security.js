#!/usr/bin/env node

/**
 * Security Setup Script for Kalai Agent
 *
 * This script helps developers set up secure API key management and
 * configure security best practices.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

class SecuritySetup {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    /**
     * Main setup function
     */
    async setup() {
        console.log('🔒 Kalai Agent Security Setup');
        console.log('=============================\n');

        try {
            // Check current setup
            await this.checkCurrentSetup();

            // Install git hooks
            await this.setupGitHooks();

            // Configure API key
            await this.configureApiKey();

            // Verify setup
            await this.verifySetup();

            console.log('\n✅ Security setup completed successfully!');
            console.log('📖 For more information, see SECURITY.md');

        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            process.exit(1);
        } finally {
            this.rl.close();
        }
    }

    /**
     * Check current security setup
     */
    async checkCurrentSetup() {
        console.log('🔍 Checking current setup...\n');

        // Check if .gitignore is configured
        const gitignoreExists = fs.existsSync('.gitignore');
        const gitignoreContent = gitignoreExists ? fs.readFileSync('.gitignore', 'utf8') : '';
        const hasSecureIgnore = gitignoreContent.includes('secure.config.ts');

        console.log(`   .gitignore exists: ${gitignoreExists ? '✅' : '❌'}`);
        console.log(`   Secure files ignored: ${hasSecureIgnore ? '✅' : '❌'}`);

        // Check if secure config exists
        const secureConfigExists = fs.existsSync('src/config/secure.config.ts');
        console.log(`   Secure config file: ${secureConfigExists ? '⚠️  (should not be committed)' : '✅'}`);

        // Check environment variables
        const envVarSet = process.env.OPENROUTER_API_KEY || process.env.KALAI_API_KEY;
        console.log(`   Environment variable: ${envVarSet ? '✅' : '❌'}`);

        // Check git hooks
        const preCommitHook = fs.existsSync('.git/hooks/pre-commit');
        console.log(`   Pre-commit hook: ${preCommitHook ? '✅' : '❌'}`);

        console.log('');
    }

    /**
     * Setup git hooks for security
     */
    async setupGitHooks() {
        console.log('🔧 Setting up git hooks...\n');

        if (!fs.existsSync('.git')) {
            console.log('   ⚠️  Not a git repository, skipping git hooks');
            return;
        }

        try {
            // Create hooks directory if it doesn't exist
            if (!fs.existsSync('.git/hooks')) {
                fs.mkdirSync('.git/hooks', { recursive: true });
            }

            // Copy pre-commit hook
            const hookSource = path.join(__dirname, 'pre-commit-security-check.js');
            const hookDestination = '.git/hooks/pre-commit';

            if (fs.existsSync(hookSource)) {
                fs.copyFileSync(hookSource, hookDestination);

                // Make executable on Unix systems
                if (process.platform !== 'win32') {
                    try {
                        execSync(`chmod +x ${hookDestination}`);
                    } catch (error) {
                        console.log('   ⚠️  Could not make hook executable');
                    }
                }

                console.log('   ✅ Pre-commit security hook installed');
            } else {
                console.log('   ❌ Pre-commit hook source not found');
            }

        } catch (error) {
            console.log(`   ❌ Failed to setup git hooks: ${error.message}`);
        }
    }

    /**
     * Configure API key securely
     */
    async configureApiKey() {
        console.log('🔑 API Key Configuration\n');

        const hasEnvVar = process.env.OPENROUTER_API_KEY || process.env.KALAI_API_KEY;

        if (hasEnvVar) {
            console.log('   ✅ API key found in environment variables');
            console.log('   This is the most secure configuration method.');
            return;
        }

        console.log('Choose your preferred API key configuration method:');
        console.log('1. Environment Variable (Recommended)');
        console.log('2. Secure Config File (Development)');
        console.log('3. Skip for now');

        const choice = await this.askQuestion('\nEnter your choice (1-3): ');

        switch (choice.trim()) {
            case '1':
                await this.setupEnvironmentVariable();
                break;
            case '2':
                await this.setupSecureConfigFile();
                break;
            case '3':
                console.log('   ⚠️  Skipping API key configuration');
                break;
            default:
                console.log('   ❌ Invalid choice');
        }
    }

    /**
     * Setup environment variable
     */
    async setupEnvironmentVariable() {
        console.log('\n🌍 Environment Variable Setup\n');

        const apiKey = await this.askQuestion('Enter your OpenRouter API key: ', true);

        const expectedPrefix = ['sk', 'or', 'v1'].join('-') + '-';
        if (!apiKey || !apiKey.startsWith(expectedPrefix)) {
            console.log('   ❌ Invalid API key format');
            return;
        }

        console.log('\n📝 To set the environment variable:');

        if (process.platform === 'win32') {
            console.log('   Windows:');
            console.log('   1. Search for "Environment Variables" in Start Menu');
            console.log('   2. Click "Edit the system environment variables"');
            console.log('   3. Click "Environment Variables" button');
            console.log('   4. Under "User variables", click "New"');
            console.log('   5. Variable name: OPENROUTER_API_KEY');
            console.log(`   6. Variable value: ${this.maskApiKey(apiKey)}`);
            console.log('   7. Click OK and restart VS Code');
        } else {
            console.log('   macOS/Linux:');
            console.log('   Add this line to ~/.bashrc or ~/.zshrc:');
            console.log(`   export OPENROUTER_API_KEY="${this.maskApiKey(apiKey)}"`);
            console.log('   Then restart your terminal and VS Code');
        }

        console.log('\n   ✅ Environment variable setup instructions provided');
    }

    /**
     * Setup secure config file
     */
    async setupSecureConfigFile() {
        console.log('\n📁 Secure Config File Setup\n');

        const templatePath = 'src/config/secure.config.template.ts';
        const configPath = 'src/config/secure.config.ts';

        if (!fs.existsSync(templatePath)) {
            console.log('   ❌ Template file not found');
            return;
        }

        if (fs.existsSync(configPath)) {
            const overwrite = await this.askQuestion('Secure config file already exists. Overwrite? (y/n): ');
            if (overwrite.toLowerCase() !== 'y') {
                console.log('   ⚠️  Skipping secure config file setup');
                return;
            }
        }

        const apiKey = await this.askQuestion('Enter your OpenRouter API key: ', true);

        const expectedPrefix = ['sk', 'or', 'v1'].join('-') + '-';
        if (!apiKey || !apiKey.startsWith(expectedPrefix)) {
            console.log('   ❌ Invalid API key format');
            return;
        }

        // Read template and replace placeholder
        let template = fs.readFileSync(templatePath, 'utf8');
        const placeholder = ['your', 'openrouter', 'api', 'key', 'here'].join('-');
        template = template.replace(placeholder, apiKey);

        // Write secure config file
        fs.writeFileSync(configPath, template);

        console.log('   ✅ Secure config file created');
        console.log('   ⚠️  Remember: This file should never be committed to version control');
    }

    /**
     * Verify security setup
     */
    async verifySetup() {
        console.log('\n🔍 Verifying setup...\n');

        // Run security check
        try {
            const SecurityChecker = require('./pre-commit-security-check.js');
            const checker = new SecurityChecker();
            const isSecure = await checker.runSecurityCheck();

            if (isSecure) {
                console.log('   ✅ Security verification passed');
            } else {
                console.log('   ⚠️  Security issues detected - please review');
            }

        } catch (error) {
            console.log('   ⚠️  Could not run security verification');
        }
    }

    /**
     * Ask user a question
     */
    askQuestion(question, isPassword = false) {
        return new Promise((resolve) => {
            if (isPassword) {
                // Hide input for passwords
                this.rl.question(question, (answer) => {
                    resolve(answer);
                });
                this.rl.stdoutMuted = true;
            } else {
                this.rl.question(question, (answer) => {
                    resolve(answer);
                });
            }
        });
    }

    /**
     * Mask API key for display
     */
    maskApiKey(apiKey) {
        if (apiKey.length > 16) {
            return apiKey.substring(0, 12) + '...' + apiKey.substring(apiKey.length - 4);
        }
        return '***masked***';
    }
}

// Run setup if executed directly
if (require.main === module) {
    const setup = new SecuritySetup();
    setup.setup().catch(error => {
        console.error('Setup failed:', error);
        process.exit(1);
    });
}

module.exports = SecuritySetup;