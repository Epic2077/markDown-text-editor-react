// NoteCard.tsx
import { Trash2Icon, FileText, Clock, Star, Hash } from "lucide-react";
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
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

export default function NoteCard({ note }: NoteCardProps) {
  const { deleteNote, togglePin } = useNotes();

  return (
    <div className="group w-full relative rounded-xl bg-neutral-800/40 border border-neutral-700/40 hover:border-neutral-600/60 hover:bg-neutral-800/70 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5">
      <Link to={`/note/${note.id}`} className="block p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/10 flex-shrink-0">
            <FileText className="w-4 h-4 text-blue-400/80" />
          </div>
          <h2 className="font-semibold text-[15px] text-neutral-100 truncate pt-1 flex-1 leading-snug">
            {note.title || "Untitled"}
          </h2>
          {note.pinned && (
            <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0 mt-1.5" />
          )}
        </div>

        {/* Content preview */}
        <div className="max-h-40 w-full overflow-hidden text-neutral-400 note-card-preview">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {note.content?.trim() || "No content"}
          </ReactMarkdown>
          <div className="absolute bottom-[3.25rem] left-0 right-0 h-10 bg-gradient-to-t from-neutral-800/90 to-transparent pointer-events-none opacity-0 group-hover:from-neutral-800 transition-colors" />
        </div>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {note.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400/80 border border-blue-500/15"
              >
                <Hash className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-[11px] text-neutral-600">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-700/30">
          <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
            <Clock className="w-3 h-3" />
            {formatDate(note.updatedAt)}
          </span>
          <span className="text-[11px] text-neutral-600 font-mono tabular-nums">
            {note.content?.length ?? 0} chars
          </span>
        </div>
      </Link>

      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  togglePin(note.id);
                }}
                className={`p-1.5 rounded-lg border border-transparent transition-all duration-200 ${
                  note.pinned
                    ? "text-amber-400 hover:bg-amber-400/10 hover:border-amber-500/20"
                    : "hover:bg-neutral-700/50 hover:border-neutral-600/30 text-neutral-500"
                }`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${note.pinned ? "fill-amber-400" : ""}`}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {note.pinned ? "Unpin" : "Pin"} note
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  deleteNote(note.id);
                }}
                className="p-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
              >
                <Trash2Icon className="w-3.5 h-3.5 text-red-400/80" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Delete note</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
