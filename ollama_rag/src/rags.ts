import ollama, { type Message } from "ollama";
import fs from "fs/promises";
import path from "path";

const STORE_PATH = path.resolve("src/vectorstore.json");
const CHAT_MODEL = "llama3.1:8b-instruct-q5_K_M";
const EMBED_MODEL = "nomic-embed-text";

export type Entry = {
  id: string;
  file: string;
  text: string;
  embedding: number[];
};
export type Ranked = Entry & { score: number };

function cosine(a: number[], b: number[]) {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function embed(text: string) {
  const resp: any = await ollama.embeddings({
    model: EMBED_MODEL,
    prompt: text,
  });

  // Ollama official client
  if (resp && Array.isArray(resp.embedding)) {
    return resp.embedding as number[];
  }

  // Some wrappers return { embeddings: number[][] }
  if (
    resp &&
    Array.isArray(resp.embeddings) &&
    Array.isArray(resp.embeddings[0])
  ) {
    return resp.embeddings[0] as number[];
  }

  throw new Error("Unexpected embeddings response shape");
}

function buildSystemPrompt(usingRag: boolean) {
  if (!usingRag) {
    // Pure chat (no useful context): normal assistant
    return {
      role: "system" as const,
      content: [
        "You are a helpful, concise AI assistant.",
        "Answer clearly and accurately. If you don’t know, say so briefly and ask a follow‑up if helpful.",
      ].join(" \n"),
    };
  }
  // Hybrid: use sources when they’re relevant, otherwise fall back to normal knowledge
  return {
    role: "system" as const,
    content: [
      "You are a helpful AI assistant.",
      "You have been given excerpts called Sources [S1..Sn].",
      "Prefer using these sources when they clearly help answer the question.",
      "When you use them, cite like [S1], [S2].",
      "If the sources are weak or irrelevant, answer from your general knowledge and **do not fabricate citations**.",
      "If you’re unsure, say so briefly.",
    ].join(" \n"),
  };
}

function buildRagUserMessage(ctx: string, userQuestion: string): Message {
  return {
    role: "user",
    content: [
      `Question: ${userQuestion}`,
      ctx ? `\nSources (snippets):\n${ctx}` : "",
      ctx
        ? "\nAnswer concisely. Cite [S#] only when you explicitly used a source snippet."
        : "",
    ].join("\n"),
  };
}

export type BuildOptions = {
  messages?: Message[]; // full history. Last user message is the query.
  k?: number; // top‑k
  minScore?: number; // cosine similarity gate for considering a chunk relevant
  mode?: "auto" | "rag" | "chat"; // force modes or automatic
};

export async function buildRagStream(opts: BuildOptions = {}) {
  const timings: Record<string, number> = {};
  const start = Date.now();

  const { messages = [], k = 5, minScore = 0.25, mode = "auto" } = opts;

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const question = lastUser?.content?.trim() ?? "";

  // Load store
  timings.loadStore = Date.now() - start;
  let store: { entries: Entry[] } | null = null;
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    store = JSON.parse(raw);
  } catch (_) {
    store = null;
  }
  timings.loadStore = Date.now() - start - timings.loadStore;

  // Retrieval
  let ranked: Ranked[] = [];
  if (store && store.entries?.length && question && mode !== "chat") {
    const embedStart = Date.now();
    const qemb = await embed(question);
    timings.embedding = Date.now() - embedStart;

    const searchStart = Date.now();
    ranked = store.entries
      .map((e) => ({ ...e, score: cosine(qemb, e.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .filter((r) => r.score >= minScore);
    timings.search = Date.now() - searchStart;
  }

  const usingRag = mode === "rag" || (mode === "auto" && ranked.length > 0);

  const ctxStart = Date.now();
  const ctx = usingRag
    ? ranked
        .map((r, i) => `### [S${i + 1}] ${r.file}\n${r.text.slice(0, 1200)}`)
        .join("\n\n")
    : "";
  timings.contextPrep = Date.now() - ctxStart;

  // Log before LLM call
  console.log("RAG Timings:", timings);
  console.log("Context length:", ctx.length, "chars");
  console.log("Docs retrieved:", ranked.length);
  console.log("Question length:", question.length);

  const llmStart = Date.now();

  const sys = buildSystemPrompt(usingRag);
  const history = messages.filter((m) => m !== lastUser);
  const userWithCtx = buildRagUserMessage(ctx, question);
  const finalMessages: Message[] = [sys, ...history, userWithCtx];

  const answerStream = await ollama.chat({
    model: CHAT_MODEL,
    messages: finalMessages,
    stream: true,
  });

  // Track time to first token
  console.log("Time to stream start:", Date.now() - llmStart, "ms");

  const sources = usingRag
    ? ranked.map((r, i) => ({
        tag: `S${i + 1}`,
        file: r.file,
        id: r.id,
        score: +r.score.toFixed(3),
        preview: r.text.slice(0, 160),
      }))
    : [];

  return { answerStream, sources };
}
