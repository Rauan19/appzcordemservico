import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../env.js";
import { BadRequestError } from "../http/http-errors.ts";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export function getUploadRoot() {
  return path.resolve(env.UPLOAD_DIR);
}

export function getMaxUploadBytes() {
  return env.UPLOAD_MAX_SIZE_MB * 1024 * 1024;
}

function resolveSafePath(fileKey: string) {
  const normalized = path.normalize(fileKey).replace(/^(\.\.(\/|\\|$))+/, "");
  if (normalized.includes("..")) {
    throw new BadRequestError("Caminho de arquivo inválido");
  }
  const full = path.join(getUploadRoot(), normalized);
  const root = getUploadRoot();
  if (!full.startsWith(root)) {
    throw new BadRequestError("Caminho de arquivo inválido");
  }
  return full;
}

export async function saveUploadFile(
  fileKey: string,
  buffer: Buffer,
  mimeType: string,
) {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new BadRequestError("Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.");
  }
  if (buffer.byteLength > getMaxUploadBytes()) {
    throw new BadRequestError(`Arquivo excede o limite de ${env.UPLOAD_MAX_SIZE_MB} MB`);
  }

  const fullPath = resolveSafePath(fileKey);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  return fullPath;
}

export async function readUploadFile(fileKey: string) {
  const fullPath = resolveSafePath(fileKey);
  return readFile(fullPath);
}

export function extensionForMime(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

export function contractFileKey(contractId: string, filename: string) {
  return `contracts/${contractId}/${filename}`;
}
