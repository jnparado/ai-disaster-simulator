"use client";

import type { SimulationResult } from "@/lib/types";
import { formatUncertainty } from "@/lib/severity";
import { StatCard } from "./StatCard";

interface PredictionPanelProps {
  result: SimulationResult;
}

export function PredictionPanel({ result }: PredictionPanelProps) {
  const { prediction } = result;

  if (prediction.type === "flood") {
    const p = prediction.data;
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Flood Depth" value={`${p.floodDepth}m`} icon="🌊" variant="danger" />
        <StatCard label="Streets Affected" value={p.streetsAffected} icon="🛣️" variant="warning" />
        <StatCard label="Buildings Underwater" value={p.buildingsUnderwater} icon="🏢" variant="danger" />
        <StatCard
          label="People Impacted"
          value={p.peopleImpacted.toLocaleString()}
          subtext={`Range: ${formatUncertainty(p.peopleImpacted)}`}
          icon="👥"
          variant="danger"
        />
        <StatCard label="Road Closures" value={p.roadClosures} icon="🚧" variant="warning" />
        <StatCard label="Bridges Unsafe" value={p.bridgesUnsafe} icon="🌉" variant="danger" />
        <StatCard label="Power Outages" value={p.powerOutages} icon="⚡" variant="warning" />
        <StatCard label="Barangays Affected" value={p.barangaysAffected} icon="📍" variant="danger" />
        <StatCard
          label="Water Contamination"
          value={p.waterContamination ? "Yes" : "No"}
          icon="💧"
          variant={p.waterContamination ? "danger" : "success"}
        />
      </div>
    );
  }

  if (prediction.type === "earthquake") {
    const p = prediction.data;
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Building Damage"
          value={`${Math.round(p.buildingDamageProbability * 100)}%`}
          icon="🏚️"
          variant="danger"
        />
        <StatCard label="Bridge Failures" value={p.bridgeFailures} icon="🌉" variant="danger" />
        <StatCard
          label="Road Accessibility"
          value={`${Math.round(p.roadAccessibility * 100)}%`}
          icon="🛣️"
          variant="warning"
        />
        <StatCard
          label="Hospital Capacity"
          value={`${Math.round(p.hospitalCapacity * 100)}%`}
          icon="🏥"
          variant="warning"
        />
        <StatCard label="Comms Outages" value={`${p.communicationOutages}%`} icon="📡" variant="danger" />
        <StatCard label="Rescue Zones" value={p.rescuePriority.length} icon="🚨" variant="warning" />
      </div>
    );
  }

  if (prediction.type === "fire") {
    const p = prediction.data;
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Fire Spread" value={`${Math.round(p.fireSpread * 100)}%`} icon="🔥" variant="danger" />
        <StatCard label="Wind Direction" value={p.windDirection} icon="💨" variant="warning" />
        <StatCard label="Time to Spread" value={`${p.timeUntilIgnition} min`} icon="⏱️" variant="danger" />
        <StatCard label="Buildings at Risk" value={p.buildingsAtRisk} icon="🏢" variant="danger" />
        <StatCard label="Firefighters" value={p.firefighterDeployment} icon="🚒" variant="warning" />
        <StatCard label="Water Required" value={`${(p.waterRequirements / 1000).toFixed(0)}k L`} icon="💧" variant="default" />
      </div>
    );
  }

  const p = prediction.data;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <StatCard
        label="Grid Failure"
        value={`${Math.round(p.gridFailureCascade * 100)}%`}
        icon="⚡"
        variant="danger"
      />
      <StatCard label="Hospitals Affected" value={p.hospitalsAffected} icon="🏥" variant="danger" />
      <StatCard label="Traffic Signals" value={p.trafficSignalFailures} icon="🚦" variant="warning" />
      <StatCard label="Internet Disruption" value={`${p.internetDisruptions}%`} icon="🌐" variant="warning" />
      <StatCard label="Cellular Degradation" value={`${p.cellularDegradation}%`} icon="📱" variant="warning" />
      <StatCard label="Restoration Time" value={`${p.estimatedRestorationHours}h`} icon="🔧" variant="default" />
    </div>
  );
}
