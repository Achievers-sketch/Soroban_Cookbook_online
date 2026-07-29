import React, { useEffect, useRef, useState } from 'react';
import Layout from '@theme/Layout';
import styles from './playground.module.css';

declare global {
  interface Window {
    require?: {
      config: (cfg: { paths: Record<string, string> }) => void;
      (deps: string[], callback: (monaco: MonacoLike) => void): void;
    };
    monaco?: MonacoLike;
  }
}

type MonacoLike = {
  editor: {
    create: (element: HTMLElement, options: Record<string, unknown>) => MonacoEditorLike;
  };
};

type MonacoEditorLike = {
  dispose: () => void;
  setValue: (value: string) => void;
  getValue: () => string;
};

const TEMPLATE = `#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Symbol, symbol_short};

#[contract]
pub struct HelloContract;

#[contractimpl]
impl HelloContract {
    pub fn hello(_env: Env, _to: Symbol) -> Symbol {
        symbol_short!("Hello")
    }
}
`;

export default function PlaygroundPage(): React.ReactElement {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<MonacoEditorLike | null>(null);
  const [status, setStatus] = useState('Loading Monaco editor…');
  const [isTesting, setIsTesting] = useState(false);
  const [testOutput, setTestOutput] = useState<{status: 'idle' | 'running' | 'success' | 'error', message: React.ReactNode}>({ status: 'idle', message: '' });

  const runMockTests = () => {
    if (!editorRef.current) return;
    setIsTesting(true);
    setTestOutput({ status: 'running', message: 'Compiling project...\nRunning 1 test...' });

    setTimeout(() => {
      const code = editorRef.current?.getValue() || '';
      const isPass = code.includes('#[contractimpl]');
      
      setIsTesting(false);
      if (isPass) {
        setTestOutput({
          status: 'success',
          message: (
            <>
              running 1 test<br />
              test test::test_hello ... <span className={styles.textGreen}>ok</span><br />
              <br />
              test result: <span className={styles.textGreen}>ok</span>. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
            </>
          )
        });
      } else {
        setTestOutput({
          status: 'error',
          message: (
            <>
              running 1 test<br />
              test test::test_hello ... <span className={styles.textRed}>FAILED</span><br />
              <br />
              failures:<br />
              ---- test::test_hello stdout ----<br />
              thread 'test::test_hello' panicked at 'assertion failed'<br />
              <br />
              failures:<br />
              &nbsp;&nbsp;&nbsp;&nbsp;test::test_hello<br />
              <br />
              test result: <span className={styles.textRed}>FAILED</span>. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out
            </>
          )
        });
      }
    }, 1500);
  };

  useEffect(() => {
    let disposed = false;

    const mountEditor = (monaco: MonacoLike) => {
      if (disposed || !hostRef.current) {
        return;
      }

      editorRef.current = monaco.editor.create(hostRef.current, {
        value: TEMPLATE,
        language: 'rust',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
      });
      setStatus('Ready');
    };

    const loadMonaco = () => {
      if (window.monaco) {
        mountEditor(window.monaco);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/monaco-editor@0.52.2/min/vs/loader.js';
      script.async = true;
      script.onload = () => {
        if (!window.require) {
          setStatus('Failed to initialize AMD loader');
          return;
        }

        window.require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.52.2/min/vs' } });
        window.require(['vs/editor/editor.main'], (monaco) => {
          window.monaco = monaco;
          mountEditor(monaco);
        });
      };
      script.onerror = () => setStatus('Failed to load Monaco editor');
      document.body.appendChild(script);
    };

    loadMonaco();

    return () => {
      disposed = true;
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, []);

  return (
    <Layout title="Code Playground" description="In-browser Monaco editor for Soroban snippets">
      <main className={styles.container}>
        <h1 className={styles.title}>Code Playground</h1>
        <p className={styles.subtitle}>
          Monaco-powered playground for editing Soroban Rust snippets directly in the browser.
        </p>
        <div className={styles.toolbar}>
          <span className={styles.status}>{status}</span>
          <div className={styles.buttonGroup}>
            <button
              className={styles.button}
              onClick={() => {
                editorRef.current?.setValue(TEMPLATE);
                setTestOutput({ status: 'idle', message: '' });
              }}>
              Reset Template
            </button>
            <button
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={isTesting || status !== 'Ready'}
              onClick={runMockTests}>
              {isTesting ? 'Running...' : 'Run Tests'}
            </button>
          </div>
        </div>
        <div className={styles.editorHost}>
          <div ref={hostRef} className={styles.editorInner} />
        </div>
        {testOutput.status !== 'idle' && (
          <div className={styles.testOutput}>
            <div className={styles.testOutputHeader}>
              <span>Terminal</span>
              {testOutput.status === 'success' && <span className={styles.textGreen}>Success</span>}
              {testOutput.status === 'error' && <span className={styles.textRed}>Failed</span>}
              {testOutput.status === 'running' && <span>Running...</span>}
            </div>
            <div className={styles.testOutputBody}>
              {testOutput.message}
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
