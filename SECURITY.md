# Security Guide for Kalai Agent

## 🔒 API Key Security Best Practices

### **NEVER commit API keys to version control**

API keys are sensitive credentials that should never be exposed in public repositories. This document outlines secure practices for managing API keys in the Kalai Agent extension.

## 🚨 If Your API Key Was Exposed

If you received an email about an exposed API key:

1. **Immediately generate a new API key** at [OpenRouter.ai](https://openrouter.ai/keys)
2. **Update your local configuration** with the new key
3. **Never commit the new key** to version control
4. **Follow the secure configuration methods** below

## 📋 Secure Configuration Methods

### **Method 1: Environment Variables (Recommended)**

This is the most secure method for production use:

#### Windows:
```bash
# Set environment variable
set OPENROUTER_API_KEY=your-actual-api-key

# Or permanently via System Properties
# 1. Search "Environment Variables" in Start Menu
# 2. Add new User Variable: OPENROUTER_API_KEY
# 3. Restart VS Code
```

#### macOS/Linux:
```bash
# Add to ~/.bashrc or ~/.zshrc
export OPENROUTER_API_KEY="your-actual-api-key"

# Then restart VS Code
```

#### Verification:
```bash
# Check if environment variable is set
echo $OPENROUTER_API_KEY  # macOS/Linux
echo %OPENROUTER_API_KEY% # Windows
```

### **Method 2: VS Code Settings (User-Specific)**

Configure through VS Code settings (stored locally):

1. Open VS Code Settings (`Ctrl+,`)
2. Search for "kalai-agent"
3. Set "Api Key" field to your OpenRouter API key
4. This stores the key in your user settings (not shared)

### **Method 3: Secure Config File (Development)**

For local development only:

1. Copy `src/config/secure.config.template.ts` to `src/config/secure.config.ts`
2. Replace `your-openrouter-api-key-here` with your actual key
3. **Never commit this file** (it's automatically ignored by .gitignore)

## 🔍 Security Validation

### **Run Security Audit**

Use the built-in security audit command:

```
Command Palette → "Kalai: Run Security Audit"
```

This will:
- Check API key configuration
- Validate key format
- Recommend security improvements
- Identify potential issues

### **Configuration Priority**

The extension uses this priority order:

1. **Environment Variables** (most secure)
2. **VS Code Settings** (user-specific)
3. **Secure Config File** (development)
4. **Runtime Configuration** (temporary)

## 🛡️ Security Features

### **API Key Masking**

API keys are automatically masked in:
- Log files
- Debug output
- Error messages
- Diagnostic reports

Example: `sk-or-v1-...5e95` instead of the full key

### **Automatic Security Checks**

The extension automatically:
- Validates API key format
- Checks for placeholder values
- Warns about insecure configurations
- Prevents accidental exposure

### **Secure Error Handling**

Errors never expose full API keys:
- Authentication errors show masked keys
- Network errors hide sensitive headers
- Debug logs filter out credentials

## 🔧 Security Commands

### **Setup Secure Configuration**
```
Command Palette → "Kalai: Setup Secure Configuration"
```

Interactive wizard to securely configure API keys.

### **Clear Configuration**
```
Command Palette → "Kalai: Clear API Configuration"
```

Removes API key from current session (not permanent storage).

### **Validate Configuration**
```
Command Palette → "Kalai: Validate API Configuration"
```

Checks if current configuration is secure and valid.

## 🚫 What NOT to Do

### **Never do these:**

- ❌ Hardcode API keys in source code
- ❌ Commit API keys to version control
- ❌ Share API keys in chat messages
- ❌ Store API keys in plain text files
- ❌ Use API keys in URLs or query parameters
- ❌ Copy API keys to public documentation

### **Red Flags:**

- File contains actual API key starting with `sk-or-v1-`
- API key in documentation or README files
- Hardcoded keys in TypeScript/JavaScript files
- Keys in configuration files tracked by git

## 🔄 API Key Rotation

### **Regular Rotation Schedule**

Rotate your API keys regularly:

- **Monthly**: For active development
- **Quarterly**: For production use
- **Immediately**: If compromised

### **Rotation Process**

1. Generate new key at [OpenRouter.ai](https://openrouter.ai/keys)
2. Update your configuration using secure method
3. Test the new key
4. Revoke the old key
5. Update any shared configurations

## 📚 Security Resources

### **Getting API Keys**

1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Create account or sign in
3. Navigate to Keys section
4. Generate new API key
5. Copy and store securely

### **Best Practices**

- Use environment variables for production
- Keep API keys in user-specific configurations
- Never commit sensitive files
- Use different keys for different environments
- Monitor API key usage regularly
- Set up billing alerts
- Use least-privilege access

### **Monitoring**

- Check OpenRouter dashboard for usage
- Monitor for unexpected API calls
- Set up usage alerts
- Review access logs regularly

## 🆘 Emergency Response

### **If API Key is Compromised**

1. **Immediately revoke** the compromised key
2. **Generate new key** at OpenRouter.ai
3. **Update all configurations** with new key
4. **Review access logs** for unauthorized usage
5. **Check billing** for unexpected charges
6. **Report to security team** if applicable

### **Repository Cleanup**

If you accidentally committed an API key:

1. **Generate new key immediately**
2. **Remove key from repository history**:
   ```bash
   # Remove from all commits (WARNING: Rewrites history)
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch path/to/file' \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push changes** (if working alone)
4. **Notify team members** to re-clone repository

## 📞 Support

### **Getting Help**

- Check this security guide first
- Run built-in security audit
- Review OpenRouter documentation
- Contact OpenRouter support for API issues

### **Reporting Security Issues**

If you discover a security vulnerability:

1. **Do not** create public GitHub issues
2. **Do not** post in public forums
3. **Contact** maintainers privately
4. **Provide** detailed reproduction steps
5. **Wait** for response before disclosure

## ✅ Security Checklist

Before deploying or sharing:

- [ ] API key is stored securely (environment variables)
- [ ] No hardcoded keys in source code
- [ ] Secure config files are in .gitignore
- [ ] Security audit passes
- [ ] API key format is validated
- [ ] Monitoring is configured
- [ ] Backup authentication method available
- [ ] Team members know security practices

## 🔄 Regular Security Tasks

### **Weekly**
- Check API usage dashboards
- Review error logs for security issues

### **Monthly**
- Run comprehensive security audit
- Review and update security practices
- Check for new security features

### **Quarterly**
- Rotate API keys
- Review access permissions
- Update security documentation
- Train team on security practices

---

**Remember**: Security is everyone's responsibility. When in doubt, choose the more secure option.