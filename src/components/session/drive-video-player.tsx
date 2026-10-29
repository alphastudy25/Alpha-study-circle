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

/**
 * Google Drive's video player uses an internal breakpoint to decide which
 * UI to render. When the iframe's width is below ~1200px it renders a
 * "compact" mobile layout where the scrubber jumps to the TOP. Above ~1200px
 * it renders the full desktop player (scrubber at BOTTOM, all controls visible).
 *
 * Fix: render the iframe at exactly 1280×720 (a hard desktop width) and then
 * CSS-scale the whole thing down to the actual container width. The player
 * always sees a 1280px viewport → full desktop controls everywhere.
 */
const IFRAME_W = 1280;
const IFRAME_H = 720; // 16:9

export const DriveVideoPlayer = forwardRef<
  DriveVideoPlayerRef,
  DriveVideoPlayerProps
>(function DriveVideoPlayer(
  { previewUrl, title, className = "", onFullscreenChange },
  ref,
) {
  const outerRef = useRef<HTMLDivElement>(null);   // the size-measured wrapper
  const containerRef = useRef<HTMLDivElement>(null); // the element we fullscreen

  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isNativeFS, setIsNativeFS] = useState(false);
  const [isFallbackFS, setIsFallbackFS] = useState(false);

  const activeFullscreen = isNativeFS || isFallbackFS;

  /* ─── resize observer ──────────────────────────────────────────────────── */
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setContainerWidth(w);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ─── native fullscreen events ─────────────────────────────────────────── */
  useEffect(() => {
    const onChange = () => {
      const doc = document as FullscreenDocument;
      const active =
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement;
      const on = !!active && active === containerRef.current;
      setIsNativeFS(on);
      onFullscreenChange?.(on || isFallbackFS);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [isFallbackFS, onFullscreenChange]);

  /* ─── ESC to exit fallback fullscreen ──────────────────────────────────── */
  useEffect(() => {
    if (!isFallbackFS) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFallbackFS(false);
        onFullscreenChange?.(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFallbackFS, onFullscreenChange]);

  /* ─── toggle fullscreen ─────────────────────────────────────────────────── */
  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current as FullscreenElement | null;
    if (!container) return;

    if (isFallbackFS) {
      setIsFallbackFS(false);
      onFullscreenChange?.(false);
      return;
    }

    if (isNativeFS) {
      const doc = document as FullscreenDocument;
      try {
        if (doc.exitFullscreen) await doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      } catch {/* ignore */}
      return;
    }

    try {
      if (container.requestFullscreen) await container.requestFullscreen();
      else if (container.webkitRequestFullscreen) await container.webkitRequestFullscreen();
      else { setIsFallbackFS(true); onFullscreenChange?.(true); }
    } catch {
      setIsFallbackFS(true);
      onFullscreenChange?.(true);
    }
  }, [isNativeFS, isFallbackFS, onFullscreenChange]);

  useImperativeHandle(ref, () => ({ toggleFullscreen, isFullscreen: activeFullscreen }), [
    toggleFullscreen,
    activeFullscreen,
  ]);

  /* ─── scale calculation ─────────────────────────────────────────────────── */
  // Scale the 1280-wide iframe DOWN so it fits the real container.
  // If containerWidth >= IFRAME_W we don't scale (scale = 1).
  const scale = containerWidth > 0 ? Math.min(1, containerWidth / IFRAME_W) : 1;
  const scaledH = IFRAME_H * scale; // actual rendered height after scale

  /* ─── render ─────────────────────────────────────────────────────────────── */
  return (
    /**
     * outerRef  – we measure this width (it follows the normal page flow).
     * containerRef – the div we request fullscreen on (may be fixed overlay in fallback).
     */
    <div ref={outerRef} className={`w-full ${className}`}>
      <div
        ref={containerRef}
        className={
          activeFullscreen
            ? "fixed inset-0 z-50 bg-black flex items-center justify-center"
            : "relative w-full bg-black rounded-xl overflow-hidden border border-border/40 shadow-sm"
        }
        /* In normal (non-fullscreen) mode the outer div is sized by the scaled
           iframe height so there is no empty gap above/below the video. */
        style={activeFullscreen ? undefined : { height: scaledH > 0 ? scaledH : undefined }}
      >
        {/* ── loading overlay ───────────────────────────────────────────── */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/90 text-muted-foreground gap-2 text-xs">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>Loading session video…</span>
          </div>
        )}

        {/* ── iframe at full 1280×720, scaled down ─────────────────────── */}
        <iframe
          src={previewUrl}
          title={title}
          className="border-0 block"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          style={
            activeFullscreen
              ? { width: "100%", height: "100%" }
              : {
                  width: `${IFRAME_W}px`,
                  height: `${IFRAME_H}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  display: "block",
                }
          }
        />

        {/* ── block the Google Drive top-right pop-out icon ────────────── */}
        {!activeFullscreen && (
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 z-20 bg-black"
            style={{ width: Math.round(72 * scale), height: Math.round(56 * scale) }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
          />
        )}

        {/* ── exit button visible in fullscreen ────────────────────────── */}
        {activeFullscreen && (
          <Button
            type="button"
            size="sm"
            onClick={toggleFullscreen}
            className="absolute top-4 left-4 z-30 bg-zinc-900/90 text-white hover:bg-zinc-800 border border-white/20 shadow-lg text-xs flex items-center gap-1.5"
          >
            <Minimize2 className="size-3.5" />
            Exit Full Screen
          </Button>
        )}
      </div>
    </div>
  );
});
