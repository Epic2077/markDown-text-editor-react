import { useEffect } from "react";
import { X, Command } from "lucide-react";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  {
    category: "Navigation",
    items: [
      { keys: ["Ctrl", "K"], description: "Open search palette" },
      { keys: ["Ctrl", "N"], description: "Create new note" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
    ],
  },
  {
    category: "Editor",
    items: [
      { keys: ["Ctrl", "S"], description: "Save note" },
      { keys: ["Ctrl", "B"], description: "Bold text" },
      { keys: ["Ctrl", "I"], description: "Italic text" },
    ],
  },
];

export function KeyboardShortcutsModal({
  open,
  onClose,
}: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-700/60 rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/60">
          <div className="flex items-center gap-2.5">
            <Command className="w-4 h-4 text-neutral-400" />
            <h2 className="text-sm font-semibold text-white">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-5 space-y-5">
          {shortcuts.map((group) => (
            <div key={group.category}>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2.5">
                {group.category}
              </h3>
              <div className="space-y-2">
                {group.items.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-neutral-300">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i}>
                          <kbd className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 text-[11px] font-mono rounded bg-neutral-800 border border-neutral-700/50 text-neutral-400">
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-neutral-600 mx-0.5">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-neutral-800/60 px-5 py-3">
          <p className="text-[11px] text-neutral-600">
            On Mac, use ⌘ instead of Ctrl
          </p>
        </div>
      </div>
    </div>
  );
}
