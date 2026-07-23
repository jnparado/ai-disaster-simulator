"use client";

import { useAutomatedSmsAlerts } from "@/hooks/useAutomatedSmsAlerts";
import type { SimulationParams } from "@/lib/types";

interface SmsAlertPanelProps {
  params: SimulationParams;
  defaultPhone?: string;
  autoEnable?: boolean;
  isPlaying?: boolean;
}

export function SmsAlertPanel({
  params,
  defaultPhone = "09639493290",
  autoEnable = true,
  isPlaying = false,
}: SmsAlertPanelProps) {
  const sms = useAutomatedSmsAlerts({
    params,
    defaultPhone,
    autoEnable,
    isPlaying,
  });

  return (
    <div className="rounded-xl border border-orange-500/30 bg-orange-950/20 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-lg">📱</span>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-orange-400">
              Automated SMS Alerts
            </h3>
            <p className="text-[10px] text-slate-500">Auto-sends when calamity is near you</p>
          </div>
        </div>
        {sms.enabled && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-950/40 px-2 py-0.5 text-[10px] text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            AUTO
          </span>
        )}
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs text-slate-400">Mobile number</label>
        <input
          type="tel"
          value={sms.phone}
          onChange={(e) => sms.setPhone(e.target.value)}
          disabled={sms.enabled}
          className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 disabled:opacity-60"
        />
      </div>

      {!sms.enabled ? (
        <button
          onClick={() => sms.activate()}
          disabled={sms.phone.length < 10}
          className="w-full rounded-lg bg-orange-600 py-2 text-sm font-medium text-white transition hover:bg-orange-500 disabled:opacity-50"
        >
          Start Automated SMS
        </button>
      ) : (
        <div className="space-y-2">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-400">
            Monitoring {sms.phone} · {sms.alertCount} SMS sent
            {sms.location && (
              <span className="block text-[10px] text-slate-500">
                @ {sms.location.lat.toFixed(3)}°N, {sms.location.lng.toFixed(3)}°E
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => sms.runCheck()}
              className="flex-1 rounded-lg border border-slate-700/50 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Check now
            </button>
            <button
              onClick={() => sms.deactivate()}
              className="flex-1 rounded-lg border border-red-900/50 py-1.5 text-xs text-red-400/70 hover:text-red-400"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {sms.status && <p className="mt-3 text-xs text-slate-400">{sms.status}</p>}
      {sms.lastAlert && (
        <p className="mt-1 text-[10px] text-orange-400/80">Last SMS: {sms.lastAlert}</p>
      )}
    </div>
  );
}
