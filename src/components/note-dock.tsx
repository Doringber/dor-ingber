"use client";

import Link from "next/link";
import { formatNoteDate } from "@/lib/writing-format";
import type { NoteStation } from "@/lib/stations";

type NoteDockProps = {
  note: NoteStation;
  onClose: () => void;
};

function paragraphs(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function NoteDock({ note, onClose }: NoteDockProps) {
  return (
    <div className="note-dock">
      <button
        type="button"
        className="note-dock-backdrop tap"
        aria-label="Close note"
        onClick={onClose}
      />
      <aside className="note-dock-panel" role="dialog" aria-modal="true" aria-labelledby="note-dock-title">
        <div className="note-dock-bar">
          <button type="button" className="note-dock-close tap" onClick={onClose}>
            Close
          </button>
          <Link href={`/writing/${note.slug}`} className="note-dock-link tap">
            Open note
          </Link>
        </div>
        <article className="article-column note-dock-article" data-article dir="rtl" lang="he">
          <p className="kicker article-kicker">NOTE · {note.noteNumber}</p>
          <h1 id="note-dock-title" className="article-title">
            {note.title.he}
          </h1>
          <p className="article-title-en" dir="ltr" lang="en">
            {note.title.en}
          </p>
          <p className="meta article-date">{formatNoteDate(note.date)}</p>
          <div className="article-body">
            {paragraphs(note.content).map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
        </article>
      </aside>
    </div>
  );
}
