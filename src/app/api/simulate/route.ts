import { NextResponse } from "next/server";
import { runSimulation } from "@/lib/simulation/engine";
import { simulationParamsSchema } from "@/lib/validation/simulation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = simulationParamsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid simulation parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = runSimulation(parsed.data);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Simulation failed" }, { status: 500 });
  }
}
