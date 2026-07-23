"use client";

import type { DamageEstimate } from "@/lib/types";

interface DamageEstimatorProps {
  damage: DamageEstimate;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) return `₱${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
  return `₱${n.toLocaleString()}`;
}

export function DamageEstimator({ damage }: DamageEstimatorProps) {
  const items = [
    { label: "Insurance Claims", value: damage.insuranceClaims, color: "from-blue-600 to-blue-400" },
    { label: "Repair Costs", value: damage.repairCosts, color: "from-amber-600 to-amber-400" },
    { label: "Infrastructure Damage", value: damage.infrastructureDamage, color: "from-red-600 to-red-400" },
    { label: "Economic Losses", value: damage.economicLosses, color: "from-purple-600 to-purple-400" },
  ];

  const max = Math.max(...items.map((i) => i.value));

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Damage Estimator
      </h3>
      <p className="mb-4 text-xs text-slate-500">
        Predicts insurance claims, repair costs, infrastructure damage, economic losses & recovery time
      </p>

      <div className="mb-4 rounded-lg border border-red-500/20 bg-red-950/20 p-4 text-center">
        <div className="text-xs text-red-400/80">Total Economic Impact</div>
        <div className="text-3xl font-bold text-red-400">{formatCurrency(damage.economicLosses)}</div>
        <div className="mt-1 text-sm text-slate-400">
          Estimated recovery: <span className="font-semibold text-white">{damage.recoveryDays} days</span>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const pct = max > 0 ? (item.value / max) * 100 : 0;
          return (
            <div key={item.label}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-400">{item.label}</span>
                <span className="font-semibold text-slate-200">{formatCurrency(item.value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
