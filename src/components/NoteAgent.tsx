import { useState, type FormEvent } from "react";
import { Bot, Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "../lib/supabase";

const MAX_CONTEXT_CHARS = 24_000;

interface NoteAgentProps {
  title: string;
  content: string;
  mode: "view" | "edit";
  onInsert?: (text: string) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestions = {
  view: [
    "Summarize this note",
    "What are the key ideas?",
    "What should I explore next?",
  ],
  edit: [
    "Help me continue this thought",
    "Suggest a clearer structure",
    "Turn this into an action plan",
  ],
};

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

function AgentAvatar({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`agent-float relative inline-flex shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-400/10 text-cyan-300 ${small ? "h-7 w-7" : "h-9 w-9"}`}
      aria-hidden="true"
    >
      <span className="agent-antenna absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-lime-300" />
      <Bot className={small ? "h-4 w-4" : "h-5 w-5"} />
      <span className="agent-blink absolute bottom-1.5 left-1/2 h-0.5 w-2 -translate-x-1/2 rounded-full bg-lime-300/80" />
    </span>
  );
}

export default function NoteAgent({
  title,
  content,
  mode,
  onInsert,
}: NoteAgentProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const context = content.slice(0, MAX_CONTEXT_CHARS);
  const contextTokens = estimateTokens(`${title}\n${context}`);

  const ask = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    const nextMessages = [
      ...messages,
      { role: "user" as const, content: trimmed },
    ];
    setMessages(nextMessages);
    setQuestion("");
    setLoading(true);
    setError("");
    const { data } = await supabase.auth.getSession();
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(data.session?.access_token
            ? { Authorization: `Bearer ${data.session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          note: { title, content: context },
          question: trimmed,
          messages,
        }),
      });
      const result = (await response.json()) as {
        answer?: string;
        error?: string;
        detail?: string;
      };
      if (!response.ok || !result.answer)
        throw new Error(
          [result.error || "The agent could not answer.", result.detail]
            .filter(Boolean)
            .join(" "),
        );
      setMessages([
        ...nextMessages,
        { role: "assistant", content: result.answer },
      ]);
    } catch (requestError) {
      setMessages(messages);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The agent could not answer.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void ask(question);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-950/40 transition hover:bg-blue-500"
          aria-label="Open note agent"
        >
          <AgentAvatar small />
          Ask agent
        </button>
      )}
      {open && (
        <section className="fixed bottom-5 right-5 z-50 flex w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950 shadow-2xl shadow-black/50">
          <header className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <AgentAvatar />
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Pico, your note bot
                </h2>
                <p className="text-[11px] text-neutral-500">
                  Using about {contextTokens.toLocaleString()} context tokens
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-white"
              aria-label="Close note agent"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="max-h-72 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-neutral-400">
                  Ask about this note or get help shaping your next thought.
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions[mode].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => void ask(suggestion)}
                      className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:border-blue-400/50 hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "user"
                    ? "ml-8 rounded-xl bg-blue-600/20 px-3 py-2 text-sm text-blue-100"
                    : "mr-4 rounded-xl bg-neutral-800 px-3 py-2 text-sm leading-relaxed text-neutral-200 whitespace-pre-wrap"
                }
              >
                {message.role === "assistant" && <AgentAvatar small />}
                {message.role === "assistant" ? (
                  <div className="agent-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  message.content
                )}
                {message.role === "assistant" && onInsert && (
                  <button
                    onClick={() => onInsert(message.content)}
                    className="mt-2 block text-xs font-semibold text-blue-400 hover:text-blue-300"
                  >
                    Insert into editor
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <AgentAvatar small />
                <span>
                  Pico is reading your note
                  <span className="agent-typing" aria-label="typing">
                    ...
                  </span>
                </span>
              </div>
            )}
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-neutral-800 p-3"
          >
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about this note..."
              className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-blue-500"
            />
            <button
              disabled={loading || !question.trim()}
              className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-500 disabled:opacity-50"
              aria-label="Ask agent"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
