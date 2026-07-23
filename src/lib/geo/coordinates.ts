import type { GeoPoint } from "../types";

/** Davao City bounding box mapped to the digital-twin coordinate space */
export const DAVAO_MAP_BOUNDS = {
  west: 125.28,
  east: 125.72,
  north: 7.32,
  south: 6.96,
  width: 850,
  height: 750,
} as const;

export const DAVAO_CENTER: [number, number] = [125.55, 7.08];

/** Real-world calamity origin points in Davao City */
export const CALAMITY_EPICENTERS = {
  flood: {
    lng: 125.468,
    lat: 7.048,
    label: "Davao River Overflow",
    description: "River breach point — primary flood origin",
  },
  earthquake: {
    lng: 125.512,
    lat: 7.078,
    label: "Seismic Epicenter",
    description: "Matina fault line — magnitude event origin",
  },
  fire: {
    lng: 125.618,
    lat: 7.082,
    label: "Sasa Industrial Zone",
    description: "Fire origin — chemical storage facility",
  },
  "power-outage": {
    lng: 125.542,
    lat: 7.092,
    label: "Central Grid Substation",
    description: "Primary grid failure cascade origin",
  },
} as const;

export function toLngLat(point: GeoPoint): [number, number] {
  const { west, east, north, south, width, height } = DAVAO_MAP_BOUNDS;
  const lng = west + (point.x / width) * (east - west);
  const lat = north - (point.y / height) * (north - south);
  return [lng, lat];
}

export function createCirclePolygon(
  center: [number, number],
  radiusKm: number,
  points = 64
): GeoJSON.Polygon {
  const [lng, lat] = center;
  const coords: [number, number][] = [];

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = radiusKm * Math.cos(angle);
    const dy = radiusKm * Math.sin(angle);
    coords.push([
      lng + dx / (111 * Math.cos((lat * Math.PI) / 180)),
      lat + dy / 111,
    ]);
  }

  return { type: "Polygon", coordinates: [coords] };
}

export function createLineString(points: GeoPoint[]): GeoJSON.LineString {
  return {
    type: "LineString",
    coordinates: points.map(toLngLat),
  };
}
