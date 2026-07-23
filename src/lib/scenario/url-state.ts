import type { DisasterType, SimulationParams, TimelineStep } from "../types";

export interface ScenarioState extends SimulationParams {
  windDirection: number;
  rainfall: number;
}

const DISASTER_TYPES: DisasterType[] = ["flood", "earthquake", "fire", "power-outage"];
const TIMELINE_IDS: TimelineStep[] = ["current", "+30m", "+1h", "+3h", "+12h", "tomorrow", "+3d"];

export function encodeScenario(state: ScenarioState): string {
  const params = new URLSearchParams();
  params.set("d", state.disasterType);
  params.set("i", state.intensity.toFixed(2));
  params.set("t", state.timelineStep);
  params.set("w", String(Math.round(state.windDirection)));
  params.set("r", String(Math.round(state.rainfall)));
  return params.toString();
}

export function decodeScenario(search: string, defaults: ScenarioState): ScenarioState {
  const params = new URLSearchParams(search);

  const disasterType = params.get("d");
  const timelineStep = params.get("t");
  const intensity = parseFloat(params.get("i") ?? "");
  const windDirection = parseInt(params.get("w") ?? "", 10);
  const rainfall = parseInt(params.get("r") ?? "", 10);

  return {
    disasterType: DISASTER_TYPES.includes(disasterType as DisasterType)
      ? (disasterType as DisasterType)
      : defaults.disasterType,
    timelineStep: TIMELINE_IDS.includes(timelineStep as TimelineStep)
      ? (timelineStep as TimelineStep)
      : defaults.timelineStep,
    intensity: Number.isFinite(intensity) ? Math.min(1, Math.max(0.1, intensity)) : defaults.intensity,
    windDirection: Number.isFinite(windDirection) ? windDirection % 360 : defaults.windDirection,
    rainfall: Number.isFinite(rainfall) ? Math.min(500, Math.max(0, rainfall)) : defaults.rainfall,
  };
}

export function buildShareUrl(state: ScenarioState): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${window.location.pathname}?${encodeScenario(state)}`;
}
