# Publishing KalAI Agent to VS Code Marketplace

This guide provides step-by-step instructions for packaging and publishing the KalAI Agent extension to the Visual Studio Code Marketplace.

## Prerequisites

Before publishing, ensure you have:

1. A [Visual Studio Marketplace](https://marketplace.visualstudio.com/) publisher account
2. The [vsce](https://github.com/microsoft/vscode-vsce) publishing tool installed
3. A complete and tested extension
4. Updated version number in package.json

## Step 1: Create a Publisher Account

If you don't already have a publisher account:

1. Go to the [Visual Studio Marketplace Management page](https://marketplace.visualstudio.com/manage)
2. Sign in with your Microsoft account or create a new one
3. Click on "New Publisher" and follow the instructions
4. Make note of your publisher ID (you'll need this later)

## Step 2: Install the Publishing Tool

```bash
npm install -g vsce
```

## Step 3: Prepare Your Extension

### Update package.json

Ensure your package.json contains the following fields:

```json
{
  "name": "kalai-agent",
  "displayName": "KalAI Agent",
  "description": "AI coding assistant powered by free, high-performance language models",
  "version": "0.1.0",
  "publisher": "your-publisher-id",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/kalai-agent"
  },
  "engines": {
    "vscode": "^1.60.0"
  }
}
```

Replace `your-publisher-id` with your actual publisher ID from Step 1.

### Create a README.md

Ensure your README.md is comprehensive and includes:

- Description of the extension
- Features with screenshots
- Installation instructions
- Usage examples
- Requirements
- Extension settings
- Known issues
- Release notes

### Add an Icon

Add a 128x128 pixel icon in PNG format to your extension and reference it in package.json:

```json
{
  "icon": "media/icon.png"
}
```

### Add a License

Ensure you have a LICENSE file in your project (typically MIT or another open-source license).

## Step 4: Package Your Extension

Run the packaging command to create a .vsix file:

```bash
vsce package
```

This will create a file named `kalai-agent-0.1.0.vsix` (or similar, depending on your version).

## Step 5: Test the Packaged Extension

Before publishing, test the packaged extension:

```bash
code --install-extension kalai-agent-0.1.0.vsix
```

Verify that the extension works correctly when installed from the .vsix file.

## Step 6: Publish to the Marketplace

### Login to the Marketplace

```bash
vsce login your-publisher-id
```

You'll be prompted to enter a Personal Access Token (PAT). If you don't have one:

1. Go to [Azure DevOps](https://dev.azure.com)
2. Click on your profile icon in the top right
3. Select "Personal access tokens"
4. Click "New Token"
5. Give it a name like "VS Code Extension Publishing"
6. Set the organization to "All accessible organizations"
7. Set the expiration as desired
8. Under "Scopes", select "Custom defined" and then check "Marketplace > Manage"
9. Click "Create" and copy the token

### Publish the Extension

```bash
vsce publish
```

Or, to specify a version increment:

```bash
vsce publish minor
```

This will:
1. Increment the version in package.json (if you used a version flag)
2. Package the extension
3. Upload it to the marketplace

## Step 7: Verify the Publication

1. Go to the [Visual Studio Marketplace](https://marketplace.visualstudio.com/)
2. Search for "KalAI Agent"
3. Verify that your extension appears and the information is correct

## Updating Your Extension

To publish an update:

1. Make your changes
2. Update the version in package.json (or use the version flag with vsce publish)
3. Run `vsce publish`

## Publishing to Open VSX Registry

To make your extension available for open-source VS Code alternatives like VSCodium:

1. Install the Open VSX publishing tool:
   ```bash
   npm install -g ovsx
   ```

2. Publish to Open VSX:
   ```bash
   ovsx publish -p <your-open-vsx-token>
   ```

## Troubleshooting

### Common Publishing Errors

- **Missing Fields**: Ensure all required fields are in package.json
- **Icon Issues**: Make sure your icon is 128x128 pixels and in PNG format
- **Repository Issues**: Ensure your repository URL is correct
- **Token Expired**: Generate a new PAT if yours has expired

### Getting Help

If you encounter issues:

1. Check the [vsce documentation](https://github.com/microsoft/vscode-vsce)
2. Visit the [VS Code Extension Development forum](https://github.com/microsoft/vscode-discussions/discussions/categories/extension-development)
3. Search for similar issues on [Stack Overflow](https://stackoverflow.com/questions/tagged/visual-studio-code-extension)

## Best Practices

- **Semantic Versioning**: Follow [semver](https://semver.org/) for version numbers
- **Changelog**: Maintain a CHANGELOG.md file to document changes
- **Screenshots**: Include screenshots in your README.md to showcase features
- **Tags**: Use relevant tags in package.json to improve discoverability
- **Regular Updates**: Regularly update your extension to fix bugs and add features