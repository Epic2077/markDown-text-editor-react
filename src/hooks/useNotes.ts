import { useCallback, useEffect, useMemo, useState } from "react";
import type { Note } from "../types/note";

const STORAGE_KEY = "knowledge-base-notes";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // 1. Write to localStorage and notify other components
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    // Dispatch a custom event so other hooks know to update
    window.dispatchEvent(new Event("notes-updated"));
  }, [notes]);

  // 2. Listen for changes from other components (or other tabs)
  useEffect(() => {
    const syncNotes = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setNotes((prevNotes) => {
          // Prevent infinite loops by only updating if data actually changed
          if (JSON.stringify(prevNotes) === stored) return prevNotes;
          return JSON.parse(stored);
        });
      }
    };

    window.addEventListener("notes-updated", syncNotes);
    window.addEventListener("storage", syncNotes); // Keeps multiple tabs in sync too!

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
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setNotes((prev) => [newNote, ...prev]);
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
  }, []);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes]);

  return {
    notes: sortedNotes,
    createNote,
    updateNote,
    deleteNote,
  };
}
