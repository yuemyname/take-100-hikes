#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const DATA_PATH = path.join(__dirname, '..', 'docs', 'data', 'bac100-candidates.csv');
const MOUNTAINS_PATH = path.join(__dirname, '..', 'src', 'data', 'mountains.json');
const MIGRATION_PATH = path.join(__dirname, '..', 'supabase', 'migrations', '0007_add_bac_only_mountains.sql');
const COLLECTION_MIGRATION_PATH = path.join(
  __dirname,
  '..',
  'supabase',
  'migrations',
  '0008_complete_collection_memberships.sql',
);
const VERIFICATION_POINT_MIGRATION_PATH = path.join(
  __dirname,
  '..',
  'supabase',
  'migrations',
  '0013_seed_bac_verification_points.sql',
);
const SEED_PATH = path.join(__dirname, '..', 'supabase', 'seed.sql');
const EXPECTED_HEADERS = [
  'order',
  'province',
  'mountain_name',
  'verification_point',
  'altitude_m',
  'location',
  'forest_service_match',
  'coordinate_status',
];

const BAC_ONLY = new Set([
  '수락산',
  '청계산',
  '연인산',
  '감악산(원주)',
  '오대산 노인봉',
  '함백산',
  '청화산',
  '칠보산(괴산)',
  '가야산(충남)',
  '광덕산',
  '오서산(보령)',
  '용봉산(홍성)',
  '구봉산(진안)',
  '지리산 바래봉',
  '지리산 반야봉',
  '달마산',
  '덕룡산',
  '동악산(곡성)',
  '불갑산(영광)',
  '축령산(장성)',
  '조령산',
]);

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

const LOCKED_CASES = {
  '감악산(파주)': { forest: '감악산', point: '정상' },
  '감악산(원주)': { forest: '', point: '원주/제천 정상석' },
  '가야산(경상)': { forest: '가야산', point: '정상' },
  '가야산(충남)': { forest: '', point: '정상(정상석 설치)' },
  '오대산 비로봉': { forest: '오대산', point: '비로봉' },
  '오대산 노인봉': { forest: '', point: '노인봉' },
  '백운산(광양)': { forest: '백운산(광양)', point: '상봉' },
  '백운산(동강)': { forest: '백운산(정선)', point: '정상' },
  지리산: { forest: '지리산', point: '지리산 천왕봉' },
  '지리산 바래봉': { forest: '', point: '바래봉' },
  '지리산 반야봉': { forest: '', point: '반야봉' },
  '축령산(장성)': { forest: '', point: '정상' },
  '내변산(부안)': { forest: '변산', point: '관음봉' },
  도봉산: { forest: '도봉산(자운봉)', point: '신선대' },
  무등산: { forest: '무등산', point: '서석대 정상석/인왕봉 정상석' },
  천성산: { forest: '천성산', point: '원효봉', altitude: 922 },
};

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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const normalizeIdentity = (name) => name.replace(/\s+/g, '').replace(/\([^)]*\)/g, (group) => group.replace(/\s+/g, ''));

const table = parseCsv(fs.readFileSync(DATA_PATH, 'utf8'));
const headers = table.shift();
assert(JSON.stringify(headers) === JSON.stringify(EXPECTED_HEADERS), 'Unexpected BAC CSV headers.');

const rows = table.map((values, index) => {
  assert(values.length === headers.length, `Row ${index + 2} has ${values.length} columns; expected ${headers.length}.`);
  return Object.fromEntries(headers.map((header, column) => [header, values[column]]));
});

assert(rows.length === 100, `Expected 100 BAC rows; found ${rows.length}.`);
assert(rows.every((row, index) => Number(row.order) === index + 1), 'BAC order must be the complete 1–100 sequence.');
assert(new Set(rows.map((row) => row.mountain_name)).size === 100, 'BAC mountain identities must be unique.');
assert(rows.every((row) => row.coordinate_status === 'pending'), 'Every unverified BAC coordinate must remain pending.');
assert(!headers.includes('latitude') && !headers.includes('longitude'), 'Unverified BAC coordinates must not be added to the staging CSV.');

const matched = rows.filter((row) => row.forest_service_match);
const bacOnly = rows.filter((row) => !row.forest_service_match);
assert(matched.length === 79, `Expected 79 Forestry matches; found ${matched.length}.`);
assert(bacOnly.length === 21, `Expected 21 BAC-only rows; found ${bacOnly.length}.`);
assert(new Set(matched.map((row) => row.forest_service_match)).size === 79, 'A Forestry identity is mapped more than once.');
assert(
  bacOnly.every((row) => BAC_ONLY.has(row.mountain_name)) && BAC_ONLY.size === bacOnly.length,
  'BAC-only identity set differs from the audited 21 rows.',
);

for (const [name, expected] of Object.entries(LOCKED_CASES)) {
  const row = rows.find((candidate) => candidate.mountain_name === name);
  assert(row, `Missing locked identity: ${name}.`);
  assert(row.forest_service_match === expected.forest, `${name}: unexpected Forestry mapping.`);
  assert(row.verification_point === expected.point, `${name}: unexpected verification point.`);
  if (expected.altitude !== undefined) {
    assert(Number(row.altitude_m) === expected.altitude, `${name}: unexpected altitude.`);
  }
}

const mountains = JSON.parse(fs.readFileSync(MOUNTAINS_PATH, 'utf8'));
const migration = fs.readFileSync(MIGRATION_PATH, 'utf8');
const collectionMigration = fs.readFileSync(COLLECTION_MIGRATION_PATH, 'utf8');
const verificationPointMigration = fs.readFileSync(VERIFICATION_POINT_MIGRATION_PATH, 'utf8');
const seedSql = fs.readFileSync(SEED_PATH, 'utf8');
assert(mountains.length === 121, `Expected 121 mountain identities across both collections; found ${mountains.length}.`);
assert(new Set(mountains.map((mountain) => mountain.slug)).size === mountains.length, 'Mountain slugs must be unique.');
assert(
  new Set(mountains.map((mountain) => mountain.display_order)).size === mountains.length,
  'Mountain display_order values must remain unique during the temporary local-seed phase.',
);

for (const row of bacOnly) {
  const slug = BAC_ONLY_SLUGS.get(row.mountain_name);
  assert(slug, `${row.mountain_name}: missing locked app slug.`);
  const mountain = mountains.find((candidate) => candidate.slug === slug);
  assert(mountain, `${row.mountain_name}: missing mountains.json identity (${slug}).`);
  assert(
    normalizeIdentity(mountain.name_ko) === normalizeIdentity(row.mountain_name),
    `${row.mountain_name}: Korean identity name differs from audited BAC data.`,
  );
  assert(Number(mountain.altitude_m) === Number(row.altitude_m), `${row.mountain_name}: altitude differs from audited BAC data.`);
  assert(typeof mountain.name_en === 'string' && mountain.name_en.length > 0, `${row.mountain_name}: English name is required.`);
  assert(typeof mountain.region === 'string' && mountain.region.length > 0, `${row.mountain_name}: region is required.`);
  assert(typeof mountain.area === 'string' && mountain.area.length > 0, `${row.mountain_name}: display area is required.`);
  assert(typeof mountain.description === 'string' && mountain.description.length > 0, `${row.mountain_name}: description is required.`);
  assert(
    mountain.latitude === null && mountain.longitude === null && mountain.verification_radius_m === null,
    `${row.mountain_name}: pending GPS fields must all remain null.`,
  );
  assert(mountain.mascot_key === null, `${row.mountain_name}: BAC-only identity must not introduce a mountain-specific mascot.`);
  assert(
    new RegExp(`'[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}', '${slug}'`).test(migration),
    `${row.mountain_name}: migration must pin a stable UUID next to slug ${slug}.`,
  );
}

const gitdaebong = mountains.find((mountain) => mountain.slug === 'gitdaebong-hongdo');
assert(gitdaebong, 'Missing audited Forestry identity: gitdaebong-hongdo.');
assert(gitdaebong.name_ko === '깃대봉 (홍도)', 'Unexpected Gitdaebong identity name.');
assert(gitdaebong.altitude_m === 368, 'Gitdaebong display altitude must reflect the current Forestry Service detail.');
assert(gitdaebong.area === '전남 신안군 흑산면 홍도', 'Unexpected Gitdaebong location.');
assert(
  gitdaebong.latitude === null && gitdaebong.longitude === null && gitdaebong.verification_radius_m === null,
  'Gitdaebong pending GPS fields must all remain null.',
);
assert(
  collectionMigration.includes("'3c630ad6-14c4-4e68-a694-646921fe0d61',\n  'gitdaebong-hongdo'"),
  'Gitdaebong migration must pin its stable UUID.',
);

const forestSeedRows = seedSql.match(/^  \('forest_service_100', '[^']+', \d+, '산림청 100대 명산', null\)[,;]?$/gm) ?? [];
const bacSeedRows = [...seedSql.matchAll(/^  \('bac_100', '([^']+)', (\d+), '([^']+)', '([^']+)'\)[,;]?$/gm)];
assert(forestSeedRows.length === 100, `Expected 100 Forestry seed memberships; found ${forestSeedRows.length}.`);
assert(bacSeedRows.length === 100, `Expected 100 BAC seed memberships; found ${bacSeedRows.length}.`);
assert(
  seedSql.includes("('forest_service_100', 'gitdaebong-hongdo', 69, '산림청 100대 명산', null)"),
  'Forestry membership must include Gitdaebong.',
);
assert(
  !seedSql.includes("('forest_service_100', 'oseosan', 69, '산림청 100대 명산', null)"),
  'Forestry membership must exclude the legacy Oseosan substitution.',
);
assert(
  seedSql.includes("('bac_100', 'oseosan', 55, '오서산(보령)', '정상')"),
  'BAC membership must include Oseosan and its pending checkpoint at staging order 55.',
);

const migrationPointRows = [
  ...verificationPointMigration.matchAll(/^  \((\d+), '([^']+)', '([^']+)'\)[,;]?$/gm),
];
assert(migrationPointRows.length === 100, `Expected 100 BAC verification-point migration rows; found ${migrationPointRows.length}.`);

for (const [index, row] of rows.entries()) {
  const migrationPoint = migrationPointRows[index];
  assert(Number(migrationPoint?.[1]) === Number(row.order), `${row.mountain_name}: migration order mismatch.`);
  assert(migrationPoint?.[2] === row.mountain_name, `${row.mountain_name}: migration identity label mismatch.`);
  assert(migrationPoint?.[3] === row.verification_point, `${row.mountain_name}: migration checkpoint mismatch.`);

  const seedPoint = bacSeedRows[index];
  assert(Number(seedPoint?.[2]) === Number(row.order), `${row.mountain_name}: seed order mismatch.`);
  assert(seedPoint?.[3] === row.mountain_name, `${row.mountain_name}: seed identity label mismatch.`);
  assert(seedPoint?.[4] === row.verification_point, `${row.mountain_name}: seed checkpoint mismatch.`);
}

assert(
  verificationPointMigration.includes('alter column verification_radius_m drop not null'),
  'Pending verification-point radii must be nullable.',
);
assert(
  verificationPointMigration.includes("or (latitude is null and longitude is null and verification_radius_m is null)"),
  'Pending verification points must fail closed with null GPS fields.',
);
assert(
  verificationPointMigration.includes('latitude is not null') &&
    verificationPointMigration.includes('longitude is not null') &&
    verificationPointMigration.includes('verification_radius_m is not null') &&
    verificationPointMigration.includes("and nullif(trim(source_note), '') is not null"),
  'Verified verification points must require complete GPS fields and a source note.',
);
assert(
  verificationPointMigration.includes("null,\n  null,\n  null,\n  'pending'"),
  'BAC verification-point migration must insert null coordinates/radius as pending.',
);
assert(
  seedSql.includes('on conflict (mountain_id, name_ko) do nothing;') &&
    seedSql.includes('left join public.verification_points point'),
  'Generated seed must preserve existing verified points and reconnect BAC memberships.',
);

console.log(
  'Collection data audit passed: 121 mountain identities, Forestry 100, BAC 100, 100 pending BAC checkpoints linked, GPS fields null.',
);
