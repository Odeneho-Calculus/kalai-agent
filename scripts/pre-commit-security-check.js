#!/usr/bin/env node

/**
 * Pre-commit Security Check for Kalai Agent
 *
 * This script prevents accidental commit of API keys and sensitive information.
 *
 * Usage:
 * 1. Make this file executable: chmod +x scripts/pre-commit-security-check.js
 * 2. Install as git hook: cp scripts/pre-commit-security-check.js .git/hooks/pre-commit
 * 3. Or run manually: node scripts/pre-commit-security-check.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns that indicate potential API key exposure
const SECURITY_PATTERNS = [
    /sk-or-v1-[a-zA-Z0-9]{40,}/g,  // OpenRouter API keys
    /sk-[a-zA-Z0-9]{40,}/g,         // OpenAI-style API keys
    /OPENROUTER_API_KEY.*sk-or-v1-/g, // Environment variable assignments
    /defaultApiKey.*sk-or-v1-/g,    // Config file assignments
    /apiKey.*sk-or-v1-/g,           // General API key assignments
    /Bearer sk-or-v1-/g,            // Authorization headers
    /Authorization.*sk-or-v1-/g,    // Authorization headers
];

// Files to exclude from security checks
const EXCLUDE_PATTERNS = [
    /node_modules/,
    /\.git/,
    /\.vsix$/,
    /\.log$/,
    /\.tmp$/,
    /\.temp$/,
    /secure\.config\.template\.ts$/,
    /SECURITY\.md$/,
    /pre-commit-security-check\.js$/,
];

// Files that should never contain API keys
const CRITICAL_FILES = [
    'README.md',
    'CONNECTIVITY_TROUBLESHOOTING.md',
    'package.json',
    'tsconfig.json',
    'webpack.config.js',
    'esbuild.config.js',
];

class SecurityChecker {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.checkedFiles = 0;
    }

    /**
     * Main security check function
     */
    async runSecurityCheck() {
        console.log('🔍 Running security check...');

        try {
            // Get list of staged files for commit
            const stagedFiles = this.getStagedFiles();

            if (stagedFiles.length === 0) {
                console.log('✅ No files to check');
                return true;
            }

            // Check each staged file
            for (const file of stagedFiles) {
                this.checkFile(file);
            }

            // Check for critical file violations
            this.checkCriticalFiles(stagedFiles);

            // Display results
            this.displayResults();

            return this.errors.length === 0;

        } catch (error) {
            console.error('❌ Security check failed:', error.message);
            return false;
        }
    }

    /**
     * Get list of staged files for commit
     */
    getStagedFiles() {
        try {
            const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
            return output.trim().split('\n').filter(file => file.length > 0);
        } catch (error) {
            // If not in git repository, check all files
            return this.getAllFiles();
        }
    }

    /**
     * Get all files in the repository
     */
    getAllFiles() {
        const files = [];
        const walk = (dir) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(process.cwd(), fullPath);

                if (this.shouldExclude(relativePath)) continue;

                if (entry.isDirectory()) {
                    walk(fullPath);
                } else {
                    files.push(relativePath);
                }
            }
        };

        walk(process.cwd());
        return files;
    }

    /**
     * Check if file should be excluded from security check
     */
    shouldExclude(filePath) {
        return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
    }

    /**
     * Check individual file for security issues
     */
    checkFile(filePath) {
        if (this.shouldExclude(filePath)) {
            return;
        }

        try {
            if (!fs.existsSync(filePath)) {
                return; // File was deleted
            }

            const content = fs.readFileSync(filePath, 'utf8');
            this.checkedFiles++;

            // Check for security patterns
            for (const pattern of SECURITY_PATTERNS) {
                const matches = content.match(pattern);
                if (matches) {
                    this.errors.push({
                        file: filePath,
                        issue: 'API Key Detected',
                        matches: matches.map(match => this.maskApiKey(match)),
                        line: this.getLineNumber(content, matches[0])
                    });
                }
            }

            // Check for placeholder values that might indicate incomplete setup
            if (content.includes('your-openrouter-api-key-here')) {
                // This is acceptable in template files
                if (!filePath.includes('template')) {
                    this.warnings.push({
                        file: filePath,
                        issue: 'Placeholder API key detected',
                        line: this.getLineNumber(content, 'your-openrouter-api-key-here')
                    });
                }
            }

        } catch (error) {
            this.warnings.push({
                file: filePath,
                issue: `Could not read file: ${error.message}`,
                line: 0
            });
        }
    }

    /**
     * Check critical files for any API key presence
     */
    checkCriticalFiles(stagedFiles) {
        const criticalFilesInCommit = stagedFiles.filter(file =>
            CRITICAL_FILES.some(criticalFile => file.endsWith(criticalFile))
        );

        for (const file of criticalFilesInCommit) {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');

                // More sensitive check for critical files
                if (content.includes('sk-or-v1-') || content.includes('OPENROUTER_API_KEY')) {
                    this.errors.push({
                        file: file,
                        issue: 'CRITICAL: API key in public documentation',
                        line: this.getLineNumber(content, 'sk-or-v1-')
                    });
                }
            }
        }
    }

    /**
     * Get line number of matched text
     */
    getLineNumber(content, searchText) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(searchText)) {
                return i + 1;
            }
        }
        return 0;
    }

    /**
     * Mask API key for safe display
     */
    maskApiKey(apiKey) {
        if (apiKey.length > 16) {
            return apiKey.substring(0, 12) + '...' + apiKey.substring(apiKey.length - 4);
        }
        return '***masked***';
    }

    /**
     * Display security check results
     */
    displayResults() {
        console.log(`\n📊 Security Check Results:`);
        console.log(`   Files checked: ${this.checkedFiles}`);
        console.log(`   Errors: ${this.errors.length}`);
        console.log(`   Warnings: ${this.warnings.length}`);

        if (this.errors.length > 0) {
            console.log('\n❌ SECURITY ERRORS (commit blocked):');
            this.errors.forEach(error => {
                console.log(`   ${error.file}:${error.line} - ${error.issue}`);
                if (error.matches) {
                    error.matches.forEach(match => {
                        console.log(`     Found: ${match}`);
                    });
                }
            });
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️  SECURITY WARNINGS:');
            this.warnings.forEach(warning => {
                console.log(`   ${warning.file}:${warning.line} - ${warning.issue}`);
            });
        }

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('\n✅ No security issues detected');
        }

        if (this.errors.length > 0) {
            console.log('\n🔒 SECURITY RECOMMENDATIONS:');
            console.log('   1. Remove API keys from staged files');
            console.log('   2. Use environment variables: OPENROUTER_API_KEY');
            console.log('   3. Store keys in VS Code settings');
            console.log('   4. Use src/config/secure.config.ts (ignored by git)');
            console.log('   5. See SECURITY.md for complete guide');
        }
    }
}

// Run security check if executed directly
if (require.main === module) {
    const checker = new SecurityChecker();
    checker.runSecurityCheck().then(success => {
        if (!success) {
            process.exit(1);
        }
    });
}

module.exports = SecurityChecker;