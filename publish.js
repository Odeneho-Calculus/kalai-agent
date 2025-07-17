#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Professional publishing script for Kalai Agent extension
 * Handles complete build, validation, and publishing process
 */

const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

class KalaiPublisher {
    constructor() {
        this.packageJson = require('./package.json');
        this.currentVersion = this.packageJson.version;
        this.publisherID = this.packageJson.publisher;
        this.extensionName = this.packageJson.name;
    }

    log(message, color = COLORS.reset) {
        console.log(`${color}${message}${COLORS.reset}`);
    }

    error(message) {
        this.log(`❌ ERROR: ${message}`, COLORS.red);
    }

    success(message) {
        this.log(`✅ SUCCESS: ${message}`, COLORS.green);
    }

    info(message) {
        this.log(`ℹ️  INFO: ${message}`, COLORS.blue);
    }

    warning(message) {
        this.log(`⚠️  WARNING: ${message}`, COLORS.yellow);
    }

    async executeCommand(command, description) {
        this.info(`${description}...`);

        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    this.error(`${description} failed: ${error.message}`);
                    reject(error);
                    return;
                }

                if (stderr) {
                    this.warning(`${description} stderr: ${stderr}`);
                }

                this.success(`${description} completed successfully`);
                resolve(stdout);
            });
        });
    }

    async validateEnvironment() {
        this.log('\n=== 🔍 ENVIRONMENT VALIDATION ===', COLORS.cyan);

        try {
            // Check if vsce is installed
            await this.executeCommand('vsce --version', 'Checking vsce installation');

            // Check if required files exist
            const requiredFiles = [
                'package.json',
                'README.md',
                'LICENSE',
                'CHANGELOG.md',
                'media/icon.png'
            ];

            for (const file of requiredFiles) {
                if (!fs.existsSync(file)) {
                    throw new Error(`Required file missing: ${file}`);
                }
            }

            this.success('All required files are present');

            // Validate package.json required fields
            const requiredFields = ['name', 'version', 'publisher', 'description', 'engines'];
            for (const field of requiredFields) {
                if (!this.packageJson[field]) {
                    throw new Error(`Required package.json field missing: ${field}`);
                }
            }

            this.success('Package.json validation passed');

        } catch (error) {
            this.error(`Environment validation failed: ${error.message}`);
            process.exit(1);
        }
    }

    async buildExtension() {
        this.log('\n=== 🏗️  BUILDING EXTENSION ===', COLORS.cyan);

        try {
            // Clean any previous builds
            if (fs.existsSync('dist')) {
                await this.executeCommand('rm -rf dist', 'Cleaning previous build');
            }

            // Compile the extension
            await this.executeCommand('npm run compile', 'Building extension');

            // Verify build output
            if (!fs.existsSync('dist/extension.js')) {
                throw new Error('Build failed - extension.js not found in dist/');
            }

            this.success('Extension build completed successfully');

        } catch (error) {
            this.error(`Build failed: ${error.message}`);
            process.exit(1);
        }
    }

    async packageExtension() {
        this.log('\n=== 📦 PACKAGING EXTENSION ===', COLORS.cyan);

        try {
            // Remove any existing package
            const vsixFile = `${this.extensionName}-${this.currentVersion}.vsix`;
            if (fs.existsSync(vsixFile)) {
                fs.unlinkSync(vsixFile);
                this.info(`Removed existing package: ${vsixFile}`);
            }

            // Package the extension
            await this.executeCommand('vsce package', 'Packaging extension');

            // Verify package was created
            if (!fs.existsSync(vsixFile)) {
                throw new Error(`Package file not created: ${vsixFile}`);
            }

            // Get package size
            const stats = fs.statSync(vsixFile);
            const size = (stats.size / 1024 / 1024).toFixed(2);

            this.success(`Package created successfully: ${vsixFile} (${size}MB)`);

        } catch (error) {
            this.error(`Packaging failed: ${error.message}`);
            process.exit(1);
        }
    }

    async publishExtension() {
        this.log('\n=== 🚀 PUBLISHING EXTENSION ===', COLORS.cyan);

        try {
            // Check if already logged in
            this.info('Checking authentication status...');

            // Publish the extension
            await this.executeCommand('vsce publish', 'Publishing to VS Code Marketplace');

            this.success('Extension published successfully to VS Code Marketplace');

        } catch (error) {
            this.error(`Publishing failed: ${error.message}`);

            if (error.message.includes('authentication')) {
                this.info('Please run: vsce login your-publisher-id');
                this.info('You will need a Personal Access Token from Azure DevOps');
            }

            process.exit(1);
        }
    }

    async publishToOpenVSX() {
        this.log('\n=== 🌐 PUBLISHING TO OPEN VSX ===', COLORS.cyan);

        try {
            // Check if ovsx is installed
            await this.executeCommand('ovsx --version', 'Checking ovsx installation');

            // Publish to Open VSX
            const vsixFile = `${this.extensionName}-${this.currentVersion}.vsix`;
            await this.executeCommand(`ovsx publish ${vsixFile}`, 'Publishing to Open VSX Registry');

            this.success('Extension published successfully to Open VSX Registry');

        } catch (error) {
            this.warning(`Open VSX publishing failed: ${error.message}`);
            this.info('To publish to Open VSX, install ovsx: npm install -g ovsx');
            this.info('Then get a token from https://open-vsx.org/user-settings/tokens');
        }
    }

    async generatePublishingSummary() {
        this.log('\n=== 📊 PUBLISHING SUMMARY ===', COLORS.cyan);

        const vsixFile = `${this.extensionName}-${this.currentVersion}.vsix`;
        const stats = fs.existsSync(vsixFile) ? fs.statSync(vsixFile) : null;

        this.log(`
📦 Package Information:
   Name: ${this.packageJson.displayName}
   Version: ${this.currentVersion}
   Publisher: ${this.publisherID}
   Package File: ${vsixFile}
   Package Size: ${stats ? (stats.size / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}

🔗 Marketplace Links:
   VS Code Marketplace: https://marketplace.visualstudio.com/items?itemName=${this.publisherID}.${this.extensionName}
   Open VSX Registry: https://open-vsx.org/extension/${this.publisherID}/${this.extensionName}

📈 Next Steps:
   1. Verify the extension appears in the marketplace
   2. Test installation from marketplace
   3. Monitor download statistics
   4. Respond to user feedback
        `, COLORS.green);
    }

    async run() {
        this.log('🎉 KALAI AGENT PUBLISHING SYSTEM 🎉', COLORS.magenta);
        this.log('=====================================', COLORS.magenta);

        try {
            await this.validateEnvironment();
            await this.buildExtension();
            await this.packageExtension();
            await this.publishExtension();
            await this.publishToOpenVSX();
            await this.generatePublishingSummary();

            this.log('\n🎊 PUBLISHING PROCESS COMPLETED SUCCESSFULLY! 🎊', COLORS.green);

        } catch (error) {
            this.error(`Publishing process failed: ${error.message}`);
            process.exit(1);
        }
    }
}

// Run the publisher
if (require.main === module) {
    const publisher = new KalaiPublisher();
    publisher.run();
}

module.exports = KalaiPublisher;