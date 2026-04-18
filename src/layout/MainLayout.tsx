import { Link, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { useState } from "react";
import { useNotes } from "../hooks/useNotes";
import {
  ArrowLeftCircle,
  ArrowRightCircle,
  Trash2Icon,
  FileText,
  Plus,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/Tooltip";

export default function MainLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const { notes, deleteNote } = useNotes();

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

  return (
    <div className="flex h-screen bg-neutral-900 w-full">
      <aside
        className={`${
          open ? "w-72" : "w-16"
        } bg-neutral-900 border-r border-neutral-800 flex flex-col transition-all duration-200`}
      >
        {/* Sidebar header */}
        <div className="h-14 border-b border-neutral-800 flex items-center justify-between px-4">
          {open && (
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <FileText className="w-5 h-5 text-neutral-400" />
              <span className="font-semibold text-white">Notes</span>
            </div>
          )}
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
          >
            {open ? (
              <ArrowLeftCircle className="w-5 h-5" />
            ) : (
              <ArrowRightCircle className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* New note button */}
        {open && (
          <div className="p-3 border-b border-neutral-800">
            <Button
              onClick={() => navigate("/new")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              New Note
            </Button>
          </div>
        )}

        {/* Notes list */}
        <nav className="flex-1 overflow-y-auto p-2">
          {open ? (
            <div className="space-y-1">
              {notes.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-sm">
                  No notes yet
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="group relative rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    <Link to={`/note/${note.id}`} className="block p-3 pr-10">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-white truncate">
                            {note.title || "Untitled"}
                          </h3>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {formatDate(note.updatedAt)}
                          </p>
                        </div>
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
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-neutral-700 transition-all"
                          >
                            <Trash2Icon className="w-4 h-4 text-red-400" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Delete note</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {notes.slice(0, 5).map((note) => (
                <TooltipProvider key={note.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={`/note/${note.id}`}
                        className="block p-3 rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-neutral-400 mx-auto" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {note.title || "Untitled"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
