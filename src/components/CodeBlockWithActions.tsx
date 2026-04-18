import { useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import {
  stackoverflowLight,
  stackoverflowDark,
} from "react-syntax-highlighter/dist/esm/styles/hljs";
import { Check, Copy, Loader2, Play } from "lucide-react";
import type { CodeExecutionResult } from "../types/chat";

export function CodeBlockWithActions({
  language,
  codeText,
  theme,
  runnable,
  onRunCode,
}: {
  language: string;
  codeText: string;
  theme: string;
  runnable: boolean;
  onRunCode?: (
    code: string,
    language: string,
    onStatus?: (status: string) => void,
  ) => Promise<CodeExecutionResult>;
}) {
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [statusText, setStatusText] = useState("Running…");
  const [execResult, setExecResult] = useState<CodeExecutionResult | null>(
    null,
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may not be available */
    }
  };

  const handleRun = async () => {
    if (!onRunCode || running) return;
    setRunning(true);
    setExecResult(null);
    setStatusText("Running…");
    try {
      const result = await onRunCode(codeText, language, (status) =>
        setStatusText(status),
      );
      setExecResult(result);
    } catch {
      setExecResult({
        code: codeText,
        language,
        output: "",
        error: "Execution request failed",
        executionTime: 0,
      });
    } finally {
      setRunning(false);
      setStatusText("Running…");
    }
  };

  return (
    <div className="my-6 rounded-2xl overflow-hidden border border-border shadow-xl group/code">
      <div className="flex items-center justify-between px-4 py-2 text-xs bg-muted text-foreground border-b border-border">
        <span>{language}</span>
        <div className="flex items-center gap-1">
          {runnable && (
            <button
              type="button"
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-background/60 transition-colors text-green-600 dark:text-green-400 disabled:opacity-50"
              aria-label="Run code"
            >
              {running ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Play size={13} fill="currentColor" />
              )}
              <span>{running ? statusText : "Run"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-background/60 transition-colors"
            aria-label="Copy code"
          >
            {copied ? (
              <>
                <Check size={13} className="text-green-500" />
                <span className="text-green-500">Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <SyntaxHighlighter
        language={language}
        style={theme === "dark" ? stackoverflowDark : stackoverflowLight}
        PreTag="pre"
        customStyle={{
          margin: 0,
          padding: "16px",
          fontSize: "0.875rem", // Slightly smaller font usually looks better
          backgroundColor: "transparent",
        }}
        codeTagProps={{
          // Force standard code block behavior to override Tailwind defaults
          style: {
            whiteSpace: "pre",
            display: "block",
            overflowX: "auto",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          },
        }}
      >
        {codeText}
      </SyntaxHighlighter>

      {execResult && (
        <div className="border-t border-border">
          {execResult.output && (
            <div className="px-4 py-2 bg-muted/30">
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono text-green-600 dark:text-green-400">
                {execResult.output}
              </pre>
            </div>
          )}
          {execResult.error && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-950/20">
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono text-red-600 dark:text-red-400">
                {execResult.error}
              </pre>
            </div>
          )}
          <div className="px-4 py-1 text-[10px] text-muted-foreground bg-muted/20 border-t border-border/40">
            Executed in {execResult.executionTime}ms
          </div>
        </div>
      )}
    </div>
  );
}
