-- Steward demo seed helper for Kinetic Grappling (BJJ gym example).
-- Call after creating an organization and brand:
--   select public.seed_kinetic_grappling_demo('<organization_uuid>', '<brand_uuid>');

create or replace function public.seed_kinetic_grappling_demo(
  p_organization_id uuid,
  p_brand_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_location_id uuid;
  v_pillar_kids uuid;
  v_pillar_adult uuid;
  v_pillar_comp uuid;
  v_pillar_community uuid;
  v_pillar_bts uuid;
  v_campaign_id uuid;
begin
  if not exists (
    select 1 from public.organizations o where o.id = p_organization_id
  ) then
    raise exception 'Organization % not found', p_organization_id;
  end if;

  if not exists (
    select 1 from public.brands b
    where b.id = p_brand_id and b.organization_id = p_organization_id
  ) then
    raise exception 'Brand % not found for organization %', p_brand_id, p_organization_id;
  end if;

  update public.brands
  set
    business_name = 'Kinetic Grappling',
    website = 'https://kineticgrappling.example',
    phone = '(555) 123-4567',
    email = 'hello@kineticgrappling.example',
    address = '123 Mat Lane',
    city = 'Austin',
    state = 'TX',
    country = 'US',
    industry = 'Brazilian Jiu-Jitsu / Martial Arts',
    audience_description = 'Adults seeking fitness and self-defense, parents looking for confidence-building programs for kids, and competitors preparing for tournaments.',
    brand_voice = 'Encouraging, disciplined, community-focused, and authentic. Celebrate progress over perfection.',
    words_to_use = '["confidence","discipline","community","technique","progress","family"]'::jsonb,
    words_to_avoid = '["easy","guaranteed black belt","intimidating"]'::jsonb,
    tone_settings = '{"energy":"motivating","formality":"casual-professional"}'::jsonb,
    cta_preferences = '["Book a free trial","Visit our website","Call us today","DM us to get started"]'::jsonb,
    hashtag_bank = '["#KineticGrappling","#BJJLife","#AustinBJJ","#KidsBJJ","#NoGi","#JiuJitsuFamily","#TrainHard"]'::jsonb,
    offer_language = '["Free trial class","First week on us","Bring a friend"]'::jsonb,
    posting_goals = '["Fill kids classes","Promote adult fundamentals","Highlight competition team","Build community trust"]'::jsonb,
    platform_priorities = '["instagram","facebook","tiktok","youtube"]'::jsonb,
    visual_style_notes = 'High-energy gym photos, candid training shots, clean branded graphics for schedules and offers.',
    ai_system_instructions = 'You are Steward, the social media manager for Kinetic Grappling, a Brazilian Jiu-Jitsu gym in Austin, TX. Write posts that motivate beginners, reassure parents, and celebrate student wins. Always include a clear CTA aligned with free trial or class schedule content.',
    is_default = true,
    metadata = '{"demo": true, "demo_name": "Kinetic Grappling"}'::jsonb
  where id = p_brand_id;

  update public.organizations
  set
    org_type = 'local_business',
    business_category = 'martial_arts_gym',
    timezone = 'America/Chicago',
    default_locale = 'en-US',
    onboarding_status = 'demo_seeded',
    default_brand_id = p_brand_id,
    settings = coalesce(settings, '{}'::jsonb) || '{"postingCadence":{"instagram":5,"facebook":3,"tiktok":4}}'::jsonb
  where id = p_organization_id;

  insert into public.business_locations (
    organization_id, brand_id, name, address, city, state, country, phone, is_primary
  ) values (
    p_organization_id, p_brand_id, 'Kinetic Grappling Main Gym',
    '123 Mat Lane', 'Austin', 'TX', 'US', '(555) 123-4567', true
  )
  on conflict do nothing
  returning id into v_location_id;

  if v_location_id is null then
    select id into v_location_id
    from public.business_locations
    where brand_id = p_brand_id and name = 'Kinetic Grappling Main Gym'
    limit 1;
  end if;

  insert into public.content_pillars (organization_id, brand_id, name, slug, description, sort_order)
  values
    (p_organization_id, p_brand_id, 'Student Success', 'student-success', 'Highlight student wins and transformations.', 1),
    (p_organization_id, p_brand_id, 'Kids Confidence', 'kids-confidence', 'Parent-focused content about kids BJJ benefits.', 2),
    (p_organization_id, p_brand_id, 'Adult Fitness', 'adult-fitness', 'Adult fundamentals, fitness, and self-defense.', 3),
    (p_organization_id, p_brand_id, 'Competition', 'competition', 'Comp team training, tournaments, and results.', 4),
    (p_organization_id, p_brand_id, 'Community', 'community', 'Gym culture, events, and member stories.', 5),
    (p_organization_id, p_brand_id, 'Behind the Scenes', 'behind-the-scenes', 'Coaches, classes, and daily gym life.', 6),
    (p_organization_id, p_brand_id, 'Free Trial Offer', 'free-trial-offer', 'Promotional CTAs for trial classes.', 7)
  on conflict (brand_id, slug) do nothing;

  select id into v_pillar_kids from public.content_pillars where brand_id = p_brand_id and slug = 'kids-confidence';
  select id into v_pillar_adult from public.content_pillars where brand_id = p_brand_id and slug = 'adult-fitness';
  select id into v_pillar_comp from public.content_pillars where brand_id = p_brand_id and slug = 'competition';
  select id into v_pillar_community from public.content_pillars where brand_id = p_brand_id and slug = 'community';
  select id into v_pillar_bts from public.content_pillars where brand_id = p_brand_id and slug = 'behind-the-scenes';

  insert into public.audience_segments (organization_id, brand_id, name, slug, description, is_primary)
  values
    (p_organization_id, p_brand_id, 'Kids Parents', 'kids-parents', 'Parents of children ages 5-12 seeking confidence and discipline.', true),
    (p_organization_id, p_brand_id, 'Adult Beginners', 'adult-beginners', 'Adults new to BJJ looking for fitness and self-defense.', false),
    (p_organization_id, p_brand_id, 'Competitors', 'competitors', 'Experienced students preparing for tournaments.', false)
  on conflict (brand_id, slug) do nothing;

  insert into public.recurring_schedules (
    organization_id, brand_id, location_id, name, slug, schedule_type,
    day_of_week, start_time, end_time, instructor_name, audience_segment, description
  ) values
    (p_organization_id, p_brand_id, v_location_id, 'Kids BJJ', 'kids-bjj', 'class', 1, '16:30', '17:30', 'Coach Maya', 'kids-parents', 'Kids BJJ — ages 5-12. Confidence, discipline, and fun.'),
    (p_organization_id, p_brand_id, v_location_id, 'Adult Fundamentals', 'adult-fundamentals', 'class', 2, '18:00', '19:00', 'Coach Ryan', 'adult-beginners', 'Adult Fundamentals — perfect for beginners.'),
    (p_organization_id, p_brand_id, v_location_id, 'No-Gi', 'no-gi', 'class', 3, '18:00', '19:00', 'Coach Ryan', 'adult-beginners', 'No-Gi class — fast-paced grappling without the kimono.'),
    (p_organization_id, p_brand_id, v_location_id, 'Power Hour', 'power-hour', 'class', 4, '06:00', '07:00', 'Coach Ana', 'adult-beginners', 'Power Hour — early morning conditioning and drills.'),
    (p_organization_id, p_brand_id, v_location_id, 'Competition Class', 'competition-class', 'class', 5, '17:00', '18:30', 'Coach Ryan', 'competitors', 'Competition Class — advanced training for tournament prep.')
  on conflict (brand_id, slug) do nothing;

  insert into public.reusable_snippets (organization_id, brand_id, name, slug, snippet_type, content, tags)
  values
    (p_organization_id, p_brand_id, 'Free Trial CTA', 'free-trial-cta', 'cta', 'Ready to roll? Book your free trial class today — no experience needed.', '["cta","offer"]'::jsonb),
    (p_organization_id, p_brand_id, 'Website CTA', 'website-cta', 'cta', 'Learn more and view our full schedule at kineticgrappling.example.', '["cta","website"]'::jsonb),
    (p_organization_id, p_brand_id, 'Phone CTA', 'phone-cta', 'cta', 'Questions? Call us at (555) 123-4567 — we would love to hear from you.', '["cta","phone"]'::jsonb),
    (p_organization_id, p_brand_id, 'Gym Hashtags', 'gym-hashtags', 'hashtags', '#KineticGrappling #BJJLife #AustinBJJ #JiuJitsuFamily', '["hashtags","gym"]'::jsonb),
    (p_organization_id, p_brand_id, 'Kids Hashtags', 'kids-hashtags', 'hashtags', '#KidsBJJ #ConfidenceOnTheMat #FutureChampions', '["hashtags","kids"]'::jsonb)
  on conflict (brand_id, slug) do nothing;

  insert into public.offers (
    organization_id, brand_id, name, slug, headline, description, cta_text, cta_url, is_active
  ) values (
    p_organization_id, p_brand_id, 'Free Trial Class', 'free-trial-class',
    'Try your first class free',
    'New to BJJ? Your first class is on us. Gi or No-Gi welcome.',
    'Book free trial', 'https://kineticgrappling.example/free-trial', true
  )
  on conflict (brand_id, slug) do nothing;

  insert into public.automation_rules (
    organization_id, brand_id, name, trigger_type, trigger_config, action_type, action_config, enabled, next_run_at
  )
  select * from (values
    (
      p_organization_id, p_brand_id,
      'Monday Kids Class Reminder',
      'schedule_cron'::public.steward_automation_trigger_type,
      '{"cron":"0 8 * * 1","pillar_slug":"kids-confidence"}'::jsonb,
      'create_draft'::public.steward_automation_action_type,
      '{"template":"Reminder: Kids BJJ today at 4:30 PM. Confidence starts on the mat!"}'::jsonb,
      true,
      now() + interval '1 day'
    ),
    (
      p_organization_id, p_brand_id,
      'Friday Competition Class Reminder',
      'schedule_cron'::public.steward_automation_trigger_type,
      '{"cron":"0 9 * * 5","pillar_slug":"competition"}'::jsonb,
      'create_draft'::public.steward_automation_action_type,
      '{"template":"Competition Class tonight at 5 PM. Show up sharp, leave sharper."}'::jsonb,
      true,
      now() + interval '1 day'
    ),
    (
      p_organization_id, p_brand_id,
      'Auto-caption on gym photo upload',
      'asset_uploaded'::public.steward_automation_trigger_type,
      '{"asset_types":["image","video"],"content_category":"gym"}'::jsonb,
      'generate_captions'::public.steward_automation_action_type,
      '{"variants":3,"require_approval":true}'::jsonb,
      true,
      null::timestamptz
    )
  ) as v(organization_id, brand_id, name, trigger_type, trigger_config, action_type, action_config, enabled, next_run_at)
  where not exists (
    select 1 from public.automation_rules ar
    where ar.brand_id = p_brand_id and ar.name = v.name
  );

  insert into public.campaigns (
    organization_id, brand_id, name, description, goal, status
  ) values (
    p_organization_id, p_brand_id,
    'Spring Free Trial Push',
    'Drive new student sign-ups with class highlights and parent-focused content.',
    'Increase free trial bookings by 25%',
    'active'
  )
  returning id into v_campaign_id;

  insert into public.posts (
    organization_id, brand_id, campaign_id, content_pillar_id, content, main_caption,
    title, hook, cta, platform, status, author_id, hashtags, metadata
  )
  select
    p_organization_id,
    p_brand_id,
    v_campaign_id,
    v_pillar_kids,
    'Monday motivation: Kids BJJ builds confidence that lasts beyond the mat.',
    'Monday motivation: Kids BJJ builds confidence that lasts beyond the mat.',
    'Kids Confidence Monday',
    'Confidence starts with one class.',
    'Book a free trial today!',
    'instagram',
    'idea',
    (select owner_id from public.organizations where id = p_organization_id),
    '["#KidsBJJ","#KineticGrappling","#AustinBJJ"]'::jsonb,
    '{"demo":true,"source":"seed"}'::jsonb
  where not exists (
    select 1 from public.posts
    where brand_id = p_brand_id and title = 'Kids Confidence Monday'
  );

  insert into public.content_calendar_entries (
    organization_id, brand_id, campaign_id, title, scheduled_for, platform, status, requires_approval
  )
  select
    p_organization_id, p_brand_id, v_campaign_id,
    'Kids BJJ Monday post',
    date_trunc('week', now()) + interval '1 day 9 hours',
    'instagram'::public.steward_platform,
    'planned',
    true
  where not exists (
    select 1 from public.content_calendar_entries
    where brand_id = p_brand_id and title = 'Kids BJJ Monday post'
  );

  insert into public.content_insights (
    organization_id, brand_id, insight_type, insight_key, insight_value, confidence, recommended_actions
  )
  select
    p_organization_id, p_brand_id,
    insight_type, insight_key, insight_value, confidence, recommended_actions
  from (values
    (
      'posting_time', 'instagram_weekday_morning',
      '{"day_of_week":1,"hour":9,"engagement_lift":0.18}'::jsonb,
      0.72,
      '["Schedule kids-focused posts Monday 9 AM CT on Instagram"]'::jsonb
    ),
    (
      'content_theme', 'student_success_stories',
      '{"avg_engagement_rate":0.045}'::jsonb,
      0.81,
      '["Create 2 student spotlight posts per month"]'::jsonb
    )
  ) as v(insight_type, insight_key, insight_value, confidence, recommended_actions)
  where not exists (
    select 1 from public.content_insights ci
    where ci.brand_id = p_brand_id and ci.insight_key = v.insight_key
  );
end;
$$;

revoke all on function public.seed_kinetic_grappling_demo(uuid, uuid) from public;
grant execute on function public.seed_kinetic_grappling_demo(uuid, uuid) to authenticated, service_role;

comment on function public.seed_kinetic_grappling_demo(uuid, uuid) is
  'Seeds editable demo brand strategy data for a BJJ gym example (Kinetic Grappling).';
