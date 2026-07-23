export type DisasterType = "flood" | "earthquake" | "fire" | "power-outage";

export type TimelineStep =
  | "current"
  | "+30m"
  | "+1h"
  | "+3h"
  | "+12h"
  | "tomorrow"
  | "+3d";

export const TIMELINE_STEPS: { id: TimelineStep; label: string; hours: number }[] = [
  { id: "current", label: "Current", hours: 0 },
  { id: "+30m", label: "+30 min", hours: 0.5 },
  { id: "+1h", label: "+1 hour", hours: 1 },
  { id: "+3h", label: "+3 hours", hours: 3 },
  { id: "+12h", label: "+12 hours", hours: 12 },
  { id: "tomorrow", label: "Tomorrow", hours: 24 },
  { id: "+3d", label: "3 days later", hours:  72 },
];

export interface GeoPoint {
  x: number;
  y: number;
}

export interface Building {
  id: string;
  name: string;
  type: "residential" | "commercial" | "hospital" | "school" | "police" | "fire" | "government";
  position: GeoPoint;
  capacity?: number;
  floors: number;
  population?: number;
}

export interface Road {
  id: string;
  name: string;
  points: GeoPoint[];
  type: "highway" | "arterial" | "local";
  lanes: number;
}

export interface Bridge {
  id: string;
  name: string;
  position: GeoPoint;
  riverId: string;
}

export interface River {
  id: string;
  name: string;
  points: GeoPoint[];
  floodLevel: number;
}

export interface Barangay {
  id: string;
  name: string;
  population: number;
  center: GeoPoint;
  elevation: number;
}

export interface GridNode {
  id: string;
  name: string;
  position: GeoPoint;
  capacity: number;
  serves: string[];
}

export interface EvacuationCenter {
  id: string;
  name: string;
  position: GeoPoint;
  capacity: number;
  currentOccupancy: number;
}

export interface CityDigitalTwin {
  name: string;
  population: number;
  barangays: Barangay[];
  buildings: Building[];
  roads: Road[];
  bridges: Bridge[];
  rivers: River[];
  gridNodes: GridNode[];
  evacuationCenters: EvacuationCenter[];
}

export interface SimulationParams {
  disasterType: DisasterType;
  intensity: number;
  timelineStep: TimelineStep;
  windDirection?: number;
  rainfall?: number;
}

export interface FloodPrediction {
  floodDepth: number;
  streetsAffected: number;
  buildingsUnderwater: number;
  peopleImpacted: number;
  evacuationRoutes: string[];
  safeZones: string[];
  roadClosures: number;
  powerOutages: number;
  waterContamination: boolean;
  barangaysAffected: number;
  bridgesUnsafe: number;
}

export interface EarthquakePrediction {
  buildingDamageProbability: number;
  bridgeFailures: number;
  roadAccessibility: number;
  hospitalCapacity: number;
  communicationOutages: number;
  rescuePriority: string[];
  aftershockRiskZones: string[];
}

export interface FirePrediction {
  fireSpread: number;
  windDirection: string;
  timeUntilIgnition: number;
  evacuationTiming: string;
  firefighterDeployment: number;
  waterRequirements: number;
  buildingsAtRisk: number;
}

export interface PowerOutagePrediction {
  gridFailureCascade: number;
  hospitalsAffected: number;
  trafficSignalFailures: number;
  internetDisruptions: number;
  cellularDegradation: number;
  estimatedRestorationHours: number;
}

export type DisasterPrediction =
  | { type: "flood"; data: FloodPrediction }
  | { type: "earthquake"; data: EarthquakePrediction }
  | { type: "fire"; data: FirePrediction }
  | { type: "power-outage"; data: PowerOutagePrediction };

export interface CascadeStep {
  label: string;
  value: string;
}

export interface RescueDeployment {
  ambulances: number;
  fireTrucks: number;
  helicopters: number;
  policeOfficers: number;
  volunteers: number;
}

export interface ResourceRequirements {
  food: number;
  water: number;
  medicine: number;
  blankets: number;
  fuel: number;
  rescueBoats: number;
  rescueTeams: number;
  generators: number;
}

export interface DamageEstimate {
  insuranceClaims: number;
  repairCosts: number;
  infrastructureDamage: number;
  economicLosses: number;
  recoveryDays: number;
}

export interface EvacuationRoute {
  id: string;
  name: string;
  type: "safest" | "least-congested" | "avoid-flood" | "emergency";
  aiReason: string;
  distance: number;
  estimatedTime: number;
  hazards: string[];
  accessible: boolean;
}

export interface SimulationResult {
  disasterType: DisasterType;
  timelineStep: TimelineStep;
  hoursElapsed: number;
  prediction: DisasterPrediction;
  cascade: CascadeStep[];
  rescue: RescueDeployment;
  resources: ResourceRequirements;
  damage: DamageEstimate;
  evacuationRoutes: EvacuationRoute[];
  affectedBarangays: string[];
  summary: string;
}

export interface SimulationState {
  floodLevel: number;
  fireZones: GeoPoint[];
  damagedBuildings: string[];
  collapsedBuildings: string[];
  closedRoads: string[];
  powerOutages: string[];
  evacuatedPopulation: number;
}
