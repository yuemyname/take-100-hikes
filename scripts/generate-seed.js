#!/usr/bin/env node
/**
 * Generates supabase/seed.sql from src/data/mountains.json and the audited BAC CSV.
 * Run: node scripts/generate-seed.js
 */
const fs = require('node:fs');
const path = require('node:path');

const mountains = require('../src/data/mountains.json');
const BAC_DATA_PATH = path.join(__dirname, '..', 'docs', 'data', 'bac100-candidates.csv');

const BAC_ONLY_SLUGS = new Map([
  ['수락산', 'suraksan'],
  ['청계산', 'cheonggyesan-seoul'],
  ['연인산', 'yeoninsan'],
  ['감악산(원주)', 'gamaksan-wonju'],
  ['오대산 노인봉', 'odaesan-noinbong'],
  ['함백산', 'hambaeksan'],
  ['청화산', 'cheonghwasan'],
  ['칠보산(괴산)', 'chilbosan-goesan'],
  ['가야산(충남)', 'gayasan-yesan'],
  ['광덕산', 'gwangdeoksan-cheonan'],
  ['오서산(보령)', 'oseosan'],
  ['용봉산(홍성)', 'yongbongsan-hongseong'],
  ['구봉산(진안)', 'gubongsan-jinan'],
  ['지리산 바래봉', 'jirisan-baraebong'],
  ['지리산 반야봉', 'jirisan-banyabong'],
  ['달마산', 'dalmasan'],
  ['덕룡산', 'deongnyongsan'],
  ['동악산(곡성)', 'dongaksan-gokseong'],
  ['불갑산(영광)', 'bulgapsan-yeonggwang'],
  ['축령산(장성)', 'chungnyeongsan-jangseong'],
  ['조령산', 'joryeongsan'],
]);

function parseCsv(input) {
  const table = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (quoted && char === '"' && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ',') {
      row.push(field);
      field = '';
    } else if (!quoted && char === '\n') {
      row.push(field.replace(/\r$/, ''));
      table.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    table.push(row);
  }
  return table;
}

const normalizeSpacing = (name) => name.replace(/\s+/g, '');
const baseName = (name) => normalizeSpacing(name).replace(/\([^)]*\)/g, '');

function loadBacRows() {
  const table = parseCsv(fs.readFileSync(BAC_DATA_PATH, 'utf8'));
  const headers = table.shift();
  return table.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]])));
}

function resolveForestSlug(sourceName) {
  const forestMountains = mountains.filter((mountain) => mountain.display_order <= 100 && mountain.slug !== 'oseosan');
  const exact = forestMountains.filter((mountain) => normalizeSpacing(mountain.name_ko) === normalizeSpacing(sourceName));
  if (exact.length === 1) return exact[0].slug;

  const byBaseName = forestMountains.filter((mountain) => baseName(mountain.name_ko) === baseName(sourceName));
  if (byBaseName.length === 1) return byBaseName[0].slug;
  throw new Error(`Could not uniquely resolve Forestry identity: ${sourceName}`);
}

function buildMemberships() {
  const gitdaebong = mountains.find((mountain) => mountain.slug === 'gitdaebong-hongdo');
  if (!gitdaebong) throw new Error('Missing Forestry identity: gitdaebong-hongdo');

  const forestMemberships = mountains
    .filter((mountain) => mountain.display_order <= 100 && mountain.slug !== 'oseosan')
    .map((mountain) => ({
      collectionId: 'forest_service_100',
      slug: mountain.slug,
      displayOrder: mountain.display_order,
      sourceLabel: '산림청 100대 명산',
      verificationPointName: null,
    }));
  forestMemberships.push({
    collectionId: 'forest_service_100',
    slug: gitdaebong.slug,
    displayOrder: 69,
    sourceLabel: '산림청 100대 명산',
    verificationPointName: null,
  });
  forestMemberships.sort((a, b) => a.displayOrder - b.displayOrder);

  const bacMemberships = loadBacRows().map((row) => {
    const slug = row.forest_service_match
      ? resolveForestSlug(row.forest_service_match)
      : BAC_ONLY_SLUGS.get(row.mountain_name);
    if (!slug || !mountains.some((mountain) => mountain.slug === slug)) {
      throw new Error(`Could not resolve BAC identity: ${row.mountain_name}`);
    }
    return {
      collectionId: 'bac_100',
      slug,
      displayOrder: Number(row.order),
      sourceLabel: row.mountain_name,
      verificationPointName: row.verification_point,
    };
  });

  const forestSlugs = new Set(forestMemberships.map((membership) => membership.slug));
  const bacSlugs = new Set(bacMemberships.map((membership) => membership.slug));
  const intersectionCount = [...forestSlugs].filter((slug) => bacSlugs.has(slug)).length;
  const unionCount = new Set([...forestSlugs, ...bacSlugs]).size;

  if (forestMemberships.length !== 100 || forestSlugs.size !== 100) throw new Error('Forestry membership must contain 100 unique mountains.');
  if (bacMemberships.length !== 100 || bacSlugs.size !== 100) throw new Error('BAC membership must contain 100 unique mountains.');
  if (intersectionCount !== 79 || unionCount !== 121) {
    throw new Error(`Unexpected collection overlap: intersection=${intersectionCount}, union=${unionCount}`);
  }

  return [...forestMemberships, ...bacMemberships];
}

const q = (value) => (value === null || value === undefined ? 'null' : `'${String(value).replace(/'/g, "''")}'`);
const n = (value) => (value === null || value === undefined ? 'null' : String(value));

const rows = mountains.map(
  (m) =>
    `  (${q(m.slug)}, ${q(m.name_ko)}, ${q(m.name_en)}, ${n(m.altitude_m)}, ${q(m.region)}, ${n(m.latitude)}, ${n(m.longitude)}, ${n(m.verification_radius_m)}, ${q(m.image_url)}, ${q(m.mascot_key)}, ${q(m.description)}, ${n(m.display_order)})`,
);

const memberships = buildMemberships();
const membershipRows = memberships.map(
  (membership) =>
    `  (${q(membership.collectionId)}, ${q(membership.slug)}, ${n(membership.displayOrder)}, ${q(membership.sourceLabel)}, ${q(membership.verificationPointName)})`,
);

const membershipSql = `-- Collection membership is derived from the audited source identities, never name-matched in SQL.
-- The BAC order is the repository's documented staging order, not an official BAC ranking.
create temporary table collection_membership_seed (
  collection_id text not null,
  mountain_slug text not null,
  display_order integer not null,
  source_label text not null,
  verification_point_name text
) on commit drop;

insert into collection_membership_seed (
  collection_id,
  mountain_slug,
  display_order,
  source_label,
  verification_point_name
)
values
${membershipRows.join(',\n')};

-- BAC checkpoint names are safe to seed, but coordinates and radii are not.
-- Existing verified points are preserved when this seed is rerun.
insert into public.verification_points (
  mountain_id,
  name_ko,
  latitude,
  longitude,
  verification_radius_m,
  coordinate_status,
  source_note
)
select
  mountain.id,
  seed.verification_point_name,
  null,
  null,
  null,
  'pending',
  'BAC 명산100 공개 목록의 인증지명(2026-09-08 확인). GPS 좌표와 인증 반경은 미검증.'
from collection_membership_seed seed
join public.mountains mountain on mountain.slug = seed.mountain_slug
where seed.collection_id = 'bac_100'
  and seed.verification_point_name is not null
on conflict (mountain_id, name_ko) do nothing;

delete from public.collection_mountains
where collection_id in ('forest_service_100', 'bac_100');

insert into public.collection_mountains (
  collection_id,
  mountain_id,
  verification_point_id,
  display_order,
  source_label
)
select
  seed.collection_id,
  mountain.id,
  point.id,
  seed.display_order,
  seed.source_label
from collection_membership_seed seed
join public.mountains mountain on mountain.slug = seed.mountain_slug
left join public.verification_points point
  on point.mountain_id = mountain.id
 and point.name_ko = seed.verification_point_name
on conflict (collection_id, mountain_id) do update set
  verification_point_id = excluded.verification_point_id,
  display_order = excluded.display_order,
  source_label = excluded.source_label;

do $$
declare
  forest_count integer;
  bac_count integer;
  shared_count integer;
  bac_linked_point_count integer;
  unsafe_pending_point_count integer;
  desired_identity_count integer;
  available_identity_count integer;
begin
  select count(distinct mountain_slug) into desired_identity_count
  from collection_membership_seed;

  select count(distinct seed.mountain_slug) into available_identity_count
  from collection_membership_seed seed
  join public.mountains mountain on mountain.slug = seed.mountain_slug;

  select count(*) into forest_count
  from public.collection_mountains
  where collection_id = 'forest_service_100';

  select count(*) into bac_count
  from public.collection_mountains
  where collection_id = 'bac_100';

  select count(*) into shared_count
  from public.collection_mountains forest
  join public.collection_mountains bac on bac.mountain_id = forest.mountain_id
  where forest.collection_id = 'forest_service_100'
    and bac.collection_id = 'bac_100';

  select count(*) into bac_linked_point_count
  from public.collection_mountains
  where collection_id = 'bac_100'
    and verification_point_id is not null;

  select count(*) into unsafe_pending_point_count
  from public.collection_mountains membership
  join public.verification_points point on point.id = membership.verification_point_id
  where membership.collection_id = 'bac_100'
    and point.coordinate_status = 'pending'
    and (
      point.latitude is not null
      or point.longitude is not null
      or point.verification_radius_m is not null
    );

  if available_identity_count = desired_identity_count
     and (
       forest_count <> 100
       or bac_count <> 100
       or shared_count <> 79
       or bac_linked_point_count <> 100
       or unsafe_pending_point_count <> 0
     )
  then
    raise exception
      'invalid collection seed: forest=%, bac=%, shared=%, bac_points=%, unsafe_pending=%',
      forest_count,
      bac_count,
      shared_count,
      bac_linked_point_count,
      unsafe_pending_point_count;
  end if;
end;
$$;`;

const sql = `-- Generated by scripts/generate-seed.js from src/data/mountains.json. Do not edit by hand.
-- Mountain identities currently used by the supported collections. Null GPS fields
-- are intentional: pending verification points must never be guessed or activated.

insert into public.mountains
  (slug, name_ko, name_en, altitude_m, region, latitude, longitude, verification_radius_m, image_url, mascot_key, description, display_order)
values
${rows.join(',\n')}
on conflict (slug) do update set
  name_ko = excluded.name_ko,
  name_en = excluded.name_en,
  altitude_m = excluded.altitude_m,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  verification_radius_m = excluded.verification_radius_m,
  image_url = coalesce(public.mountains.image_url, excluded.image_url),
  mascot_key = excluded.mascot_key,
  description = excluded.description,
  display_order = excluded.display_order;

${membershipSql}
`;

if (process.argv.includes('--print-membership-sql')) {
  process.stdout.write(`${membershipSql}\n`);
} else {
  const out = path.join(__dirname, '..', 'supabase', 'seed.sql');
  fs.writeFileSync(out, sql);
  console.log(`wrote ${out} (${mountains.length} mountains, ${memberships.length} memberships)`);
}
