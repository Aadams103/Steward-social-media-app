/**
 * Steward AI Gateway — error types with safe client codes.
 */

export type AiErrorCode =
  | 'AI_NOT_CONFIGURED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'BUDGET_EXCEEDED'
  | 'CONTENT_BLOCKED'
  | 'STRUCTURED_OUTPUT_INVALID'
  | 'OPENAI_ERROR'
  | 'JOB_NOT_FOUND'
  | 'SUPABASE_NOT_CONFIGURED'
  | 'BRAND_NOT_FOUND'
  | 'ORG_ACCESS_DENIED';

export class AiGatewayError extends Error {
  readonly code: AiErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(code: AiErrorCode, message: string, status = 400, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AiGatewayError';
    this.code = code;
    this.status = status;
    this.details = details;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export function isAiGatewayError(err: unknown): err is AiGatewayError {
  return err instanceof AiGatewayError;
}
