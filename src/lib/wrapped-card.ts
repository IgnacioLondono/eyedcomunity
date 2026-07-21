export type WrappedCardInput = {
  year: number;
  displayName: string;
  messages: number;
  voiceHours: number;
  activeDays: number;
  rank: number | null;
  xpEarned: number;
  personaName: string;
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function format(value: number) {
  return value.toLocaleString("es");
}

export function renderWrappedCard(input: WrappedCardInput): HTMLCanvasElement {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear la captura");

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#17121f");
  gradient.addColorStop(0.45, "#0d0b12");
  gradient.addColorStop(1, "#15101c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(860, 180, 20, 860, 180, 420);
  glow.addColorStop(0, "rgba(157,108,255,0.28)");
  glow.addColorStop(1, "rgba(157,108,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.04)";
  roundRect(ctx, 64, 64, width - 128, height - 128, 42);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  roundRect(ctx, 64, 64, width - 128, height - 128, 42);
  ctx.stroke();

  ctx.fillStyle = "#c0a8ee";
  ctx.font = "700 28px Inter, Segoe UI, sans-serif";
  ctx.fillText("EYED WRAPPED", 110, 150);
  ctx.fillStyle = "#7f778b";
  ctx.font = "600 24px Inter, Segoe UI, sans-serif";
  ctx.fillText(String(input.year), 360, 150);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 72px Inter, Segoe UI, sans-serif";
  const title = `El año de ${input.displayName}`;
  const titleLines = wrapText(ctx, title, width - 220);
  titleLines.slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, 110, 260 + index * 82);
  });

  ctx.fillStyle = "#9d8fb0";
  ctx.font = "500 28px Inter, Segoe UI, sans-serif";
  ctx.fillText(input.personaName, 110, 460);

  const cards = [
    { label: "Mensajes", value: format(input.messages) },
    { label: "Horas en voz", value: String(input.voiceHours) },
    { label: "Días activo", value: format(input.activeDays) },
    { label: "Ranking", value: input.rank ? `#${input.rank}` : "—" },
  ];

  cards.forEach((card, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 110 + col * 430;
    const y = 520 + row * 230;
    ctx.fillStyle = "rgba(255,255,255,0.035)";
    roundRect(ctx, x, y, 390, 190, 28);
    ctx.fill();
    ctx.fillStyle = "#8e8796";
    ctx.font = "600 22px Inter, Segoe UI, sans-serif";
    ctx.fillText(card.label.toUpperCase(), x + 28, y + 52);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 64px Inter, Segoe UI, sans-serif";
    ctx.fillText(card.value, x + 28, y + 130);
  });

  ctx.fillStyle = "rgba(157,108,255,0.12)";
  roundRect(ctx, 110, 1000, width - 220, 170, 28);
  ctx.fill();
  ctx.fillStyle = "#cbb6f2";
  ctx.font = "600 24px Inter, Segoe UI, sans-serif";
  ctx.fillText("XP conseguida este año", 148, 1065);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 58px Inter, Segoe UI, sans-serif";
  ctx.fillText(format(input.xpEarned), 148, 1135);

  ctx.fillStyle = "#6f677a";
  ctx.font = "500 22px Inter, Segoe UI, sans-serif";
  ctx.fillText("EyedComun · Datos reales de EyedBot", 110, 1245);

  return canvas;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("No se pudo generar la imagen"));
      else resolve(blob);
    }, "image/png");
  });
}
