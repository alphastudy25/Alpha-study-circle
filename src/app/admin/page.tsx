"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, ChevronRight, Loader2, Plus, Sparkles } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const courses = useQuery(api.courses.listAll);
  const createCourse = useMutation(api.courses.create);
  const [title, setTitle] = useState("Calculus — Course Module");
  const [weeksCount, setWeeksCount] = useState<number>(4);
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateCourse() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Please enter a course title");
      return;
    }
    const weeks = Math.max(Number(weeksCount) || 4, 4);

    setIsCreating(true);
    try {
      const id = await createCourse({
        title: trimmedTitle,
        initialWeeks: weeks,
      });
      toast.success(`Course created with ${weeks} weeks + PA/GA slots!`);
      router.push(`/admin/courses/${id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create course");
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your courses, curriculum structure, sessions, and enrolled students.
        </p>
      </div>

      {/* Create Course Card */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Plus className="size-4 text-primary" />
            Create New Course
          </CardTitle>
          <CardDescription>
            Specify a title and initial number of weeks (minimum 4 weeks required). You can add or remove weeks at any time later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="course-title" className="text-xs font-medium">Course Title</Label>
              <Input
                id="course-title"
                placeholder="e.g. Calculus I — Limits & Derivatives"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weeks-count" className="text-xs font-medium">
                Initial Weeks (min 4)
              </Label>
              <Input
                id="weeks-count"
                type="number"
                min={4}
                max={52}
                value={weeksCount}
                onChange={(e) => setWeeksCount(Math.max(4, parseInt(e.target.value) || 4))}
                disabled={isCreating}
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              onClick={handleCreateCourse}
              disabled={isCreating}
              className="w-full sm:w-auto min-h-11 sm:min-h-10 text-sm font-medium"
            >
              {isCreating ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Creating Course…
                </>
              ) : (
                <>
                  <Sparkles className="size-4 mr-2" />
                  Create Course
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Courses List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">Your Courses</h2>
          {courses && (
            <span className="text-xs text-muted-foreground">
              {courses.length} {courses.length === 1 ? "course" : "courses"}
            </span>
          )}
        </div>

        {courses === undefined ? (
          <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin text-primary" />
            Loading courses…
          </div>
        ) : courses.length === 0 ? (
          <Card className="border border-dashed">
            <CardContent className="py-10 text-center space-y-3">
              <BookOpen className="size-8 mx-auto text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">No courses created yet.</p>
              <p className="text-xs text-muted-foreground">
                Use the form above to create your first course.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2.5">
            {courses.map((c: { _id: string; title: string; status: string }) => (
              <Link
                key={c._id}
                href={`/admin/courses/${c._id}`}
                className="flex items-center justify-between rounded-xl border bg-card px-4 py-3.5 hover:bg-accent/60 transition-colors shadow-2xs group"
              >
                <div className="min-w-0 pr-3">
                  <span className="font-medium text-sm block truncate group-hover:text-primary transition-colors">
                    {c.title}
                  </span>
                  <span className="text-xs capitalize text-muted-foreground">
                    Status: {c.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      c.status === "published"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {c.status}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
