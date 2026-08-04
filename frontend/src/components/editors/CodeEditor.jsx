import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Copy, Check, Edit3, Eye } from 'lucide-react';
import useVisualizationStore from '../../engine/state';
import './CodeEditor.css';

/**
 * AlgoVerse V2 — Code Editor (Monaco)
 *
 * Displays algorithm code with syntax highlighting, line highlighting,
 * copy functionality, and optional edit mode.
 */
const CodeEditor = ({
  code = '',
  language = 'python',
  readOnly = true,
  height = '100%',
  onCodeChange,
  showControls = true,
}) => {
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);
  const [copied, setCopied] = useState(false);
  const [isEditable, setIsEditable] = useState(!readOnly);
  const [currentCode, setCurrentCode] = useState(code);
  const { codeLine } = useVisualizationStore();

  // Sync code from props
  useEffect(() => {
    if (!isEditable) {
      setCurrentCode(code);
    }
  }, [code, isEditable]);

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define custom dark theme
    monaco.editor.defineTheme('algoverse-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c586c0' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'function', foreground: 'dcdcaa' },
        { token: 'variable', foreground: '9cdcfe' },
      ],
      colors: {
        'editor.background': '#0f172a',
        'editor.foreground': '#e2e8f0',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#94a3b8',
        'editor.lineHighlightBackground': '#1e293b40',
        'editor.selectionBackground': '#3b82f640',
        'editorCursor.foreground': '#8b5cf6',
      },
    });
    monaco.editor.setTheme('algoverse-dark');

    // Set editor options
    editor.updateOptions({
      readOnly: !isEditable,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontLigatures: true,
      lineNumbers: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      renderLineHighlight: 'none',
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      scrollbar: {
        vertical: 'hidden',
        horizontal: 'auto',
      },
      padding: { top: 12, bottom: 12 },
    });
  };

  // Highlight current line when codeLine changes
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    // Clear previous decorations
    editor.deltaDecorations(decorationsRef.current, []);

    if (codeLine !== null && codeLine >= 1 && codeLine <= model.getLineCount()) {
      // Add highlight decoration for current line
      const newDecorations = [
        {
          range: {
            startLineNumber: codeLine,
            startColumn: 1,
            endLineNumber: codeLine,
            endColumn: model.getLineMaxColumn(codeLine),
          },
          options: {
            isWholeLine: true,
            className: 'code-line-highlight',
            overviewRuler: {
              color: '#8b5cf6',
              position: 1,
            },
          },
        },
      ];
      decorationsRef.current = editor.deltaDecorations([], newDecorations);

      // Scroll to highlighted line
      editor.revealLineInCenter(codeLine);
    }
  }, [codeLine]);

  // Update editor content when code changes
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (model && !isEditable && model.getValue() !== code) {
      model.setValue(code);
    }
  }, [code, isEditable]);

  // Copy code to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [currentCode]);

  // Toggle edit mode
  const toggleEdit = useCallback(() => {
    const newEditable = !isEditable;
    setIsEditable(newEditable);
    const editor = editorRef.current;
    if (editor) {
      editor.updateOptions({ readOnly: !newEditable });
      if (!newEditable) {
        setCurrentCode(code); // Reset to original code
      }
    }
  }, [isEditable, code]);

  // Handle code changes in edit mode
  const handleCodeChange = useCallback((value) => {
    setCurrentCode(value);
    onCodeChange?.(value);
  }, [onCodeChange]);

  // Determine language for Monaco
  const monacoLanguage = useMemo(() => {
    const lang = language.toLowerCase();
    if (lang === 'python' || lang === 'py') return 'python';
    if (lang === 'javascript' || lang === 'js') return 'javascript';
    if (lang === 'java') return 'java';
    if (lang === 'cpp' || lang === 'c++') return 'cpp';
    return 'python';
  }, [language]);

  return (
    <div className="code-editor" style={{ height }}>
      {showControls && (
        <div className="code-editor-toolbar">
          <span className="code-editor-lang">{language}</span>
          <div className="code-editor-actions">
            <button
              onClick={toggleEdit}
              className={`code-editor-btn ${isEditable ? 'active' : ''}`}
              title={isEditable ? 'Switch to read-only' : 'Switch to edit mode'}
            >
              {isEditable ? <Eye size={14} /> : <Edit3 size={14} />}
              <span>{isEditable ? 'View' : 'Edit'}</span>
            </button>
            <button onClick={handleCopy} className="code-editor-btn" title="Copy code">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
      )}
      <Editor
        height="100%"
        language={monacoLanguage}
        value={currentCode}
        onChange={handleCodeChange}
        onMount={handleEditorDidMount}
        theme="algoverse-dark"
        options={{
          readOnly: !isEditable,
          fontSize: 13,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
        }}
        loading={
          <div className="code-editor-loading">
            <div className="loading-spinner" />
            <span>Loading editor...</span>
          </div>
        }
      />
    </div>
  );
};

export default CodeEditor;
