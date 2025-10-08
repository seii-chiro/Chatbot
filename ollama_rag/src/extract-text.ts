import fs from "fs/promises";
import { pdf } from "pdf-parse";

export async function extractTextFromPDF(filePath: string) {
  const data = await fs.readFile(filePath);
  const pdfData = await pdf(data);
  return pdfData.text;
}

console.log(await extractTextFromPDF("../knowledge/Activation.pdf"));
