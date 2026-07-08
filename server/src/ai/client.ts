/**
 * Steward AI Gateway — OpenAI Responses API client (server-only).
 */

import OpenAI from 'openai';
import { requireAiGatewayConfig, type AiGatewayConfig } from './config.js';
import { AiGatewayError } from './errors.js';
import { logAiEvent } from './logging.js';
import { zodToJsonSchema } from './schemas.js';
import type { z } from 'zod';

let client: OpenAI | null = null;

export function getOpenAiClient(cfg?: AiGatewayConfig): OpenAI {
  const config = cfg ?? requireAiGatewayConfig();
  if (!client) {
    client = new OpenAI({
      apiKey: config.openaiApiKey!,
      timeout: config.requestTimeoutMs,
      maxRetries: 0,
    });
  }
  return client;
}

export function resetOpenAiClientForTests(): void {
  client = null;
}

export interface StructuredResponseResult<T> {
  parsed: T;
  rawText: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export async function callOpenAiStructured<T>(input: {
  cfg: AiGatewayConfig;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  schemaName: string;
  operation: string;
  aiJobId?: string;
  isRepair?: boolean;
}): Promise<StructuredResponseResult<T>> {
  const openai = getOpenAiClient(input.cfg);
  const started = Date.now();
  const jsonSchema = zodToJsonSchema(input.schema, input.schemaName);

  try {
    const response = await openai.responses.create({
      model: input.model,
      max_output_tokens: input.cfg.maxOutputTokens,
      input: [
        { role: 'system', content: input.systemPrompt },
        { role: 'user', content: input.userPrompt },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: input.schemaName,
          schema: jsonSchema,
          strict: true,
        },
      },
    });

    const rawText = response.output_text?.trim() ?? '';
    if (!rawText) {
      throw new Error('Empty model output');
    }

    let json: unknown;
    try {
      json = JSON.parse(rawText);
    } catch {
      throw new Error('Model output was not valid JSON');
    }

    const parsed = input.schema.parse(json);
    const usage = response.usage;
    const inputTokens = usage?.input_tokens ?? 0;
    const outputTokens = usage?.output_tokens ?? 0;
    const totalTokens = usage?.total_tokens ?? inputTokens + outputTokens;

    logAiEvent('info', 'OpenAI structured response succeeded', {
      operation: input.operation,
      aiJobId: input.aiJobId,
      model: input.model,
      status: 'succeeded',
      durationMs: Date.now() - started,
      inputTokens,
      outputTokens,
    });

    return { parsed, rawText, model: input.model, inputTokens, outputTokens, totalTokens };
  } catch (err) {
    logAiEvent('error', 'OpenAI structured response failed', {
      operation: input.operation,
      aiJobId: input.aiJobId,
      model: input.model,
      status: 'failed',
      durationMs: Date.now() - started,
      errorCode: 'OPENAI_ERROR',
    });
    if (err instanceof AiGatewayError) throw err;
    const message = err instanceof Error ? err.message : 'OpenAI request failed';
    throw new AiGatewayError('OPENAI_ERROR', message, 502);
  }
}

export function resolveModelKey(
  cfg: AiGatewayConfig,
  key: 'default' | 'reasoning' | 'vision' | 'draft' | 'embedding'
): string {
  return cfg.models[key];
}
