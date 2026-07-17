import { createHash, randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { toFile } from 'openai';
import { z } from 'zod';
import { getOpenAiClient, screenTextWithModeration } from '../ai/client.js';
import { requireAiGatewayConfig } from '../ai/config.js';
import { enforceOrgBudget } from '../ai/cost.js';
import {
  insertAiJobRecord,
  markAiJobFailed,
  markAiJobRunning,
  markAiJobSucceeded,
} from '../services/ai-jobs-db.js';
import { getStewardBrandContext } from '../services/brand-intelligence.js';
import { assertPermission } from '../services/permissions.js';
import { assertWorkspaceAccess, logAuditEvent } from '../services/workspace.js';
import { getSupabaseClient } from '../supabase.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const imageRequestSchema = z.object({
  organizationId: z.string().uuid(),
  brandId: z.string().uuid(),
  prompt: z.string().trim().min(3).max(12_000),
  sourceAssetId: z.string().uuid().optional(),
  size: z.enum(['1024x1024', '1536x1024', '1024x1536']).default('1024x1024'),
  quality: z.enum(['low', 'medium', 'high']).default('medium'),
  outputFormat: z.enum(['png', 'jpeg', 'webp']).default('png'),
});

function estimatedImageCostCents(quality: 'low' | 'medium' | 'high'): number {
  const envValue = Number(process.env[`OPENAI_IMAGE_${quality.toUpperCase()}_ESTIMATED_COST_CENTS`]);
  if (Number.isFinite(envValue) && envValue > 0) return Math.ceil(envValue);
  return { low: 2, medium: 8, high: 25 }[quality];
}

function imageMimeType(format: 'png' | 'jpeg' | 'webp'): string {
  return format === 'jpeg' ? 'image/jpeg' : `image/${format}`;
}

export async function generateBrandedImageHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const userId = req.user?.id;
  const supabase = getSupabaseClient();
  if (!userId) return void res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
  if (!supabase) return void res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Image storage is unavailable' });

  let aiJobId: string | undefined;
  try {
    const body = imageRequestSchema.parse(req.body);
    const role = await assertWorkspaceAccess(userId, body.organizationId, body.brandId);
    assertPermission(role, 'canEditPosts');
    const cfg = requireAiGatewayConfig();
    await enforceOrgBudget(body.organizationId, cfg);

    aiJobId = await insertAiJobRecord({
      organizationId: body.organizationId,
      brandId: body.brandId,
      userId,
      operation: 'image_generation',
      jobType: 'post_idea_generation',
      requestInput: {
        prompt: body.prompt,
        sourceAssetId: body.sourceAssetId,
        size: body.size,
        quality: body.quality,
        outputFormat: body.outputFormat,
      },
      promptVersion: 'branded_image_v1.0.0',
      relatedAssetId: body.sourceAssetId,
    });
    await markAiJobRunning(aiJobId, cfg.models.image);

    const screening = await screenTextWithModeration({
      cfg,
      text: body.prompt,
      operation: 'image_generation',
      aiJobId,
    });
    if (screening.flagged) {
      throw new Error('IMAGE_PROMPT_BLOCKED');
    }

    const brand = await getStewardBrandContext({
      organizationId: body.organizationId,
      brandId: body.brandId,
      userId,
      operation: 'image_generation',
      assetIds: body.sourceAssetId ? [body.sourceAssetId] : undefined,
    });
    const visualContext = {
      publicBrandName: brand.brandProfile?.public_brand_name,
      visualStyle: brand.brandProfile?.visual_style_notes,
      primaryColors: brand.brandProfile?.primary_colors,
      secondaryColors: brand.brandProfile?.secondary_colors,
      fonts: brand.brandProfile?.fonts,
      prohibitedTopics: brand.brandProfile?.prohibited_topics,
      approvedMemory: brand.approvedMemoryFacts.slice(0, 20),
    };
    const composedPrompt = [
      'Create a polished social-media visual for this brand.',
      `Trusted visual context: ${JSON.stringify(visualContext)}`,
      `Creative brief: ${body.prompt}`,
      'Do not invent product claims, prices, testimonials, credentials, or promotions.',
      'Do not include a logo unless it is present in the supplied source image.',
      'Keep important subjects and text inside safe margins for social cropping.',
    ].join('\n\n');

    const openai = getOpenAiClient(cfg);
    let response;
    if (body.sourceAssetId) {
      const { data: source, error: sourceError } = await supabase
        .from('assets')
        .select('storage_bucket, storage_path, file_name, mime_type')
        .eq('id', body.sourceAssetId)
        .eq('organization_id', body.organizationId)
        .eq('brand_id', body.brandId)
        .maybeSingle();
      if (sourceError || !source) throw new Error('SOURCE_ASSET_NOT_FOUND');
      const { data: blob, error: downloadError } = await supabase.storage
        .from(source.storage_bucket as string)
        .download(source.storage_path as string);
      if (downloadError || !blob) throw new Error('SOURCE_ASSET_DOWNLOAD_FAILED');
      const upload = await toFile(
        Buffer.from(await blob.arrayBuffer()),
        (source.file_name as string) || 'source-image',
        { type: (source.mime_type as string) || 'image/png' }
      );
      response = await openai.images.edit({
        model: cfg.models.image,
        image: upload,
        prompt: composedPrompt,
        size: body.size,
        quality: body.quality,
        output_format: body.outputFormat,
        background: 'auto',
      });
    } else {
      response = await openai.images.generate({
        model: cfg.models.image,
        prompt: composedPrompt,
        size: body.size,
        quality: body.quality,
        output_format: body.outputFormat,
        background: 'auto',
        moderation: 'auto',
        n: 1,
      });
    }

    const encoded = response.data?.[0]?.b64_json;
    if (!encoded) throw new Error('EMPTY_IMAGE_OUTPUT');
    const bytes = Buffer.from(encoded, 'base64');
    const extension = body.outputFormat === 'jpeg' ? 'jpg' : body.outputFormat;
    const fileName = `steward-generated-${Date.now()}.${extension}`;
    const path = `${body.organizationId}/${body.brandId}/${randomUUID()}/${fileName}`;
    const mimeType = imageMimeType(body.outputFormat);
    const { error: uploadError } = await supabase.storage
      .from('content-media')
      .upload(path, bytes, { contentType: mimeType, upsert: false });
    if (uploadError) throw uploadError;

    const checksum = createHash('sha256').update(bytes).digest('hex');
    const [width, height] = body.size.split('x').map(Number);
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert({
        organization_id: body.organizationId,
        brand_id: body.brandId,
        uploaded_by: userId,
        type: 'image',
        storage_bucket: 'content-media',
        storage_path: path,
        file_name: fileName,
        mime_type: mimeType,
        file_size: bytes.length,
        checksum_sha256: checksum,
        width,
        height,
        approval_status: 'pending',
        analysis_status: 'completed',
        metadata: {
          source: 'openai-image',
          model: cfg.models.image,
          aiJobId,
          promptVersion: 'branded_image_v1.0.0',
          sourceAssetId: body.sourceAssetId ?? null,
          requiresApproval: true,
        },
      })
      .select('*')
      .single();
    if (assetError) {
      await supabase.storage.from('content-media').remove([path]);
      throw assetError;
    }

    const estimatedCostCents = estimatedImageCostCents(body.quality);
    const usage = response.usage;
    await markAiJobSucceeded(aiJobId, {
      structuredOutput: { assetId: asset.id, storageBucket: 'content-media', storagePath: path },
      rawOutput: JSON.stringify({ assetId: asset.id }),
      model: cfg.models.image,
      promptVersion: 'branded_image_v1.0.0',
      inputTokens: usage?.input_tokens ?? 0,
      outputTokens: usage?.output_tokens ?? 0,
      totalTokens: usage?.total_tokens ?? 0,
      estimatedCostCents,
    });
    const { data: signed } = await supabase.storage.from('content-media').createSignedUrl(path, 600);
    await logAuditEvent({
      organizationId: body.organizationId,
      brandId: body.brandId,
      actorUserId: userId,
      action: body.sourceAssetId ? 'asset.ai_edit' : 'asset.ai_generate',
      entityType: 'asset',
      entityId: asset.id as string,
      metadata: { aiJobId, model: cfg.models.image },
    });
    res.status(201).json({
      aiJobId,
      asset: {
        id: asset.id,
        fileName: asset.file_name,
        mimeType: asset.mime_type,
        width: asset.width,
        height: asset.height,
        url: signed?.signedUrl ?? null,
        urlExpiresAt: new Date(Date.now() + 600_000).toISOString(),
        approvalStatus: asset.approval_status,
      },
      model: cfg.models.image,
      promptVersion: 'branded_image_v1.0.0',
      estimatedCostCents,
      needsHumanReview: true,
    });
  } catch (error) {
    if (aiJobId) {
      await markAiJobFailed(
        aiJobId,
        error instanceof Error && error.message === 'IMAGE_PROMPT_BLOCKED' ? 'CONTENT_BLOCKED' : 'IMAGE_GENERATION_ERROR',
        error instanceof Error ? error.message : 'Image generation failed'
      );
    }
    if (error instanceof z.ZodError) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Check the image brief and try again.' });
      return;
    }
    if (error instanceof Error && (error as Error & { code?: string }).code === 'FORBIDDEN') {
      res.status(403).json({ code: 'FORBIDDEN', message: error.message });
      return;
    }
    if (error instanceof Error && error.message === 'IMAGE_PROMPT_BLOCKED') {
      res.status(422).json({ code: 'CONTENT_BLOCKED', message: 'This visual brief needs a safety review.' });
      return;
    }
    console.error('AI image request failed', error instanceof Error ? error.message : 'unknown error');
    res.status(502).json({ code: 'IMAGE_GENERATION_ERROR', message: 'Steward could not create that visual.' });
  }
}
