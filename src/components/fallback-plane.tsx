"use client";

import { YoutubePlayer } from "@/components/youtube-player";
import { stationLabel, type SpatialStation } from "@/lib/stations";

type FallbackPlaneProps = {
  station: SpatialStation;
  onOpenNote: (slug: string) => void;
};

export function FallbackPlane({ station, onOpenNote }: FallbackPlaneProps) {
  if (station.kind === "film") {
    return (
      <div className="fallback-plane fallback-film">
        <YoutubePlayer
          key={station.youtubeId}
          youtubeId={station.youtubeId}
          title={stationLabel(station)}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="fallback-plane fallback-note tap"
      onClick={() => onOpenNote(station.slug)}
    >
      <span className="fallback-note-body" dir="rtl" lang="he">
        {station.title.he}
      </span>
      <span className="kicker">NOTE · {station.noteNumber}</span>
      <span className="grain-thumb" aria-hidden />
    </button>
  );
}
