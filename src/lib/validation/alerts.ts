import { z } from "zod";
import { simulationParamsSchema } from "../validation/simulation";

export const alertCheckSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  params: simulationParamsSchema,
  phone: z.string().optional(),
});

export const alertSubscribeSchema = z.object({
  phone: z.string().min(10).max(20),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});
