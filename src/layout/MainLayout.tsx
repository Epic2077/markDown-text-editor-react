import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "../ui/Button";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNotes } from "../hooks/useNotes";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Trash2Icon,
  FileText,
  Plus,
  BookOpen,
  Search,
  Star,
  Hash,
  Clock,
  Keyboard,
  X,
  LayoutTemplate,
  GripVertical,
  LogOut,
  Link2,
  GitFork,
  Globe,
  Mail,
  Code2,
  Sparkles,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/Tooltip";
import { CommandPalette } from "../components/CommandPalette";
import { KeyboardShortcutsModal } from "../components/KeyboardShortcutsModal";
import { ExportMenu } from "../components/ExportMenu";
import { TemplatePickerModal } from "../components/TemplatePickerModal";
import type { Note } from "../types/note";
import { useAuth } from "../hooks/useAuth";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 768,
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const {
    notes,
    deleteNote,
    togglePin,
    allTags,
    recentlyViewed,
    reorderNotes,
    importNotes,
    getNotePermission,
    isNoteOwner,
    changedNoteIds,
    clearNoteChange,
  } = useNotes();

  useEffect(() => {
    const match = location.pathname.match(/^\/note\/([^/]+)/);
    if (match) clearNoteChange(match[1]);
  }, [clearNoteChange, location.pathname]);

  // Drag-to-reorder state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverPos, setDragOverPos] = useState<"above" | "below">("below");
  const dragCounterRef = useRef(0);

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
    });
  };

  const isActive = (noteId: string) => location.pathname === `/note/${noteId}`;

  // Global keyboard shortcuts
  const handleGlobalKeys = useCallback(
    (e: KeyboardEvent) => {
      // Cmd/Ctrl+K → search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      // Cmd/Ctrl+N → new note (only when not in an input)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "n" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        navigate("/new");
        return;
      }
      // ? → shortcuts cheatsheet (only when not in an input)
      if (
        e.key === "?" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        setShortcutsOpen(true);
        return;
      }
    },
    [navigate],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [handleGlobalKeys]);

  // Filter notes by selected tag
  const filteredNotes = useMemo(() => {
    if (!selectedTag) return notes;
    return notes.filter((n) => n.tags.includes(selectedTag));
  }, [notes, selectedTag]);

  const pinnedNotes = useMemo(
    () => filteredNotes.filter((n) => n.pinned),
    [filteredNotes],
  );
  const unpinnedNotes = useMemo(
    () => filteredNotes.filter((n) => !n.pinned),
    [filteredNotes],
  );

  // Handle JSON import
  const handleImport = useCallback(
    (imported: Note[]) => {
      importNotes(imported);
    },
    [importNotes],
  );

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, noteId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", noteId);
    setDraggedId(noteId);
    // Make drag image slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedId(null);
    setDragOverId(null);
    dragCounterRef.current = 0;
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, noteId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (noteId === draggedId) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const pos = e.clientY < midY ? "above" : "below";

      setDragOverId(noteId);
      setDragOverPos(pos);
    },
    [draggedId],
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent, noteId: string) => {
      e.preventDefault();
      dragCounterRef.current++;
      if (noteId !== draggedId) {
        setDragOverId(noteId);
      }
    },
    [draggedId],
  );

  const handleDragLeave = useCallback(() => {
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setDragOverId(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string, sectionNotes: Note[]) => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData("text/plain");
      if (!sourceId || sourceId === targetId) return;

      // Only allow reorder within the same section
      const sourceInSection = sectionNotes.some((n) => n.id === sourceId);
      if (!sourceInSection) return;

      const ids = sectionNotes.map((n) => n.id);
      const fromIdx = ids.indexOf(sourceId);
      let toIdx = ids.indexOf(targetId);

      if (fromIdx === -1 || toIdx === -1) return;

      // Remove from old position
      ids.splice(fromIdx, 1);
      // Adjust target index after removal
      toIdx = ids.indexOf(targetId);
      if (dragOverPos === "below") toIdx++;
      ids.splice(toIdx, 0, sourceId);

      // Build the full order: combine pinned + unpinned section IDs
      const allIds = [
        ...pinnedNotes.map((n) => n.id),
        ...unpinnedNotes.map((n) => n.id),
      ];
      // Replace the section that was reordered
      const isPinnedSection = sectionNotes[0]?.pinned;
      const otherSection = isPinnedSection ? unpinnedNotes : pinnedNotes;
      const fullOrder = isPinnedSection
        ? [...ids, ...otherSection.map((n) => n.id)]
        : [...pinnedNotes.map((n) => n.id), ...ids];

      // Add any IDs not currently in the order
      const remaining = allIds.filter((id) => !fullOrder.includes(id));
      reorderNotes([...fullOrder, ...remaining]);

      setDraggedId(null);
      setDragOverId(null);
      dragCounterRef.current = 0;
    },
    [dragOverPos, pinnedNotes, unpinnedNotes, reorderNotes],
  );

  const renderNoteItem = (note: Note, sectionNotes: Note[]) => {
    const isDragging = draggedId === note.id;
    const isOver = dragOverId === note.id && draggedId !== note.id;
    const isShared = getNotePermission(note.id) !== null && !isNoteOwner(note.id);
    const hasChanges = changedNoteIds.includes(note.id);

    return (
      <div
        key={note.id}
        draggable
        onDragStart={(e) => handleDragStart(e, note.id)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, note.id)}
        onDragEnter={(e) => handleDragEnter(e, note.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, note.id, sectionNotes)}
        className={`group relative rounded-lg transition-colors duration-150 ${
          isDragging ? "opacity-50" : ""
        } ${
          isOver && dragOverPos === "above"
            ? "border-t-2 !border-t-blue-500"
            : ""
        } ${
          isOver && dragOverPos === "below"
            ? "border-b-2 !border-b-blue-500"
            : ""
        } ${
          isActive(note.id)
            ? "bg-neutral-800/80 border border-neutral-700/50"
            : "hover:bg-neutral-800/50 border border-transparent"
        }`}
      >
        <Link to={`/note/${note.id}`} className="block p-2.5 pr-9">
          <div className="flex items-start gap-2">
            <GripVertical className="w-3.5 h-3.5 mt-1 flex-shrink-0 text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />
            {note.pinned ? (
              <Star className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400/80 fill-amber-400/80" />
            ) : (
              <FileText
                className={`w-4 h-4 mt-0.5 flex-shrink-0 transition-colors ${
                  isActive(note.id) ? "text-blue-400" : "text-neutral-600"
                }`}
              />
            )}
            <div className="flex-1 min-w-0">
              <h3
                className={`text-sm font-medium truncate ${
                  isActive(note.id) ? "text-white" : "text-neutral-300"
                }`}
              >
                {note.title || "Untitled"}
                {isShared && <Link2 className="ml-1 inline h-3 w-3 text-cyan-400" aria-label="Shared note" />}
                {hasChanges && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" title="Changed since you last opened it" />}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] text-neutral-600">
                  {formatDate(note.updatedAt)}
                </p>
                {note.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    {note.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="text-[9px] px-1 py-px rounded bg-neutral-800 text-neutral-500"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    togglePin(note.id);
                  }}
                  className="p-1 rounded-md hover:bg-neutral-700/60 transition-colors"
                >
                  <Star
                    className={`w-3 h-3 ${
                      note.pinned
                        ? "text-amber-400 fill-amber-400"
                        : "text-neutral-500"
                    }`}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {note.pinned ? "Unpin" : "Pin"} note
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    deleteNote(note.id);
                  }}
                  className="p-1 rounded-md hover:bg-red-500/10 transition-colors"
                >
                  <Trash2Icon className="w-3 h-3 text-red-400/80" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Delete note</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-neutral-900 w-full">
      {/* Command Palette */}
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <KeyboardShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
      <TemplatePickerModal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
      />

      <aside
        className={`${
          open ? "w-72" : "w-[52px]"
        } bg-neutral-950/50 border-r border-neutral-800/60 flex flex-col transition-all duration-300 ease-in-out flex-shrink-0`}
      >
        {/* Sidebar header */}
        <div className="relative h-14 border-b border-neutral-800/60 flex items-center justify-between px-3">
          {open && (
            <div className="flex items-center gap-1.5">
              <div
                className="flex items-center gap-2.5 cursor-pointer group/brand"
                onClick={() => navigate("/")}
              >
                <div className="p-1.5 rounded-lg bg-blue-600/10 group-hover/brand:bg-blue-600/15 transition-colors">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                </div>
                <span className="font-bold text-white text-sm tracking-tight">
                  Notes
                </span>
              </div>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setCreatorOpen((current) => !current);
                }}
                className="rounded-md p-1 text-neutral-600 transition-colors hover:bg-neutral-800 hover:text-cyan-300"
                aria-label="About the creator"
                title="About the creator"
              >
                <Sparkles className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {open && creatorOpen && (
            <div className="absolute left-3 top-12 z-50 w-64 rounded-xl border border-neutral-700 bg-neutral-950 p-3 shadow-2xl shadow-black/40">
              <div className="mb-3 flex items-center gap-2 border-b border-neutral-800 pb-3">
                <div className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Created by</p>
                  <p className="text-sm font-semibold text-white">Ashkan Sadeghi</p>
                </div>
              </div>
              <div className="space-y-1">
                <a href="https://github.com/Epic2077" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white"><GitFork className="h-3.5 w-3.5" /> GitHub</a>
                <a href="https://portfolio-ashkan.vercel.app/" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white"><Globe className="h-3.5 w-3.5" /> Portfolio</a>
                <a href="mailto:epic.2077.uni@gmail.com" className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white"><Mail className="h-3.5 w-3.5" /> Email</a>
                <a href="https://github.com/Epic2077/markDown-text-editor-react" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white"><Code2 className="h-3.5 w-3.5" /> Open-source code</a>
              </div>
            </div>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setOpen((prev) => !prev)}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-500 hover:text-neutral-300"
                >
                  {open ? (
                    <PanelLeftClose className="w-4 h-4" />
                  ) : (
                    <PanelLeftOpen className="w-4 h-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side={open ? "bottom" : "right"}>
                {open ? "Collapse" : "Expand"} sidebar
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Search button + New note + Templates */}
        {open && (
          <div className="p-3 space-y-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800/50 transition-all text-sm text-neutral-500 hover:text-neutral-300"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="flex-1 text-left">Search…</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700/50 text-neutral-600">
                ⌘K
              </kbd>
            </button>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate("/new")}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 flex items-center justify-center gap-2 font-semibold text-sm shadow-lg shadow-blue-600/15 hover:shadow-blue-500/25 transition-all duration-200 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                New Note
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setTemplateOpen(true)}
                      className="px-2.5 py-2.5 rounded-lg border border-neutral-700/50 hover:border-neutral-600 bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-400 hover:text-white transition-all duration-200"
                    >
                      <LayoutTemplate className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>From template</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}

        {!open && (
          <div className="p-2 space-y-2 flex flex-col items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-all"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Search (⌘K)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate("/new")}
                    className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all duration-200 shadow-lg shadow-blue-600/15 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">New Note</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setTemplateOpen(true)}
                    className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-all"
                  >
                    <LayoutTemplate className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">From template</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Tags filter */}
        {open && allTags.length > 0 && (
          <div className="px-3 pb-2">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                Tags
              </span>
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() =>
                    setSelectedTag(selectedTag === tag ? null : tag)
                  }
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full transition-all duration-150 ${
                    selectedTag === tag
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-neutral-800/60 text-neutral-500 hover:text-neutral-300 border border-transparent hover:border-neutral-700/50"
                  }`}
                >
                  <Hash className="w-2.5 h-2.5" />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes list */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2">
          {open ? (
            <div className="space-y-0.5">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <FileText className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                  <p className="text-neutral-500 text-sm">
                    {selectedTag ? "No notes with this tag" : "No notes yet"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Pinned section */}
                  {pinnedNotes.length > 0 && (
                    <>
                      <div className="px-1 pt-2 pb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                          Pinned
                        </span>
                      </div>
                      {pinnedNotes.map((n) => renderNoteItem(n, pinnedNotes))}
                    </>
                  )}

                  {/* Recently viewed section */}
                  {!selectedTag && recentlyViewed.length > 0 && (
                    <>
                      <div className="px-1 pt-3 pb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Recently Viewed
                        </span>
                      </div>
                      {recentlyViewed
                        .filter((n) => !n.pinned)
                        .slice(0, 3)
                        .map((n) => renderNoteItem(n, unpinnedNotes))}
                    </>
                  )}

                  {/* All notes section */}
                  <div className="px-1 pt-3 pb-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                      {selectedTag ? `#${selectedTag}` : "All Notes"}
                    </span>
                  </div>
                  {unpinnedNotes.map((n) => renderNoteItem(n, unpinnedNotes))}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-1 pt-1">
              {notes.slice(0, 6).map((note) => (
                <TooltipProvider key={note.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={`/note/${note.id}`}
                        className={`block p-2.5 rounded-lg transition-all duration-150 ${
                          isActive(note.id)
                            ? "bg-neutral-800/80"
                            : "hover:bg-neutral-800/50"
                        }`}
                      >
                        {note.pinned ? (
                          <Star className="w-4 h-4 mx-auto text-amber-400/80 fill-amber-400/80" />
                        ) : (
                          <FileText
                            className={`w-4 h-4 mx-auto ${
                              isActive(note.id)
                                ? "text-blue-400"
                                : "text-neutral-500"
                            }`}
                          />
                        )}
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

        {/* Bottom actions */}
        {open && (
          <div className="border-t border-neutral-800/60 p-2 flex items-center justify-between">
            <ExportMenu notes={notes} onImport={handleImport} placement="up" />
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShortcutsOpen(true)}
                      className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-all duration-150"
                    >
                      <Keyboard className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Keyboard shortcuts (?)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => void signOut()}
                      className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-all duration-150"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Sign out {user?.email ? `(${user.email})` : ""}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
