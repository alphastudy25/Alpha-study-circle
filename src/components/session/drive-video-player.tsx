"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Loader2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DriveVideoPlayerRef {
  toggleFullscreen: () => void;
  isFullscreen: boolean;
}

interface DriveVideoPlayerProps {
  previewUrl: string;
  title: string;
  className?: string;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

interface FullscreenElement extends HTMLDivElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

// 720x405 provides the optimal 16:9 dimensions where Google Drive's player
// renders its full desktop control bar (play/pause, 10s rewind/forward, time,
// bottom scrubber, speed, settings, and native fullscreen button) instead of
// falling back to the mobile "tiny mode" where the slider jumps to the top.
const BASE_WIDTH = 720;
const BASE_HEIGHT = 405;

export const DriveVideoPlayer = forwardRef<
  DriveVideoPlayerRef,
  DriveVideoPlayerProps
>(function DriveVideoPlayer(
  { previewUrl, title, className = "", onFullscreenChange },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFallbackFullscreen, setIsFallbackFullscreen] = useState(false);

  const activeFullscreen = isFullscreen || isFallbackFullscreen;

  // Measure container width to scale iframe on mobile
  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;
    const updateSize = () => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setContainerWidth(rect.width);
      }
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Listen for native browser fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as FullscreenDocument;
      const activeElement =
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement;

      const fsActive = !!activeElement && activeElement === containerRef.current;
      setIsFullscreen(fsActive);
      onFullscreenChange?.(fsActive);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [onFullscreenChange]);

  // Fullscreen toggle handler
  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current as FullscreenElement | null;
    if (!container) return;

    if (isFallbackFullscreen) {
      setIsFallbackFullscreen(false);
      onFullscreenChange?.(false);
      return;
    }

    if (isFullscreen) {
      const doc = document as FullscreenDocument;
      try {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      } catch (e) {
        console.warn("Failed to exit native fullscreen:", e);
      }
      return;
    }

    try {
      if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        await container.webkitRequestFullscreen();
      } else {
        // Fallback for iOS Safari on iPhones which restrict div.requestFullscreen
        setIsFallbackFullscreen(true);
        onFullscreenChange?.(true);
      }
    } catch {
      // Browser blocked native fullscreen, use smooth in-app fullscreen modal
      setIsFallbackFullscreen(true);
      onFullscreenChange?.(true);
    }
  }, [isFullscreen, isFallbackFullscreen, onFullscreenChange]);

  // Expose methods to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      toggleFullscreen,
      isFullscreen: activeFullscreen,
    }),
    [toggleFullscreen, activeFullscreen],
  );

  // Allow ESC key to exit in fallback mode
  useEffect(() => {
    if (!isFallbackFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFallbackFullscreen(false);
        onFullscreenChange?.(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFallbackFullscreen, onFullscreenChange]);

  // Scaling logic
  const isScaled = containerWidth > 0 && containerWidth < BASE_WIDTH;
  const scale = isScaled ? containerWidth / BASE_WIDTH : 1;

  return (
    <div
      ref={containerRef}
      className={`group relative overflow-hidden bg-black transition-all ${
        activeFullscreen
          ? "fixed inset-0 z-50 flex items-center justify-center w-screen h-screen p-0 m-0 rounded-none border-0"
          : `w-full aspect-video rounded-xl border border-border/50 shadow-sm ${className}`
      }`}
    >
      {/* Loading state indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/90 z-10 text-muted-foreground gap-2 text-xs">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span>Loading session video…</span>
        </div>
      )}

      {/* Video frame container */}
      <div
        className="relative overflow-hidden flex items-center justify-center"
        style={{
          width: activeFullscreen ? "100%" : "100%",
          height: activeFullscreen ? "100%" : "100%",
          maxWidth: activeFullscreen ? "100vw" : "100%",
          maxHeight: activeFullscreen ? "100vh" : "100%",
          aspectRatio: "16 / 9",
        }}
      >
        <iframe
          src={previewUrl}
          title={title}
          className="border-0"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          style={
            isScaled && !activeFullscreen
              ? {
                  width: `${BASE_WIDTH}px`,
                  height: `${BASE_HEIGHT}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }
              : {
                  width: "100%",
                  height: "100%",
                }
          }
        />

        {/* Top-Right Blocking Layer:
            Directly masks and intercepts touch/clicks on Google Drive's pop-out button
            (which redirects users to google drive in a new tab).
            Students will instead use the designated 'Open in Google Drive' button below the video.
        */}
        <div
          className="absolute top-0 right-0 w-16 h-14 z-20 bg-black pointer-events-auto select-none cursor-default"
          aria-hidden="true"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      </div>

      {/* Floating Exit Button for Fullscreen Mode */}
      {activeFullscreen && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={toggleFullscreen}
          className="absolute top-4 left-4 z-30 bg-zinc-900/90 text-white hover:bg-zinc-800 border border-white/20 shadow-lg text-xs flex items-center gap-1.5 backdrop-blur-xs"
        >
          <Minimize2 className="size-3.5" />
          Exit Full Screen
        </Button>
      )}
    </div>
  );
});
