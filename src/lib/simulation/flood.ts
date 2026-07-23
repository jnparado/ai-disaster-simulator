import type { CityDigitalTwin, FloodPrediction } from "../types";

export function predictFlood(
  city: CityDigitalTwin,
  intensity: number,
  hours: number,
  rainfall = 120
): FloodPrediction {
  const timeScale = Math.min(1, hours / 12);
  const rainfallFactor = Math.min(2, 0.6 + rainfall / 200);
  const s = intensity * (0.2 + timeScale * 0.8) * rainfallFactor;

  const lowBarangays = city.barangays.filter((b) => b.elevation < 15);
  const barangaysAffected = Math.max(1, Math.ceil(lowBarangays.length * s));

  const nearRiver = city.buildings.filter((b) => {
    const minDist = city.rivers.reduce((min, river) => {
      const dist = river.points.reduce(
        (d, p) => Math.min(d, Math.hypot(b.position.x - p.x, b.position.y - p.y)),
        Infinity
      );
      return Math.min(min, dist);
    }, Infinity);
    return minDist < 80 * s;
  });

  const peopleImpacted = Math.round(
    lowBarangays.slice(0, barangaysAffected).reduce((sum, b) => sum + b.population, 0) * s
  );

  return {
    floodDepth: Math.round(s * 3.5 * 10) / 10,
    streetsAffected: Math.ceil(city.roads.length * s * 0.85),
    buildingsUnderwater: Math.ceil(nearRiver.length * s),
    peopleImpacted: Math.max(peopleImpacted, Math.round(127_000 * s)),
    evacuationRoutes: ["Calinan Highlands Road", "Diversion Road", "Tugbok Route"],
    safeZones: city.evacuationCenters.slice(0, 3).map((e) => e.name),
    roadClosures: Math.ceil(city.roads.length * s * 0.65),
    powerOutages: Math.ceil(city.gridNodes.length * s * 0.5),
    waterContamination: s > 0.5,
    barangaysAffected,
    bridgesUnsafe: Math.ceil(city.bridges.length * s * 0.75),
  };
}
