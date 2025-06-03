import React from 'react';
import './MarkdownRenderer.css';
import {
    Javascript,
    Code,
    DataObject,
    Html,
    Css,
    Storage,
    Terminal,
    Description,
    Settings,
    Build,
    Language,
    Memory,
    Security,
    Web,
    ContentCopy,
    CheckCircle
} from '@mui/icons-material';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

const getLanguageIcon = (lang: string): React.ReactElement => {
    const language = lang.toLowerCase();
    const iconProps = { fontSize: 'small' as const, style: { fontSize: '16px' } };

    switch (language) {
        case 'js':
        case 'javascript':
        case 'jsx':
            return <Javascript {...iconProps} style={{ ...iconProps.style, color: '#f7df1e' }} />;
        case 'ts':
        case 'typescript':
        case 'tsx':
            return <Code {...iconProps} style={{ ...iconProps.style, color: '#3178c6' }} />;
        case 'py':
        case 'python':
            return <Code {...iconProps} style={{ ...iconProps.style, color: '#3776ab' }} />;
        case 'java':
            return <Code {...iconProps} style={{ ...iconProps.style, color: '#ed8b00' }} />;
        case 'cpp':
        case 'c++':
        case 'c':
            return <Code {...iconProps} style={{ ...iconProps.style, color: '#00599c' }} />;
        case 'cs':
        case 'csharp':
            return <Code {...iconProps} style={{ ...iconProps.style, color: '#239120' }} />;
        case 'php':
            return <Code {...iconProps} style={{ ...iconProps.style, color: '#777bb4' }} />;
        case 'rb':
        case 'ruby':
            return <Code {...iconProps} style={{ ...iconProps.style, color: '#cc342d' }} />;
        case 'go':
            return <Code {...iconProps} style={{ ...iconProps.style, color: '#00add8' }} />;
        case 'rust':
        case 'rs':
            return <Code {...iconProps} style={{ ...iconProps.style, color: '#dea584' }} />;
        case 'swift':
            return <Code {...iconProps} style={{ ...iconProps.style, color: '#fa7343' }} />;
        case 'kt':
        case 'kotlin':
            return <Code {...iconProps} style={{ ...iconProps.style, color: '#7f52ff' }} />;
        case 'dart':
            return <Code {...iconProps} style={{ ...iconProps.style, color: '#0175c2' }} />;
        case 'html':
            return <Html {...iconProps} style={{ ...iconProps.style, color: '#e34f26' }} />;
        case 'css':
        case 'scss':
        case 'sass':
        case 'less':
            return <Css {...iconProps} style={{ ...iconProps.style, color: '#1572b6' }} />;
        case 'json':
            return <DataObject {...iconProps} style={{ ...iconProps.style, color: '#000000' }} />;
        case 'xml':
            return <Description {...iconProps} style={{ ...iconProps.style, color: '#ff6600' }} />;
        case 'yaml':
        case 'yml':
            return <Description {...iconProps} style={{ ...iconProps.style, color: '#cb171e' }} />;
        case 'toml':
        case 'ini':
            return <Settings {...iconProps} style={{ ...iconProps.style, color: '#9c4221' }} />;
        case 'sh':
        case 'bash':
        case 'zsh':
        case 'fish':
        case 'ps1':
        case 'powershell':
            return <Terminal {...iconProps} style={{ ...iconProps.style, color: '#4eaa25' }} />;
        case 'sql':
        case 'mysql':
        case 'postgresql':
        case 'sqlite':
            return <Storage {...iconProps} style={{ ...iconProps.style, color: '#336791' }} />;
        case 'dockerfile':
        case 'docker':
            return <Build {...iconProps} style={{ ...iconProps.style, color: '#2496ed' }} />;
        case 'makefile':
        case 'cmake':
            return <Build {...iconProps} style={{ ...iconProps.style, color: '#427819' }} />;
        default:
            return <Description {...iconProps} />;
    }
};

interface CodeBlockProps {
    language: string;
    code: string;
}

const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

const getLanguageDisplayName = (lang: string): string => {
    const languageMap: { [key: string]: string } = {
        'js': 'JavaScript',
        'javascript': 'JavaScript',
        'ts': 'TypeScript',
        'typescript': 'TypeScript',
        'jsx': 'React JSX',
        'tsx': 'React TSX',
        'py': 'Python',
        'python': 'Python',
        'java': 'Java',
        'cpp': 'C++',
        'c++': 'C++',
        'c': 'C',
        'cs': 'C#',
        'csharp': 'C#',
        'php': 'PHP',
        'rb': 'Ruby',
        'ruby': 'Ruby',
        'go': 'Go',
        'rust': 'Rust',
        'rs': 'Rust',
        'swift': 'Swift',
        'kt': 'Kotlin',
        'kotlin': 'Kotlin',
        'dart': 'Dart',
        'html': 'HTML',
        'css': 'CSS',
        'scss': 'SCSS',
        'sass': 'Sass',
        'less': 'Less',
        'json': 'JSON',
        'xml': 'XML',
        'yaml': 'YAML',
        'yml': 'YAML',
        'toml': 'TOML',
        'ini': 'INI',
        'sh': 'Shell',
        'bash': 'Bash',
        'zsh': 'Zsh',
        'fish': 'Fish',
        'ps1': 'PowerShell',
        'powershell': 'PowerShell',
        'sql': 'SQL',
        'mysql': 'MySQL',
        'postgresql': 'PostgreSQL',
        'sqlite': 'SQLite',
        'text': 'Plain Text',
        'txt': 'Plain Text'
    };

    return languageMap[lang.toLowerCase()] || lang.toUpperCase();
};

const highlightSyntax = (code: string, language: string): string => {
    const lang = language.toLowerCase();
    let highlighted = escapeHtml(code);

    // JavaScript/TypeScript highlighting
    if (['js', 'javascript', 'ts', 'typescript', 'jsx', 'tsx'].includes(lang)) {
        // Keywords
        highlighted = highlighted.replace(
            /\b(const|let|var|function|class|interface|type|enum|import|export|from|default|async|await|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|this|super|extends|implements|public|private|protected|static|readonly|abstract)\b/g,
            '<span class="syntax-keyword">$1</span>'
        );

        // Strings
        highlighted = highlighted.replace(
            /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g,
            '<span class="syntax-string">$1$2$1</span>'
        );

        // Comments
        highlighted = highlighted.replace(
            /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
            '<span class="syntax-comment">$1</span>'
        );

        // Numbers
        highlighted = highlighted.replace(
            /\b(\d+\.?\d*)\b/g,
            '<span class="syntax-number">$1</span>'
        );

        // Functions
        highlighted = highlighted.replace(
            /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
            '<span class="syntax-function">$1</span>'
        );
    }

    // Python highlighting
    else if (['py', 'python'].includes(lang)) {
        // Keywords
        highlighted = highlighted.replace(
            /\b(def|class|import|from|as|if|elif|else|for|while|in|try|except|finally|with|lambda|return|yield|break|continue|pass|and|or|not|is|None|True|False|self|cls)\b/g,
            '<span class="syntax-keyword">$1</span>'
        );

        // Strings
        highlighted = highlighted.replace(
            /(["'])((?:\\.|(?!\1)[^\\])*?)\1/g,
            '<span class="syntax-string">$1$2$1</span>'
        );

        // Comments
        highlighted = highlighted.replace(
            /(#.*$)/gm,
            '<span class="syntax-comment">$1</span>'
        );

        // Numbers
        highlighted = highlighted.replace(
            /\b(\d+\.?\d*)\b/g,
            '<span class="syntax-number">$1</span>'
        );
    }

    // JSON highlighting
    else if (lang === 'json') {
        // Strings (keys and values)
        highlighted = highlighted.replace(
            /(")([^"]*?)(")/g,
            '<span class="syntax-string">$1$2$3</span>'
        );

        // Numbers
        highlighted = highlighted.replace(
            /:\s*(-?\d+\.?\d*)/g,
            ': <span class="syntax-number">$1</span>'
        );

        // Booleans and null
        highlighted = highlighted.replace(
            /\b(true|false|null)\b/g,
            '<span class="syntax-keyword">$1</span>'
        );
    }

    return highlighted;
};

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const highlightedCode = highlightSyntax(code, language);
    const languageName = getLanguageDisplayName(language);
    const languageIcon = getLanguageIcon(language);

    return (
        <div className="code-block">
            <div className="code-header">
                <div className="code-language">
                    {languageIcon}
                    <span>{languageName}</span>
                </div>
                <button
                    className="copy-code-btn"
                    onClick={handleCopy}
                    title="Copy code"
                >
                    {copied ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
            </div>
            <pre>
                <code
                    className={`language-${language}`}
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                />
            </pre>
        </div>
    );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
    const [processedContent, setProcessedContent] = React.useState<React.ReactNode[]>([]);

    React.useEffect(() => {
        const processMarkdown = () => {
            const parts: React.ReactNode[] = [];
            let currentIndex = 0;
            let partIndex = 0;

            // Find all code blocks
            const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
            let match;

            while ((match = codeBlockRegex.exec(content)) !== null) {
                // Add text before code block
                if (match.index > currentIndex) {
                    const textBefore = content.slice(currentIndex, match.index);
                    if (textBefore.trim()) {
                        parts.push(
                            <div
                                key={`text-${partIndex++}`}
                                dangerouslySetInnerHTML={{ __html: renderMarkdownText(textBefore) }}
                            />
                        );
                    }
                }

                // Add code block
                const language = match[1] || 'text';
                const code = match[2].trim();
                parts.push(
                    <CodeBlock
                        key={`code-${partIndex++}`}
                        language={language}
                        code={code}
                    />
                );

                currentIndex = match.index + match[0].length;
            }

            // Add remaining text
            if (currentIndex < content.length) {
                const remainingText = content.slice(currentIndex);
                if (remainingText.trim()) {
                    parts.push(
                        <div
                            key={`text-${partIndex++}`}
                            dangerouslySetInnerHTML={{ __html: renderMarkdownText(remainingText) }}
                        />
                    );
                }
            }

            // If no code blocks found, render as regular markdown
            if (parts.length === 0) {
                parts.push(
                    <div
                        key="text-only"
                        dangerouslySetInnerHTML={{ __html: renderMarkdownText(content) }}
                    />
                );
            }

            setProcessedContent(parts);
        };

        processMarkdown();
    }, [content]);

    const renderMarkdownText = (text: string): string => {
        let html = text;

        // Inline code (`code`)
        html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

        // Bold (**text** or __text__)
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

        // Italic (*text* or _text_)
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

        // Strikethrough (~~text~~)
        html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

        // Headers
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

        // Lists
        html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
        html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
        html = html.replace(/^\+ (.*$)/gm, '<li>$1</li>');
        html = html.replace(/^(\d+)\. (.*$)/gm, '<li class="numbered">$2</li>');

        // Wrap consecutive list items in ul/ol
        html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
            if (match.includes('class="numbered"')) {
                return `<ol>${match.replace(/class="numbered"/g, '')}</ol>`;
            }
            return `<ul>${match}</ul>`;
        });

        // Links [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // Blockquotes
        html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');

        // Horizontal rules
        html = html.replace(/^---$/gm, '<hr>');
        html = html.replace(/^\*\*\*$/gm, '<hr>');

        // Line breaks
        html = html.replace(/\n/g, '<br>');

        return html;
    };

    const escapeHtml = (text: string): string => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    // This function is not used since we already have getLanguageDisplayName above
    // Keeping it for compatibility but removing emoji references

    const highlightSyntax = (code: string, language: string): string => {
        const lang = language.toLowerCase();
        let highlighted = escapeHtml(code);

        // JavaScript/TypeScript highlighting
        if (['js', 'javascript', 'ts', 'typescript', 'jsx', 'tsx'].includes(lang)) {
            // Keywords
            highlighted = highlighted.replace(
                /\b(const|let|var|function|class|interface|type|enum|import|export|from|default|async|await|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|this|super|extends|implements|public|private|protected|static|readonly|abstract)\b/g,
                '<span class="syntax-keyword">$1</span>'
            );

            // Strings
            highlighted = highlighted.replace(
                /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g,
                '<span class="syntax-string">$1$2$1</span>'
            );

            // Comments
            highlighted = highlighted.replace(
                /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
                '<span class="syntax-comment">$1</span>'
            );

            // Numbers
            highlighted = highlighted.replace(
                /\b(\d+\.?\d*)\b/g,
                '<span class="syntax-number">$1</span>'
            );

            // Functions
            highlighted = highlighted.replace(
                /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
                '<span class="syntax-function">$1</span>'
            );
        }

        // Python highlighting
        else if (['py', 'python'].includes(lang)) {
            // Keywords
            highlighted = highlighted.replace(
                /\b(def|class|import|from|as|if|elif|else|for|while|in|try|except|finally|with|lambda|return|yield|break|continue|pass|and|or|not|is|None|True|False|self|cls)\b/g,
                '<span class="syntax-keyword">$1</span>'
            );

            // Strings
            highlighted = highlighted.replace(
                /(["'])((?:\\.|(?!\1)[^\\])*?)\1/g,
                '<span class="syntax-string">$1$2$1</span>'
            );

            // Comments
            highlighted = highlighted.replace(
                /(#.*$)/gm,
                '<span class="syntax-comment">$1</span>'
            );

            // Numbers
            highlighted = highlighted.replace(
                /\b(\d+\.?\d*)\b/g,
                '<span class="syntax-number">$1</span>'
            );
        }

        // CSS highlighting
        else if (['css', 'scss', 'sass', 'less'].includes(lang)) {
            // Properties
            highlighted = highlighted.replace(
                /([a-zA-Z-]+)(\s*:)/g,
                '<span class="syntax-property">$1</span>$2'
            );

            // Values
            highlighted = highlighted.replace(
                /(:\s*)([^;{}]+)(;?)/g,
                '$1<span class="syntax-value">$2</span>$3'
            );

            // Selectors
            highlighted = highlighted.replace(
                /([.#]?[a-zA-Z][a-zA-Z0-9-_]*)\s*(?={)/g,
                '<span class="syntax-selector">$1</span>'
            );

            // Comments
            highlighted = highlighted.replace(
                /(\/\*[\s\S]*?\*\/)/g,
                '<span class="syntax-comment">$1</span>'
            );
        }

        // HTML highlighting
        else if (['html', 'xml'].includes(lang)) {
            // Tags
            highlighted = highlighted.replace(
                /(&lt;\/?)([a-zA-Z][a-zA-Z0-9-]*)(.*?)(&gt;)/g,
                '$1<span class="syntax-tag">$2</span><span class="syntax-attr">$3</span>$4'
            );

            // Attributes
            highlighted = highlighted.replace(
                /([a-zA-Z-]+)(=)(["'])(.*?)\3/g,
                '<span class="syntax-attr-name">$1</span>$2<span class="syntax-string">$3$4$3</span>'
            );

            // Comments
            highlighted = highlighted.replace(
                /(&lt;!--[\s\S]*?--&gt;)/g,
                '<span class="syntax-comment">$1</span>'
            );
        }

        // JSON highlighting
        else if (lang === 'json') {
            // Strings (keys and values)
            highlighted = highlighted.replace(
                /(")([^"]*?)(")/g,
                '<span class="syntax-string">$1$2$3</span>'
            );

            // Numbers
            highlighted = highlighted.replace(
                /:\s*(-?\d+\.?\d*)/g,
                ': <span class="syntax-number">$1</span>'
            );

            // Booleans and null
            highlighted = highlighted.replace(
                /\b(true|false|null)\b/g,
                '<span class="syntax-keyword">$1</span>'
            );
        }

        return highlighted;
    };

    return (
        <div className={`markdown-content ${className}`}>
            {processedContent}
        </div>
    );
};