"use client";

import React from "react";
import { useWorkspace } from "@/app/context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, PieChart, Receipt, Wallet, ArrowUpRight, ArrowDownRight, BarChart3 } from "lucide-react";

const FINANCE_STATS = [
  { label: "Total Revenue", value: "$284,900", change: "+12.5%", up: true, icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Expenses", value: "$96,200", change: "-4.1%", up: false, icon: <Receipt className="h-4 w-4" /> },
  { label: "Net Profit", value: "$188,700", change: "+18.3%", up: true, icon: <Wallet className="h-4 w-4" /> },
  { label: "Budget Used", value: "67%", change: "On track", up: true, icon: <PieChart className="h-4 w-4" /> },
];

export default function FinancePage() {
  const { currentUser } = useWorkspace();

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 font-sans">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-foreground">Finance Suite</h1>
            <p className="text-xs text-muted-foreground">Financial management and reporting dashboard</p>
          </div>
          <Badge className="ml-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            Coming Soon
          </Badge>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-left">
          <p className="text-sm text-emerald-400 font-semibold mb-1">This module is under development</p>
          <p className="text-xs text-muted-foreground">
            The Finance Suite will include budget tracking, expense management, invoicing, and financial reporting.
            You&apos;re viewing a preview of planned features.
          </p>
        </div>
      </div>

      {/* Preview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {FINANCE_STATS.map((stat) => (
          <Card key={stat.label} className="bg-card border-border text-foreground opacity-60 pointer-events-none select-none">
            <CardContent className="p-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <span className="text-emerald-400">{stat.icon}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {stat.up ? (
                  <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-rose-400" />
                )}
                <span className={`text-[10px] font-semibold ${stat.up ? "text-emerald-400" : "text-rose-400"}`}>
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Planned Features */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Budget Tracking", desc: "Monitor spending against budgets in real time across departments.", icon: <Wallet className="h-5 w-5 text-emerald-400" /> },
          { title: "Expense Reports", desc: "Automated expense categorization and approval workflows.", icon: <Receipt className="h-5 w-5 text-emerald-400" /> },
          { title: "Revenue Analytics", desc: "Track revenue trends, forecasts, and growth metrics.", icon: <TrendingUp className="h-5 w-5 text-emerald-400" /> },
          { title: "Invoicing", desc: "Generate, send, and track invoices with payment status.", icon: <DollarSign className="h-5 w-5 text-emerald-400" /> },
          { title: "Financial Reports", desc: "P&L statements, balance sheets, and cash flow reports.", icon: <BarChart3 className="h-5 w-5 text-emerald-400" /> },
          { title: "Tax Management", desc: "GST, VAT, and tax compliance tools for your region.", icon: <PieChart className="h-5 w-5 text-emerald-400" /> },
        ].map((feature) => (
          <Card key={feature.title} className="bg-card border-border text-foreground hover:border-emerald-500/30 transition-colors">
            <CardContent className="p-4 text-left space-y-2">
              <div className="flex items-center gap-2">
                {feature.icon}
                <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
              <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400 mt-1">
                Planned
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
