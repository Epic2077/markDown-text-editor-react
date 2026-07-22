# Knowledge Base — Todo

## UI / Design (professional polish)

- [ ] **Design system tokens** — consolidate typography (base 18px vs editor 0.875rem clash in `index.css`), spacing, radii, and colors into CSS vars. Pick one scale.
- [ ] **Dark/light mode toggle** — currently hard-coded dark (neutral-900/800). Add a theme context + toggle in the sidebar.
- [ ] **Consistent page containers** — `Home.tsx` uses `max-w-5xl`, `Note.tsx` uses `max-w-4xl`, `EditNote.tsx` has none. Unify via a `<PageShell>` layout.
- [ ] **Typography pass** — define a heading/body/mono scale; use it in the markdown renderer and editor.
- [ ] **Empty & loading states** — skeletons for the note list, nicer empty state in editor, loading indicator when switching notes.
- [ ] **Error boundaries** — wrap routes; currently missing notes render silently.
- [ ] **Responsive sidebar** — convert to a proper drawer on mobile; `columns-1 lg:columns-2` on Home is brittle — switch to a CSS grid with a min card width.
- [ ] **Toolbar polish** — color picker in `Toolbar.tsx:209-226` needs ARIA labels, focus trap, keyboard nav; show disabled state when editor isn't focused.
- [ ] **Icon + button consistency** — audit all buttons use the `Button` component (some places use raw `<button>`).
- [ ] **NoteCard refinements** — better preview truncation, hover affordances, delete confirm.

## Features to add

- [ ] **Full-text search** — Cmd/Ctrl+K palette across titles + content.
- [ ] **Tags / folders** — add `tags: string[]` to `note.ts`, filter UI in sidebar.
- [ ] **Favorites / pinned notes** — star icon on NoteCard, pinned section in sidebar.
- [ ] **Recently viewed** — track last-opened, show in sidebar.
- [ ] **Backlinks & `[[wiki-links]]`** — parse `[[Title]]` in markdown, show backlinks panel.
- [ ] **Export** — single note → `.md` / `.html` / `.pdf`; bulk JSON export/import for backup.
- [ ] **Keyboard shortcuts** — Cmd+K (search), Cmd+N (new), Cmd+B/I/K formatting, `?` to show cheatsheet.
- [ ] **Revision history** — snapshot on save so the 2s auto-save can't silently destroy work.
- [ ] **Templates / snippet library** — starter templates for daily notes, meeting notes, etc.
- [ ] **Drag-to-reorder** notes in sidebar.

## Code quality

- [ ] **Strip `any`** — `EditNote.tsx:178`, `markDown.tsx:250`, `Note.tsx:100`.
- [ ] **Dead code** — inline `NewNote.tsx` (5-line re-export), delete unused `App.tsx` ("Tailwind Works!") and unused `rtlDetect.ts`.
- [ ] **Deduplicate `formatDate`** — duplicated in `MainLayout.tsx` and `noteCard.tsx`; move to `lib/date.ts`.
- [ ] **Rename** `newNote` / `ToolBarProps` for PascalCase consistency.
- [ ] **Guard `localStorage`** — wrap writes for quota errors; surface a toast.
- [ ] **Clipboard + worker errors** — `CodeBlockWithActions.tsx:40` and `codeExecutor.ts:127` swallow errors silently; add user-facing feedback.
- [ ] **Extract constants** — `AUTO_SAVE_DELAY`, language list, etc.
- [ ] **Monaco dependency** — in `package.json` but unused; remove it.
- [ ] **Tests** — zero test files. At minimum add tests for `useNotes` CRUD and markdown rendering.

## Architecture

- [ ] **State layer** — `useNotes` uses localStorage + storage events; consider migrating to a proper store (Zustand) before adding search/tags/backlinks.
- [ ] **Prop drilling** — `onRunCode` threads through Toolbar → markDown → CodeBlockWithActions; use context.
- [ ] **Persistence abstraction** — put a repository layer between hooks and localStorage so cloud sync can drop in later.
