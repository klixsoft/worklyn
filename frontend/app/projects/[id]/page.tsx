"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft,
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  User,
  LayoutGrid,
  ListTodo,
  Tag,
  ChevronRight,
  MoreVertical,
  Check,
  CalendarCheck2,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { clientApi } from "@/lib/api/client";
import { useDeleteConfirmation } from "@/components/auth/delete-confirmation-context";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { useWorkspace } from "@/app/context";
import { JiraBoard } from "@/components/jira-board";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface UserMinType {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  email: string;
}

interface ProjectType {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  owner?: UserMinType;
  created_at: string;
  updated_at: string;
}

interface TaskType {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  assignee_id: string | null;
  assignee?: UserMinType;
  created_at: string;
  updated_at: string;
}

export default function ProjectWorkspacePage() {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center py-40">
          <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProjectWorkspaceInner />
    </Suspense>
  );
}

function ProjectWorkspaceInner() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.id as string;
  const { confirmDelete } = useDeleteConfirmation();

  // Mock Workspace Context
  const { 
    projects: mockProjects, 
    activeProject, 
    setActiveProjectId,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    teamMembers,
    currentUser
  } = useWorkspace();

  const isMock = projectId?.startsWith("proj-");

  // Sync workspace active ID
  useEffect(() => {
    if (projectId) {
      setActiveProjectId(projectId);
    }
  }, [projectId, setActiveProjectId]);

  // URL search params view selection
  const searchParams = useSearchParams();
  const viewMode = (searchParams?.get("view") as "dashboard" | "kanban" | "list") || "dashboard";

  const setViewMode = (mode: "dashboard" | "kanban" | "list") => {
    router.push(`/projects/${projectId}?view=${mode}`);
  };

  // Dark theme detection for ApexCharts repainting
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"todo" | "in_progress" | "completed">("todo");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [assigneeId, setAssigneeId] = useState<string>("none");
  const [activeTask, setActiveTask] = useState<TaskType | null>(null);

  // Task Dialog settings
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);

  // Fetch current project from DB (only if not mock)
  const { data: dbProject, isLoading: isLoadingDbProject } = useQuery<ProjectType>({
    queryKey: ["projects", projectId],
    queryFn: () => clientApi.get(`projects/${projectId}`).json(),
    enabled: !isMock && !!projectId
  });

  // Fetch tasks for this project from DB (only if not mock)
  const { data: dbTasks = [], isLoading: isLoadingDbTasks } = useQuery<TaskType[]>({
    queryKey: ["tasks", { projectId }],
    queryFn: () => clientApi.get("tasks", { searchParams: { project_id: projectId } }).json(),
    enabled: !isMock && !!projectId
  });

  // Fetch all users in system for assignment dropdown
  const { data: dbUsers = [] } = useQuery<UserMinType[]>({
    queryKey: ["users"],
    queryFn: () => clientApi.get("users").json(),
    enabled: !isMock
  });

  // Resolve projects & tasks based on Context (mock) vs DB
  const mockProject = useMemo(() => {
    return mockProjects.find(p => p.id === projectId) || activeProject;
  }, [mockProjects, activeProject, projectId]);

  const project = useMemo<ProjectType | null>(() => {
    if (isMock) {
      if (!mockProject) return null;
      return {
        id: mockProject.id,
        name: mockProject.name,
        description: mockProject.description || null,
        owner_id: "mock-owner",
        owner: { id: "mock-owner", username: "Alex", email: "alex@klixsoft.com" },
        created_at: "",
        updated_at: ""
      };
    }
    return dbProject || null;
  }, [isMock, dbProject, mockProject]);

  const tasks = useMemo<TaskType[]>(() => {
    if (isMock) {
      if (!mockProject) return [];
      return mockProject.columns.flatMap(col => 
        col.tasks.map(t => ({
          id: t.id,
          project_id: projectId,
          title: t.title,
          description: t.description || null,
          status: (col.id.toLowerCase().includes("done") || col.name.toLowerCase() === "done" || col.id === "col-completed" || col.id === "completed" || col.id === "completed-tasks")
            ? "completed" as const
            : (col.id.toLowerCase().includes("progress") || col.id === "in_progress")
              ? "in_progress" as const
              : "todo" as const,
          priority: t.priority as "low" | "medium" | "high",
          due_date: t.dueDate || null,
          assignee_id: t.assigneeId || null,
          assignee: t.assigneeId ? { id: t.assigneeId, username: t.assigneeId === "user-current" ? "Alex (Me)" : t.assigneeId, email: "" } : undefined,
          created_at: "",
          updated_at: ""
        }))
      );
    }
    return dbTasks;
  }, [isMock, dbTasks, mockProject, projectId]);

  const users = useMemo<UserMinType[]>(() => {
    if (isMock) {
      return [
        { id: "user-current", username: "Alex (Me)", email: currentUser.email },
        ...teamMembers.map(m => ({ id: m.id, username: m.name, email: "" }))
      ];
    }
    return dbUsers;
  }, [isMock, dbUsers, teamMembers, currentUser]);

  const isLoadingProject = !isMock && isLoadingDbProject;
  const isLoadingTasks = !isMock && isLoadingDbTasks;

  // DB Mutations
  const createTaskMutation = useMutation({
    mutationFn: (newTask: Partial<TaskType>) =>
      clientApi.post("tasks", { json: { ...newTask, project_id: projectId } }).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created successfully");
      setIsNewTaskOpen(false);
      resetForm();
    },
    onError: (err: unknown) => {
      const errMsg = err instanceof Error ? err.message : "Failed to create task";
      toast.error(errMsg);
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TaskType> }) =>
      clientApi.put(`tasks/${id}`, { json: updates }).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setIsEditTaskOpen(false);
      resetForm();
    },
    onError: (err: unknown) => {
      const errMsg = err instanceof Error ? err.message : "Failed to update task";
      toast.error(errMsg);
    }
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskType["status"] }) =>
      clientApi.put(`tasks/${id}`, { json: { status } }).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task status updated");
    },
    onError: (err: unknown) => {
      const errMsg = err instanceof Error ? err.message : "Failed to update task status";
      toast.error(errMsg);
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => clientApi.delete(`tasks/${id}`).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted successfully");
      setIsEditTaskOpen(false);
    },
    onError: (err: unknown) => {
      const errMsg = err instanceof Error ? err.message : "Failed to delete task";
      toast.error(errMsg);
    }
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setDueDate(undefined);
    setAssigneeId("none");
    setActiveTask(null);
  };

  const handleCreateTask = () => {
    if (!title.trim()) return;
    if (isMock) {
      const colId = status === "completed" ? "col-done" : status === "in_progress" ? "col-progress" : "col-todo";
      addTask(projectId, colId, {
        title: title.trim(),
        description: description.trim(),
        priority,
        assigneeId: assigneeId === "none" ? "" : assigneeId,
        dueDate: dueDate ? dueDate.toISOString().split("T")[0] : "",
        tags: ["Task"]
      });
      toast.success("Task created successfully");
      setIsNewTaskOpen(false);
      resetForm();
    } else {
      createTaskMutation.mutate({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        due_date: dueDate ? dueDate.toISOString() : null,
        assignee_id: assigneeId === "none" ? null : assigneeId
      });
    }
  };

  const handleOpenEdit = (task: TaskType) => {
    setActiveTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.due_date ? new Date(task.due_date) : undefined);
    setAssigneeId(task.assignee_id || "none");
    setIsEditTaskOpen(true);
  };

  const handleUpdateTask = () => {
    if (!activeTask || !title.trim()) return;
    if (isMock) {
      const srcCol = mockProject?.columns.find(col => col.tasks.some(t => t.id === activeTask.id));
      if (srcCol) {
        const targetColId = status === "completed" ? "col-done" : status === "in_progress" ? "col-progress" : "col-todo";
        updateTask(projectId, srcCol.id, activeTask.id, {
          title: title.trim(),
          description: description.trim(),
          priority,
          assigneeId: assigneeId === "none" ? "" : assigneeId,
          dueDate: dueDate ? dueDate.toISOString().split("T")[0] : ""
        });
        if (srcCol.id !== targetColId) {
          moveTask(projectId, srcCol.id, targetColId, activeTask.id);
        }
        toast.success("Task updated successfully");
      }
      setIsEditTaskOpen(false);
      resetForm();
    } else {
      updateTaskMutation.mutate({
        id: activeTask.id,
        updates: {
          title: title.trim(),
          description: description.trim(),
          status,
          priority,
          due_date: dueDate ? dueDate.toISOString() : null,
          assignee_id: assigneeId === "none" ? null : assigneeId
        }
      });
    }
  };

  const handleDeleteTask = (task: TaskType) => {
    confirmDelete(() => {
      if (isMock) {
        const srcCol = mockProject?.columns.find(col => col.tasks.some(t => t.id === task.id));
        if (srcCol) {
          deleteTask(projectId, srcCol.id, task.id);
          toast.success("Task deleted successfully");
        }
        setIsEditTaskOpen(false);
      } else {
        deleteTaskMutation.mutate(task.id);
      }
    });
  };

  const handleMoveTaskColumn = (task: TaskType, targetStatus: TaskType["status"]) => {
    if (isMock) {
      const srcCol = mockProject?.columns.find(col => col.tasks.some(t => t.id === task.id));
      const targetColId = targetStatus === "completed" ? "col-done" : targetStatus === "in_progress" ? "col-progress" : "col-todo";
      if (srcCol && srcCol.id !== targetColId) {
        moveTask(projectId, srcCol.id, targetColId, task.id);
        toast.success("Task status updated");
      }
    } else {
      updateTaskStatusMutation.mutate({ id: task.id, status: targetStatus });
    }
  };

  // Helper for Priority styling
  const getPriorityBadge = (prio: string) => {
    const styles = {
      low: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
      medium: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
      high: "bg-rose-500/10 text-rose-400 border border-rose-500/20"
    };
    return styles[prio as keyof typeof styles] || styles.medium;
  };

  // Status Columns for Kanban
  const columns: { id: TaskType["status"]; name: string; color: string }[] = [
    { id: "todo", name: "To Do", color: "bg-zinc-400/20 text-zinc-400 border border-zinc-500/10" },
    { id: "in_progress", name: "In Progress", color: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" },
    { id: "completed", name: "Completed", color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" }
  ];

  if (isLoadingProject) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-bold text-foreground">Project Workspace Not Found</h2>
        <Button asChild className="mt-4 bg-indigo-600 text-white cursor-pointer">
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  // Statistics
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === "completed").length;
  const inProgressCount = tasks.filter(t => t.status === "in_progress").length;
  const todoCount = tasks.filter(t => t.status === "todo").length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const overdueCount = tasks.filter(t => {
    if (t.status === "completed" || !t.due_date) return false;
    return new Date(t.due_date) < new Date();
  }).length;

  const highCount = tasks.filter(t => t.priority === "high").length;
  const mediumCount = tasks.filter(t => t.priority === "medium").length;
  const lowCount = tasks.filter(t => t.priority === "low").length;

  // Extract Workload Metrics per Assignee
  const assigneeMap: Record<string, { name: string; completed: number; active: number }> = {};
  tasks.forEach(task => {
    const name = task.assignee?.username || (task.assignee_id === "user-current" ? "Alex (Me)" : task.assignee_id) || "Unassigned";
    if (!assigneeMap[name]) {
      assigneeMap[name] = { name, completed: 0, active: 0 };
    }
    if (task.status === "completed") {
      assigneeMap[name].completed++;
    } else {
      assigneeMap[name].active++;
    }
  });

  const assigneeData = Object.values(assigneeMap);
  const assigneeNames = assigneeData.map(d => d.name);
  const assigneeCompletedSeries = assigneeData.map(d => d.completed);
  const assigneeActiveSeries = assigneeData.map(d => d.active);

  const workloadSeries = [
    { name: "Completed Tasks", data: assigneeCompletedSeries },
    { name: "Active Tasks", data: assigneeActiveSeries }
  ];

  // Chart Styling Definitions
  const chartThemeMode = isDark ? ("dark" as const) : ("light" as const);
  const gridBorderColor = isDark ? "#2d2d30" : "#e4e4e7";
  const legendLabelColor = isDark ? "#a1a1aa" : "#71717a";

  const donutOptions = {
    chart: {
      type: "donut" as const,
      background: "transparent",
      foreColor: legendLabelColor,
    },
    theme: { mode: chartThemeMode },
    colors: ["#10b981", "#f59e0b", "#6366f1"],
    labels: ["Completed", "In Progress", "To Do"],
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Tasks Count",
              fontSize: "12px",
              color: legendLabelColor,
              formatter: () => String(totalCount)
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    legend: { position: "bottom" as const, labels: { colors: legendLabelColor } },
    stroke: { show: true, colors: [isDark ? "#121214" : "#ffffff"], width: 2 },
    tooltip: { theme: chartThemeMode }
  };

  const priorityOptions = {
    chart: {
      type: "bar" as const,
      background: "transparent",
      foreColor: legendLabelColor,
      toolbar: { show: false }
    },
    theme: { mode: chartThemeMode },
    colors: ["#f43f5e", "#f59e0b", "#10b981"],
    plotOptions: {
      bar: {
        distributed: true,
        borderRadius: 5,
        columnWidth: "40%",
      }
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: {
      categories: ["High", "Medium", "Low"],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: legendLabelColor } }
    },
    yaxis: {
      labels: {
        style: { colors: legendLabelColor },
        formatter: (val: number) => String(Math.floor(val))
      }
    },
    grid: { borderColor: gridBorderColor, strokeDashArray: 4 },
    tooltip: { theme: chartThemeMode }
  };

  const assigneeOptions = {
    chart: {
      type: "bar" as const,
      background: "transparent",
      foreColor: legendLabelColor,
      toolbar: { show: false },
      stacked: true
    },
    theme: { mode: chartThemeMode },
    colors: ["#10b981", "#6366f1"],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: "45%",
      }
    },
    xaxis: {
      categories: assigneeNames,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { 
        style: { colors: legendLabelColor },
        formatter: (val: number) => String(Math.floor(val))
      }
    },
    yaxis: {
      labels: { style: { colors: legendLabelColor } }
    },
    grid: { borderColor: gridBorderColor, strokeDashArray: 4 },
    legend: { 
      position: "top" as const, 
      horizontalAlign: "right" as const, 
      labels: { colors: legendLabelColor } 
    },
    tooltip: { theme: chartThemeMode }
  };

  // If mock project and view is kanban, load standard JiraBoard
  if (isMock && viewMode === "kanban") {
    return <JiraBoard />;
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto h-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-850">
      {/* Workspace Header Navigation */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer">
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="text-xs text-muted-foreground">Workspace</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs font-bold text-indigo-400 capitalize">{project.name}</span>
      </div>

      {/* Project Banner Cards */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 border border-border/50 bg-card/30 backdrop-blur-xl rounded-2xl">
        <div className="space-y-1.5 max-w-2xl text-left">
          <h1 className="text-2xl font-extrabold text-foreground">{project.name}</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {project.description || "No description provided."}
          </p>
        </div>
        <div className="flex items-center gap-6 w-full lg:w-auto shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0">
          <div className="flex flex-col items-center justify-center bg-card/60 p-4 border border-border/60 rounded-xl min-w-32">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Completion</span>
            <span className="text-xl font-black text-indigo-400 mt-1">{percentComplete}%</span>
            <span className="text-[10px] text-muted-foreground/60 mt-0.5">{completedCount} of {totalCount} tasks</span>
          </div>

          <div className="flex flex-col gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <div className="bg-muted p-1 rounded-lg flex items-center gap-1">
                <Button 
                  variant={viewMode === "dashboard" ? "secondary" : "ghost"} 
                  size="icon" 
                  onClick={() => setViewMode("dashboard")}
                  className="h-7 w-7 rounded cursor-pointer"
                  title="Dashboard"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant={viewMode === "kanban" ? "secondary" : "ghost"} 
                  size="icon" 
                  onClick={() => setViewMode("kanban")}
                  className="h-7 w-7 rounded cursor-pointer"
                  title="Kanban Board"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant={viewMode === "list" ? "secondary" : "ghost"} 
                  size="icon" 
                  onClick={() => setViewMode("list")}
                  className="h-7 w-7 rounded cursor-pointer"
                  title="Task Backlog"
                >
                  <ListTodo className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Button 
                onClick={() => {
                  resetForm();
                  setIsNewTaskOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Task</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Contents */}
      {isLoadingTasks ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === "dashboard" ? (
        /* --- PROJECT DASHBOARD VIEW --- */
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card/40 border-border/60 backdrop-blur-md">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1 text-left">
                  <span className="text-xs text-muted-foreground font-semibold">Total Tasks</span>
                  <h3 className="text-2xl font-bold text-foreground">{totalCount}</h3>
                </div>
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <ListTodo className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-border/60 backdrop-blur-md">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1 text-left">
                  <span className="text-xs text-muted-foreground font-semibold">Completed</span>
                  <h3 className="text-2xl font-bold text-emerald-400">{completedCount}</h3>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-border/60 backdrop-blur-md">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1 text-left">
                  <span className="text-xs text-muted-foreground font-semibold">In Progress</span>
                  <h3 className="text-2xl font-bold text-amber-400">{inProgressCount}</h3>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-border/60 backdrop-blur-md">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1 text-left">
                  <span className="text-xs text-muted-foreground font-semibold">Overdue Tasks</span>
                  <h3 className={`text-2xl font-bold ${overdueCount > 0 ? "text-rose-400 animate-pulse" : "text-zinc-400"}`}>{overdueCount}</h3>
                </div>
                <div className={`p-3 rounded-xl ${overdueCount > 0 ? "bg-rose-500/10 text-rose-400" : "bg-zinc-500/10 text-zinc-400"}`}>
                  <AlertCircle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/40 border-border/60 backdrop-blur-md">
              <CardHeader className="text-left pb-2">
                <CardTitle className="text-sm font-bold text-foreground">Task Status Distribution</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Status breakdown for current project tasks</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-4">
                {totalCount === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <ListTodo className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">No tasks registered yet.</p>
                  </div>
                ) : (
                  <div className="w-full">
                    <Chart
                      type="donut"
                      width="100%"
                      height={240}
                      series={[completedCount, inProgressCount, todoCount]}
                      options={donutOptions}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-border/60 backdrop-blur-md">
              <CardHeader className="text-left pb-2">
                <CardTitle className="text-sm font-bold text-foreground">Tasks by Priority</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Urgency breakdown of active and completed tasks</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {totalCount === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <ListTodo className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">No tasks registered yet.</p>
                  </div>
                ) : (
                  <Chart
                    type="bar"
                    width="100%"
                    height={240}
                    series={[{ name: "Tasks Count", data: [highCount, mediumCount, lowCount] }]}
                    options={priorityOptions}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Workload Horizontal Stacked Bars */}
          <Card className="bg-card/40 border-border/60 backdrop-blur-md">
            <CardHeader className="text-left pb-2">
              <CardTitle className="text-sm font-bold text-foreground">Resource Task Load</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Workload count of tasks assigned per teammate</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {totalCount === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <ListTodo className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">No tasks registered yet.</p>
                </div>
              ) : assigneeNames.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <User className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">All tasks are currently unassigned.</p>
                </div>
              ) : (
                <Chart
                  type="bar"
                  width="100%"
                  height={Math.max(160, assigneeNames.length * 60)}
                  series={workloadSeries}
                  options={assigneeOptions}
                />
              )}
            </CardContent>
          </Card>
        </div>
      ) : viewMode === "kanban" ? (
        /* --- KANBAN BOARD VIEW --- */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div 
                key={col.id} 
                className="flex flex-col gap-4 p-4 rounded-2xl bg-card/25 border border-border/40 min-h-[500px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${col.color}`}>
                      {col.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">({colTasks.length})</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      resetForm();
                      setStatus(col.id);
                      setIsNewTaskOpen(true);
                    }}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
                  {colTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border/40 rounded-xl bg-card/5">
                      <ListTodo className="h-8 w-8 text-muted-foreground/20 mb-2" />
                      <span className="text-[10px] text-muted-foreground/50 font-semibold">No tasks</span>
                    </div>
                  ) : (
                    colTasks.map(task => (
                      <Card 
                        key={task.id}
                        onClick={() => handleOpenEdit(task)}
                        className="group p-4 border border-border/50 bg-card/40 hover:bg-card/75 hover:border-indigo-500/40 hover:shadow-md cursor-pointer transition-all duration-200 rounded-xl text-left"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-foreground leading-normal group-hover:text-indigo-400 transition-colors line-clamp-2">
                              {task.title}
                            </span>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground rounded hover:text-foreground cursor-pointer">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card border-border">
                                {columns.map(statusOption => (
                                  <DropdownMenuItem 
                                    key={statusOption.id}
                                    onClick={() => handleMoveTaskColumn(task, statusOption.id)}
                                    className="flex items-center justify-between text-xs cursor-pointer"
                                  >
                                    <span>Move to {statusOption.name}</span>
                                    {task.status === statusOption.id && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteTask(task)}
                                  className="text-destructive focus:bg-destructive/10 text-xs cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  <span>Delete Task</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {task.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider ${getPriorityBadge(task.priority)}`}>
                                {task.priority}
                              </span>
                              {task.due_date && (
                                <span className={`flex items-center gap-1 text-[9px] font-medium ${new Date(task.due_date) < new Date() && task.status !== "completed" ? "text-rose-400" : "text-muted-foreground"}`}>
                                  <Clock className="h-3 w-3" />
                                  <span>{format(new Date(task.due_date), "MMM d")}</span>
                                </span>
                              )}
                            </div>

                            {task.assignee && (
                              <div className="flex items-center gap-1 bg-muted/60 px-1.5 py-0.5 border border-border/40 rounded-full text-[9px] font-semibold text-foreground max-w-28 truncate">
                                <User className="h-2.5 w-2.5 text-indigo-400 shrink-0" />
                                <span className="truncate">{task.assignee.username}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* --- LIST VIEW --- */
        <Card className="border-border/60 bg-card/30 backdrop-blur-xl rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-card/60">
            <span className="text-xs font-bold text-foreground">Task Backlog</span>
            <span className="text-xs text-muted-foreground">{tasks.length} total tasks</span>
          </div>
          <div className="divide-y divide-border/60">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ListTodo className="h-12 w-12 text-muted-foreground/30 mb-2" />
                <h3 className="text-sm font-bold text-foreground">No tasks registered</h3>
                <p className="text-xs text-muted-foreground/60 max-w-xs mt-1">Get started by creating a task for this project workspace.</p>
              </div>
            ) : (
              tasks.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => handleOpenEdit(task)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-card/50 cursor-pointer gap-4 transition-all text-left"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveTaskColumn(task, task.status === "completed" ? "todo" : "completed");
                      }}
                      className={`h-5 w-5 rounded border border-border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${task.status === "completed" ? "bg-emerald-600 border-emerald-500 text-white" : "bg-background hover:border-indigo-500"}`}
                    >
                      {task.status === "completed" && <Check className="h-3 w-3 stroke-[3]" />}
                    </button>
                    <div className="space-y-1 min-w-0">
                      <span className={`text-xs font-bold text-foreground truncate ${task.status === "completed" ? "line-through text-muted-foreground/60" : ""}`}>
                        {task.title}
                      </span>
                      {task.description && (
                        <p className="text-[11px] text-muted-foreground truncate max-w-lg">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-3 shrink-0 ml-8 sm:ml-0">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getPriorityBadge(task.priority)}`}>
                      {task.priority}
                    </span>

                    <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider bg-muted text-muted-foreground`}>
                      {task.status.replace("_", " ")}
                    </span>

                    {task.due_date && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{format(new Date(task.due_date), "MMM d, yyyy")}</span>
                      </span>
                    )}

                    {task.assignee && (
                      <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full text-[10px] text-foreground font-semibold">
                        <User className="h-3 w-3 text-indigo-400" />
                        <span>{task.assignee.username}</span>
                      </span>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task);
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Add Task Dialog */}
      <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
        <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[450px]">
          <DialogHeader className="text-left">
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription>Create a task to track assignments, priorities, and project milestones.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3 text-left">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Task Title</label>
              <Input 
                placeholder="E.g. Design Landing Page Mockup"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background border-border text-foreground h-9"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Description</label>
              <Textarea 
                placeholder="Provide task specs, sub-tasks, or instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="bg-background border-border text-foreground resize-none text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Status</label>
                <Select value={status} onValueChange={(val: "todo" | "in_progress" | "completed") => setStatus(val)}>
                  <SelectTrigger className="bg-background border-border h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Priority</label>
                <Select value={priority} onValueChange={(val: "low" | "medium" | "high") => setPriority(val)}>
                  <SelectTrigger className="bg-background border-border h-9">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Assignee</label>
              <Select value={assigneeId} onValueChange={(val) => setAssigneeId(val)}>
                <SelectTrigger className="bg-background border-border h-9">
                  <SelectValue placeholder="Assign a teammate" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 flex flex-col">
              <label className="text-xs font-bold text-muted-foreground mb-1">Due Date</label>
              <DatePicker 
                value={dueDate}
                onChange={setDueDate}
                placeholder="Select deadline"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsNewTaskOpen(false)} className="text-muted-foreground cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleCreateTask} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit / Details Task Dialog */}
      <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
        <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[450px]">
          <DialogHeader className="text-left">
            <DialogTitle>Edit Task Details</DialogTitle>
            <DialogDescription>Modify status, priorities, assignees, or details for this task card.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3 text-left">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Task Title</label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background border-border text-foreground h-9"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Description</label>
              <Textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="bg-background border-border text-foreground resize-none text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Status</label>
                <Select value={status} onValueChange={(val: "todo" | "in_progress" | "completed") => setStatus(val)}>
                  <SelectTrigger className="bg-background border-border h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Priority</label>
                <Select value={priority} onValueChange={(val: "low" | "medium" | "high") => setPriority(val)}>
                  <SelectTrigger className="bg-background border-border h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Assignee</label>
              <Select value={assigneeId} onValueChange={(val) => setAssigneeId(val)}>
                <SelectTrigger className="bg-background border-border h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 flex flex-col">
              <label className="text-xs font-bold text-muted-foreground mb-1">Due Date</label>
              <DatePicker 
                value={dueDate}
                onChange={setDueDate}
                placeholder="Select deadline"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 justify-between flex sm:justify-between w-full">
            <Button 
              variant="destructive" 
              onClick={() => {
                if (activeTask) handleDeleteTask(activeTask);
              }}
              className="cursor-pointer gap-1"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsEditTaskOpen(false)} className="text-muted-foreground cursor-pointer">
                Cancel
              </Button>
              <Button onClick={handleUpdateTask} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
