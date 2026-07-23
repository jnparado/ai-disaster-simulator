"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SimulationParams } from "@/lib/types";

const STORAGE_KEY = "sms-alerts-automated";

export interface AutomatedSmsState {
  enabled: boolean;
  phone: string;
  location: { lat: number; lng: number } | null;
  status: string;
  lastAlert: string | null;
  alertCount: number;
}

interface Options {
  params: SimulationParams;
  defaultPhone: string;
  autoEnable: boolean;
  isPlaying: boolean;
  intervalMs?: number;
}

export function useAutomatedSmsAlerts({
  params,
  defaultPhone,
  autoEnable,
  isPlaying,
  intervalMs = 30_000,
}: Options) {
  const [enabled, setEnabled] = useState(false);
  const [phone, setPhone] = useState(defaultPhone);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState("");
  const [lastAlert, setLastAlert] = useState<string | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const checkingRef = useRef(false);
  const subscribedRef = useRef(false);

  const resolveLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: 7.073, lng: 125.612 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation({ lat: 7.073, lng: 125.612 }),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
    );
  }, []);

  const runCheck = useCallback(async () => {
    if (!enabled || !location || checkingRef.current) return;
    checkingRef.current = true;

    try {
      const res = await fetch("/api/alerts/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: location.lat, lng: location.lng, params, phone }),
      });
      const data = await res.json();

      if (data.alerted) {
        const time = new Date().toLocaleTimeString();
        setLastAlert(time);
        setAlertCount((c) => c + 1);
        setStatus(`🚨 SMS sent (${data.proximity.distanceKm}km away · ${data.severity})`);
      } else if (data.proximity?.isNear) {
        setStatus(`⚠ Monitoring — ${data.proximity.distanceKm}km · ${data.reason ?? "standby"}`);
      } else {
        setStatus(`✓ Auto-monitoring active · ${phone}`);
      }
    } catch {
      setStatus("Check failed — retrying...");
    } finally {
      checkingRef.current = false;
    }
  }, [enabled, location, params, phone]);

  const activate = useCallback(async () => {
    setStatus("Automating SMS alerts...");
    try {
      if (!subscribedRef.current) {
        const res = await fetch("/api/alerts/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus(data.error ?? "Subscribe failed");
          return false;
        }
        subscribedRef.current = true;
      }
      setEnabled(true);
      localStorage.setItem(STORAGE_KEY, "true");
      resolveLocation();
      setStatus(`✓ Automated SMS active for ${phone}`);
      return true;
    } catch {
      setStatus("Failed to activate automation");
      return false;
    }
  }, [phone, resolveLocation]);

  const deactivate = useCallback(() => {
    setEnabled(false);
    localStorage.removeItem(STORAGE_KEY);
    subscribedRef.current = false;
    setStatus("Automation disabled");
  }, []);

  // Auto-enable on mount
  useEffect(() => {
    if (initialized || !defaultPhone) return;
    setInitialized(true);

    const wasEnabled = localStorage.getItem(STORAGE_KEY) === "true";
    if (autoEnable || wasEnabled) {
      activate();
    }
  }, [initialized, defaultPhone, autoEnable, activate]);

  // Run check when scenario changes
  useEffect(() => {
    if (!enabled || !location) return;
    runCheck();
  }, [enabled, location, params, runCheck]);

  // Periodic polling — faster during timeline play
  useEffect(() => {
    if (!enabled || !location) return;
    const ms = isPlaying ? Math.min(intervalMs, 10_000) : intervalMs;
    const timer = setInterval(runCheck, ms);
    return () => clearInterval(timer);
  }, [enabled, location, isPlaying, intervalMs, runCheck]);

  return {
    enabled,
    phone,
    setPhone,
    location,
    status,
    lastAlert,
    alertCount,
    activate,
    deactivate,
    runCheck,
    resolveLocation,
  };
}
