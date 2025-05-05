#!/usr/bin/env node

/**
 * KalAI Agent Setup Script
 * 
 * This script automates the initial setup process for the KalAI Agent VS Code extension.
 * It checks for required dependencies, installs packages, and creates necessary directories.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Print a styled header
console.log(`\n${colors.bright}${colors.cyan}========================================${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}  KalAI Agent VS Code Extension Setup${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}========================================${colors.reset}\n`);

// Check if Node.js is installed
try {
  const nodeVersion = execSync('node --version').toString().trim();
  console.log(`${colors.green}✓ Node.js ${nodeVersion} detected${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}✗ Node.js is not installed or not in PATH${colors.reset}`);
  console.error(`${colors.yellow}Please install Node.js from https://nodejs.org/${colors.reset}`);
  process.exit(1);
}

// Check if npm is installed
try {
  const npmVersion = execSync('npm --version').toString().trim();
  console.log(`${colors.green}✓ npm ${npmVersion} detected${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}✗ npm is not installed or not in PATH${colors.reset}`);
  console.error(`${colors.yellow}Please install npm from https://www.npmjs.com/get-npm${colors.reset}`);
  process.exit(1);
}

// Create directories if they don't exist
const directories = [
  'dist',
  'media',
  'src/commands',
  'src/providers',
  'src/services',
  'src/utils',
  'webview/components'
];

console.log(`\n${colors.bright}Creating directory structure...${colors.reset}`);

directories.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`${colors.green}✓ Created ${dir}${colors.reset}`);
  } else {
    console.log(`${colors.yellow}• Directory ${dir} already exists${colors.reset}`);
  }
});

// Install dependencies
console.log(`\n${colors.bright}Installing dependencies...${colors.reset}`);
try {
  console.log(`${colors.yellow}This may take a few minutes...${colors.reset}`);
  execSync('npm install', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Dependencies installed successfully${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}✗ Failed to install dependencies${colors.reset}`);
  console.error(`${colors.yellow}Error: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Compile TypeScript
console.log(`\n${colors.bright}Compiling TypeScript...${colors.reset}`);
try {
  execSync('npm run compile', { stdio: 'inherit' });
  console.log(`${colors.green}✓ TypeScript compiled successfully${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}✗ Failed to compile TypeScript${colors.reset}`);
  console.error(`${colors.yellow}This is expected on first run if you haven't created all source files yet.${colors.reset}`);
}

// Print next steps
console.log(`\n${colors.bright}${colors.magenta}Setup Complete!${colors.reset}`);
console.log(`\n${colors.bright}Next Steps:${colors.reset}`);
console.log(`${colors.cyan}1. Open the project in VS Code:${colors.reset} code .`);
console.log(`${colors.cyan}2. Press F5 to run the extension in development mode${colors.reset}`);
console.log(`${colors.cyan}3. See DEVELOPMENT.md for detailed instructions${colors.reset}`);

console.log(`\n${colors.bright}${colors.green}Happy coding with KalAI Agent!${colors.reset}\n`);