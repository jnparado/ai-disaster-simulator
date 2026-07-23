import { davaoCity } from "../digital-twin/davao-city";
import { CALAMITY_EPICENTERS, createCirclePolygon, createLineString, toLngLat } from "./coordinates";
import type { DisasterType, SimulationState } from "../types";

const DISASTER_COLORS: Record<DisasterType, string> = {
  flood: "#3b82f6",
  earthquake: "#f59e0b",
  fire: "#ef4444",
  "power-outage": "#eab308",
};

/** Always red on the map — marks where the calamity hits */
export const CALAMITY_HIT_COLOR = "#dc2626";
export const CALAMITY_HIT_FILL = "#ef4444";

function impactRadius(disasterType: DisasterType, intensity: number, state: SimulationState): number {
  const base = { flood: 2.5, earthquake: 4, fire: 1.8, "power-outage": 3 }[disasterType];
  const level =
    disasterType === "flood"
      ? state.floodLevel
      : disasterType === "fire"
        ? state.fireZones.length * 0.15
        : intensity;
  return base * (0.4 + level * 0.6) * intensity;
}

export function buildDisasterGeoJSON(
  disasterType: DisasterType,
  state: SimulationState,
  intensity: number,
  affectedBarangays: string[]
) {
  const epicenter = CALAMITY_EPICENTERS[disasterType];
  const radius = impactRadius(disasterType, intensity, state);
  const color = DISASTER_COLORS[disasterType];

  const epicenterFeature: GeoJSON.Feature = {
    type: "Feature",
    properties: {
      label: epicenter.label,
      description: epicenter.description,
      disasterType,
      color: CALAMITY_HIT_COLOR,
    },
    geometry: {
      type: "Point",
      coordinates: [epicenter.lng, epicenter.lat],
    },
  };

  const impactZoneFeature: GeoJSON.Feature = {
    type: "Feature",
    properties: {
      disasterType,
      radiusKm: radius,
      color: CALAMITY_HIT_COLOR,
      label: epicenter.label,
    },
    geometry: createCirclePolygon([epicenter.lng, epicenter.lat], radius),
  };

  const affectedBarangayFeatures: GeoJSON.Feature[] = davaoCity.barangays
    .filter((b) => affectedBarangays.includes(b.name))
    .map((b) => ({
      type: "Feature" as const,
      properties: {
        name: b.name,
        population: b.population,
        elevation: b.elevation,
        affected: true,
        color: CALAMITY_HIT_FILL,
      },
      geometry: createCirclePolygon(toLngLat(b.center), 0.35 + (20 - Math.min(b.elevation, 20)) * 0.04),
    }));

  const riverFeatures: GeoJSON.Feature[] = davaoCity.rivers.map((river) => ({
    type: "Feature" as const,
    properties: { name: river.name, floodLevel: state.floodLevel },
    geometry: createLineString(river.points),
  }));

  const fireFeatures: GeoJSON.Feature[] =
    disasterType === "fire"
      ? state.fireZones.map((zone, i) => ({
          type: "Feature" as const,
          properties: { index: i, color: CALAMITY_HIT_COLOR },
          geometry: createCirclePolygon(toLngLat(zone), 0.25 + intensity * 0.35),
        }))
      : [];

  const hospitalFeatures: GeoJSON.Feature[] = davaoCity.buildings
    .filter((b) => b.type === "hospital")
    .map((b) => ({
      type: "Feature" as const,
      properties: { name: b.name, type: "hospital", damaged: state.damagedBuildings.includes(b.id) },
      geometry: { type: "Point" as const, coordinates: toLngLat(b.position) },
    }));

  const evacuationFeatures: GeoJSON.Feature[] = davaoCity.evacuationCenters.map((c) => ({
    type: "Feature" as const,
    properties: { name: c.name, capacity: c.capacity, type: "evacuation" },
    geometry: { type: "Point" as const, coordinates: toLngLat(c.position) },
  }));

  const closedRoadFeatures: GeoJSON.Feature[] = davaoCity.roads
    .filter((r) => state.closedRoads.includes(r.id))
    .map((r) => ({
      type: "Feature" as const,
      properties: { name: r.name, closed: true },
      geometry: createLineString(r.points),
    }));

  return {
    color,
    epicenterInfo: epicenter,
    radius,
    epicenter: epicenterFeature,
    impactZone: impactZoneFeature,
    affectedBarangays: affectedBarangayFeatures,
    rivers: riverFeatures,
    fireZones: fireFeatures,
    hospitals: hospitalFeatures,
    evacuationCenters: evacuationFeatures,
    closedRoads: closedRoadFeatures,
  };
}

export function toFeatureCollection(features: GeoJSON.Feature[]): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features };
}
