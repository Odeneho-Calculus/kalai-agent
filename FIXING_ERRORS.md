# Fixing Common Errors in KalAI Agent

This guide explains how to resolve the common linting and TypeScript errors you might encounter when developing the KalAI Agent extension.

## Understanding VS Code Extension Errors

Many of the errors you're seeing are normal for VS Code extension development and don't prevent the extension from running. Here's how to address them:

## 1. "Cannot find module 'vscode'" Errors

```
Cannot find module 'vscode' or its corresponding type declarations.
```

**Solution:**

This is normal and expected. The 'vscode' module is provided by VS Code at runtime and doesn't need to be installed as a dependency.

1. Make sure `@types/vscode` is in your devDependencies:
   ```bash
   npm install --save-dev @types/vscode
   ```

2. Verify your `tsconfig.json` includes:
   ```json
   {
     "compilerOptions": {
       "types": ["node", "vscode"]
     }
   }
   ```

## 2. React-related Errors

```
Cannot find module 'react' or its corresponding type declarations.
JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
```

**Solution:**

1. Install React type definitions:
   ```bash
   npm install --save-dev @types/react @types/react-dom
   ```

2. Ensure your `tsconfig.json` includes JSX support:
   ```json
   {
     "compilerOptions": {
       "jsx": "react",
       "types": ["node", "vscode", "react", "react-dom"]
     }
   }
   ```

## 3. Implicit 'any' Type Errors

```
Parameter 'message' implicitly has an 'any' type.
```

**Solution:**

Add explicit type annotations to parameters:

```typescript
// Before
webviewView.webview.onDidReceiveMessage(async (message) => {

// After
webviewView.webview.onDidReceiveMessage(async (message: any) => {
```

For a more robust solution, define interface types for your messages:

```typescript
interface WebviewMessage {
  command: string;
  text?: string;
  fileName?: string;
  languageId?: string;
  // Add other properties as needed
}

webviewView.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
```

## 4. Missing Module Errors

```
Cannot find module '../utils/getWebviewContent' or its corresponding type declarations.
```

**Solution:**

Ensure the file exists at the specified path. If it doesn't, create it with the appropriate content.

## 5. Type Expected Error in getNonce.ts

```
src/utils/getNonce.ts:
13:2: Type expected.
```

**Solution:**

This error is likely due to an extra closing tag in the file. Open the file and remove any extraneous content at the end, such as `