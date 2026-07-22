import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, Hash, Star, X } from "lucide-react";
import { useNotes } from "../hooks/useNotes";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { notes } = useNotes();

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return notes.slice(0, 8);
    const q = query.toLowerCase();
    return notes
      .filter(
        (note) =>
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q) ||
          note.tags.some((t) => t.includes(q)),
      )
      .slice(0, 12);
  }, [query, notes]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      navigate(`/note/${results[selectedIndex].id}`);
      onClose();
    }
  };

  if (!open) return null;

  const getMatchSnippet = (content: string, q: string): string | null => {
    if (!q.trim()) return null;
    const idx = content.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return null;
    const start = Math.max(0, idx - 40);
    const end = Math.min(content.length, idx + q.length + 40);
    let snippet = content.slice(start, end);
    if (start > 0) snippet = "…" + snippet;
    if (end < content.length) snippet = snippet + "…";
    return snippet;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-700/60 rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-neutral-800/60">
          <Search className="w-4 h-4 text-neutral-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search notes by title, content, or tag…"
            className="flex-1 py-3.5 bg-transparent text-sm text-white outline-none placeholder:text-neutral-500"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700/50 text-neutral-500">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto custom-scrollbar py-1">
          {results.length === 0 ? (
            <div className="py-8 text-center text-sm text-neutral-500">
              No notes found
            </div>
          ) : (
            results.map((note, i) => {
              const snippet = getMatchSnippet(note.content, query);
              return (
                <button
                  key={note.id}
                  onClick={() => {
                    navigate(`/note/${note.id}`);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors ${
                    i === selectedIndex
                      ? "bg-neutral-800/80"
                      : "hover:bg-neutral-800/40"
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {note.pinned ? (
                      <Star className="w-4 h-4 text-amber-400/80 fill-amber-400/80" />
                    ) : (
                      <FileText className="w-4 h-4 text-neutral-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-200 truncate">
                        {note.title || "Untitled"}
                      </span>
                      {note.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {note.tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400/80"
                            >
                              <Hash className="w-2.5 h-2.5" />
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {snippet && (
                      <p className="text-xs text-neutral-500 mt-0.5 truncate">
                        {snippet}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-neutral-800/60 px-4 py-2 flex items-center gap-4 text-[10px] text-neutral-600">
          <span>
            <kbd className="font-mono px-1 py-0.5 rounded bg-neutral-800 border border-neutral-700/50">
              ↑↓
            </kbd>{" "}
            Navigate
          </span>
          <span>
            <kbd className="font-mono px-1 py-0.5 rounded bg-neutral-800 border border-neutral-700/50">
              ↵
            </kbd>{" "}
            Open
          </span>
          <span>
            <kbd className="font-mono px-1 py-0.5 rounded bg-neutral-800 border border-neutral-700/50">
              Esc
            </kbd>{" "}
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
