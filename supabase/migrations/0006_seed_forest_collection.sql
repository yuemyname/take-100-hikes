-- Seed the existing Forestry Service-oriented mountain table into its collection.
-- Safe to rerun: collection + mountain is the primary key.

insert into public.collection_mountains (
  collection_id,
  mountain_id,
  verification_point_id,
  display_order,
  source_label
)
select
  'forest_service_100',
  m.id,
  null,
  coalesce(m.display_order, numbered.fallback_order),
  '산림청 100대 명산'
from public.mountains m
join (
  select id, row_number() over (order by coalesce(display_order, 9999), name_ko)::integer as fallback_order
  from public.mountains
) numbered on numbered.id = m.id
on conflict (collection_id, mountain_id) do update set
  display_order = excluded.display_order,
  source_label = excluded.source_label;

-- BAC membership is intentionally not bulk-seeded here. The current mountain
-- table lacks BAC-only rows and BAC verification points are still pending GPS
-- verification. See docs/data/BAC100_DATA_POLICY.md and docs/COLLECTIONS.md.
