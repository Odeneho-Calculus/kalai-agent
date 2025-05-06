import { ProjectContext } from '../services/codeContextManager';

export interface AIRequestContext extends ProjectContext {
    instruction?: string;
    currentFile: {
        fileName: string;
        languageId: string;
        instruction?: string;
        filePath?: string;
        prefix?: string;
        suffix?: string;
        relativePath?: string;
        siblingFiles?: string[];
        dependencies?: Record<string, string>;
    };
}
