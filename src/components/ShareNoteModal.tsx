import { useState, type FormEvent } from "react";
import { Check, LoaderCircle, Share2, Trash2, X } from "lucide-react";
import {
  type NoteShare,
  type SharePermission,
  useNoteSharing,
} from "../hooks/useNoteSharing";

interface ShareNoteModalProps {
  noteId: string;
  onClose: () => void;
}

export default function ShareNoteModal({
  noteId,
  onClose,
}: ShareNoteModalProps) {
  const { shares, loading, error, shareNote, removeShare } =
    useNoteSharing(noteId);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<SharePermission>("viewer");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleShare = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    const didShare = await shareNote(email, permission);
    setSuccess(didShare);
    setSaving(false);
    if (didShare) setEmail("");
  };

  const handleRemove = async (share: NoteShare) => {
    await removeShare(share.userId);
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
            <Share2 className="h-4 w-4 text-blue-400" />
            <h2 className="font-semibold text-white">Share note</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-white"
            aria-label="Close sharing dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form
          onSubmit={handleShare}
          className="space-y-3 border-b border-neutral-800 px-5 py-5"
        >
          <label className="block text-sm text-neutral-300">
            Account email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              placeholder="reader@example.com"
              className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-white outline-none focus:border-blue-500"
            />
          </label>
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
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              Share
            </button>
          </div>
          {success && (
            <p className="flex items-center gap-1 text-sm text-emerald-400">
              <Check className="h-4 w-4" /> Shared successfully
            </p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>

        <div className="px-5 py-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            People with access
          </h3>
          {loading ? (
            <p className="text-sm text-neutral-500">Loading...</p>
          ) : shares.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Only you can access this note.
            </p>
          ) : (
            <div className="space-y-2">
              {shares.map((share) => (
                <div
                  key={share.userId}
                  className="flex items-center justify-between rounded-lg bg-neutral-800/60 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm text-neutral-200">{share.email}</p>
                    <p className="text-xs text-neutral-500">
                      {share.permission === "editor" ? "Can edit" : "Can view"}
                    </p>
                  </div>
                  <button
                    onClick={() => void handleRemove(share)}
                    className="rounded-md p-1.5 text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
                    aria-label={`Remove ${share.email}`}
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
