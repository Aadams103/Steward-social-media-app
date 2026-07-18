import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { brandContextV1Schema, type BrandContextV1Input } from '../schemas/brand-context.js';
import { getStewardBrandContext } from '../services/brand-intelligence.js';
import { getPermissions } from '../services/permissions.js';
import { assertWorkspaceAccess, logAuditEvent } from '../services/workspace.js';
import { getSupabaseClient } from '../supabase.js';

const requestSchema = z.object({
  organizationId: z.string().uuid(),
  context: brandContextV1Schema,
});

function slugify(value: string, index: number): string {
  const base = value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${base || 'item'}-${index + 1}`.slice(0, 100);
}

async function replaceRows(
  table: string,
  organizationId: string,
  brandId: string,
  rows: Record<string, unknown>[]
): Promise<void> {
  const client = getSupabaseClient()!;
  const { error: deleteError } = await client.from(table).delete().eq('brand_id', brandId);
  if (deleteError) throw deleteError;
  if (rows.length === 0) return;
  const { error } = await client.from(table).insert(
    rows.map((row) => ({ organization_id: organizationId, brand_id: brandId, ...row }))
  );
  if (error) throw error;
}

function toResponse(context: Awaited<ReturnType<typeof getStewardBrandContext>>) {
  const brandMetadata = (context.brand.metadata ?? {}) as Record<string, unknown>;
  return {
    version: '1.0' as const,
    identity: {
      businessName: context.brandProfile?.business_name ?? context.brand.business_name ?? '',
      publicBrandName: context.brandProfile?.public_brand_name ?? context.brand.name ?? '',
      businessType: context.brandProfile?.business_type ?? '',
      industry: context.brandProfile?.industry ?? context.brand.industry ?? '',
      websiteUrl: context.brandProfile?.website_url ?? context.brand.website ?? '',
      shortDescription: context.brandProfile?.short_description ?? '',
      missionStatement: context.brandProfile?.mission_statement ?? '',
      values: context.brandProfile?.values ?? [],
    },
    audience: context.audienceSegments.map((row) => ({
      name: row.name,
      description: row.description ?? '',
      painPoints: row.pain_points ?? [],
      interests: row.interests ?? [],
      preferredPlatforms: row.preferred_platforms ?? [],
      isPrimary: Boolean(row.is_primary),
    })),
    voice: {
      summary: context.brandProfile?.brand_voice_summary ?? context.brand.brand_voice ?? '',
      defaultTone: context.brandProfile?.default_tone ?? '',
      personalityTraits: context.brandProfile?.personality_traits ?? [],
      wordsToUse: context.brandProfile?.words_to_use ?? context.brand.words_to_use ?? [],
      wordsToAvoid: context.brandProfile?.words_to_avoid ?? context.brand.words_to_avoid ?? [],
    },
    pillars: context.contentPillars.map((row) => ({ name: row.name, description: row.description ?? '' })),
    offers: context.offers.map((row) => ({
      name: row.name,
      headline: row.headline ?? '',
      description: row.description ?? '',
      ctaText: row.cta_text ?? '',
      ctaUrl: row.cta_url ?? '',
    })),
    ctas: context.ctas.map((row) => ({
      label: row.label,
      text: row.cta_text,
      destinationUrl: row.destination_url ?? '',
      platform: row.platform ?? undefined,
    })),
    rules: {
      prohibitedClaims: context.brandRules
        .filter((row) => row.rule_type === 'claims' || row.rule_type === 'forbidden')
        .map((row) => row.rule_description),
      complianceNotes: context.brandProfile?.compliance_notes ?? '',
      safetyNotes: context.brandProfile?.safety_notes ?? '',
    },
    platformStrategies: context.platformStrategy.map((row) => ({
      platform: row.platform,
      enabled: Boolean(row.enabled),
      postingFrequencyGoal: row.posting_frequency_goal ?? 0,
      targetAudience: row.target_audience ?? '',
      contentTypes: row.content_types ?? [],
      notes: row.notes ?? '',
    })),
    visualKit: (brandMetadata.visualKit ?? { fonts: [], brandDocumentAssetIds: [] }) as Record<string, unknown>,
    examples: (brandMetadata.examples ?? []) as Record<string, unknown>[],
    postingGoals: context.brand.posting_goals ?? [],
    approvedMemory: context.approvedMemoryFacts,
    missingContext: context.missingContext,
    updatedAt: context.meta.assembledAt,
  };
}

async function saveContext(
  userId: string,
  organizationId: string,
  brandId: string,
  context: BrandContextV1Input
): Promise<void> {
  const client = getSupabaseClient()!;
  const role = await assertWorkspaceAccess(userId, organizationId, brandId);
  if (!getPermissions(role).canManageWorkspace && !['editor', 'strategist'].includes(role)) {
    const error = new Error('FORBIDDEN');
    (error as Error & { code: string }).code = 'FORBIDDEN';
    throw error;
  }

  if (context.visualKit.logoAssetId) {
    const { data: logo } = await client
      .from('assets')
      .select('id')
      .eq('id', context.visualKit.logoAssetId)
      .eq('organization_id', organizationId)
      .eq('brand_id', brandId)
      .maybeSingle();
    if (!logo) throw new Error('INVALID_LOGO_ASSET');
  }

  const { data: existingBrand, error: existingError } = await client
    .from('brands')
    .select('metadata')
    .eq('id', brandId)
    .eq('organization_id', organizationId)
    .single();
  if (existingError) throw existingError;

  const { error: brandError } = await client.from('brands').update({
    name: context.identity.publicBrandName,
    business_name: context.identity.businessName,
    website: context.identity.websiteUrl || null,
    industry: context.identity.industry || null,
    audience_description: context.audience.map((audience) => audience.description).filter(Boolean).join('\n'),
    brand_voice: context.voice.summary || null,
    words_to_use: context.voice.wordsToUse,
    words_to_avoid: context.voice.wordsToAvoid,
    cta_preferences: context.ctas,
    offer_language: context.offers,
    posting_goals: context.postingGoals,
    platform_priorities: context.platformStrategies.filter((strategy) => strategy.enabled).map((strategy) => strategy.platform),
    visual_style_notes: context.visualKit.styleNotes ?? null,
    logo_asset_id: context.visualKit.logoAssetId ?? null,
    metadata: {
      ...((existingBrand?.metadata ?? {}) as Record<string, unknown>),
      visualKit: context.visualKit,
      examples: context.examples,
      contextVersion: context.version,
    },
  }).eq('id', brandId).eq('organization_id', organizationId);
  if (brandError) throw brandError;

  const { error: profileError } = await client.from('brand_profiles').upsert({
    organization_id: organizationId,
    brand_id: brandId,
    business_name: context.identity.businessName,
    public_brand_name: context.identity.publicBrandName,
    business_type: context.identity.businessType || null,
    industry: context.identity.industry || null,
    website_url: context.identity.websiteUrl || null,
    short_description: context.identity.shortDescription || null,
    mission_statement: context.identity.missionStatement || null,
    values: context.identity.values,
    brand_voice_summary: context.voice.summary || null,
    default_tone: context.voice.defaultTone || null,
    personality_traits: context.voice.personalityTraits,
    words_to_use: context.voice.wordsToUse,
    words_to_avoid: context.voice.wordsToAvoid,
    compliance_notes: context.rules.complianceNotes || null,
    safety_notes: context.rules.safetyNotes || null,
    metadata: { contextVersion: context.version },
  }, { onConflict: 'brand_id' });
  if (profileError) throw profileError;

  await replaceRows('audience_segments', organizationId, brandId, context.audience.map((row, index) => ({
    name: row.name,
    slug: slugify(row.name, index),
    description: row.description ?? null,
    pain_points: row.painPoints,
    interests: row.interests,
    preferred_platforms: row.preferredPlatforms,
    is_primary: row.isPrimary,
  })));
  await replaceRows('content_pillars', organizationId, brandId, context.pillars.map((row, index) => ({
    name: row.name,
    slug: slugify(row.name, index),
    description: row.description ?? null,
    sort_order: index,
    is_active: true,
  })));
  await replaceRows('brand_offers', organizationId, brandId, context.offers.map((row, index) => ({
    name: row.name,
    slug: slugify(row.name, index),
    headline: row.headline ?? null,
    description: row.description ?? null,
    cta_text: row.ctaText ?? null,
    cta_url: row.ctaUrl || null,
    is_active: true,
  })));
  await replaceRows('brand_ctas', organizationId, brandId, context.ctas.map((row, index) => ({
    label: row.label,
    cta_text: row.text,
    cta_type: 'other',
    destination_url: row.destinationUrl || null,
    platform: row.platform ?? null,
    priority: index,
    active: true,
  })));
  await replaceRows('brand_rules', organizationId, brandId, context.rules.prohibitedClaims.map((claim, index) => ({
    rule_type: 'claims',
    rule_name: `Prohibited claim ${index + 1}`,
    rule_description: claim,
    severity: 'block',
    active: true,
  })));
  await replaceRows('platform_strategy', organizationId, brandId, context.platformStrategies.map((row, index) => ({
    platform: row.platform,
    enabled: row.enabled,
    priority: index,
    target_audience: row.targetAudience ?? null,
    content_types: row.contentTypes,
    posting_frequency_goal: row.postingFrequencyGoal,
    approval_required: true,
    auto_publish_allowed: false,
    notes: row.notes ?? null,
  })));

  const { error: preferenceError } = await client.from('user_brand_preferences').upsert({
    organization_id: organizationId,
    brand_id: brandId,
    user_id: userId,
    approval_strictness: 'strict',
    auto_publish_enabled: false,
    always_require_review: true,
  }, { onConflict: 'brand_id,user_id' });
  if (preferenceError) throw preferenceError;

  const { error: orgError } = await client.from('organizations').update({
    onboarding_status: 'completed',
    updated_at: new Date().toISOString(),
  }).eq('id', organizationId);
  if (orgError) throw orgError;

  await logAuditEvent({
    organizationId,
    brandId,
    actorUserId: userId,
    action: 'brand.context.update',
    entityType: 'brand',
    entityId: brandId,
    metadata: { contextVersion: context.version },
  });
}

export async function getBrandContextV1Handler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) return void res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
  if (!getSupabaseClient()) return void res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Brand storage is unavailable' });
  try {
    const organizationId = z.string().uuid().parse(req.query.organizationId);
    const brandId = z.string().uuid().parse(req.params.brandId);
    const context = await getStewardBrandContext({ organizationId, brandId, userId, operation: 'brand_context_v1' });
    res.json({ context: toResponse(context) });
  } catch (err) {
    const code = err instanceof Error ? (err as Error & { code?: string }).code : undefined;
    if (err instanceof z.ZodError) return void res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Valid organization and brand IDs are required.' });
    if (code === 'ORG_ACCESS_DENIED' || code === 'FORBIDDEN') return void res.status(403).json({ code: 'FORBIDDEN', message: 'Brand access denied.' });
    console.error('Brand context load failed', err instanceof Error ? err.message : 'unknown error');
    res.status(500).json({ code: 'BRAND_CONTEXT_ERROR', message: 'Failed to load brand context.' });
  }
}

export async function putBrandContextV1Handler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) return void res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
  if (!getSupabaseClient()) return void res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Brand storage is unavailable' });
  try {
    const brandId = z.string().uuid().parse(req.params.brandId);
    const body = requestSchema.parse(req.body);
    await saveContext(userId, body.organizationId, brandId, body.context);
    const stored = await getStewardBrandContext({
      organizationId: body.organizationId,
      brandId,
      userId,
      operation: 'brand_context_v1',
    });
    res.json({ context: toResponse(stored) });
  } catch (err) {
    if (err instanceof z.ZodError) return void res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Check the brand details and try again.', details: err.flatten() });
    const code = err instanceof Error ? (err as Error & { code?: string }).code : undefined;
    if (code === 'ORG_ACCESS_DENIED' || code === 'BRAND_ACCESS_DENIED' || code === 'FORBIDDEN') return void res.status(403).json({ code: 'FORBIDDEN', message: 'You cannot edit this brand.' });
    console.error('Brand context save failed', err instanceof Error ? err.message : 'unknown error');
    res.status(500).json({ code: 'BRAND_CONTEXT_SAVE_ERROR', message: 'Failed to save brand context.' });
  }
}
