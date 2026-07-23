"use client";

import type { DisasterType } from "@/lib/types";

const DISASTERS: { id: DisasterType; label: string; icon: string; color: string }[] = [
  { id: "flood", label: "Flood", icon: "🌊", color: "from-blue-600 to-cyan-500" },
  { id: "earthquake", label: "Earthquake", icon: "🏚️", color: "from-amber-600 to-orange-500" },
  { id: "fire", label: "Fire", icon: "🔥", color: "from-red-600 to-orange-500" },
  { id: "power-outage", label: "Power Outage", icon: "⚡", color: "from-yellow-600 to-amber-500" },
];

interface DisasterSelectorProps {
  selected: DisasterType;
  onSelect: (type: DisasterType) => void;
  intensity: number;
  onIntensityChange: (v: number) => void;
}

export function DisasterSelector({
  selected,
  onSelect,
  intensity,
  onIntensityChange,
}: DisasterSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Disaster Type
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {DISASTERS.map((d) => (
            <button
              key={d.id}
              onClick={() => onSelect(d.id)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left text-xs transition-all sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm ${
                selected === d.id
                  ? `border-transparent bg-gradient-to-r ${d.color} text-white shadow-lg`
                  : "border-slate-700/50 bg-slate-800/30 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60"
              }`}
            >
              <span className="text-base sm:text-lg">{d.icon}</span>
              <span className="font-medium leading-tight">{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Intensity
          </h3>
          <span className="text-sm font-bold text-cyan-400">{Math.round(intensity * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={intensity}
          onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-500"
        />
        <div className="mt-1 flex justify-between text-[10px] text-slate-500">
          <span>Low</span>
          <span>Moderate</span>
          <span>Extreme</span>
        </div>
      </div>
    </div>
  );
}
