@echo off
echo ========================================
echo  KalAI Agent VS Code Extension Runner
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

:: Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed or not in PATH
    echo Please install npm from https://www.npmjs.com/get-npm
    exit /b 1
)

:: Check if VS Code is installed
where code >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] VS Code is not installed or not in PATH
    echo Please install VS Code from https://code.visualstudio.com/
    exit /b 1
)

:: Run setup script if node_modules doesn't exist
if not exist node_modules (
    echo Running setup script...
    node setup.js
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Setup failed
        exit /b 1
    )
)

:: Open VS Code with the extension in development mode
echo.
echo Opening VS Code with KalAI Agent in development mode...
echo.
echo Press F5 in VS Code to start debugging the extension
echo.
code .

echo.
echo Done! VS Code should now be open with KalAI Agent.
echo.