import { davaoCity } from "../digital-twin/davao-city";
import { createCirclePolygon, toLngLat } from "./coordinates";
import type { GeoPoint } from "../types";

/** Davao River — optimal 3D flood camera */
export const FLOOD_VIEW_CENTER: [number, number] = [125.485, 7.065];

function footprint(center: [number, number], size = 0.00025): GeoJSON.Polygon {
  const [lng, lat] = center;
  return {
    type: "Polygon",
    coordinates: [
      [
        [lng - size, lat - size],
        [lng + size, lat - size],
        [lng + size, lat + size],
        [lng - size, lat + size],
        [lng - size, lat - size],
      ],
    ],
  };
}

/** Buffer polygon along a river path */
function riverCorridorPolygon(points: GeoPoint[], widthKm: number): GeoJSON.Polygon {
  const coords = points.map(toLngLat);
  const left: [number, number][] = [];
  const right: [number, number][] = [];

  for (let i = 0; i < coords.length; i++) {
    const [lng, lat] = coords[i];
    const latRad = (lat * Math.PI) / 180;
    const dx = (widthKm / (111 * Math.cos(latRad))) * (1 + i * 0.05);
    const dy = widthKm / 111;

    let nx = 0;
    let ny = 1;
    if (i < coords.length - 1) {
      const [nlng, nlat] = coords[i + 1];
      const len = Math.hypot(nlng - lng, nlat - lat) || 1;
      nx = -(nlat - lat) / len;
      ny = (nlng - lng) / len;
    }

    left.push([lng + nx * dx, lat + ny * dy]);
    right.push([lng - nx * dx, lat - ny * dy]);
  }

  const ring = [...left, ...[...right].reverse(), left[0]];
  return { type: "Polygon", coordinates: [ring] };
}

export function getFloodDepthMeters(floodLevel: number, animPulse: number): number {
  return Math.max(0.3, floodLevel * 0.85 + animPulse * 0.4);
}

export interface FloodLayerFeatures {
  deep: GeoJSON.Feature[];
  shallow: GeoJSON.Feature[];
  surface: GeoJSON.Feature[];
  depthMeters: number;
}

export function buildFloodZoneFeatures(
  floodLevel: number,
  animPulse: number,
  affectedBarangays: string[]
): FloodLayerFeatures {
  if (floodLevel <= 0) {
    return { deep: [], shallow: [], surface: [], depthMeters: 0 };
  }

  const depthMeters = getFloodDepthMeters(floodLevel, animPulse);
  const corridorWidth = 0.4 + floodLevel * 0.55;
  const features: GeoJSON.Feature[] = [];

  // River corridors — primary flood path
  for (const river of davaoCity.rivers) {
    const corridor = riverCorridorPolygon(river.points, corridorWidth);
    features.push({
      type: "Feature",
      properties: { zone: "river", waterHeight: depthMeters * 1.2, depth: depthMeters },
      geometry: corridor,
    });
  }

  // Low-elevation barangays — shallow flood zones
  const shallowFeatures: GeoJSON.Feature[] = davaoCity.barangays
    .filter((b) => b.elevation < 20 && affectedBarangays.includes(b.name))
    .map((b) => {
      const radius = 0.25 + (20 - b.elevation) * 0.04 + floodLevel * 0.15;
      const shallowDepth = depthMeters * (0.4 + (b.elevation / 20) * 0.4);
      return {
        type: "Feature" as const,
        properties: {
          zone: "barangay",
          name: b.name,
          waterHeight: shallowDepth,
          depth: shallowDepth,
        },
        geometry: createCirclePolygon(toLngLat(b.center), radius),
      };
    });

  // Deep zones at river points (overflow points)
  const deepFeatures: GeoJSON.Feature[] = davaoCity.rivers.flatMap((river) =>
    river.points.map((p, i) => ({
      type: "Feature" as const,
      properties: {
        zone: "deep",
        waterHeight: depthMeters * (1.3 + (i % 3) * 0.15),
        depth: depthMeters,
      },
      geometry: createCirclePolygon(toLngLat(p), corridorWidth * 0.7),
    }))
  );

  // 2D surface shimmer layer (flat water plane)
  const surfaceFeatures: GeoJSON.Feature[] = features.map((f) => ({
    ...f,
    properties: { ...f.properties, zone: "surface" },
  }));

  return {
    deep: [...features, ...deepFeatures],
    shallow: shallowFeatures,
    surface: [...surfaceFeatures, ...shallowFeatures],
    depthMeters,
  };
}

export function build3DBuildingFeatures(
  damagedIds: string[],
  collapsedIds: string[],
  collapseProgress: number,
  floodLevel = 0
): GeoJSON.Feature[] {
  const floodDepth = floodLevel > 0 ? getFloodDepthMeters(floodLevel, 0) : 0;

  return davaoCity.buildings.map((b) => {
    const coords = toLngLat(b.position);
    const barangay = davaoCity.barangays.find(
      (bg) => Math.hypot(bg.center.x - b.position.x, bg.center.y - b.position.y) < 80
    );
    const elevation = barangay?.elevation ?? 20;
    const isSubmerged = floodLevel > 0 && elevation < 15 && floodDepth > elevation * 0.08;

    const isDamaged = damagedIds.includes(b.id);
    const isCollapsed = collapsedIds.includes(b.id);
    const baseHeight = b.floors * 4;
    let height = isCollapsed
      ? Math.max(1, baseHeight * (1 - collapseProgress))
      : isDamaged
        ? baseHeight * 0.6
        : baseHeight;

    if (isSubmerged) {
      height = Math.max(1, height * 0.35);
    }

    const colors: Record<string, string> = {
      hospital: "#ef4444",
      school: "#3b82f6",
      commercial: "#eab308",
      government: "#a855f7",
      police: "#6366f1",
      fire: "#f97316",
      residential: "#64748b",
    };

    let color = isCollapsed ? "#450a0a" : isDamaged ? "#991b1b" : colors[b.type] ?? "#64748b";
    if (isSubmerged) color = "#1e3a5f";

    return {
      type: "Feature" as const,
      properties: {
        id: b.id,
        name: b.name,
        submerged: isSubmerged,
        height,
        color,
      },
      geometry: footprint(coords, 0.0002 + b.floors * 0.00003),
    };
  });
}

export function buildPopulationFeatures(
  routeCoords: [number, number][],
  count: number,
  animPhase: number
): GeoJSON.Feature[] {
  if (routeCoords.length < 2 || count === 0) return [];

  const features: GeoJSON.Feature[] = [];
  for (let i = 0; i < Math.min(count, 40); i++) {
    const t = (i / count + animPhase) % 1;
    const idx = Math.floor(t * (routeCoords.length - 1));
    const frac = t * (routeCoords.length - 1) - idx;
    const a = routeCoords[idx];
    const b = routeCoords[Math.min(idx + 1, routeCoords.length - 1)];

    features.push({
      type: "Feature",
      properties: { id: i },
      geometry: {
        type: "Point",
        coordinates: [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac],
      },
    });
  }
  return features;
}

/** @deprecated use buildFloodZoneFeatures */
export function buildFloodWaterFeatures(
  riverPoints: { x: number; y: number }[][],
  floodLevel: number,
  animPulse: number
): GeoJSON.Feature[] {
  const zones = buildFloodZoneFeatures(floodLevel, animPulse, []);
  return [...zones.deep, ...zones.shallow];
}
