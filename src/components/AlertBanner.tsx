"use client";

import { computeSeverity } from "@/lib/severity";
import type { SimulationParams } from "@/lib/types";

interface AlertBannerProps {
  params: SimulationParams;
}

const STYLES = {
  critical: "border-red-500/40 bg-red-950/30 text-red-300",
  warning: "border-amber-500/40 bg-amber-950/30 text-amber-300",
  advisory: "border-yellow-500/40 bg-yellow-950/30 text-yellow-300",
  watch: "border-cyan-500/40 bg-cyan-950/30 text-cyan-300",
};

const ICONS = {
  critical: "🚨",
  warning: "⚠️",
  advisory: "📢",
  watch: "👁",
};

export function AlertBanner({ params }: AlertBannerProps) {
  const severity = computeSeverity(params);
  const style = STYLES[severity.level];

  return (
    <div className={`rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 ${style}`}>
      <div className="flex items-start gap-2.5 sm:items-center sm:gap-3">
        <span className="text-lg sm:text-xl">{ICONS[severity.level]}</span>
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider sm:text-xs">{severity.label}</div>
          <div className="text-xs leading-relaxed sm:text-sm">{severity.message}</div>
        </div>
      </div>
    </div>
  );
}
