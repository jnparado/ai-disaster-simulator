import { z } from "zod";

export const simulationParamsSchema = z.object({
  disasterType: z.enum(["flood", "earthquake", "fire", "power-outage"]),
  intensity: z.number().min(0.1).max(1),
  timelineStep: z.enum(["current", "+30m", "+1h", "+3h", "+12h", "tomorrow", "+3d"]),
  windDirection: z.number().min(0).max(360).optional(),
  rainfall: z.number().min(0).max(500).optional(),
});

export const assistantRequestSchema = z.object({
  question: z.string().min(1).max(1000),
  params: simulationParamsSchema,
});

export type ValidatedSimulationParams = z.infer<typeof simulationParamsSchema>;
