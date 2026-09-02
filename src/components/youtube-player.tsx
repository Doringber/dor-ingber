"use client";

import Image from "next/image";
import { youtubeEmbedSrc, youtubePoster } from "@/lib/youtube";

type YoutubePlayerProps = {
  youtubeId: string;
  title: string;
  heavyGrain?: boolean;
  playing?: boolean;
};

export function YoutubePlayer({
  youtubeId,
  title,
  heavyGrain = true,
  playing = false,
}: YoutubePlayerProps) {
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
        </div>
      )}
    </div>
  );
}
