"use client";

/**
 * project-panel.tsx
 * Right 240px panel shown when user is inside a project.
 * Shows: Project Board nav + Text Channels + Chat Groups (for ALL project types)
 */
import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Hash, Plus, LayoutDashboard, Kanban } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import type { Channel } from "@/app/context";

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "idle" | "offline";
}

interface ProjectPanelProps {
  projectId: string;
  projectName: string;
  channels: Channel[];
  teamMembers: TeamMember[];
  onAddChannel: (projectId: string, name: string, type: "text" | "voice", assignedMemberIds?: string[]) => void;
  onSetActiveChannel: (id: string, type: "global" | "project" | "dm") => void;
}

export function ProjectPanel({
  projectId,
  projectName,
  channels,
  teamMembers,
  onAddChannel,
  onSetActiveChannel,
}: ProjectPanelProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isNewChannelOpen, setIsNewChannelOpen] = useState(false);
  const [chanName, setChanName] = useState("");
  const [isGroupCreation, setIsGroupCreation] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const textChannels = useMemo(
    () => channels.filter((c) => c.type === "text" && (!c.assignedMemberIds || c.assignedMemberIds.length === 0)),
    [channels]
  );

  const chatGroups = useMemo(
    () => channels.filter((c) => c.type === "text" && c.assignedMemberIds && c.assignedMemberIds.length > 0),
    [channels]
  );

  const handleCreateChannel = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!chanName.trim()) return;
      onAddChannel(projectId, chanName, "text", isGroupCreation ? selectedMembers : undefined);
      setChanName("");
      setIsNewChannelOpen(false);
      setSelectedMembers([]);
    },
    [chanName, projectId, isGroupCreation, selectedMembers, onAddChannel]
  );

  const navItems = [
    {
      href: `/projects/${projectId}`,
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
      label: "Project Dashboard",
      active: pathname === `/projects/${projectId}`,
    },
    {
      href: `/projects/${projectId}/kanban`,
      icon: <Kanban className="h-4 w-4 shrink-0" />,
      label: "Kanban Board",
      active: pathname === `/projects/${projectId}/kanban`,
    },
  ];

  const handleChannelClick = (channelId: string) => {
    onSetActiveChannel(channelId, "project");
    router.push(`/projects/${projectId}/chat/${channelId}`);
  };

  return (
    <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">

      {/* Board Nav */}
      <div className="space-y-0.5">
        <p className="px-2 text-[10px] font-bold text-zinc-500 mb-2">Project Board</p>
        {navItems.map((item) => (
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

      {/* Text Channels */}
      <div className="space-y-0.5 pt-2 border-t border-border/40">
        <div className="flex items-center justify-between px-2 text-[10px] font-bold text-zinc-500 mb-2">
          <span>Text Channels</span>
          <Plus
            className="h-3.5 w-3.5 cursor-pointer text-zinc-400 transition-colors hover:text-zinc-100"
            onClick={() => { setIsGroupCreation(false); setSelectedMembers([]); setIsNewChannelOpen(true); }}
          />
        </div>

        {textChannels.length === 0 && (
          <p className="px-2.5 text-[11px] text-muted-foreground/50 italic">No channels yet</p>
        )}

        {textChannels.map((channel) => {
          const isSelected = pathname === `/projects/${projectId}/chat/${channel.id}`;
          return (
            <button
              key={channel.id}
              onClick={() => handleChannelClick(channel.id)}
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

      {/* Chat Groups */}
      <div className="space-y-0.5 pt-2 border-t border-border/40">
        <div className="flex items-center justify-between px-2 text-[10px] font-bold text-zinc-500 mb-2">
          <span>Chat Groups</span>
          <Plus
            className="h-3.5 w-3.5 cursor-pointer text-zinc-400 transition-colors hover:text-zinc-100"
            onClick={() => { setIsGroupCreation(true); setSelectedMembers([]); setIsNewChannelOpen(true); }}
          />
        </div>

        {chatGroups.length === 0 && (
          <p className="px-2.5 text-[11px] text-muted-foreground/50 italic">No groups yet</p>
        )}

        {chatGroups.map((channel) => {
          const isSelected = pathname === `/projects/${projectId}/chat/${channel.id}`;
          return (
            <button
              key={channel.id}
              onClick={() => handleChannelClick(channel.id)}
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

      {/* Create Channel / Group Dialog */}
      <Dialog open={isNewChannelOpen} onOpenChange={setIsNewChannelOpen}>
        <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[400px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border/60 shrink-0">
            <DialogTitle className="text-lg font-bold">
              {isGroupCreation ? "Create Chat Group" : "Create Text Channel"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              {isGroupCreation
                ? `Create a private discussion group inside the ${projectName} workspace.`
                : `Create a text discussion channel inside the ${projectName} workspace.`}
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
  );
}
