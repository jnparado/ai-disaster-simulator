"use client";

import type { CascadeStep } from "@/lib/types";

interface ImpactCascadeProps {
  steps: CascadeStep[];
}

export function ImpactCascade({ steps }: ImpactCascadeProps) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Impact Cascade
      </h3>
      <div className="space-y-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-stretch gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i === 0
                    ? "bg-cyan-600/30 text-cyan-400"
                    : i === steps.length - 1
                      ? "bg-red-600/30 text-red-400"
                      : "bg-slate-700/50 text-slate-400"
                }`}
              >
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className="my-1 w-0.5 flex-1 bg-gradient-to-b from-slate-600 to-slate-700" />
              )}
            </div>
            <div className="pb-4">
              <div className="text-sm font-medium text-slate-300">{step.label}</div>
              <div className="text-lg font-bold text-white">{step.value}</div>
            </div>
            {i < steps.length - 1 && (
              <div className="hidden self-center text-slate-600 sm:block">↓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
