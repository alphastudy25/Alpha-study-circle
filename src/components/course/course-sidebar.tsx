"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDueDate } from "@/lib/format";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";
import type { Id } from "@/lib/convex";

export type CourseStructure = {
  course: { _id: Id<"courses">; title: string };
  sections: Array<{
    _id: Id<"sections">;
    title: string;
    type: string;
    locked?: boolean;
    sessions: Array<{
      _id: Id<"sessions">;
      title: string;
      completed?: boolean;
      hasActivity?: boolean;
      activityCompleted?: boolean;
    }>;
    assignments: Array<{
      _id: Id<"assignments">;
      title: string;
      kind: string;
      dueAt?: number;
    }>;
  }>;
};

export function CourseSidebar({
  courseId,
  structure,
  onNavigate,
  className,
}: {
  courseId: Id<"courses">;
  structure: CourseStructure;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const defaultWeek = structure.sections.find((s) => !s.locked)?.title ?? "Week 1";

  return (
    <aside
      className={cn(
        "w-72 shrink-0 border-r bg-sidebar/50 overflow-y-auto",
        className,
      )}
    >
      <Accordion defaultValue={[defaultWeek]} className="px-2 py-3">
        {structure.sections.map((section) => (
          <AccordionItem key={section._id} value={section.title}>
            <AccordionTrigger className="text-sm font-medium px-2 py-2.5">
              <span className="truncate">{section.title}</span>
              {section.locked ? (
                <Badge variant="outline" className="ml-2 text-xs shrink-0">
                  Locked
                </Badge>
              ) : null}
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              {section.locked ? (
                <p className="px-3 text-xs text-muted-foreground">
                  Opens later — check back with your instructor.
                </p>
              ) : (
                <ul className="space-y-1">
                  {section.sessions.map((session) => {
                    const sessionHref = `/courses/${courseId}/session/${session._id}`;
                    const activityHref = `/courses/${courseId}/activity/${session._id}`;
                    const sessionActive = pathname === sessionHref;
                    const activityActive = pathname === activityHref;

                    return (
                      <li key={session._id}>
                        {/* Lecture Row */}
                        <Link
                          href={sessionHref}
                          onClick={() => onNavigate?.()}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors min-h-10",
                            sessionActive && "bg-accent font-medium text-primary",
                          )}
                        >
                          {session.completed ? (
                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                          ) : (
                            <PlayCircle className="size-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="truncate">{session.title}</span>
                        </Link>

                        {/* Activity Row — only show if session has activity questions */}
                        {session.hasActivity && (
                          <Link
                            href={activityHref}
                            onClick={() => onNavigate?.()}
                            className={cn(
                              "flex items-center gap-2 rounded-lg pl-8 pr-3 py-1.5 text-xs hover:bg-accent transition-colors min-h-8",
                              activityActive
                                ? "bg-accent font-medium text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {/* Coloured radio dot */}
                            <span
                              className={cn(
                                "size-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                session.activityCompleted
                                  ? "border-emerald-500 bg-emerald-500"
                                  : activityActive
                                    ? "border-primary bg-primary/20"
                                    : "border-muted-foreground/50 bg-transparent",
                              )}
                            >
                              {session.activityCompleted && (
                                <span className="size-1.5 rounded-full bg-white block" />
                              )}
                            </span>
                            <span className="truncate">
                              Activity:{" "}
                              <span className="font-medium">
                                {session.title.replace(/^(Lecture|L)\s*/i, "L")}
                              </span>
                            </span>
                          </Link>
                        )}
                      </li>
                    );
                  })}

                  {section.assignments.map((asg) => {
                    const href = `/courses/${courseId}/assignment/${asg._id}`;
                    const active = pathname.startsWith(href);
                    const dueSoon =
                      asg.kind === "graded" &&
                      asg.dueAt &&
                      asg.dueAt - Date.now() < 48 * 3600 * 1000;
                    return (
                      <li key={asg._id}>
                        <Link
                          href={href}
                          onClick={() => onNavigate?.()}
                          className={cn(
                            "flex flex-col gap-0.5 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors min-h-10",
                            active && "bg-accent font-medium text-primary",
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <Circle className="size-4 shrink-0" />
                            <span className="truncate">
                              {asg.kind === "practice" ? "[P] " : "[G] "}
                              {asg.title.replace(/^Week \d+ · /, "")}
                            </span>
                          </span>
                          {asg.kind === "graded" && asg.dueAt ? (
                            <span
                              className={cn(
                                "pl-6 text-xs",
                                dueSoon
                                  ? "text-amber-700 dark:text-amber-400"
                                  : "text-muted-foreground",
                              )}
                            >
                              Due {formatDueDate(asg.dueAt)}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </aside>
  );
}
