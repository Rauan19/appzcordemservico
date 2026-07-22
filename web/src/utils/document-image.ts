const MAX_EDGE_PX = 1600;
const JPEG_QUALITY = 0.8;
const TARGET_MAX_BYTES = 1.5 * 1024 * 1024;

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

function looksLikeImage(file: File) {
  return file.type.startsWith("image/") || isHeic(file) || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
}

async function blobToJpegFile(blob: Blob, fileName: string): Promise<File> {
  return new File([blob], `${baseName(fileName)}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}

/** Cópia em memória — evita arquivo temporário da câmera sumir no Android. */
export async function snapshotFile(file: File): Promise<File> {
  const buffer = await file.arrayBuffer();
  return new File([buffer], file.name || "foto.jpg", {
    type: file.type || "image/jpeg",
    lastModified: Date.now(),
  });
}

async function canvasToJpeg(
  source: CanvasImageSource,
  width: number,
  height: number,
  fileName: string,
  quality: number,
) {
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
      quality,
    );
  });

  return blobToJpegFile(blob, fileName);
}

async function loadImageElement(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Não foi possível abrir a foto"));
      el.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function convertWithCanvas(file: File, quality = JPEG_QUALITY): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    try {
      return await canvasToJpeg(bitmap, bitmap.width, bitmap.height, file.name, quality);
    } finally {
      bitmap.close();
    }
  } catch {
    const img = await loadImageElement(file);
    return canvasToJpeg(img, img.naturalWidth, img.naturalHeight, file.name, quality);
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

async function compressUntilSmallEnough(file: File): Promise<File> {
  let quality = JPEG_QUALITY;
  let result = await convertWithCanvas(file, quality);
  while (result.size > TARGET_MAX_BYTES && quality > 0.45) {
    quality -= 0.1;
    result = await convertWithCanvas(file, quality);
  }
  return result;
}

/** Sempre gera JPEG compacto aceito pela API (câmera mobile costuma ser grande demais). */
export async function normalizeDocumentImage(file: File): Promise<File> {
  if (!looksLikeImage(file)) {
    throw new Error("Envie uma foto (JPEG, PNG, WebP ou HEIC)");
  }

  if (isHeic(file)) {
    try {
      return await convertHeic(file);
    } catch {
      try {
        return await compressUntilSmallEnough(file);
      } catch {
        throw new Error(
          "Não foi possível ler esta foto HEIC. Tire a foto pelo app ou salve como JPEG na galeria.",
        );
      }
    }
  }

  try {
    return await compressUntilSmallEnough(file);
  } catch {
    throw new Error("Não foi possível processar esta imagem. Tente outra foto em JPEG ou PNG.");
  }
}
