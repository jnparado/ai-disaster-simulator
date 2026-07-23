"use client";

import type { RescueDeployment } from "@/lib/types";

interface RescueOptimizerProps {
  deployment: RescueDeployment;
}

const UNITS = [
  { key: "ambulances" as const, label: "Ambulances", icon: "🚑" },
  { key: "fireTrucks" as const, label: "Fire Trucks", icon: "🚒" },
  { key: "helicopters" as const, label: "Helicopters", icon: "🚁" },
  { key: "policeOfficers" as const, label: "Police Officers", icon: "👮" },
  { key: "volunteers" as const, label: "Volunteers", icon: "🤝" },
];

export function RescueOptimizer({ deployment }: RescueOptimizerProps) {
  const max = Math.max(...UNITS.map((u) => deployment[u.key]));
  const total = UNITS.reduce((s, u) => s + deployment[u.key], 0);

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Rescue Optimizer
      </h3>
      <p className="mb-3 text-xs text-slate-500">AI recommends deployment based on predicted demand</p>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-950/20 px-3 py-2 text-center">
        <div className="text-[10px] uppercase tracking-wider text-cyan-400/80">Deploy</div>
        <div className="text-2xl font-bold text-white">{total.toLocaleString()}</div>
        <div className="text-[10px] text-slate-400">total personnel & units</div>
      </div>

      <div className="space-y-3">
        {UNITS.map((unit) => {
          const value = deployment[unit.key];
          const pct = max > 0 ? (value / max) * 100 : 0;
          return (
            <div key={unit.key}>
              <div className="mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm text-slate-300">
                  <span>{unit.icon}</span>
                  {unit.label}
                </span>
                <span className="text-lg font-bold tabular-nums text-white">{value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
