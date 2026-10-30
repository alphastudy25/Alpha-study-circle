"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { googleDrivePreviewUrl } from "@/lib/drive";

export interface DriveVideoPlayerRef {
  toggleFullscreen: () => void;
  isFullscreen: boolean;
}

interface DriveVideoPlayerProps {
  /** Google Drive file ref (ID or URL) — used as fallback when youtubeId is empty */
  previewUrl: string;
  title: string;
  /** YouTube video ID — when present, renders YouTube embed instead of Drive */
  youtubeId?: string | null;
  className?: string;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

interface FSDocument extends Document {
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

interface FSElement extends HTMLDivElement {
  webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

interface ScreenOrientationExtended extends ScreenOrientation {
  lock?: (orientation: string) => Promise<void>;
}

function getFullscreenElement(): Element | null {
  const doc = document as FSDocument;
  return (
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement ||
    null
  );
}

function lockLandscape() {
  try {
    const orient = screen.orientation as ScreenOrientationExtended;
    void orient.lock?.("landscape").catch(() => undefined);
  } catch {
    /* orientation lock is optional */
  }
}

function unlockOrientation() {
  try {
    screen.orientation.unlock?.();
  } catch {
    /* ignore */
  }
}

async function exitNativeFullscreen() {
  const doc = document as FSDocument;
  try {
    if (doc.exitFullscreen) await doc.exitFullscreen();
    else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
    else if (doc.mozCancelFullScreen) await doc.mozCancelFullScreen();
    else if (doc.msExitFullscreen) await doc.msExitFullscreen();
  } catch {
    /* ignore */
  }
}

/**
 * YouTube or Drive video player. When youtubeId is provided, renders a
 * privacy-enhanced YouTube embed via youtube-nocookie.com. Otherwise falls
 * back to the Google Drive preview iframe. No custom player chrome —
 * YouTube / Drive own their own controls.
 */
export const DriveVideoPlayer = forwardRef<
  DriveVideoPlayerRef,
  DriveVideoPlayerProps
>(function DriveVideoPlayer(
  { previewUrl, title, youtubeId, className = "", onFullscreenChange },
  ref,
) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fallbackRef = useRef(false);

  const [isFallbackFS, setIsFallbackFS] = useState(false);
  const [isNativeFS, setIsNativeFS] = useState(false);

  const activeFullscreen = isFallbackFS || isNativeFS;

  const notify = useCallback(
    (on: boolean) => {
      onFullscreenChange?.(on);
    },
    [onFullscreenChange],
  );

  const setFallback = useCallback(
    (on: boolean) => {
      fallbackRef.current = on;
      setIsFallbackFS(on);
      notify(on || !!getFullscreenElement());
    },
    [notify],
  );

  useEffect(() => {
    const onChange = () => {
      const active = getFullscreenElement();
      const on =
        !!active &&
        (active === wrapperRef.current || active === iframeRef.current);
      setIsNativeFS(on);
      if (on) {
        fallbackRef.current = false;
        setIsFallbackFS(false);
      }
      notify(on || fallbackRef.current);
      if (!on && !fallbackRef.current) unlockOrientation();
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [notify]);

  useEffect(() => {
    if (!isFallbackFS) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFallback(false);
        unlockOrientation();
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isFallbackFS, setFallback]);

  const toggleFullscreen = useCallback(async () => {
    const wrapper = wrapperRef.current as FSElement | null;
    if (!wrapper) return;

    if (fallbackRef.current) {
      setFallback(false);
      unlockOrientation();
      return;
    }

    if (getFullscreenElement()) {
      await exitNativeFullscreen();
      unlockOrientation();
      return;
    }

    try {
      if (wrapper.requestFullscreen) await wrapper.requestFullscreen();
      else if (wrapper.webkitRequestFullscreen)
        await wrapper.webkitRequestFullscreen();
      else if (wrapper.mozRequestFullScreen) await wrapper.mozRequestFullScreen();
      else if (wrapper.msRequestFullscreen) await wrapper.msRequestFullscreen();
      else {
        setFallback(true);
        lockLandscape();
        return;
      }
      lockLandscape();
    } catch {
      setFallback(true);
      lockLandscape();
    }
  }, [setFallback]);

  useImperativeHandle(
    ref,
    () => ({ toggleFullscreen, isFullscreen: activeFullscreen }),
    [toggleFullscreen, activeFullscreen],
  );

  // Determine iframe src — YouTube when youtubeId is present, else Drive
  const iframeSrc = youtubeId
    ? youtubeEmbedUrl(youtubeId)
    : previewUrl;

  const iframeAllow = youtubeId
    ? "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    : "autoplay; fullscreen; picture-in-picture; encrypted-media";

  return (
    <div className={`w-full ${className}`}>
      {/* aspect-video keeps page layout when the wrapper is position:fixed */}
      <div className="relative w-full aspect-video rounded-xl bg-black overflow-hidden">
        <div
          ref={wrapperRef}
          className={
            isFallbackFS
              ? "fixed inset-0 z-50 bg-black"
              : isNativeFS
                ? "h-full w-full bg-black"
                : "absolute inset-0 rounded-xl bg-black overflow-hidden"
          }
        >
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            title={title}
            allow={iframeAllow}
            allowFullScreen
            className="h-full w-full border-0"
            {...(!youtubeId
              ? ({
                  webkitallowfullscreen: "true",
                  mozallowfullscreen: "true",
                } as Record<string, string>)
              : {})}
          />

          {isFallbackFS ? (
            <Button
              type="button"
              size="sm"
              onClick={toggleFullscreen}
              className="absolute top-3 left-3 z-30 flex items-center gap-1.5 border border-white/20 bg-zinc-900/90 text-xs text-white shadow-lg hover:bg-zinc-800"
            >
              <Minimize2 className="size-3.5" />
              Exit Full Screen
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
});
