"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { googleDrivePreviewUrl } from "@/lib/drive";
import { Button } from "@/components/ui/button";
import { MarkdownMath } from "@/components/math/markdown-math";
import {
  CheckCircle2,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type { Id } from "@/lib/convex";
import { toast } from "sonner";
import {
  DriveVideoPlayer,
  type DriveVideoPlayerRef,
} from "@/components/session/drive-video-player";

export default function SessionPage() {
  const params = useParams();
  const courseId = params.courseId as Id<"courses">;
  const sessionId = params.sessionId as Id<"sessions">;

  const session = useQuery(api.sessions.get, { courseId, sessionId });
  const structure = useQuery(api.courses.getStructure, { courseId });
  const markComplete = useMutation(api.progress.markSessionComplete);
  const touch = useMutation(api.progress.touchSession);
  const setLastViewed = useMutation(api.courses.setLastViewed);

  const [isUpdating, setIsUpdating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerRef = useRef<DriveVideoPlayerRef>(null);

  useEffect(() => {
    void touch({ courseId, sessionId });
    void setLastViewed({
      courseId,
      path: `/courses/${courseId}/session/${sessionId}`,
    });
  }, [courseId, sessionId, touch, setLastViewed]);

  const progress = structure?.sections
    .flatMap((s: { sessions: { _id: string; completed?: boolean }[] }) => s.sessions)
    .find((s: { _id: string }) => s._id === sessionId);

  if (session === undefined) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center gap-2 text-sm text-muted-foreground min-h-[40vh]">
        <Loader2 className="size-4 animate-spin text-primary" />
        Loading lesson…
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="p-6 md:p-8 text-center text-sm text-muted-foreground min-h-[40vh] flex flex-col items-center justify-center">
        <p className="font-medium text-base text-foreground mb-1">Session not found.</p>
        <p className="text-xs">It may have been unpublished or removed by the instructor.</p>
      </div>
    );
  }

  const preview = googleDrivePreviewUrl(session.videoRef);

  async function handleToggleComplete() {
    setIsUpdating(true);
    try {
      const nextState = !progress?.completed;
      await markComplete({
        courseId,
        sessionId,
        completed: nextState,
      });
      toast.success(nextState ? "Marked lesson as completed!" : "Lesson progress updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update progress");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{session.title}</h1>
        {session.description ? (
          <div className="mt-3 prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            <MarkdownMath content={session.description} />
          </div>
        ) : null}
      </div>

      <DriveVideoPlayer
        ref={playerRef}
        previewUrl={preview}
        title={session.title}
        youtubeId={session.youtubeId}
        onFullscreenChange={setIsFullscreen}
      />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center pt-1">
        <Button
          variant={progress?.completed ? "secondary" : "default"}
          disabled={isUpdating}
          onClick={handleToggleComplete}
          className="w-full sm:w-auto min-h-11 sm:min-h-10 text-sm font-medium"
        >
          {isUpdating ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Updating…
            </>
          ) : progress?.completed ? (
            <>
              <CheckCircle2 className="size-4 mr-2 text-emerald-600 dark:text-emerald-400" />
              Completed ✓
            </>
          ) : (
            "Mark as Complete"
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => playerRef.current?.toggleFullscreen()}
          className="w-full sm:w-auto min-h-11 sm:min-h-10 text-sm font-medium inline-flex items-center justify-center"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="size-3.5 mr-2" />
              Exit Full Screen
            </>
          ) : (
            <>
              <Maximize2 className="size-3.5 mr-2" />
              Full Screen
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
