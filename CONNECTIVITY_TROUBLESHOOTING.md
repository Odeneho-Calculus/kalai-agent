# Kalai Agent Connectivity Troubleshooting Guide

## Quick Fix Steps

### 1. **Run Diagnostics First**
```
1. Open Command Palette (Ctrl+Shift+P)
2. Type "Kalai: Run API Diagnostics"
3. Execute the command
4. Review the diagnostic report
```

### 2. **Check Your API Key**
Your API key should be configured in your secure configuration file or VS Code settings.

**Verify your key:**
1. Go to [OpenRouter.ai](https://openrouter.ai)
2. Log in to your account
3. Check API Keys section
4. Ensure the key is active and has credits

**Configure your key securely:**
- Use VS Code Settings (Ctrl+,) → Search "kalai-agent" → Set "Api Key"
- Or update `src/config/secure.config.ts` (never commit this file)

### 3. **Common Issues and Solutions**

#### **Issue: "I'm currently experiencing connectivity issues"**
**Root Cause:** AI service timeout or API connection failure

**Solutions:**
1. **Check API Key Balance:**
   - Visit OpenRouter dashboard
   - Verify you have sufficient credits
   - Check rate limits

2. **Network Issues:**
   - Disable VPN temporarily
   - Check firewall settings
   - Verify internet connectivity

3. **Extension Performance:**
   - Restart VS Code
   - Disable other extensions temporarily
   - Clear extension cache

#### **Issue: Extension Host Unresponsive**
**Root Cause:** Heavy repository analysis blocking the extension

**Solutions:**
1. **Restart Extension Host:**
   - Command Palette → "Developer: Restart Extension Host"

2. **Reduce Analysis Scope:**
   - Close large files
   - Exclude heavy directories in .gitignore

3. **Performance Mode:**
   - Use "Kalai: Show Mode Selector"
   - Switch to lightweight mode

#### **Issue: API Authentication Errors**
**Root Cause:** Invalid or expired API key

**Solutions:**
1. **Update API Key:**
   - Open VS Code Settings (Ctrl+,)
   - Search for "kalai-agent"
   - Update "Api Key" field

2. **Check Secure Config:**
   - Edit `src/config/secure.config.ts`
   - Update `defaultApiKey` value

### 4. **Manual Configuration Check**

#### **VS Code Settings:**
```json
{
  "kalai-agent.apiKey": "your-openrouter-api-key",
  "kalai-agent.apiEndpoint": "https://openrouter.ai/api/v1/chat/completions",
  "kalai-agent.modelName": "meta-llama/llama-3.3-70b-instruct:free",
  "kalai-agent.maxTokens": 1024,
  "kalai-agent.temperature": 0.7
}
```

#### **Secure Config File:**
Location: `src/config/secure.config.ts`
```typescript
export const SECURE_CONFIG: SecureConfig = {
    defaultApiKey: 'REPLACE_WITH_YOUR_API_KEY', // Replace with your actual API key
    defaultApiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModelName: 'meta-llama/llama-3.3-70b-instruct:free',
    // ... other config
};
```

**⚠️ SECURITY NOTE:** Never commit this file to version control. It's automatically ignored by .gitignore.

### 5. **Testing Commands**

#### **Test API Connection:**
```bash
# Command Palette → "Kalai: Run API Diagnostics"
```

#### **Test Basic Functionality:**
```bash
# Command Palette → "Kalai: Show Capabilities"
```

#### **Reset Extension:**
```bash
# Command Palette → "Kalai: Reinitialize Repository Analysis"
```

### 6. **Advanced Troubleshooting**

#### **Enable Debug Logging:**
1. Open Developer Tools (Help → Toggle Developer Tools)
2. Check Console for error messages
3. Look for patterns in error logs

#### **Check Extension Logs:**
1. View → Output
2. Select "Kalai Agent" from dropdown
3. Review recent log entries

#### **Performance Monitoring:**
1. Command Palette → "Kalai: Show Performance Report"
2. Check for performance bottlenecks
3. Identify resource-intensive operations

### 7. **Model Alternatives**

If the current model isn't working, try these alternatives:

```typescript
// Free models that typically work well:
'meta-llama/llama-3.1-8b-instruct:free'
'microsoft/phi-3-mini-128k-instruct:free'
'google/gemma-2-9b-it:free'

// Paid models (if you have credits):
'anthropic/claude-3-sonnet:beta'
'openai/gpt-4o-mini'
'google/gemini-pro'
```

### 8. **Emergency Reset**

If nothing works, perform a complete reset:

1. **Close VS Code**
2. **Delete extension cache:**
   - Windows: `%USERPROFILE%\.vscode\extensions\kalculus.kalai-agent-*`
3. **Clear VS Code settings:**
   - Remove kalai-agent entries from settings.json
4. **Restart VS Code**
5. **Reconfigure extension**

### 9. **Common Error Messages**

#### **"API service timeout"**
- **Solution:** Check network connectivity and API key
- **Command:** `Kalai: Run API Diagnostics`

#### **"Extension host is unresponsive"**
- **Solution:** Restart extension host
- **Command:** `Developer: Restart Extension Host`

#### **"Invalid response format from AI model"**
- **Solution:** Try different model or check API endpoint
- **Command:** `Kalai: Show Mode Selector`

### 10. **Contact Support**

If issues persist:
1. Run diagnostics and save the report
2. Check extension logs
3. Create GitHub issue with:
   - Diagnostic report
   - Error logs
   - Steps to reproduce
   - VS Code version
   - Operating system

---

## Status Indicators

- ✅ **"Kalai Agent is ready!"** - Everything working
- ⚠️ **"Connectivity issues"** - API connection problems
- ❌ **"Initialization failed"** - Extension startup issues
- 🔄 **"Reinitializing..."** - Extension restarting

## Quick Health Check

1. **API Key:** ${apiKey ? 'Configured' : 'Not configured'}
2. **Model:** meta-llama/llama-3.3-70b-instruct:free
3. **Endpoint:** https://openrouter.ai/api/v1/chat/completions
4. **Network:** Run diagnostics to check
5. **Extension:** Check VS Code extension host status

Run `Kalai: Run API Diagnostics` for a comprehensive health check.