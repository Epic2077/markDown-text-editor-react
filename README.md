# 📝 Markdown Knowledge Base

> ⚠️ **Beta** — This project is actively being developed. Features may change and rough edges exist. Feedback and contributions are very welcome!

A markdown knowledge base with Supabase Auth and Postgres persistence. Write notes in Markdown, preview them instantly, and run code locally in browser workers.

---

## ✨ Features

### 🖊️ Rich Markdown Editor

- Powered by [CodeMirror 6](https://codemirror.net/) with the **One Dark** theme
- Syntax highlighting in the editor for Markdown
- Tab-based **Editor / Preview** split — switch between writing and reading with one click
- Full toolbar for common formatting: Bold, Italic, Strikethrough, Headings (H1–H3), Bullet & Numbered Lists, Task Lists, Blockquotes, Inline Code, Code Blocks, Links, and Images

### 🚀 In-Browser Code Execution

Run code snippets directly from your notes — **no server, no setup**:

| Language   | Runtime                                                 |
| ---------- | ------------------------------------------------------- |
| JavaScript | Native Web Worker sandbox                               |
| TypeScript | Transpiled & run in a Web Worker                        |
| Python     | [Pyodide](https://pyodide.org/) (CPython → WebAssembly) |

Each code block in the preview gets a **Run** button. Output and errors appear inline, right below the block. A hard timeout prevents infinite loops from hanging your browser.

### 🗒️ Note Management

- Create, edit, and delete notes
- Notes are stored in Supabase and isolated per signed-in user with Row Level Security
- Email/password login and signup are required to access notes
- **Auto-save** kicks in 2 seconds after you stop typing
- **Manual save** with `Ctrl+S` / `Cmd+S`
- Notes are sorted by last-modified time

### Contextual note agent

- The **Ask agent** widget answers questions using the note currently being viewed or edited
- Edit mode includes suggested prompts and an **Insert into editor** action
- The browser sends at most 24,000 note characters, approximately 6,000 tokens, plus the question and up to four short conversation turns
- The agent returns up to 900 output tokens, so a typical request stays around 7,000 to 8,000 tokens before provider-specific overhead

### 🌐 Multilingual & RTL Support

- Auto-detects RTL languages (Arabic, Hebrew, Persian, …) and applies correct text direction
- Ships with the [Vazirmatn](https://rastikerdar.github.io/vazirmatn/) font for excellent Arabic/Persian rendering
- Every block element uses `dir="auto"` for seamless bidirectional content

### 📐 Extended Markdown Syntax

Beyond standard CommonMark, the renderer supports:

| Extension                   | What it adds                         |
| --------------------------- | ------------------------------------ |
| **GFM**                     | Tables, task lists, strikethrough    |
| **KaTeX**                   | Inline & block math — `$E=mc^2$`     |
| **Emoji**                   | `:rocket:` → 🚀                      |
| **Superscript / Subscript** | `H~2~O`, `x^2^`                      |
| **Definition Lists**        | `term\n: definition`                 |
| **Abbreviations**           | `*[HTML]: HyperText Markup Language` |
| **Directives**              | Custom block/inline containers       |

### 🎨 Polished UI

- Dark theme throughout
- Code blocks display the language label with **Copy** and **Run** buttons
- Syntax highlighting in the preview via [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)
- Responsive masonry-style note grid on the home screen

---

## 🛠️ Tech Stack

| Layer                 | Technology                             |
| --------------------- | -------------------------------------- |
| Framework             | React 19 + TypeScript                  |
| Build tool            | Vite                                   |
| Styling               | Tailwind CSS v3                        |
| Markdown editor       | CodeMirror 6 (`@uiw/react-codemirror`) |
| Rich editor (bundled) | Monaco Editor                          |
| Markdown rendering    | react-markdown + remark/rehype plugins |
| Math rendering        | KaTeX                                  |
| Code execution        | Web Workers + Pyodide (WASM)           |
| Icons                 | Lucide React                           |
| Routing               | React Router v7                        |
| Persistence           | Supabase Postgres + Row Level Security |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 20.19
- npm (or your preferred package manager)

### Installation

```bash
# Clone the repository
git clone https://github.com/Epic2077/markDown-text-editor-react.git
cd markDown-text-editor-react/knowledge-base

# Install dependencies
npm install

# Start the development server
npm run dev
```

Create `.env.local` from `.env.example` and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` before using login or signup. For the database migration and Vercel deployment steps, see the setup guide below.

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

### Vercel and Supabase setup

1. Run [`supabase/migrations/20261001000000_create_notes.sql`](supabase/migrations/20261001000000_create_notes.sql) in the Supabase SQL Editor.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to Vercel Project Settings > Environment Variables for Preview and Production.
3. In Supabase Authentication > URL Configuration, add both your Vercel URL and local URL to the allowed redirect URLs.
4. In Vercel, use the `knowledge-base` directory as the project root if the repository contains the parent directory, with `npm run build` and `dist` as the output directory.

### Agent setup

Add these Vercel environment variables. `API_KEY` must be a server-only variable and must never use a `VITE_` prefix:

```text
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
API_KEY=your-liara-api-key
MODEL_NAME=deepseek/deepseek-v4-flash
```

The Vercel function is [`api/agent.ts`](api/agent.ts). It calls the Liara OpenAI-compatible endpoint, validates the Supabase access token before calling the model, and keeps `API_KEY` on the server so only signed-in users can use it. Local Vite development does not run Vercel functions; use `vercel dev` locally or deploy a preview to test the complete agent flow.

### Sharing notes

Run [`supabase/migrations/20261002000000_add_note_sharing.sql`](supabase/migrations/20261002000000_add_note_sharing.sql) after the original notes migration. Note owners can share with an existing account email as either **Can view** or **Can edit**. Shared notes appear automatically for recipients.

The editor subscribes to Supabase Realtime updates. Saves also include a revision check, so when two people edit the same note, the stale save is rejected instead of silently overwriting the newer database revision. The current editor keeps its unsaved text and shows a conflict notice so the user can reload and merge deliberately.

---

## 📋 Roadmap (Beta)

- [ ] Tags & search/filter for notes
- [ ] Export notes as `.md` or PDF
- [ ] Themes (light mode, custom color schemes)
- [ ] Image attachments stored locally
- [ ] Cloud sync / import-export
- [ ] More runnable languages (Go, Ruby, …)
- [ ] Vim / Emacs keybinding modes

---

## 🤝 Contributing

This project is in **beta** and all kinds of contributions are welcome — bug reports, feature requests, and pull requests alike.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push and open a Pull Request

---

## 📄 License

This project is open-source. See the [LICENSE](LICENSE) file for details.

---

<p align="center">Made with ❤️ — still cooking 🍳</p>
