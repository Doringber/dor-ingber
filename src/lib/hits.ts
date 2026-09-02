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

export function elementScreenRect(node: Element): ScreenRect {
  const box = node.getBoundingClientRect();
  return expandScreenRect({
    x: box.left,
    y: box.top,
    width: box.width,
    height: box.height,
  });
}

export function centerScreenHit(node: Element, size = SCREEN_HIT): ScreenRect {
  const box = node.getBoundingClientRect();
  return {
    x: box.left + box.width / 2 - size / 2,
    y: box.top + box.height / 2 - size / 2,
    width: size,
    height: size,
  };
}
