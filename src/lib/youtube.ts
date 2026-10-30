const YOUTUBE_ID = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extracts a YouTube video ID from various URL formats:
 *   - https://www.youtube.com/watch?v=VIDEO_ID
 *   - https://youtu.be/VIDEO_ID
 *   - https://www.youtube.com/embed/VIDEO_ID
 *   - https://www.youtube-nocookie.com/embed/VIDEO_ID
 *   - https://m.youtube.com/watch?v=VIDEO_ID
 *   - bare VIDEO_ID (11-char alphanumeric + dash/underscore)
 */
export function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (YOUTUBE_ID.test(trimmed)) return trimmed;

  try {
    const withProto = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const url = new URL(withProto);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0]?.split("?")[0];
      return id && YOUTUBE_ID.test(id) ? id : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const v = url.searchParams.get("v");
      if (v && YOUTUBE_ID.test(v)) return v;

      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) =>
        ["embed", "shorts", "live", "v"].includes(p),
      );
      const candidate = idx >= 0 ? parts[idx + 1] : undefined;
      if (candidate && YOUTUBE_ID.test(candidate)) return candidate;
    }
  } catch {
    return null;
  }

  return null;
}

export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
}
