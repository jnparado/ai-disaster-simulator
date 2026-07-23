"use client";

import { useState } from "react";
import { buildShareUrl, type ScenarioState } from "@/lib/scenario/url-state";
import { buildSituationReport, downloadGeoJson, downloadJson } from "@/lib/export/report";
import type { SimulationResult, SimulationState } from "@/lib/types";

interface ScenarioActionsProps {
  state: ScenarioState;
  result: SimulationResult;
  simState: SimulationState;
}

export function ScenarioActions({ state, result, simState }: ScenarioActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = buildShareUrl(state);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportReport = () => {
    const report = buildSituationReport(state, result, simState);
    downloadJson(
      `davao-${state.disasterType}-${state.timelineStep}-report.json`,
      report
    );
  };

  return (
    <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap">
      <button
        onClick={handleShare}
        className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-600/50 hover:text-cyan-400 sm:py-1.5"
      >
        {copied ? "✓ Link Copied" : "🔗 Share Scenario"}
      </button>
      <button
        onClick={handleExportReport}
        className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-600/50 hover:text-cyan-400 sm:py-1.5"
      >
        📄 Export Report
      </button>
      <button
        onClick={() => downloadGeoJson(state, result, simState)}
        className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-600/50 hover:text-cyan-400 min-[420px]:col-span-2 sm:col-span-1 sm:py-1.5"
      >
        🗺 Export GeoJSON
      </button>
    </div>
  );
}
