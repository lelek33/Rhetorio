import { Platform } from "react-native";

export type LoadedFileType = "txt" | "md" | "pdf";

export type LoadedFile = {
  filename: string;
  text: string;
  type: LoadedFileType;
};

export const supportedExtensions = ".txt,.md,.pdf";

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
