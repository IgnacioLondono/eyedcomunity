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

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#d7c4ff";
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function renderWrappedCard(input: WrappedCardInput): HTMLCanvasElement {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear la captura");

  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#1a1028");
  background.addColorStop(0.35, "#0c0a12");
  background.addColorStop(0.7, "#120e1b");
  background.addColorStop(1, "#1c1230");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const bloomA = ctx.createRadialGradient(180, 220, 10, 180, 220, 380);
  bloomA.addColorStop(0, "rgba(157,108,255,0.45)");
  bloomA.addColorStop(1, "rgba(157,108,255,0)");
  ctx.fillStyle = bloomA;
  ctx.fillRect(0, 0, width, height);

  const bloomB = ctx.createRadialGradient(920, 980, 20, 920, 980, 460);
  bloomB.addColorStop(0, "rgba(85,216,232,0.22)");
  bloomB.addColorStop(1, "rgba(85,216,232,0)");
  ctx.fillStyle = bloomB;
  ctx.fillRect(0, 0, width, height);

  const bloomC = ctx.createRadialGradient(540, 640, 40, 540, 640, 520);
  bloomC.addColorStop(0, "rgba(255,189,89,0.08)");
  bloomC.addColorStop(1, "rgba(255,189,89,0)");
  ctx.fillStyle = bloomC;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 28; i += 1) {
    drawStar(
      ctx,
      80 + ((i * 137) % (width - 160)),
      90 + ((i * 97) % (height - 180)),
      i % 4 === 0 ? 2.4 : 1.4,
      i % 3 === 0 ? 0.45 : 0.2,
    );
  }

  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 180 + i * 70, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(12,10,18,0.55)";
  roundRect(ctx, 48, 48, width - 96, height - 96, 48);
  ctx.fill();
  ctx.strokeStyle = "rgba(192,168,238,0.22)";
  ctx.lineWidth = 2;
  roundRect(ctx, 48, 48, width - 96, height - 96, 48);
  ctx.stroke();

  ctx.fillStyle = "rgba(157,108,255,0.14)";
  roundRect(ctx, 96, 96, 280, 52, 999);
  ctx.fill();
  ctx.fillStyle = "#d7c4ff";
  ctx.font = "700 24px Georgia, 'Times New Roman', serif";
  ctx.fillText("EYED WRAPPED", 124, 130);
  ctx.fillStyle = "#8d839b";
  ctx.font = "600 22px Inter, Segoe UI, sans-serif";
  ctx.fillText(String(input.year), 320, 130);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 78px Georgia, 'Times New Roman', serif";
  const title = `El año de ${input.displayName}`;
  const titleLines = wrapText(ctx, title, width - 220);
  titleLines.slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, 110, 250 + index * 88);
  });

  ctx.fillStyle = "#b9a4e4";
  ctx.font = "600 30px Inter, Segoe UI, sans-serif";
  ctx.fillText(input.personaName, 110, 450);

  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath();
  ctx.moveTo(110, 480);
  ctx.lineTo(420, 480);
  ctx.stroke();

  const cards = [
    { label: "Mensajes", value: format(input.messages), accent: "#9d6cff" },
    { label: "Horas en voz", value: String(input.voiceHours), accent: "#55d8e8" },
    { label: "Días activo", value: format(input.activeDays), accent: "#ffbd59" },
    { label: "Ranking", value: input.rank ? `#${input.rank}` : "—", accent: "#ff6c9e" },
  ];

  cards.forEach((card, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 110 + col * 430;
    const y = 520 + row * 220;
    const cardGlow = ctx.createLinearGradient(x, y, x + 390, y + 180);
    cardGlow.addColorStop(0, "rgba(255,255,255,0.06)");
    cardGlow.addColorStop(1, "rgba(255,255,255,0.02)");
    ctx.fillStyle = cardGlow;
    roundRect(ctx, x, y, 390, 180, 30);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, 390, 180, 30);
    ctx.stroke();

    ctx.fillStyle = card.accent;
    ctx.beginPath();
    ctx.arc(x + 42, y + 48, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#a59bb0";
    ctx.font = "700 20px Inter, Segoe UI, sans-serif";
    ctx.fillText(card.label.toUpperCase(), x + 68, y + 55);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 68px Georgia, 'Times New Roman', serif";
    ctx.fillText(card.value, x + 36, y + 130);
  });

  const xpGradient = ctx.createLinearGradient(110, 980, width - 110, 1160);
  xpGradient.addColorStop(0, "rgba(157,108,255,0.28)");
  xpGradient.addColorStop(1, "rgba(85,216,232,0.14)");
  ctx.fillStyle = xpGradient;
  roundRect(ctx, 110, 980, width - 220, 170, 32);
  ctx.fill();
  ctx.strokeStyle = "rgba(192,168,238,0.28)";
  ctx.lineWidth = 2;
  roundRect(ctx, 110, 980, width - 220, 170, 32);
  ctx.stroke();

  ctx.fillStyle = "#e4d7ff";
  ctx.font = "600 24px Inter, Segoe UI, sans-serif";
  ctx.fillText("XP conseguida este año", 148, 1045);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 72px Georgia, 'Times New Roman', serif";
  ctx.fillText(format(input.xpEarned), 148, 1125);

  ctx.fillStyle = "#7a7188";
  ctx.font = "500 22px Inter, Segoe UI, sans-serif";
  ctx.fillText("EyedComun · Datos reales de EyedBot", 110, 1235);

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
