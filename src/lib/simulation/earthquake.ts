import type { CityDigitalTwin, EarthquakePrediction } from "../types";

export function predictEarthquake(
  city: CityDigitalTwin,
  intensity: number,
  hours: number
): EarthquakePrediction {
  const s = intensity * (0.4 + Math.min(1, hours / 6) * 0.6);

  const lowRise = city.buildings.filter((b) => b.floors <= 3);
  const highRise = city.buildings.filter((b) => b.floors > 5);

  const rescuePriority = [
    ...highRise.filter((b) => b.type === "hospital").map((b) => b.name),
    ...city.barangays.slice(0, 3).map((b) => b.name),
  ].slice(0, 5);

  const aftershockZones = city.barangays
    .filter((b) => b.elevation < 30)
    .slice(0, 4)
    .map((b) => b.name);

  return {
    buildingDamageProbability: Math.min(0.95, 0.15 + s * 0.6),
    bridgeFailures: Math.ceil(city.bridges.length * s * 0.5),
    roadAccessibility: Math.max(0.1, 1 - s * 0.7),
    hospitalCapacity: Math.max(0.2, 1 - s * 0.5),
    communicationOutages: Math.round(s * 65),
    rescuePriority,
    aftershockRiskZones: aftershockZones,
  };
}
