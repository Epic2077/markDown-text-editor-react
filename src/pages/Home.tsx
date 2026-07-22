// Home.tsx
import { useMemo } from "react";
import { useNotes } from "../hooks/useNotes";
import NoteCard from "../components/noteCard";
import { FileText, Sparkles, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { notes } = useNotes();
  const navigate = useNavigate();

  const pinnedNotes = useMemo(() => notes.filter((n) => n.pinned), [notes]);
  const unpinnedNotes = useMemo(() => notes.filter((n) => !n.pinned), [notes]);

  return (
    <div className="h-full overflow-auto custom-scrollbar">
      {/* Header with subtle gradient backdrop */}
      <div className="relative border-b border-neutral-800/60">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/[0.03] to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-8 pt-10 pb-8 relative">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                All Notes
              </h1>
              <p className="text-sm text-neutral-500 mt-2 font-medium">
                {notes.length} {notes.length === 1 ? "note" : "notes"} in your
                collection
              </p>
            </div>
            {notes.length > 0 && (
              <button
                onClick={() => navigate("/new")}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 active:scale-[0.97]"
              >
                + New Note
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl scale-150" />
              <div className="relative p-5 rounded-2xl bg-neutral-800/60 border border-neutral-700/50 backdrop-blur-sm">
                <FileText className="w-8 h-8 text-neutral-400" />
              </div>
            </div>
            <p className="text-lg text-neutral-300 font-semibold">
              No notes yet
            </p>
            <p className="text-neutral-500 text-sm mt-2 max-w-xs leading-relaxed">
              Start capturing your ideas, code snippets, and knowledge
            </p>
            <button
              onClick={() => navigate("/new")}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 active:scale-[0.97]"
            >
              <Sparkles className="w-4 h-4" />
              Create your first note
            </button>
          </div>
        ) : (
          <>
            {/* Pinned notes section */}
            {pinnedNotes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-neutral-400 mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400/80 fill-amber-400/80" />
                  Pinned
                </h2>
                <div className="columns-1 lg:columns-2 gap-5 space-y-5">
                  {pinnedNotes.map((note) => (
                    <div key={note.id} className="break-inside-avoid">
                      <NoteCard note={note} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All other notes */}
            {unpinnedNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <h2 className="text-sm font-semibold text-neutral-400 mb-4">
                    All Notes
                  </h2>
                )}
                <div className="columns-1 lg:columns-2 gap-5 space-y-5">
                  {unpinnedNotes.map((note) => (
                    <div key={note.id} className="break-inside-avoid">
                      <NoteCard note={note} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
