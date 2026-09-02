"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  adjacentNoteSlugs,
  slugAfterNoteSwipe,
  writingPath,
} from "@/lib/note-reader";
import { shouldCloseDown, shouldCommitSwipe } from "@/lib/swipe";

type NoteReaderProps = {
  slug: string;
  slugs: readonly string[];
  number: string;
  title: string;
  children: ReactNode;
};

export function NoteReader({
  slug,
  slugs,
  number,
  title,
  children,
}: NoteReaderProps) {
  const router = useRouter();
  const sheetRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({
    down: false,
    dragging: false,
    startX: 0,
    startY: 0,
  });
  const { prev, next } = adjacentNoteSlugs(slugs, slug);

  const close = useCallback(() => {
    router.push("/");
  }, [router]);

  const goNote = useCallback(
    (nextSlug: string | null) => {
      if (!nextSlug) {
        return;
      }
      router.push(writingPath(nextSlug));
    },
    [router],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest("a, button")) {
      return;
    }
    pointerRef.current.down = true;
    pointerRef.current.dragging = false;
    pointerRef.current.startX = event.clientX;
    pointerRef.current.startY = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current;
    if (!pointer.down) {
      return;
    }
    if (
      Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) >
      8
    ) {
      pointer.dragging = true;
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current;
    const dx = event.clientX - pointer.startX;
    const dy = event.clientY - pointer.startY;
    const wasDragging = pointer.dragging;
    const wasDown = pointer.down;
    pointer.down = false;
    pointer.dragging = false;

    if (!wasDown || !wasDragging) {
      return;
    }

    const sheet = sheetRef.current;
    const atTop = !sheet || sheet.scrollTop <= 0;
    if (atTop && shouldCloseDown(dx, dy)) {
      close();
      return;
    }
    if (shouldCommitSwipe(dx, dy)) {
      goNote(slugAfterNoteSwipe(slug, slugs, dx));
    }
  };

  return (
    <div
      className="note-reader"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-reader-title"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <p className="kicker note-reader-kicker" data-kicker-on="void">
        NOTE · {number}
      </p>
      <div className="note-reader-rebate film-rebate">
        <span className="film-rebate-age" aria-hidden />
        <div className="note-reader-sheet">
          <button
            type="button"
            className="note-reader-close tap"
            aria-label="Close note"
            onClick={close}
          >
            <span aria-hidden>×</span>
          </button>
          <div ref={sheetRef} className="note-reader-scroll">
            <article
              className="note-reader-article"
              data-article
              dir="rtl"
              lang="he"
            >
              <h1 id="note-reader-title" className="note-reader-title">
                {title}
              </h1>
              <div className="note-reader-body">{children}</div>
            </article>
          </div>
          <nav className="note-reader-nav" aria-label="Notes" dir="rtl">
            {prev ? (
              <Link href={writingPath(prev)} className="note-reader-link tap">
                הקודם
              </Link>
            ) : (
              <span className="note-reader-link is-off tap" aria-hidden>
                הקודם
              </span>
            )}
            <span className="note-reader-slash" aria-hidden>
              /
            </span>
            {next ? (
              <Link href={writingPath(next)} className="note-reader-link tap">
                הבא
              </Link>
            ) : (
              <span className="note-reader-link is-off tap" aria-hidden>
                הבא
              </span>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
