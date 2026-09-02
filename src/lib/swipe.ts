export const SWIPE_PX = 40;

export function clampIndex(value: number, last: number): number {
  return Math.min(last, Math.max(0, value));
}

export function snapDolly(value: number, count: number): number {
  return clampIndex(Math.round(value), Math.max(count - 1, 0));
}

export function shouldCommitSwipe(
  dx: number,
  dy: number,
  threshold = SWIPE_PX,
): boolean {
  return Math.abs(dx) > threshold && Math.abs(dx) >= Math.abs(dy);
}

export function shouldCloseDown(
  dx: number,
  dy: number,
  threshold = SWIPE_PX,
): boolean {
  return dy > threshold && dy >= Math.abs(dx);
}

export function indexAfterSwipe(index: number, dx: number, last: number): number {
  return clampIndex(index + (dx < 0 ? 1 : -1), last);
}

export function jumpDolly(index: number): { dolly: number; target: number } {
  return { dolly: index, target: index };
}

export function focusedFromDolly(
  dolly: number,
  count: number,
  onePlane: boolean,
  currentIndex: number,
): number {
  if (onePlane) {
    return currentIndex;
  }
  return snapDolly(dolly, count);
}

export function incomingDrag(dx: number, span = 88): number {
  return dx < 0 ? span : -span;
}

export function stepSpring(
  pos: number,
  vel: number,
  target: number,
  dt: number,
  stiffness = 280,
  damping = 20,
): { pos: number; vel: number } {
  const acc = (target - pos) * stiffness - vel * damping;
  const nextVel = vel + acc * dt;
  return { pos: pos + nextVel * dt, vel: nextVel };
}
