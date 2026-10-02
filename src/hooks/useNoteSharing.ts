import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export type SharePermission = "viewer" | "editor";

export interface NoteShare {
  userId: string;
  email: string;
  permission: SharePermission;
}

export function useNoteSharing(noteId: string | undefined) {
  const { user } = useAuth();
  const [shares, setShares] = useState<NoteShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadShares = useCallback(async () => {
    if (!user || !noteId || !isSupabaseConfigured) {
      setShares([]);
      return;
    }
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("note_shares")
      .select("user_id, recipient_email, permission")
      .eq("note_id", noteId)
      .order("created_at", { ascending: true });
    setLoading(false);
    if (loadError) {
      setError(loadError.message);
      return;
    }
    setShares(
      (data ?? []).map((share) => ({
        userId: share.user_id as string,
        email: share.recipient_email as string,
        permission: share.permission as SharePermission,
      })),
    );
  }, [noteId, user]);

  useEffect(() => {
    const loadTask = window.setTimeout(() => void loadShares(), 0);
    return () => window.clearTimeout(loadTask);
  }, [loadShares]);

  const shareNote = useCallback(
    async (email: string, permission: SharePermission) => {
      setError("");
      const { error: shareError } = await supabase.rpc("share_note_by_email", {
        p_note_id: noteId,
        p_email: email,
        p_permission: permission,
      });
      if (shareError) {
        setError(shareError.message);
        return false;
      }
      await loadShares();
      return true;
    },
    [loadShares, noteId],
  );

  const removeShare = useCallback(
    async (sharedUserId: string) => {
      setError("");
      const { error: removeError } = await supabase
        .from("note_shares")
        .delete()
        .eq("note_id", noteId)
        .eq("user_id", sharedUserId);
      if (removeError) {
        setError(removeError.message);
        return false;
      }
      setShares((current) =>
        current.filter((share) => share.userId !== sharedUserId),
      );
      return true;
    },
    [noteId],
  );

  return { shares, loading, error, shareNote, removeShare };
}
