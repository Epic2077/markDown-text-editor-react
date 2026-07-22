import { useCallback, useEffect, useMemo, useState } from "react";
import type { Note } from "../types/note";

const STORAGE_KEY = "knowledge-base-notes";
const ORDER_KEY = "knowledge-base-note-order";

// Migrate old notes that lack new fields
function migrateNote(note: Note): Note {
  return {
    ...note,
    tags: note.tags ?? [],
    pinned: note.pinned ?? false,
    lastViewedAt: note.lastViewedAt ?? undefined,
  };
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Note[]).map(migrateNote) : [];
  });

  const [noteOrder, setNoteOrder] = useState<string[]>(() => {
    const stored = localStorage.getItem(ORDER_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // 1. Write to localStorage and notify other components
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    window.dispatchEvent(new Event("notes-updated"));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(noteOrder));
  }, [noteOrder]);

  // 2. Listen for changes from other components (or other tabs)
  useEffect(() => {
    const syncNotes = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setNotes((prevNotes) => {
          if (JSON.stringify(prevNotes) === stored) return prevNotes;
          return (JSON.parse(stored) as Note[]).map(migrateNote);
        });
      }
    };

    window.addEventListener("notes-updated", syncNotes);
    window.addEventListener("storage", syncNotes);

    return () => {
      window.removeEventListener("notes-updated", syncNotes);
      window.removeEventListener("storage", syncNotes);
    };
  }, []);

  const createNote = useCallback((title: string) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: title,
      content: "",
      tags: [],
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setNoteOrder((prev) => [newNote.id, ...prev]);
    return newNote.id;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note,
      ),
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
    setNoteOrder((prev) => prev.filter((nid) => nid !== id));
  }, []);

  const togglePin = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? { ...note, pinned: !note.pinned, updatedAt: Date.now() }
          : note,
      ),
    );
  }, []);

  const addTag = useCallback((id: string, tag: string) => {
    const normalized = tag.trim().toLowerCase();
    if (!normalized) return;
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id && !note.tags.includes(normalized)
          ? { ...note, tags: [...note.tags, normalized], updatedAt: Date.now() }
          : note,
      ),
    );
  }, []);

  const removeTag = useCallback((id: string, tag: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              tags: note.tags.filter((t) => t !== tag),
              updatedAt: Date.now(),
            }
          : note,
      ),
    );
  }, []);

  const markViewed = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, lastViewedAt: Date.now() } : note,
      ),
    );
  }, []);

  const sortedNotes = useMemo(() => {
    const orderMap = new Map(noteOrder.map((id, i) => [id, i]));
    return [...notes].sort((a, b) => {
      // Pinned first
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      // Then by manual order if available
      const orderA = orderMap.get(a.id) ?? Infinity;
      const orderB = orderMap.get(b.id) ?? Infinity;
      if (orderA !== orderB) return orderA - orderB;
      // Fallback to updatedAt
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, noteOrder]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [notes]);

  const recentlyViewed = useMemo(() => {
    return [...notes]
      .filter((n) => n.lastViewedAt)
      .sort((a, b) => (b.lastViewedAt ?? 0) - (a.lastViewedAt ?? 0))
      .slice(0, 5);
  }, [notes]);

  // Find notes that link to a given note via [[wiki-links]]
  const getBacklinks = useCallback(
    (noteId: string) => {
      const target = notes.find((n) => n.id === noteId);
      if (!target) return [];
      const titleLower = target.title.toLowerCase();
      return notes.filter(
        (n) =>
          n.id !== noteId &&
          n.content.toLowerCase().includes(`[[${titleLower}]]`),
      );
    },
    [notes],
  );

  // Reorder notes by setting the full ordered ID list
  const reorderNotes = useCallback((orderedIds: string[]) => {
    setNoteOrder(orderedIds);
  }, []);

  return {
    notes: sortedNotes,
    allTags,
    recentlyViewed,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    addTag,
    removeTag,
    markViewed,
    getBacklinks,
    reorderNotes,
  };
}
