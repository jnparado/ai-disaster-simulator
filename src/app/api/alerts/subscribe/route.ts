import { NextResponse } from "next/server";
import { sendTestSms } from "@/lib/alerts/sms";
import { alertSubscribeSchema } from "@/lib/validation/alerts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = alertSubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid phone number", details: parsed.error.flatten() }, { status: 400 });
    }

    const phone = parsed.data.phone;
    const result = await sendTestSms(phone);

    if (!result.sent) {
      return NextResponse.json({ error: result.error ?? "Failed to send SMS" }, { status: 502 });
    }

    return NextResponse.json({
      subscribed: true,
      phone,
      provider: result.provider,
      message: "Test SMS sent. You will receive alerts when calamity is near your location.",
    });
  } catch {
    return NextResponse.json({ error: "Subscribe failed" }, { status: 500 });
  }
}
