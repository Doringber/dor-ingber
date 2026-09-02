"use client";

import { useEffect, useRef } from "react";
import { centerScreenHit, elementScreenRect } from "@/lib/hits";
import type { NoteStation, SpatialStation } from "@/lib/stations";

type HitLayerProps = {
  root: HTMLElement | null;
  stations: SpatialStation[];
  focused: number;
  playingId: number | null;
  volume: boolean;
  shouldIgnoreTap: () => boolean;
  onPlay: (index: number) => void;
  onOpenNote: (slug: string) => void;
  onGoTo: (index: number) => void;
};

function applyRect(
  node: HTMLElement,
  rect: { x: number; y: number; width: number; height: number },
) {
  node.style.left = `${rect.x}px`;
  node.style.top = `${rect.y}px`;
  node.style.width = `${rect.width}px`;
  node.style.height = `${rect.height}px`;
}

export function HitLayer({
  root,
  stations,
  focused,
  playingId,
  volume,
  shouldIgnoreTap,
  onPlay,
  onOpenNote,
  onGoTo,
}: HitLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const notes = stations.filter(
    (station): station is NoteStation => station.kind === "note",
  );

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || !root) {
      return;
    }

    let frame = 0;
    const update = () => {
      for (const station of stations) {
        const source = root.querySelector(`[data-station="${station.index}"]`);
        const target = layer.querySelector<HTMLElement>(`[data-hit="${station.index}"]`);
        if (!(source instanceof HTMLElement) || !target) {
          if (target) {
            target.hidden = true;
          }
          continue;
        }

        if (station.kind === "film") {
          if (playingId === station.index) {
            target.hidden = true;
            continue;
          }
          if (station.index === focused) {
            target.hidden = false;
            applyRect(target, centerScreenHit(source));
            continue;
          }
          if (volume) {
            target.hidden = false;
            applyRect(target, elementScreenRect(source));
            continue;
          }
          target.hidden = true;
          continue;
        }

        if (volume) {
          target.hidden = false;
          applyRect(target, elementScreenRect(source));
          continue;
        }

        target.hidden = true;
      }
      frame = window.requestAnimationFrame(update);
    };

    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [focused, playingId, root, stations, volume]);

  return (
    <div ref={layerRef} className="hit-layer">
      {stations.map((station) => (
        <button
          key={`${station.kind}-${station.index}`}
          type="button"
          data-hit={station.index}
          className={`hit-target tap hit-${station.kind}`}
          hidden
          aria-label={
            station.kind === "film"
              ? station.index === focused
                ? `Play ${station.title.en}`
                : `Focus ${station.title.en}`
              : `Open NOTE · ${station.noteNumber}`
          }
          onClick={(event) => {
            event.stopPropagation();
            if (shouldIgnoreTap()) {
              return;
            }
            if (station.kind === "note") {
              onOpenNote(station.slug);
              return;
            }
            if (station.index === focused) {
              onPlay(station.index);
              return;
            }
            onGoTo(station.index);
          }}
        />
      ))}
      {!volume ? (
        <div className="note-hits">
          {notes.map((note) => (
            <button
              key={`chip-${note.slug}`}
              type="button"
              className="note-hit tap"
              onClick={(event) => {
                event.stopPropagation();
                if (shouldIgnoreTap()) {
                  return;
                }
                onOpenNote(note.slug);
              }}
            >
              NOTE · {note.noteNumber}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
