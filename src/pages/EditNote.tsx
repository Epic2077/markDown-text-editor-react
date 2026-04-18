import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeMirror, {
  EditorView,
  type ReactCodeMirrorRef,
} from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";

import remarkMath from "remark-math";
import remarkDeflist from "remark-deflist";
import remarkSupersub from "remark-supersub";
import remarkAbbr from "@syenchuk/remark-abbr";
import remarkEmoji from "remark-emoji";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkDirective from "remark-directive";
import remarkBreaks from "remark-breaks";

import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";

import "katex/dist/katex.min.css";

import { Toolbar } from "../components/Toolbar";
import { createMarkdownComponents } from "../components/markDown";
import type { CodeExecutionResult } from "../types/chat";
import { executeCode } from "../lib/codeExecutor";
import { useNotes } from "../hooks/useNotes";
import "@fontsource/vazirmatn/index.css";

const AUTO_SAVE_DELAY = 2000; // 2 seconds

export default function NoteEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notes, createNote, updateNote } = useNotes();

  const [title, setTitle] = useState<string>("");
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [content, setContent] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const noteIdRef = useRef<string | null>(id || null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing note if editing
  useEffect(() => {
    if (id) {
      const note = notes.find((n) => n.id === id);
      if (note) {
        setTitle(note.title);
        setContent(note.content);
        noteIdRef.current = note.id;
      } else {
        // Note not found, redirect to home
        navigate("/");
      }
    }
  }, [id, notes, navigate]);

  const save = useCallback(
    (currentTitle: string, currentContent: string) => {
      if (!currentTitle.trim() && !currentContent.trim()) return;

      setSaveStatus("saving");

      if (noteIdRef.current === null) {
        const newId = createNote(currentTitle || "Untitled");
        noteIdRef.current = newId;
        updateNote(newId, {
          content: currentContent,
          title: currentTitle || "Untitled",
        });
        // Update URL to reflect the new note ID
        navigate(`/note/${newId}`, { replace: true });
      } else {
        updateNote(noteIdRef.current, {
          title: currentTitle || "Untitled",
          content: currentContent,
        });
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
    [createNote, updateNote, navigate],
  );

  // Auto-save on content or title change
  const scheduleAutoSave = useCallback(
    (currentTitle: string, currentContent: string) => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        save(currentTitle, currentContent);
      }, AUTO_SAVE_DELAY);
    },
    [save],
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);
      scheduleAutoSave(newTitle, content);
    },
    [content, scheduleAutoSave],
  );

  const handleContentChange = useCallback(
    (value: string) => {
      setContent(value);
      scheduleAutoSave(title, value);
    },
    [title, scheduleAutoSave],
  );

  // Ctrl+S / Cmd+S manual save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        save(title, content);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [save, title, content]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  const sanitizeSchema = {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      div: [...(defaultSchema.attributes?.div || []), "style"],
      span: [...(defaultSchema.attributes?.span || []), "style"],
      kbd: ["className"],
      mark: ["className"],
    },
  };

  const transparentTheme = EditorView.theme({
    "&": { background: "transparent !important" },
    ".cm-gutters": { background: "transparent !important", border: "none" },
    ".cm-content": { caretColor: "#fff" },
    ".cm-scroller": { background: "transparent !important" },
    ".cm-line": {
      unicodeBidi: "plaintext",
      textAlign: "start",
    },
  });

  const remarkPlugins = [
    remarkGfm,
    remarkMath,
    remarkDeflist,
    remarkAbbr,
    remarkSupersub,
    remarkDirective,
    remarkEmoji,
    remarkBreaks,
  ];

  const rehypePlugins = [
    rehypeRaw,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [rehypeSanitize, sanitizeSchema] as any,
    rehypeKatex,
  ];

  const handleRunCode = useCallback(
    async (
      code: string,
      language: string,
      onStatus?: (status: string) => void,
    ): Promise<CodeExecutionResult> => {
      return executeCode(code, language, onStatus);
    },
    [],
  );

  const saveStatusLabel = {
    idle: null,
    saving: <span className="text-xs text-neutral-500">Saving...</span>,
    saved: <span className="text-xs text-neutral-500">Saved</span>,
  }[saveStatus];

  return (
    <div className="flex flex-col w-full h-screen bg-neutral-900 text-white">
      {/* Title bar */}
      <div className="border-b border-neutral-700 bg-neutral-800 flex items-center pr-4">
        <input
          className="flex-1 px-6 py-4 text-xl font-semibold bg-transparent outline-none placeholder:text-neutral-500"
          placeholder="Untitled Note"
          value={title}
          onChange={handleTitleChange}
        />
        <div className="flex items-center gap-3">
          {saveStatusLabel}
          <button
            onClick={() => save(title, content)}
            className="px-3 py-1.5 text-xs rounded bg-neutral-700 hover:bg-neutral-600 transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {/* Tabs + Toolbar row */}
      <Toolbar tab={tab} setTab={setTab} editorRef={editorRef} />

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {tab === "editor" ? (
          <CodeMirror
            ref={editorRef}
            value={content}
            height="100%"
            theme={oneDark}
            extensions={[markdown(), transparentTheme]}
            onChange={handleContentChange}
            placeholder="Start writing..."
            className="h-full text-base"
            style={{
              textAlign: "start",
              unicodeBidi: "plaintext",
              fontFamily: '"Vazirmatn", monospace',
            }}
          />
        ) : (
          <div
            className="h-full overflow-auto bg-neutral-900 p-8 auto-dir-markdown"
            style={{ fontFamily: '"Vazirmatn", sans-serif' }}
          >
            <style>{`
              .auto-dir-markdown p, 
              .auto-dir-markdown h1, 
              .auto-dir-markdown h2, 
              .auto-dir-markdown h3, 
              .auto-dir-markdown h4, 
              .auto-dir-markdown h5, 
              .auto-dir-markdown h6, 
              .auto-dir-markdown li {
                unicode-bidi: plaintext;
                text-align: start;
              }
            `}</style>
            <div className="max-w-4xl mx-auto">
              <ReactMarkdown
                remarkPlugins={remarkPlugins}
                rehypePlugins={rehypePlugins}
                components={createMarkdownComponents({
                  theme: "dark",
                  onRunCode: handleRunCode,
                })}
              >
                {content || "*Start writing to see preview...*"}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
