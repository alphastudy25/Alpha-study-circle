import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/permissions";

export const listByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, { courseId }) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("sections")
      .withIndex("by_course", (q) => q.eq("courseId", courseId))
      .collect();
  },
});

export const update = mutation({
  args: {
    sectionId: v.id("sections"),
    title: v.optional(v.string()),
    isHidden: v.optional(v.boolean()),
    unlockAt: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, { sectionId, ...patch }) => {
    await requireAdmin(ctx);
    const updates: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(patch)) {
      if (val !== undefined) updates[k] = val === null ? undefined : val;
    }
    await ctx.db.patch(sectionId, updates);
  },
});

export const addWeek = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.optional(v.string()),
  },
  handler: async (ctx, { courseId, title }) => {
    await requireAdmin(ctx);
    const course = await ctx.db.get(courseId);
    if (!course) throw new Error("Course not found");

    const sections = await ctx.db
      .query("sections")
      .withIndex("by_course", (q) => q.eq("courseId", courseId))
      .collect();

    const weekSections = sections.filter((s) => s.type === "week");

    // Determine the next week number
    let maxWeekNum = 0;
    for (const sec of weekSections) {
      const match = sec.title.match(/Week\s+(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxWeekNum) maxWeekNum = n;
      }
    }
    const nextWeekNum = maxWeekNum > 0 ? maxWeekNum + 1 : weekSections.length + 1;
    const weekTitle = title?.trim() || `Week ${nextWeekNum}`;

    const maxOrder = sections.reduce((max, s) => Math.max(max, s.order), 0);
    const nextOrder = maxOrder + 1;

    const sectionId = await ctx.db.insert("sections", {
      courseId,
      title: weekTitle,
      type: "week",
      order: nextOrder,
      isHidden: false,
    });

    await ctx.db.insert("assignments", {
      sectionId,
      kind: "practice",
      title: `${weekTitle} · Practice Assignment`,
      scoringPolicy: "best",
      feedbackMode: "full",
      solutionsRelease: "immediate",
      latePolicy: "open",
      status: "draft",
    });

    await ctx.db.insert("assignments", {
      sectionId,
      kind: "graded",
      title: `${weekTitle} · Graded Assignment`,
      scoringPolicy: "best",
      feedbackMode: "score_only",
      solutionsRelease: "after_deadline",
      latePolicy: "strict",
      status: "draft",
    });

    return sectionId;
  },
});

export const deleteWeek = mutation({
  args: {
    sectionId: v.id("sections"),
  },
  handler: async (ctx, { sectionId }) => {
    await requireAdmin(ctx);
    const section = await ctx.db.get(sectionId);
    if (!section) throw new Error("Section not found");

    if (section.type !== "week") {
      throw new Error("Only week sections can be deleted.");
    }

    const allSections = await ctx.db
      .query("sections")
      .withIndex("by_course", (q) => q.eq("courseId", section.courseId))
      .collect();

    const weekSections = allSections.filter((s) => s.type === "week");
    if (weekSections.length <= 4) {
      throw new Error("A course must have at least 4 weeks.");
    }

    // 1. Delete all sessions and associated questions, answers, and progress
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_section", (q) => q.eq("sectionId", sectionId))
      .collect();

    for (const sess of sessions) {
      const actQs = await ctx.db
        .query("activityQuestions")
        .withIndex("by_session", (q) => q.eq("sessionId", sess._id))
        .collect();
      for (const q of actQs) {
        await ctx.db.delete(q._id);
      }

      const actAnswers = await ctx.db
        .query("activityAnswers")
        .withIndex("by_session", (q) => q.eq("sessionId", sess._id))
        .collect();
      for (const a of actAnswers) {
        await ctx.db.delete(a._id);
      }

      const progressRecords = await ctx.db
        .query("sessionProgress")
        .filter((q) => q.eq(q.field("sessionId"), sess._id))
        .collect();
      for (const p of progressRecords) {
        await ctx.db.delete(p._id);
      }

      await ctx.db.delete(sess._id);
    }

    // 2. Delete all assignments and associated questions, attempts, overrides
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_section", (q) => q.eq("sectionId", sectionId))
      .collect();

    for (const asgn of assignments) {
      const qs = await ctx.db
        .query("questions")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", asgn._id))
        .collect();
      for (const q of qs) {
        await ctx.db.delete(q._id);
      }

      const attempts = await ctx.db
        .query("attempts")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", asgn._id))
        .collect();
      for (const att of attempts) {
        await ctx.db.delete(att._id);
      }

      const overrides = await ctx.db
        .query("deadlineOverrides")
        .withIndex("by_assignment_user", (q) => q.eq("assignmentId", asgn._id))
        .collect();
      for (const o of overrides) {
        await ctx.db.delete(o._id);
      }

      await ctx.db.delete(asgn._id);
    }

    // 3. Delete the section itself
    await ctx.db.delete(sectionId);
  },
});
