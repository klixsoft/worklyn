"use client";

import React, { Suspense, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  ChevronRight,
  Kanban,
  TrendingUp,
  Users,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientApi } from "@/lib/api/client";
import { useWorkspace } from "@/app/context";
import { format, isAfter } from "date-fns";
import { cn } from "@/lib/utils";

/* ── Types ───────────────────────────────────────────────────── */
interface ProjectType {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

interface TaskType {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  assignee?: { id: string; username: string };
  assignee_id: string | null;
}

/* ── Helpers ─────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  todo: { label: "To Do", color: "bg-zinc-500", textColor: "text-zinc-400", lightBg: "bg-zinc-500/10" },
  in_progress: { label: "In Progress", color: "bg-blue-500", textColor: "text-blue-400", lightBg: "bg-blue-500/10" },
  completed: { label: "Done", color: "bg-emerald-500", textColor: "text-emerald-400", lightBg: "bg-emerald-500/10" },
};

const PRIORITY_CONFIG = {
  high: { label: "High", color: "bg-rose-500", textColor: "text-rose-400", lightBg: "bg-rose-500/10 border-rose-500/20" },
  medium: { label: "Medium", color: "bg-amber-500", textColor: "text-amber-400", lightBg: "bg-amber-500/10 border-amber-500/20" },
  low: { label: "Low", color: "bg-sky-500", textColor: "text-sky-400", lightBg: "bg-sky-500/10 border-sky-500/20" },
};

/* ── Stat Card ───────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  sub?: string;
}) {
  return (
    <Card className="bg-card border-border/60 rounded-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", accent)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-foreground tabular-nums">{value}</div>
        {sub && <p className="text-[11px] text-muted-foreground/60 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

/* ── Progress bar ────────────────────────────────────────────── */
function ProgressBar({ value, max, colorClass }: { value: number; max: number; colorClass: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

/* ── Dashboard for DB projects ───────────────────────────────── */
function DbProjectDashboard({ projectId }: { projectId: string }) {
  const { data: project } = useQuery<ProjectType>({
    queryKey: ["projects", projectId],
    queryFn: () => clientApi.get(`projects/${projectId}`).json(),
  });

  const { data: tasks = [] } = useQuery<TaskType[]>({
    queryKey: ["tasks", { projectId }],
    queryFn: () =>
      clientApi.get("tasks", { searchParams: { project_id: projectId } }).json(),
  });

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const todo = tasks.filter((t) => t.status === "todo").length;
    const overdue = tasks.filter(
      (t) => t.status !== "completed" && t.due_date && isAfter(new Date(), new Date(t.due_date))
    ).length;
    return { total, completed, inProgress, todo, overdue };
  }, [tasks]);

  const recentTasks = useMemo(
    () => [...tasks].sort((a, b) => (a.status === "completed" ? 1 : -1)).slice(0, 8),
    [tasks]
  );

  const priorityBreakdown = useMemo(() => {
    return (["high", "medium", "low"] as const).map((p) => ({
      key: p,
      count: tasks.filter((t) => t.priority === p).length,
    }));
  }, [tasks]);

  const completionPct = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 h-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Link href="/projects"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <span className="text-xs text-muted-foreground">Workspace</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs font-bold text-foreground">{project?.name ?? "..."}</span>
      </div>

      {/* Project header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {project?.name ?? "Loading..."}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            {project?.description ?? "No description provided."}
          </p>
          {project?.created_at && (
            <p className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Created {format(new Date(project.created_at), "MMM d, yyyy")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5 cursor-pointer border-border hover:bg-muted">
            <Link href={`/projects/${projectId}/kanban`}>
              <Kanban className="h-3.5 w-3.5" />
              Open Board
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={stats.total} icon={ListTodo} accent="bg-indigo-500/10 text-indigo-400" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} accent="bg-emerald-500/10 text-emerald-400" sub={`${completionPct}% done`} />
        <StatCard label="In Progress" value={stats.inProgress} icon={Clock} accent="bg-blue-500/10 text-blue-400" />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertCircle} accent={stats.overdue > 0 ? "bg-rose-500/10 text-rose-400" : "bg-muted text-muted-foreground"} />
      </div>

      {/* Progress + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Overall progress */}
        <Card className="bg-card border-border/60 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-4xl font-extrabold text-foreground tabular-nums">{completionPct}%</span>
              <TrendingUp className="h-8 w-8 text-emerald-400/50" />
            </div>
            <div className="space-y-2.5">
              {(["completed", "in_progress", "todo"] as const).map((s) => {
                const cfg = STATUS_CONFIG[s];
                const count = tasks.filter((t) => t.status === s).length;
                return (
                  <div key={s} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={cn("font-medium", cfg.textColor)}>{cfg.label}</span>
                      <span className="text-muted-foreground">{count} tasks</span>
                    </div>
                    <ProgressBar value={count} max={stats.total} colorClass={cfg.color} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Priority breakdown */}
        <Card className="bg-card border-border/60 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground">Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {priorityBreakdown.map(({ key, count }) => {
                const cfg = PRIORITY_CONFIG[key];
                return (
                  <div key={key} className={cn("rounded-lg border p-3 text-center", cfg.lightBg)}>
                    <div className={cn("text-2xl font-extrabold", cfg.textColor)}>{count}</div>
                    <div className={cn("text-[10px] font-bold uppercase tracking-wider mt-0.5", cfg.textColor)}>{cfg.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2.5">
              {priorityBreakdown.map(({ key, count }) => {
                const cfg = PRIORITY_CONFIG[key];
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={cn("font-medium", cfg.textColor)}>{cfg.label}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <ProgressBar value={count} max={stats.total} colorClass={cfg.color} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks table */}
      <Card className="bg-card border-border/60 rounded-xl overflow-hidden">
        <CardHeader className="pb-2 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-foreground">Recent Tasks</CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1">
              <Link href={`/projects/${projectId}/kanban`}>
                View All <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ListTodo className="h-10 w-10 text-muted-foreground/20 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No tasks yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Create tasks from the Kanban board</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {recentTasks.map((task) => {
                const sc = STATUS_CONFIG[task.status];
                const pc = PRIORITY_CONFIG[task.priority];
                const isOverdue = task.status !== "completed" && task.due_date && isAfter(new Date(), new Date(task.due_date));
                return (
                  <div key={task.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", sc.color)} />
                    <span className={cn("flex-1 text-xs font-medium text-foreground truncate", task.status === "completed" && "line-through text-muted-foreground/50")}>
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border", pc.lightBg, pc.textColor)}>
                        {pc.label}
                      </span>
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", sc.lightBg, sc.textColor)}>
                        {sc.label}
                      </span>
                      {task.due_date && (
                        <span className={cn("text-[10px] hidden sm:flex items-center gap-0.5", isOverdue ? "text-rose-400" : "text-muted-foreground")}>
                          <CalendarDays className="h-2.5 w-2.5" />
                          {format(new Date(task.due_date), "MMM d")}
                        </span>
                      )}
                      {task.assignee && (
                        <span className="hidden md:flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Users className="h-2.5 w-2.5" />
                          {task.assignee.username}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Dashboard for workspace (mock) projects ─────────────────── */
function MockProjectDashboard({ projectId }: { projectId: string }) {
  const { projects, setActiveProjectId } = useWorkspace();

  useEffect(() => {
    setActiveProjectId(projectId);
  }, [projectId, setActiveProjectId]);

  const project = projects.find((p) => p.id === projectId);

  const tasks = useMemo(
    () => project?.columns.flatMap((col) => col.tasks.map((t) => ({ ...t, colId: col.id, colName: col.name }))) ?? [],
    [project]
  );

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = project?.columns.find((c) => c.name.toLowerCase().includes("done"))?.tasks.length ?? 0;
    const inProgress = project?.columns.find((c) => c.name.toLowerCase().includes("progress"))?.tasks.length ?? 0;
    const todo = project?.columns.find((c) => c.name.toLowerCase().includes("to do") || c.id === "col-todo")?.tasks.length ?? 0;
    return { total, completed, inProgress, todo, overdue: 0 };
  }, [project, tasks]);

  const completionPct = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

  const priorityBreakdown = useMemo(() => {
    return (["high", "medium", "low"] as const).map((p) => ({
      key: p,
      count: tasks.filter((t) => t.priority === p).length,
    }));
  }, [tasks]);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 h-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Link href="/projects"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <span className="text-xs text-muted-foreground">Workspace</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs font-bold text-foreground">{project.name}</span>
      </div>

      {/* Project header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0", project.color)}>
              {project.icon}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{project.name}</h1>
              <p className="text-sm text-muted-foreground">{project.description || "No description."}</p>
            </div>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5 cursor-pointer border-border hover:bg-muted shrink-0">
          <Link href={`/projects/${projectId}/kanban`}>
            <Kanban className="h-3.5 w-3.5" />
            Open Board
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={stats.total} icon={ListTodo} accent="bg-indigo-500/10 text-indigo-400" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} accent="bg-emerald-500/10 text-emerald-400" sub={`${completionPct}% done`} />
        <StatCard label="In Progress" value={stats.inProgress} icon={Clock} accent="bg-blue-500/10 text-blue-400" />
        <StatCard label="Columns" value={project.columns.length} icon={Kanban} accent="bg-violet-500/10 text-violet-400" />
      </div>

      {/* Progress + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border/60 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground">Columns Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.columns.map((col) => (
              <div key={col.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">{col.name}</span>
                  <span className="text-muted-foreground">{col.tasks.length} tasks</span>
                </div>
                <ProgressBar value={col.tasks.length} max={stats.total || 1} colorClass="bg-indigo-500" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border/60 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground">Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {priorityBreakdown.map(({ key, count }) => {
                const cfg = PRIORITY_CONFIG[key];
                return (
                  <div key={key} className={cn("rounded-lg border p-3 text-center", cfg.lightBg)}>
                    <div className={cn("text-2xl font-extrabold", cfg.textColor)}>{count}</div>
                    <div className={cn("text-[10px] font-bold uppercase tracking-wider mt-0.5", cfg.textColor)}>{cfg.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2.5">
              {priorityBreakdown.map(({ key, count }) => {
                const cfg = PRIORITY_CONFIG[key];
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={cn("font-medium", cfg.textColor)}>{cfg.label}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <ProgressBar value={count} max={stats.total || 1} colorClass={cfg.color} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks table */}
      <Card className="bg-card border-border/60 rounded-xl overflow-hidden">
        <CardHeader className="pb-2 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-foreground">All Tasks</CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1">
              <Link href={`/projects/${projectId}/kanban`}>
                View Board <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ListTodo className="h-10 w-10 text-muted-foreground/20 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No tasks yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {tasks.slice(0, 10).map((task) => {
                const pc = PRIORITY_CONFIG[task.priority as "low" | "medium" | "high"];
                return (
                  <div key={task.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
                    <span className="flex-1 text-xs font-medium text-foreground truncate">{task.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border", pc.lightBg, pc.textColor)}>
                        {pc.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {task.colName}
                      </span>
                      {task.dueDate && (
                        <span className="text-[10px] hidden sm:flex items-center gap-0.5 text-muted-foreground">
                          <CalendarDays className="h-2.5 w-2.5" />
                          {task.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Page root ───────────────────────────────────────────────── */
export default function ProjectWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-40">
          <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProjectDashboardInner />
    </Suspense>
  );
}

function ProjectDashboardInner() {
  const params = useParams();
  const projectId = params.id as string;
  const { projects } = useWorkspace();

  const isWorkspaceProject = projects.some((p) => p.id === projectId);

  if (isWorkspaceProject) {
    return <MockProjectDashboard projectId={projectId} />;
  }

  return <DbProjectDashboard projectId={projectId} />;
}
