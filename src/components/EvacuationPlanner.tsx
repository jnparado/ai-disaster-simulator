"use client";

import type { RouteGeometry } from "@/lib/geo/evacuation-routes";
import type { EvacuationRoute } from "@/lib/types";

interface EvacuationPlannerProps {
  routes: (EvacuationRoute | RouteGeometry)[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
}

const TYPE_LABELS: Record<string, { label: string; subtitle: string; color: string; ring: string }> = {
  safest: {
    label: "Safest Route",
    subtitle: "Highest elevation, minimal hazard exposure",
    color: "text-emerald-400 bg-emerald-950/40 border-emerald-500/30",
    ring: "ring-emerald-500/50",
  },
  "least-congested": {
    label: "Least Congested Route",
    subtitle: "AI traffic model — avoids bottlenecks",
    color: "text-cyan-400 bg-cyan-950/40 border-cyan-500/30",
    ring: "ring-cyan-500/50",
  },
  "avoid-flood": {
    label: "Flood Avoidance Route",
    subtitle: "Stays above predicted flood depth contour",
    color: "text-blue-400 bg-blue-950/40 border-blue-500/30",
    ring: "ring-blue-500/50",
  },
  emergency: {
    label: "Emergency Vehicle Route",
    subtitle: "Wide lanes for ambulances & fire trucks",
    color: "text-amber-400 bg-amber-950/40 border-amber-500/30",
    ring: "ring-amber-500/50",
  },
};

export function EvacuationPlanner({
  routes,
  selectedRouteId,
  onSelectRoute,
}: EvacuationPlannerProps) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
        AI Evacuation Planner
      </h3>
      <p className="mb-4 text-xs text-slate-500">
        AI calculates optimal routes — not just shortest distance
      </p>
      <div className="space-y-3">
        {routes.map((route) => {
          const typeInfo = TYPE_LABELS[route.type] ?? TYPE_LABELS.safest;
          const isSelected = route.id === selectedRouteId;
          const hasGeometry = "geometry" in route && route.geometry;

          return (
            <button
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={`w-full rounded-lg border p-3 text-left transition ${
                typeInfo.color.split(" ").slice(1).join(" ")
              } border ${isSelected ? `ring-2 ${typeInfo.ring}` : "opacity-80 hover:opacity-100"}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${typeInfo.color}`}>
                  {typeInfo.label}
                </span>
                <span className={route.accessible ? "text-xs text-emerald-400" : "text-xs text-red-400"}>
                  {route.accessible ? "✓ Clear" : "✗ Blocked"}
                </span>
              </div>
              <div className="text-sm font-medium text-slate-200">{route.name}</div>
              <div className="mt-0.5 text-[10px] text-slate-500">{typeInfo.subtitle}</div>
              {"aiReason" in route && route.aiReason && (
                <div className="mt-1.5 text-[10px] italic text-cyan-400/80">AI: {route.aiReason}</div>
              )}
              <div className="mt-2 flex gap-4 text-xs text-slate-400">
                <span>{route.distance.toFixed(1)} km</span>
                <span>{route.estimatedTime} min</span>
                {hasGeometry && <span className="text-cyan-400">on map</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
