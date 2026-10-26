import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayCircle, Sparkles } from "lucide-react";

export default function CourseDetailLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Mobile navigation header skeleton (only visible on mobile) */}
      <div className="md:hidden pb-1">
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>

      {/* Lesson / Section Title Skeleton */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] animate-pulse">
            <Sparkles className="size-2.5 mr-1" />
            Loading Lesson
          </Badge>
        </div>
        <Skeleton className="h-8 w-3/4 max-w-md rounded-lg" />
        <Skeleton className="h-4 w-full max-w-lg rounded-md" />
      </div>

      {/* Video Player Skeleton with Center Pulsing Play Icon */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-black/5 dark:bg-muted/20 shadow-xs flex items-center justify-center">
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent animate-[shimmer_2s_infinite]" />
        <div className="relative flex flex-col items-center justify-center gap-2">
          <div className="size-14 sm:size-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
            <PlayCircle className="size-8 sm:size-10 text-primary animate-ping opacity-60" />
          </div>
          <span className="text-xs text-muted-foreground font-medium animate-pulse">
            Preparing video stream…
          </span>
        </div>
      </div>

      {/* Action Buttons Skeleton (touch-friendly on mobile) */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Skeleton className="h-11 sm:h-10 w-full sm:w-44 rounded-lg" />
        <Skeleton className="h-11 sm:h-10 w-full sm:w-48 rounded-lg" />
      </div>

      {/* Lesson Notes / Content Card Skeleton */}
      <Card className="border bg-card/60 backdrop-blur p-4 sm:p-6 space-y-3">
        <Skeleton className="h-5 w-36 rounded-md" />
        <div className="space-y-2 pt-1">
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-3.5 w-11/12 rounded" />
          <Skeleton className="h-3.5 w-4/5 rounded" />
        </div>
      </Card>
    </div>
  );
}
