import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ code, language, onChange }) => {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    
    // Apply additional editor configurations
    setTimeout(() => {
      editor.layout(); // Force layout recalculation
      editor.focus();   // Focus the editor
    }, 100);
  };

  // Update editor layout on window resize
  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getLanguageForMonaco = (language) => {
    const languageMap = {
      javascript: 'javascript',
      python: 'python',
      cpp: 'cpp',
      java: 'java'
    };
    return languageMap[language] || 'javascript';
  };

  // Define editor theme based on language
  const getEditorTheme = () => {
    return 'vs'; // Using light theme (vs) instead of vs-dark
  };

  return (
    <div className="h-full w-full bg-white">
      <Editor
        height="calc(100vh - 300px)"
        language={getLanguageForMonaco(language)}
        value={code}
        theme={getEditorTheme()}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          fontSize: 14,
          automaticLayout: true,
          wordWrap: 'on',
          tabSize: 2,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
            alwaysConsumeMouseWheel: false
          },
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "on",
          folding: true,
          renderIndentGuides: true,
          lineDecorationsWidth: 6,
          fixedOverflowWidgets: true,
          contextmenu: true,
          bracketPairColorization: { enabled: true },
          padding: { top: 5 }
        }}
      />
    </div>
  );
};

export default CodeEditor; 