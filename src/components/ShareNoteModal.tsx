import { useState } from "react";
import { Check, Copy, Link2, LoaderCircle, Trash2, X } from "lucide-react";
import { type SharePermission, useNoteSharing } from "../hooks/useNoteSharing";

interface ShareNoteModalProps {
  noteId: string;
  onClose: () => void;
}

export default function ShareNoteModal({
  noteId,
  onClose,
}: ShareNoteModalProps) {
  const { links, loading, error, createShareLink, revokeShareLink } =
    useNoteSharing(noteId);
  const [permission, setPermission] = useState<SharePermission>("viewer");
  const [saving, setSaving] = useState(false);
  const [createdLink, setCreatedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    const link = await createShareLink(permission);
    setSaving(false);
    if (link) {
      setCreatedLink(`${window.location.origin}/share/${link.token}`);
      setCopied(false);
    }
  };

  const copyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="Close sharing dialog"
      />
      <section className="relative w-full max-w-lg rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl">
        <header className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-blue-400" />
            <h2 className="font-semibold text-white">Share note with a link</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-white"
            aria-label="Close sharing dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="space-y-4 border-b border-neutral-800 px-5 py-5">
          <p className="text-sm leading-relaxed text-neutral-400">
            Anyone with the secret link can join with the permission selected
            below. You can revoke links at any time.
          </p>
          <div className="flex gap-2">
            <select
              value={permission}
              onChange={(event) =>
                setPermission(event.target.value as SharePermission)
              }
              className="flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="viewer">Can view</option>
              <option value="editor">Can edit</option>
            </select>
            <button
              onClick={() => void handleCreate()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              Create link
            </button>
          </div>
          {createdLink && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2">
              <input
                readOnly
                value={createdLink}
                className="min-w-0 flex-1 bg-transparent px-1 text-xs text-emerald-200 outline-none"
              />
              <button
                onClick={() => void copyLink(createdLink)}
                className="rounded-md p-1.5 text-emerald-300 hover:bg-emerald-400/10"
                aria-label="Copy share link"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
        <div className="px-5 py-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Active links
          </h3>
          {loading ? (
            <p className="text-sm text-neutral-500">Loading...</p>
          ) : links.length === 0 ? (
            <p className="text-sm text-neutral-500">No active share links.</p>
          ) : (
            <div className="space-y-2">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-lg bg-neutral-800/60 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm text-neutral-200">Secret link</p>
                    <p className="text-xs text-neutral-500">
                      Can {link.permission === "editor" ? "edit" : "view"}
                    </p>
                  </div>
                  <button
                    onClick={() => void revokeShareLink(link.id)}
                    className="rounded-md p-1.5 text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Revoke share link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
