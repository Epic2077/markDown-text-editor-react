// components/Toolbar.tsx
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  SquareSlash,
  Link,
  Image,
  CheckSquare,
} from "lucide-react"; // Highly recommend using lucide-react icons

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title?: string;
}

export const ToolbarButton = ({
  onClick,
  isActive = false,
  children,
  title,
}: ToolbarButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded hover:bg-neutral-700 transition-colors ${
      isActive ? "bg-neutral-700 text-white" : "text-neutral-300"
    }`}
  >
    {children}
  </button>
);

interface ToolBarProps {
  tab: "editor" | "preview";
  setTab: Dispatch<SetStateAction<"editor" | "preview">>;
  editorRef: React.RefObject<ReactCodeMirrorRef | null>;
}

export function Toolbar({ tab, setTab, editorRef }: ToolBarProps) {
  const insertMarkdown = useCallback(
    (syntax: string, isPrefix = false) => {
      const view = editorRef.current?.view;
      if (!view) return;

      const { state, dispatch } = view;
      const { from, to } = state.selection.main;
      const selected = state.sliceDoc(from, to);

      let insertion = "";
      let newCursorPos = 0;

      if (isPrefix) {
        insertion = `${syntax}${selected}`;
        newCursorPos = selected ? to + syntax.length : from + syntax.length;
      } else {
        insertion = `${syntax}${selected}${syntax}`;
        newCursorPos = selected ? to + syntax.length * 2 : from + syntax.length;
      }

      dispatch(
        state.update({
          changes: { from, to, insert: insertion },
          selection: { anchor: newCursorPos },
        }),
      );
      view.focus();
    },
    [editorRef],
  );

  const insertTemplate = useCallback(
    (template: string, cursorOffsetBack: number) => {
      const view = editorRef.current?.view;
      if (!view) return;

      const { state, dispatch } = view;
      const { from, to } = state.selection.main;

      dispatch(
        state.update({
          changes: { from, to, insert: template },
          selection: { anchor: from + template.length - cursorOffsetBack },
        }),
      );
      view.focus();
    },
    [editorRef],
  );

  return (
    <div className="flex flex-wrap items-center border-b border-neutral-700 bg-neutral-800">
      <div className="flex">
        <button
          onClick={() => setTab("editor")}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            tab === "editor"
              ? "text-white border-b-2 border-blue-500"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => setTab("preview")}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            tab === "preview"
              ? "text-white border-b-2 border-blue-500"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Preview
        </button>
      </div>

      {tab === "editor" && (
        <div className="flex items-center gap-1 px-4">
          <div className="w-px h-5 bg-neutral-700 mx-1" />

          {/* Text Formatting */}
          <ToolbarButton onClick={() => insertMarkdown("**")} title="Bold">
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={() => insertMarkdown("*")} title="Italic">
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => insertMarkdown("~~")}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </ToolbarButton>

          <div className="w-px h-5 bg-neutral-700 mx-1" />

          {/* Headings */}
          <ToolbarButton
            onClick={() => insertMarkdown("# ", true)}
            title="Heading 1"
          >
            <Heading1 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => insertMarkdown("## ", true)}
            title="Heading 2"
          >
            <Heading2 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => insertMarkdown("### ", true)}
            title="Heading 3"
          >
            <Heading3 size={16} />
          </ToolbarButton>

          <div className="w-px h-5 bg-neutral-700 mx-1" />

          {/* Lists & Quotes */}
          <ToolbarButton
            onClick={() => insertMarkdown("- ", true)}
            title="Bullet List"
          >
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => insertMarkdown("1. ", true)}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => insertMarkdown("- [ ] ", true)}
            title="Task List"
          >
            <CheckSquare size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => insertMarkdown("> ", true)}
            title="Quote"
          >
            <Quote size={16} />
          </ToolbarButton>

          <div className="w-px h-5 bg-neutral-700 mx-1" />

          {/* Code, Links, Images */}
          <ToolbarButton
            onClick={() => insertMarkdown("`")}
            title="Inline Code"
          >
            <Code size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              insertTemplate(
                "\n<!--- change bash to the language you want to use --> \n ```bash \n\n```\n",
                5,
              )
            }
            title="Code Block"
          >
            <SquareSlash size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={() => insertTemplate("[]()", 1)} title="Link">
            <Link size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => insertTemplate("![]()", 1)}
            title="Image"
          >
            <Image size={16} />
          </ToolbarButton>
        </div>
      )}
    </div>
  );
}
