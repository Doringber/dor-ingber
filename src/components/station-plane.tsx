"use client";

import { YoutubePlayer } from "@/components/youtube-player";
import { stationKicker, stationLabel, type SpatialStation } from "@/lib/stations";

type StationPlaneProps = {
  station: SpatialStation;
  resetKey?: string;
  playing?: boolean;
};

export function StationPlane({ station, resetKey, playing }: StationPlaneProps) {
  if (station.kind === "film") {
    return (
      <div className="station-plane fallback-plane fallback-film">
        <YoutubePlayer
          key={resetKey ?? station.youtubeId}
          youtubeId={station.youtubeId}
          title={stationLabel(station)}
          playing={playing}
        />
        {playing ? null : <span className="kicker plane-kicker">FILM</span>}
      </div>
    );
  }

  if (station.kind === "game" || station.kind === "build") {
    return (
      <div className="station-plane fallback-plane fallback-film fallback-link">
        <div className="link-plane">
          <span className="link-plane-title">{station.title.en}</span>
          <span className="kicker plane-kicker">{stationKicker(station)}</span>
          <span className="grain-thumb" aria-hidden />
        </div>
      </div>
    );
  }

  return (
    <div className="station-plane fallback-plane fallback-note">
      <span className="fallback-note-body" dir="rtl" lang="he">
        {station.title.he}
      </span>
      <span className="kicker">NOTE</span>
      <span className="grain-thumb" aria-hidden />
    </div>
  );
}
