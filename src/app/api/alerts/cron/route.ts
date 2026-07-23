import { NextResponse } from "next/server";
import { DEFAULT_ALERT_LOCATION, runAlertCheck } from "@/lib/alerts/run-check";
import { env } from "@/lib/env";
import type { TimelineStep } from "@/lib/types";

/**
 * Automated SMS cron — call on a schedule (e.g. every 5 min) or on server start.
 * GET /api/alerts/cron?secret=YOUR_CRON_SECRET
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const provided = searchParams.get("secret");

  if (secret && provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const phone = process.env.ALERT_PHONE_NUMBER ?? "";
  if (!phone) {
    return NextResponse.json({ error: "ALERT_PHONE_NUMBER not configured" }, { status: 400 });
  }

  const params = {
    disasterType: env.defaultDisaster,
    intensity: parseFloat(process.env.DEFAULT_INTENSITY ?? "0.75"),
    timelineStep: (process.env.DEFAULT_TIMELINE ?? "+3h") as TimelineStep,
    rainfall: parseInt(process.env.DEFAULT_RAINFALL ?? "120", 10),
    windDirection: parseInt(process.env.DEFAULT_WIND ?? "45", 10),
  };

  const lat = parseFloat(process.env.ALERT_LAT ?? String(DEFAULT_ALERT_LOCATION.lat));
  const lng = parseFloat(process.env.ALERT_LNG ?? String(DEFAULT_ALERT_LOCATION.lng));

  const result = await runAlertCheck({ lat, lng, params, phone });

  return NextResponse.json({
    automated: true,
    timestamp: new Date().toISOString(),
    phone,
    params,
    ...result,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
