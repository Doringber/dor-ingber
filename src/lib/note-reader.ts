export function writingPath(slug: string): string {
  return `/writing/${slug}`;
}

export function noteFromPath(pathname: string): string | null {
  const match = /^\/writing\/([^/]+)$/.exec(pathname);
  return match?.[1] ?? null;
}

export function adjacentNoteSlugs(
  slugs: readonly string[],
  slug: string,
): { prev: string | null; next: string | null } {
  const index = slugs.indexOf(slug);
  if (index === -1) {
    return { prev: null, next: null };
  }
  return {
    prev: slugs[index - 1] ?? null,
    next: slugs[index + 1] ?? null,
  };
}

export function slugAfterNoteSwipe(
  slug: string,
  slugs: readonly string[],
  dx: number,
): string | null {
  const { prev, next } = adjacentNoteSlugs(slugs, slug);
  return dx < 0 ? next : prev;
}
