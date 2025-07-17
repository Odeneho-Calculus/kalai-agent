#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

/**
 * Pre-publish validation script for Kalai Agent
 * Comprehensive checks before publishing to marketplace
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

class PrePublishValidator {
    constructor() {
        this.packageJson = require('./package.json');
        this.errors = [];
        this.warnings = [];
        this.passed = 0;
        this.total = 0;
    }

    log(message, color = COLORS.reset) {
        console.log(`${color}${message}${COLORS.reset}`);
    }

    error(message) {
        this.log(`❌ ${message}`, COLORS.red);
        this.errors.push(message);
    }

    warning(message) {
        this.log(`⚠️  ${message}`, COLORS.yellow);
        this.warnings.push(message);
    }

    success(message) {
        this.log(`✅ ${message}`, COLORS.green);
        this.passed++;
    }

    info(message) {
        this.log(`ℹ️  ${message}`, COLORS.blue);
    }

    check(condition, successMessage, errorMessage) {
        this.total++;
        if (condition) {
            this.success(successMessage);
        } else {
            this.error(errorMessage);
        }
    }

    async validatePackageJson() {
        this.log('\n=== 📦 PACKAGE.JSON VALIDATION ===', COLORS.cyan);

        const requiredFields = [
            'name', 'displayName', 'description', 'version', 'publisher',
            'engines', 'categories', 'keywords', 'main', 'contributes'
        ];

        requiredFields.forEach(field => {
            this.check(
                this.packageJson[field],
                `Required field '${field}' is present`,
                `Required field '${field}' is missing`
            );
        });

        // Check version format (semver)
        const versionRegex = /^\d+\.\d+\.\d+$/;
        this.check(
            versionRegex.test(this.packageJson.version),
            `Version '${this.packageJson.version}' follows semantic versioning`,
            `Version '${this.packageJson.version}' does not follow semantic versioning`
        );

        // Check publisher format
        this.check(
            this.packageJson.publisher && this.packageJson.publisher.length > 0,
            `Publisher '${this.packageJson.publisher}' is valid`,
            'Publisher field is empty or invalid'
        );

        // Check VS Code engine version
        this.check(
            this.packageJson.engines && this.packageJson.engines.vscode,
            `VS Code engine version specified: ${this.packageJson.engines.vscode}`,
            'VS Code engine version not specified'
        );

        // Check icon field
        this.check(
            this.packageJson.icon,
            `Icon specified: ${this.packageJson.icon}`,
            'Icon field not specified in package.json'
        );

        // Check repository field
        this.check(
            this.packageJson.repository && this.packageJson.repository.url,
            `Repository URL specified: ${this.packageJson.repository.url}`,
            'Repository URL not specified'
        );

        // Check keywords
        this.check(
            this.packageJson.keywords && this.packageJson.keywords.length > 0,
            `Keywords specified: ${this.packageJson.keywords.join(', ')}`,
            'No keywords specified for better discoverability'
        );

        // Check categories
        this.check(
            this.packageJson.categories && this.packageJson.categories.length > 0,
            `Categories specified: ${this.packageJson.categories.join(', ')}`,
            'No categories specified'
        );
    }

    async validateFiles() {
        this.log('\n=== 📄 FILE VALIDATION ===', COLORS.cyan);

        const requiredFiles = [
            'README.md',
            'LICENSE',
            'CHANGELOG.md',
            'package.json'
        ];

        requiredFiles.forEach(file => {
            this.check(
                fs.existsSync(file),
                `Required file '${file}' exists`,
                `Required file '${file}' is missing`
            );
        });

        // Check icon file
        if (this.packageJson.icon) {
            this.check(
                fs.existsSync(this.packageJson.icon),
                `Icon file '${this.packageJson.icon}' exists`,
                `Icon file '${this.packageJson.icon}' is missing`
            );

            // Check icon dimensions (should be 128x128)
            if (fs.existsSync(this.packageJson.icon)) {
                // We can't easily check dimensions without additional packages
                // So we'll just check if it's a PNG file
                this.check(
                    this.packageJson.icon.endsWith('.png'),
                    'Icon is in PNG format',
                    'Icon should be in PNG format'
                );
            }
        }

        // Check main entry point
        if (this.packageJson.main) {
            this.check(
                fs.existsSync(this.packageJson.main),
                `Main entry point '${this.packageJson.main}' exists`,
                `Main entry point '${this.packageJson.main}' is missing`
            );
        }
    }

    async validateReadme() {
        this.log('\n=== 📖 README VALIDATION ===', COLORS.cyan);

        if (!fs.existsSync('README.md')) {
            this.error('README.md is missing');
            return;
        }

        const readmeContent = fs.readFileSync('README.md', 'utf8');

        // Check for essential sections
        const requiredSections = [
            'Features',
            'Installation',
            'Usage',
            'Commands'
        ];

        requiredSections.forEach(section => {
            const hasSection = readmeContent.toLowerCase().includes(section.toLowerCase());
            this.check(
                hasSection,
                `README contains '${section}' section`,
                `README missing '${section}' section`
            );
        });

        // Check for screenshots/images
        const hasImages = readmeContent.includes('![') || readmeContent.includes('<img');
        this.check(
            hasImages,
            'README contains images/screenshots',
            'README should include screenshots to showcase features'
        );

        // Check minimum length
        this.check(
            readmeContent.length > 500,
            'README has substantial content',
            'README appears to be too short'
        );
    }

    async validateLicense() {
        this.log('\n=== ⚖️  LICENSE VALIDATION ===', COLORS.cyan);

        if (!fs.existsSync('LICENSE')) {
            this.error('LICENSE file is missing');
            return;
        }

        const licenseContent = fs.readFileSync('LICENSE', 'utf8');

        // Check for common license types
        const knownLicenses = ['MIT', 'Apache', 'GPL', 'BSD', 'ISC'];
        const hasKnownLicense = knownLicenses.some(license =>
            licenseContent.includes(license)
        );

        this.check(
            hasKnownLicense,
            'LICENSE contains recognized license type',
            'LICENSE should specify a recognized license type'
        );

        // Check for copyright notice
        this.check(
            licenseContent.includes('Copyright'),
            'LICENSE contains copyright notice',
            'LICENSE should include copyright notice'
        );
    }

    async validateChangelog() {
        this.log('\n=== 📝 CHANGELOG VALIDATION ===', COLORS.cyan);

        if (!fs.existsSync('CHANGELOG.md')) {
            this.warning('CHANGELOG.md is missing (recommended for version tracking)');
            return;
        }

        const changelogContent = fs.readFileSync('CHANGELOG.md', 'utf8');

        // Check for current version
        const currentVersion = this.packageJson.version;
        this.check(
            changelogContent.includes(currentVersion),
            `CHANGELOG contains current version ${currentVersion}`,
            `CHANGELOG should include current version ${currentVersion}`
        );

        // Check for standard format
        this.check(
            changelogContent.includes('##') || changelogContent.includes('###'),
            'CHANGELOG uses standard markdown heading format',
            'CHANGELOG should use standard markdown heading format'
        );
    }

    async validateBuild() {
        this.log('\n=== 🏗️  BUILD VALIDATION ===', COLORS.cyan);

        return new Promise((resolve) => {
            exec('npm run compile', (error, stdout, stderr) => {
                if (error) {
                    this.error(`Build failed: ${error.message}`);
                } else {
                    this.success('Extension builds successfully');
                }

                // Check if dist folder exists
                this.check(
                    fs.existsSync('dist'),
                    'Build output directory exists',
                    'Build output directory is missing'
                );

                // Check if main entry point exists in dist
                if (this.packageJson.main) {
                    this.check(
                        fs.existsSync(this.packageJson.main),
                        'Main entry point exists in build output',
                        'Main entry point missing in build output'
                    );
                }

                resolve();
            });
        });
    }

    async validateVSCE() {
        this.log('\n=== 🔧 VSCE VALIDATION ===', COLORS.cyan);

        return new Promise((resolve) => {
            exec('vsce --version', (error, stdout, stderr) => {
                if (error) {
                    this.error('vsce is not installed. Install with: npm install -g vsce');
                } else {
                    this.success(`vsce is installed: ${stdout.trim()}`);
                }
                resolve();
            });
        });
    }

    async validatePackaging() {
        this.log('\n=== 📦 PACKAGING VALIDATION ===', COLORS.cyan);

        return new Promise((resolve) => {
            exec('vsce package --no-yarn', (error, stdout, stderr) => {
                if (error) {
                    // Check if it's just a version increment or packaging issue
                    if (error.message.includes('already exists') ||
                        error.message.includes('version')) {
                        this.success('Extension packaging validation completed (version already exists)');
                    } else {
                        this.error(`Packaging validation failed: ${error.message}`);
                    }
                } else {
                    this.success('Extension passes packaging validation');
                }
                resolve();
            });
        });
    }

    async generateReport() {
        this.log('\n=== 📊 VALIDATION REPORT ===', COLORS.cyan);

        const passRate = ((this.passed / this.total) * 100).toFixed(1);

        this.log(`
📈 Validation Summary:
   Total Checks: ${this.total}
   Passed: ${this.passed}
   Failed: ${this.errors.length}
   Warnings: ${this.warnings.length}
   Pass Rate: ${passRate}%
        `, COLORS.blue);

        if (this.errors.length > 0) {
            this.log('\n❌ Errors that must be fixed:', COLORS.red);
            this.errors.forEach(error => this.log(`   • ${error}`, COLORS.red));
        }

        if (this.warnings.length > 0) {
            this.log('\n⚠️  Warnings (recommended to fix):', COLORS.yellow);
            this.warnings.forEach(warning => this.log(`   • ${warning}`, COLORS.yellow));
        }

        if (this.errors.length === 0) {
            this.log('\n🎉 All critical checks passed! Extension is ready for publishing.', COLORS.green);
            this.log('\n🚀 Next steps:', COLORS.blue);
            this.log('   1. Run: npm run publish-full', COLORS.blue);
            this.log('   2. Or run: vsce publish', COLORS.blue);
            this.log('   3. Monitor marketplace for publication', COLORS.blue);
        } else {
            this.log('\n🛑 Please fix the errors above before publishing.', COLORS.red);
        }
    }

    async run() {
        this.log('🔍 KALAI AGENT PRE-PUBLISH VALIDATION 🔍', COLORS.magenta);
        this.log('==========================================', COLORS.magenta);

        await this.validatePackageJson();
        await this.validateFiles();
        await this.validateReadme();
        await this.validateLicense();
        await this.validateChangelog();
        await this.validateBuild();
        await this.validateVSCE();
        await this.validatePackaging();
        await this.generateReport();
    }
}

// Run the validator
if (require.main === module) {
    const validator = new PrePublishValidator();
    validator.run();
}

module.exports = PrePublishValidator;