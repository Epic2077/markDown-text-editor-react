import { useState, useRef, useEffect } from "react";
import { Download, FileText, Code, Database, Upload } from "lucide-react";
import type { Note } from "../types/note";
import {
  exportAsMarkdown,
  exportAsHtml,
  exportAllAsJson,
  importFromJson,
} from "../lib/exportUtils";

interface ExportMenuProps {
  /** Pass a single note for per-note export, or omit for bulk */
  note?: Note;
  notes?: Note[];
  onImport?: (notes: Note[]) => void;
  placement?: "down" | "up";
}

export function ExportMenu({
  note,
  notes,
  onImport,
  placement = "down",
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImport) return;
    try {
      const imported = await importFromJson(file);
      onImport(imported);
      setOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Import failed");
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div ref={menuRef} className="relative z-50">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-all duration-150"
        title="Export / Import"
      >
        <Download className="w-4 h-4" />
      </button>

      {open && (
        <div
          className={`absolute left-0 ml-50 w-52 rounded-lg border border-neutral-700/60 bg-neutral-900 py-1 shadow-xl shadow-black/30 z-50 ${
            placement === "up" ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {note && (
            <>
              <button
                onClick={() => {
                  exportAsMarkdown(note);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-neutral-500" />
                Export as Markdown
              </button>
              <button
                onClick={() => {
                  exportAsHtml(note);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
              >
                <Code className="w-3.5 h-3.5 text-neutral-500" />
                Export as HTML
              </button>
              <div className="my-1 border-t border-neutral-800/60" />
            </>
          )}

          {notes && (
            <button
              onClick={() => {
                exportAllAsJson(notes);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-neutral-500" />
              Export all as JSON
            </button>
          )}

          {onImport && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-neutral-500" />
              Import from JSON
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
