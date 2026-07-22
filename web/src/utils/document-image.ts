const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_EDGE_PX = 2000;
const JPEG_QUALITY = 0.85;

function isHeic(file: File) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === "image/heic" ||
    type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

function baseName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") || "documento";
}

async function blobToJpegFile(blob: Blob, fileName: string): Promise<File> {
  return new File([blob], `${baseName(fileName)}.jpg`, { type: "image/jpeg" });
}

async function canvasToJpeg(source: CanvasImageSource, width: number, height: number, fileName: string) {
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Não foi possível processar a imagem neste navegador");
  }
  ctx.drawImage(source, 0, 0, targetW, targetH);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Falha ao converter a foto"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });

  return blobToJpegFile(blob, fileName);
}

async function convertWithCanvas(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    return await canvasToJpeg(bitmap, bitmap.width, bitmap.height, file.name);
  } finally {
    bitmap.close();
  }
}

async function convertHeic(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: JPEG_QUALITY,
  });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  const jpeg = await blobToJpegFile(blob, file.name);
  return convertWithCanvas(jpeg);
}

/** Converte HEIC e outros formatos para JPEG aceito pela API. */
export async function normalizeDocumentImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") && !isHeic(file)) {
    throw new Error("Envie uma foto (JPEG, PNG, WebP ou HEIC)");
  }

  if (isHeic(file)) {
    try {
      return await convertHeic(file);
    } catch {
      try {
        return await convertWithCanvas(file);
      } catch {
        throw new Error(
          "Não foi possível ler esta foto HEIC. Tire a foto pelo app ou salve como JPEG na galeria.",
        );
      }
    }
  }

  if (ALLOWED_MIME.has(file.type) && file.size <= 9 * 1024 * 1024) {
    return file;
  }

  try {
    return await convertWithCanvas(file);
  } catch {
    throw new Error("Não foi possível processar esta imagem. Tente outra foto em JPEG ou PNG.");
  }
}
