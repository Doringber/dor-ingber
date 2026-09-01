export function youtubePoster(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function youtubeEmbedSrc(youtubeId: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    modestbranding: "1",
    rel: "0",
    color: "white",
    iv_load_policy: "3",
    playsinline: "1",
    disablekb: "0",
    cc_load_policy: "0",
  });

  return `https://www.youtube-nocookie.com/embed/${youtubeId}?${params.toString()}`;
}
