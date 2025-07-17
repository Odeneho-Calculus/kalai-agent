# Kalai Agent Secure Configuration

This directory contains secure configuration files for the Kalai Agent extension.

## For Kalai Developers

### Initial Setup
1. Copy `secure.config.template.ts` to `secure.config.ts`
2. Replace `'your-openrouter-api-key-here'` with your actual OpenRouter API key
3. The `secure.config.ts` file is automatically ignored by git for security

### Getting an OpenRouter API Key
1. Visit [https://openrouter.ai/](https://openrouter.ai/)
2. Sign up or log in to your account
3. Navigate to the **Keys** section in your dashboard
4. Click **Create Key**
5. Copy the generated API key (starts with `sk-or-v1-...`)

## How It Works

### Priority System
The extension uses the following priority for API key configuration:
1. **User Settings** (VS Code settings) - Highest priority
2. **Secure Config** (this file) - Default for developers
3. **Fallback** - Empty string (will show error)

### Security Features
- ✅ API key is never committed to version control
- ✅ Automatic fallback to user settings
- ✅ Clear error messages when not configured
- ✅ Template file for easy setup

### For End Users
End users don't need to worry about this configuration. The extension works out of the box with the embedded API key. If they want to use their own API key, they can configure it in VS Code settings:

1. Open VS Code Settings (`Ctrl+,`)
2. Search for "kalai-agent"
3. Enter their API key in the "Api Key" field

## Files

- `secure.config.template.ts` - Template file (safe to commit)
- `secure.config.ts` - Actual configuration (ignored by git)
- `README.md` - This documentation

## Important Notes

⚠️ **Never commit `secure.config.ts` to version control**
⚠️ **Always use the template file for new setups**
⚠️ **Keep your API keys secure and don't share them**

## Troubleshooting

### "No API key configured" error
1. Check if `secure.config.ts` exists
2. Verify the API key is correctly set (not the template placeholder)
3. Ensure the API key is valid and has proper permissions

### Extension not working for end users
- The extension should work out of the box with the embedded key
- If issues persist, users can set their own API key in VS Code settings