export function formatNoteNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function formatNoteDate(date: string): string {
  return date.replace(/-/g, ".");
}
