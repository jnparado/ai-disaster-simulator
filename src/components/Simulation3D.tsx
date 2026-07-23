"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { buildDisasterGeoJSON, toFeatureCollection, CALAMITY_HIT_COLOR, CALAMITY_HIT_FILL } from "@/lib/geo/disaster-zones";
import type { RouteGeometry } from "@/lib/geo/evacuation-routes";
import {
  build3DBuildingFeatures,
  buildFloodZoneFeatures,
  buildPopulationFeatures,
  FLOOD_VIEW_CENTER,
} from "@/lib/geo/simulation-3d";
import { DAVAO_CENTER, CALAMITY_EPICENTERS, toLngLat } from "@/lib/geo/coordinates";
import { davaoCity } from "@/lib/digital-twin/davao-city";
import { env } from "@/lib/env";
import type { DisasterType, SimulationState } from "@/lib/types";

interface Simulation3DProps {
  disasterType: DisasterType;
  state: SimulationState;
  intensity: number;
  affectedBarangays: string[];
  routeGeometries: RouteGeometry[];
  selectedRouteId: string;
  isPlaying: boolean;
}

function hideMapLabels(map: mapboxgl.Map) {
  const layers = map.getStyle()?.layers;
  if (!layers) return;
  for (const layer of layers) {
    if (layer.type === "symbol") {
      try {
        map.setLayoutProperty(layer.id, "visibility", "none");
      } catch {
        // Some composite layers may not allow visibility toggles.
      }
    }
  }
}

function setLayersVisibility(map: mapboxgl.Map, layerIds: string[], visible: boolean) {
  for (const id of layerIds) {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    }
  }
}

const FLOOD_CLUTTER_LAYERS = [
  "population-dots",
  "hospitals-circle",
  "evacuation-circle",
];

const CALAMITY_LAYERS = [
  "impact-zone-fill",
  "impact-zone-outline",
  "affected-barangays-fill",
  "affected-barangays-outline",
  "fire-zones-fill",
  "epicenter-outer",
  "epicenter-core",
];

const ROUTE_LAYERS = ["all-routes-line", "evacuation-routes-line"];

function barangayLabelCollection(): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: davaoCity.barangays.map((b) => ({
      type: "Feature",
      properties: { name: b.name },
      geometry: { type: "Point", coordinates: toLngLat(b.center) },
    })),
  };
}

function FloodDepthGauge({ depthMeters, isRising }: { depthMeters: number; isRising: boolean }) {
  const pct = Math.min(100, (depthMeters / 4) * 100);
  return (
    <div className="pointer-events-none absolute right-2 top-auto bottom-[4.5rem] z-10 w-28 rounded-lg border border-blue-500/40 bg-slate-900/95 p-2 backdrop-blur-sm sm:right-3 sm:top-3 sm:bottom-auto sm:w-32 sm:p-2.5">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
        Flood Depth
      </div>
      <div className="text-lg font-bold tabular-nums text-blue-300 sm:text-xl">
        {depthMeters.toFixed(1)}m
      </div>
      <div className="mt-2 h-12 overflow-hidden rounded bg-slate-800 sm:h-16">
        <div
          className={`w-full rounded-t bg-gradient-to-t from-blue-700 to-cyan-400 transition-all duration-700 ${isRising ? "animate-pulse" : ""}`}
          style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-slate-500">
        <span>0m</span>
        <span>4m critical</span>
      </div>
    </div>
  );
}

function SimulationHUD({
  disasterType,
  state,
  isPlaying,
  floodDepth,
}: {
  disasterType: DisasterType;
  state: SimulationState;
  isPlaying: boolean;
  floodDepth: number;
}) {
  const events = [
    disasterType === "flood" &&
      state.floodLevel > 0 &&
      `🌊 Water rising — ${floodDepth.toFixed(1)}m depth`,
    disasterType === "flood" &&
      state.floodLevel > 0 &&
      `🏘️ Low-elevation zones submerged`,
    state.collapsedBuildings.length > 0 && `🏚️ ${state.collapsedBuildings.length} buildings collapsed`,
    state.fireZones.length > 0 && `🔥 Fire spreading — ${state.fireZones.length} zones`,
    state.closedRoads.length > 0 && `🚧 ${state.closedRoads.length} roads closed`,
    state.evacuatedPopulation > 0 &&
      `👥 ${state.evacuatedPopulation.toLocaleString()} evacuating`,
  ].filter(Boolean) as string[];

  return (
    <div className="pointer-events-none absolute bottom-2 left-2 z-10 max-w-[calc(100%-5.5rem)] rounded-lg border border-slate-700/50 bg-slate-900/95 px-2.5 py-1.5 backdrop-blur-sm sm:bottom-3 sm:left-3 sm:max-w-[240px] sm:px-3 sm:py-2">
      <div className="mb-1 flex flex-wrap items-center gap-1.5 sm:mb-2 sm:gap-2">
        <span className="rounded bg-purple-600/80 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
          3D Simulation
        </span>
        {isPlaying && (
          <span className="flex items-center gap-1 text-[10px] text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            LIVE
          </span>
        )}
      </div>
      <div className="space-y-0.5 text-[10px] text-slate-300 sm:space-y-1 sm:text-[11px]">
        {events.length > 0 ? events.map((e) => <div key={e}>{e}</div>) : (
          <div className="text-slate-500">Monitoring conditions...</div>
        )}
      </div>
    </div>
  );
}

export function Simulation3D({
  disasterType,
  state,
  intensity,
  affectedBarangays,
  routeGeometries,
  selectedRouteId,
  isPlaying,
}: Simulation3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const animRef = useRef<number>(0);
  const [mapReady, setMapReady] = useState(false);
  const [animPhase, setAnimPhase] = useState(0);
  const [collapseProgress, setCollapseProgress] = useState(0);
  const [floodDepth, setFloodDepth] = useState(0);
  const [floodView, setFloodView] = useState(disasterType === "flood");

  isPlayingRef.current = isPlaying;

  useEffect(() => {
    let start: number | null = null;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const elapsed = (ts - start) / 1000;
      setAnimPhase(elapsed * 0.15);
      setCollapseProgress(Math.min(1, elapsed * 0.08));
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const flyToCityView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: DAVAO_CENTER,
      zoom: 11.4,
      pitch: 50,
      bearing: 0,
      duration: 2000,
    });
    setFloodView(false);
  }, []);

  const flyToCalamityView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const epicenter = CALAMITY_EPICENTERS[disasterType];
    map.flyTo({
      center: [epicenter.lng, epicenter.lat],
      zoom: disasterType === "flood" ? 12.4 : 12.8,
      pitch: 62,
      bearing: 28,
      duration: 1800,
    });
    setFloodView(disasterType === "flood");
  }, [disasterType]);

  const flyToFloodView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: FLOOD_VIEW_CENTER,
      zoom: 12.4,
      pitch: 62,
      bearing: 28,
      duration: 2000,
    });
    setFloodView(true);
  }, []);

  useEffect(() => {
    if (disasterType === "flood") {
      setFloodView(true);
    }
    const map = mapRef.current;
    if (map?.isStyleLoaded()) flyToCalamityView();
  }, [disasterType, flyToCalamityView]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.resize();
    requestAnimationFrame(() => map.resize());
    if (isPlaying) flyToCalamityView();
  }, [isPlaying, mapReady, flyToCalamityView]);

  useEffect(() => {
    if (!containerRef.current || !env.mapboxToken) return;

    mapboxgl.accessToken = env.mapboxToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: FLOOD_VIEW_CENTER,
      zoom: 12.2,
      pitch: 58,
      bearing: 20,
      antialias: true,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "bottom-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left");

    map.on("load", () => {
      hideMapLabels(map);
      map.resize();
      setMapReady(true);

      if (isPlayingRef.current) {
        const epicenter = CALAMITY_EPICENTERS[disasterType];
        map.jumpTo({
          center: [epicenter.lng, epicenter.lat],
          zoom: disasterType === "flood" ? 12.4 : 12.8,
          pitch: 62,
          bearing: 28,
        });
      }

      // 3D terrain
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.4 });

      // Atmospheric sky
      map.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0.0, 90.0],
          "sky-atmosphere-sun-intensity": 12,
        },
      });

      const empty = toFeatureCollection([]);
      [
        "impact-zone",
        "affected-barangays",
        "rivers",
        "fire-zones",
        "closed-roads",
        "hospitals",
        "evacuation-centers",
        "epicenter",
        "evacuation-routes",
        "all-routes",
        "buildings-3d",
        "flood-deep",
        "flood-shallow",
        "flood-surface",
        "population",
      ].forEach((id) => map.addSource(id, { type: "geojson", data: empty }));

      // ── Flood layers (below buildings) ──
      map.addLayer({
        id: "flood-deep-extrusion",
        type: "fill-extrusion",
        source: "flood-deep",
        paint: {
          "fill-extrusion-color": "#1d4ed8",
          "fill-extrusion-height": ["get", "waterHeight"],
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": 0.82,
        },
      });

      map.addLayer({
        id: "flood-shallow-extrusion",
        type: "fill-extrusion",
        source: "flood-shallow",
        paint: {
          "fill-extrusion-color": "#38bdf8",
          "fill-extrusion-height": ["get", "waterHeight"],
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": 0.65,
        },
      });

      map.addLayer({
        id: "flood-surface",
        type: "fill",
        source: "flood-surface",
        paint: {
          "fill-color": "#60a5fa",
          "fill-opacity": 0.35,
        },
      });

      // Mapbox 3D buildings (vector styles only)
      if (map.getSource("composite")) {
        map.addLayer({
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", ["get", "extrude"], "true"],
          type: "fill-extrusion",
          minzoom: 10,
          paint: {
            "fill-extrusion-color": "#64748b",
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": ["get", "min_height"],
            "fill-extrusion-opacity": 0.65,
          },
        });
      }

      // Digital twin buildings
      map.addLayer({
        id: "buildings-3d-extrusion",
        type: "fill-extrusion",
        source: "buildings-3d",
        paint: {
          "fill-extrusion-color": ["get", "color"],
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-opacity": 0.9,
        },
      });

      map.addLayer({
        id: "rivers-line",
        type: "line",
        source: "rivers",
        paint: { "line-color": "#172554", "line-width": 6, "line-opacity": 0.9 },
      });

      map.addLayer({
        id: "population-dots",
        type: "circle",
        source: "population",
        paint: {
          "circle-radius": 5,
          "circle-color": "#facc15",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      map.addLayer({
        id: "fire-zones-fill",
        type: "fill",
        source: "fire-zones",
        paint: { "fill-color": CALAMITY_HIT_COLOR, "fill-opacity": 0.5 },
      });
      map.addLayer({
        id: "all-routes-line",
        type: "line",
        source: "all-routes",
        paint: { "line-color": ["get", "color"], "line-width": 2, "line-opacity": 0.4 },
      });
      map.addLayer({
        id: "evacuation-routes-line",
        type: "line",
        source: "evacuation-routes",
        paint: { "line-color": ["get", "color"], "line-width": 6, "line-opacity": 0.95 },
      });
      map.addLayer({
        id: "closed-roads-line",
        type: "line",
        source: "closed-roads",
        paint: { "line-color": "#dc2626", "line-width": 4, "line-dasharray": [2, 2] },
      });
      map.addLayer({
        id: "hospitals-circle",
        type: "circle",
        source: "hospitals",
        paint: {
          "circle-radius": 8,
          "circle-color": ["case", ["get", "damaged"], "#991b1b", "#ef4444"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });
      map.addLayer({
        id: "evacuation-circle",
        type: "circle",
        source: "evacuation-centers",
        paint: {
          "circle-radius": 7,
          "circle-color": "#10b981",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });
      map.addLayer({
        id: "epicenter-outer",
        type: "circle",
        source: "epicenter",
        paint: {
          "circle-radius": 36,
          "circle-color": CALAMITY_HIT_COLOR,
          "circle-opacity": 0.22,
          "circle-stroke-width": 2,
          "circle-stroke-color": CALAMITY_HIT_COLOR,
          "circle-stroke-opacity": 0.6,
        },
      });
      map.addLayer({
        id: "epicenter-core",
        type: "circle",
        source: "epicenter",
        paint: {
          "circle-radius": 16,
          "circle-color": CALAMITY_HIT_COLOR,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Calamity hit zones — rendered on top of flood water
      map.addLayer({
        id: "impact-zone-fill",
        type: "fill",
        source: "impact-zone",
        paint: { "fill-color": CALAMITY_HIT_COLOR, "fill-opacity": 0.35 },
      });
      map.addLayer({
        id: "impact-zone-outline",
        type: "line",
        source: "impact-zone",
        paint: {
          "line-color": "#991b1b",
          "line-width": 3,
          "line-opacity": 0.9,
        },
      });
      map.addLayer({
        id: "affected-barangays-fill",
        type: "fill",
        source: "affected-barangays",
        paint: { "fill-color": CALAMITY_HIT_FILL, "fill-opacity": 0.55 },
      });
      map.addLayer({
        id: "affected-barangays-outline",
        type: "line",
        source: "affected-barangays",
        paint: {
          "line-color": CALAMITY_HIT_COLOR,
          "line-width": 2.5,
          "line-opacity": 0.95,
        },
      });

      map.addSource("barangay-labels", { type: "geojson", data: barangayLabelCollection() });
      map.addLayer({
        id: "barangay-labels",
        type: "symbol",
        source: "barangay-labels",
        minzoom: 10,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-anchor": "center",
          "text-offset": [0, 0.6],
        },
        paint: {
          "text-color": "#f1f5f9",
          "text-halo-color": "#0f172a",
          "text-halo-width": 1.5,
        },
      });

      // Toggle flood layer visibility
      const floodLayers = ["flood-deep-extrusion", "flood-shallow-extrusion", "flood-surface"];
      floodLayers.forEach((id) => {
        map.setLayoutProperty(id, "visibility", disasterType === "flood" ? "visible" : "none");
      });
    });

    mapRef.current = map;

    const resize = () => map.resize();
    window.addEventListener("resize", resize);
    resizeObserverRef.current = new ResizeObserver(resize);
    resizeObserverRef.current.observe(containerRef.current);
    requestAnimationFrame(resize);

    return () => {
      window.removeEventListener("resize", resize);
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const pulse = isPlaying ? Math.sin(animPhase * Math.PI * 2) * 0.5 + 0.5 : 0.25;
    const collapse = isPlaying ? collapseProgress : Math.min(1, state.collapsedBuildings.length * 0.15);
    const isFlood = disasterType === "flood";
    const activeFloodLevel = isFlood ? state.floodLevel : 0;

    const updateLayers = () => {
      const geo = buildDisasterGeoJSON(disasterType, state, intensity, affectedBarangays);

      const setSource = (id: string, features: GeoJSON.Feature[]) => {
        const source = map.getSource(id) as mapboxgl.GeoJSONSource | undefined;
        source?.setData(toFeatureCollection(features));
      };

      setSource("impact-zone", [
        { ...geo.impactZone, properties: { ...geo.impactZone.properties, color: geo.color } },
      ]);
      setSource("affected-barangays", geo.affectedBarangays);
      setSource("rivers", geo.rivers);
      setSource("fire-zones", geo.fireZones);
      setSource("closed-roads", geo.closedRoads);
      setSource("hospitals", geo.hospitals);
      setSource("evacuation-centers", geo.evacuationCenters);
      setSource("epicenter", [geo.epicenter]);

      // 3D flood zones
      const floodZones = buildFloodZoneFeatures(activeFloodLevel, pulse, affectedBarangays);
      setFloodDepth(floodZones.depthMeters);

      setSource("flood-deep", floodZones.deep);
      setSource("flood-shallow", floodZones.shallow);
      setSource("flood-surface", floodZones.surface);

      const floodLayers = ["flood-deep-extrusion", "flood-shallow-extrusion", "flood-surface"];
      floodLayers.forEach((id) => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, "visibility", isFlood && activeFloodLevel > 0 ? "visible" : "none");
        }
      });

      if (map.getLayer("flood-deep-extrusion")) {
        map.setPaintProperty("flood-deep-extrusion", "fill-extrusion-opacity", 0.7 + pulse * 0.15);
      }

      if (map.getLayer("epicenter-core")) {
        map.setPaintProperty("epicenter-core", "circle-radius", 14 + pulse * 6);
      }
      if (map.getLayer("epicenter-outer")) {
        map.setPaintProperty("epicenter-outer", "circle-radius", 30 + pulse * 18);
        map.setPaintProperty("epicenter-outer", "circle-opacity", 0.18 + pulse * 0.12);
      }
      if (map.getLayer("impact-zone-fill")) {
        map.setPaintProperty("impact-zone-fill", "fill-opacity", 0.28 + pulse * 0.12);
      }

      setSource(
        "buildings-3d",
        build3DBuildingFeatures(
          state.damagedBuildings,
          state.collapsedBuildings,
          collapse,
          activeFloodLevel
        )
      );

      const selectedRoute = routeGeometries.find((r) => r.id === selectedRouteId && r.geometry);
      const routeCoords = (selectedRoute?.geometry?.coordinates ?? []) as [number, number][];
      const popCount = Math.min(40, Math.ceil(state.evacuatedPopulation / 3000));
      setSource(
        "population",
        buildPopulationFeatures(routeCoords, popCount, isPlaying ? animPhase : 0)
      );

      setSource(
        "all-routes",
        routeGeometries
          .filter((r) => r.geometry)
          .map((r) => ({
            type: "Feature" as const,
            properties: { color: r.color },
            geometry: r.geometry!,
          }))
      );
      setSource(
        "evacuation-routes",
        selectedRoute
          ? [{ type: "Feature" as const, properties: { color: selectedRoute.color }, geometry: selectedRoute.geometry! }]
          : []
      );

      setLayersVisibility(map, FLOOD_CLUTTER_LAYERS, true);
      setLayersVisibility(map, CALAMITY_LAYERS, true);
      setLayersVisibility(map, ROUTE_LAYERS, routeGeometries.some((r) => r.geometry));
    };

    if (map.isStyleLoaded()) updateLayers();
    else map.once("load", updateLayers);
  }, [
    disasterType,
    state,
    intensity,
    affectedBarangays,
    routeGeometries,
    selectedRouteId,
    animPhase,
    collapseProgress,
    isPlaying,
    floodView,
  ]);

  if (!env.mapboxToken) {
    return (
      <div className="flex h-[min(50vh,420px)] flex-col items-center justify-center gap-3 rounded-xl border border-slate-700/50 bg-slate-900 px-4 sm:h-[580px]">
        <p className="text-center text-sm font-medium text-slate-300">Map unavailable</p>
        <p className="max-w-sm text-center text-xs text-slate-500">
          Set <code className="text-cyan-400">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> in{" "}
          <code className="text-slate-400">.env.local</code> (local) or Vercel Environment
          Variables (live) to enable the disaster map.
        </p>
      </div>
    );
  }

  const mapHeightClass = isPlaying
    ? "h-[min(58vh,480px)] sm:h-[min(62vh,560px)] md:h-[min(75vh,680px)]"
    : "h-[min(50vh,420px)] sm:h-[min(55vh,520px)] md:h-[min(70vh,620px)]";

  return (
    <div
      className={`relative w-full min-w-0 overflow-hidden rounded-lg border bg-slate-900 shadow-lg sm:rounded-xl ${
        isPlaying
          ? "border-red-500/40 shadow-red-950/20"
          : "border-blue-500/30 shadow-blue-950/30"
      }`}
    >
      <div className="absolute left-2 top-2 z-10 flex max-w-[calc(100%-1rem)] flex-col gap-1.5 sm:left-3 sm:top-3 sm:max-w-none sm:gap-2">
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <span className="rounded bg-blue-600/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white sm:px-2 sm:text-[10px]">
            3D Terrain
          </span>
          <span className="rounded border border-red-500/50 bg-red-950/80 px-1.5 py-0.5 text-[9px] font-semibold text-red-300 sm:px-2 sm:text-[10px]">
            ● Calamity zone
          </span>
          {isPlaying && (
            <span className="animate-pulse rounded bg-red-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white sm:px-2 sm:text-[10px]">
              ▶ LIVE
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 sm:flex-col sm:gap-2">
        <button
          onClick={flyToCityView}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition sm:px-3 sm:py-1.5 sm:text-xs ${
            !floodView
              ? "bg-slate-700 text-white"
              : "border border-slate-500/50 bg-slate-900/90 text-slate-300 hover:bg-slate-800"
          }`}
        >
          🗺 City Overview
        </button>
        <button
          onClick={flyToFloodView}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition sm:px-3 sm:py-1.5 sm:text-xs ${
            floodView
              ? "bg-blue-600 text-white"
              : "border border-blue-500/50 bg-slate-900/90 text-blue-400 hover:bg-blue-950"
          }`}
        >
          🌊 3D Flood View
        </button>
        </div>
      </div>

      {disasterType === "flood" && state.floodLevel > 0 && (
        <FloodDepthGauge depthMeters={floodDepth} isRising={isPlaying} />
      )}

      <SimulationHUD
        disasterType={disasterType}
        state={state}
        isPlaying={isPlaying}
        floodDepth={floodDepth}
      />

      {!mapReady && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center bg-slate-900/90">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            <span className="text-xs text-slate-400">Loading live map…</span>
          </div>
        </div>
      )}

      <div ref={containerRef} className={`${mapHeightClass} w-full min-w-0 bg-slate-800 transition-[height] duration-500`} />
    </div>
  );
}
