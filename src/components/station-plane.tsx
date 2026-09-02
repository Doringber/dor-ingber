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
  tone,
  slug,
}: {
  children: ReactNode;
  kicker?: string;
  note?: boolean;
  tone?: boolean;
  slug: string;
}) {
  return (
    <div
      className={`station-plane fallback-plane film-rebate${note ? " fallback-note" : " fallback-film"}${tone ? " is-tone" : ""}`}
      data-slug={slug}
      data-kicker={kicker ?? ""}
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

function StillPoster({
  src,
  title,
  tone,
}: {
  src: string;
  title: string;
  tone?: boolean;
}) {
  return (
    <div className="media-frame plane-player">
      <div className="media-poster">
        <Image
          src={src}
          alt={title}
          fill
          sizes="(max-width: 720px) 100vw, min(56vw, 960px)"
          className={`media-image${tone ? " is-tone" : ""}`}
        />
        <span className="grain-thumb" aria-hidden />
      </div>
    </div>
  );
}

export function StationPlane({ station, resetKey, playing }: StationPlaneProps) {
  const kicker = playing && station.kind === "film" ? undefined : stationKicker(station);

  if (station.kind === "film") {
    return (
      <FilmRebate slug={station.slug} kicker={kicker}>
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
      <FilmRebate slug={station.slug} kicker={kicker} tone>
        {still ? (
          <StillPoster src={still} title={station.title.en} tone />
        ) : (
          <div className="link-plane plane-player is-tone">
            <span className="link-plane-title">{station.title.en}</span>
            <span className="grain-thumb" aria-hidden />
          </div>
        )}
      </FilmRebate>
    );
  }

  return (
    <FilmRebate slug={station.slug} kicker={kicker} note>
      <span className="fallback-note-body" dir="rtl" lang="he">
        {station.title.he}
      </span>
      <span className="grain-thumb" aria-hidden />
    </FilmRebate>
  );
}
