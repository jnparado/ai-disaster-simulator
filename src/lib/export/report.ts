import { buildDisasterGeoJSON, toFeatureCollection } from "../geo/disaster-zones";
import type { ScenarioState } from "../scenario/url-state";
import type { SimulationResult, SimulationState } from "../types";

export function buildSituationReport(
  state: ScenarioState,
  result: SimulationResult,
  simState: SimulationState
) {
  const geo = buildDisasterGeoJSON(
    state.disasterType,
    simState,
    state.intensity,
    result.affectedBarangays
  );

  return {
    generatedAt: new Date().toISOString(),
    scenario: state,
    summary: result.summary,
    severity: result.affectedBarangays.length,
    predictions: result.prediction,
    cascade: result.cascade,
    rescue: result.rescue,
    resources: result.resources,
    damage: result.damage,
    evacuationRoutes: result.evacuationRoutes,
    affectedBarangays: result.affectedBarangays,
    epicenter: geo.epicenterInfo,
  };
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadGeoJson(
  state: ScenarioState,
  result: SimulationResult,
  simState: SimulationState
) {
  const geo = buildDisasterGeoJSON(
    state.disasterType,
    simState,
    state.intensity,
    result.affectedBarangays
  );

  const collection = toFeatureCollection([
    geo.epicenter,
    geo.impactZone,
    ...geo.affectedBarangays,
    ...geo.rivers,
    ...geo.fireZones,
    ...geo.closedRoads,
    ...geo.hospitals,
    ...geo.evacuationCenters,
  ]);

  downloadJson(
    `davao-${state.disasterType}-${state.timelineStep}-impact.geojson`,
    collection
  );
}
