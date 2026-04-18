// NoteCard.tsx
import { Trash2Icon, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/Tooltip";
import type { Note } from "../types/note";
import { useNotes } from "../hooks/useNotes";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface NoteCardProps {
  note: Note;
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function NoteCard({ note }: NoteCardProps) {
  const { deleteNote } = useNotes();

  return (
    <div className="group w-full relative bg-neutral-800/50 border border-neutral-700/50 rounded-xl hover:border-neutral-600 hover:bg-neutral-800 transition-all duration-150">
      <Link to={`/note/${note.id}`} className="block p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-neutral-700/50 flex-shrink-0">
            <FileText className="w-4 h-4 text-neutral-400" />
          </div>
          <h2 className="font-medium text-white truncate pt-1 flex-1">
            {note.title || "Untitled"}
          </h2>
        </div>

        <div className="max-h-96 w-full truncate">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {note.content?.trim() || "No content"}
          </ReactMarkdown>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-700/50">
          <span className="text-xs text-neutral-600">
            {formatDate(note.updatedAt)}
          </span>
          <span className="text-xs text-neutral-700">
            {note.content?.length ?? 0} chars
          </span>
        </div>
      </Link>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.preventDefault();
                deleteNote(note.id);
              }}
              className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
            >
              <Trash2Icon className="w-4 h-4 text-red-400" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Delete note</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
