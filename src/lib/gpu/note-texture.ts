import type { NoteStation } from "@/lib/stations";

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }
    if (current) {
      lines.push(current);
    }
    current = word;
    if (lines.length === maxLines - 1) {
      break;
    }
  }

  if (lines.length < maxLines && current) {
    let last = current;
    if (words.length && ctx.measureText(last).width > maxWidth) {
      while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) {
        last = last.slice(0, -1);
      }
      last = `${last}…`;
    }
    lines.push(last);
  }

  return lines.slice(0, maxLines);
}

function cssFamily(variable: string, fallback: string): string {
  if (typeof document === "undefined") {
    return fallback;
  }
  return (
    getComputedStyle(document.documentElement).getPropertyValue(variable).trim() ||
    fallback
  );
}

export async function paintNoteSlab(note: NoteStation): Promise<HTMLCanvasElement> {
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready.catch(() => undefined);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 1280;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not paint note slab");
  }

  const heebo = cssFamily("--font-heebo", "sans-serif");
  const mono = cssFamily("--font-geist-mono", "ui-monospace, monospace");

  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

  ctx.fillStyle = "#f3f3f3";
  ctx.textAlign = "right";
  ctx.direction = "rtl";
  ctx.font = `500 54px ${heebo}, sans-serif`;
  const titleLines = wrapLines(ctx, note.title.he, 600, 4);
  titleLines.forEach((line, index) => {
    ctx.fillText(line, canvas.width - 72, 180 + index * 72);
  });

  ctx.fillStyle = "#8a8a8a";
  ctx.font = `32px ${heebo}, sans-serif`;
  const body = note.content.replace(/\s+/g, " ").trim();
  const bodyLines = wrapLines(ctx, body, 600, 8);
  bodyLines.forEach((line, index) => {
    ctx.fillText(line, canvas.width - 72, 520 + index * 48);
  });

  ctx.direction = "ltr";
  ctx.textAlign = "right";
  ctx.fillStyle = "#087A4C";
  ctx.font = `600 28px ${mono}, ui-monospace, monospace`;
  ctx.fillText(`NOTE · ${note.noteNumber}`, canvas.width - 72, canvas.height - 96);

  return canvas;
}

export function paintFloor(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not paint floor");
  }
  ctx.fillStyle = "#050507";
  ctx.fillRect(0, 0, 8, 8);
  return canvas;
}

export function paintFallback(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 9;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not paint fallback");
  }
  ctx.fillStyle = "#111113";
  ctx.fillRect(0, 0, 16, 9);
  return canvas;
}
