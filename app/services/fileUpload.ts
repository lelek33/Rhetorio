import { Platform } from "react-native";

export type LoadedFile = {
  filename: string;
  text: string;
};

export const supportedExtensions = ".txt,.md,.rtf";

export function pickAndReadTextFile(): Promise<LoadedFile | null> {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = supportedExtensions;
    input.style.display = "none";

    input.onchange = () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ filename: file.name, text: String(reader.result ?? "") });
      };
      reader.onerror = () => reject(reader.error ?? new Error("Datei konnte nicht gelesen werden."));
      reader.readAsText(file);
    };

    input.oncancel = () => {
      input.remove();
      resolve(null);
    };

    document.body.appendChild(input);
    input.click();
  });
}
