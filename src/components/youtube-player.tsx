"use client";

import Image from "next/image";
import { useState } from "react";
import { youtubeEmbedSrc, youtubePoster } from "@/lib/youtube";

type YoutubePlayerProps = {
  youtubeId: string;
  title: string;
  heavyGrain?: boolean;
  autoPlay?: boolean;
};

export function YoutubePlayer({
  youtubeId,
  title,
  heavyGrain = true,
  autoPlay = false,
}: YoutubePlayerProps) {
  const [playing, setPlaying] = useState(autoPlay);

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
        <button
          type="button"
          className="media-poster tap"
          onClick={() => setPlaying(true)}
          aria-label={`Play ${title}`}
        >
          <Image
            src={youtubePoster(youtubeId)}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 720px) 100vw, 360px"
            className="media-image"
            onError={(event) => {
              event.currentTarget.style.visibility = "hidden";
            }}
          />
          {heavyGrain ? <span className="grain-thumb" aria-hidden /> : null}
          <span className="media-wash" aria-hidden />
          <span className="play-button" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M8 5.14v13.72L19 12 8 5.14Z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
