import { davaoCity } from "../digital-twin/davao-city";
import { runSimulation } from "../simulation/engine";
import { env } from "../env";
import type { SimulationParams } from "../types";

function buildContext(params: SimulationParams): string {
  const result = runSimulation(params);
  return JSON.stringify(
    {
      city: davaoCity.name,
      population: davaoCity.population,
      scenario: params,
      summary: result.summary,
      affectedBarangays: result.affectedBarangays,
      predictions: result.prediction,
      rescue: result.rescue,
      resources: result.resources,
      damage: result.damage,
      evacuationRoutes: result.evacuationRoutes.map((r) => r.name),
    },
    null,
    2
  );
}

export async function askLLM(question: string, params: SimulationParams): Promise<string | null> {
  if (!env.aiAssistantEnabled || !env.openaiApiKey) return null;

  const context = buildContext(params);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.openaiModel,
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: `You are an AI emergency operations assistant for ${davaoCity.name} disaster simulations. Answer concisely using ONLY the simulation data provided. Include specific numbers. If data is insufficient, say so. Always remind users these are predictive estimates, not official alerts.`,
          },
          {
            role: "user",
            content: `Simulation context:\n${context}\n\nQuestion: ${question}`,
          },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}
