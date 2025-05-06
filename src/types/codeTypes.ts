export interface FileContext {
    content: string;
    language: string;
    path: string;
    relativePath: string;
    parsed?: {
        framework?: string;
        imports?: string[];
        exports?: string[];
        structure?: {
            template?: string;
            script?: string;
            style?: string;
        };
    };
    selection?: {
        start: number;
        end: number;
        text: string;
    };
}
