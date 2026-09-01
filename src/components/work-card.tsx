import type { Work } from "@/lib/types";
import { YoutubePlayer } from "@/components/youtube-player";

const KIND_LABEL: Record<Work["kind"], string> = {
  short: "SHORT",
  series: "SERIES",
};

type WorkCardProps = {
  work: Work;
};

export function WorkCard({ work }: WorkCardProps) {
  return (
    <article className="card work-card">
      <YoutubePlayer
        youtubeId={work.youtubeId}
        title={`${work.title.he} / ${work.title.en}`}
      />
      <div className="card-body">
        <p className="meta">
          {work.featured ? (
            <>
              <span className="kicker">FEATURED</span>
              <span className="meta-dot" aria-hidden>
                ·
              </span>
            </>
          ) : null}
          <span>
            {KIND_LABEL[work.kind]} · {work.year}
          </span>
        </p>
        <h3 className="card-title" dir="rtl" lang="he">
          {work.title.he}
        </h3>
        <p className="card-title-en" dir="ltr" lang="en">
          {work.title.en}
        </p>
        {work.summary ? (
          <div className="card-summary">
            <p dir="rtl" lang="he">
              {work.summary.he}
            </p>
            <p dir="ltr" lang="en">
              {work.summary.en}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
