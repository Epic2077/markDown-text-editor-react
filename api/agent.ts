interface AgentRequest {
  note?: { title?: string; content?: string };
  question?: string;
  messages?: { role: "user" | "assistant"; content: string }[];
}

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body: AgentRequest;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

const MAX_CONTEXT_CHARS = 24_000;
const AI_BASE_URL = "https://ai.liara.ir/api/6abe8dfc7ce6d9a9e0475844/v1";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authorization = req.headers.authorization;
  const accessToken = Array.isArray(authorization)
    ? authorization[0]
    : authorization?.replace(/^Bearer\s+/i, "");
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!accessToken || !supabaseUrl || !supabaseKey) {
    return res.status(401).json({ error: "Sign in to use the note agent." });
  }

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!userResponse.ok) {
    return res.status(401).json({ error: "Your session has expired." });
  }

  const question = req.body?.question?.trim();
  const title = req.body?.note?.title?.trim() || "Untitled note";
  const content = req.body?.note?.content?.slice(0, MAX_CONTEXT_CHARS) || "";
  if (!question)
    return res.status(400).json({ error: "Ask a question first." });

  const model = process.env.MODEL_NAME;
  const apiKey = process.env.API_KEY;
  if (!apiKey || !model) {
    return res
      .status(503)
      .json({
        error: "The note agent API_KEY or MODEL_NAME is not configured.",
      });
  }

  const history = (req.body?.messages || [])
    .slice(-4)
    .map((message) => `${message.role}: ${message.content.slice(0, 1000)}`)
    .join("\n");
  const prompt = [
    `Note title: ${title}`,
    "Note content:",
    content || "(The note is empty.)",
    history ? `Recent agent conversation:\n${history}` : "",
    `User question: ${question}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const completionResponse = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content:
            "You are a concise note assistant. Answer using the supplied note as the source of truth. Say clearly when the note does not contain enough information. In edit mode, suggest concrete wording or structure when useful. Do not invent facts or claim to have changed the note.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!completionResponse.ok) {
    return res
      .status(502)
      .json({ error: "The note agent could not answer right now." });
  }
  const completion = (await completionResponse.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const answer = completion.choices?.[0]?.message?.content?.trim();
  if (!answer)
    return res
      .status(502)
      .json({ error: "The note agent returned an empty answer." });
  return res.status(200).json({ answer });
}
