/**
 * Stripe billing: checkout session creation + webhook processing.
 *
 * - POST /api/billing/create-checkout-session: Supabase-authenticated; verifies
 *   the user is the org owner or an owner/admin member before creating a
 *   Checkout Session.
 * - POST /api/webhooks/stripe: NOT Supabase-authenticated; authenticated via
 *   Stripe signature over the raw request body. Must be mounted with
 *   express.raw({ type: 'application/json' }) BEFORE the global JSON parser.
 *
 * Subscription state is written here (service role) only — never by clients.
 */

import type { Response } from 'express';
import Stripe from 'stripe';
import { getSupabaseClient } from '../supabase.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export type CheckoutPlanType = 'basic' | 'pro_expert' | 'agency';

const CHECKOUT_PLANS: CheckoutPlanType[] = ['basic', 'pro_expert', 'agency'];

/** Map checkout plan ids to the legacy plan names stored on organizations. */
const PLAN_TO_ORG_BILLING_PLAN: Record<CheckoutPlanType, string> = {
  basic: 'starter',
  pro_expert: 'professional',
  agency: 'enterprise',
};

let _stripe: Stripe | null = null;

function getStripeClient(): Stripe | null {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  _stripe = new Stripe(key);
  return _stripe;
}

function getPriceIdForPlan(plan: CheckoutPlanType): string | null {
  switch (plan) {
    case 'basic':
      return process.env.STRIPE_PRICE_BASIC ?? null;
    case 'pro_expert':
      return process.env.STRIPE_PRICE_PRO_EXPERT ?? null;
    case 'agency':
      return process.env.STRIPE_PRICE_AGENCY ?? null;
  }
}

function getPlanForPriceId(priceId: string | null | undefined): CheckoutPlanType | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_BASIC) return 'basic';
  if (priceId === process.env.STRIPE_PRICE_PRO_EXPERT) return 'pro_expert';
  if (priceId === process.env.STRIPE_PRICE_AGENCY) return 'agency';
  return null;
}

/** Map a Stripe subscription status to organizations.billing_status. */
function toOrgBillingStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    default:
      return 'canceled';
  }
}

// ---------------------------------------------------------------------------
// POST /api/billing/create-checkout-session
// ---------------------------------------------------------------------------

export async function createCheckoutSessionHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const stripe = getStripeClient();
  if (!stripe) {
    console.error('Billing: STRIPE_SECRET_KEY not configured');
    res.status(500).json({ code: 'BILLING_NOT_CONFIGURED', message: 'Billing is not available right now.' });
    return;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    // Fail closed: billing requires real Supabase-backed org verification.
    console.error('Billing: Supabase service client not configured');
    res.status(500).json({ code: 'BILLING_NOT_CONFIGURED', message: 'Billing is not available right now.' });
    return;
  }

  const userId = req.user?.id;
  if (!userId || userId === 'dev-user') {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  const { organizationId, planType, successUrl, cancelUrl } = (req.body ?? {}) as {
    organizationId?: string;
    planType?: string;
    successUrl?: string;
    cancelUrl?: string;
  };

  if (!organizationId || typeof organizationId !== 'string') {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'organizationId is required' });
    return;
  }
  if (!planType || !CHECKOUT_PLANS.includes(planType as CheckoutPlanType)) {
    res.status(400).json({ code: 'INVALID_PLAN', message: `planType must be one of: ${CHECKOUT_PLANS.join(', ')}` });
    return;
  }
  if (!successUrl || !cancelUrl) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'successUrl and cancelUrl are required' });
    return;
  }

  const plan = planType as CheckoutPlanType;
  const priceId = getPriceIdForPlan(plan);
  if (!priceId) {
    console.error(`Billing: no Stripe price configured for plan "${plan}"`);
    res.status(500).json({ code: 'BILLING_NOT_CONFIGURED', message: 'Billing is not available right now.' });
    return;
  }

  try {
    // Verify the user owns the org or is an owner/admin member.
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, owner_id')
      .eq('id', organizationId)
      .maybeSingle();

    if (orgError) {
      console.error('Billing: failed to load organization:', orgError.message);
      res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Could not verify organization.' });
      return;
    }
    if (!org) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'You do not have access to this organization.' });
      return;
    }

    let authorized = org.owner_id === userId;
    if (!authorized) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .maybeSingle();
      authorized = membership != null && ['owner', 'admin'].includes(membership.role);
    }
    if (!authorized) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'Only organization owners or admins can manage billing.' });
      return;
    }

    // Reuse the org's Stripe customer if one exists; otherwise create it.
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', organizationId)
      .maybeSingle();

    let customerId = existingSub?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user?.email,
        name: org.name,
        metadata: { organization_id: organizationId },
      });
      customerId = customer.id;
      await supabase
        .from('subscriptions')
        .upsert(
          { organization_id: organizationId, stripe_customer_id: customerId },
          { onConflict: 'organization_id' }
        );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        organization_id: organizationId,
        user_id: userId,
        plan_type: plan,
      },
      subscription_data: {
        metadata: {
          organization_id: organizationId,
          user_id: userId,
          plan_type: plan,
        },
      },
    });

    if (!session.url) {
      res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Could not create checkout session.' });
      return;
    }
    res.json({ url: session.url });
  } catch (err) {
    console.error('Billing: checkout session creation failed:', err);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Could not create checkout session.' });
  }
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/stripe
// ---------------------------------------------------------------------------

interface SubscriptionPeriod {
  start: string | null;
  end: string | null;
}

/**
 * Stripe moved current_period_* from the subscription to its items in newer
 * API versions; read from either location.
 */
function getSubscriptionPeriod(subscription: Stripe.Subscription): SubscriptionPeriod {
  const item = subscription.items?.data?.[0] as
    | (Stripe.SubscriptionItem & { current_period_start?: number; current_period_end?: number })
    | undefined;
  const legacy = subscription as unknown as { current_period_start?: number; current_period_end?: number };
  const start = item?.current_period_start ?? legacy.current_period_start;
  const end = item?.current_period_end ?? legacy.current_period_end;
  return {
    start: start ? new Date(start * 1000).toISOString() : null,
    end: end ? new Date(end * 1000).toISOString() : null,
  };
}

async function applySubscriptionState(subscription: Stripe.Subscription): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Stripe webhook: Supabase service client not configured; cannot persist subscription state');
    return;
  }

  let organizationId = subscription.metadata?.organization_id ?? null;
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? null;

  if (!organizationId) {
    // Fall back to looking up by subscription id, then customer id.
    const { data: bySub } = await supabase
      .from('subscriptions')
      .select('organization_id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();
    organizationId = bySub?.organization_id ?? null;
    if (!organizationId && customerId) {
      const { data: byCustomer } = await supabase
        .from('subscriptions')
        .select('organization_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();
      organizationId = byCustomer?.organization_id ?? null;
    }
  }

  if (!organizationId) {
    console.error(`Stripe webhook: could not resolve organization for subscription ${subscription.id}`);
    return;
  }

  const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
  const planFromPrice = getPlanForPriceId(priceId);
  const planFromMetadata = subscription.metadata?.plan_type as CheckoutPlanType | undefined;
  const planType: string =
    planFromPrice ?? (planFromMetadata && CHECKOUT_PLANS.includes(planFromMetadata) ? planFromMetadata : 'free');

  const period = getSubscriptionPeriod(subscription);
  const isDeleted = subscription.status === 'canceled';

  const { error: upsertError } = await supabase.from('subscriptions').upsert(
    {
      organization_id: organizationId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      plan_type: isDeleted ? 'free' : planType,
      status: subscription.status,
      current_period_start: period.start,
      current_period_end: period.end,
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      metadata: subscription.metadata ?? {},
    },
    { onConflict: 'organization_id' }
  );
  if (upsertError) {
    console.error('Stripe webhook: failed to upsert subscription:', upsertError.message);
    return;
  }

  // Keep organizations.billing_plan/billing_status in sync — the app still
  // reads plan/status from organizations.
  const orgPlan = isDeleted
    ? 'free'
    : PLAN_TO_ORG_BILLING_PLAN[planType as CheckoutPlanType] ?? 'free';
  const { error: orgError } = await supabase
    .from('organizations')
    .update({
      billing_plan: orgPlan,
      billing_status: toOrgBillingStatus(subscription.status),
    })
    .eq('id', organizationId);
  if (orgError) {
    console.error('Stripe webhook: failed to update organization billing fields:', orgError.message);
  }
}

export async function stripeWebhookHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    console.error('Stripe webhook: STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not configured');
    res.status(500).json({ code: 'BILLING_NOT_CONFIGURED', message: 'Webhook not configured.' });
    return;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Stripe webhook: Supabase service client not configured');
    res.status(500).json({ code: 'BILLING_NOT_CONFIGURED', message: 'Webhook not configured.' });
    return;
  }

  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    res.status(400).json({ code: 'INVALID_SIGNATURE', message: 'Missing stripe-signature header' });
    return;
  }

  let event: Stripe.Event;
  try {
    // req.body is a Buffer here (express.raw is mounted for this route).
    event = stripe.webhooks.constructEvent(req.body as Buffer, signature, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook: signature verification failed:', err instanceof Error ? err.message : err);
    res.status(400).json({ code: 'INVALID_SIGNATURE', message: 'Webhook signature verification failed' });
    return;
  }

  // Idempotency: record the event id first; a unique-violation means we
  // already processed it.
  const { error: insertError } = await supabase.from('stripe_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event.data.object as unknown as Record<string, unknown>,
  });
  if (insertError) {
    if (insertError.code === '23505') {
      res.json({ received: true, duplicate: true });
      return;
    }
    console.error('Stripe webhook: failed to record event:', insertError.message);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Could not record event.' });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          // Checkout metadata is authoritative for the org on first purchase.
          if (!subscription.metadata?.organization_id && session.metadata?.organization_id) {
            subscription.metadata = { ...subscription.metadata, ...session.metadata };
          }
          await applySubscriptionState(subscription);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await applySubscriptionState(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        // Unhandled event types are acknowledged without processing.
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error(`Stripe webhook: failed to process ${event.type}:`, err);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Event processing failed.' });
  }
}
