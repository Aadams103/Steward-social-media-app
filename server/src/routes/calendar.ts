import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { getSupabaseClient } from '../supabase.js';
import { assertWorkspaceAccess } from '../services/workspace.js';

const querySchema = z.object({
  organizationId: z.string().uuid(),
  brandId: z.string().uuid().optional(),
  from: z.coerce.date(),
  to: z.coerce.date(),
}).superRefine((value, ctx) => {
  const rangeDays = (value.to.getTime() - value.from.getTime()) / 86_400_000;
  if (rangeDays < 0 || rangeDays > 370) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Calendar range must be between 0 and 370 days.' });
  }
});

type CalendarPost = {
  id: string;
  title: string | null;
  content: string;
  main_caption: string | null;
  platform: string;
  status: string;
  scheduled_time: string | null;
  published_time: string | null;
  created_at: string;
};

export async function listCalendarItemsHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  const client = getSupabaseClient();
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }
  if (!client) {
    res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Calendar storage is unavailable.' });
    return;
  }

  try {
    const query = querySchema.parse({
      organizationId: req.query.organizationId ?? req.headers['x-organization-id'],
      brandId:
        req.query.brandId ??
        (req.headers['x-brand-id'] === 'all' ? undefined : req.headers['x-brand-id']),
      from: req.query.from,
      to: req.query.to,
    });
    await assertWorkspaceAccess(userId, query.organizationId, query.brandId);

    const from = query.from.toISOString();
    const toDate = new Date(query.to);
    toDate.setUTCHours(23, 59, 59, 999);
    const to = toDate.toISOString();
    const fields = 'id,title,content,main_caption,platform,status,scheduled_time,published_time,created_at';

    let scheduledQuery = client
      .from('posts')
      .select(fields)
      .eq('organization_id', query.organizationId)
      .gte('scheduled_time', from)
      .lte('scheduled_time', to);
    let publishedQuery = client
      .from('posts')
      .select(fields)
      .eq('organization_id', query.organizationId)
      .gte('published_time', from)
      .lte('published_time', to);
    if (query.brandId) {
      scheduledQuery = scheduledQuery.eq('brand_id', query.brandId);
      publishedQuery = publishedQuery.eq('brand_id', query.brandId);
    }

    const [scheduledResult, publishedResult] = await Promise.all([scheduledQuery, publishedQuery]);
    if (scheduledResult.error) throw scheduledResult.error;
    if (publishedResult.error) throw publishedResult.error;

    const byId = new Map<string, CalendarPost>();
    for (const row of [...(scheduledResult.data ?? []), ...(publishedResult.data ?? [])] as CalendarPost[]) {
      byId.set(row.id, row);
    }
    const items = [...byId.values()]
      .map((post) => {
        const caption = post.main_caption || post.content;
        const startAt = post.published_time || post.scheduled_time || post.created_at;
        return {
          id: `post_${post.id}`,
          kind: 'post' as const,
          title: post.title || `${caption.slice(0, 50)}${caption.length > 50 ? '…' : ''}`,
          startAt,
          endAt: new Date(new Date(startAt).getTime() + 30 * 60 * 1000).toISOString(),
          platform: post.platform,
          postId: post.id,
          meta: { status: post.status, content: caption },
        };
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    res.json({ items, source: 'supabase' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Choose a valid calendar date range.' });
      return;
    }
    const code = error instanceof Error ? (error as Error & { code?: string }).code : undefined;
    if (code === 'ORG_ACCESS_DENIED' || code === 'BRAND_ACCESS_DENIED') {
      res.status(403).json({ code: 'FORBIDDEN', message: 'You do not have access to this calendar.' });
      return;
    }
    console.error('Calendar request failed', error instanceof Error ? error.message : 'unknown error');
    res.status(500).json({ code: 'CALENDAR_ERROR', message: 'The calendar could not be loaded.' });
  }
}
