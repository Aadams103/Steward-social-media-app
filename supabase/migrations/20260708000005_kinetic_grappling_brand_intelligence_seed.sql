-- Steward Brand Intelligence (part 5): Kinetic Grappling demo seed (optional, editable).
-- Usage: select public.seed_kinetic_grappling_brand_intelligence('<org_uuid>', '<brand_uuid>', '<user_uuid>');

create or replace function public.seed_kinetic_grappling_brand_intelligence(
  p_organization_id uuid,
  p_brand_id uuid,
  p_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_location_id uuid;
  v_cta_trial uuid;
  v_cta_web uuid;
  v_cta_dm uuid;
  v_pillar_kids uuid;
  v_pillar_offer uuid;
  v_seg_parents uuid;
begin
  if not exists (select 1 from public.brands b where b.id = p_brand_id and b.organization_id = p_organization_id) then
    raise exception 'Brand not found';
  end if;

  -- Brand profile
  insert into public.brand_profiles (
    organization_id, brand_id, business_name, public_brand_name, business_type, industry, niche,
    website_url, city, state, country, timezone, short_description, brand_voice_summary, default_tone,
    personality_traits, words_to_use, words_to_avoid, phrases_to_avoid, safety_notes, ai_system_notes,
    primary_goals, unique_selling_points
  ) values (
    p_organization_id, p_brand_id,
    'Kinetic Grappling', 'Kinetic Grappling',
    'Brazilian Jiu-Jitsu academy', 'Martial Arts', 'Brazilian Jiu-Jitsu / Self-Defense',
    'https://kineticgrappling.com', 'College Station', 'TX', 'US', 'America/Chicago',
    'Family-friendly BJJ academy in College Station, TX focused on confidence, community, and progress.',
    'Energetic, welcoming, family-friendly, community-focused, professional, growth-oriented.',
    'encouraging-professional',
    '["welcoming","disciplined","community-driven","growth-oriented"]'::jsonb,
    '["confidence","community","discipline","progress","family","technique"]'::jsonb,
    '["cringe","guaranteed results","intimidating","violent","threatening","fake hype"]'::jsonb,
    '["cringe","fight bro","destroy","kill"]'::jsonb,
    'Kids content must be family-friendly. Do not identify minors by full name unless explicitly approved.',
    'Steward manages social for Kinetic Grappling in College Station, TX. Use approved class schedule and CTAs. Never invent programs or times.',
    '["Fill classes","Build community trust","Promote free trials","Highlight student wins"]'::jsonb,
    '["Family-friendly academy","Structured programs for kids and adults","Competition team","Free trial available"]'::jsonb
  )
  on conflict (brand_id) do update set
    business_name = excluded.business_name,
    city = excluded.city,
    state = excluded.state,
    brand_voice_summary = excluded.brand_voice_summary,
    safety_notes = excluded.safety_notes,
    updated_at = now();

  -- User preferences
  if p_user_id is not null then
    insert into public.user_brand_preferences (
      organization_id, brand_id, user_id, preferred_tone, preferred_hashtag_count,
      preferred_cta_style, always_require_review, auto_publish_enabled, notes
    ) values (
      p_organization_id, p_brand_id, p_user_id,
      'encouraging-professional', 8, 'direct-friendly', true, false,
      'Prefer community-focused captions. Avoid aggressive fight language.'
    )
    on conflict (brand_id, user_id) do update set updated_at = now();
  end if;

  -- Location
  insert into public.business_locations (
    organization_id, brand_id, name, address_line_1, city, state, country, timezone, is_primary, active, website_url
  ) values (
    p_organization_id, p_brand_id, 'Kinetic Grappling',
    'College Station, TX', 'College Station', 'TX', 'US', 'America/Chicago', true, true,
    'https://kineticgrappling.com'
  )
  on conflict do nothing;

  select id into v_location_id from public.business_locations
  where brand_id = p_brand_id and name = 'Kinetic Grappling' limit 1;

  -- CTAs
  insert into public.brand_ctas (organization_id, brand_id, label, cta_text, cta_type, destination_url, priority)
  values
    (p_organization_id, p_brand_id, 'Free Trial', 'Book a free trial', 'free_trial', 'https://kineticgrappling.com', 1),
    (p_organization_id, p_brand_id, 'Website', 'Visit kineticgrappling.com', 'website', 'https://kineticgrappling.com', 2),
    (p_organization_id, p_brand_id, 'DM Us', 'DM us to get started', 'dm', null, 3),
    (p_organization_id, p_brand_id, 'Start Training', 'Start your training this week', 'booking', null, 4)
  on conflict do nothing;

  select id into v_cta_trial from public.brand_ctas where brand_id = p_brand_id and label = 'Free Trial' limit 1;
  select id into v_cta_web from public.brand_ctas where brand_id = p_brand_id and label = 'Website' limit 1;
  select id into v_cta_dm from public.brand_ctas where brand_id = p_brand_id and label = 'DM Us' limit 1;

  -- Hashtags
  insert into public.brand_hashtags (organization_id, brand_id, hashtag, category, priority)
  select p_organization_id, p_brand_id, h, c, p from (values
    ('KineticGrappling', 'brand', 1),
    ('getbettereveryday', 'personal', 1),
    ('BJJLife', 'community', 2),
    ('CollegeStationBJJ', 'local', 2),
    ('KidsBJJ', 'kids', 3),
    ('NoGi', 'program', 3),
    ('JiuJitsuFamily', 'community', 4)
  ) as t(h, c, p)
  where not exists (select 1 from public.brand_hashtags bh where bh.brand_id = p_brand_id and bh.hashtag = t.h);

  -- Audience segments
  insert into public.audience_segments (organization_id, brand_id, name, slug, description, pain_points, goals, priority, is_primary)
  values
    (p_organization_id, p_brand_id, 'Parents (Kids BJJ)', 'parents-kids-bjj',
     'Parents seeking confidence, discipline, and a safe activity for children.', '["Kids need confidence","Need structured activity"]'::jsonb, '["Build discipline","Safe environment"]'::jsonb, 1, true),
    (p_organization_id, p_brand_id, 'Adult Beginners', 'adult-beginners',
     'Adults new to BJJ seeking fitness and self-defense.', '["Intimidated to start","Want fitness"]'::jsonb, '["Get fit","Learn self-defense"]'::jsonb, 2, false),
    (p_organization_id, p_brand_id, 'Competitors', 'competitors',
     'Experienced students preparing for tournaments.', '["Need advanced training"]'::jsonb, '["Compete and improve"]'::jsonb, 3, false)
  on conflict (brand_id, slug) do nothing;

  select id into v_seg_parents from public.audience_segments where brand_id = p_brand_id and slug = 'parents-kids-bjj';

  -- Content pillars
  insert into public.content_pillars (organization_id, brand_id, name, slug, description, priority, example_hooks, preferred_ctas)
  values
    (p_organization_id, p_brand_id, 'Student Success', 'student-success', 'Highlight student wins and progress.', 1, '["Progress over perfection","Every journey starts with one class"]'::jsonb, '["Book a free trial"]'::jsonb),
    (p_organization_id, p_brand_id, 'Kids Confidence', 'kids-confidence', 'Parent-focused kids BJJ content.', 2, '["Confidence starts on the mat"]'::jsonb, '["Book a free trial"]'::jsonb),
    (p_organization_id, p_brand_id, 'Adult Fitness', 'adult-fitness', 'Adult fundamentals and fitness.', 3, '["Stronger every class"]'::jsonb, '["Start your training this week"]'::jsonb),
    (p_organization_id, p_brand_id, 'Self-Defense', 'self-defense', 'Practical self-defense education.', 4, '["Skills that translate off the mat"]'::jsonb, '["Visit kineticgrappling.com"]'::jsonb),
    (p_organization_id, p_brand_id, 'Technique Education', 'technique-education', 'Technical tips and education.', 5, '["Small details, big results"]'::jsonb, '["DM us to get started"]'::jsonb),
    (p_organization_id, p_brand_id, 'Competition', 'competition', 'Comp team and tournament prep.', 6, '["Train with purpose"]'::jsonb, '["Visit kineticgrappling.com"]'::jsonb),
    (p_organization_id, p_brand_id, 'Community', 'community', 'Gym culture and belonging.', 7, '["More than a gym — a team"]'::jsonb, '["DM us to get started"]'::jsonb),
    (p_organization_id, p_brand_id, 'Behind the Scenes', 'behind-the-scenes', 'Coaches, classes, daily gym life.', 8, '["Where champions are built"]'::jsonb, '[]'::jsonb),
    (p_organization_id, p_brand_id, 'Offers / Free Trial', 'offers-free-trial', 'Promotional and trial CTAs.', 9, '["Your first class is on us"]'::jsonb, '["Book a free trial"]'::jsonb)
  on conflict (brand_id, slug) do nothing;

  select id into v_pillar_kids from public.content_pillars where brand_id = p_brand_id and slug = 'kids-confidence';
  select id into v_pillar_offer from public.content_pillars where brand_id = p_brand_id and slug = 'offers-free-trial';

  -- Class schedules (College Station, TX times from spec)
  insert into public.recurring_schedules (
    organization_id, brand_id, location_id, name, slug, title, schedule_type,
    day_of_week, start_time, end_time, timezone, description, audience_segment_id, content_pillar_id
  ) values
    (p_organization_id, p_brand_id, v_location_id, 'Kids BJJ', 'kids-bjj', 'Kids BJJ', 'class', 1, '17:15', '18:00', 'America/Chicago', 'Kids BJJ — Mon 5:15-6:00 PM', v_seg_parents, v_pillar_kids),
    (p_organization_id, p_brand_id, v_location_id, 'Kids BJJ', 'kids-bjj-wed', 'Kids BJJ', 'class', 3, '17:15', '18:00', 'America/Chicago', 'Kids BJJ — Wed 5:15-6:00 PM', v_seg_parents, v_pillar_kids),
    (p_organization_id, p_brand_id, v_location_id, 'Power Hour', 'power-hour-mon', 'Power Hour', 'class', 1, '17:00', '18:00', 'America/Chicago', 'Power Hour — Mon 5:00-6:00 PM', null, null),
    (p_organization_id, p_brand_id, v_location_id, 'Power Hour', 'power-hour-wed', 'Power Hour', 'class', 3, '17:00', '18:00', 'America/Chicago', 'Power Hour — Wed 5:00-6:00 PM', null, null),
    (p_organization_id, p_brand_id, v_location_id, 'Gi Adult Fundamentals', 'gi-adult-mon', 'Gi Adult Fundamentals', 'class', 1, '18:00', '19:20', 'America/Chicago', 'Gi Adult Fundamentals — Mon 6:00-7:20 PM', null, null),
    (p_organization_id, p_brand_id, v_location_id, 'Gi Adult Fundamentals', 'gi-adult-tue', 'Gi Adult Fundamentals', 'class', 2, '18:00', '19:20', 'America/Chicago', 'Gi Adult Fundamentals — Tue 6:00-7:20 PM', null, null),
    (p_organization_id, p_brand_id, v_location_id, 'No-Gi Adult Fundamentals', 'no-gi-adult-wed', 'No-Gi Adult Fundamentals', 'class', 3, '18:00', '19:20', 'America/Chicago', 'No-Gi Adult Fundamentals — Wed 6:00-7:20 PM', null, null),
    (p_organization_id, p_brand_id, v_location_id, 'Competition Class', 'competition-sat', 'Competition Class', 'class', 6, '10:00', '11:30', 'America/Chicago', 'Competition Class — Sat 10:00 AM', null, null)
  on conflict (brand_id, slug) do nothing;

  -- Brand rules
  insert into public.brand_rules (organization_id, brand_id, rule_type, rule_name, rule_description, severity)
  select p_organization_id, p_brand_id, rt, rn, rd, sv from (values
    ('kids_content'::public.steward_brand_rule_type, 'Kids name privacy', 'Do not identify minors by full name unless explicitly provided and approved.', 'block'::public.steward_rule_severity),
    ('forbidden'::public.steward_brand_rule_type, 'No violent language', 'Avoid violent, threatening, or overly aggressive fight-bro language.', 'block'::public.steward_rule_severity),
    ('claims'::public.steward_brand_rule_type, 'No guaranteed results', 'Do not promise guaranteed fitness or ranking outcomes.', 'block'::public.steward_rule_severity),
    ('approval_required'::public.steward_brand_rule_type, 'Kids content review', 'Posts about kids classes require human review before scheduling.', 'warning'::public.steward_rule_severity),
    ('required'::public.steward_brand_rule_type, 'Offer posts need trial CTA', 'Offer/promotion posts should include a free trial CTA when relevant.', 'info'::public.steward_rule_severity)
  ) as v(rt, rn, rd, sv)
  where not exists (select 1 from public.brand_rules br where br.brand_id = p_brand_id and br.rule_name = v.rn);

  -- Platform strategy
  insert into public.platform_strategy (organization_id, brand_id, platform, enabled, priority, caption_style, approval_required, auto_publish_allowed)
  values
    (p_organization_id, p_brand_id, 'instagram', true, 1, 'visual-storytelling', true, false),
    (p_organization_id, p_brand_id, 'facebook', true, 2, 'community-friendly', true, false),
    (p_organization_id, p_brand_id, 'tiktok', true, 3, 'short-energetic', true, false),
    (p_organization_id, p_brand_id, 'youtube', true, 4, 'educational', true, false)
  on conflict (brand_id, platform) do nothing;

  -- Approved memory facts
  insert into public.ai_memory_facts (
    organization_id, brand_id, fact_type, fact_key, fact_value, confidence, source, approved, approved_by, approved_at
  )
  select p_organization_id, p_brand_id, 'business_fact'::public.steward_memory_fact_type, fk, fv, 0.95, 'seed', true, p_user_id, now()
  from (values
    ('location', '{"city":"College Station","state":"TX"}'::jsonb),
    ('website', '{"url":"https://kineticgrappling.com"}'::jsonb),
    ('personal_hashtag', '{"hashtag":"getbettereveryday"}'::jsonb),
    ('social_handle', '{"handle":"@KineticGrappling"}'::jsonb)
  ) as t(fk, fv)
  where not exists (
    select 1 from public.ai_memory_facts m
    where m.brand_id = p_brand_id and m.fact_key = t.fk and m.archived_at is null
  );

  -- Also run legacy seed if present
  perform public.seed_kinetic_grappling_demo(p_organization_id, p_brand_id);
end;
$$;

revoke all on function public.seed_kinetic_grappling_brand_intelligence(uuid, uuid, uuid) from public;
grant execute on function public.seed_kinetic_grappling_brand_intelligence(uuid, uuid, uuid) to authenticated, service_role;
