"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdvancedControls } from "./AdvancedControls";
import { AlertBanner } from "./AlertBanner";
import { DamageEstimator } from "./DamageEstimator";
import { Simulation3D } from "./Simulation3D";
import { DisasterSelector } from "./DisasterSelector";
import { EmergencyAssistant } from "./EmergencyAssistant";
import { EvacuationPlanner } from "./EvacuationPlanner";
import { ImpactCascade } from "./ImpactCascade";
import { PredictionPanel } from "./PredictionPanel";
import { RescueOptimizer } from "./RescueOptimizer";
import { ResourcePlanner } from "./ResourcePlanner";
import { ScenarioActions } from "./ScenarioActions";
import { SmsAlertPanel } from "./SmsAlertPanel";
import { TimelineView } from "./TimelineView";
import { env } from "@/lib/env";
import { fetchEvacuationRouteGeometries, type RouteGeometry } from "@/lib/geo/evacuation-routes";
import { getSimulationState, runSimulation } from "@/lib/simulation/engine";
import { davaoCity } from "@/lib/digital-twin/davao-city";
import { decodeScenario, encodeScenario, type ScenarioState } from "@/lib/scenario/url-state";
import { TIMELINE_STEPS, type DisasterType, type TimelineStep } from "@/lib/types";

function defaultState(): ScenarioState {
  return {
    disasterType: env.defaultDisaster,
    intensity: 0.75,
    timelineStep: "+3h",
    windDirection: 45,
    rainfall: 120,
  };
}

export function Dashboard() {
  const searchParams = useSearchParams();
  const defaults = useMemo(() => defaultState(), []);

  const [disasterType, setDisasterType] = useState<DisasterType>(defaults.disasterType);
  const [intensity, setIntensity] = useState(defaults.intensity);
  const [timelineStep, setTimelineStep] = useState<TimelineStep>(defaults.timelineStep);
  const [windDirection, setWindDirection] = useState(defaults.windDirection);
  const [rainfall, setRainfall] = useState(defaults.rainfall);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("route-safest");
  const [routeGeometries, setRouteGeometries] = useState<RouteGeometry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const scenarioState: ScenarioState = useMemo(
    () => ({ disasterType, intensity, timelineStep, windDirection, rainfall }),
    [disasterType, intensity, timelineStep, windDirection, rainfall]
  );

  const params = useMemo(
    () => ({ disasterType, intensity, timelineStep, windDirection, rainfall }),
    [disasterType, intensity, timelineStep, windDirection, rainfall]
  );

  const result = useMemo(() => runSimulation(params), [params]);
  const simState = useMemo(() => getSimulationState(params), [params]);

  // Hydrate from URL on mount
  useEffect(() => {
    const decoded = decodeScenario(searchParams.toString(), defaults);
    setDisasterType(decoded.disasterType);
    setIntensity(decoded.intensity);
    setTimelineStep(decoded.timelineStep);
    setWindDirection(decoded.windDirection);
    setRainfall(decoded.rainfall);
    setHydrated(true);
  }, [searchParams, defaults]);

  // Sync URL when scenario changes
  useEffect(() => {
    if (!hydrated) return;
    const query = encodeScenario(scenarioState);
    window.history.replaceState(null, "", `?${query}`);
  }, [scenarioState, hydrated]);

  // Fetch real evacuation routes from Mapbox Directions
  useEffect(() => {
    if (!env.mapboxToken) return;
    let cancelled = false;

    fetchEvacuationRouteGeometries(disasterType, result.evacuationRoutes, env.mapboxToken).then(
      (routes) => {
        if (!cancelled) setRouteGeometries(routes);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [disasterType, result.evacuationRoutes]);

  const advanceTimeline = useCallback(() => {
    setTimelineStep((current) => {
      const idx = TIMELINE_STEPS.findIndex((s) => s.id === current);
      if (idx < TIMELINE_STEPS.length - 1) return TIMELINE_STEPS[idx + 1].id;
      setIsPlaying(false);
      return current;
    });
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(advanceTimeline, 2000);
    return () => clearInterval(timer);
  }, [isPlaying, advanceTimeline]);

  const routesWithGeometry = useMemo(() => {
    if (routeGeometries.length === 0) return result.evacuationRoutes;
    return routeGeometries;
  }, [routeGeometries, result.evacuationRoutes]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-4">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-base font-bold sm:h-10 sm:w-10 sm:text-lg">
              AI
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight sm:text-lg">{env.appName}</h1>
              <p className="truncate text-[11px] text-slate-400 sm:text-xs">
                Digital Twin: {davaoCity.name} · {davaoCity.population.toLocaleString()} residents
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <ScenarioActions state={scenarioState} result={result} simState={simState} />
            <div className="flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-3 py-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">
                {env.aiAssistantEnabled ? "AI + LLM Active" : "AI Engine Active"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-4 sm:py-6">
        <div className="mb-3 sm:mb-4">
          <AlertBanner params={params} />
        </div>

        <div className="mb-4 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 p-3 sm:mb-6 sm:p-4">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <span className="text-xl sm:text-2xl">🤖</span>
            <div className="min-w-0">
              <h2 className="text-xs font-semibold text-cyan-400 sm:text-sm">AI Prediction Summary</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-300 sm:text-sm">{result.summary}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
          <div className="order-2 min-w-0 space-y-4 lg:order-1 lg:col-span-3">
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
              <DisasterSelector
                selected={disasterType}
                onSelect={setDisasterType}
                intensity={intensity}
                onIntensityChange={setIntensity}
              />
            </div>

            <AdvancedControls
              disasterType={disasterType}
              windDirection={windDirection}
              rainfall={rainfall}
              onWindChange={setWindDirection}
              onRainfallChange={setRainfall}
            />

            <SmsAlertPanel
              params={params}
              defaultPhone={env.alertPhonePublic || "09639493290"}
              autoEnable={env.smsAlertsAuto}
              isPlaying={isPlaying}
            />

            <ImpactCascade steps={result.cascade} />

            <EmergencyAssistant params={params} />
          </div>

          <div className="order-1 min-w-0 space-y-4 lg:order-2 lg:col-span-6">
            <TimelineView
              current={timelineStep}
              onSelect={setTimelineStep}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying((p) => !p)}
            />

            <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/60 p-2 sm:p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 sm:mb-3">
                Interactive Disaster Map
              </h3>
              <Simulation3D
                disasterType={disasterType}
                state={simState}
                intensity={intensity}
                affectedBarangays={result.affectedBarangays}
                routeGeometries={routeGeometries}
                selectedRouteId={selectedRouteId}
                isPlaying={isPlaying}
              />
            </div>

            <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                AI Impact Predictions
              </h3>
              <PredictionPanel result={result} />
            </div>
          </div>

          <div className="order-3 min-w-0 space-y-4 lg:col-span-3">
            <EvacuationPlanner
              routes={routesWithGeometry}
              selectedRouteId={selectedRouteId}
              onSelectRoute={setSelectedRouteId}
            />
            <RescueOptimizer deployment={result.rescue} />
            <ResourcePlanner resources={result.resources} />
            <DamageEstimator damage={result.damage} />
          </div>
        </div>
      </main>
    </div>
  );
}
