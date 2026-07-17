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
