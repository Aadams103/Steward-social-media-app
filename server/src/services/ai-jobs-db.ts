/**
 * Steward AI Gateway — ai_jobs persistence helpers.
 */

import { getSupabaseClient } from '../supabase.js';
import type { AiJobStatus, AiOperation } from '../ai/types.js';

export async function verifyOrgMembership(userId: string, organizationId: string): Promise<string> {
  const client = getSupabaseClient();
  if (!client) throw new Error('SUPABASE_NOT_CONFIGURED');

  const { data: org } = await client
    .from('organizations')
    .select('owner_id')
    .eq('id', organizationId)
    .maybeSingle();
  if (org?.owner_id === userId) return 'owner';

  const { data: member } = await client
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!member?.role) throw new Error('ORG_ACCESS_DENIED');
  return member.role as string;
}

export async function getOrganizationSubscriptionTier(organizationId: string): Promise<string> {
  const client = getSupabaseClient();
  if (!client) return 'free';
  const { data } = await client
    .from('subscriptions')
    .select('plan_type, status')
    .eq('organization_id', organizationId)
    .maybeSingle();
  if (!data || data.status !== 'active') return 'free';
  return (data.plan_type as string) || 'free';
}

export async function insertAiJobRecord(input: {
  organizationId: string;
  brandId?: string;
  userId: string;
  operation: AiOperation;
  jobType: string;
  requestInput: Record<string, unknown>;
  promptVersion?: string;
  relatedPostId?: string;
  relatedAssetId?: string;
}): Promise<string> {
  const client = getSupabaseClient();
  if (!client) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { data, error } = await client
    .from('ai_jobs')
    .insert({
      organization_id: input.organizationId,
      brand_id: input.brandId ?? null,
      created_by: input.userId,
      user_id: input.userId,
      operation: input.operation,
      job_type: input.jobType,
      status: 'queued',
      input: input.requestInput,
      request_input_json: input.requestInput,
      prompt_version: input.promptVersion ?? null,
      related_post_id: input.relatedPostId ?? null,
      related_asset_id: input.relatedAssetId ?? null,
      model_provider: 'openai',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateAiJobRecord(
  aiJobId: string,
  patch: Record<string, unknown>
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { error } = await client.from('ai_jobs').update(patch).eq('id', aiJobId);
  if (error) throw error;
}

export async function markAiJobRunning(aiJobId: string, model: string): Promise<void> {
  await updateAiJobRecord(aiJobId, {
    status: 'running' as AiJobStatus,
    model,
    model_name: model,
    started_at: new Date().toISOString(),
  });
}

export async function markAiJobSucceeded(
  aiJobId: string,
  data: {
    structuredOutput: Record<string, unknown>;
    rawOutput: string;
    model: string;
    promptVersion: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCostCents: number;
  }
): Promise<void> {
  await updateAiJobRecord(aiJobId, {
    status: 'succeeded',
    structured_output_json: data.structuredOutput,
    response_output_json: { text: data.rawOutput },
    output: data.structuredOutput,
    model: data.model,
    model_name: data.model,
    prompt_version: data.promptVersion,
    input_tokens: data.inputTokens,
    output_tokens: data.outputTokens,
    total_tokens: data.totalTokens,
    estimated_cost_cents: data.estimatedCostCents,
    cost_estimate: data.estimatedCostCents / 100,
    token_usage: {
      input_tokens: data.inputTokens,
      output_tokens: data.outputTokens,
      total_tokens: data.totalTokens,
    },
    completed_at: new Date().toISOString(),
  });
}

export async function markAiJobFailed(
  aiJobId: string,
  errorCode: string,
  errorMessage: string
): Promise<void> {
  await updateAiJobRecord(aiJobId, {
    status: 'failed',
    error_code: errorCode,
    error_message: errorMessage,
    completed_at: new Date().toISOString(),
  });
}

export async function markAiJobBlocked(aiJobId: string, reason: string): Promise<void> {
  await updateAiJobRecord(aiJobId, {
    status: 'blocked',
    error_code: 'BLOCKED',
    error_message: reason,
    completed_at: new Date().toISOString(),
  });
}

export async function getAssetById(assetId: string, organizationId: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { data, error } = await client
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .eq('organization_id', organizationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('ASSET_NOT_FOUND');
  return data;
}

export async function updateAssetAiMetadata(
  assetId: string,
  patch: { visual_analysis?: Record<string, unknown>; tags?: string[]; content_category?: string }
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.from('assets').update(patch).eq('id', assetId);
}

export async function getPostById(postId: string, organizationId: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { data, error } = await client
    .from('posts')
    .select('*')
    .eq('id', postId)
    .eq('organization_id', organizationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('POST_NOT_FOUND');
  return data;
}
