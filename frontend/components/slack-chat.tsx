"use client";

import React, { useState, useEffect, useRef } from "react";
import { useWorkspace, Message } from "@/app/context";
import {
  Hash,
  Send,
  PlusCircle,
  Paperclip,
  Bold,
  Italic,
  Code,
  Users,
  UserPlus,
  Pin,
  X,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const SlackChat: React.FC = () => {
  const {
    activeProject,
    activeProjectId,
    globalChannels,
    directMessages,
    teamMembers,
    currentUser,
    activeChannelId,
    activeChannelType,
    sendMessage,
    reactToMessage,
    updateChannelMembers,
  } = useWorkspace();

  const [messageText, setMessageText] = useState("");
  const [showMembersList, setShowMembersList] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; url: string } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  let activeChannelName = "";
  let activeChannelTopic = "";
  let activeChannelMessages: Message[] = [];
  let isPrivateGroup = false;
  let currentGroupMemberIds: string[] = [];

  if (activeChannelType === "global") {
    const ch = globalChannels.find((c) => c.id === activeChannelId);
    activeChannelName = ch ? ch.name : "";
    activeChannelTopic = ch?.id === "gch-announcements" ? "Company-wide official announcements" : "Casual watercooler chats";
    activeChannelMessages = ch ? ch.messages : [];
  } else if (activeChannelType === "project" && activeProject) {
    const ch = activeProject.channels.find((c) => c.id === activeChannelId);
    activeChannelName = ch ? ch.name : "";
    activeChannelTopic = `Project: ${activeProject.name} • discussion room`;
    activeChannelMessages = ch ? ch.messages : [];

    if (ch && ch.assignedMemberIds) {
      isPrivateGroup = true;
      currentGroupMemberIds = ch.assignedMemberIds;
    }
  } else if (activeChannelType === "dm") {
    const member = teamMembers.find((m) => m.id === activeChannelId);
    activeChannelName = member ? member.name : "Direct Message";
    activeChannelTopic = member ? `Direct message conversation with ${member.name} (${member.role})` : "";
    activeChannelMessages = activeChannelId ? (directMessages[activeChannelId] || []) : [];
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChannelMessages]);

  useEffect(() => {
    if (messageText.length > 0 && !isTyping) {
      setIsTyping(true);
      const onlineMembers = teamMembers.filter((m) => m.status === "online" && m.id !== activeChannelId);
      if (onlineMembers.length > 0) {
        const typist = onlineMembers[Math.floor(Math.random() * onlineMembers.length)];
        setTypingUser(typist.name);
      }
    } else if (messageText.length === 0) {
      setIsTyping(false);
      setTypingUser(null);
    }
  }, [messageText, activeChannelId, teamMembers, isTyping]);

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !attachedFile) return;

    sendMessage(messageText, attachedFile || undefined);
    setMessageText("");
    setAttachedFile(null);
    setIsTyping(false);
    setTypingUser(null);
  };

  const insertTextFormatting = (type: "bold" | "italic" | "code") => {
    let tag = "";
    if (type === "bold") tag = "**";
    if (type === "italic") tag = "*";
    if (type === "code") tag = "`";

    setMessageText((prev) => `${prev}${tag}text${tag}`);
  };

  const handleMockAttachFile = () => {
    const mockFiles = [
      { name: "wireframe-spec.pdf", type: "pdf", url: "#" },
      { name: "klixsoft-logo.svg", type: "image", url: "https://klixsoft.com/images/logo.svg" },
      { name: "test-coverage.json", type: "code", url: "#" },
    ];
    const pickedFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setAttachedFile(pickedFile);
  };

  const handleOpenAssignDialog = () => {
    setSelectedMemberIds(currentGroupMemberIds);
    setIsAssignOpen(true);
  };

  const handleSaveGroupMembers = () => {
    if (!activeProjectId || !activeChannelId) return;
    updateChannelMembers(activeProjectId, activeChannelId, selectedMemberIds);
    setIsAssignOpen(false);
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const getSidebarMembers = () => {
    if (activeChannelType === "dm") {
      const dmPartner = teamMembers.find((m) => m.id === activeChannelId);
      return dmPartner ? [dmPartner] : [];
    }

    if (isPrivateGroup) {
      return [
        currentUser,
        ...teamMembers.filter((m) => currentGroupMemberIds.includes(m.id)),
      ];
    }

    return [currentUser, ...teamMembers];
  };

  const sidebarMembers = getSidebarMembers();
  const onlineMembers = sidebarMembers.filter((m) => m.status === "online");
  const idleMembers = sidebarMembers.filter((m) => m.status === "idle");
  const offlineMembers = sidebarMembers.filter((m) => m.status === "offline");

  const formatMsgTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  const isMessageReply = (msg: Message) => {
    return msg.id.startsWith("msg-reply");
  };

  return (
    <div className="flex-1 flex h-screen bg-background text-foreground overflow-hidden font-sans">

      <div className="flex-1 flex flex-col h-full bg-background border-r border-border">

        <div className="h-12 border-b border-border px-4 flex items-center justify-between shrink-0 bg-card/20">
          <div className="flex items-center gap-1.5 truncate">
            {activeChannelType === "dm" ? (
              <span className="text-muted-foreground font-bold">@</span>
            ) : (
              <Hash className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
            )}
            <span className="font-bold text-foreground truncate text-sm ">{activeChannelName}</span>
            {activeChannelTopic && (
              <>
                <span className="text-border mx-2">|</span>
                <span className="text-xs text-muted-foreground truncate max-w-sm font-medium">{activeChannelTopic}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-muted-foreground">
            {isPrivateGroup && (
              <Button
                variant="ghost"
                onClick={handleOpenAssignDialog}
                className="flex items-center gap-1 h-7 text-xs text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 hover:text-indigo-300 font-bold leading-none py-1 px-2.5 rounded"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Group Members ({currentGroupMemberIds.length})
              </Button>
            )}

            <button className="rounded p-1 transition-colors hover:bg-muted hover:text-foreground">
              <Pin className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setShowMembersList(!showMembersList)}
              className={cn("rounded p-1 transition-colors hover:bg-muted hover:text-foreground", showMembersList && "text-foreground")}
            >
              <Users className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">

          <div className="rounded-md border border-border bg-card/40 p-4 mb-4 text-left">
            <h3 className="text-base font-bold text-foreground mb-1">
              Welcome to the beginning of the #{activeChannelName} channel!
            </h3>
            <p className="text-xs text-muted-foreground">
              This is the start of the #{activeChannelName} communication feed. Write guidelines, code updates, or general logs here.
            </p>
          </div>

          {activeChannelMessages.map((msg) => {
            const isBot = isMessageReply(msg);
            return (
              <div
                key={msg.id}
                className="group flex gap-3 text-left relative hover:bg-muted/10 -mx-4 px-4 py-1.5 rounded transition-all"
              >
                <Avatar className="h-9 w-9 ring-1 ring-border shrink-0">
                  <AvatarImage src={msg.avatar} />
                  <AvatarFallback className="bg-muted text-foreground font-bold">{msg.userName.slice(0, 2)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-0.5 leading-relaxed text-xs">
                  <div className="flex items-baseline gap-2">
                    <span className={cn("font-bold text-foreground/90 hover:underline cursor-pointer", isBot && "text-indigo-400")}>
                      {msg.userName}
                    </span>
                    {isBot && (
                      <span className="rounded bg-indigo-600/30 text-indigo-400 px-1 py-0.2 text-[8px] uppercase r font-bold leading-none">
                        Coworker
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground font-semibold">{formatMsgTime(msg.timestamp)}</span>
                  </div>

                  <p className="text-foreground/80 text-xs font-normal whitespace-pre-wrap">{msg.text}</p>

                  {msg.attachment && (
                    <div className="mt-2 rounded bg-background border border-border p-2.5 flex items-center gap-2 max-w-sm">
                      <FileText className="h-7 w-7 text-indigo-400 shrink-0" />
                      <div className="text-left overflow-hidden">
                        <p className="text-xs font-bold text-foreground truncate">{msg.attachment.name}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{msg.attachment.type} File • Mock download</p>
                      </div>
                    </div>
                  )}

                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {msg.reactions.map((react, i) => {
                        const hasReacted = react.userIds.includes(currentUser.id);
                        return (
                          <button
                            key={i}
                            onClick={() => reactToMessage(msg.id, react.emoji)}
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] flex items-center gap-1 border border-border transition-all font-semibold leading-none",
                              hasReacted ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 font-bold" : "bg-card text-muted-foreground hover:border-muted-foreground"
                            )}
                          >
                            <span>{react.emoji}</span>
                            <span>{react.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="absolute right-4 -top-3 hidden group-hover:flex items-center gap-0.5 rounded-md bg-card border border-border px-1 py-0.5 z-10">
                  {["👍", "❤️", "🔥", "🚀", "😮", "😢"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => reactToMessage(msg.id, emoji)}
                      className="rounded hover:bg-muted p-1 text-xs leading-none transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

              </div>
            );
          })}

          <div ref={chatEndRef} />
        </div>

        <div className="h-5 px-5 text-[10px] text-muted-foreground text-left font-medium">
          {isTyping && typingUser && (
            <span className="animate-pulse">
              ✍️ {typingUser} is typing a response...
            </span>
          )}
        </div>

        <div className="p-4 bg-background/10 border-t border-border shrink-0">
          <form onSubmit={handleSendSubmit} className="rounded-lg bg-card border border-border flex flex-col p-2 space-y-2">

            {attachedFile && (
              <div className="flex items-center justify-between rounded bg-background px-2 py-1.5 max-w-xs text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <Paperclip className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="truncate text-foreground font-semibold">{attachedFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMockAttachFile}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <PlusCircle className="h-5 w-5" />
              </button>

              <Input
                type="text"
                placeholder={activeChannelType === "dm" ? `Message @${activeChannelName}...` : `Message #${activeChannelName}...`}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="bg-transparent border-none text-foreground text-xs py-1 h-8 focus:ring-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder-muted-foreground"
              />

              <div className="flex items-center gap-1 text-muted-foreground">
                <button
                  type="button"
                  onClick={() => insertTextFormatting("bold")}
                  className="rounded p-1 hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Bold className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertTextFormatting("italic")}
                  className="rounded p-1 hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Italic className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertTextFormatting("code")}
                  className="rounded p-1 hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Code className="h-3.5 w-3.5" />
                </button>

                <div className="h-4 w-[1px] bg-border mx-1" />

                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 p-1.5 text-white hover:bg-indigo-700 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

          </form>
        </div>

      </div>

      {showMembersList && (
        <div className="w-60 bg-card border-l border-border shrink-0 p-3 space-y-4 text-left overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">

          {onlineMembers.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground">
                Online ({onlineMembers.length})
              </p>
              {onlineMembers.map((member) => (
                <div key={member.id} className="group flex items-center gap-2 rounded px-1.5 py-1 hover:bg-muted/40 cursor-pointer">
                  <div className="relative shrink-0">
                    <Avatar className="h-7 w-7 ring-1 ring-border">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-border" />
                  </div>
                  <div className="text-left text-xs overflow-hidden leading-tight">
                    <p className="font-bold text-foreground/90 truncate group-hover:text-foreground">{member.name}</p>
                    <p className="text-muted-foreground text-[10px] truncate">{member.activity || member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {idleMembers.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground">
                Idle ({idleMembers.length})
              </p>
              {idleMembers.map((member) => (
                <div key={member.id} className="group flex items-center gap-2 rounded px-1.5 py-1 hover:bg-muted/40 cursor-pointer">
                  <div className="relative shrink-0">
                    <Avatar className="h-7 w-7 ring-1 ring-border">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-amber-500 border border-border" />
                  </div>
                  <div className="text-left text-xs overflow-hidden leading-tight">
                    <p className="font-bold text-foreground/90 truncate group-hover:text-foreground">{member.name}</p>
                    <p className="text-muted-foreground text-[10px] truncate">{member.activity || member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {offlineMembers.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground">
                Offline ({offlineMembers.length})
              </p>
              {offlineMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-muted/20 opacity-60">
                  <div className="relative shrink-0">
                    <Avatar className="h-7 w-7 ring-1 ring-border grayscale">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-zinc-500 border border-border" />
                  </div>
                  <div className="text-left text-xs overflow-hidden leading-tight">
                    <p className="font-bold text-muted-foreground truncate">{member.name}</p>
                    <p className="text-muted-foreground text-[10px] truncate">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[400px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border shrink-0 text-left">
            <DialogTitle className="text-lg font-bold">Assign Members to Group</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Select which team members have access to the channel #{activeChannelName}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
            {teamMembers.map((member) => {
              const isSelected = selectedMemberIds.includes(member.id);
              return (
                <div
                  key={member.id}
                  onClick={() => toggleMemberSelection(member.id)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between p-2 rounded hover:bg-muted transition-colors border",
                    isSelected ? "border-indigo-600/60 bg-indigo-600/5" : "border-border/30"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7 ring-1 ring-border">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="text-left text-xs">
                      <p className="font-bold text-foreground/90">{member.name}</p>
                      <p className="text-muted-foreground text-[10px]">{member.role}</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleMemberSelection(member.id)}
                  />
                </div>
              );
            })}
          </div>
          <DialogFooter className="p-4 border-t border-border bg-card shrink-0">
            <Button variant="ghost" onClick={() => setIsAssignOpen(false)} className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button onClick={handleSaveGroupMembers} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Save Assignments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};
export default SlackChat;
