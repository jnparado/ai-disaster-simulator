import type { CityDigitalTwin, PowerOutagePrediction } from "../types";

export function predictPowerOutage(
  city: CityDigitalTwin,
  intensity: number,
  hours: number
): PowerOutagePrediction {
  const s = intensity * (0.25 + Math.min(1, hours / 48) * 0.75);

  const hospitals = city.buildings.filter((b) => b.type === "hospital");
  const hospitalsAffected = Math.ceil(hospitals.length * s);

  const trafficSignals = Math.ceil(city.roads.length * 4 * s);
  const totalIntersections = city.roads.length * 4;

  return {
    gridFailureCascade: Math.min(0.95, s * 0.85),
    hospitalsAffected,
    trafficSignalFailures: Math.min(trafficSignals, totalIntersections),
    internetDisruptions: Math.round(s * 70),
    cellularDegradation: Math.round(s * 55),
    estimatedRestorationHours: Math.ceil(4 + s * intensity * 72),
  };
}
