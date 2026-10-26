"use client";

import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Id } from "@/lib/convex";
import { api } from "@/lib/convex";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminCoursePageClient() {
  const params = useParams();
  const courseId = params.courseId as Id<"courses">;
  const structure = useQuery(api.courses.getStructure, { courseId });
  const updateCourse = useMutation(api.courses.update);
  const addWeekMutation = useMutation(api.sections.addWeek);
  const deleteWeekMutation = useMutation(api.sections.deleteWeek);

  const [courseDescription, setCourseDescription] = useState("");
  const [isAddingWeek, setIsAddingWeek] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<{
    _id: Id<"sections">;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const course = structure?.course;
  const sections = structure?.sections ?? [];
  const loading = structure === undefined;

  const weekSections = sections.filter((s) => s.type === "week");
  const canDeleteWeek = weekSections.length > 4;

  useEffect(() => {
    if (course) {
      setCourseDescription(course.description ?? "");
    }
  }, [course?._id, course?.description]);

  async function handleAddWeek() {
    setIsAddingWeek(true);
    try {
      const sectionId = await addWeekMutation({ courseId });
      toast.success("New week added successfully!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add week");
    } finally {
      setIsAddingWeek(false);
    }
  }

  async function handleConfirmDelete() {
    if (!sectionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteWeekMutation({ sectionId: sectionToDelete._id });
      toast.success(`${sectionToDelete.title} deleted successfully!`);
      setSectionToDelete(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete week");
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading course details…</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="rounded-xl border p-8 text-center space-y-3">
        <p className="text-base font-medium">Course not found.</p>
        <Link href="/admin" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Back to Admin Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <Link
            href="/admin"
            className="text-xs text-muted-foreground hover:underline inline-block mb-1.5"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure course overview, lecture weeks, assignments, and visibility.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/courses/${courseId}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Eye className="size-4 mr-1.5" />
            View as student
          </Link>
        </div>
      </div>

      {/* Course Settings */}
      <section className="rounded-xl border bg-card p-4 sm:p-6 space-y-4 shadow-2xs">
        <h2 className="font-semibold text-base">Course Settings</h2>
        <div className="space-y-2">
          <Label htmlFor="course-title" className="text-xs font-medium">
            Course Title
          </Label>
          <Input
            id="course-title"
            key={course._id}
            defaultValue={course.title}
            onBlur={(e) => {
              const val = e.target.value.trim();
              if (val && val !== course.title) {
                void updateCourse({ courseId, title: val });
                toast.success("Course title updated");
              }
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Description</Label>
          <p className="text-xs text-muted-foreground">
            Overview, curriculum syllabus, topics covered, and student expectations.
          </p>
          <RichTextEditor
            key={course._id}
            value={courseDescription}
            onChange={setCourseDescription}
            onBlur={(html) => {
              const cleaned = html === "<p></p>" ? "" : html;
              void updateCourse({ courseId, description: cleaned });
            }}
            placeholder="Course overview, topics covered, expectations…"
            minHeight="12rem"
          />
        </div>
        <div className="space-y-2 max-w-xs">
          <Label className="text-xs font-medium">Publication Status</Label>
          <Select
            key={course.status}
            defaultValue={course.status}
            onValueChange={(v) => {
              void updateCourse({
                courseId,
                status: v as "draft" | "published",
              });
              toast.success(`Course status set to ${v}`);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft (hidden from students)</SelectItem>
              <SelectItem value="published">Published (accessible to students)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Weeks / Sections */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base">Weeks &amp; Sections</h2>
              <Badge variant="secondary" className="text-xs font-normal">
                {weekSections.length} {weekSections.length === 1 ? "Week" : "Weeks"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Each course must have at least 4 weeks. You can add or delete weeks as needed.
            </p>
          </div>

          <Button
            onClick={handleAddWeek}
            disabled={isAddingWeek}
            size="sm"
            className="w-full sm:w-auto shrink-0 font-medium"
          >
            {isAddingWeek ? (
              <>
                <Loader2 className="size-4 animate-spin mr-1.5" />
                Adding Week…
              </>
            ) : (
              <>
                <Plus className="size-4 mr-1.5" />
                Add Week
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2.5">
          {sections.map((section) => {
            const isWeek = section.type === "week";
            return (
              <div
                key={section._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border bg-card p-4 hover:border-primary/30 transition-colors shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{section.title}</p>
                    <Badge
                      variant={isWeek ? "outline" : "secondary"}
                      className="text-[11px] capitalize font-medium"
                    >
                      {section.type}
                    </Badge>
                    {isWeek && (
                      <span className="text-[11px] text-muted-foreground">
                        PA &amp; GA included
                      </span>
                    )}
                  </div>
                  {isWeek && (
                    <p className="text-xs text-muted-foreground">
                      Contains practice questions, graded assignments, and video lectures.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Link
                    href={`/admin/courses/${courseId}/weeks/${section._id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Pencil className="size-3.5 mr-1" />
                    Edit
                  </Link>

                  {isWeek && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canDeleteWeek || isDeleting}
                      onClick={() =>
                        setSectionToDelete({
                          _id: section._id as Id<"sections">,
                          title: section.title,
                        })
                      }
                      title={
                        !canDeleteWeek
                          ? "Courses must have at least 4 weeks. Cannot delete."
                          : `Delete ${section.title}`
                      }
                      className={
                        canDeleteWeek
                          ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                          : "text-muted-foreground opacity-50 cursor-not-allowed"
                      }
                    >
                      <Trash2 className="size-3.5 mr-1" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {sections.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8 rounded-xl border border-dashed">
              No weeks or sections found.
            </p>
          )}
        </div>

        {!canDeleteWeek && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <AlertCircle className="size-4 shrink-0 text-amber-500" />
            <span>
              This course currently has <strong>{weekSections.length} weeks</strong>. Courses require a minimum of 4 weeks, so weeks cannot be deleted right now. You can add more weeks above.
            </span>
          </div>
        )}
      </section>

      {/* Delete Week Confirmation Dialog */}
      <Dialog
        open={sectionToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setSectionToDelete(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-destructive flex items-center gap-2">
              <Trash2 className="size-5" />
              Delete {sectionToDelete?.title}?
            </DialogTitle>
            <DialogDescription className="text-sm space-y-2 pt-2">
              <span className="block">
                Are you sure you want to delete <strong>{sectionToDelete?.title}</strong>?
              </span>
              <span className="block text-xs text-muted-foreground">
                This will permanently delete all video lecture links, activity questions, student attempts, and practice/graded assignments belonging to this week.
              </span>
              <span className="block text-xs font-medium text-amber-600 dark:text-amber-400">
                Note: A course must always maintain at least 4 weeks.
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-3">
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setSectionToDelete(null)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="w-full sm:w-auto"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Deleting Week…
                </>
              ) : (
                "Delete Week"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
