import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Note } from "../types/note";
import { useAuth } from "./useAuth";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const NOTES_UPDATED_EVENT = "notes-updated";

interface NoteRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  created_at: number;
  updated_at: number;
  last_viewed_at: number | null;
  sort_order: number;
}

// Migrate old notes that lack new fields
function migrateNote(note: Note): Note {
  return {
    ...note,
    tags: note.tags ?? [],
    pinned: note.pinned ?? false,
    lastViewedAt: note.lastViewedAt ?? undefined,
  };
}

function fromRow(row: NoteRow): Note {
  return migrateNote({
    id: row.id,
    title: row.title,
    content: row.content,
    tags: row.tags ?? [],
    pinned: row.pinned,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    lastViewedAt:
      row.last_viewed_at == null ? undefined : Number(row.last_viewed_at),
  });
}

function toRow(note: Note, userId: string, sortOrder: number) {
  return {
    id: note.id,
    user_id: userId,
    title: note.title,
    content: note.content,
    tags: note.tags,
    pinned: note.pinned,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
    last_viewed_at: note.lastViewedAt ?? null,
    sort_order: sortOrder,
  };
}

function toDatabaseUpdates(updates: Partial<Note>, updatedAt: number) {
  return {
    ...(updates.title === undefined ? {} : { title: updates.title }),
    ...(updates.content === undefined ? {} : { content: updates.content }),
    ...(updates.tags === undefined ? {} : { tags: updates.tags }),
    ...(updates.pinned === undefined ? {} : { pinned: updates.pinned }),
    ...(updates.createdAt === undefined
      ? {}
      : { created_at: updates.createdAt }),
    ...(updates.lastViewedAt === undefined
      ? {}
      : { last_viewed_at: updates.lastViewedAt }),
    updated_at: updatedAt,
  };
}

function notifyNotesChanged() {
  window.dispatchEvent(new Event(NOTES_UPDATED_EVENT));
}

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteOrder, setNoteOrder] = useState<string[]>([]);
  const pendingCreates = useRef(new Map<string, Promise<void>>());

  const loadNotes = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setNotes([]);
      setNoteOrder([]);
      return;
    }

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: false });
    if (error) {
      console.error("Unable to load notes", error);
      return;
    }

    const rows = (data ?? []) as NoteRow[];
    setNotes(rows.map(fromRow));
    setNoteOrder(rows.map((row) => row.id));
  }, [user]);

  useEffect(() => {
    const loadTask = window.setTimeout(() => void loadNotes(), 0);
    const syncNotes = () => void loadNotes();
    window.addEventListener(NOTES_UPDATED_EVENT, syncNotes);
    return () => {
      window.clearTimeout(loadTask);
      window.removeEventListener(NOTES_UPDATED_EVENT, syncNotes);
    };
  }, [loadNotes]);

  const createNote = useCallback(
    (title: string) => {
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
      if (user && isSupabaseConfigured) {
        const insertPromise = (async () => {
          const { error } = await supabase
            .from("notes")
            .insert(toRow(newNote, user.id, Date.now()));
          if (error) console.error("Unable to create note", error);
          notifyNotesChanged();
        })();
        pendingCreates.current.set(newNote.id, insertPromise);
        void insertPromise.finally(() =>
          pendingCreates.current.delete(newNote.id),
        );
      }
      return newNote.id;
    },
    [user],
  );

  const updateNote = useCallback(
    (id: string, updates: Partial<Note>) => {
      const updatedAt = Date.now();
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id ? { ...note, ...updates, updatedAt } : note,
        ),
      );
      if (user && isSupabaseConfigured) {
        void (async () => {
          await pendingCreates.current.get(id);
          const { error } = await supabase
            .from("notes")
            .update(toDatabaseUpdates(updates, updatedAt))
            .eq("id", id)
            .eq("user_id", user.id);
          if (error) console.error("Unable to update note", error);
          notifyNotesChanged();
        })();
      }
    },
    [user],
  );

  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => prev.filter((note) => note.id !== id));
      setNoteOrder((prev) => prev.filter((nid) => nid !== id));
      if (user && isSupabaseConfigured) {
        void supabase
          .from("notes")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id)
          .then(({ error }) => {
            if (error) console.error("Unable to delete note", error);
          });
      }
    },
    [user],
  );

  const togglePin = useCallback(
    (id: string) => {
      const note = notes.find((item) => item.id === id);
      if (note) updateNote(id, { pinned: !note.pinned });
    },
    [notes, updateNote],
  );

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

  const markViewed = useCallback(
    (id: string) => {
      updateNote(id, { lastViewedAt: Date.now() });
    },
    [updateNote],
  );

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
  const reorderNotes = useCallback(
    (orderedIds: string[]) => {
      setNoteOrder(orderedIds);
      if (user && isSupabaseConfigured) {
        void Promise.all(
          orderedIds.map((id, index) =>
            supabase
              .from("notes")
              .update({ sort_order: orderedIds.length - index })
              .eq("id", id)
              .eq("user_id", user.id),
          ),
        ).then(() => notifyNotesChanged());
      }
    },
    [user],
  );

  const importNotes = useCallback(
    (imported: Note[]) => {
      if (!user || !isSupabaseConfigured || imported.length === 0) return;
      const notesToImport = imported.map((note) => ({
        ...migrateNote(note),
        id: crypto.randomUUID(),
        createdAt: note.createdAt || Date.now(),
        updatedAt: note.updatedAt || Date.now(),
      }));
      setNotes((prev) => [...notesToImport, ...prev]);
      setNoteOrder((prev) => [
        ...notesToImport.map((note) => note.id),
        ...prev,
      ]);
      void supabase
        .from("notes")
        .insert(
          notesToImport.map((note, index) =>
            toRow(note, user.id, Date.now() + imported.length - index),
          ),
        )
        .then(({ error }) => {
          if (error) console.error("Unable to import notes", error);
          notifyNotesChanged();
        });
    },
    [user],
  );

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
    importNotes,
  };
}
