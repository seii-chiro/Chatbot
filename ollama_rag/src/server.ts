import express from "express";
import cors from "cors";
import type { Message } from "ollama";
import { buildRagStream } from "./rags.ts";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8005;

/**
 * POST /rag/stream
 * Body:
 * {
 *   // Option A: simple question (no memory)
 *   question?: string,
 *
 *   // Option B: full chat history (preferred)
 *   messages?: Message[],
 *
 *   k?: number,
 *   minScore?: number,
 *   mode?: "auto" | "rag" | "chat" // default: auto
 * }
 */
app.post("/rag/stream", async (req, res) => {
  const { question, messages, k, minScore, mode } = req.body || {};
  if (!question && (!messages || messages.length === 0)) {
    return res
      .status(400)
      .json({ error: "Provide either question or messages[]" });
  }

  // Normalize to messages[] so the model can remember context
  let msgs: Message[] = Array.isArray(messages) ? messages : [];
  if (!msgs.length && typeof question === "string") {
    msgs = [{ role: "user", content: String(question) }];
  }

  res.writeHead(200, {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  try {
    const { answerStream, sources } = await buildRagStream({
      messages: msgs,
      k,
      minScore,
      mode,
    });

    for await (const part of answerStream) {
      const chunk = {
        type: "content",
        content: part.message?.content ?? "",
      };
      res.write(JSON.stringify(chunk) + "\n");
    }

    // Only send sources if we actually used them
    if (sources.length) {
      const sourcesChunk = {
        type: "sources",
        sources: sources,
      };
      res.write(JSON.stringify(sourcesChunk) + "\n");
    }

    res.write(JSON.stringify({ type: "done" }) + "\n");
    res.end();
  } catch (err: any) {
    const errorChunk = {
      type: "error",
      message: err?.message || "Unknown error",
    };
    res.write(JSON.stringify(errorChunk) + "\n");
    res.end();
  }
});

const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));

app.use((req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server is running on port: ${PORT} - ${distPath}`)
);
