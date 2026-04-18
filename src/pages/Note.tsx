import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";

import remarkMath from "remark-math";
import remarkDeflist from "remark-deflist";
import remarkSupersub from "remark-supersub";
import remarkAbbr from "@syenchuk/remark-abbr";
import remarkEmoji from "remark-emoji";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkDirective from "remark-directive";

import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";

import "katex/dist/katex.min.css";
import remarkGfm from "remark-gfm";
import { useCallback } from "react";

import { executeCode } from "../lib/codeExecutor";
import { createMarkdownComponents } from "../components/markDown";
import type { CodeExecutionResult } from "../types/chat";
import { useNotes } from "../hooks/useNotes";
import { Pencil, ArrowLeft } from "lucide-react";
import { Button } from "../ui/Button";

export default function Note() {
  const { notes } = useNotes();
  const { id } = useParams();
  const navigate = useNavigate();

  const note = notes.find((note) => note.id === id);

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-neutral-900 text-neutral-400">
        <p className="text-lg mb-4">Note not found</p>
        <Link
          to="/"
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
        >
          Go back home
        </Link>
      </div>
    );
  }

  const sanitizeSchema = {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      div: [...(defaultSchema.attributes?.div || []), "style", "className"],
      span: [...(defaultSchema.attributes?.span || []), "style", "className"],
      code: [...(defaultSchema.attributes?.code || []), "className"],
      pre: [...(defaultSchema.attributes?.pre || []), "className"],
      kbd: ["className"],
      mark: ["className"],
      // Allow math elements
      math: ["xmlns", "display"],
      semantics: [],
      mrow: [],
      mi: [],
      mo: [],
      mn: [],
      msup: [],
      msub: [],
      mfrac: [],
      msqrt: [],
      mtext: [],
      annotation: ["encoding"],
    },
    tagNames: [
      ...(defaultSchema.tagNames || []),
      "math",
      "semantics",
      "mrow",
      "mi",
      "mo",
      "mn",
      "msup",
      "msub",
      "mfrac",
      "msqrt",
      "mtext",
      "annotation",
    ],
  };

  const remarkPlugins = [
    remarkGfm,
    remarkMath,
    remarkDeflist,
    remarkAbbr,
    remarkSupersub,
    remarkDirective,
    remarkEmoji,
  ];

  const rehypePlugins = [
    rehypeRaw,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [rehypeSanitize, sanitizeSchema] as any,
    rehypeKatex,
  ];

  const handleRunCode = useCallback(
    async (
      code: string,
      language: string,
      onStatus?: (status: string) => void,
    ): Promise<CodeExecutionResult> => {
      return executeCode(code, language, onStatus);
    },
    [],
  );

  return (
    <div className="flex flex-col w-full h-screen bg-neutral-900 text-white">
      {/* Header with title and actions */}
      <div className="border-b border-neutral-700 bg-neutral-800 h-20  ">
        <div className="flex items-center justify-between px-6 ">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-neutral-700 rounded-lg transition-colors flex-shrink-0"
              title="Back to notes"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold truncate">
              {note.title || "Untitled"}
            </h1>
          </div>
          <Button
            onClick={() => navigate(`/edit/${id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors flex-shrink-0 "
          >
            <Pencil className="w-4 h-4" />
            <span>Edit</span>
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <ReactMarkdown
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
            components={createMarkdownComponents({
              theme: "dark",
              onRunCode: handleRunCode,
            })}
          >
            {note.content || "*This note is empty*"}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
