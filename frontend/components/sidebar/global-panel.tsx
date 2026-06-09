"use client";
/**
 * global-panel.tsx
 * Right 240px panel shown when user is in global/app-level navigation.
 * Shows: Global nav, General Chats, Direct Messages.
 */
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Hash,
  LayoutDashboard,
  ClipboardList,
  FolderOpen,
  Kanban,
  Clock,
  Users,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "idle" | "offline";
}

interface GlobalPanelProps {
  teamMembers: TeamMember[];
  activeChannelId: string | null;
  activeChannelType: "global" | "project" | "dm";
  isGlobalActive: boolean;
  onSetActiveChannel: (id: string, type: "global" | "project" | "dm") => void;
}

const GLOBAL_CHANNELS = [
  { id: "gch-announcements", label: "announcements" },
  { id: "gch-random", label: "random" },
];

const GLOBAL_NAV_ITEMS = [
  { href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4 shrink-0" />, label: "Dashboard" },
  { href: "/updates", icon: <ClipboardList className="h-4 w-4 shrink-0" />, label: "Daily Updates" },
  { href: "/files", icon: <FolderOpen className="h-4 w-4 shrink-0" />, label: "Files Manager" },
  { href: "/projects", icon: <Kanban className="h-4 w-4 shrink-0" />, label: "Projects Manager" },
  { href: "/attendance", icon: <Clock className="h-4 w-4 shrink-0" />, label: "Attendance Clock" },
];

const ADMIN_NAV_ITEMS = [
  { href: "/users", icon: <Users className="h-4 w-4 shrink-0" />, label: "Users" },
  { href: "/roles", icon: <ShieldCheck className="h-4 w-4 shrink-0" />, label: "Roles" },
];

export function GlobalPanel({
  teamMembers,
  activeChannelId,
  activeChannelType,
  isGlobalActive,
  onSetActiveChannel,
}: GlobalPanelProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">

      <div className="space-y-0.5 mt-4">
        <p className="px-2 text-[10px] font-bold text-zinc-500 mb-2">Global Actions</p>
        {GLOBAL_NAV_ITEMS.map((item) => {
          const isActive = item.href === "/projects"
            ? pathname.startsWith("/projects")
            : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-sm font-medium transition-all hover:bg-muted/60 hover:text-foreground",
                isActive
                  ? "bg-muted/60 text-foreground before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-full before:bg-indigo-500"
                  : "text-muted-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>

      {isGlobalActive && (
        <div className="space-y-0.5 pt-3 border-t border-border/60">
          <p className="px-2 text-[10px] font-bold text-zinc-500 mb-2">People &amp; Access</p>
          {ADMIN_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-sm font-medium transition-all hover:bg-muted/60 hover:text-foreground",
                pathname === item.href
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

      {isGlobalActive && (
        <div className="space-y-4 pt-2">
          <div className="space-y-0.5">
            <p className="px-2 text-[10px] font-bold text-zinc-500 mb-2">General Chats</p>
            {GLOBAL_CHANNELS.map((ch) => {
              const isActive = pathname === "/chat" && activeChannelId === ch.id && activeChannelType === "global";
              return (
                <button
                  key={ch.id}
                  onClick={() => { onSetActiveChannel(ch.id, "global"); router.push("/chat"); }}
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
                  onClick={() => { onSetActiveChannel(member.id, "dm"); router.push("/chat"); }}
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
  );
}
