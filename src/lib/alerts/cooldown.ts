// In-memory cooldown (use Redis in production for multi-instance deploys)
const lastSent = new Map<string, number>();
const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

export function canSendAlert(key: string): boolean {
  const last = lastSent.get(key);
  if (!last) return true;
  return Date.now() - last > COOLDOWN_MS;
}

export function markAlertSent(key: string): void {
  lastSent.set(key, Date.now());
}

export function cooldownRemainingMs(key: string): number {
  const last = lastSent.get(key);
  if (!last) return 0;
  return Math.max(0, COOLDOWN_MS - (Date.now() - last));
}
