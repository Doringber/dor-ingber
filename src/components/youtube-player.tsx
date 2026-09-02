"use client";

import Image from "next/image";
import { useState } from "react";
import { youtubeEmbedSrc, youtubePoster } from "@/lib/youtube";

type YoutubePlayerProps = {
  youtubeId: string;
  title: string;
  heavyGrain?: boolean;
  autoPlay?: boolean;
  playing?: boolean;
  onPlay?: () => void;
};

export function YoutubePlayer({
  youtubeId,
  title,
  heavyGrain = true,
  autoPlay = false,
  playing: playingProp,
  onPlay,
}: YoutubePlayerProps) {
  const [internalPlaying, setInternalPlaying] = useState(autoPlay);
  const playing = playingProp ?? internalPlaying;

  const play = () => {
    if (onPlay) {
      onPlay();
      return;
    }
    setInternalPlaying(true);
  };

  return (
    <div className="media-frame">
      {playing ? (
        <iframe
          className="media-iframe"
          src={youtubeEmbedSrc(youtubeId)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <div className="media-poster">
          <Image
            src={youtubePoster(youtubeId)}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 720px) 100vw, 920px"
            className="media-image"
            onError={(event) => {
              event.currentTarget.style.visibility = "hidden";
            }}
          />
          {heavyGrain ? <span className="grain-thumb" aria-hidden /> : null}
          <span className="media-wash" aria-hidden />
          {onPlay ? null : (
            <button
              type="button"
              className="media-play-fallback tap"
              onClick={play}
              aria-label={`Play ${title}`}
            />
          )}
        </div>
      )}
    </div>
  );
}
