"use client";

import { TIMELINE_STEPS, type TimelineStep } from "@/lib/types";

interface TimelineViewProps {
  current: TimelineStep;
  onSelect: (step: TimelineStep) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export function TimelineView({ current, onSelect, isPlaying, onTogglePlay }: TimelineViewProps) {
  const currentIndex = TIMELINE_STEPS.findIndex((s) => s.id === current);

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Disaster Timeline
        </h3>
        <button
          onClick={onTogglePlay}
          className="shrink-0 flex items-center gap-1.5 rounded-lg bg-cyan-600/20 px-2.5 py-1.5 text-xs font-medium text-cyan-400 transition hover:bg-cyan-600/30 sm:px-3"
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>
      </div>

      <div className="relative -mx-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
        <div className="relative min-w-[440px] sm:min-w-[520px]">
          <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-700" />
          <div
            className="absolute left-0 top-4 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style={{ width: `${(currentIndex / (TIMELINE_STEPS.length - 1)) * 100}%` }}
          />

          <div className="relative flex justify-between">
          {TIMELINE_STEPS.map((step, i) => {
            const isActive = step.id === current;
            const isPast = i <= currentIndex;

            return (
              <button
                key={step.id}
                onClick={() => onSelect(step.id)}
                className="group flex shrink-0 snap-center flex-col items-center gap-1.5 sm:gap-2"
              >
                <div
                  className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all sm:h-8 sm:w-8 ${
                    isActive
                      ? "border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/30"
                      : isPast
                        ? "border-cyan-600 bg-cyan-900/40"
                        : "border-slate-600 bg-slate-800 group-hover:border-slate-500"
                  }`}
                >
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      isActive ? "bg-cyan-400" : isPast ? "bg-cyan-600" : "bg-slate-600"
                    }`}
                  />
                </div>
                <span
                  className={`max-w-[52px] text-center text-[9px] leading-tight sm:max-w-[60px] sm:text-[10px] ${
                    isActive ? "font-semibold text-cyan-400" : "text-slate-500"
                  }`}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}
