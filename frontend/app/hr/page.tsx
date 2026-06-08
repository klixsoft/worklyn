"use client";

import React from "react";
import { useWorkspace } from "@/app/context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserCog,
  Users,
  CalendarDays,
  Clock,
  ClipboardList,
  Star,
  HeartPulse,
  GraduationCap,
  ArrowUpRight,
} from "lucide-react";

const HR_STATS = [
  { label: "Total Employees", value: "142", change: "+3 this month", icon: <Users className="h-4 w-4" /> },
  { label: "On Leave Today", value: "8", change: "5.6% of staff", icon: <CalendarDays className="h-4 w-4" /> },
  { label: "Avg. Tenure", value: "2.4 yrs", change: "+0.3 from last year", icon: <Clock className="h-4 w-4" /> },
  { label: "Open Positions", value: "12", change: "4 urgent hires", icon: <ClipboardList className="h-4 w-4" /> },
];

export default function HRPage() {
  const { currentUser } = useWorkspace();

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 font-sans">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
            <UserCog className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-foreground">HR Management</h1>
            <p className="text-xs text-muted-foreground">Human resources, payroll, and employee lifecycle</p>
          </div>
          <Badge className="ml-2 bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-semibold">
            Coming Soon
          </Badge>
        </div>

        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 text-left">
          <p className="text-sm text-violet-400 font-semibold mb-1">This module is under development</p>
          <p className="text-xs text-muted-foreground">
            The HR Management suite will include employee records, attendance, leave management, payroll, performance reviews,
            and recruitment tracking. You&apos;re viewing a preview of planned features.
          </p>
        </div>
      </div>

      {/* Preview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {HR_STATS.map((stat) => (
          <Card key={stat.label} className="bg-card border-border text-foreground opacity-60 pointer-events-none select-none">
            <CardContent className="p-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <span className="text-violet-400">{stat.icon}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-violet-400" />
                <span className="text-[10px] font-semibold text-violet-400">{stat.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Planned Features */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Employee Directory", desc: "Centralized employee profiles with org chart visualization.", icon: <Users className="h-5 w-5 text-violet-400" /> },
          { title: "Leave Management", desc: "Apply, approve, and track leave requests with calendar sync.", icon: <CalendarDays className="h-5 w-5 text-violet-400" /> },
          { title: "Payroll Processing", desc: "Automated payroll with tax deductions and payslip generation.", icon: <Clock className="h-5 w-5 text-violet-400" /> },
          { title: "Performance Reviews", desc: "360° feedback, goal setting, and performance tracking.", icon: <Star className="h-5 w-5 text-violet-400" /> },
          { title: "Benefits & Wellness", desc: "Health insurance, wellness programs, and benefits administration.", icon: <HeartPulse className="h-5 w-5 text-violet-400" /> },
          { title: "Learning & Development", desc: "Training records, skill tracking, and certification management.", icon: <GraduationCap className="h-5 w-5 text-violet-400" /> },
        ].map((feature) => (
          <Card key={feature.title} className="bg-card border-border text-foreground hover:border-violet-500/30 transition-colors">
            <CardContent className="p-4 text-left space-y-2">
              <div className="flex items-center gap-2">
                {feature.icon}
                <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
              <Badge variant="outline" className="text-[10px] border-violet-500/20 text-violet-400 mt-1">
                Planned
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
