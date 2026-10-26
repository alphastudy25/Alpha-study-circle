import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <Card className="w-full max-w-sm border bg-card/75 backdrop-blur-md shadow-lg overflow-hidden relative">
        {/* Animated accent gradient at top */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/30 via-primary to-primary/30 animate-pulse" />

        <CardContent className="pt-8 pb-7 px-6 flex flex-col items-center text-center space-y-5">
          {/* Animated Mascot / Badge Container */}
          <div className="relative flex items-center justify-center">
            {/* Pulsing ambient glow */}
            <div className="absolute size-20 rounded-full bg-primary/25 blur-xl animate-pulse" />

            {/* Orbiting spinner ring */}
            <div className="size-16 rounded-2xl border-2 border-primary/20 border-t-primary animate-spin" />

            {/* Inner icon */}
            <div className="absolute size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-xs">
              <GraduationCap className="size-5 animate-bounce" />
            </div>
          </div>

          {/* Branded Title & Status Badge */}
          <div className="space-y-2 flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight">Alpha Study Circle</span>
              <Sparkles className="size-3.5 text-amber-500 animate-pulse" />
            </div>

            <Badge
              variant="outline"
              className="text-[11px] font-medium border-primary/30 bg-primary/5 text-primary py-0.5 px-2.5 animate-pulse"
            >
              Loading learning space…
            </Badge>
          </div>

          {/* Shimmer skeleton bars */}
          <div className="w-full space-y-2 pt-1 max-w-[240px]">
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-2 w-3/4 mx-auto rounded-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
