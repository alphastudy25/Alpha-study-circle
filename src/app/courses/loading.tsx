import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, GraduationCap, Sparkles } from "lucide-react";

export default function CoursesLoading() {
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8 space-y-8 animate-in fade-in duration-300">
      {/* Animated Hero Banner Skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 sm:p-7 md:p-8 border border-primary/20 space-y-3 shadow-xs">
        {/* Shimmer sweep effect */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent animate-[shimmer_2s_infinite]" />

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 py-1 px-2.5 text-xs font-medium border-primary/30 bg-primary/10 text-primary animate-pulse">
            <GraduationCap className="size-3.5 animate-bounce" />
            <span>Learning Portal</span>
          </Badge>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground animate-pulse">
            <Sparkles className="size-3 text-amber-500" />
            <span>Updating curriculum…</span>
          </div>
        </div>

        <div className="space-y-2 max-w-xl">
          <Skeleton className="h-7 sm:h-9 w-3/4 max-w-md rounded-lg" />
          <Skeleton className="h-4 w-full max-w-lg rounded-md" />
          <Skeleton className="h-4 w-2/3 max-w-sm rounded-md hidden sm:block" />
        </div>
      </div>

      {/* Courses Section Header Skeleton */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-32 sm:w-44 rounded-md" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <Skeleton className="h-4 w-20 rounded-md hidden sm:block" />
      </div>

      {/* Grid of Course Cards (Mobile-first 1 column, 2 on tablet, 3 on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3].map((i) => (
          <Card
            key={i}
            className="flex flex-col justify-between overflow-hidden border bg-card/80 backdrop-blur shadow-2xs relative"
          >
            {/* Top gradient accent line */}
            <div className="h-1 w-full bg-gradient-to-r from-primary/40 via-primary/80 to-primary/30 animate-pulse" />

            <CardHeader className="space-y-3 pb-3">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-6 w-3/4 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full shrink-0" />
              </div>
              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-3.5 w-full rounded" />
                <Skeleton className="h-3.5 w-5/6 rounded" />
                <Skeleton className="h-3.5 w-4/6 rounded" />
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-1 flex-1">
              {/* Progress bar skeleton */}
              <div className="space-y-1.5 rounded-lg bg-muted/40 p-3 border border-border/50">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="size-3 text-muted-foreground animate-pulse" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                  <Skeleton className="h-3 w-8 rounded" />
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary/40 rounded-full animate-[pulse_1.5s_ease-in-out_infinite]"
                    style={{ width: `${35 + i * 20}%` }}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2 pb-4 px-4 border-t border-border/50 bg-muted/10">
              <Skeleton className="h-11 sm:h-10 w-full rounded-lg" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
