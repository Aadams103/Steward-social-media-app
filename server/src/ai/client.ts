/**
 * Steward AI Gateway — OpenAI Responses API client (server-only).
 */

import OpenAI from 'openai';
import type { ResponseInputContent } from 'openai/resources/responses/responses';
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
      maxRetries: config.maxRetries,
    });
  }
  return client;
}

export interface ModerationScreenResult {
  flagged: boolean;
  categories: string[];
  model: string;
}

/** Safety pre-screen. Content is never logged and moderation models are not used for generation. */
export async function screenTextWithModeration(input: {
  cfg: AiGatewayConfig;
  text: string;
  operation: string;
  aiJobId?: string;
}): Promise<ModerationScreenResult> {
  const openai = getOpenAiClient(input.cfg);
  try {
    const response = await openai.moderations.create({
      model: input.cfg.models.moderation as 'omni-moderation-latest',
      input: input.text.slice(0, 20_000),
    });
    const result = response.results[0];
    const categories = result
      ? Object.entries(result.categories)
          .filter(([, flagged]) => flagged === true)
          .map(([category]) => category)
      : [];
    return {
      flagged: Boolean(result?.flagged),
      categories,
      model: input.cfg.models.moderation,
    };
  } catch (err) {
    logAiEvent('error', 'OpenAI moderation request failed', {
      operation: input.operation,
      aiJobId: input.aiJobId,
      model: input.cfg.models.moderation,
      status: 'failed',
      errorCode: 'MODERATION_ERROR',
    });
    const message = err instanceof Error ? err.message : 'Moderation request failed';
    throw new AiGatewayError('OPENAI_ERROR', message, 502);
  }
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

export type AiInputAttachment = Extract<
  ResponseInputContent,
  { type: 'input_image' | 'input_file' }
>;

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
  attachments?: AiInputAttachment[];
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
        {
          role: 'user',
          content: [
            { type: 'input_text', text: input.userPrompt },
            ...(input.attachments ?? []),
          ],
        },
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
  key: 'default' | 'reasoning' | 'vision' | 'draft' | 'embedding' | 'image' | 'moderation'
): string {
  return cfg.models[key];
}
