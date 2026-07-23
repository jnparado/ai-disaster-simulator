import { davaoCity } from "../digital-twin/davao-city";
import type {
  CascadeStep,
  DamageEstimate,
  DisasterPrediction,
  DisasterType,
  EvacuationRoute,
  RescueDeployment,
  ResourceRequirements,
  SimulationParams,
  SimulationResult,
  SimulationState,
  TimelineStep,
} from "../types";
import { TIMELINE_STEPS } from "../types";
import { predictEarthquake } from "./earthquake";
import { predictFire } from "./fire";
import { predictFlood } from "./flood";
import { predictPowerOutage } from "./power-outage";

function getHours(step: TimelineStep): number {
  return TIMELINE_STEPS.find((s) => s.id === step)?.hours ?? 0;
}

function scaleFactor(hours: number, intensity: number): number {
  const timeScale = Math.min(1, hours / 24);
  return intensity * (0.3 + timeScale * 0.7);
}

function buildCascade(
  type: DisasterType,
  hours: number,
  intensity: number,
  prediction: DisasterPrediction,
  rainfall?: number
): CascadeStep[] {
  const s = scaleFactor(hours, intensity);

  if (type === "flood") {
    const p = prediction.data as import("../types").FloodPrediction;
    return [
      { label: "Rainfall", value: `${Math.round(rainfall ?? 80 + s * 220)} mm` },
      { label: "River Overflow", value: hours >= 1 ? "Detected" : "Monitoring" },
      { label: "Flood onset", value: hours >= 3 ? `${Math.round(hours)} hours ago` : `In ${Math.max(1, 3 - hours)} hours` },
      { label: "Barangays affected", value: `${p.barangaysAffected}` },
      { label: "Roads closed", value: `${p.roadClosures}` },
      { label: "Bridges unsafe", value: `${p.bridgesUnsafe}` },
      { label: "Hospitals near capacity", value: `${Math.min(4, Math.ceil(s * 4))}` },
      { label: "People need evacuation", value: p.peopleImpacted.toLocaleString() },
      { label: "Estimated damage", value: `₱${(1.4 * s * intensity).toFixed(1)}B` },
    ];
  }

  if (type === "earthquake") {
    const p = prediction.data as import("../types").EarthquakePrediction;
    return [
      { label: "Seismic event", value: `${(5.5 + intensity * 2).toFixed(1)} magnitude` },
      { label: "Building damage", value: `${Math.round(p.buildingDamageProbability * 100)}% probability` },
      { label: "Bridge failures", value: `${p.bridgeFailures}` },
      { label: "Road accessibility", value: `${Math.round(p.roadAccessibility * 100)}%` },
      { label: "Hospital capacity", value: `${Math.round(p.hospitalCapacity * 100)}%` },
      { label: "Communication outages", value: `${p.communicationOutages}%` },
      { label: "Rescue priority zones", value: `${p.rescuePriority.length}` },
      { label: "Aftershock risk", value: hours < 24 ? "High" : "Moderate" },
    ];
  }

  if (type === "fire") {
    const p = prediction.data as import("../types").FirePrediction;
    return [
      { label: "Fire origin", value: "Industrial zone" },
      { label: "Fire spread", value: `${Math.round(p.fireSpread * 100)}%` },
      { label: "Wind direction", value: p.windDirection },
      { label: "Buildings at risk", value: `${p.buildingsAtRisk}` },
      { label: "Evacuation timing", value: p.evacuationTiming },
      { label: "Firefighters deployed", value: `${p.firefighterDeployment}` },
      { label: "Water required", value: `${p.waterRequirements.toLocaleString()} L` },
      { label: "Time to spread", value: `${p.timeUntilIgnition} min` },
    ];
  }

  const p = prediction.data as import("../types").PowerOutagePrediction;
  return [
    { label: "Grid failure", value: `${Math.round(p.gridFailureCascade * 100)}% cascade` },
    { label: "Hospitals affected", value: `${p.hospitalsAffected}` },
    { label: "Traffic signals failed", value: `${p.trafficSignalFailures}` },
    { label: "Internet disruption", value: `${p.internetDisruptions}%` },
    { label: "Cellular degradation", value: `${p.cellularDegradation}%` },
    { label: "Est. restoration", value: `${p.estimatedRestorationHours} hours` },
  ];
}

function computeRescue(type: DisasterType, intensity: number, hours: number): RescueDeployment {
  const s = scaleFactor(hours, intensity);
  const base = {
    ambulances: Math.ceil(5 + s * 25),
    fireTrucks: Math.ceil(2 + s * 12),
    helicopters: Math.ceil(s * 3),
    policeOfficers: Math.ceil(20 + s * 80),
    volunteers: Math.ceil(50 + s * 400),
  };

  if (type === "fire") {
    base.fireTrucks = Math.ceil(8 + s * 20);
    base.helicopters = Math.ceil(1 + s * 4);
  }
  if (type === "earthquake") {
    base.ambulances = Math.ceil(10 + s * 30);
    base.helicopters = Math.ceil(2 + s * 5);
  }

  return base;
}

function computeResources(type: DisasterType, intensity: number, hours: number, people: number): ResourceRequirements {
  const s = scaleFactor(hours, intensity);
  return {
    food: Math.ceil(people * 0.5 * s),
    water: Math.ceil(people * 2 * s),
    medicine: Math.ceil(people * 0.1 * s),
    blankets: Math.ceil(people * 0.3 * s),
    fuel: Math.ceil(500 + s * 5000),
    rescueBoats: type === "flood" ? Math.ceil(5 + s * 45) : Math.ceil(s * 5),
    rescueTeams: Math.ceil(10 + s * 90),
    generators: Math.ceil(5 + s * 45),
  };
}

function computeDamage(type: DisasterType, intensity: number, hours: number): DamageEstimate {
  const s = scaleFactor(hours, intensity);
  const multiplier = type === "earthquake" ? 2.5 : type === "fire" ? 1.8 : type === "flood" ? 1.4 : 1.0;
  const base = 500_000_000 * multiplier * s * intensity;

  return {
    insuranceClaims: Math.round(base * 0.4),
    repairCosts: Math.round(base * 0.35),
    infrastructureDamage: Math.round(base * 0.25),
    economicLosses: Math.round(base * 1.2),
    recoveryDays: Math.ceil(7 + s * intensity * 30),
  };
}

function computeEvacuationRoutes(type: DisasterType, intensity: number): EvacuationRoute[] {
  const floodHazard = type === "flood";
  const fireHazard = type === "fire";

  return [
    {
      id: "route-safest",
      name: "Safest Route — Calinan Highlands",
      type: "safest",
      distance: 12.4,
      estimatedTime: 45,
      hazards: ["Steep incline on final approach"],
      accessible: true,
      aiReason: "Highest elevation path — avoids all flood zones and fire perimeters",
    },
    {
      id: "route-congested",
      name: "Least Congested — Diversion Road",
      type: "least-congested",
      distance: 15.1,
      estimatedTime: 38,
      hazards: [],
      accessible: true,
      aiReason: "AI traffic model predicts 62% lower congestion than main arteries",
    },
    {
      id: "route-flood-avoid",
      name: "Flood Avoidance — Tugbok Highland Route",
      type: "avoid-flood",
      distance: 14.2,
      estimatedTime: 42,
      hazards: floodHazard ? [] : ["N/A for non-flood scenario"],
      accessible: true,
      aiReason: "Routes entirely above predicted flood depth contour (elevation > 45m)",
    },
    {
      id: "route-emergency",
      name: "Emergency Vehicle Route — McArthur Highway",
      type: "emergency",
      distance: 10.5,
      estimatedTime: 28,
      hazards: fireHazard ? ["Near fire perimeter"] : type === "earthquake" ? ["Possible debris"] : [],
      accessible: intensity < 0.85,
      aiReason: "Wide lanes, cleared for ambulances and fire trucks — 6m minimum width",
    },
  ];
}

function getAffectedBarangays(type: DisasterType, intensity: number, hours: number): string[] {
  const s = scaleFactor(hours, intensity);
  const count = Math.ceil(davaoCity.barangays.length * s * 0.8);
  const sorted =
    type === "flood"
      ? [...davaoCity.barangays].sort((a, b) => a.elevation - b.elevation)
      : type === "fire"
        ? [...davaoCity.barangays].sort(
            (a, b) =>
              Math.hypot(a.center.x - 480, a.center.y - 430) -
              Math.hypot(b.center.x - 480, b.center.y - 430)
          )
        : davaoCity.barangays;

  return sorted.slice(0, Math.max(1, count)).map((b) => b.name);
}

function buildSummary(type: DisasterType, hours: number, affected: string[]): string {
  const timeLabel = hours === 0 ? "now" : hours < 24 ? `in ${hours} hours` : `in ${Math.round(hours / 24)} days`;
  const typeLabel = { flood: "flooding", earthquake: "earthquake", fire: "fire", "power-outage": "power grid failure" }[type];
  return `AI predicts significant ${typeLabel} impact ${timeLabel}. ${affected.length} barangays affected including ${affected.slice(0, 3).join(", ")}. Immediate action recommended.`;
}

export function runSimulation(params: SimulationParams): SimulationResult {
  const hours = getHours(params.timelineStep);
  const city = davaoCity;

  let prediction: DisasterPrediction;
  let peopleImpacted = 0;

  switch (params.disasterType) {
    case "flood":
      prediction = {
        type: "flood",
        data: predictFlood(city, params.intensity, hours, params.rainfall ?? 120),
      };
      peopleImpacted = prediction.data.peopleImpacted;
      break;
    case "earthquake":
      prediction = { type: "earthquake", data: predictEarthquake(city, params.intensity, hours) };
      peopleImpacted = Math.round(city.population * params.intensity * scaleFactor(hours, params.intensity) * 0.15);
      break;
    case "fire":
      prediction = { type: "fire", data: predictFire(city, params.intensity, hours, params.windDirection ?? 45) };
      peopleImpacted = Math.round(city.population * params.intensity * scaleFactor(hours, params.intensity) * 0.08);
      break;
    case "power-outage":
      prediction = { type: "power-outage", data: predictPowerOutage(city, params.intensity, hours) };
      peopleImpacted = Math.round(city.population * prediction.data.gridFailureCascade);
      break;
  }

  const affectedBarangays = getAffectedBarangays(params.disasterType, params.intensity, hours);

  return {
    disasterType: params.disasterType,
    timelineStep: params.timelineStep,
    hoursElapsed: hours,
    prediction,
    cascade: buildCascade(params.disasterType, hours, params.intensity, prediction, params.rainfall),
    rescue: computeRescue(params.disasterType, params.intensity, hours),
    resources: computeResources(params.disasterType, params.intensity, hours, peopleImpacted),
    damage: computeDamage(params.disasterType, params.intensity, hours),
    evacuationRoutes: computeEvacuationRoutes(params.disasterType, params.intensity),
    affectedBarangays,
    summary: buildSummary(params.disasterType, hours, affectedBarangays),
  };
}

export function getSimulationState(params: SimulationParams): SimulationState {
  const hours = getHours(params.timelineStep);
  const s = scaleFactor(hours, params.intensity);
  const city = davaoCity;

  const floodLevel = params.disasterType === "flood" ? s * 4 : 0;

  const fireZones: import("../types").GeoPoint[] = [];
  if (params.disasterType === "fire") {
    const origin = { x: 480, y: 430 };
    const radius = s * 120;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spread = 0.5 + ((i * 7 + 3) % 5) * 0.1;
      fireZones.push({
        x: origin.x + Math.cos(angle) * radius * spread,
        y: origin.y + Math.sin(angle) * radius * spread,
      });
    }
  }

  const lowElevation = city.barangays.filter((b) => b.elevation < 20);
  const affectedCount = Math.ceil(lowElevation.length * s);
  const damagedBuildings = city.buildings
    .slice(0, Math.ceil(city.buildings.length * s * 0.4))
    .map((b) => b.id);

  const collapsedBuildings =
    params.disasterType === "earthquake" || params.disasterType === "fire"
      ? damagedBuildings.slice(0, Math.ceil(damagedBuildings.length * 0.4))
      : params.disasterType === "flood"
        ? damagedBuildings.filter((id) => {
            const b = city.buildings.find((x) => x.id === id);
            return b && b.floors <= 3;
          })
        : [];

  const closedRoads = city.roads.slice(0, Math.ceil(city.roads.length * s * 0.6)).map((r) => r.id);

  const powerOutages =
    params.disasterType === "power-outage" || params.disasterType === "flood"
      ? city.gridNodes.slice(0, Math.ceil(city.gridNodes.length * s)).map((g) => g.id)
      : [];

  return {
    floodLevel,
    fireZones,
    damagedBuildings,
    collapsedBuildings,
    closedRoads,
    powerOutages,
    evacuatedPopulation: Math.round(city.population * s * 0.07),
  };
}

export { davaoCity };
