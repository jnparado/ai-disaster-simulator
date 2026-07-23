import { normalizePhoneNumber } from "./proximity";

export interface SmsResult {
  sent: boolean;
  provider?: string;
  error?: string;
  messageId?: string;
}

function buildCalamityMessage(params: {
  disasterType: string;
  epicenterLabel: string;
  distanceKm: number;
  intensity: number;
  severity: string;
}): string {
  const typeLabel: Record<string, string> = {
    flood: "FLOOD",
    earthquake: "EARTHQUAKE",
    fire: "FIRE",
    "power-outage": "POWER OUTAGE",
  };

  return (
    `[${typeLabel[params.disasterType] ?? "DISASTER"} ALERT] ` +
    `Calamity near you in Davao City. ` +
    `${params.epicenterLabel} — ${params.distanceKm}km away. ` +
    `Severity: ${params.severity}. Intensity ${Math.round(params.intensity * 100)}%. ` +
    `Evacuate if in low areas. This is an AI simulation alert.`
  );
}

async function sendViaTwilio(to: string, body: string): Promise<SmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    return { sent: false, error: "Twilio not configured" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });

  const data = await res.json();
  if (!res.ok) {
    return { sent: false, provider: "twilio", error: data.message ?? "Twilio send failed" };
  }
  return { sent: true, provider: "twilio", messageId: data.sid };
}

async function sendViaSemaphore(to: string, body: string): Promise<SmsResult> {
  const apiKey = process.env.SEMAPHORE_API_KEY;
  if (!apiKey) return { sent: false, error: "Semaphore not configured" };

  const local = to.startsWith("+63") ? `0${to.slice(3)}` : to.replace(/\D/g, "").replace(/^63/, "0");

  const res = await fetch("https://api.semaphore.co/api/v4/messages", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      apikey: apiKey,
      number: local,
      message: body,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const errMsg =
      typeof data === "object" && data !== null && "message" in data
        ? String(data.message)
        : JSON.stringify(data);
    return { sent: false, provider: "semaphore", error: errMsg };
  }

  const first = Array.isArray(data) ? data[0] : data;
  if (first?.status === "Failed" || first?.status === "Refunded") {
    return { sent: false, provider: "semaphore", error: first.message ?? first.status };
  }

  return { sent: true, provider: "semaphore", messageId: first?.message_id ?? first?.id };
}

export async function sendCalamitySms(params: {
  phone: string;
  disasterType: string;
  epicenterLabel: string;
  distanceKm: number;
  intensity: number;
  severity: string;
}): Promise<SmsResult> {
  const to = normalizePhoneNumber(params.phone);
  const body = buildCalamityMessage(params);

  if (process.env.SEMAPHORE_API_KEY) {
    return sendViaSemaphore(to, body);
  }
  if (process.env.TWILIO_ACCOUNT_SID) {
    return sendViaTwilio(to, body);
  }

  // Dev fallback — log to console when no SMS provider configured
  if (process.env.NODE_ENV === "development") {
    console.log("[SMS SIMULATION]", to, body);
    return { sent: true, provider: "console", messageId: "dev-simulated" };
  }

  return {
    sent: false,
    error: "No SMS provider configured. Set SEMAPHORE_API_KEY or Twilio credentials in .env.local",
  };
}

export async function sendTestSms(phone: string): Promise<SmsResult> {
  const to = normalizePhoneNumber(phone);
  const body =
    "[DISASTER SIMULATOR] SMS alerts are active. You will be notified when a simulated calamity is detected near your location in Davao City.";

  if (process.env.SEMAPHORE_API_KEY) return sendViaSemaphore(to, body);
  if (process.env.TWILIO_ACCOUNT_SID) return sendViaTwilio(to, body);

  if (process.env.NODE_ENV === "development") {
    console.log("[SMS TEST]", to, body);
    return { sent: true, provider: "console", messageId: "dev-test" };
  }

  return { sent: false, error: "No SMS provider configured" };
}
