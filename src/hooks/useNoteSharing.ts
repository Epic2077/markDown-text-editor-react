import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export type SharePermission = "viewer" | "editor";

export interface NoteShareLink {
  id: string;
  permission: SharePermission;
  createdAt: string;
}

export function useNoteSharing(noteId: string | undefined) {
  const { user } = useAuth();
  const [links, setLinks] = useState<NoteShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadLinks = useCallback(async () => {
    if (!user || !noteId || !isSupabaseConfigured) {
      setLinks([]);
      return;
    }
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("note_share_links")
      .select("id, permission, created_at")
      .eq("note_id", noteId)
      .is("revoked_at", null)
      .order("created_at", { ascending: true });
    setLoading(false);
    if (loadError) {
      setError(loadError.message);
      return;
    }
    setLinks(
      (data ?? []).map((link) => ({
        id: link.id as string,
        permission: link.permission as SharePermission,
        createdAt: link.created_at as string,
      })),
    );
  }, [noteId, user]);

  useEffect(() => {
    const loadTask = window.setTimeout(() => void loadLinks(), 0);
    return () => window.clearTimeout(loadTask);
  }, [loadLinks]);

  const createShareLink = useCallback(
    async (permission: SharePermission) => {
      setError("");
      const { data, error: createError } = await supabase.rpc(
        "create_note_share_link",
        { p_note_id: noteId, p_permission: permission },
      );
      if (createError) {
        setError(createError.message);
        return null;
      }
      const created = Array.isArray(data) ? data[0] : data;
      if (!created?.token || !created.link_id) {
        setError("The share link could not be created.");
        return null;
      }
      await loadLinks();
      return {
        id: created.link_id as string,
        token: created.token as string,
        permission: created.permission as SharePermission,
      };
    },
    [loadLinks, noteId],
  );

  const revokeShareLink = useCallback(async (linkId: string) => {
    setError("");
    const { error: revokeError } = await supabase
      .from("note_share_links")
      .delete()
      .eq("id", linkId);
    if (revokeError) {
      setError(revokeError.message);
      return false;
    }
    setLinks((current) => current.filter((link) => link.id !== linkId));
    return true;
  }, []);

  return { links, loading, error, createShareLink, revokeShareLink };
}
