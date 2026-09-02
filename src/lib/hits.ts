export const SCREEN_HIT = 44;

export type ScreenRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function expandScreenRect(rect: ScreenRect, min = SCREEN_HIT): ScreenRect {
  const width = Math.max(min, rect.width);
  const height = Math.max(min, rect.height);
  return {
    x: rect.x - (width - rect.width) / 2,
    y: rect.y - (height - rect.height) / 2,
    width,
    height,
  };
}

export function containsScreenPoint(rect: ScreenRect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

export function elementScreenRect(node: Element): ScreenRect {
  const box = node.getBoundingClientRect();
  return expandScreenRect({
    x: box.left,
    y: box.top,
    width: box.width,
    height: box.height,
  });
}

export function stationAtScreenPoint(
  root: ParentNode,
  x: number,
  y: number,
  focused?: number,
): number | null {
  const hits: Array<{ index: number; area: number; focused: boolean }> = [];

  for (const node of root.querySelectorAll<HTMLElement>("[data-station]")) {
    const index = Number(node.dataset.station);
    if (!Number.isFinite(index)) {
      continue;
    }
    const rect = elementScreenRect(node);
    if (!containsScreenPoint(rect, x, y)) {
      continue;
    }
    hits.push({
      index,
      area: rect.width * rect.height,
      focused: focused === index,
    });
  }

  if (hits.length === 0) {
    return null;
  }

  hits.sort((a, b) => {
    if (a.focused !== b.focused) {
      return a.focused ? -1 : 1;
    }
    return b.area - a.area;
  });

  return hits[0]?.index ?? null;
}
