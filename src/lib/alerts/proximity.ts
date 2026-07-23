/** Convert PH local format (09XXXXXXXXX) to E.164 (+639XXXXXXXXX) */
export function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("63") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+63${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("9")) return `+63${digits}`;
  if (raw.startsWith("+")) return raw;
  return `+${digits}`;
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export interface ProximityResult {
  isNear: boolean;
  distanceKm: number;
  impactRadiusKm: number;
  epicenterLabel: string;
  disasterType: string;
}

export function checkCalamityProximity(
  userLat: number,
  userLng: number,
  epicenterLat: number,
  epicenterLng: number,
  impactRadiusKm: number,
  epicenterLabel: string,
  disasterType: string,
  bufferKm = 5
): ProximityResult {
  const distanceKm = haversineKm(
    { lat: userLat, lng: userLng },
    { lat: epicenterLat, lng: epicenterLng }
  );
  const isNear = distanceKm <= impactRadiusKm + bufferKm;

  return {
    isNear,
    distanceKm: Math.round(distanceKm * 10) / 10,
    impactRadiusKm,
    epicenterLabel,
    disasterType,
  };
}
