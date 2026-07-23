"use client";

import type { DisasterType } from "@/lib/types";

interface AdvancedControlsProps {
  disasterType: DisasterType;
  windDirection: number;
  rainfall: number;
  onWindChange: (v: number) => void;
  onRainfallChange: (v: number) => void;
}

const WIND_LABELS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function windLabel(degrees: number): string {
  const index = Math.round(((degrees % 360) / 360) * 8) % 8;
  return WIND_LABELS[index];
}

export function AdvancedControls({
  disasterType,
  windDirection,
  rainfall,
  onWindChange,
  onRainfallChange,
}: AdvancedControlsProps) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Environmental Parameters
      </h3>

      {disasterType === "flood" && (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-slate-300">Rainfall (24h)</span>
            <span className="text-sm font-bold text-blue-400">{rainfall} mm</span>
          </div>
          <input
            type="range"
            min={20}
            max={400}
            step={10}
            value={rainfall}
            onChange={(e) => onRainfallChange(parseInt(e.target.value, 10))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-blue-500"
          />
          <div className="mt-1 flex justify-between text-[10px] text-slate-500">
            <span>Light</span>
            <span>Heavy</span>
            <span>Extreme</span>
          </div>
        </div>
      )}

      {disasterType === "fire" && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-slate-300">Wind Direction</span>
            <span className="text-sm font-bold text-orange-400">
              {windLabel(windDirection)} ({windDirection}°)
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={359}
            step={1}
            value={windDirection}
            onChange={(e) => onWindChange(parseInt(e.target.value, 10))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-orange-500"
          />
          <p className="mt-2 text-xs text-slate-500">
            Wind drives fire spread direction and evacuation timing.
          </p>
        </div>
      )}

      {disasterType !== "flood" && disasterType !== "fire" && (
        <p className="text-xs text-slate-500">
          No additional environmental controls for this disaster type.
        </p>
      )}
    </div>
  );
}
