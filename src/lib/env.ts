import type { DisasterType } from "./types";

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "AI Disaster Impact Simulator",
  defaultCity: process.env.NEXT_PUBLIC_DEFAULT_CITY ?? "Davao City",
  defaultDisaster: (process.env.NEXT_PUBLIC_DEFAULT_DISASTER ?? "flood") as DisasterType,
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "",
  aiAssistantEnabled: process.env.AI_ASSISTANT_ENABLED === "true",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  alertPhone: process.env.ALERT_PHONE_NUMBER ?? "",
  alertPhonePublic: process.env.NEXT_PUBLIC_ALERT_PHONE ?? "",
  smsAlertsAuto: process.env.NEXT_PUBLIC_SMS_ALERTS_AUTO === "true",
  smsIntervalMs: parseInt(process.env.NEXT_PUBLIC_SMS_INTERVAL_MS ?? "30000", 10),
} as const;
