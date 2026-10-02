// components/Toolbar.tsx
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
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
  Table,
  Palette,
  FileText,
  Loader2,
} from "lucide-react";

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}

export const ToolbarButton = ({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
}: ToolbarButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded-md transition-all duration-150 ${
      disabled
        ? "opacity-50 cursor-not-allowed"
        : isActive
        ? "bg-neutral-700 text-white"
        : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/60"
    }`}
  >
    {children}
  </button>
);

interface ToolBarProps {
  tab: "editor" | "preview";
  setTab: Dispatch<SetStateAction<"editor" | "preview">>;
  editorRef: React.RefObject<ReactCodeMirrorRef | null>;
  onImportPdf?: () => void;
  isImportingPdf?: boolean;
}

// Pre-defined colors for the dropdown
const TEXT_COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Orange", value: "#f97316" },
  { name: "Purple", value: "#a855f7" },
];

export function Toolbar({ tab, setTab, editorRef, onImportPdf, isImportingPdf }: ToolBarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

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

  const wrapWithTags = useCallback(
    (prefix: string, suffix: string) => {
      const view = editorRef.current?.view;
      if (!view) return;

      const { state, dispatch } = view;
      const { from, to } = state.selection.main;
      const selected = state.sliceDoc(from, to);

      const insertion = `${prefix}${selected}${suffix}`;
      const newCursorPos = selected
        ? to + prefix.length + suffix.length
        : from + prefix.length;

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
    <div className="flex flex-wrap items-center border-b border-neutral-800/60 bg-neutral-900/80">
      <div className="flex">
        <button
          onClick={() => setTab("editor")}
          className={`px-5 py-3 text-sm font-medium transition-all duration-200 ${
            tab === "editor"
              ? "text-white border-b-2 border-blue-500"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => setTab("preview")}
          className={`px-5 py-3 text-sm font-medium transition-all duration-200 ${
            tab === "preview"
              ? "text-white border-b-2 border-blue-500"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Preview
        </button>
      </div>

      {tab === "editor" && (
        <div className="flex items-center gap-1 px-4 py-1 flex-wrap">
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

          {/* Color Picker Dropdown Container */}
          <div className="relative flex items-center">
            <ToolbarButton
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Text Color"
              isActive={showColorPicker}
            >
              <Palette size={16} />
            </ToolbarButton>

            {showColorPicker && (
              <>
                {/* Invisible backdrop to close dropdown when clicking outside */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowColorPicker(false)}
                />

                {/* Dropdown Menu */}
                <div className="absolute top-full mt-1 left-0 bg-neutral-800 border border-neutral-600 rounded shadow-xl p-2 flex gap-1.5 z-50">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      title={color.name}
                      onClick={() => {
                        wrapWithTags(
                          `<span style="color: ${color.value};">`,
                          "</span>",
                        );
                        setShowColorPicker(false);
                      }}
                      className="w-5 h-5 rounded-sm border border-neutral-700 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

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

          {/* Code, Links, Images, Tables */}
          <ToolbarButton
            onClick={() => insertMarkdown("`")}
            title="Inline Code"
          >
            <Code size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              insertTemplate(
                "\n<!--- change bash to the language you want to use --> \n```bash\n\n```\n",
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
          {onImportPdf && (
            <ToolbarButton
              onClick={onImportPdf}
              disabled={isImportingPdf}
              title="Import PDF"
            >
              {isImportingPdf ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileText size={16} />
              )}
            </ToolbarButton>
          )}
          <ToolbarButton
            onClick={() =>
              insertTemplate(
                "\n| Header 1 | Header 2 | Header 3 |\n| :--- | :---: | ---: |\n| Text | Text | Text |\n",
                0,
              )
            }
            title="Insert Table"
          >
            <Table size={16} />
          </ToolbarButton>
        </div>
      )}
    </div>
  );
}
