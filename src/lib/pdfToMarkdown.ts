import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PdfExtractResult {
  text: string;
  numPages: number;
  metadata?: Record<string, unknown>;
}

export async function extractTextFromPdf(file: File): Promise<PdfExtractResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  let metadata: Record<string, unknown> | undefined;

  try {
    const meta = await pdf.getMetadata();
    metadata = meta.info as Record<string, unknown> | undefined;
  } catch {
    metadata = undefined;
  }

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    fullText += pageText + "\n\n";
  }

  return {
    text: fullText.trim(),
    numPages: pdf.numPages,
    metadata,
  };
}

export function convertTextToMarkdown(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/([^\n])\n([^\n])/g, "$1 $2")
    .trim();
}

export async function pdfFileToMarkdown(file: File): Promise<string> {
  const { text } = await extractTextFromPdf(file);
  return convertTextToMarkdown(text);
}