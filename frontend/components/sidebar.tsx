"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useWorkspace } from "@/app/context";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Hash,
  Plus,
  Search,
  Bell,
  LayoutDashboard,
  Kanban,
  ClipboardList,
  Clock,
  Settings,
  HelpCircle,
  Check,
  X,
  BadgeCheck,
  CreditCard,
  LogOut,
  Sparkles,
  Sun,
  Moon,
  Users,
  ShieldCheck,
  DollarSign,
  UserCog,
  FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "./ui/badge";

const EMOJIS = [
  "📁", "🚀", "🔥", "💻", "🎨", "📈", "💡", "🛡️", "🧬", "⚡",
  "🤖", "🌐", "💬", "🎮", "📦", "🎯", "⚙️", "🔑", "📊", "🗺️",
  "🧠", "🧩", "📢", "📌", "🔒", "🧪", "🛠️", "🦖", "🦄", "🌟"
];

const PRESET_COLORS = [
  { name: "Indigo", value: "bg-indigo-600" },
  { name: "Emerald", value: "bg-emerald-600" },
  { name: "Rose", value: "bg-rose-600" },
  { name: "Amber", value: "bg-amber-600" },
  { name: "Purple", value: "bg-purple-600" },
  { name: "Sky", value: "bg-sky-600" },
  { name: "Orange", value: "bg-orange-600" },
  { name: "Teal", value: "bg-teal-600" },
  { name: "Crimson", value: "bg-red-600" },
  { name: "Cyan", value: "bg-cyan-600" },
];

const SOFTWARE_MODULES = [
  {
    id: "pm" as const,
    label: "Project Management",
    icon: <Kanban className="h-5 w-5" />,
    activeClass: "bg-indigo-600 text-white ring-2 ring-indigo-500 ring-offset-2 ring-offset-background",
    inactiveClass: "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20",
    route: "/dashboard",
  },
  {
    id: "finance" as const,
    label: "Finance Suite",
    icon: <DollarSign className="h-5 w-5" />,
    activeClass: "bg-emerald-600 text-white ring-2 ring-emerald-500 ring-offset-2 ring-offset-background",
    inactiveClass: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
    route: "/finance",
  },
  {
    id: "hr" as const,
    label: "HR Management",
    icon: <UserCog className="h-5 w-5" />,
    activeClass: "bg-violet-600 text-white ring-2 ring-violet-500 ring-offset-2 ring-offset-background",
    inactiveClass: "bg-violet-500/10 text-violet-500 hover:bg-violet-500/20",
    route: "/hr",
  },
];

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const {
    projects,
    activeProjectId,
    activeProject,
    setActiveProjectId,
    activeChannelId,
    activeChannelType,
    setActiveChannel,
    activeVoiceChannelId,
    setActiveVoiceChannelId,
    teamMembers,
    currentUser,
    addProject,
    addChannel,
    activeSoftware,
    setActiveSoftware,
  } = useWorkspace();

  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projIcon, setProjIcon] = useState("📁");
  const [projColor, setProjColor] = useState("bg-indigo-600");
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || (document.documentElement.classList.contains("dark") ? "dark" : "light");
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
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

  const [isNewChannelOpen, setIsNewChannelOpen] = useState(false);
  const [chanName, setChanName] = useState("");
  const [chanType, setChanType] = useState<"text" | "voice">("text");
  const [isGroupCreation, setIsGroupCreation] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const handleCreateProject = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;
    addProject(projName, projDesc, projIcon, projColor);
    setProjName("");
    setProjDesc("");
    setProjIcon("📁");
    setProjColor("bg-indigo-600");
    setIsNewProjectOpen(false);
  }, [projName, projDesc, projIcon, projColor, addProject]);

  const handleCreateChannel = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!chanName.trim() || !activeProjectId) return;
    addChannel(activeProjectId, chanName, "text", isGroupCreation ? selectedMembers : undefined);
    setChanName("");
    setIsNewChannelOpen(false);
    setSelectedMembers([]);
  }, [chanName, activeProjectId, isGroupCreation, selectedMembers, addChannel]);

  const selectProject = useCallback((projId: string | null) => {
    setActiveProjectId(projId);
    if (projId) {
      const proj = projects.find((p) => p.id === projId);
      if (proj && proj.channels.length > 0) {
        const firstText = proj.channels.find((c) => c.type === "text");
        if (firstText) {
          setActiveChannel(firstText.id, "project");
        }
      }
      router.push(`/projects/${projId}/board`);
    } else {
      router.push("/dashboard");
    }
  }, [setActiveProjectId, projects, setActiveChannel, router]);

  const isGlobalActive = useMemo(() => {
    return pathname === "/dashboard" || pathname === "/updates" || pathname === "/attendance" || pathname === "/chat" || pathname === "/users" || pathname === "/roles" || pathname === "/finance" || pathname === "/hr";
  }, [pathname]);

  const textChannels = useMemo(() => {
    if (!activeProject?.channels) return [];
    return activeProject.channels.filter(
      (c) => c.type === "text" && (!c.assignedMemberIds || c.assignedMemberIds.length === 0)
    );
  }, [activeProject?.channels]);

  const chatGroups = useMemo(() => {
    if (!activeProject?.channels) return [];
    return activeProject.channels.filter(
      (c) => c.type === "text" && c.assignedMemberIds && c.assignedMemberIds.length > 0
    );
  }, [activeProject?.channels]);

  return (
    <div className="flex h-screen select-none text-muted-foreground font-sans shrink-0">

      <div className="flex w-[72px] flex-col items-center gap-2 bg-background py-3 text-foreground border-r border-border">

        <div className="flex flex-col items-center gap-3 w-full px-2">
          {SOFTWARE_MODULES.map((sw) => {
            const isActive = activeSoftware === sw.id;
            return (
              <Tooltip key={sw.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      setActiveSoftware(sw.id);
                      if (sw.id !== "pm") {
                        router.push(sw.route);
                      } else {
                        selectProject(null);
                      }
                    }}
                    className={cn(
                      "flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-all duration-200",
                      isActive ? sw.activeClass : sw.inactiveClass
                    )}
                  >
                    {sw.icon}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-popover border border-border text-popover-foreground font-semibold font-sans text-xs">
                  {sw.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {activeSoftware === "pm" && (
          <>
            <div className="h-[2px] w-8 rounded bg-border my-2" />

            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={() => selectProject(null)}
                  className={cn(
                    "flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-all duration-200 bg-muted hover:bg-indigo-600 hover:text-white",
                    isGlobalActive && "bg-indigo-600 ring-2 ring-indigo-500 ring-offset-2 ring-offset-background"
                  )}
                >
                  <img
                    src="https://klixsoft.com/images/logo.svg"
                    alt="Klixsoft Logo"
                    className="h-6 w-6"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover border border-border text-popover-foreground font-semibold font-sans">
                Global Portal Dashboard
              </TooltipContent>
            </Tooltip>

            <div className="h-[2px] w-8 rounded bg-border my-2" />

            <div className="flex flex-1 w-full flex-col items-center gap-4 overflow-y-auto scrollbar-none px-2">
              {projects.map((proj) => {
                const isActive = !isGlobalActive && activeProjectId === proj.id;
                const isCustomColor = !proj.color.startsWith("bg-");
                const isHovered = hoveredProjectId === proj.id;
                const isHighlighted = isActive || isHovered;
                return (
                  <Tooltip key={proj.id}>
                    <TooltipTrigger asChild>
                      <div
                        onClick={() => selectProject(proj.id)}
                        onMouseEnter={() => setHoveredProjectId(proj.id)}
                        onMouseLeave={() => setHoveredProjectId(null)}
                        className={cn(
                          "flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-base font-bold transition-all duration-200",
                          isActive
                            ? "text-white ring-2 ring-offset-2 ring-offset-background ring-indigo-500"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-full w-full items-center justify-center rounded-xl transition-all duration-200",
                            isHighlighted
                              ? (isCustomColor ? "" : proj.color)
                              : "bg-muted"
                          )}
                          style={isHighlighted && isCustomColor ? { backgroundColor: proj.color } : undefined}
                        >
                          {proj.icon}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-popover border border-border text-popover-foreground font-semibold font-sans">
                      {proj.name}
                    </TooltipContent>
                  </Tooltip>
                );
              })}

              {/* Add Project button */}
              <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
                <DialogTrigger asChild>
                  <button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-muted text-muted-foreground transition-all duration-200 hover:bg-green-600 hover:text-white">
                    <Plus className="h-5 w-5" />
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[440px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                  <DialogHeader className="p-4 border-b border-border/60 shrink-0">
                    <DialogTitle className="text-xl font-bold tracking-tight">Create a Project Space</DialogTitle>
                    <DialogDescription className="text-muted-foreground text-xs">
                      Setup a dedicated collaborative space for your project board and communication channels.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleCreateProject} className="flex flex-col flex-1 gap-0 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
                      {/* Dynamic Live Avatar Preview */}
                      <div className="flex items-center gap-4 bg-background/40 p-4 rounded-xl border border-border/60 mb-2 mt-2">
                        <div
                          className={cn(
                            "flex h-16 w-16 items-center justify-center rounded-2xl text-3xl transition-all border border-border/50 shrink-0",
                            projColor.startsWith("bg-") ? projColor : ""
                          )}
                          style={!projColor.startsWith("bg-") ? { backgroundColor: projColor } : undefined}
                        >
                          {projIcon || "📁"}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="text-[10px] text-muted-foreground/60 font-bold">Space Avatar Preview</div>
                          <div className="text-base font-semibold text-foreground truncate">{projName || "New Project Space"}</div>
                          <div className="text-xs text-muted-foreground truncate">{projDesc || "No description yet..."}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-normal text-foreground/80">Project Name</Label>
                        <Input
                          required
                          value={projName}
                          onChange={(e) => setProjName(e.target.value)}
                          placeholder="e.g. Marketing Sprints, SpaceX App"
                          className="bg-background border-border text-foreground focus:border-indigo-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-normal text-foreground/80">Description</Label>
                        <Textarea
                          value={projDesc}
                          onChange={(e) => setProjDesc(e.target.value)}
                          placeholder="Brief objective of this space..."
                          className="bg-background border-border text-foreground focus:border-indigo-600 h-16 resize-none"
                        />
                      </div>

                      {/* Emoji Grid Selector with Custom input */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs font-normal text-foreground/80">Choose Icon / Emoji</Label>
                          <Input
                            type="text"
                            maxLength={2}
                            placeholder="Custom"
                            value={EMOJIS.includes(projIcon) ? "" : projIcon}
                            onChange={(e) => setProjIcon(e.target.value || "📁")}
                            className="w-20 h-7 text-xs text-center bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus:border-indigo-600"
                          />
                        </div>
                        <div className="grid grid-cols-6 gap-2 max-h-[110px] overflow-y-auto p-2 bg-background rounded-lg border border-border">
                          {EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setProjIcon(emoji)}
                              className={cn(
                                "h-9 w-9 text-xl flex items-center justify-center rounded-lg hover:bg-muted transition-all cursor-pointer",
                                projIcon === emoji && "bg-indigo-600/30 border border-indigo-500 scale-105"
                              )}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color Palette + HTML5 Color Picker */}
                      <div className="space-y-2">
                        <Label className="text-xs font-normal text-foreground/80">Theme Color</Label>
                        <div className="flex flex-wrap items-center gap-2 bg-background p-2.5 rounded-lg border border-border">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => setProjColor(color.value)}
                              className={cn(
                                "h-7 w-7 rounded-full border border-black/40 relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110 shrink-0",
                                color.value
                              )}
                            >
                              {projColor === color.value && (
                                <div className="h-2.5 w-2.5 rounded-full bg-white" />
                              )}
                            </button>
                          ))}

                          {/* Custom Color Selector */}
                          <div className="relative flex items-center gap-2 ml-auto border-l border-border pl-3 shrink-0">
                            <span className="text-[10px] text-muted-foreground font-medium">Custom</span>
                            <input
                              type="color"
                              value={projColor.startsWith("bg-") ? "#6366f1" : projColor}
                              onChange={(e) => setProjColor(e.target.value)}
                              className="h-7 w-7 rounded-full cursor-pointer bg-transparent border border-border outline-none overflow-hidden p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-full"
                            />
                            {!projColor.startsWith("bg-") && (
                              <div
                                className="absolute bottom-[-2px] right-[-2px] h-3.5 w-3.5 rounded-full bg-indigo-500 border border-background flex items-center justify-center"
                              >
                                <Check className="h-2.5 w-2.5 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="p-4 border-t border-border bg-card shrink-0">
                      <Button type="button" variant="ghost" onClick={() => setIsNewProjectOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer">
                        Create Space
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </>
        )}

        <div className="mt-auto flex flex-col items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-foreground"
              >
                {theme === "dark" ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-400" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover border border-border text-popover-foreground font-semibold font-sans">
              Switch to {theme === "dark" ? "Light" : "Dark"} Mode
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-foreground">
                <HelpCircle className="h-5 w-5" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover border border-border text-popover-foreground font-semibold font-sans">
              Help &amp; Resources
            </TooltipContent>
          </Tooltip>
        </div>

      </div>

      <div className="flex w-60 flex-col bg-sidebar border-r border-border">

        <div className="flex h-12 items-center justify-between border-b border-border px-4 font-semibold text-foreground ">
          <span className="truncate">{activeProject && !isGlobalActive ? activeProject.name : "Klixsoft Workspace"}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">

          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Quick Search (⌘K)"
              className="w-full rounded bg-background border border-border py-1.5 pl-8 pr-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-600/50"
            />
          </div>

          <div className="space-y-0.5 mt-4">
            <p className="px-2 text-[10px] font-bold text-zinc-500 mb-2">Global Actions</p>

            {[
              { href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4 shrink-0" />, label: "Dashboard", active: pathname === "/dashboard" },
              { href: "/updates", icon: <ClipboardList className="h-4 w-4 shrink-0" />, label: "Daily Updates", active: pathname === "/updates" },
              { href: "/files", icon: <FolderOpen className="h-4 w-4 shrink-0" />, label: "Files Manager", active: pathname === "/files" },
              { href: "/projects", icon: <Kanban className="h-4 w-4 shrink-0" />, label: "Projects Manager", active: pathname.startsWith("/projects") },
              ...(!(activeProject && !isGlobalActive) ? [{ href: "/attendance", icon: <Clock className="h-4 w-4 shrink-0" />, label: "Attendance Clock", active: pathname === "/attendance" }] : []),
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-sm font-medium transition-all hover:bg-muted/60 hover:text-foreground",
                  item.active
                    ? "bg-muted/60 text-foreground before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-full before:bg-indigo-500"
                    : "text-muted-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>

          {isGlobalActive && (
            <div className="space-y-0.5 pt-3 border-t border-border/60">
              <p className="px-2 text-[10px] font-bold text-zinc-500 mb-2">People &amp; Access</p>

              {[
                { href: "/users", icon: <Users className="h-4 w-4 shrink-0" />, label: "Users", active: pathname === "/users" },
                { href: "/roles", icon: <ShieldCheck className="h-4 w-4 shrink-0" />, label: "Roles", active: pathname === "/roles" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-sm font-medium transition-all hover:bg-muted/60 hover:text-foreground",
                    item.active
                      ? "bg-muted/60 text-foreground before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-full before:bg-indigo-500"
                      : "text-muted-foreground"
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {activeProject && !isGlobalActive && (
            <div className="space-y-0.5 pt-3 border-t border-border/60">
              <p className="px-2 text-[10px] font-bold text-zinc-500 mb-2">Project Board</p>

              <Link
                href={`/projects/${activeProject.id}/board`}
                className={cn(
                  "relative flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-sm font-medium transition-all hover:bg-muted/60 hover:text-foreground",
                  pathname.endsWith("/board")
                    ? "bg-muted/60 text-foreground before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-full before:bg-indigo-500"
                    : "text-muted-foreground"
                )}
              >
                <Kanban className="h-4 w-4 shrink-0" />
                Kanban Board
              </Link>
            </div>
          )}

          {/* ── Project Channels ── */}
          {activeProject && !isGlobalActive && (
            <div className="space-y-4 pt-2">

              <div className="space-y-0.5">
                <div className="flex items-center justify-between px-2 text-[10px] font-bold text-zinc-500 mb-2">
                  <span>Text Channels</span>
                  <Plus
                    className="h-3.5 w-3.5 cursor-pointer text-zinc-400 transition-colors hover:text-zinc-100"
                    onClick={() => { setIsGroupCreation(false); setSelectedMembers([]); setIsNewChannelOpen(true); }}
                  />
                </div>

                {textChannels.map((channel) => {
                  const isSelected = pathname.endsWith("/chat") && activeChannelId === channel.id;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => { setActiveChannel(channel.id, "project"); router.push(`/projects/${activeProject.id}/chat`); }}
                      className={cn(
                        "relative flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-sm transition-all hover:bg-muted/60 hover:text-foreground",
                        isSelected
                          ? "bg-muted/60 text-foreground before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-full before:bg-indigo-500"
                          : "text-muted-foreground"
                      )}
                    >
                      <Hash className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                      <span className="truncate">{channel.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-0.5 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between px-2 text-[10px] font-bold text-zinc-500 mb-2">
                  <span>Chat Groups</span>
                  <Plus
                    className="h-3.5 w-3.5 cursor-pointer text-zinc-400 transition-colors hover:text-zinc-100"
                    onClick={() => { setIsGroupCreation(true); setSelectedMembers([]); setIsNewChannelOpen(true); }}
                  />
                </div>

                {chatGroups.map((channel) => {
                  const isSelected = pathname.endsWith("/chat") && activeChannelId === channel.id;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => { setActiveChannel(channel.id, "project"); router.push(`/projects/${activeProject.id}/chat`); }}
                      className={cn(
                        "relative flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-sm transition-all hover:bg-muted/60 hover:text-foreground",
                        isSelected
                          ? "bg-muted/60 text-foreground before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-full before:bg-indigo-500"
                          : "text-muted-foreground"
                      )}
                    >
                      <Hash className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                      <span className="truncate flex-1 text-left">{channel.name}</span>
                      <span className="rounded bg-indigo-600/30 text-indigo-400 px-1.5 py-0.5 text-[8px] uppercase font-bold shrink-0">Group</span>
                    </button>
                  );
                })}
              </div>

              <Dialog open={isNewChannelOpen} onOpenChange={setIsNewChannelOpen}>
                <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[400px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                  <DialogHeader className="p-4 border-b border-border/60 shrink-0">
                    <DialogTitle className="text-lg font-bold">
                      {isGroupCreation ? "Create Chat Group" : "Create Text Channel"}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-xs">
                      {isGroupCreation
                        ? `Create a private discussion group inside the ${activeProject.name} workspace.`
                        : `Create a text discussion channel inside the ${activeProject.name} workspace.`}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateChannel} className="flex flex-col flex-1 gap-0 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
                      <div className="space-y-2 text-left">
                        <Label className="text-xs font-normal text-foreground/80">
                          {isGroupCreation ? "Group Name" : "Channel Name"}
                        </Label>
                        <Input
                          required
                          value={chanName}
                          onChange={(e) => setChanName(e.target.value)}
                          placeholder={isGroupCreation ? "e.g. core-team, frontend-sync" : "e.g. mock-feedback, standup-room"}
                          className="bg-background border-border text-foreground focus:border-indigo-600"
                        />
                      </div>

                      {isGroupCreation && (
                        <div className="space-y-2 pt-2 text-left">
                          <Label className="text-xs font-normal text-foreground/80">Select Members</Label>
                          <div className="space-y-1.5 max-h-[160px] overflow-y-auto bg-background p-2.5 rounded-lg border border-border scrollbar-thin scrollbar-thumb-zinc-800">
                            {teamMembers.map((member) => (
                              <label key={member.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-muted cursor-pointer select-none">
                                <Checkbox
                                  checked={selectedMembers.includes(member.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedMembers([...selectedMembers, member.id]);
                                    } else {
                                      setSelectedMembers(selectedMembers.filter((id) => id !== member.id));
                                    }
                                  }}
                                />
                                <Avatar className="h-5 w-5 shrink-0">
                                  <AvatarImage src={member.avatar} />
                                  <AvatarFallback className="text-[9px]">{member.name.slice(0, 2)}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-foreground/80 font-medium truncate">{member.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter className="p-4 border-t border-border bg-card shrink-0">
                      <Button type="button" variant="ghost" onClick={() => setIsNewChannelOpen(false)} className="text-muted-foreground hover:text-foreground">Cancel</Button>
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Create</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

            </div>
          )}

          {/* ── Global Chat Channels ── */}
          {isGlobalActive && (
            <div className="space-y-4 pt-2">
              <div className="space-y-0.5">
                <p className="px-2 text-[10px] font-bold text-zinc-500 mb-2">General Chats</p>

                {[
                  { id: "gch-announcements", label: "announcements" },
                  { id: "gch-random", label: "random" },
                ].map((ch) => {
                  const isActive = pathname === "/chat" && activeChannelId === ch.id && activeChannelType === "global";
                  return (
                    <button
                      key={ch.id}
                      onClick={() => { setActiveChannel(ch.id, "global"); router.push("/chat"); }}
                      className={cn(
                        "relative flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-sm transition-all hover:bg-muted/60 hover:text-foreground",
                        isActive
                          ? "bg-muted/60 text-foreground before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-full before:bg-indigo-500"
                          : "text-muted-foreground"
                      )}
                    >
                      <Hash className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                      {ch.label}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-0.5">
                <p className="px-2 text-[10px] font-bold text-zinc-500 mb-2">Direct Messages</p>
                {teamMembers.map((member) => {
                  const isActive = pathname === "/chat" && activeChannelId === member.id && activeChannelType === "dm";
                  return (
                    <button
                      key={member.id}
                      onClick={() => { setActiveChannel(member.id, "dm"); router.push("/chat"); }}
                      className={cn(
                        "relative flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-sm transition-all hover:bg-muted/60 hover:text-foreground",
                        isActive
                          ? "bg-muted/60 text-foreground before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-full before:bg-indigo-500"
                          : "text-muted-foreground"
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-[10px]">{member.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background",
                          member.status === "online" && "bg-green-500",
                          member.status === "idle" && "bg-amber-500",
                          member.status === "offline" && "bg-muted-foreground/60"
                        )} />
                      </div>
                      <span className="truncate">{member.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>



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
              <DropdownMenuContent
                className="w-56 rounded-lg bg-popover border border-border text-popover-foreground"
                side="top"
                align="end"
                sideOffset={8}
              >
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
          <div className="flex flex-col items-center gap-3 p-6 bg-card border border-border rounded-xl shadow-xl">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <p className="text-sm font-semibold text-foreground">Logging out...</p>
          </div>
        </div>
      )}

    </div>
  );
};
export default Sidebar;
