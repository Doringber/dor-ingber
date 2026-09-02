"use client";

import { YoutubePlayer } from "@/components/youtube-player";
import { stationLabel, type SpatialStation } from "@/lib/stations";

type StationPlaneProps = {
  station: SpatialStation;
  onOpenNote: (slug: string) => void;
  resetKey?: string;
};

export function StationPlane({ station, onOpenNote, resetKey }: StationPlaneProps) {
  if (station.kind === "film") {
    return (
      <div className="station-plane fallback-plane fallback-film">
        <YoutubePlayer
          key={resetKey ?? station.youtubeId}
          youtubeId={station.youtubeId}
          title={stationLabel(station)}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="station-plane fallback-plane fallback-note tap"
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
