"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useWorkspace } from "@/app/context";
import { useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientApi } from "@/lib/api/client";
import { handleApiError } from "@/lib/api/error-handler";
import { Search, Settings, Bell, Sparkles, BadgeCheck, CreditCard, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ServerRail, type DbProject } from "./sidebar/server-rail";
import { ProjectPanel } from "./sidebar/project-panel";
import { GlobalPanel } from "./sidebar/global-panel";

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const {
    projects,
    activeProject,
    activeProjectId,
    setActiveProjectId,
    activeChannelId,
    activeChannelType,
    setActiveChannel,
    teamMembers,
    currentUser,
    addChannel,
    getProjectChannels,
    activeSoftware,
    setActiveSoftware,
  } = useWorkspace();

  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initial = savedTheme || (document.documentElement.classList.contains("dark") ? "dark" : "light");
    setTheme(initial);
    if (initial === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed", err);
      setIsLoggingOut(false);
    }
  }, []);

  // ── DB Projects ──────────────────────────────────────────────
  const { data: dbProjects = [] } = useQuery<DbProject[]>({
    queryKey: ["projects"],
    queryFn: () => clientApi.get("projects").json(),
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      clientApi.post("projects", { json: data }).json<DbProject>(),
    onSuccess: (newProj) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project space created successfully");
      if (newProj?.id) router.push(`/projects/${newProj.id}`);
    },
    onError: (err: unknown) => handleApiError(err),
  });

  // ── URL-based project ID detection ───────────────────────────
  // Matches both UUID (DB) and proj-N (mock) formats
  const currentProjectId = useMemo(() => {
    const match = pathname.match(/\/projects\/([-\w]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const currentDbProject = useMemo(
    () => dbProjects.find((p) => p.id === currentProjectId) || null,
    [currentProjectId, dbProjects]
  );

  const currentMockProject = useMemo(
    () => projects.find((p) => p.id === currentProjectId) || null,
    [currentProjectId, projects]
  );

  const isGlobalActive = useMemo(() =>
    ["/dashboard", "/updates", "/attendance", "/chat", "/users", "/roles", "/finance", "/hr"].includes(pathname),
    [pathname]
  );

  // Prefer URL-detected ID over context default — prevents "dummy" project leaking in
  const activeProjId = useMemo(() => {
    if (currentProjectId) return currentProjectId;
    // Only fall back to context activeProject when NOT on a project-specific URL
    return activeProject && !isGlobalActive ? activeProject.id : null;
  }, [currentProjectId, activeProject, isGlobalActive]);

  // Name: DB project > mock (URL-matched) > context activeProject
  const activeProjName = useMemo(() => {
    if (currentDbProject) return currentDbProject.name;
    if (currentMockProject) return currentMockProject.name;
    return activeProject && !isGlobalActive ? activeProject.name : null;
  }, [currentDbProject, currentMockProject, activeProject, isGlobalActive]);

  const isProjectMode = !!activeProjId;

  // Channels for the current project (works for BOTH mock and DB projects)
  const projectChannels = useMemo(() => {
    if (!activeProjId) return [];
    return getProjectChannels(activeProjId);
  }, [activeProjId, getProjectChannels]);

  return (
    <div className="flex h-screen select-none text-muted-foreground font-sans shrink-0">

      {/* ── Left server icon rail ── */}
      <ServerRail
        activeSoftware={activeSoftware}
        setActiveSoftware={setActiveSoftware}
        dbProjects={dbProjects}
        pathname={pathname}
        theme={theme}
        toggleTheme={toggleTheme}
        onSoftwareClick={(sw) => {
          setActiveSoftware(sw.id);
          if (sw.id !== "pm") {
            router.push(sw.route);
          } else {
            setActiveProjectId(null);
            router.push("/dashboard");
          }
        }}
        onProjectClick={(projId) => router.push(`/projects/${projId}`)}
        onCreateProject={(data) => createProjectMutation.mutate(data)}
        isCreatingProject={createProjectMutation.isPending}
      />

      {/* ── Right 240px panel ── */}
      <div className="flex w-60 flex-col bg-sidebar border-r border-border">

        {/* Header */}
        <div className="flex h-12 items-center justify-between border-b border-border px-4 font-semibold text-foreground">
          <span className="truncate">{activeProjName || "Klixsoft Workspace"}</span>
        </div>

        {/* Search */}
        <div className="px-2 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Quick Search (⌘K)"
              className="w-full rounded bg-background border border-border py-1.5 pl-8 pr-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-600/50"
            />
          </div>
        </div>

        {/* Navigation panel */}
        {isProjectMode && activeProjId ? (
          <ProjectPanel
            projectId={activeProjId}
            projectName={activeProjName || "Project"}
            channels={projectChannels}
            teamMembers={teamMembers}
            onAddChannel={addChannel}
            onSetActiveChannel={setActiveChannel}
          />
        ) : (
          <GlobalPanel
            teamMembers={teamMembers}
            activeChannelId={activeChannelId}
            activeChannelType={activeChannelType}
            isGlobalActive={isGlobalActive}
            onSetActiveChannel={setActiveChannel}
          />
        )}

        {/* User footer */}
        <div className="flex h-14 items-center justify-between bg-background px-2 shrink-0 border-t border-border">
          <div className="flex items-center gap-2 truncate pr-1">
            <div className="relative">
              <Avatar className="h-8 w-8 cursor-pointer ring-offset-background transition-all hover:ring-2 hover:ring-indigo-600">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback>AM</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div className="text-left text-xs truncate leading-tight">
              <p className="font-bold text-foreground truncate">{currentUser.name}</p>
              <p className="text-muted-foreground text-[10px] truncate">{currentUser.role}</p>
            </div>
          </div>

          <div className="flex items-center text-zinc-400">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-md p-1.5 transition-colors hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer">
                  <Settings className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-lg bg-popover border border-border text-popover-foreground" side="top" align="end" sideOffset={8}>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-3 py-2 text-left text-sm border-b border-border">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                      <AvatarFallback className="rounded-lg">{currentUser.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-xs leading-tight">
                      <span className="truncate font-semibold text-foreground">{currentUser.name}</span>
                      <span className="truncate text-muted-foreground text-[10px]">{currentUser.role}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuGroup className="p-1">
                  <DropdownMenuItem className="flex items-center gap-2 px-2 py-1.5 text-xs text-popover-foreground hover:bg-accent hover:text-accent-foreground rounded cursor-pointer transition-colors">
                    <Sparkles className="h-3.5 w-3.5" />
                    Upgrade to Pro
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuGroup className="p-1">
                  <DropdownMenuItem className="flex items-center gap-2 px-2 py-1.5 text-xs text-popover-foreground hover:bg-accent hover:text-accent-foreground rounded cursor-pointer transition-colors">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 px-2 py-1.5 text-xs text-popover-foreground hover:bg-accent hover:text-accent-foreground rounded cursor-pointer transition-colors">
                    <CreditCard className="h-3.5 w-3.5" />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 px-2 py-1.5 text-xs text-popover-foreground hover:bg-accent hover:text-accent-foreground rounded cursor-pointer transition-colors">
                    <Bell className="h-3.5 w-3.5" />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-border" />
                <div className="p-1">
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded cursor-pointer transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Log out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

      </div>

      {isLoggingOut && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 p-6 bg-card border border-border rounded-xl">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <p className="text-sm font-semibold text-foreground">Logging out...</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default Sidebar;
