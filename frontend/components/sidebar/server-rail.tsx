"use client";
/**
 * server-rail.tsx
 * Left 72px icon strip — software modules + project icons + theme/help buttons.
 */
import React, { useState } from "react";
import {
  Kanban,
  DollarSign,
  UserCog,
  Plus,
  Sun,
  Moon,
  HelpCircle,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { SoftwareModule } from "@/app/context";

const EMOJIS = [
  "📁", "🚀", "🔥", "💻", "🎨", "📈", "💡", "🛡️", "🧬", "⚡",
  "🤖", "🌐", "💬", "🎮", "📦", "🎯", "⚙️", "🔑", "📊", "🗺️",
  "🧠", "🧩", "📢", "📌", "🔒", "🧪", "🛠️", "🦖", "🦄", "🌟",
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

export interface DbProject {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

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

interface ServerRailProps {
  activeSoftware: SoftwareModule;
  setActiveSoftware: (sw: SoftwareModule) => void;
  dbProjects: DbProject[];
  pathname: string;
  theme: "light" | "dark";
  toggleTheme: () => void;
  onSoftwareClick: (sw: typeof SOFTWARE_MODULES[0]) => void;
  onProjectClick: (projId: string) => void;
  onCreateProject: (data: { name: string; description: string }) => void;
  isCreatingProject: boolean;
}

export function ServerRail({
  activeSoftware,
  dbProjects,
  pathname,
  theme,
  toggleTheme,
  onSoftwareClick,
  onProjectClick,
  onCreateProject,
  isCreatingProject,
}: ServerRailProps) {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projIcon, setProjIcon] = useState("📁");
  const [projColor, setProjColor] = useState("bg-indigo-600");
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;
    onCreateProject({ name: projName.trim(), description: projDesc.trim() });
    // Reset after submission
    setProjName(""); setProjDesc(""); setProjIcon("📁"); setProjColor("bg-indigo-600");
    setIsNewProjectOpen(false);
  };

  return (
    <div className="flex w-[72px] flex-col items-center gap-2 bg-background py-3 text-foreground border-r border-border">

      <div className="flex flex-col items-center gap-3 w-full px-2">
        {SOFTWARE_MODULES.map((sw) => {
          const isActive = activeSoftware === sw.id;
          return (
            <Tooltip key={sw.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSoftwareClick(sw)}
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

          {/* DB Project icons */}
          <div className="flex flex-1 w-full flex-col items-center gap-4 overflow-y-auto scrollbar-none px-2">
            {dbProjects.map((proj) => {
              const isActive = pathname.startsWith(`/projects/${proj.id}`);
              const isHovered = hoveredProjectId === proj.id;
              const isHighlighted = isActive || isHovered;
              return (
                <Tooltip key={proj.id}>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => onProjectClick(proj.id)}
                      onMouseEnter={() => setHoveredProjectId(proj.id)}
                      onMouseLeave={() => setHoveredProjectId(null)}
                      className={cn(
                        "flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-xs font-bold transition-all duration-200",
                        isActive
                          ? "text-white ring-2 ring-offset-2 ring-offset-background ring-indigo-500"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className={cn(
                        "flex h-full w-full items-center justify-center rounded-xl transition-all duration-200",
                        isHighlighted ? "bg-indigo-600 text-white" : "bg-muted"
                      )}>
                        {proj.name.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover border border-border text-popover-foreground font-semibold font-sans">
                    {proj.name}
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* Add Project */}
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
                    {/* Live Preview */}
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
                      <Input required value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="e.g. Marketing Sprints, SpaceX App" className="bg-background border-border text-foreground focus:border-indigo-600" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-foreground/80">Description</Label>
                      <Textarea value={projDesc} onChange={(e) => setProjDesc(e.target.value)} placeholder="Brief objective of this space..." className="bg-background border-border text-foreground focus:border-indigo-600 h-16 resize-none" />
                    </div>
                    {/* Emoji Grid */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-normal text-foreground/80">Choose Icon / Emoji</Label>
                        <Input type="text" maxLength={2} placeholder="Custom" value={EMOJIS.includes(projIcon) ? "" : projIcon} onChange={(e) => setProjIcon(e.target.value || "📁")} className="w-20 h-7 text-xs text-center bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus:border-indigo-600" />
                      </div>
                      <div className="grid grid-cols-6 gap-2 max-h-[110px] overflow-y-auto p-2 bg-background rounded-lg border border-border">
                        {EMOJIS.map((emoji) => (
                          <button key={emoji} type="button" onClick={() => setProjIcon(emoji)} className={cn("h-9 w-9 text-xl flex items-center justify-center rounded-lg hover:bg-muted transition-all cursor-pointer", projIcon === emoji && "bg-indigo-600/30 border border-indigo-500 scale-105")}>
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Color Palette */}
                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-foreground/80">Theme Color</Label>
                      <div className="flex flex-wrap items-center gap-2 bg-background p-2.5 rounded-lg border border-border">
                        {PRESET_COLORS.map((color) => (
                          <button key={color.value} type="button" onClick={() => setProjColor(color.value)} className={cn("h-7 w-7 rounded-full border border-black/40 relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110 shrink-0", color.value)}>
                            {projColor === color.value && (<div className="h-2.5 w-2.5 rounded-full bg-white" />)}
                          </button>
                        ))}
                        <div className="relative flex items-center gap-2 ml-auto border-l border-border pl-3 shrink-0">
                          <span className="text-[10px] text-muted-foreground font-medium">Custom</span>
                          <input type="color" value={projColor.startsWith("bg-") ? "#6366f1" : projColor} onChange={(e) => setProjColor(e.target.value)} className="h-7 w-7 rounded-full cursor-pointer bg-transparent border border-border outline-none overflow-hidden p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full" />
                          {!projColor.startsWith("bg-") && (
                            <div className="absolute bottom-[-2px] right-[-2px] h-3.5 w-3.5 rounded-full bg-indigo-500 border border-background flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="p-4 border-t border-border bg-card shrink-0">
                    <Button type="button" variant="ghost" onClick={() => setIsNewProjectOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">Cancel</Button>
                    <Button type="submit" disabled={isCreatingProject} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer">
                      {isCreatingProject ? "Creating..." : "Create Space"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </>
      )}

      {/* Bottom: theme + help */}
      <div className="mt-auto flex flex-col items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={toggleTheme} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-foreground">
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
  );
}
