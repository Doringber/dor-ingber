"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { YoutubePlayer } from "@/components/youtube-player";
import {
  stationKicker,
  stationLabel,
  stationStillSrc,
  type SpatialStation,
} from "@/lib/stations";

type StationPlaneProps = {
  station: SpatialStation;
  resetKey?: string;
  playing?: boolean;
};

function GestureLayer() {
  return <span className="plane-gesture" aria-hidden />;
}

function FilmRebate({
  children,
  kicker,
  note,
}: {
  children: ReactNode;
  kicker?: string;
  note?: boolean;
}) {
  return (
    <div
      className={`station-plane fallback-plane film-rebate${note ? " fallback-note" : " fallback-film"}`}
    >
      <span className="film-rebate-age" aria-hidden />
      <span className="film-rebate-sprockets" aria-hidden />
      <span className="film-rebate-mark" aria-hidden>
        9 6
      </span>
      <div className={`film-window${note ? " is-note" : ""}`}>
        {children}
        {kicker ? <span className="kicker plane-kicker">{kicker}</span> : null}
      </div>
      <GestureLayer />
    </div>
  );
}

function StillPoster({ src, title }: { src: string; title: string }) {
  return (
    <div className="media-frame plane-player">
      <div className="media-poster">
        <Image
          src={src}
          alt={title}
          fill
          sizes="(max-width: 720px) 100vw, min(56vw, 960px)"
          className="media-image"
        />
        <span className="grain-thumb" aria-hidden />
      </div>
    </div>
  );
}

export function StationPlane({ station, resetKey, playing }: StationPlaneProps) {
  if (station.kind === "film") {
    return (
      <FilmRebate kicker={playing ? undefined : "FILM"}>
        <YoutubePlayer
          key={resetKey ?? station.youtubeId}
          youtubeId={station.youtubeId}
          title={stationLabel(station)}
          playing={playing}
        />
      </FilmRebate>
    );
  }

  if (station.kind === "game" || station.kind === "build") {
    const still = stationStillSrc(station);
    return (
      <FilmRebate kicker={stationKicker(station)}>
        {still ? (
          <StillPoster src={still} title={station.title.en} />
        ) : (
          <div className="link-plane plane-player">
            <span className="link-plane-title">{station.title.en}</span>
            <span className="grain-thumb" aria-hidden />
          </div>
        )}
      </FilmRebate>
    );
  }

  return (
    <FilmRebate kicker="NOTE" note>
      <span className="fallback-note-body" dir="rtl" lang="he">
        {station.title.he}
      </span>
      <span className="grain-thumb" aria-hidden />
    </FilmRebate>
  );
}
