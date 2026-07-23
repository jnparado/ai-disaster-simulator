import type { SimulationParams } from "./types";
import { TIMELINE_STEPS } from "./types";

export type AlertLevel = "watch" | "advisory" | "warning" | "critical";

export interface SeverityInfo {
  level: AlertLevel;
  label: string;
  color: string;
  message: string;
}

export function computeSeverity(params: SimulationParams): SeverityInfo {
  const hours = TIMELINE_STEPS.find((s) => s.id === params.timelineStep)?.hours ?? 0;
  const score = params.intensity * (0.5 + Math.min(1, hours / 24) * 0.5);

  if (score >= 0.75) {
    return {
      level: "critical",
      label: "CRITICAL",
      color: "red",
      message: "Immediate evacuation and full emergency response required.",
    };
  }
  if (score >= 0.55) {
    return {
      level: "warning",
      label: "WARNING",
      color: "amber",
      message: "Significant impact expected. Activate emergency protocols.",
    };
  }
  if (score >= 0.35) {
    return {
      level: "advisory",
      label: "ADVISORY",
      color: "yellow",
      message: "Moderate impact possible. Monitor and prepare resources.",
    };
  }
  return {
    level: "watch",
    label: "WATCH",
    color: "cyan",
    message: "Low immediate impact. Continue monitoring conditions.",
  };
}

export function formatUncertainty(value: number, variance = 0.15): string {
  const low = Math.round(value * (1 - variance));
  const high = Math.round(value * (1 + variance));
  return `${low.toLocaleString()} – ${high.toLocaleString()}`;
}
