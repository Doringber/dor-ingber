import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { ReadProgress } from "@/components/read-progress";
import { WritingChrome } from "@/components/writing-chrome";
import {
  formatNoteDate,
  formatNoteNumber,
  getWriting,
  getWritingBySlug,
  getWritingIndex,
} from "@/lib/writing";

export function generateStaticParams() {
  return getWriting().map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/writing/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const note = getWritingBySlug(slug);
  if (!note) {
    return { title: "Note" };
  }
  return {
    title: note.title.en,
    description: note.title.he,
  };
}

export default async function WritingPage({
  params,
}: PageProps<"/writing/[slug]">) {
  const { slug } = await params;
  const note = getWritingBySlug(slug);
  if (!note) {
    notFound();
  }

  const number = formatNoteNumber(getWritingIndex(note.slug));

  return (
    <main className="article-shell">
      <WritingChrome />
      <ReadProgress />
      <article className="article-column" data-article dir="rtl" lang="he">
        <p className="kicker article-kicker">NOTE · {number}</p>
        <h1 className="article-title">{note.title.he}</h1>
        <p className="article-title-en" dir="ltr" lang="en">
          {note.title.en}
        </p>
        <p className="meta article-date">{formatNoteDate(note.date)}</p>
        <div className="article-body">
          <MDXRemote source={note.content} />
        </div>
      </article>
    </main>
  );
}
