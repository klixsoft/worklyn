"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Trash2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  User,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { clientApi } from "@/lib/api/client";
import { useDeleteConfirmation } from "@/components/auth/delete-confirmation-context";

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

export default function ProjectsDashboardPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { confirmDelete } = useDeleteConfirmation();

  // Fetch projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<ProjectType[]>({
    queryKey: ["projects"],
    queryFn: () => clientApi.get("projects").json(),
  });

  // Fetch all tasks for stats and progress calculation
  const { data: tasks = [] } = useQuery<TaskType[]>({
    queryKey: ["tasks"],
    queryFn: () => clientApi.get("tasks").json(),
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (newProject: { name: string; description: string }) =>
      clientApi.post("projects", { json: newProject }).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created successfully");
      setIsNewProjectOpen(false);
      setName("");
      setDescription("");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create project");
    }
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => clientApi.delete(`projects/${id}`).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete project");
    }
  });

  const handleCreateProject = () => {
    if (!name.trim()) return;
    createProjectMutation.mutate({
      name: name.trim(),
      description: description.trim()
    });
  };

  const handleDeleteProject = (project: ProjectType) => {
    confirmDelete(async () => {
      await deleteProjectMutation.mutateAsync(project.id);
    });
  };

  // Filter projects by search
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  // Compute statistics
  const totalProjects = projects.length;
  const activeTasks = tasks.filter(t => t.status !== "completed").length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const overdueTasks = tasks.filter(t => {
    if (t.status === "completed" || !t.due_date) return false;
    return new Date(t.due_date) < new Date();
  }).length;

  // Compute progress for a specific project
  const getProjectStats = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    const total = projectTasks.length;
    const completed = projectTasks.filter(t => t.status === "completed").length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, progress };
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Projects & Workspaces
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your team workspaces, assign tasks, track milestones, and view progress dashboards.
          </p>
        </div>
        <Button 
          onClick={() => setIsNewProjectOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/40 border-border/60 backdrop-blur-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-semibold">Total Projects</span>
              <h3 className="text-2xl font-bold text-foreground">{totalProjects}</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <FolderKanban className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/60 backdrop-blur-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-semibold">Active Tasks</span>
              <h3 className="text-2xl font-bold text-foreground">{activeTasks}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/60 backdrop-blur-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-semibold">Tasks Completed</span>
              <h3 className="text-2xl font-bold text-foreground">{completedTasks}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/60 backdrop-blur-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-semibold">Overdue Tasks</span>
              <h3 className="text-2xl font-bold text-rose-400">{overdueTasks}</h3>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <AlertCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter workspaces by name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 bg-card/40 border-border/60"
        />
      </div>

      {/* Projects Grid */}
      {isLoadingProjects ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border/60 rounded-2xl bg-card/10 p-6">
          <FolderKanban className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground">No projects found</h3>
          <p className="text-muted-foreground text-sm max-w-xs mt-1">
            Create a workspace to begin organizing tasks, tracking status, and assigning activities.
          </p>
          <Button 
            onClick={() => setIsNewProjectOpen(true)}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
          >
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => {
            const { total, completed, progress } = getProjectStats(project.id);
            return (
              <Card 
                key={project.id} 
                className="group relative flex flex-col justify-between overflow-hidden border-border/50 bg-card/30 backdrop-blur-xl hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 rounded-2xl"
              >
                <div>
                  <CardHeader className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <CardTitle className="text-lg font-bold text-foreground truncate group-hover:text-indigo-400 transition-colors">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <User className="h-3 w-3" />
                          <span>Owner: {project.owner?.username || "Unknown"}</span>
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteProject(project);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-0 space-y-4">
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {project.description || "No description provided."}
                    </p>

                    {/* Progress Indicator */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-muted-foreground">Task Completion</span>
                        <span className="text-foreground">{progress}% ({completed}/{total})</span>
                      </div>
                      <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </div>
                <div className="px-6 pb-6 pt-0 mt-auto">
                  <Button 
                    asChild 
                    variant="secondary"
                    className="w-full justify-between h-9 text-xs group/btn hover:bg-indigo-600 hover:text-white cursor-pointer active:scale-95 transition-all"
                  >
                    <Link href={`/projects/${project.id}`}>
                      <span>Enter Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Project Dialog */}
      <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
        <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[450px]">
          <DialogHeader className="text-left">
            <DialogTitle>New Workspace</DialogTitle>
            <DialogDescription>Create a project workspace to manage tasks, collaborate, and monitor goals.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Project Name</label>
              <Input 
                placeholder="E.g. Web Dashboard Design"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Description</label>
              <Textarea 
                placeholder="Provide a brief summary of the workspace goals, targets, and scope..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="bg-background border-border text-foreground resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsNewProjectOpen(false)} className="text-muted-foreground cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleCreateProject} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
