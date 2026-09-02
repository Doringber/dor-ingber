const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VARIANTS = ["hq720", "sddefault", "hqdefault"] as const;

async function fetchVariant(id: string, name: string): Promise<ArrayBuffer | null> {
  const response = await fetch(`https://i.ytimg.com/vi/${id}/${name}.jpg`, {
    next: { revalidate: 86400 },
  });
  if (!response.ok) {
    return null;
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength < 2000) {
    return null;
  }
  return buffer;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!YOUTUBE_ID.test(id)) {
    return new Response("Invalid id", { status: 400 });
  }

  for (const variant of VARIANTS) {
    const buffer = await fetchVariant(id, variant);
    if (!buffer) {
      continue;
    }
    return new Response(buffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  }

  return new Response("Not found", { status: 404 });
}
