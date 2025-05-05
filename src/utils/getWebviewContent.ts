import * as vscode from 'vscode';
import { getNonce } from './getNonce';

/**
 * Generates the HTML content for the webview
 * @param webview The webview to generate content for
 * @param extensionUri The URI of the extension
 * @returns HTML content as a string
 */
export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'dist', 'webview.js')
  );

  const nonce = getNonce();

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="
        default-src 'none';
        style-src ${webview.cspSource} 'unsafe-inline';
        script-src 'nonce-${nonce}' 'unsafe-eval' 'unsafe-inline';
        connect-src 'self';
      ">
      <title>KalAI Agent Chat</title>
    </head>
    <body>
      <div id="root"></div>
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
  </html>`;
}