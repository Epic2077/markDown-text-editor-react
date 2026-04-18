import React from "react";

import { Kbd, KbdGroup } from "../ui/kdb";
import type { CodeExecutionResult } from "../types/chat";
import { CodeBlockWithActions } from "./CodeBlockWithActions";

/** Languages eligible for the Run button. */
const RUNNABLE_LANGUAGES = new Set([
  "javascript",
  "js",
  "python",
  "py",
  "typescript",
  "ts",
]);

interface MarkdownComponentOptions {
  theme?: string;
  /** Callback invoked when the user clicks "Run" on a code block. */
  onRunCode?: (
    code: string,
    language: string,
    onStatus?: (status: string) => void,
  ) => Promise<CodeExecutionResult>;
}

export function createMarkdownComponents({
  theme = "light",
  onRunCode,
}: MarkdownComponentOptions) {
  return {
    div: ({ children }: { children?: React.ReactNode }) => (
      <div dir="auto" className="bg-muted py-3 px-5">
        {children}
      </div>
    ),
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 dir="auto" className="text-3xl font-medium mt-10 mb-4">
        {children}
      </h1>
    ),

    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 dir="auto" className="text-2xl font-medium mt-8 mb-4">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 dir="auto" className="text-xl font-medium mt-6 mb-3">
        {children}
      </h3>
    ),
    h4: ({ children }: { children?: React.ReactNode }) => (
      <h4 dir="auto" className="text-lg font-medium mt-4 mb-2">
        {children}
      </h4>
    ),
    h5: ({ children }: { children?: React.ReactNode }) => (
      <h5 dir="auto" className="text-base font-medium mt-2 mb-1">
        {children}
      </h5>
    ),
    h6: ({ children }: { children?: React.ReactNode }) => (
      <h6 dir="auto" className="text-sm font-medium mt-1 mb-1">
        {children}
      </h6>
    ),

    // Used a <p> tag instead of <div> for semantic correctness and better bidi support
    p: ({ children }: { children?: React.ReactNode }) => (
      <p dir="auto" className="mb-3">
        {children}
      </p>
    ),

    bold: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-bold text-foreground">{children}</strong>
    ),

    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),

    i: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic text-foreground/90">{children}</em>
    ),

    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic text-foreground/90">{children}</em>
    ),

    u: ({ children }: { children?: React.ReactNode }) => (
      <u className="underline text-foreground/90">{children}</u>
    ),

    mark: ({ children }: { children?: React.ReactNode }) => (
      <mark className="bg-yellow-200 text-yellow-800 px-1 rounded">
        {children}
      </mark>
    ),

    del: ({ children }: { children?: React.ReactNode }) => (
      <del className="line-through opacity-70">{children}</del>
    ),

    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote
        dir="auto"
        className="border-l-4 pl-4 italic my-6 opacity-80"
        style={{ borderColor: "oklch(75% 0.04 60)" }}
      >
        {children}
      </blockquote>
    ),

    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul dir="auto" className="list-disc ml-6 mb-5 space-y-2">
        {children}
      </ul>
    ),

    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol dir="auto" className="list-decimal ml-6 mb-5 space-y-2">
        {children}
      </ol>
    ),

    // Adding explicit li mapping to ensure list items get auto direction
    li: ({ children }: { children?: React.ReactNode }) => (
      <li dir="auto">{children}</li>
    ),

    hr: () => <hr className="my-8 border-foreground" />,

    table: ({ children }: { children?: React.ReactNode }) => (
      <div
        dir="auto"
        className="my-6 overflow-x-auto rounded-xl border border-border shadow-xl"
      >
        <table className="min-w-full text-sm">{children}</table>
      </div>
    ),

    thead: ({ children }: { children?: React.ReactNode }) => (
      <thead className="bg-muted text-foreground">{children}</thead>
    ),

    th: ({
      children,
      align,
    }: {
      children?: React.ReactNode;
      align?: string | null;
    }) => {
      const alignClass =
        align === "center"
          ? "text-center"
          : align === "right"
            ? "text-right"
            : "text-left";
      return (
        <th
          dir="auto"
          className={`${alignClass} px-4 py-2 font-medium border-b border-border`}
        >
          {children}
        </th>
      );
    },

    td: ({
      children,
      align,
    }: {
      children?: React.ReactNode;
      align?: string | null;
    }) => {
      const alignClass =
        align === "center"
          ? "text-center"
          : align === "right"
            ? "text-right"
            : "text-left";
      return (
        <td
          dir="auto"
          className={`${alignClass} px-4 py-2 border-b border-border bg-chat-input`}
        >
          {children}
        </td>
      );
    },

    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4 decoration-muted-foreground/40 hover:decoration-foreground transition-colors"
      >
        {children}
      </a>
    ),

    img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
      const { alt = "", src } = props;
      if (!src) return null;

      return (
        <div className="my-6 rounded-2xl shadow-sm border border-border overflow-hidden">
          <img
            src={String(src)}
            alt={alt}
            width={400}
            height={400}
            className="w-full h-auto object-contain"
          />
        </div>
      );
    },

    kbd: ({ children }: { children?: React.ReactNode }) => (
      <KbdGroup>
        <Kbd>{children}</Kbd>
      </KbdGroup>
    ),

    code({
      inline,
      className,
      children,
    }: {
      inline?: boolean;
      className?: string;
      children?: React.ReactNode;
    }) {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "text";
      const rawText = Array.isArray(children)
        ? children.join("")
        : String(children ?? "");
      const codeText = rawText.replace(/\n$/, "");

      if (!inline && (match || codeText.includes("\n"))) {
        const isRunnable = onRunCode && RUNNABLE_LANGUAGES.has(language);
        return (
          <CodeBlockWithActions
            language={language}
            codeText={codeText}
            theme={theme}
            runnable={!!isRunnable}
            onRunCode={onRunCode}
          />
        );
      }

      return (
        <code className="bg-neutral-950 px-2 py-1 rounded-md text-sm font-mono">
          {children}
        </code>
      );
    },
    pre({ children }: { children?: React.ReactNode }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const child = React.Children.only(children) as any;
      const className = child.props.className || "";
      const match = /language-(\w+)/.exec(className);
      const language = match ? match[1] : "text";
      const rawText = Array.isArray(child.props.children)
        ? child.props.children.join("")
        : String(child.props.children ?? "");
      const codeText = rawText.replace(/\n$/, "");

      const isRunnable = onRunCode && RUNNABLE_LANGUAGES.has(language);

      return (
        <CodeBlockWithActions
          language={language}
          codeText={codeText}
          theme={theme}
          runnable={!!isRunnable}
          onRunCode={onRunCode}
        />
      );
    },
  };
}
