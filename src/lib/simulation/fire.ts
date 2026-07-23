import type { CityDigitalTwin, FirePrediction } from "../types";

const WIND_DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export function predictFire(
  city: CityDigitalTwin,
  intensity: number,
  hours: number,
  windDirection: number
): FirePrediction {
  const s = intensity * (0.3 + Math.min(1, hours / 8) * 0.7);
  const windIndex = Math.round(((windDirection % 360) / 360) * 8) % 8;

  const origin = { x: 480, y: 430 };
  const atRisk = city.buildings.filter((b) => {
    const dist = Math.hypot(b.position.x - origin.x, b.position.y - origin.y);
    return dist < 150 * s;
  });

  return {
    fireSpread: Math.min(1, s * 1.2),
    windDirection: WIND_DIRECTIONS[windIndex],
    timeUntilIgnition: Math.max(5, Math.round(60 - s * 45)),
    evacuationTiming: s > 0.6 ? "Immediate — within 30 minutes" : "Prepare — evacuate within 2 hours",
    firefighterDeployment: Math.ceil(20 + s * 80),
    waterRequirements: Math.round(50_000 + s * 450_000),
    buildingsAtRisk: atRisk.length,
  };
}
