import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface SearchResult {
  file: string;
  line: number;
  column: number;
  content: string;
  context: string[];
}

export interface FileInfo {
  path: string;
  name: string;
  extension: string;
  size: number;
  lastModified: Date;
  language: string;
  content?: string;
}

export class FileSearchService {
  private fileCache: Map<string, FileInfo> = new Map();
  private searchCache: Map<string, SearchResult[]> = new Map();

  public async searchInFiles(
    query: string,
    filePattern?: string,
    includeContent: boolean = false
  ): Promise<SearchResult[]> {
    const cacheKey = `${query}_${filePattern}_${includeContent}`;

    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        return [];
      }

      const results: SearchResult[] = [];
      const pattern = filePattern || '**/*.{js,ts,jsx,tsx,py,java,cpp,c,cs,php,rb,go,rs,json,md,txt}';

      const files = await vscode.workspace.findFiles(
        pattern,
        '**/node_modules/**'
      );

      for (const file of files) {
        try {
          const document = await vscode.workspace.openTextDocument(file);
          const text = document.getText();
          const lines = text.split('\n');

          lines.forEach((line, index) => {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              const contextStart = Math.max(0, index - 2);
              const contextEnd = Math.min(lines.length, index + 3);
              const context = lines.slice(contextStart, contextEnd);

              results.push({
                file: file.fsPath,
                line: index + 1,
                column: line.toLowerCase().indexOf(query.toLowerCase()) + 1,
                content: line.trim(),
                context
              });
            }
          });
        } catch (error) {
          console.warn(`Error searching in file ${file.fsPath}:`, error);
        }
      }

      this.searchCache.set(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Error in file search:', error);
      return [];
    }
  }

  public async getFileInfo(filePath: string): Promise<FileInfo | null> {
    if (this.fileCache.has(filePath)) {
      return this.fileCache.get(filePath)!;
    }

    try {
      const uri = vscode.Uri.file(filePath);
      const stat = await vscode.workspace.fs.stat(uri);
      const document = await vscode.workspace.openTextDocument(uri);

      const fileInfo: FileInfo = {
        path: filePath,
        name: path.basename(filePath),
        extension: path.extname(filePath),
        size: stat.size,
        lastModified: new Date(stat.mtime),
        language: document.languageId,
        content: document.getText()
      };

      this.fileCache.set(filePath, fileInfo);
      return fileInfo;
    } catch (error) {
      console.error(`Error getting file info for ${filePath}:`, error);
      return null;
    }
  }

  public async getProjectStructure(): Promise<any> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        return null;
      }

      const rootPath = workspaceFolders[0].uri.fsPath;
      const structure = await this.buildDirectoryTree(rootPath);

      return {
        root: rootPath,
        structure,
        summary: await this.generateProjectSummary(rootPath)
      };
    } catch (error) {
      console.error('Error getting project structure:', error);
      return null;
    }
  }

  private async buildDirectoryTree(dirPath: string, maxDepth: number = 3, currentDepth: number = 0): Promise<any> {
    if (currentDepth >= maxDepth) {
      return null;
    }

    try {
      const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
      const tree: any = {
        name: path.basename(dirPath),
        type: 'directory',
        children: []
      };

      for (const item of items) {
        if (item.name.startsWith('.') || item.name === 'node_modules') {
          continue;
        }

        const itemPath = path.join(dirPath, item.name);

        if (item.isDirectory()) {
          const subtree = await this.buildDirectoryTree(itemPath, maxDepth, currentDepth + 1);
          if (subtree) {
            tree.children.push(subtree);
          }
        } else {
          tree.children.push({
            name: item.name,
            type: 'file',
            extension: path.extname(item.name),
            path: itemPath
          });
        }
      }

      return tree;
    } catch (error) {
      console.warn(`Error reading directory ${dirPath}:`, error);
      return null;
    }
  }

  private async generateProjectSummary(rootPath: string): Promise<any> {
    try {
      const files = await vscode.workspace.findFiles(
        '**/*',
        '**/node_modules/**'
      );

      const summary = {
        totalFiles: files.length,
        fileTypes: new Map<string, number>(),
        languages: new Map<string, number>(),
        largestFiles: [] as Array<{name: string, size: number}>,
        recentFiles: [] as Array<{name: string, modified: Date}>
      };

      for (const file of files.slice(0, 100)) { // Limit for performance
        try {
          const stat = await vscode.workspace.fs.stat(file);
          const ext = path.extname(file.fsPath);
          const document = await vscode.workspace.openTextDocument(file);

          // Count file types
          summary.fileTypes.set(ext, (summary.fileTypes.get(ext) || 0) + 1);

          // Count languages
          summary.languages.set(document.languageId, (summary.languages.get(document.languageId) || 0) + 1);

          // Track large files
          if (summary.largestFiles.length < 10) {
            summary.largestFiles.push({
              name: path.basename(file.fsPath),
              size: stat.size
            });
          }

          // Track recent files
          if (summary.recentFiles.length < 10) {
            summary.recentFiles.push({
              name: path.basename(file.fsPath),
              modified: new Date(stat.mtime)
            });
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }

      // Sort arrays
      summary.largestFiles.sort((a, b) => b.size - a.size);
      summary.recentFiles.sort((a, b) => b.modified.getTime() - a.modified.getTime());

      return summary;
    } catch (error) {
      console.error('Error generating project summary:', error);
      return null;
    }
  }

  public async findSimilarFiles(filePath: string): Promise<FileInfo[]> {
    try {
      const targetFile = await this.getFileInfo(filePath);
      if (!targetFile) {
        return [];
      }

      const files = await vscode.workspace.findFiles(
        `**/*${targetFile.extension}`,
        '**/node_modules/**'
      );

      const similarFiles: FileInfo[] = [];

      for (const file of files) {
        if (file.fsPath === filePath) {
          continue;
        }

        const fileInfo = await this.getFileInfo(file.fsPath);
        if (fileInfo) {
          similarFiles.push(fileInfo);
        }
      }

      return similarFiles.slice(0, 10); // Limit results
    } catch (error) {
      console.error('Error finding similar files:', error);
      return [];
    }
  }

  public async searchByRegex(pattern: string, filePattern?: string): Promise<SearchResult[]> {
    try {
      const regex = new RegExp(pattern, 'gi');
      const files = await vscode.workspace.findFiles(
        filePattern || '**/*.{js,ts,jsx,tsx,py,java,cpp,c,cs,php,rb,go,rs}',
        '**/node_modules/**'
      );

      const results: SearchResult[] = [];

      for (const file of files) {
        try {
          const document = await vscode.workspace.openTextDocument(file);
          const text = document.getText();
          const lines = text.split('\n');

          lines.forEach((line, index) => {
            const matches = line.matchAll(regex);
            for (const match of matches) {
              const contextStart = Math.max(0, index - 2);
              const contextEnd = Math.min(lines.length, index + 3);
              const context = lines.slice(contextStart, contextEnd);

              results.push({
                file: file.fsPath,
                line: index + 1,
                column: (match.index || 0) + 1,
                content: line.trim(),
                context
              });
            }
          });
        } catch (error) {
          console.warn(`Error searching in file ${file.fsPath}:`, error);
        }
      }

      return results;
    } catch (error) {
      console.error('Error in regex search:', error);
      return [];
    }
  }

  public clearCache(): void {
    this.fileCache.clear();
    this.searchCache.clear();
  }
}