"use client";

import { useEffect, useState } from "react";

export function ReadProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const article = document.querySelector<HTMLElement>("[data-article]");
      if (!article) {
        return;
      }

      const top = article.offsetTop;
      const height = Math.max(article.offsetHeight - window.innerHeight, 1);
      const next = Math.min(
        1,
        Math.max(0, (window.scrollY - top + 64) / height),
      );
      setProgress(next);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="read-progress" aria-hidden>
      <div className="read-progress-fill" style={{ height: `${progress * 100}%` }} />
    </div>
  );
}
