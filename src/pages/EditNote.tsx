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
import { Star, Hash, X, Plus, Share2, AlertTriangle } from "lucide-react";
import NoteAgent from "../components/NoteAgent";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import "@fontsource/vazirmatn/index.css";
import ShareNoteModal from "../components/ShareNoteModal";

const AUTO_SAVE_DELAY = 2000; // 2 seconds

export default function NoteEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    notes,
    createNote,
    updateNote,
    togglePin,
    addTag,
    removeTag,
    getNotePermission,
    isNoteOwner,
  } = useNotes();

  const [title, setTitle] = useState<string>("");
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [content, setContent] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "conflict"
  >("idle");
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const noteIdRef = useRef<string | null>(id || null);
  const loadedNoteIdRef = useRef<string | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(id || null);
  const [shareOpen, setShareOpen] = useState(false);
  const permission = id
    ? (getNotePermission(id) ?? (isNoteOwner(id) ? "editor" : null))
    : "editor";
  const readOnly = permission === "viewer";

  const currentNote = notes.find((n) => n.id === (activeNoteId || id));

  // Load existing note if editing
  useEffect(() => {
    if (id) {
      const note = notes.find((n) => n.id === id);
      if (note && loadedNoteIdRef.current !== id) {
        const loadTask = window.setTimeout(() => {
          setTitle(note.title);
          setContent(note.content);
          noteIdRef.current = note.id;
          setActiveNoteId(note.id);
          loadedNoteIdRef.current = id;
        }, 0);
        return () => window.clearTimeout(loadTask);
      } else if (notes.length > 0 && !note) {
        navigate("/");
      }
    }
  }, [id, notes, navigate]);

  useEffect(() => {
    if (id && permission === "viewer") {
      navigate(`/note/${id}`, { replace: true });
    }
  }, [id, navigate, permission]);

  useEffect(() => {
    if (!id || !isSupabaseConfigured) return;
    const channel = supabase
      .channel(`note-editor-${id}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notes",
          filter: `id=eq.${id}`,
        },
        () => window.dispatchEvent(new Event("notes-updated")),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id]);

  const save = useCallback(
    async (currentTitle: string, currentContent: string) => {
      if (!currentTitle.trim() && !currentContent.trim()) return;
      if (readOnly) return;

      setSaveStatus("saving");

      let saved = true;
      if (noteIdRef.current === null) {
        const newId = createNote(currentTitle || "Untitled");
        noteIdRef.current = newId;
        setActiveNoteId(newId);
        saved = await updateNote(newId, {
          content: currentContent,
          title: currentTitle || "Untitled",
        });
        // Update URL to reflect the new note ID
        navigate(`/edit/${newId}`, { replace: true });
      } else {
        saved = await updateNote(noteIdRef.current, {
          title: currentTitle || "Untitled",
          content: currentContent,
        });
      }

      setSaveStatus(saved ? "saved" : "conflict");
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
    [createNote, navigate, readOnly, updateNote],
  );

  // Auto-save on content or title change
  const scheduleAutoSave = useCallback(
    (currentTitle: string, currentContent: string) => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        void save(currentTitle, currentContent);
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

  const insertAgentText = useCallback(
    (text: string) => {
      const nextContent = content.trim() ? `${content}\n\n${text}` : text;
      setContent(nextContent);
      scheduleAutoSave(title, nextContent);
    },
    [content, scheduleAutoSave, title],
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

  // Adds bottom padding so the last lines appear near the middle of the viewport
  const centerTextExtension = EditorView.theme({
    ".cm-content, .cm-scroller": {
      paddingBottom: "45vh !important",
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

  const handleAddTag = () => {
    const nid = noteIdRef.current;
    if (tagInput.trim() && nid) {
      addTag(nid, tagInput);
      setTagInput("");
      setShowTagInput(false);
    }
  };

  const saveStatusLabel = {
    idle: null,
    saving: (
      <span className="text-xs text-neutral-500 font-medium animate-pulse">
        Saving...
      </span>
    ),
    saved: (
      <span className="text-xs text-emerald-500/80 font-medium">Saved</span>
    ),
    conflict: (
      <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
        <AlertTriangle className="h-3.5 w-3.5" />
        Conflict: reload before saving
      </span>
    ),
  }[saveStatus];

  return (
    <div className="flex flex-col w-full h-screen bg-neutral-900 text-white">
      {/* Title bar */}
      <div className="relative border-b border-neutral-800/60">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-800/40 to-transparent pointer-events-none" />
        <div className="relative flex items-center px-4 pr-5 gap-3">
          <input
            className="flex-1 px-3 py-4 text-lg font-semibold bg-transparent outline-none placeholder:text-neutral-600 text-neutral-100 tracking-tight"
            placeholder="Untitled Note"
            value={title}
            onChange={handleTitleChange}
            disabled={readOnly}
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            {activeNoteId && (
              <button
                onClick={() => activeNoteId && togglePin(activeNoteId)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  currentNote?.pinned
                    ? "text-amber-400 hover:bg-amber-400/10"
                    : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
                }`}
                title={currentNote?.pinned ? "Unpin note" : "Pin note"}
              >
                <Star
                  className={`w-4 h-4 ${currentNote?.pinned ? "fill-amber-400" : ""}`}
                />
              </button>
            )}
            {activeNoteId && isNoteOwner(activeNoteId) && (
              <button
                onClick={() => setShareOpen(true)}
                className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
                title="Share note"
              >
                <Share2 className="h-4 w-4" />
              </button>
            )}
            <div className="h-5 w-px bg-neutral-800" />
            {saveStatusLabel}
            <button
              onClick={() => void save(title, content)}
              disabled={readOnly}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/50 hover:border-neutral-600 transition-all duration-200 text-neutral-300 hover:text-white"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Tags bar */}
      {activeNoteId && (
        <div className="px-5 py-2 border-b border-neutral-800/40 flex items-center gap-2 flex-wrap">
          {(currentNote?.tags || []).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400/90 border border-blue-500/20 group/tag"
            >
              <Hash className="w-3 h-3" />
              {tag}
              <button
                onClick={() => activeNoteId && removeTag(activeNoteId, tag)}
                disabled={readOnly}
                className="ml-0.5 opacity-0 group-hover/tag:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {showTagInput ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddTag();
              }}
              className="flex items-center"
            >
              <input
                autoFocus
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onBlur={() => {
                  if (!tagInput.trim()) setShowTagInput(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShowTagInput(false);
                }}
                placeholder="Tag name…"
                className="text-xs bg-transparent border border-neutral-700/50 rounded-full px-2.5 py-1 outline-none text-neutral-300 placeholder:text-neutral-600 w-24 focus:border-blue-500/50"
              />
            </form>
          ) : (
            <button
              onClick={() => setShowTagInput(true)}
              disabled={readOnly}
              className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-400 transition-colors px-1.5 py-1"
            >
              <Plus className="w-3 h-3" />
              Add tag
            </button>
          )}
        </div>
      )}

      {/* Tabs + Toolbar row */}
      <Toolbar tab={tab} setTab={setTab} editorRef={editorRef} />

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {tab === "editor" ? (
          <CodeMirror
            ref={editorRef}
            value={content}
            editable={!readOnly}
            height="100%"
            maxWidth="100%"
            theme={oneDark}
            extensions={[markdown(), transparentTheme, centerTextExtension]}
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
          <div className="h-full overflow-auto custom-scrollbar bg-neutral-900 p-8 auto-dir-markdown">
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
      {shareOpen && activeNoteId && (
        <ShareNoteModal
          noteId={activeNoteId}
          onClose={() => setShareOpen(false)}
        />
      )}
      <NoteAgent
        title={title || "Untitled note"}
        content={content}
        mode="edit"
        onInsert={insertAgentText}
      />
    </div>
  );
}
