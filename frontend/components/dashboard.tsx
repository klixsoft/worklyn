"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useWorkspace, Task } from "@/app/context";
import {
  Kanban,
  Clock,
  MessageSquare,
  CheckCircle2,
  Activity,
  Briefcase,
  User as UserIcon,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { MarkdownViewer } from "./daily-updates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export const Dashboard: React.FC = () => {
  const {
    projects,
    teamMembers,
    dailyUpdates,
    attendanceLogs,
    isClockedIn,
    currentUser,
    setActiveTab,
    setActiveProjectId,
    addTeamMember,
    roles,
  } = useWorkspace();

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [newMemberStatus, setNewMemberStatus] = useState<"online" | "idle" | "offline">("online");

  // Detect theme for ApexCharts
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const checkTheme = () => setIsDark(document.documentElement.classList.contains("dark"));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const totalProjects = projects.length;

  let totalTasks = 0;
  let completedTasks = 0;
  const myAssignedTasks: { task: Task; projectName: string; projectId: string; columnId: string; columnName: string }[] = [];

  projects.forEach((proj) => {
    proj.columns.forEach((col) => {
      totalTasks += col.tasks.length;
      if (col.name.toLowerCase() === "done" || col.id.toLowerCase().includes("done")) {
        completedTasks += col.tasks.length;
      }
      col.tasks.forEach((t) => {
        if (t.assigneeId === currentUser.id) {
          myAssignedTasks.push({
            task: t,
            projectName: proj.name,
            projectId: proj.id,
            columnId: col.id,
            columnName: col.name
          });
        }
      });
    });
  });

  const getTodayWorkingHours = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayLogs = attendanceLogs.filter(log => log.date === todayStr);

    if (todayLogs.length === 0) return "0 mins";

    let totalMinutes = 0;
    todayLogs.forEach(log => {
      if (log.checkOut) {
        totalMinutes += log.duration;
      } else {
        const diffMs = new Date().getTime() - new Date(log.checkIn).getTime();
        totalMinutes += Math.round(diffMs / (1000 * 60));
      }
    });

    if (totalMinutes < 60) return `${totalMinutes}m`;
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const todayHours = getTodayWorkingHours();

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberRole.trim()) return;

    const avatars = [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80"
    ];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    addTeamMember(newMemberName, newMemberRole, randomAvatar, newMemberStatus);

    setNewMemberName("");
    setNewMemberRole("");
    setNewMemberStatus("online");
    setIsAddMemberOpen(false);
  };

  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  const getPriorityBadge = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "high":
        return <Badge className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-none font-semibold">High</Badge>;
      case "medium":
        return <Badge className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-none font-semibold">Medium</Badge>;
      case "low":
        return <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-none font-semibold">Low</Badge>;
    }
  };

  const handleTaskClick = (projId: string) => {
    setActiveProjectId(projId);
    setActiveTab("board");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 font-sans">

      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="text-left">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome back, <span className="text-indigo-400">{currentUser.name}</span>!
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(new Date().toISOString())} • Keep track of your sprints and team communication.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-card border border-border px-4 py-2 text-xs">
            <span className={`h-2 w-2 rounded-full ${isClockedIn ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40"}`} />
            <span className="font-semibold text-muted-foreground">{isClockedIn ? "Clocked In" : "Clocked Out"}</span>
            <span className="text-muted-foreground/60">({todayHours} today)</span>
          </div>
          <button
            onClick={() => setActiveTab("attendance")}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Manage Shift
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">

        <Card className="bg-card border-border text-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active Projects</CardTitle>
            <Briefcase className="h-4.5 w-4.5 text-indigo-400" />
          </CardHeader>
          <CardContent className="text-left">
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="h-3 w-3 text-green-400" />
              Fully isolated collaborative workspaces
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border text-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Backlog Tasks</CardTitle>
            <Kanban className="h-4.5 w-4.5 text-indigo-400" />
          </CardHeader>
          <CardContent className="text-left">
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              {completedTasks} tasks successfully resolved (Done)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border text-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Shift Check-In</CardTitle>
            <Clock className="h-4.5 w-4.5 text-indigo-400" />
          </CardHeader>
          <CardContent className="text-left">
            <div className="text-2xl font-bold">{todayHours}</div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              {isClockedIn ? "Timer active: Recording hours" : "Clock in to log working duration"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border text-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Team Co-workers</CardTitle>
            <UserIcon className="h-4.5 w-4.5 text-indigo-400" />
          </CardHeader>
          <CardContent className="text-left">
            <div className="text-2xl font-bold">{teamMembers.length + 1}</div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              {teamMembers.filter(m => m.status === "online").length} members currently online
            </p>
          </CardContent>
        </Card>

      </div>

      {/* ─── Analytics Charts ─── */}
      {(() => {
        // Build chart data
        const statusMap: Record<string, number> = {};
        const projectLabels: string[] = [];
        const projectStatusData: Record<string, number[]> = {};
        const memberTaskMap: Record<string, number> = {};

        const statusOrder = ["To Do", "In Progress", "In Review", "Done"];
        const statusColors = ["#6b7280", "#6366f1", "#f59e0b", "#10b981"];

        projects.forEach((proj) => {
          projectLabels.push(proj.name.length > 12 ? proj.name.slice(0, 12) + "…" : proj.name);
          proj.columns.forEach((col) => {
            const label = col.name;
            statusMap[label] = (statusMap[label] || 0) + col.tasks.length;
            if (!projectStatusData[label]) projectStatusData[label] = [];
            projectStatusData[label].push(col.tasks.length);

            col.tasks.forEach((t) => {
              if (t.assigneeId) {
                memberTaskMap[t.assigneeId] = (memberTaskMap[t.assigneeId] || 0) + 1;
              }
            });
          });
        });

        const donutLabels = Object.keys(statusMap);
        const donutSeries = donutLabels.map((k) => statusMap[k]);
        const donutColors = donutLabels.map((label) => {
          if (label.toLowerCase().includes("done")) return "#10b981";
          if (label.toLowerCase().includes("progress")) return "#6366f1";
          if (label.toLowerCase().includes("review")) return "#f59e0b";
          return "#6b7280";
        });

        const barSeries = statusOrder
          .filter((s) => projectStatusData[s])
          .map((s, i) => ({
            name: s,
            data: projectStatusData[s] || projectLabels.map(() => 0),
            color: statusColors[i],
          }));

        const allMembers = [currentUser, ...teamMembers];
        const memberNames = allMembers.map((m) => m.name.split(" ")[0]);
        const memberCounts = allMembers.map((m) => memberTaskMap[m.id] || 0);

        const chartTheme = isDark ? "dark" : "light";
        const gridColor = isDark ? "#27272a" : "#e4e4e7";
        const labelColor = isDark ? "#a1a1aa" : "#71717a";
        const bgColor = "transparent";
        const totalTasks = donutSeries.reduce((a, b) => a + b, 0);

        return (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">

            {/* Donut — Task Distribution */}
            <Card className="bg-card border-border text-foreground">
              <CardHeader className="border-b border-border pb-3 text-left">
                <CardTitle className="text-base">Task Distribution</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Status breakdown across all projects
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 flex flex-col items-center">
                {totalTasks === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Kanban className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">No tasks yet</p>
                  </div>
                ) : (
                  <Chart
                    type="donut"
                    width="100%"
                    height={220}
                    series={donutSeries}
                    options={{
                      chart: { type: "donut", background: bgColor, toolbar: { show: false } },
                      theme: { mode: chartTheme },
                      labels: donutLabels,
                      colors: donutColors,
                      legend: { show: true, position: "bottom", fontSize: "11px", labels: { colors: labelColor } },
                      dataLabels: { enabled: false },
                      plotOptions: {
                        pie: {
                          donut: {
                            size: "65%",
                            labels: {
                              show: true,
                              total: {
                                show: true,
                                label: "Total",
                                fontSize: "11px",
                                color: labelColor,
                                formatter: () => String(totalTasks),
                              },
                            },
                          },
                        },
                      },
                      stroke: { width: 0 },
                      tooltip: { theme: chartTheme },
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Stacked Bar — Project Velocity */}
            <Card className="bg-card border-border text-foreground">
              <CardHeader className="border-b border-border pb-3 text-left">
                <CardTitle className="text-base">Project Velocity</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Tasks per status column per project
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Briefcase className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">No projects yet</p>
                  </div>
                ) : (
                  <Chart
                    type="bar"
                    width="100%"
                    height={220}
                    series={barSeries}
                    options={{
                      chart: { type: "bar", background: bgColor, stacked: true, toolbar: { show: false } },
                      theme: { mode: chartTheme },
                      xaxis: { categories: projectLabels, labels: { style: { fontSize: "10px", colors: labelColor } } },
                      yaxis: { labels: { style: { fontSize: "10px", colors: labelColor } } },
                      legend: { show: true, position: "bottom", fontSize: "10px", labels: { colors: labelColor } },
                      grid: { borderColor: gridColor, strokeDashArray: 4 },
                      plotOptions: { bar: { horizontal: false, borderRadius: 3, columnWidth: "50%" } },
                      dataLabels: { enabled: false },
                      tooltip: { theme: chartTheme },
                      fill: { opacity: 0.9 },
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Horizontal Bar — Team Workload */}
            <Card className="bg-card border-border text-foreground">
              <CardHeader className="border-b border-border pb-3 text-left">
                <CardTitle className="text-base">Team Workload</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Open tasks assigned per member
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <Chart
                  type="bar"
                  width="100%"
                  height={220}
                  series={[{ name: "Tasks", data: memberCounts, color: "#6366f1" }]}
                  options={{
                    chart: { type: "bar", background: bgColor, toolbar: { show: false } },
                    theme: { mode: chartTheme },
                    xaxis: { categories: memberNames, labels: { style: { fontSize: "10px", colors: labelColor } } },
                    yaxis: { labels: { style: { fontSize: "10px", colors: labelColor } }, tickAmount: 4 },
                    plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: "45%" } },
                    dataLabels: { enabled: false },
                    grid: { borderColor: gridColor, strokeDashArray: 4 },
                    tooltip: { theme: chartTheme },
                    fill: { opacity: 1, type: "gradient", gradient: { shade: "dark", type: "vertical", shadeIntensity: 0.3, opacityFrom: 1, opacityTo: 0.7 } },
                  }}
                />
              </CardContent>
            </Card>

          </div>
        );
      })()}

      <div className="grid gap-6 lg:grid-cols-3">

        <Card className="lg:col-span-2 bg-card border-border text-foreground flex flex-col">
          <CardHeader className="border-b border-border pb-3 flex flex-row items-center justify-between">
            <div className="text-left">
              <CardTitle className="text-base text-foreground">Assigned to Me</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Your current tasks across all board sprints</CardDescription>
            </div>
            <Badge className="bg-indigo-600 text-white border-none font-bold">{myAssignedTasks.length} Tasks</Badge>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-y-auto max-h-[360px] scrollbar-thin scrollbar-thumb-zinc-800">
            {myAssignedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground/60 mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground/50 mt-1">No tasks are currently assigned to your queue.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40 text-left">
                {myAssignedTasks.map(({ task, projectName, projectId, columnName }) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(projectId)}
                    className="group flex cursor-pointer items-center justify-between p-4 hover:bg-muted/40 transition-all"
                  >
                    <div className="space-y-1 pr-4 truncate">
                      <h4 className="text-sm font-semibold text-foreground group-hover:text-indigo-400 transition-colors truncate">
                        {task.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-muted-foreground">{projectName}</span>
                        <span>•</span>
                        <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded leading-none text-[10px] uppercase font-bold">
                          {columnName}
                        </span>
                        {task.dueDate && (
                          <>
                            <span>•</span>
                            <span>Due: {task.dueDate}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {getPriorityBadge(task.priority)}
                      <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">

          <Card className="bg-card border-border text-foreground">
            <CardHeader className="border-b border-border pb-3 text-left flex flex-row items-center justify-between">
              <div className="text-left">
                <CardTitle className="text-base text-foreground">Workspace Members</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Direct contact status & current activities</CardDescription>
              </div>
              <Button
                onClick={() => setIsAddMemberOpen(true)}
                size="xs"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold leading-none py-1 px-2.5 cursor-pointer shrink-0"
              >
                Add
              </Button>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                        member.status === "online" && "bg-green-500",
                        member.status === "idle" && "bg-amber-500",
                        member.status === "offline" && "bg-muted-foreground/60"
                      )} />
                    </div>
                    <div className="text-left text-xs truncate">
                      <p className="font-bold text-foreground">{member.name}</p>
                      <p className="text-muted-foreground text-[10px] truncate">{member.activity || member.role}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-border text-muted-foreground text-[9px] uppercase leading-none px-1 py-0.5 font-bold shrink-0">
                    {member.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border text-foreground">
            <CardContent className="p-4 flex items-center justify-between gap-4 text-left">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Attendance Status</p>
                <h4 className="text-sm font-semibold text-foreground">
                  {isClockedIn ? "Session Active: Clocked In" : "Session Inactive: Clocked Out"}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {isClockedIn ? `Checked in at ${new Date(attendanceLogs[0]?.checkIn).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : "Logs recorded in the logs table."}
                </p>
              </div>
              <button
                onClick={() => setActiveTab("attendance")}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm leading-none shrink-0 transition-colors cursor-pointer",
                  isClockedIn ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                )}
              >
                {isClockedIn ? "Clock Out" : "Clock In"}
              </button>
            </CardContent>
          </Card>

        </div>

      </div>

      <div className="mt-6">
        <Card className="bg-card border-border text-foreground">
          <CardHeader className="border-b border-border pb-3 flex flex-row items-center justify-between">
            <div className="text-left">
              <CardTitle className="text-base text-foreground">Recent Team Updates</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Daily standup summaries posted today</CardDescription>
            </div>
            <button
              onClick={() => setActiveTab("updates")}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              All Standups
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {dailyUpdates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">No daily standups submitted for today yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 p-4 md:grid-cols-2">
                {dailyUpdates.slice(0, 4).map((up) => (
                  <div key={up.id} className="rounded-lg bg-background p-4 border border-border space-y-2 flex flex-col justify-between">
                    <div className="space-y-2 text-left">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={up.userAvatar} />
                          <AvatarFallback>{up.userName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <h5 className="text-sm text-foreground">{up.userName}</h5>
                          {up.projectName && (
                            <p className="text-[10px] text-muted-foreground font-semibold">{up.projectName}</p>
                          )}
                        </div>
                        <span className="ml-auto text-[10px] text-muted-foreground">{up.date}</span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="space-y-1">
                          <span className="font-semibold text-foreground text-[10px]">Today's Focus:</span>
                          <div className="pl-2 border-l border-indigo-500/50">
                            <MarkdownViewer text={up.today} />
                          </div>
                        </div>
                        {up.blockers && up.blockers !== "None." && up.blockers !== "None" && (
                          <p className="text-rose-400/90 leading-normal flex items-start gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span><span className="font-semibold">Blocker:</span> {up.blockers}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[400px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border shrink-0 text-left">
            <DialogTitle className="text-lg font-bold">Add Team Member</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Add a new team member to your active workspace team.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMemberSubmit} className="flex flex-col flex-1 gap-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 text-left">
              <div className="space-y-1">
                <Label className="text-xs font-normal text-muted-foreground">Full Name</Label>
                <Input
                  required
                  placeholder="e.g. John Doe"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-normal text-muted-foreground">Role / Position</Label>
                <Select value={newMemberRole} onValueChange={setNewMemberRole} required>
                  <SelectTrigger className="w-full h-9 bg-background border-border text-foreground text-xs">
                    <SelectValue placeholder="Select a role..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    {roles.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-normal text-muted-foreground">Initial Status</Label>
                <Select value={newMemberStatus} onValueChange={(val) => setNewMemberStatus(val as any)}>
                  <SelectTrigger className="w-full h-9 bg-background border-border text-foreground text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="idle">Idle</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-border bg-card shrink-0 flex items-center justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsAddMemberOpen(false)} className="text-muted-foreground hover:text-foreground">
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};
export default Dashboard;
