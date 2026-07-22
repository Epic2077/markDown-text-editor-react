import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { noteTemplates } from "../lib/templates";
import { useNotes } from "../hooks/useNotes";
import { X, FileText } from "lucide-react";

interface TemplatePickerModalProps {
  open: boolean;
  onClose: () => void;
}

export function TemplatePickerModal({
  open,
  onClose,
}: TemplatePickerModalProps) {
  const navigate = useNavigate();
  const { createNote, updateNote } = useNotes();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSelect = (templateId: string) => {
    const template = noteTemplates.find((t) => t.id === templateId);
    if (!template) return;

    const title = template.getTitle();
    const content = template.getContent();
    const newId = createNote(title);
    updateNote(newId, { content });
    onClose();
    navigate(`/edit/${newId}`);
  };

  const handleBlank = () => {
    onClose();
    navigate("/new");
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-neutral-900 border border-neutral-700/60 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/60">
          <div>
            <h2 className="text-lg font-bold text-white">
              Choose a Template
            </h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              Start with a structure or create a blank note
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto custom-scrollbar p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Blank note card */}
            <button
              onClick={handleBlank}
              className="group flex flex-col items-start gap-2 p-4 rounded-xl border border-dashed border-neutral-700/50 hover:border-neutral-500/60 bg-neutral-800/20 hover:bg-neutral-800/50 transition-all duration-200 text-left"
            >
              <div className="p-2.5 rounded-lg bg-neutral-800/60 group-hover:bg-neutral-700/60 transition-colors">
                <FileText className="w-5 h-5 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-300 group-hover:text-white transition-colors">
                  Blank Note
                </p>
                <p className="text-xs text-neutral-600 mt-0.5 line-clamp-2">
                  Start from scratch
                </p>
              </div>
            </button>

            {/* Template cards */}
            {noteTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelect(template.id)}
                className="group flex flex-col items-start gap-2 p-4 rounded-xl border border-neutral-700/40 hover:border-blue-500/30 bg-neutral-800/20 hover:bg-neutral-800/50 transition-all duration-200 text-left"
              >
                <div className="p-2.5 rounded-lg bg-neutral-800/60 group-hover:bg-blue-500/10 transition-colors">
                  <span className="text-lg">{template.emoji}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-300 group-hover:text-white transition-colors">
                    {template.name}
                  </p>
                  <p className="text-xs text-neutral-600 mt-0.5 line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
