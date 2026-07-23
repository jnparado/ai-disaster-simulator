import { canSendAlert, cooldownRemainingMs, markAlertSent } from "./cooldown";
import { checkCalamityProximity } from "./proximity";
import { sendCalamitySms } from "./sms";
import { CALAMITY_EPICENTERS } from "../geo/coordinates";
import { computeSeverity } from "../severity";
import { getSimulationState } from "../simulation/engine";
import type { SimulationParams } from "../types";

function impactRadiusKm(disasterType: string, floodLevel: number, intensity: number): number {
  const base: Record<string, number> = {
    flood: 2.5,
    earthquake: 4,
    fire: 1.8,
    "power-outage": 3,
  };
  const level = disasterType === "flood" ? floodLevel : intensity;
  return (base[disasterType] ?? 3) * (0.5 + level * 0.5) * intensity;
}

export interface AlertCheckInput {
  lat: number;
  lng: number;
  params: SimulationParams;
  phone: string;
  /** Skip severity threshold — for forced/cron sends */
  force?: boolean;
}

export interface AlertCheckResult {
  alerted: boolean;
  proximity: ReturnType<typeof checkCalamityProximity>;
  severity: string;
  reason?: string;
  cooldownRemainingMs?: number;
  sms?: { sent: boolean; provider?: string; error?: string };
}

export async function runAlertCheck(input: AlertCheckInput): Promise<AlertCheckResult> {
  const { lat, lng, params, phone, force = false } = input;

  const epicenter = CALAMITY_EPICENTERS[params.disasterType];
  const state = getSimulationState(params);
  const radius = impactRadiusKm(params.disasterType, state.floodLevel, params.intensity);
  const severity = computeSeverity(params);

  const proximity = checkCalamityProximity(
    lat,
    lng,
    epicenter.lat,
    epicenter.lng,
    radius,
    epicenter.label,
    params.disasterType
  );

  const shouldAlert =
    force ||
    (proximity.isNear && params.intensity >= 0.35 && severity.level !== "watch");

  if (!shouldAlert) {
    return {
      alerted: false,
      proximity,
      severity: severity.label,
      reason: proximity.isNear ? "Severity too low" : "Calamity not near your location",
    };
  }

  const cooldownKey = `${phone}:${params.disasterType}:${params.timelineStep}`;
  if (!force && !canSendAlert(cooldownKey)) {
    return {
      alerted: false,
      proximity,
      severity: severity.label,
      reason: "Cooldown active",
      cooldownRemainingMs: cooldownRemainingMs(cooldownKey),
    };
  }

  const sms = await sendCalamitySms({
    phone,
    disasterType: params.disasterType,
    epicenterLabel: epicenter.label,
    distanceKm: proximity.distanceKm,
    intensity: params.intensity,
    severity: severity.label,
  });

  if (sms.sent) {
    markAlertSent(cooldownKey);
  }

  return {
    alerted: sms.sent,
    proximity,
    severity: severity.label,
    sms,
  };
}

/** Default monitoring location — Davao City center */
export const DEFAULT_ALERT_LOCATION = { lat: 7.073, lng: 125.612 };
