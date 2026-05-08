import { Platform } from "react-native";

import { supabase } from "./supabase/client";

export type LoadedFileType = "txt" | "md" | "pdf" | "image";

export type LoadedFile = {
  filename: string;
  text: string;
  type: LoadedFileType;
};

export const supportedExtensions = ".txt,.md,.pdf,.jpg,.jpeg,.png,.webp";

const imageMimePrefixes = ["image/"];
const imageExtensions = ["jpg", "jpeg", "png", "webp"];

export function pickAndReadDocument(): Promise<LoadedFile | null> {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = supportedExtensions;
    input.style.display = "none";

    input.onchange = async () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const result = await readFile(file);
        resolve(result);
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Datei konnte nicht gelesen werden."));
      }
    };

    input.oncancel = () => {
      input.remove();
      resolve(null);
    };

    document.body.appendChild(input);
    input.click();
  });
}

async function readFile(file: File): Promise<LoadedFile> {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (ext === "pdf") {
    const text = await readPdf(file);
    return { filename: file.name, text, type: "pdf" };
  }
  if (imageExtensions.includes(ext) || imageMimePrefixes.some((prefix) => file.type.startsWith(prefix))) {
    const text = await readImage(file);
    return { filename: file.name, text, type: "image" };
  }
  const text = await readText(file);
  const type: LoadedFileType = ext === "md" ? "md" : "txt";
  return { filename: file.name, text, type };
}

function readText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Datei konnte nicht gelesen werden."));
    reader.readAsText(file);
  });
}

async function readPdf(file: File): Promise<string> {
  // Lazy-load pdfjs only when a PDF is actually picked, so the bundle
  // stays small for users who never upload a PDF.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjs: any = await import(/* webpackChunkName: "pdfjs" */ "pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineBuffer: string[] = content.items.map((item: any) => (typeof item.str === "string" ? item.str : ""));
    pages.push(lineBuffer.join(" "));
  }
  return pages.join("\n\n").trim();
}

async function readImage(file: File): Promise<string> {
  const mimeType = (file.type || `image/${(file.name.split(".").pop() ?? "jpeg").toLowerCase()}`).toLowerCase();
  const base64 = await fileToBase64(file);
  const { data, error } = await supabase.functions.invoke<{ text?: string; error?: string }>("extract-image-text", {
    body: { image_base64: base64, mime_type: mimeType }
  });
  if (error) {
    throw new Error(await extractFunctionErrorMessage(error));
  }
  const text = data?.text?.trim();
  if (!text) throw new Error("Aus dem Bild konnte kein Text extrahiert werden.");
  return text;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Bild konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}

async function extractFunctionErrorMessage(error: unknown): Promise<string> {
  const fallback = error instanceof Error ? error.message : "Bild konnte nicht verarbeitet werden.";
  const response = (error as { context?: { response?: Response } })?.context?.response;
  if (!response) return fallback;
  try {
    const body = await response.clone().json();
    if (typeof body?.error === "string") return body.error;
  } catch {
    // ignore
  }
  return fallback;
}
