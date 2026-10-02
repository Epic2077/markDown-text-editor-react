import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";

import remarkMath from "remark-math";
import remarkDeflist from "remark-deflist";
import remarkSupersub from "remark-supersub";
import remarkAbbr from "@syenchuk/remark-abbr";
import remarkEmoji from "remark-emoji";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkDirective from "remark-directive";

import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";

import "katex/dist/katex.min.css";
import remarkGfm from "remark-gfm";
import { useCallback, useEffect, useMemo, useState } from "react";

import { executeCode } from "../lib/codeExecutor";
import { createMarkdownComponents } from "../components/markDown";
import type { CodeExecutionResult } from "../types/chat";
import { useNotes } from "../hooks/useNotes";
import {
  Pencil,
  ArrowLeft,
  Clock,
  FileText,
  Star,
  Hash,
  Link2,
  X,
  Plus,
  Share2,
} from "lucide-react";
import { Button } from "../ui/Button";
import { ExportMenu } from "../components/ExportMenu";
import ShareNoteModal from "../components/ShareNoteModal";
import NoteAgent from "../components/NoteAgent";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function Note() {
  const {
    notes,
    togglePin,
    addTag,
    removeTag,
    markViewed,
    getBacklinks,
    getNotePermission,
    isNoteOwner,
  } = useNotes();
  const { id } = useParams();
  const navigate = useNavigate();
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const note = notes.find((note) => note.id === id);
  const canEdit = id ? getNotePermission(id) === "editor" : false;

  // Mark as viewed
  useEffect(() => {
    if (id) markViewed(id);
  }, [id, markViewed]);

  useEffect(() => {
    if (!id || !isSupabaseConfigured) return;
    const channel = supabase
      .channel(`note-view-${id}`)
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

  const backlinks = useMemo(
    () => (id ? getBacklinks(id) : []),
    [id, getBacklinks],
  );

  // Process content to replace [[wiki-links]] with clickable links
  const processedContent = useMemo(() => {
    if (!note) return "";
    return note.content.replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
      const linked = notes.find(
        (n) => n.title.toLowerCase() === title.toLowerCase(),
      );
      if (linked) {
        return `[${title}](/note/${linked.id})`;
      }
      return `**${title}**`;
    });
  }, [note, notes]);

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

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-neutral-900 text-neutral-400">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-red-500/10 rounded-full blur-2xl scale-150" />
          <div className="relative p-5 rounded-2xl bg-neutral-800/60 border border-neutral-700/50">
            <FileText className="w-8 h-8 text-neutral-500" />
          </div>
        </div>
        <p className="text-lg font-semibold text-neutral-300 mb-2">
          Note not found
        </p>
        <p className="text-sm text-neutral-500 mb-6">
          This note may have been deleted or moved
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/50 hover:border-neutral-600 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to notes
        </Link>
      </div>
    );
  }

  const handleAddTag = () => {
    if (tagInput.trim() && id) {
      addTag(id, tagInput);
      setTagInput("");
      setShowTagInput(false);
    }
  };

  const sanitizeSchema = {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      div: [...(defaultSchema.attributes?.div || []), "style", "className"],
      span: [...(defaultSchema.attributes?.span || []), "style", "className"],
      code: [...(defaultSchema.attributes?.code || []), "className"],
      pre: [...(defaultSchema.attributes?.pre || []), "className"],
      kbd: ["className"],
      mark: ["className"],
      math: ["xmlns", "display"],
      semantics: [],
      mrow: [],
      mi: [],
      mo: [],
      mn: [],
      msup: [],
      msub: [],
      mfrac: [],
      msqrt: [],
      mtext: [],
      annotation: ["encoding"],
    },
    tagNames: [
      ...(defaultSchema.tagNames || []),
      "math",
      "semantics",
      "mrow",
      "mi",
      "mo",
      "mn",
      "msup",
      "msub",
      "mfrac",
      "msqrt",
      "mtext",
      "annotation",
    ],
  };

  const remarkPlugins = [
    remarkGfm,
    remarkMath,
    remarkDeflist,
    remarkAbbr,
    remarkSupersub,
    remarkDirective,
    remarkEmoji,
  ];

  const rehypePlugins = [
    rehypeRaw,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [rehypeSanitize, sanitizeSchema] as any,
    rehypeKatex,
  ];

  return (
    <div className="flex flex-col w-full h-screen bg-neutral-900 text-white">
      {/* Header */}
      <div className="relative border-b border-neutral-800/60">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-800/40 to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-neutral-800 rounded-lg transition-all duration-200 flex-shrink-0 text-neutral-400 hover:text-white"
              title="Back to notes"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="h-5 w-px bg-neutral-800" />
            <h1 className="text-base font-semibold truncate text-neutral-100">
              {note.title || "Untitled"}
            </h1>
            {note.pinned && (
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-neutral-500">
              <Clock className="w-3 h-3" />
              {formatDate(note.updatedAt)}
            </span>
            <button
              onClick={() => id && togglePin(id)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                note.pinned
                  ? "text-amber-400 hover:bg-amber-400/10"
                  : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
              }`}
              title={note.pinned ? "Unpin note" : "Pin note"}
            >
              <Star
                className={`w-4 h-4 ${note.pinned ? "fill-amber-400" : ""}`}
              />
            </button>
            <ExportMenu note={note} />
            {isNoteOwner(note.id) && (
              <button
                onClick={() => setShareOpen(true)}
                className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
                title="Share note"
              >
                <Share2 className="h-4 w-4" />
              </button>
            )}
            {canEdit && (
              <Button
                onClick={() => navigate(`/edit/${id}`)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 flex-shrink-0 text-sm font-medium shadow-lg shadow-blue-600/10"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tags bar */}
      {(note.tags.length > 0 || showTagInput) && (
        <div className="px-6 py-2 border-b border-neutral-800/40 flex items-center gap-2 flex-wrap">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400/90 border border-blue-500/20 group/tag"
            >
              <Hash className="w-3 h-3" />
              {tag}
              {canEdit && (
                <button
                  onClick={() => id && removeTag(id, tag)}
                  className="ml-0.5 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
          {canEdit && showTagInput ? (
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
          ) : canEdit ? (
            <button
              onClick={() => setShowTagInput(true)}
              className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-400 transition-colors px-1.5 py-1"
            >
              <Plus className="w-3 h-3" />
              Add tag
            </button>
          ) : null}
        </div>
      )}

      {/* No tags — show add button inline */}
      {canEdit && note.tags.length === 0 && !showTagInput && (
        <div className="px-6 py-2 border-b border-neutral-800/40">
          <button
            onClick={() => setShowTagInput(true)}
            className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            <Hash className="w-3 h-3" />
            Add tags…
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto px-8 py-10">
          <ReactMarkdown
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
            components={createMarkdownComponents({
              theme: "dark",
              onRunCode: handleRunCode,
            })}
          >
            {processedContent || "*This note is empty*"}
          </ReactMarkdown>

          {/* Backlinks */}
          {backlinks.length > 0 && (
            <div className="mt-12 pt-6 border-t border-neutral-800/60">
              <h3 className="text-sm font-semibold text-neutral-400 mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Backlinks
                <span className="text-xs font-normal text-neutral-600">
                  ({backlinks.length})
                </span>
              </h3>
              <div className="space-y-2">
                {backlinks.map((bl) => (
                  <Link
                    key={bl.id}
                    to={`/note/${bl.id}`}
                    className="flex items-start gap-2.5 p-3 rounded-lg hover:bg-neutral-800/50 border border-transparent hover:border-neutral-700/40 transition-all group"
                  >
                    <FileText className="w-4 h-4 text-neutral-600 mt-0.5 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-300 group-hover:text-white truncate transition-colors">
                        {bl.title || "Untitled"}
                      </p>
                      <p className="text-xs text-neutral-600 mt-0.5 line-clamp-1">
                        {bl.content.slice(0, 100)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {shareOpen && (
        <ShareNoteModal noteId={note.id} onClose={() => setShareOpen(false)} />
      )}
      <NoteAgent
        title={note.title || "Untitled note"}
        content={note.content}
        mode="view"
      />
    </div>
  );
}
