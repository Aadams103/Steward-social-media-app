/**
 * Steward AI Gateway — structured logging (no secrets).
 */

export interface AiLogContext {
  operation: string;
  organizationId?: string;
  userId?: string;
  aiJobId?: string;
  model?: string;
  status?: string;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostCents?: number;
  errorCode?: string;
}

const SECRET_PATTERN = /(sk-[a-zA-Z0-9_-]{10,}|Bearer\s+[a-zA-Z0-9._-]+|service_role\s+[a-zA-Z0-9._-]+)/gi;

export function redactSecrets(value: string): string {
  return value.replace(SECRET_PATTERN, '[REDACTED]');
}

export function logAiEvent(level: 'info' | 'warn' | 'error', message: string, ctx: AiLogContext): void {
  const payload = {
    ts: new Date().toISOString(),
    scope: 'ai-gateway',
    level,
    message: redactSecrets(message),
    ...ctx,
  };
  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}
