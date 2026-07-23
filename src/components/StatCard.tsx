"use client";

import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  variant?: "default" | "danger" | "warning" | "success";
  subtext?: string;
}

const variants = {
  default: "border-slate-700/50 bg-slate-800/40",
  danger: "border-red-500/30 bg-red-950/20",
  warning: "border-amber-500/30 bg-amber-950/20",
  success: "border-emerald-500/30 bg-emerald-950/20",
};

const valueColors = {
  default: "text-slate-100",
  danger: "text-red-400",
  warning: "text-amber-400",
  success: "text-emerald-400",
};

export function StatCard({ label, value, icon, variant = "default", subtext }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${variants[variant]}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</span>
        {icon && <span className="text-lg opacity-70">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold tabular-nums ${valueColors[variant]}`}>{value}</div>
      {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
    </div>
  );
}
