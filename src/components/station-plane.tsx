"use client";

import { YoutubePlayer } from "@/components/youtube-player";
import { stationLabel, type SpatialStation } from "@/lib/stations";

type StationPlaneProps = {
  station: SpatialStation;
  resetKey?: string;
  playing?: boolean;
  onPlay?: () => void;
};

export function StationPlane({
  station,
  resetKey,
  playing,
  onPlay,
}: StationPlaneProps) {
  if (station.kind === "film") {
    return (
      <div className="station-plane fallback-plane fallback-film">
        <YoutubePlayer
          key={resetKey ?? station.youtubeId}
          youtubeId={station.youtubeId}
          title={stationLabel(station)}
          playing={playing}
          onPlay={onPlay}
        />
      </div>
    );
  }

  return (
    <div className="station-plane fallback-plane fallback-note">
      <span className="fallback-note-body" dir="rtl" lang="he">
        {station.title.he}
      </span>
      <span className="kicker">NOTE · {station.noteNumber}</span>
      <span className="grain-thumb" aria-hidden />
    </div>
  );
}
