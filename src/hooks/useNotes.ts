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
  revision: number;
}

type NotePermission = "viewer" | "editor";

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
    revision: Number(row.revision ?? 0),
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
    revision: note.revision ?? 0,
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
  const [permissions, setPermissions] = useState<
    Record<string, NotePermission>
  >({});
  const [owners, setOwners] = useState<Record<string, boolean>>({});
  const [changedNoteIds, setChangedNoteIds] = useState<string[]>([]);
  const pendingCreates = useRef(new Map<string, Promise<void>>());

  const loadNotes = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setNotes([]);
      setNoteOrder([]);
      setPermissions({});
      setOwners({});
      return;
    }

    const [{ data, error }, { data: shareData, error: shareError }] =
      await Promise.all([
        supabase
          .from("notes")
          .select("*")
          .eq("user_id", user.id)
          .order("sort_order", { ascending: false }),
        supabase
          .from("note_shares")
          .select("note_id, permission")
          .eq("user_id", user.id),
      ]);
    if (error) {
      console.error("Unable to load notes", error);
      return;
    }
    if (shareError) {
      console.warn(
        "Note sharing is unavailable until its Supabase migration is applied",
        shareError,
      );
    }

    const ownRows = (data ?? []) as NoteRow[];
    const sharedRows = (shareError ? [] : (shareData ?? [])) as {
      note_id: string;
      permission: NotePermission;
    }[];
    const sharedIds = sharedRows.map((share) => share.note_id);
    let sharedNoteRows: NoteRow[] = [];
    if (sharedIds.length > 0) {
      const { data: sharedData, error: sharedError } = await supabase
        .from("notes")
        .select("*")
        .in("id", sharedIds);
      if (sharedError) {
        console.error("Unable to load shared notes", sharedError);
        return;
      }
      sharedNoteRows = (sharedData ?? []) as NoteRow[];
    }

    const rows = [...ownRows, ...sharedNoteRows];
    setNotes(rows.map(fromRow));
    setNoteOrder(rows.map((row) => row.id));
    setPermissions({
      ...Object.fromEntries(ownRows.map((row) => [row.id, "editor"] as const)),
      ...Object.fromEntries(
        sharedRows.map((share) => [share.note_id, share.permission] as const),
      ),
    });
    setOwners({
      ...Object.fromEntries(ownRows.map((row) => [row.id, true] as const)),
      ...Object.fromEntries(
        sharedRows.map((share) => [share.note_id, false] as const),
      ),
    });
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

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    const channel = supabase
      .channel(`notes-sidebar-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notes" },
        (payload) => {
          const changedId = (payload.new as { id?: string }).id;
          if (changedId) {
            setChangedNoteIds((current) =>
              current.includes(changedId) ? current : [...current, changedId],
            );
            void loadNotes();
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadNotes, user]);

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
        revision: 0,
      };

      setNotes((prev) => [newNote, ...prev]);
      setNoteOrder((prev) => [newNote.id, ...prev]);
      setPermissions((prev) => ({ ...prev, [newNote.id]: "editor" }));
      setOwners((prev) => ({ ...prev, [newNote.id]: true }));
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
    async (id: string, updates: Partial<Note>) => {
      if (permissions[id] !== "editor" && !pendingCreates.current.has(id)) {
        return false;
      }
      const updatedAt = Date.now();
      const currentNote = notes.find((note) => note.id === id);
      const expectedRevision = currentNote?.revision ?? 0;
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id
            ? { ...note, ...updates, updatedAt, revision: expectedRevision + 1 }
            : note,
        ),
      );
      if (user && isSupabaseConfigured) {
        await pendingCreates.current.get(id);
        const { data, error } = await supabase
          .from("notes")
          .update({
            ...toDatabaseUpdates(updates, updatedAt),
            revision: expectedRevision + 1,
          })
          .eq("id", id)
          .eq("revision", expectedRevision)
          .select("revision")
          .maybeSingle();
        if (error || !data) {
          console.error("Note changed before this edit could be saved", error);
          notifyNotesChanged();
          return false;
        }
        notifyNotesChanged();
      }
      return true;
    },
    [notes, permissions, user],
  );

  const deleteNote = useCallback(
    (id: string) => {
      if (permissions[id] !== "editor") return;
      setNotes((prev) => prev.filter((note) => note.id !== id));
      setNoteOrder((prev) => prev.filter((nid) => nid !== id));
      setPermissions((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
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
    [permissions, user],
  );

  const togglePin = useCallback(
    (id: string) => {
      const note = notes.find((item) => item.id === id);
      if (note) updateNote(id, { pinned: !note.pinned });
    },
    [notes, updateNote],
  );

  const addTag = useCallback(
    async (id: string, tag: string) => {
      const normalized = tag.trim().toLowerCase();
      if (!normalized) return;
      const note = notes.find((item) => item.id === id);
      if (note && !note.tags.includes(normalized)) {
        await updateNote(id, { tags: [...note.tags, normalized] });
      }
    },
    [notes, updateNote],
  );

  const removeTag = useCallback(
    async (id: string, tag: string) => {
      const note = notes.find((item) => item.id === id);
      if (note) {
        await updateNote(id, {
          tags: note.tags.filter((item) => item !== tag),
        });
      }
    },
    [notes, updateNote],
  );

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

  const getNotePermission = useCallback(
    (id: string) => permissions[id] ?? null,
    [permissions],
  );

  const isNoteOwner = useCallback(
    (id: string) => owners[id] === true,
    [owners],
  );

  const clearNoteChange = useCallback((id: string) => {
    setChangedNoteIds((current) => current.filter((noteId) => noteId !== id));
  }, []);

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
    getNotePermission,
    isNoteOwner,
    changedNoteIds,
    clearNoteChange,
  };
}
