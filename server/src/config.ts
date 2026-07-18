export type WorkerFlag =
  | 'PUBLISH_WORKER_ENABLED'
  | 'ANALYTICS_WORKER_ENABLED'
  | 'AGENT_WORKER_ENABLED';

/** Production runs durable workers by default; an explicit flag overrides it. */
export function isWorkerEnabled(flag: WorkerFlag): boolean {
  const configured = process.env[flag]?.trim().toLowerCase();
  if (configured) return configured === 'true';
  return process.env.NODE_ENV === 'production';
}

export type StewardAccessMode = 'owner' | 'open';

export function getAccessMode(): StewardAccessMode {
  const configured = process.env.STEWARD_ACCESS_MODE?.trim().toLowerCase();
  if (configured === 'open') return 'open';
  if (configured === 'owner') return 'owner';
  return process.env.NODE_ENV === 'production' ? 'owner' : 'open';
}

export function getOwnerUserIds(): Set<string> {
  return new Set(
    (process.env.STEWARD_OWNER_USER_IDS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function checkUserAccess(userId: string): {
  allowed: boolean;
  configured: boolean;
  mode: StewardAccessMode;
} {
  const mode = getAccessMode();
  if (mode === 'open') return { allowed: true, configured: true, mode };
  const owners = getOwnerUserIds();
  return { allowed: owners.has(userId), configured: owners.size > 0, mode };
}

export function isDevelopmentIdentityEnabled(): boolean {
  return process.env.NODE_ENV !== 'production'
    && process.env.STEWARD_ENABLE_DEMO_DATA === 'true'
    && getAccessMode() === 'open';
}

export function getProductionReadiness(): { ready: boolean; missing: string[] } {
  if (process.env.NODE_ENV !== 'production') return { ready: true, missing: [] };

  const missing: string[] = [];
  if (!process.env.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    missing.push('SUPABASE_SECRET_KEY');
  }
  if (getAccessMode() === 'owner' && getOwnerUserIds().size === 0) {
    missing.push('STEWARD_OWNER_USER_IDS');
  }
  return { ready: missing.length === 0, missing };
}
