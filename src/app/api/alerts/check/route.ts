import { NextResponse } from "next/server";
import { DEFAULT_ALERT_LOCATION, runAlertCheck } from "@/lib/alerts/run-check";
import { alertCheckSchema } from "@/lib/validation/alerts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = alertCheckSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { lat, lng, params, phone } = parsed.data;
    const alertPhone = phone ?? process.env.ALERT_PHONE_NUMBER ?? "";

    if (!alertPhone) {
      return NextResponse.json({ error: "No alert phone number configured" }, { status: 400 });
    }

    const result = await runAlertCheck({ lat, lng, params, phone: alertPhone });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Alert check failed" }, { status: 500 });
  }
}
