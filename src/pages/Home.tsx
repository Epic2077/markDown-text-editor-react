// Home.tsx
import { useNotes } from "../hooks/useNotes";
import NoteCard from "../components/noteCard";
import { FileText } from "lucide-react";

export default function Home() {
  const { notes } = useNotes();

  return (
    <div className="h-full p-8 overflow-auto">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">All Notes</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </p>
        </div>

        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FileText className="w-12 h-12 text-neutral-700 mb-4" />
            <p className="text-neutral-400 font-medium">No notes yet</p>
            <p className="text-neutral-600 text-sm mt-1">
              Create your first note to get started
            </p>
          </div>
        ) : (
          <div className="columns-1 lg:columns-2 gap-4 space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="break-inside-avoid">
                <NoteCard note={note} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
