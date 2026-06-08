"use client";

import React, { useState } from "react";
import { useWorkspace, Task } from "@/app/context";
import {
  Plus,
  Search,
  Trash2,
  Calendar,
  CheckSquare,
  MessageSquare,
  AlertTriangle,
  X,
  MoreVertical
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const taskFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters long." }),
  description: z.string().min(5, { message: "Description must be at least 5 characters long." }),
  priority: z.enum(["low", "medium", "high"]),
  assigneeId: z.string().min(1, { message: "Please select an assignee." }),
  dueDate: z.string().min(1, { message: "Please select a due date." }),
  tagsInput: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export const JiraBoard: React.FC = () => {
  const {
    activeProject,
    activeProjectId,
    teamMembers,
    currentUser,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    addSubtask,
    toggleSubtask,
    addComment,
  } = useWorkspace();

  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskColumnId, setSelectedTaskColumnId] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newCommentText, setNewCommentText] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      assigneeId: "",
      dueDate: "",
      tagsInput: "",
    },
  });

  if (!activeProject) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-bold text-foreground">No Project Workspace Selected</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          Select or create a project workspace from the left server panel to access its Kanban sprint board.
        </p>
      </div>
    );
  }

  const onSubmitTask = (data: TaskFormValues) => {
    if (!activeProjectId || !activeColumnId) return;

    const tags = data.tagsInput
      ? data.tagsInput.split(",").map((t) => t.trim()).filter((t) => t.length > 0)
      : [];

    addTask(activeProjectId, activeColumnId, {
      title: data.title,
      description: data.description,
      priority: data.priority,
      assigneeId: data.assigneeId,
      dueDate: data.dueDate,
      tags,
    });

    reset();
    setIsAddTaskOpen(false);
  };

  const openAddTaskDialog = (colId: string) => {
    setActiveColumnId(colId);
    reset();
    setIsAddTaskOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string, sourceColId: string) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ taskId, sourceColId }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, destColId: string) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData("text/plain");
      if (!dataStr) return;
      const { taskId, sourceColId } = JSON.parse(dataStr);
      if (sourceColId === destColId) return;

      moveTask(activeProject.id, sourceColId, destColId, taskId);

      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTaskColumnId(destColId);
      }
    } catch (err) {
      console.error("Drag-and-drop drop parsing failed", err);
    }
  };

  const getSubtaskCompletion = (task: Task) => {
    if (task.subtasks.length === 0) return null;
    const completed = task.subtasks.filter((s) => s.completed).length;
    return {
      text: `${completed}/${task.subtasks.length} Subtasks`,
      percent: (completed / task.subtasks.length) * 100,
    };
  };

  const getPriorityBorder = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "high":
        return "border-l-4 border-l-rose-500";
      case "medium":
        return "border-l-4 border-l-amber-500";
      case "low":
        return "border-l-4 border-l-emerald-500";
    }
  };

  const getFilteredTasks = (tasks: Task[]) => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesAssignee = assigneeFilter === "all" || task.assigneeId === assigneeFilter;

      return matchesSearch && matchesPriority && matchesAssignee;
    });
  };

  const handleOpenDetails = (task: Task, colId: string) => {
    setSelectedTask(task);
    setSelectedTaskColumnId(colId);
  };

  const handleCloseDetails = () => {
    setSelectedTask(null);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !selectedTask) return;
    addSubtask(activeProject.id, selectedTaskColumnId, selectedTask.id, newSubtaskTitle);

    setSelectedTask((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        subtasks: [...prev.subtasks, { id: `sub-${Date.now()}`, title: newSubtaskTitle, completed: false }],
      };
    });
    setNewSubtaskTitle("");
  };

  const handleToggleSub = (subId: string) => {
    if (!selectedTask) return;
    toggleSubtask(activeProject.id, selectedTaskColumnId, selectedTask.id, subId);

    setSelectedTask((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        subtasks: prev.subtasks.map((s) => (s.id === subId ? { ...s, completed: !s.completed } : s)),
      };
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTask) return;
    addComment(activeProject.id, selectedTaskColumnId, selectedTask.id, newCommentText);

    setSelectedTask((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        comments: [
          ...prev.comments,
          {
            id: `com-${Date.now()}`,
            authorId: currentUser.id,
            authorName: currentUser.name,
            authorAvatar: currentUser.avatar,
            text: newCommentText,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    });
    setNewCommentText("");
  };

  const handleUpdateTaskDetail = (updates: Partial<Task>) => {
    if (!selectedTask) return;
    updateTask(activeProject.id, selectedTaskColumnId, selectedTask.id, updates);
    setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const handleDeleteTaskDetail = () => {
    if (!selectedTask) return;
    deleteTask(activeProject.id, selectedTaskColumnId, selectedTask.id);
    setSelectedTask(null);
  };

  const handleMoveTaskDetail = (destColId: string) => {
    if (!selectedTask || destColId === selectedTaskColumnId) return;
    moveTask(activeProject.id, selectedTaskColumnId, destColId, selectedTask.id);
    setSelectedTaskColumnId(destColId);
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">

      <div className="flex flex-col gap-4 border-b border-border bg-background p-4 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground">{activeProject.name} Board</h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-md truncate">{activeProject.description || "Workspace board"}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-44 rounded bg-background border border-border py-1.5 pl-8 pr-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-indigo-600/50"
            />
          </div>

          <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val)}>
            <SelectTrigger className="w-[130px] h-8 text-xs bg-background border-border text-foreground hover:bg-muted/30">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground">
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={assigneeFilter} onValueChange={(val) => setAssigneeFilter(val)}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border text-foreground hover:bg-muted/30">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground">
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value={currentUser.id}>Assignee: Me</SelectItem>
              {teamMembers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  Assignee: {m.name.split(" ")[0]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-4 flex gap-4 bg-background items-start select-none">

        {activeProject.columns.map((column) => {
          const filteredTasks = getFilteredTasks(column.tasks);
          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-100 dark:bg-zinc-900 w-72 shrink-0 max-h-[85vh] overflow-hidden"
            >
              <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{column.name}</h3>
                    <span className="ml-2 bg-background text-zinc-600 dark:text-zinc-400 text-xs font-bold px-2.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                      {filteredTasks.length}
                    </span>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-md hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80 focus:outline-none cursor-pointer">
                        <MoreVertical className="h-4 w-4 text-zinc-500" />
                        <span className="sr-only">Task actions</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-popover border-border text-popover-foreground">
                      <DropdownMenuItem onClick={() => openAddTaskDialog(column.id)} className="cursor-pointer">
                        Add Card
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {filteredTasks.map((task) => {
                  const subtaskProgress = getSubtaskCompletion(task);
                  const assignee = teamMembers.find((m) => m.id === task.assigneeId) || (task.assigneeId === currentUser.id ? currentUser : null);

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id, column.id)}
                      onClick={() => handleOpenDetails(task, column.id)}
                      className="bg-card dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-850 cursor-grab active:cursor-grabbing opacity-100 text-left transition-colors hover:border-indigo-500/50"
                    >
                      <div className="p-3">
                        <div className="flex flex-wrap gap-2 items-center justify-between mb-2">
                          <div className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/40 truncate max-w-[130px]">
                            {task.tags[0] || "Task"}
                          </div>
                          <div className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
                            task.priority === "high" && "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30",
                            task.priority === "medium" && "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30",
                            task.priority === "low" && "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/30"
                          )}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2 truncate group-hover:text-indigo-400 transition-colors leading-snug">
                          {task.title}
                        </h4>

                        <div className="flex flex-wrap gap-3 items-center text-xs text-zinc-500 dark:text-zinc-400 space-x-3 mb-3">
                          {task.dueDate && (
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              <span>
                                {new Date(task.dueDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-paperclip h-3.5 w-3.5"
                              aria-hidden="true"
                            >
                              <path d="M13.234 20.252 21 12.3"></path>
                              <path d="m16 6-8.414 8.586a2 2 0 0 0 0 2.828 2 2 0 0 0 2.828 0l8.414-8.586a4 4 0 0 0 0-5.656 4 4 0 0 0-5.656 0l-8.415 8.585a6 6 0 1 0 8.486 8.486"></path>
                            </svg>
                            <span className="ml-1">{task.comments.length > 0 ? task.comments.length + 1 : 2}</span>
                          </div>

                          {task.comments.length > 0 && (
                            <div className="flex items-center">
                              <MessageSquare className="h-3.5 w-3.5 mr-1" />
                              <span>{task.comments.length}</span>
                            </div>
                          )}

                          {subtaskProgress && (
                            <div className="flex items-center">
                              <CheckSquare className="h-3.5 w-3.5 mr-1" />
                              <span>{subtaskProgress.text}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {assignee ? (
                              <span className="relative flex shrink-0 overflow-hidden rounded-full h-6 w-6 border-2 border-white dark:border-zinc-950">
                                <img
                                  className="aspect-square h-full w-full"
                                  alt={assignee.name}
                                  src={assignee.avatar}
                                />
                              </span>
                            ) : (
                              <div className="h-6 w-6" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-md py-8 text-center px-4">
                    <p className="text-[11px] text-muted-foreground font-semibold">No Matching Cards</p>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => openAddTaskDialog(column.id)}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full text-zinc-500 hover:text-zinc-700 dark:text-zinc-450 dark:hover:text-zinc-200 hover:bg-background dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 justify-start cursor-pointer"
                  type="button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </button>
              </div>
            </div>
          );
        })}

      </div>

      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[425px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border shrink-0 text-left">
            <DialogTitle className="text-xl font-bold tracking-tight">Create Board Card</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Add a new task card to the sprint backlog. Keep specifications detailed.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitTask)} className="flex flex-col flex-1 gap-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 text-left">
              <div className="space-y-1">
                <Label className="text-xs font-normal text-muted-foreground">Task Title</Label>
                <Input
                  {...register("title")}
                  placeholder="e.g. Implement Discord integration hook"
                  className="bg-background border-border text-foreground focus:ring-0"
                />
                {errors.title && <p className="text-[10px] text-rose-500 font-semibold">{errors.title.message}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-normal text-muted-foreground">Description</Label>
                <Textarea
                  {...register("description")}
                  placeholder="Add subtasks or detailed guidelines..."
                  className="bg-background border-border text-foreground h-20"
                />
                {errors.description && <p className="text-[10px] text-rose-500 font-semibold">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-normal text-muted-foreground">Priority Level</Label>
                  <Controller
                    control={control}
                    name="priority"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full h-9 bg-background border-border text-foreground text-xs">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-normal text-muted-foreground">Assignee</Label>
                  <Controller
                    control={control}
                    name="assigneeId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full h-9 bg-background border-border text-foreground text-xs">
                          <SelectValue placeholder="Select Coworker" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground">
                          <SelectItem value={currentUser.id}>Alex (Me)</SelectItem>
                          {teamMembers.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.assigneeId && <p className="text-[10px] text-rose-500 font-semibold">{errors.assigneeId.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-normal text-muted-foreground">Due Date</Label>
                  <Input
                    type="date"
                    {...register("dueDate")}
                    className="bg-background border-border text-foreground py-1.5 focus:ring-0 text-xs"
                  />
                  {errors.dueDate && <p className="text-[10px] text-rose-500 font-semibold">{errors.dueDate.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-normal text-muted-foreground">Tags (comma separated)</Label>
                  <Input
                    {...register("tagsInput")}
                    placeholder="UI, Setup, Bug"
                    className="bg-background border-border text-foreground focus:ring-0 text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-border bg-card shrink-0">
              <Button type="button" variant="ghost" onClick={() => setIsAddTaskOpen(false)} className="text-muted-foreground hover:text-foreground">
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                Add Card
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={handleCloseDetails}>
          <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[650px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-4 border-b border-border shrink-0 text-left">
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="rounded bg-background border border-border text-[10px] text-muted-foreground px-1.5 py-0.2 font-bold ">
                  Task ID: {selectedTask.id.slice(5, 12)}
                </span>
                {selectedTask.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="border-border text-muted-foreground text-[9px] px-1 font-semibold leading-none py-0.5">
                    {tag}
                  </Badge>
                ))}
              </div>
              <DialogTitle className="text-lg font-bold text-foreground leading-snug mt-1.5">{selectedTask.title}</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-800 text-left">
              <div className="grid gap-6 md:grid-cols-3">

                <div className="md:col-span-2 space-y-6">

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-muted-foreground ">Description</h4>
                    <p className="text-xs text-foreground bg-background rounded-md p-3 leading-relaxed border border-border whitespace-pre-wrap">
                      {selectedTask.description || "No description provided."}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-muted-foreground flex items-center justify-between">
                      <span>Subtasks Checklist</span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {selectedTask.subtasks.filter(s => s.completed).length}/{selectedTask.subtasks.length} Done
                      </span>
                    </h4>

                    <div className="space-y-1">
                      {selectedTask.subtasks.map((sub) => (
                        <div
                          key={sub.id}
                          onClick={() => handleToggleSub(sub.id)}
                          className="flex cursor-pointer items-center gap-2.5 rounded bg-background/60 px-3 py-1.5 border border-border/40 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={sub.completed}
                            onCheckedChange={() => handleToggleSub(sub.id)}
                          />
                          <span className={cn(
                            "text-xs leading-none truncate",
                            sub.completed ? "line-through text-muted-foreground" : "text-foreground"
                          )}>
                            {sub.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddSubtask} className="flex gap-2">
                      <Input
                        required
                        placeholder="Add subtask checklist item..."
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        className="bg-background border-border text-xs py-1 h-8 focus:ring-0"
                      />
                      <Button type="submit" size="sm" className="bg-muted text-foreground hover:bg-muted/80 h-8 font-semibold text-xs leading-none border border-border">
                        Add
                      </Button>
                    </form>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground ">Comments Feed</h4>

                    <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 px-1">
                      {selectedTask.comments.map((com) => (
                        <div key={com.id} className="rounded bg-background p-2.5 border border-border/60 flex items-start gap-2.5">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={com.authorAvatar} />
                            <AvatarFallback>{com.authorName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="text-left text-xs leading-normal">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-foreground/90">{com.authorName}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(com.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-muted-foreground">{com.text}</p>
                          </div>
                        </div>
                      ))}
                      {selectedTask.comments.length === 0 && (
                        <p className="text-[10px] text-muted-foreground font-semibold py-2">No comments posted yet.</p>
                      )}
                    </div>

                    <form onSubmit={handleAddComment} className="flex gap-2">
                      <Input
                        required
                        placeholder="Add a comment..."
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        className="bg-background border-border text-xs py-1 h-8 focus:ring-0"
                      />
                      <Button type="submit" size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700 h-8 font-semibold text-xs leading-none">
                        Post
                      </Button>
                    </form>
                  </div>

                </div>

                <div className="space-y-4 rounded-lg bg-background/40 border border-border p-4 h-fit">

                  <div className="space-y-1">
                    <Label className="text-xs font-normal text-muted-foreground ">Status Column</Label>
                    <Select
                      value={selectedTaskColumnId}
                      onValueChange={(val) => handleMoveTaskDetail(val)}
                    >
                      <SelectTrigger className="w-full h-8 bg-background border-border text-foreground text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground">
                        {activeProject.columns.map((col) => (
                          <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-normal text-muted-foreground ">Priority</Label>
                    <Select
                      value={selectedTask.priority}
                      onValueChange={(val) => handleUpdateTaskDetail({ priority: val as any })}
                    >
                      <SelectTrigger className="w-full h-8 bg-background border-border text-foreground text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-normal text-muted-foreground ">Assignee</Label>
                    <Select
                      value={selectedTask.assigneeId}
                      onValueChange={(val) => handleUpdateTaskDetail({ assigneeId: val })}
                    >
                      <SelectTrigger className="w-full h-8 bg-background border-border text-foreground text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground">
                        <SelectItem value={currentUser.id}>Alex (Me)</SelectItem>
                        {teamMembers.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-normal text-muted-foreground ">Due Date</Label>
                    <Input
                      type="date"
                      value={selectedTask.dueDate}
                      onChange={(e) => handleUpdateTaskDetail({ dueDate: e.target.value })}
                      className="bg-background border-border p-1 h-8 text-xs text-foreground"
                    />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <Button
                      onClick={handleDeleteTaskDetail}
                      variant="ghost"
                      className="w-full justify-start gap-2 rounded text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 font-semibold text-xs leading-none py-1.5"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Card
                    </Button>
                  </div>

                </div>

              </div>
            </div>

            <DialogFooter className="p-4 border-t border-border bg-card shrink-0 flex items-center justify-end">
              <Button onClick={handleCloseDetails} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8">
                Close Details
              </Button>
            </DialogFooter>

          </DialogContent>
        </Dialog>
      )}

    </div>
  );
};
export default JiraBoard;
