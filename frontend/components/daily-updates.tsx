"use client";

import React, { useState } from "react";
import { useWorkspace, DailyUpdate } from "@/app/context";
import {
  ClipboardList,
  Search,
  Send,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Filter,
  Check
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

export const MarkdownViewer: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  return (
    <ReactMarkdown
      components={{
        h1: ({ ...props }) => <h1 className="text-sm font-bold text-foreground mt-2 mb-1" {...props} />,
        h2: ({ ...props }) => <h2 className="text-xs font-bold text-foreground mt-2 mb-0.5" {...props} />,
        h3: ({ ...props }) => <h3 className="text-xs font-bold text-foreground mt-1.5 mb-0.5" {...props} />,
        h4: ({ ...props }) => <h4 className="text-[11px] font-bold text-foreground mt-1 mb-0.5" {...props} />,
        p: ({ ...props }) => <p className="text-foreground/90 text-xs leading-relaxed mb-1" {...props} />,
        ul: ({ ...props }) => <ul className="list-disc pl-4 space-y-1 mb-1 mt-0.5" {...props} />,
        ol: ({ ...props }) => <ol className="list-decimal pl-4 space-y-1 mb-1 mt-0.5" {...props} />,
        li: ({ ...props }) => <li className="text-foreground/90 text-xs pl-0.5" {...props} />,
        strong: ({ ...props }) => <strong className="font-bold text-foreground" {...props} />,
        em: ({ ...props }) => <em className="italic text-foreground/90" {...props} />,
        code: ({ ...props }) => (
          <code
            className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700/60 text-indigo-400 font-mono rounded text-[10px] font-medium"
            {...props}
          />
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
};

const updateSchema = z.object({
  today: z.string().min(5, { message: "Please specify what you plan to accomplish today (at least 5 characters)." }),
  blockers: z.string().optional(),
  projectId: z.string().optional(),
});

type UpdateFormValues = z.infer<typeof updateSchema>;

export const DailyUpdates: React.FC = () => {
  const {
    projects,
    activeProjectId,
    dailyUpdates,
    addDailyUpdate,
    currentUser,
  } = useWorkspace();

  const [submittedToday, setSubmittedToday] = useState(false);
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      today: "",
      blockers: "",
      projectId: activeProjectId || "",
    },
  });

  const watchToday = watch("today");

  const onSubmitUpdate = (data: UpdateFormValues) => {
    addDailyUpdate(
      data.today,
      data.blockers || "None.",
      data.projectId || undefined
    );
    reset();
    setSubmittedToday(true);
    setTimeout(() => setSubmittedToday(false), 4000);
  };

  const filteredUpdates = dailyUpdates;

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 text-foreground font-sans">

      <div className="mb-6 flex flex-col gap-1 text-left">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" />
          Daily Stand-up Updates
        </h1>
        <p className="text-xs text-muted-foreground">
          Submit status logs for active projects. Keep team synced on blockers.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="lg:col-span-1">
          <Card className="bg-card border-border text-card-foreground sticky top-6 py-0">
            <CardContent className="p-4">
              {submittedToday ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-green-400">
                  <Check className="h-10 w-10 border border-green-500 rounded-full p-2 bg-green-500/10 mb-2 animate-bounce" />
                  <p className="text-sm font-bold">Update Logged Successfully!</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Thank you for syncing your stand-up status.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmitUpdate)} className="space-y-4 text-left">

                  <div className="space-y-1">
                    <Label className="text-xs font-normal text-muted-foreground ">Scope Project</Label>
                    <Controller
                      control={control}
                      name="projectId"
                      render={({ field }) => (
                        <Select value={field.value || "general"} onValueChange={(val) => field.onChange(val === "general" ? "" : val)}>
                          <SelectTrigger className="w-full h-9 bg-background border-border text-foreground text-xs">
                            <SelectValue placeholder="General (No specific project)" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-popover-foreground">
                            <SelectItem value="general">General (No specific project)</SelectItem>
                            {projects.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-muted-foreground">Today's Focus Areas (Markdown)</Label>
                    <Textarea
                      {...register("today")}
                      placeholder="What will you work on? E.g.&#10;- **Task 1**: Detail&#10;- `code-block` changes"
                      className="bg-background border-border text-xs text-foreground placeholder-muted-foreground h-28 resize-y"
                    />
                    {errors.today && <p className="text-[10px] text-rose-500 font-semibold">{errors.today.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[12px] text-muted-foreground">Live Preview</Label>
                    <div className="bg-muted/30 border border-border border-dashed rounded-md p-3 max-h-36 min-h-[4rem] overflow-y-auto text-xs scrollbar-thin scrollbar-thumb-zinc-800">
                      {watchToday ? (
                        <MarkdownViewer text={watchToday} />
                      ) : (
                        <span className="italic text-[12px] text-muted-foreground/50">Type something to see live preview...</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-normal text-muted-foreground">Blockers (Optional)</Label>
                    <Input
                      {...register("blockers")}
                      placeholder="e.g. Waiting on API specifications, server connection latency"
                      className="bg-background border-border text-xs text-foreground placeholder-muted-foreground"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 mt-2">
                    <Send className="h-3.5 w-3.5 mr-1" />
                    Submit Standup
                  </Button>
                </form>
              )}

            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">

          <div className="max-h-[72vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 pr-1 text-left">
            {(() => {
              const groupUpdatesByDate = (updates: DailyUpdate[]) => {
                const groups: { [date: string]: DailyUpdate[] } = {};
                updates.forEach((update) => {
                  const dateVal = update.date;
                  if (!groups[dateVal]) {
                    groups[dateVal] = [];
                  }
                  groups[dateVal].push(update);
                });
                return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
              };

              const formatGroupDate = (dateStr: string) => {
                const today = new Date().toISOString().split("T")[0];
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split("T")[0];

                if (dateStr === today) return "Today";
                if (dateStr === yesterdayStr) return "Yesterday";

                try {
                  const dateObj = new Date(dateStr);
                  return dateObj.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  });
                } catch (e) {
                  return dateStr;
                }
              };

              const groupedUpdates = groupUpdatesByDate(filteredUpdates);

              if (filteredUpdates.length === 0) {
                return (
                  <div className="rounded-lg border border-dashed border-border py-16 text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-muted-foreground">No Standups Found</h4>
                    <p className="text-xs text-muted-foreground mt-1">Submit updates to see them populating the log list feed.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {groupedUpdates.map(([dateStr, updates]) => (
                    <div key={dateStr} className="space-y-4">
                      <div className="sticky top-0 z-20 flex items-center gap-2 bg-background py-1.5">
                        <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 px-2 py-0.5 rounded-md">
                          {formatGroupDate(dateStr)}
                        </span>
                        <div className="flex-1 h-px bg-border/40" />
                      </div>

                      <div className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60 space-y-5">
                        {updates.map((update) => (
                          <div key={update.id} className="relative group pl-3 py-1 hover:bg-muted/10 rounded-lg transition-colors">
                            <div className="absolute -left-[27px] top-1.5 flex items-center justify-center bg-background rounded-full p-0.5 shrink-0 z-10">
                              <Avatar className="h-6 w-6 border border-border">
                                <AvatarImage src={update.userAvatar} />
                                <AvatarFallback className="text-[10px]">{update.userName[0]}</AvatarFallback>
                              </Avatar>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-bold text-foreground hover:underline cursor-pointer">{update.userName}</span>
                                {update.userId === currentUser.id && (
                                  <Badge className="bg-secondary/40 text-secondary-foreground hover:bg-secondary/40 border-none font-bold text-[8px] uppercase scale-90 px-1 py-0.5 leading-none">
                                    Me
                                  </Badge>
                                )}
                                <span className="text-[10px] text-muted-foreground">•</span>
                                {update.projectName ? (
                                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-900/30">
                                    {update.projectName}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded border border-border">
                                    General
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-foreground/90 pl-1 leading-relaxed">
                                <MarkdownViewer text={update.today} />
                              </div>

                              {update.blockers && update.blockers !== "None." && update.blockers !== "None" && (
                                <div className="inline-flex items-center gap-1.5 rounded bg-rose-500/5 border border-rose-500/25 p-2 text-xs text-rose-600 dark:text-rose-400 max-w-full">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                  <span><span className="font-bold text-[10px] uppercase text-rose-600 dark:text-rose-400">Blocker:</span> {update.blockers}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

        </div>

      </div>

    </div>
  );
};
export default DailyUpdates;
