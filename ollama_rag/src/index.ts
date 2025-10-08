import ollama from "ollama";
import { promises as fs } from "fs";
import { glob } from "glob";
import path from "path";

const EMBED_MODEL = "nomic-embed-text";
const DATA_DIR = path.resolve("knowledge");
const OUT_PATH = path.resolve("vectorstore.json");

// ---- PDF text that supports BOTH class-API and function-API builds
async function getPdfText(fullPath: string): Promise<string> {
  const mod: any = await import("pdf-parse");
  const buf = await fs.readFile(fullPath);

  if (mod?.PDFParse) {
    // Newer ESM/class API
    const parser = new mod.PDFParse({ data: buf });
    const res = await parser.getText();
    return res?.text ?? "";
  } else {
    // Older/default function API
    const pdf = mod.default ?? mod;
    const res = await pdf(buf);
    return res?.text ?? "";
  }
}

async function getText(file: string): Promise<string> {
  const ext = path.extname(file).toLowerCase();
  return ext === ".pdf" ? getPdfText(file) : await fs.readFile(file, "utf8");
}

function chunkText(text: string, size = 1000, overlap = 200) {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += Math.max(1, size - overlap)) {
    const s = text.slice(i, i + size).trim();
    if (s) chunks.push(s);
  }
  return chunks;
}

// ---- Embeddings that support BOTH Ollama APIs
async function embed(texts: string[], batchSize = 32): Promise<number[][]> {
  const out: number[][] = [];
  const o: any = ollama;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    if (typeof o.embed === "function") {
      // New API: ollama.embed({ input: string | string[] }) -> { embeddings: number[][] }
      const { embeddings } = await o.embed({
        model: EMBED_MODEL,
        input: batch,
      });
      if (!embeddings)
        throw new Error("No embeddings returned from ollama.embed");
      out.push(...embeddings);
    } else {
      // Old API: ollama.embeddings({ prompt: string }) -> { embedding: number[] }
      for (const t of batch) {
        const { embedding } = await o.embeddings({
          model: EMBED_MODEL,
          prompt: t,
        } as any);
        if (!embedding)
          throw new Error("No embedding returned from ollama.embeddings");
        out.push(embedding);
      }
    }
  }
  return out;
}

async function main() {
  const files = await glob("**/*.{pdf,md,txt}", { cwd: DATA_DIR, nodir: true });
  const entries: any[] = [];

  for (const rel of files) {
    const full = path.join(DATA_DIR, rel);
    console.log(`Reading ${rel}...`);
    const text = (await getText(full)).replace(/\u0000/g, "");
    const chunks = chunkText(text);
    if (!chunks.length) {
      console.warn(`Skipping ${rel}: no extractable text.`);
      continue;
    }

    const vectors = await embed(chunks);
    if (vectors.length !== chunks.length)
      throw new Error("Embedding count mismatch");

    chunks.forEach((chunk, i) => {
      entries.push({
        id: `${rel}#${i}`,
        file: rel,
        text: chunk,
        embedding: vectors[i],
      });
    });
    console.log(`Indexed ${rel}: ${chunks.length} chunks`);
  }

  await fs.writeFile(
    OUT_PATH,
    JSON.stringify({ model: EMBED_MODEL, entries }, null, 2)
  );
  console.log(`✅ Saved ${entries.length} chunks to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error("Indexing failed:", err);
  process.exit(1);
});
