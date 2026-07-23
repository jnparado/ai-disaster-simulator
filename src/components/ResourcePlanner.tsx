"use client";

import type { ResourceRequirements } from "@/lib/types";

interface ResourcePlannerProps {
  resources: ResourceRequirements;
}

const ITEMS = [
  { key: "food" as const, label: "Food", icon: "🍱", unit: "rations" },
  { key: "water" as const, label: "Water", icon: "💧", unit: "liters" },
  { key: "medicine" as const, label: "Medicine", icon: "💊", unit: "medical kits" },
  { key: "blankets" as const, label: "Blankets", icon: "🛏️", unit: "units" },
  { key: "fuel" as const, label: "Fuel", icon: "⛽", unit: "liters" },
  { key: "rescueBoats" as const, label: "Rescue Boats", icon: "🚤", unit: "boats" },
  { key: "rescueTeams" as const, label: "Rescue Teams", icon: "🦺", unit: "teams" },
  { key: "generators" as const, label: "Generators", icon: "🔌", unit: "units" },
];

export function ResourcePlanner({ resources }: ResourcePlannerProps) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Resource Planner
      </h3>
      <p className="mb-4 text-xs text-slate-500">AI predicts supply requirements for response operations</p>
      <div className="grid grid-cols-2 gap-3">
        {ITEMS.map((item) => (
          <div key={item.key} className="rounded-lg border border-slate-700/30 bg-slate-800/30 p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>{item.icon}</span>
              {item.label}
            </div>
            <div className="mt-1 text-xl font-bold tabular-nums text-white">
              {resources[item.key].toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500">{item.unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
