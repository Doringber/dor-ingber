import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { NoteReader } from "@/components/note-reader";
import { formatNoteNumber, getWriting, getWritingBySlug, getWritingIndex } from "@/lib/writing";

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

  const notes = getWriting();
  const number = formatNoteNumber(getWritingIndex(note.slug));

  return (
    <NoteReader
      slug={note.slug}
      slugs={notes.map((item) => item.slug)}
      number={number}
      title={note.title.he}
    >
      <MDXRemote source={note.content} />
    </NoteReader>
  );
}
