import type { Note } from "../types/note";

export function exportAsMarkdown(note: Note): void {
  const frontmatter = [
    "---",
    `title: "${note.title}"`,
    `tags: [${note.tags.map((t) => `"${t}"`).join(", ")}]`,
    `created: ${new Date(note.createdAt).toISOString()}`,
    `updated: ${new Date(note.updatedAt).toISOString()}`,
    "---",
    "",
  ].join("\n");

  const blob = new Blob([frontmatter + note.content], {
    type: "text/markdown;charset=utf-8",
  });
  downloadBlob(blob, `${sanitizeFilename(note.title)}.md`);
}

export function exportAsHtml(note: Note): void {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(note.title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #e5e5e5; background: #171717; }
    h1 { border-bottom: 1px solid #333; padding-bottom: 0.5rem; }
    pre { background: #262626; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    code { font-family: ui-monospace, monospace; font-size: 0.875rem; }
    a { color: #60a5fa; }
    blockquote { border-left: 3px solid #404040; padding-left: 1rem; color: #a3a3a3; }
    .meta { color: #737373; font-size: 0.875rem; margin-bottom: 2rem; }
  </style>
</head>
<body>
  <h1>${escapeHtml(note.title)}</h1>
  <div class="meta">
    ${note.tags.length > 0 ? `Tags: ${note.tags.join(", ")} · ` : ""}
    Updated: ${new Date(note.updatedAt).toLocaleDateString()}
  </div>
  <div>${markdownToBasicHtml(note.content)}</div>
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  downloadBlob(blob, `${sanitizeFilename(note.title)}.html`);
}

export function exportAllAsJson(notes: Note[]): void {
  const data = {
    exportedAt: new Date().toISOString(),
    version: 1,
    notes: notes,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  downloadBlob(blob, `knowledge-base-export-${Date.now()}.json`);
}

export function importFromJson(file: File): Promise<Note[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        const notes: Note[] = Array.isArray(data.notes)
          ? data.notes
          : Array.isArray(data)
            ? data
            : [];
        if (notes.length === 0) {
          reject(new Error("No notes found in the imported file."));
          return;
        }
        // Validate and assign new IDs to prevent collisions
        const imported = notes.map((n) => ({
          id: crypto.randomUUID(),
          title: String(n.title || "Imported Note"),
          content: String(n.content || ""),
          tags: Array.isArray(n.tags) ? n.tags.map(String) : [],
          pinned: Boolean(n.pinned),
          createdAt: typeof n.createdAt === "number" ? n.createdAt : Date.now(),
          updatedAt: Date.now(),
        }));
        resolve(imported);
      } catch {
        reject(new Error("Invalid JSON file."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

// Helpers
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
  return (
    (name || "untitled").replace(/[^a-zA-Z0-9_\- ]/g, "").trim() || "untitled"
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Minimal markdown → HTML for export (no external deps)
function markdownToBasicHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}
