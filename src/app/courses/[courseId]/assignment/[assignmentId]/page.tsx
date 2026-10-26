"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarkdownMath } from "@/components/math/markdown-math";
import { formatDueDate } from "@/lib/format";
import { ArrowRight, Loader2, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/lib/convex";

export default function AssignmentOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as Id<"courses">;
  const assignmentId = params.assignmentId as Id<"assignments">;

  const info = useQuery(api.assignments.getForStudent, { courseId, assignmentId });
  const startAttempt = useMutation(api.attempts.start);
  const setLastViewed = useMutation(api.courses.setLastViewed);

  const [isStarting, setIsStarting] = useState(false);

  if (info === undefined) {
    return (
      <div className="p-8 flex items-center justify-center gap-2 text-sm text-muted-foreground min-h-[40vh]">
        <Loader2 className="size-4 animate-spin text-primary" />
        Loading assignment…
      </div>
    );
  }
  if (!info) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground min-h-[40vh] flex flex-col items-center justify-center">
        <p className="font-medium text-base text-foreground mb-1">Assignment not found.</p>
      </div>
    );
  }

  const { assignment, attempts, countedScore, inProgressId, effectiveDue, pastDue } =
    info;

  async function handleStart() {
    setIsStarting(true);
    try {
      const id = await startAttempt({ courseId, assignmentId });
      void setLastViewed({
        courseId,
        path: `/courses/${courseId}/assignment/${assignmentId}`,
      });
      router.push(`/courses/${courseId}/assignment/${assignmentId}/attempt/${id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start attempt");
      setIsStarting(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant={assignment.kind === "practice" ? "secondary" : "default"}>
            {assignment.kind === "practice" ? "Practice" : "Graded"}
          </Badge>
          {pastDue && assignment.kind === "graded" ? (
            <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400">
              Past deadline
            </Badge>
          ) : null}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{assignment.title}</h1>
        {assignment.instructions ? (
          <div className="mt-3 prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            <MarkdownMath content={assignment.instructions} />
          </div>
        ) : null}
      </div>

      {assignment.kind === "graded" && effectiveDue ? (
        <p className="text-xs sm:text-sm text-muted-foreground bg-muted/40 p-3 rounded-lg border">
          Due <strong>{formatDueDate(effectiveDue)}</strong>
          {countedScore !== null ? (
            <>
              {" "}
              · Counted score: <strong>{countedScore.toFixed(1)}</strong> (
              {assignment.scoringPolicy} attempt)
            </>
          ) : null}
        </p>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        {inProgressId ? (
          <Link
            href={`/courses/${courseId}/assignment/${assignmentId}/attempt/${inProgressId}`}
            className={buttonVariants({
              className: "w-full sm:w-auto min-h-11 sm:min-h-10 text-sm font-medium flex items-center justify-center",
            })}
          >
            <span>Resume Attempt</span>
            <ArrowRight className="size-4 ml-2" />
          </Link>
        ) : (
          <Button
            disabled={(pastDue && assignment.latePolicy === "strict") || isStarting}
            onClick={handleStart}
            className="w-full sm:w-auto min-h-11 sm:min-h-10 text-sm font-medium"
          >
            {isStarting ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Starting Attempt…
              </>
            ) : (
              <>
                <Play className="size-3.5 mr-2" />
                {attempts.length ? "Start New Attempt" : "Start Attempt"}
              </>
            )}
          </Button>
        )}
      </div>

      {attempts.length ? (
        <section className="space-y-3 pt-2">
          <h2 className="font-semibold text-base">Attempt History</h2>
          <ul className="divide-y rounded-xl border bg-card shadow-2xs">
            {attempts.map((a: {
              _id: string;
              attemptNo: number;
              submittedAt?: number;
              isLate: boolean;
              score?: number;
              maxScore?: number;
            }) => (
              <li
                key={a._id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-medium">Attempt {a.attemptNo}</span>
                  {a.submittedAt ? (
                    <span className="text-muted-foreground text-xs ml-2">
                      {formatDueDate(a.submittedAt)}
                    </span>
                  ) : null}
                  {a.isLate ? (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Late
                    </Badge>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  {a.score !== undefined ? (
                    <span className="font-medium text-xs sm:text-sm">
                      {a.score}/{a.maxScore ?? "—"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">In progress</span>
                  )}
                  <Link
                    href={`/courses/${courseId}/assignment/${assignmentId}/attempt/${a._id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
