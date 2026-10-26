"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { AppShell } from "@/components/app-shell";
import { CourseSidebar } from "@/components/course/course-sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BookOpen, ChevronRight, Loader2, Menu } from "lucide-react";
import type { Id } from "@/lib/convex";

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const courseId = params.courseId as Id<"courses">;
  const structure = useQuery(api.courses.getStructure, { courseId });
  const course = structure?.course;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <AppShell title={course?.title ?? "Course"}>
      {/* Mobile Top Navigation Banner (only shown on < md screens) */}
      <div className="md:hidden border-b bg-card/90 backdrop-blur px-4 py-2.5 flex items-center justify-between gap-3 sticky top-14 z-30 shadow-2xs">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileMenuOpen(true)}
          className="flex items-center gap-2 h-9 text-xs font-medium w-full justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <BookOpen className="size-4 text-primary shrink-0" />
            <span className="truncate">Weeks &amp; Lessons</span>
          </div>
          <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
        </Button>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[85vw] max-w-xs p-0 flex flex-col">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="text-sm font-semibold truncate text-left">
                {course?.title ?? "Course Outline"}
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              {structure ? (
                <CourseSidebar
                  courseId={courseId}
                  structure={structure}
                  onNavigate={() => setMobileMenuOpen(false)}
                  className="w-full border-none bg-transparent"
                />
              ) : (
                <div className="p-4 text-xs text-muted-foreground">Loading outline…</div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Viewport Container */}
      <div className="flex flex-col md:flex-row md:h-[calc(100vh-3.5rem)] md:overflow-hidden">
        {/* Desktop Sidebar (hidden on mobile) */}
        <div className="hidden md:block shrink-0">
          {structure ? (
            <CourseSidebar
              courseId={courseId}
              structure={structure}
              className="h-full"
            />
          ) : (
            <aside className="w-72 shrink-0 border-r p-4 text-sm text-muted-foreground overflow-y-auto flex items-center gap-2">
              <Loader2 className="size-4 animate-spin text-primary" />
              Loading curriculum…
            </aside>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 md:overflow-y-auto">{children}</div>
      </div>
    </AppShell>
  );
}
