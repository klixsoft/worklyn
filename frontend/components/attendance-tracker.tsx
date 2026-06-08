"use client";

import React, { useState, useEffect } from "react";
import { useWorkspace, AttendanceLog } from "@/app/context";
import {
  Clock,
  Play,
  Square,
  Calendar,
  AlertCircle,
  TrendingUp,
  Timer,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const AttendanceTracker: React.FC = () => {
  const {
    attendanceLogs,
    isClockedIn,
    toggleClock,
  } = useWorkspace();

  const [time, setTime] = useState("");
  const [stopwatch, setStopwatch] = useState("00:00:00");

  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setTime(date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let stopwatchInterval: NodeJS.Timeout;

    if (isClockedIn && attendanceLogs.length > 0) {
      const activeLog = attendanceLogs.find(log => log.checkOut === null);
      if (activeLog) {
        const checkInTime = new Date(activeLog.checkIn).getTime();

        const updateStopwatch = () => {
          const now = new Date().getTime();
          const diffMs = now - checkInTime;

          const secs = Math.floor((diffMs / 1000) % 60);
          const mins = Math.floor((diffMs / (1000 * 60)) % 60);
          const hrs = Math.floor((diffMs / (1000 * 60 * 60)) % 24);

          const pad = (n: number) => n.toString().padStart(2, "0");
          setStopwatch(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
        };

        updateStopwatch();
        stopwatchInterval = setInterval(updateStopwatch, 1000);
      }
    } else {
      setStopwatch("00:00:00");
    }

    return () => clearInterval(stopwatchInterval);
  }, [isClockedIn, attendanceLogs]);

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const getDurationString = (mins: number) => {
    if (mins === 0) return "-";
    if (mins < 60) return `${mins} mins`;
    const hrs = Math.floor(mins / 60);
    const remainder = mins % 60;
    return remainder > 0 ? `${hrs}h ${remainder}m` : `${hrs}h`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 text-muted-foreground font-sans">

      <div className="mb-6 flex flex-col gap-1 text-left">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock className="h-6 w-6 text-indigo-400" />
          Attendance Shift Console
        </h1>
        <p className="text-xs text-muted-foreground">
          Clock in at the start of your shift. All sessions are logged inside the workspace data.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="lg:col-span-1">
          <Card className="bg-card border-border text-foreground sticky top-6">
            <CardHeader className="border-b border-border pb-3 text-center">
              <CardTitle className="text-sm font-bold text-foreground">Punch Clock Console</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Track and log your active hours</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-6">

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground ">Current Time</p>
                <div className="text-3xl font-bold text-foreground st font-mono bg-background px-6 py-2 rounded-md border border-border">
                  {time || "00:00:00"}
                </div>
              </div>

              {isClockedIn && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-green-400 animate-pulse flex items-center justify-center gap-1">
                    <Timer className="h-3.5 w-3.5" />
                    Shift Timer Active
                  </p>
                  <div className="text-xl font-bold text-muted-foreground font-mono">
                    {stopwatch}
                  </div>
                </div>
              )}

              <button
                onClick={toggleClock}
                className={`flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 transition-all duration-300 font-sans focus:outline-none cursor-pointer ${isClockedIn
                  ? "bg-rose-500/10 border-rose-500 text-rose-400 hover:bg-rose-500/20 active:scale-95"
                  : "bg-green-500/10 border-green-500 text-green-400 hover:bg-green-500/20 active:scale-95"
                  }`}
              >
                {isClockedIn ? (
                  <>
                    <Square className="h-6 w-6 mb-1 fill-rose-500 text-rose-500" />
                    <span className="text-xs font-bold ">Clock Out</span>
                  </>
                ) : (
                  <>
                    <Play className="h-6 w-6 mb-1 fill-green-500 text-green-500" />
                    <span className="text-xs font-bold ">Clock In</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-muted-foreground/60 leading-normal max-w-xs">
                Pressing Clock In creates a new session log. Press Clock Out at breaks or shift end to stop calculations.
              </p>

            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4 text-left">

          <div className="grid gap-4 grid-cols-2">
            <Card className="bg-card border-border p-4 flex flex-col justify-between">
              <p className="text-[10px] font-bold text-muted-foreground ">Logged Shift Counts</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{attendanceLogs.length} Shifts</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Total checked-in entries saved</p>
            </Card>
            <Card className="bg-card border-border p-4 flex flex-col justify-between">
              <p className="text-[10px] font-bold text-muted-foreground ">Session Status</p>
              <h3 className="text-2xl font-bold text-foreground mt-1 flex items-center gap-1.5 leading-none">
                <span className={`h-3 w-3 rounded-full ${isClockedIn ? "bg-green-500 animate-pulse" : "bg-muted-foreground/50"}`} />
                {isClockedIn ? "Active" : "Offline"}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">{isClockedIn ? "Recording duration" : "No active session log"}</p>
            </Card>
          </div>

          <Card className="bg-card border-border text-foreground">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm font-bold text-foreground">Punch Logs History</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">All shifts recorded for the current user</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[50vh] scrollbar-thin scrollbar-thumb-zinc-800">

              {attendanceLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <AlertCircle className="h-9 w-9 text-muted-foreground/40 mb-2" />
                  <p className="text-xs font-semibold text-muted-foreground/60">No shift logs found</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40 text-xs">
                  {attendanceLogs.map((log) => {
                    const isActive = log.checkOut === null;
                    return (
                      <div key={log.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{log.date}</span>
                            {isActive ? (
                              <Badge className="bg-green-500/10 border-none text-green-400 font-bold text-[8px] uppercase leading-none py-0.5 px-1 animate-pulse">
                                Active Shift
                              </Badge>
                            ) : (
                              <Badge className="bg-background border border-border text-muted-foreground font-bold text-[8px] uppercase leading-none py-0.5 px-1">
                                Completed
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground/60 font-medium">
                            Check In: {formatTime(log.checkIn)} • Check Out: {formatTime(log.checkOut)}
                          </p>
                        </div>

                        <div className="text-right flex items-center gap-2">
                          <div className="text-right leading-none">
                            <p className="font-bold text-foreground">{isActive ? "Running" : getDurationString(log.duration)}</p>
                            <p className="text-[10px] text-muted-foreground mt-1 font-semibold">Total Duration</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
};
