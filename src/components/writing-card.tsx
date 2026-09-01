import Link from "next/link";
import type { WritingNote } from "@/lib/types";
import { formatNoteDate, formatNoteNumber } from "@/lib/writing";

type WritingCardProps = {
  note: WritingNote;
  index: number;
};

export function WritingCard({ note, index }: WritingCardProps) {
  return (
    <article className="card writing-card">
      <Link href={`/writing/${note.slug}`} className="writing-link tap">
        <p className="kicker">NOTE · {formatNoteNumber(index)}</p>
        <h3 className="card-title" dir="rtl" lang="he">
          {note.title.he}
        </h3>
        <p className="card-title-en" dir="ltr" lang="en">
          {note.title.en}
        </p>
        <p className="meta">{formatNoteDate(note.date)}</p>
      </Link>
    </article>
  );
}
