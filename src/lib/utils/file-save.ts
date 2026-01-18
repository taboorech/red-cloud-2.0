import { storageFolder } from "../constants/app";

export function buildFileUrl(filePath?: string): string | undefined {
  if (!filePath) {
    return undefined;
  }

  // If it's already a full URL, return as is
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  const baseUrl = process.env.HOST_URL || "http://localhost:8080";

  // Remove 'storage/' prefix if it exists since files are served from root
  const cleanPath = filePath.startsWith(`${storageFolder}/`)
    ? filePath.replace(`${storageFolder}/`, "")
    : filePath;

  return `${baseUrl}/${cleanPath}`;
}
