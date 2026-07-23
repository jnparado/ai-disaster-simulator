import { davaoCity } from "../digital-twin/davao-city";
import { runSimulation } from "../simulation/engine";
import type { DisasterType, SimulationParams } from "../types";

interface AssistantResponse {
  answer: string;
  data?: Record<string, string | number>;
}

export function answerQuestion(question: string, params: SimulationParams): AssistantResponse {
  const q = question.toLowerCase();
  const result = runSimulation(params);
  const city = davaoCity;

  if (q.includes("hospital") && (q.includes("electric") || q.includes("power") || q.includes("electricity"))) {
    const hospitals = city.buildings.filter((b) => b.type === "hospital");

    const withPower =
      params.disasterType === "power-outage"
        ? hospitals.filter((_, i) => i >= (result.prediction.type === "power-outage" ? result.prediction.data.hospitalsAffected : 0))
        : hospitals;

    return {
      answer: `Based on current simulation, ${withPower.length} of ${hospitals.length} hospitals are predicted to retain electricity. ${withPower.map((h) => h.name).join(", ")} have backup generators and grid redundancy.`,
      data: { hospitalsWithPower: withPower.length, total: hospitals.length },
    };
  }

  if (q.includes("rescue boat") || q.includes("boats")) {
    return {
      answer: `AI recommends deploying ${result.resources.rescueBoats} rescue boats for the current ${params.disasterType} scenario. Priority deployment zones: ${result.affectedBarangays.slice(0, 3).join(", ")}.`,
      data: { rescueBoats: result.resources.rescueBoats },
    };
  }

  if (q.includes("evacuation") && (q.includes("center") || q.includes("capacity") || q.includes("available"))) {
    const centers = city.evacuationCenters.map((c) => {
      const occupancy = Math.round(c.capacity * result.hoursElapsed * 0.01 * params.intensity * 10);
      return { ...c, projected: Math.min(c.capacity, occupancy) };
    });
    const available = centers.filter((c) => c.projected < c.capacity * 0.9);

    return {
      answer: `${available.length} evacuation centers have available capacity. Best options: ${available.map((c) => `${c.name} (${c.capacity - c.projected} spots remaining)`).join("; ")}.`,
      data: { availableCenters: available.length },
    };
  }

  if (q.includes("damage") || q.includes("cost") || q.includes("economic")) {
    const d = result.damage;
    return {
      answer: `Estimated total economic impact: ₱${(d.economicLosses / 1_000_000_000).toFixed(2)}B. Insurance claims: ₱${(d.insuranceClaims / 1_000_000).toFixed(0)}M. Recovery estimated at ${d.recoveryDays} days.`,
      data: { economicLosses: d.economicLosses, recoveryDays: d.recoveryDays },
    };
  }

  if (q.includes("evacuat") && (q.includes("route") || q.includes("safest"))) {
    const safest = result.evacuationRoutes.find((r) => r.type === "safest");
    return {
      answer: `Safest evacuation route: ${safest?.name ?? "Calinan Highlands Road"}. Distance: ${safest?.distance}km, ETA: ${safest?.estimatedTime} minutes. Hazards: ${safest?.hazards.join(", ") || "Minimal"}.`,
    };
  }

  if (q.includes("deploy") || q.includes("ambulance") || q.includes("rescue") || q.includes("fire truck")) {
    const r = result.rescue;
    return {
      answer: `Recommended deployment: ${r.ambulances} ambulances, ${r.fireTrucks} fire trucks, ${r.helicopters} helicopters, ${r.policeOfficers} police officers, ${r.volunteers} volunteers.`,
      data: { ...r },
    };
  }

  if (q.includes("food") || q.includes("water") || q.includes("medicine") || q.includes("resource")) {
    const res = result.resources;
    return {
      answer: `Resource requirements: ${res.food.toLocaleString()} food rations, ${res.water.toLocaleString()}L water, ${res.medicine.toLocaleString()} medical kits, ${res.blankets.toLocaleString()} blankets, ${res.generators} generators.`,
      data: { ...res },
    };
  }

  if (q.includes("barangay") || q.includes("affected") || q.includes("impact")) {
    return {
      answer: `${result.affectedBarangays.length} barangays are predicted to be affected: ${result.affectedBarangays.join(", ")}. ${result.summary}`,
    };
  }

  if (q.includes("flood") && q.includes("depth")) {
    if (result.prediction.type === "flood") {
      return {
        answer: `Predicted flood depth: ${result.prediction.data.floodDepth}m. ${result.prediction.data.buildingsUnderwater} buildings underwater, ${result.prediction.data.peopleImpacted.toLocaleString()} people impacted.`,
      };
    }
  }

  const disasterLabels: Record<DisasterType, string> = {
    flood: "flooding",
    earthquake: "seismic activity",
    fire: "fire spread",
    "power-outage": "power grid failure",
  };

  return {
    answer: `I'm analyzing the ${disasterLabels[params.disasterType]} scenario for Davao City. ${result.summary} Ask me about hospitals, evacuation routes, rescue boats, resources, or damage estimates.`,
  };
}
