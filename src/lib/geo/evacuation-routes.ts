import { davaoCity } from "../digital-twin/davao-city";
import { CALAMITY_EPICENTERS, toLngLat } from "./coordinates";
import type { DisasterType, EvacuationRoute } from "../types";

const ROUTE_DESTINATIONS: Record<EvacuationRoute["type"], string> = {
  safest: "e003",
  "avoid-flood": "e004",
  "least-congested": "e002",
  emergency: "h001",
};

const ROUTE_COLORS: Record<EvacuationRoute["type"], string> = {
  safest: "#10b981",
  "avoid-flood": "#3b82f6",
  "least-congested": "#06b6d4",
  emergency: "#f59e0b",
};

export interface RouteGeometry extends EvacuationRoute {
  geometry?: GeoJSON.LineString;
  color: string;
}

interface DirectionsResponse {
  routes?: {
    geometry: GeoJSON.LineString;
    distance: number;
    duration: number;
  }[];
}

export async function fetchRouteGeometry(
  from: [number, number],
  to: [number, number],
  token: string
): Promise<{ geometry: GeoJSON.LineString; distance: number; duration: number } | null> {
  const coords = `${from[0]},${from[1]};${to[0]},${to[1]}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&access_token=${token}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as DirectionsResponse;
    const route = data.routes?.[0];
    if (!route) return null;
    return {
      geometry: route.geometry,
      distance: route.distance / 1000,
      duration: Math.ceil(route.duration / 60),
    };
  } catch {
    return null;
  }
}

function getDestinationCoords(type: EvacuationRoute["type"]): [number, number] {
  const id = ROUTE_DESTINATIONS[type];
  const building = davaoCity.buildings.find((b) => b.id === id);
  if (building) return toLngLat(building.position);
  const center = davaoCity.evacuationCenters.find((e) => e.id === id);
  if (center) return toLngLat(center.position);
  return toLngLat(davaoCity.evacuationCenters[0].position);
}

export async function fetchEvacuationRouteGeometries(
  disasterType: DisasterType,
  routes: EvacuationRoute[],
  token: string
): Promise<RouteGeometry[]> {
  const epicenter = CALAMITY_EPICENTERS[disasterType];
  const from: [number, number] = [epicenter.lng, epicenter.lat];

  const results = await Promise.all(
    routes.map(async (route) => {
      const to = getDestinationCoords(route.type);
      const fetched = await fetchRouteGeometry(from, to, token);

      return {
        ...route,
        color: ROUTE_COLORS[route.type],
        distance: fetched?.distance ?? route.distance,
        estimatedTime: fetched?.duration ?? route.estimatedTime,
        geometry: fetched?.geometry,
      };
    })
  );

  return results;
}
