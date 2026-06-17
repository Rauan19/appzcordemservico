/** Gera imagem PNG da assinatura digitada (mais fácil que desenhar no celular). */
export function renderTypedSignatureImage(name: string): string {
  const text = name.trim();
  const canvas = document.createElement("canvas");
  const width = Math.max(320, Math.min(720, text.length * 22));
  canvas.width = width;
  canvas.height = 100;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, 100);

  ctx.fillStyle = "#0b2d6b";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let fontSize = 40;
  ctx.font = `italic ${fontSize}px "Segoe Script", "Brush Script MT", Georgia, serif`;
  while (fontSize > 20 && ctx.measureText(text).width > width - 32) {
    fontSize -= 2;
    ctx.font = `italic ${fontSize}px "Segoe Script", "Brush Script MT", Georgia, serif`;
  }

  ctx.fillText(text, width / 2, 52);
  return canvas.toDataURL("image/png");
}
