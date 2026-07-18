/**
 * Steward AI Gateway — server-only OpenAI configuration.
 * Never import this module from frontend code.
 */

export interface AiGatewayConfig {
  enabled: boolean;
  openaiApiKey: string | null;
  models: {
    default: string;
    reasoning: string;
    vision: string;
    embedding: string;
    draft: string;
    image: string;
    moderation: string;
  };
  maxOutputTokens: number;
  requestTimeoutMs: number;
  maxRetries: number;
  dailyOrgBudgetCents: number;
  monthlyOrgBudgetCents: number;
}

let cachedConfig: AiGatewayConfig | null = null;
let validationLogged = false;

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function loadAiGatewayConfig(): AiGatewayConfig {
  if (cachedConfig) return cachedConfig;

  const openaiApiKey = process.env.OPENAI_API_KEY?.trim() || null;
  cachedConfig = {
    enabled: Boolean(openaiApiKey),
    openaiApiKey,
    models: {
      default: process.env.OPENAI_DEFAULT_MODEL?.trim() || 'gpt-5.6-luna',
      reasoning: process.env.OPENAI_REASONING_MODEL?.trim() || 'gpt-5.6-terra',
      vision: process.env.OPENAI_VISION_MODEL?.trim() || 'gpt-5.6-luna',
      embedding: process.env.OPENAI_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small',
      draft: process.env.OPENAI_DRAFT_MODEL?.trim() || 'gpt-5.6-luna',
      image: process.env.OPENAI_IMAGE_MODEL?.trim() || 'gpt-image-2',
      moderation: process.env.OPENAI_MODERATION_MODEL?.trim() || 'omni-moderation-latest',
    },
    maxOutputTokens: parseIntEnv('OPENAI_MAX_OUTPUT_TOKENS', 4096),
    requestTimeoutMs: parseIntEnv('OPENAI_REQUEST_TIMEOUT_MS', 120_000),
    maxRetries: parseIntEnv('OPENAI_MAX_RETRIES', 2),
    dailyOrgBudgetCents: parseIntEnv('OPENAI_DAILY_ORG_BUDGET_CENTS', 500),
    monthlyOrgBudgetCents: parseIntEnv('OPENAI_MONTHLY_ORG_BUDGET_CENTS', 5000),
  };
  return cachedConfig;
}

/** Call at server startup — logs once, does not crash server if AI is optional. */
export function logAiGatewayStartupStatus(): void {
  if (validationLogged) return;
  validationLogged = true;
  const cfg = loadAiGatewayConfig();
  if (!cfg.enabled) {
    console.warn(
      '[ai-gateway] OPENAI_API_KEY is not set. AI endpoints will return 503 until configured.'
    );
    return;
  }
  console.log('[ai-gateway] OpenAI configured. Models:', cfg.models);
}

/** Fail loudly when an AI endpoint is invoked without required config. */
export function requireAiGatewayConfig(): AiGatewayConfig {
  const cfg = loadAiGatewayConfig();
  if (!cfg.enabled || !cfg.openaiApiKey) {
    throw new AiConfigError('OPENAI_API_KEY is required for AI operations');
  }
  return cfg;
}

export class AiConfigError extends Error {
  readonly code = 'AI_NOT_CONFIGURED';
  constructor(message: string) {
    super(message);
    this.name = 'AiConfigError';
  }
}

export function resetAiConfigCacheForTests(): void {
  cachedConfig = null;
  validationLogged = false;
}
