import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mountainsPath = join(root, 'src/data/mountains.json');
const auditPath = join(root, 'docs/data/TOURAPI_MOUNTAIN_IMAGES.json');
const generatedPath = join(root, 'src/data/tourApiMountainImages.generated.ts');
const photoDirectory = join(root, 'assets/photos/tourapi-mountains');
const previewDirectory = '/private/tmp/100peaks-tourapi-preview';
const shouldWrite = process.argv.includes('--write');

const API_BASE = 'https://apis.data.go.kr/B551011/KorService2';
const LICENSES = {
  Type1: {
    label: '공공누리 제1유형',
    url: 'https://www.kogl.or.kr/info/licenseType1.do',
  },
  Type3: {
    label: '공공누리 제3유형',
    url: 'https://www.kogl.or.kr/info/licenseType3.do',
  },
};
const PROVIDER_URL = 'https://api.visitkorea.or.kr/';

// Content ids are accepted only after title, address, and (when available) the
// repository mountain coordinate were compared. These ids never become GPS
// verification points; they identify a tourism record and its photograph only.
const reviewedContentIds = new Map([
  ['gariwangsan', '127508'],
  ['bangtaesan', '126677'],
  ['daeamsan', '128702'],
  ['hwangjangsan', '128625'],
  ['myeongseongsan', '3011204'],
  ['bangjangsan', '127168'],
  ['chuwolsan', '126254'],
  ['naeyeonsan', '126042'],
  ['duryunsan', '126241'],
  ['paryeongsan', '2760781'],
  ['gangcheonsan', '126249'],
  ['mireuksan', '126659'],
  ['jirisan-tongyeong', '126852'],
  ['hambaeksan', '125594'],
  ['gwangdeoksan-cheonan', '127200'],
  ['chungnyeongsan-jangseong', '127394'],
  ['gitdaebong-hongdo', '128703'],
  ['oseosan', '129644'],
  ['odaesan-noinbong', '125619'],
  ['jirisan-baraebong', '126675'],
  ['jirisan-banyabong', '716410'],
]);

// These exact mountain records are redistributed byte-for-byte under KOGL
// Type 3 (attribution required, modification prohibited).
const reviewedType3ContentIds = new Set(['125619', '126675', '716410']);
const reviewedSearchTerms = new Map([
  ['odaesan-noinbong', '노인봉'],
  ['jirisan-baraebong', '바래봉'],
  ['jirisan-banyabong', '반야봉'],
]);

function cleanName(value) {
  return value.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
}

function normalizedHttps(url) {
  return url.replace(/^http:\/\//, 'https://');
}

function distanceKm(aLat, aLon, bLat, bLon) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(bLat - aLat);
  const dLon = toRadians(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(aLat)) * Math.cos(toRadians(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

async function readLocalEnv(name) {
  for (const file of ['.env.local', '.env']) {
    try {
      const text = await readFile(join(root, file), 'utf8');
      const line = text.split(/\r?\n/).find((item) => item.startsWith(`${name}=`));
      if (line) return line.slice(line.indexOf('=') + 1).trim();
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  return '';
}

async function fetchWithRetry(url, options) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, options);
    if (response.ok) return response;
    if (response.status !== 429 && response.status < 500) {
      throw new Error(`TourAPI returned ${response.status} ${response.statusText}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * (2 ** attempt)));
  }
  throw new Error('TourAPI request did not recover after retries.');
}

async function searchMountain(serviceKey, mountain, reviewedSearchTerm) {
  const params = new URLSearchParams({
    MobileOS: 'ETC',
    MobileApp: '100PEAKS',
    _type: 'json',
    keyword: reviewedSearchTerm ?? cleanName(mountain.name_ko),
    numOfRows: '30',
    pageNo: '1',
    arrange: 'A',
  });
  const response = await fetchWithRetry(`${API_BASE}/searchKeyword2?serviceKey=${serviceKey}&${params}`);
  const payload = await response.json();
  const header = payload?.response?.header;
  if (header?.resultCode && header.resultCode !== '0000') {
    throw new Error(`TourAPI ${header.resultCode}: ${header.resultMsg ?? 'unknown error'}`);
  }
  return payload?.response?.body?.items?.item ?? [];
}

async function downloadImage(url, outputPath) {
  const response = await fetchWithRetry(normalizedHttps(url));
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) throw new Error(`Expected image, received ${contentType || 'unknown type'}`);
  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
}

async function mapWithConcurrency(items, concurrency, task) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await task(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

function createGeneratedModule(records) {
  const entries = records.map((record) => `  ${JSON.stringify(record.slug)}: {
    source: require(${JSON.stringify(`../../assets/photos/tourapi-mountains/${record.slug}.jpg`)}),
    author: ${JSON.stringify(`한국관광공사 「${record.title}」`)},
    license: ${JSON.stringify(record.license)},
    licenseUrl: ${JSON.stringify(record.licenseUrl)},
    sourceUrl: ${JSON.stringify(record.imageUrl)},
    articleUrl: ${JSON.stringify(PROVIDER_URL)},
  },`).join('\n');
  return `// Generated by scripts/sync-tourapi-mountain-images.mjs. Do not edit by hand.
export const TOURAPI_MOUNTAIN_IMAGES = {
${entries}
} as const;
`;
}

const serviceKey = await readLocalEnv('TOUR_API_SERVICE_KEY');
if (!serviceKey) throw new Error('TOUR_API_SERVICE_KEY is missing from .env.local or .env.');

const mountains = JSON.parse(await readFile(mountainsPath, 'utf8'));
const mountainBySlug = new Map(mountains.map((mountain) => [mountain.slug, mountain]));
const records = [];
for (const [slug, contentId] of reviewedContentIds) {
  const mountain = mountainBySlug.get(slug);
  if (!mountain) throw new Error(`Unknown mountain slug: ${slug}`);
  const searchTerm = reviewedSearchTerms.get(slug) ?? cleanName(mountain.name_ko);
  const items = await searchMountain(serviceKey, mountain, searchTerm);
  const item = items.find((candidate) => candidate.contentid === contentId);
  if (!item) throw new Error(`Reviewed TourAPI content ${contentId} was not returned for ${mountain.name_ko}.`);
  const expectedLicenseCode = reviewedType3ContentIds.has(contentId) ? 'Type3' : 'Type1';
  if (item.cpyrhtDivCd !== expectedLicenseCode) {
    throw new Error(`${mountain.name_ko} license changed from ${expectedLicenseCode} to ${item.cpyrhtDivCd || 'unknown'}.`);
  }
  if (!item.firstimage) throw new Error(`${mountain.name_ko} no longer has a primary image.`);
  const hasMapPoint = Number.isFinite(Number(item.mapy)) && Number.isFinite(Number(item.mapx));
  const hasMountainPoint = Number.isFinite(mountain.latitude) && Number.isFinite(mountain.longitude);
  const matchDistanceKm = hasMapPoint && hasMountainPoint
    ? Number(distanceKm(mountain.latitude, mountain.longitude, Number(item.mapy), Number(item.mapx)).toFixed(1))
    : null;
  if (matchDistanceKm !== null && matchDistanceKm > 12) {
    throw new Error(`${mountain.name_ko} tourism record moved ${matchDistanceKm}km from the verified mountain point.`);
  }
  const license = LICENSES[expectedLicenseCode];
  records.push({
    slug,
    mountainName: mountain.name_ko,
    region: mountain.area ?? mountain.region,
    contentId,
    searchTerm,
    title: item.title,
    address: item.addr1,
    imageUrl: normalizedHttps(item.firstimage),
    thumbnailUrl: item.firstimage2 ? normalizedHttps(item.firstimage2) : null,
    copyrightDivisionCode: item.cpyrhtDivCd,
    license: license.label,
    licenseUrl: license.url,
    provider: '한국관광공사 TourAPI',
    providerUrl: PROVIDER_URL,
    matchDistanceKm,
    gpsCoordinateChanged: false,
  });
  await new Promise((resolve) => setTimeout(resolve, 120));
}

const outputDirectory = shouldWrite ? photoDirectory : previewDirectory;
await mkdir(outputDirectory, { recursive: true });
const expectedFiles = new Set(records.map((record) => `${record.slug}.jpg`));
for (const file of await readdir(outputDirectory)) {
  if (/\.jpe?g$/i.test(file) && !expectedFiles.has(file)) await unlink(join(outputDirectory, file));
}
await mapWithConcurrency(records, 4, (record) => downloadImage(record.imageUrl, join(outputDirectory, `${record.slug}.jpg`)));

if (shouldWrite) {
  await writeFile(auditPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    sourcePolicy: 'Korea Tourism Organization TourAPI images marked cpyrhtDivCd=Type1 or Type3, after title/region and visual review. Type3 source files are stored byte-for-byte without modification.',
    gpsPolicy: 'Tourism coordinates are used only for identity comparison and never copied into mountain GPS verification fields.',
    records,
  }, null, 2)}\n`);
  await writeFile(generatedPath, createGeneratedModule(records));
  console.log(`Wrote ${records.length} reviewed TourAPI mountain photos.`);
} else {
  await writeFile(join(previewDirectory, 'manifest.json'), `${JSON.stringify(records, null, 2)}\n`);
  console.log(`Downloaded ${records.length} preview photos to ${previewDirectory}.`);
}
