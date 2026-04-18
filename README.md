# 📝 Markdown Knowledge Base

> ⚠️ **Beta** — This project is actively being developed. Features may change and rough edges exist. Feedback and contributions are very welcome!

A fast, privacy-first markdown note-taking app that lives entirely in your browser. Write notes in Markdown, preview them instantly, and even **run code** — all without sending a single byte to any server.

---

## ✨ Features

### 🖊️ Rich Markdown Editor
- Powered by [CodeMirror 6](https://codemirror.net/) with the **One Dark** theme
- Syntax highlighting in the editor for Markdown
- Tab-based **Editor / Preview** split — switch between writing and reading with one click
- Full toolbar for common formatting: Bold, Italic, Strikethrough, Headings (H1–H3), Bullet & Numbered Lists, Task Lists, Blockquotes, Inline Code, Code Blocks, Links, and Images

### 🚀 In-Browser Code Execution
Run code snippets directly from your notes — **no server, no setup**:

| Language | Runtime |
|---|---|
| JavaScript | Native Web Worker sandbox |
| TypeScript | Transpiled & run in a Web Worker |
| Python | [Pyodide](https://pyodide.org/) (CPython → WebAssembly) |

Each code block in the preview gets a **Run** button. Output and errors appear inline, right below the block. A hard timeout prevents infinite loops from hanging your browser.

### 🗒️ Note Management
- Create, edit, and delete notes
- Notes are stored in **localStorage** — your data never leaves your device
- **Auto-save** kicks in 2 seconds after you stop typing
- **Manual save** with `Ctrl+S` / `Cmd+S`
- Notes are sorted by last-modified time

### 🌐 Multilingual & RTL Support
- Auto-detects RTL languages (Arabic, Hebrew, Persian, …) and applies correct text direction
- Ships with the [Vazirmatn](https://rastikerdar.github.io/vazirmatn/) font for excellent Arabic/Persian rendering
- Every block element uses `dir="auto"` for seamless bidirectional content

### 📐 Extended Markdown Syntax
Beyond standard CommonMark, the renderer supports:

| Extension | What it adds |
|---|---|
| **GFM** | Tables, task lists, strikethrough |
| **KaTeX** | Inline & block math — `$E=mc^2$` |
| **Emoji** | `:rocket:` → 🚀 |
| **Superscript / Subscript** | `H~2~O`, `x^2^` |
| **Definition Lists** | `term\n: definition` |
| **Abbreviations** | `*[HTML]: HyperText Markup Language` |
| **Directives** | Custom block/inline containers |

### 🎨 Polished UI
- Dark theme throughout
- Code blocks display the language label with **Copy** and **Run** buttons
- Syntax highlighting in the preview via [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)
- Responsive masonry-style note grid on the home screen

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v3 |
| Markdown editor | CodeMirror 6 (`@uiw/react-codemirror`) |
| Rich editor (bundled) | Monaco Editor |
| Markdown rendering | react-markdown + remark/rehype plugins |
| Math rendering | KaTeX |
| Code execution | Web Workers + Pyodide (WASM) |
| Icons | Lucide React |
| Routing | React Router v7 |
| Persistence | Browser localStorage |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- npm (or your preferred package manager)

### Installation

```bash
# Clone the repository
git clone https://github.com/Epic2077/markDown-text-editor-react.git
cd markDown-text-editor-react

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

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
