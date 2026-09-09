import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mountainsPath = join(root, 'src/data/mountains.json');
const auditPath = join(root, 'docs/data/WIKIMEDIA_MOUNTAIN_IMAGES.json');
const generatedPath = join(root, 'src/data/mountainImages.generated.ts');
const photoDirectory = join(root, 'assets/photos/mountains');
const shouldWrite = process.argv.includes('--write');

const USER_AGENT = '100PEAKS-image-sync/0.1 (https://github.com/yuemyname/take-100-hikes)';
const WIKIPEDIA_API = 'https://ko.wikipedia.org/w/api.php';
const EN_WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

const overrides = {
  // Keep exceptional same-name mountains explicit. Add only after checking the
  // article and the photographed location; an override never changes GPS data.
  baegamsan: '백암산 (전라도)',
};

// Direct Commons search can find reusable mountain and summit-marker photos
// that are not connected as a Wikipedia representative image. Every entry here
// was checked against its description/region and visually reviewed.
const reviewedImageOverrides = new Map([
  ['sinbulsan', '신불산 2.jpg'],
  ['baegamsan', 'Baekyangsan.JPG'],
  ['byeonsan', 'A Lake in Byeonsan National Park - panoramio.jpg'],
  ['deoksungsan', '충남 서산 덕산 덕숭산 Korea - panoramio.jpg'],
  ['doraksan', '도살성 정상.JPG'],
  ['joryeongsan', 'Saejae Bubong.jpg'],
]);

// Representative-image APIs occasionally select an attraction, animal, map,
// or a demonstrably different mountain. These were visually reviewed.
const rejectedImageFiles = new Map([
  ['yongmunsan', 'Korean shorthair at Yongmun.jpg'],
  ['chilgapsan', 'Map_of_Chilgap_mountain.JPG'],
  ['deoksungsan', 'Insoo_peak.jpg'],
  ['muhaksan', 'Naknamjeongmaek.jpg'],
]);

function cleanName(value) {
  return value.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
}

function normalize(value) {
  return cleanName(value).replace(/[\s·,_-]/g, '').toLowerCase();
}

function areaTokens(mountain) {
  const stop = new Set(['강원', '경상', '전라', '충청', '서울', '경기', '인천', '광주', '대구', '부산', '울산', '경남', '경북', '전남', '전북', '충남', '충북']);
  return `${mountain.area ?? ''} ${mountain.region ?? ''}`
    .split(/[\s·,()]+/)
    .map((token) => token.replace(/[도시군구면읍]$/u, ''))
    .filter((token) => token.length >= 2 && !stop.has(token));
}

function stripHtml(value = '') {
  return value
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
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

async function getJson(url) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (response.ok) return response.json();
    if (response.status !== 429 && response.status < 500) {
      throw new Error(`${response.status} ${response.statusText}: ${url}`);
    }
    const retryAfterSeconds = Number(response.headers.get('retry-after'));
    const delayMs = Number.isFinite(retryAfterSeconds)
      ? Math.max(1000, retryAfterSeconds * 1000)
      : 1500 * (2 ** attempt);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error(`Wikimedia request did not recover after retries: ${url}`);
}

function buildWikipediaUrl(params) {
  const url = new URL(WIKIPEDIA_API);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  url.searchParams.set('origin', '*');
  return url;
}

function candidateScore(mountain, page, duplicateNames) {
  const baseName = cleanName(mountain.name_ko);
  const wanted = normalize(baseName);
  const title = normalize(page.title);
  const description = `${page.terms?.description?.join(' ') ?? ''} ${page.extract ?? ''}`;
  let score = 0;

  if (page.title.trim() === mountain.name_ko.trim()) score += 320;
  else if (title === wanted) score += 210;
  else if (title.includes(wanted) || wanted.includes(title)) score += 70;
  else {
    const lastWord = normalize(baseName.split(/\s+/).at(-1) ?? baseName);
    if (lastWord.length >= 3 && title.includes(lastWord)) score += 35;
  }
  if (/동음이의/u.test(description)) score -= 500;
  if (/산|봉|능선|오름/u.test(description)) score += 15;

  const locationMatches = areaTokens(mountain).filter((token) => `${page.title} ${description}`.includes(token)).length;
  score += Math.min(locationMatches, 3) * 14;

  let distance = null;
  const coordinate = page.coordinates?.find((item) => item.primary) ?? page.coordinates?.[0];
  if (
    coordinate
    && Number.isFinite(mountain.latitude)
    && Number.isFinite(mountain.longitude)
  ) {
    distance = distanceKm(mountain.latitude, mountain.longitude, coordinate.lat, coordinate.lon);
    if (distance <= 8) score += 100;
    else if (distance <= 30) score += 65;
    else if (distance <= 70) score += 20;
    else score -= 180;
  }

  const jpeg = /\.jpe?g$/i.test(page.pageimage ?? '');
  if (jpeg) score += 20;
  else if (page.pageimage) score -= 80;

  const isDuplicateName = duplicateNames.has(wanted);
  const nameRelated = title === wanted || title.includes(wanted) || wanted.includes(title) || description.includes(baseName);
  const exactRawTitle = page.title.trim() === mountain.name_ko.trim();
  const qualifiedTitle = page.title.trim() !== cleanName(page.title);
  const needsLocationEvidence = isDuplicateName || qualifiedTitle || mountain.name_ko.includes('(');
  const identityVerified = !/동음이의/u.test(description) && nameRelated && (distance !== null
    ? distance <= 40
    : exactRawTitle || (title === wanted && (!needsLocationEvidence || locationMatches > 0)));

  return { score, distance, locationMatches, identityVerified, jpeg };
}

async function findWikipediaPage(mountain, duplicateNames) {
  const overrideTitle = overrides[mountain.slug];
  // Search the mountain name only, then use article text/coordinates for region
  // disambiguation. Adding every area token makes MediaWiki omit valid exact pages.
  const query = overrideTitle ?? `"${cleanName(mountain.name_ko)}"`;
  const url = buildWikipediaUrl({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: 0,
    gsrlimit: 10,
    prop: 'coordinates|pageimages|pageterms|pageprops|extracts',
    piprop: 'name|thumbnail|original',
    pithumbsize: 1200,
    wbptterms: 'description',
    exintro: 1,
    explaintext: 1,
    exchars: 800,
  });
  const payload = await getJson(url);
  const candidates = (payload.query?.pages ?? [])
    .map((page) => ({ ...page, match: candidateScore(mountain, page, duplicateNames) }))
    .sort((a, b) => b.match.score - a.match.score);
  const winner = candidates[0];
  const explicitlyReviewedPage = Boolean(overrideTitle && winner?.title === overrideTitle);
  if (!winner || (!explicitlyReviewedPage && (!winner.match.identityVerified || winner.match.score < 100))) {
    return {
      mountain,
      status: 'needs_review',
      candidates: candidates.slice(0, 3).map((page) => ({
        title: page.title,
        image: page.pageimage,
        score: page.match.score,
        distanceKm: page.match.distance === null ? null : Number(page.match.distance.toFixed(1)),
      })),
    };
  }
  return {
    mountain,
    status: 'matched',
    pageTitle: winner.title,
    pageImage: winner.match.jpeg ? winner.pageimage : null,
    wikidataId: winner.pageprops?.wikibase_item ?? null,
    articleUrl: `https://ko.wikipedia.org/wiki/${encodeURIComponent(winner.title.replace(/ /g, '_'))}`,
    score: winner.match.score,
    distanceKm: winner.match.distance === null ? null : Number(winner.match.distance.toFixed(1)),
  };
}

function buildWikidataUrl(ids) {
  const url = new URL(WIKIDATA_API);
  url.searchParams.set('action', 'wbgetentities');
  url.searchParams.set('ids', ids.join('|'));
  url.searchParams.set('props', 'claims|sitelinks');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');
  return url;
}

function buildEnglishWikipediaUrl(titles) {
  const url = new URL(EN_WIKIPEDIA_API);
  url.searchParams.set('action', 'query');
  url.searchParams.set('titles', titles.join('|'));
  url.searchParams.set('prop', 'pageimages');
  url.searchParams.set('piprop', 'name');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  url.searchParams.set('origin', '*');
  return url;
}

function buildCommonsCategoryUrl(categoryTitle) {
  const url = new URL(COMMONS_API);
  url.searchParams.set('action', 'query');
  url.searchParams.set('generator', 'categorymembers');
  url.searchParams.set('gcmtitle', categoryTitle.startsWith('Category:') ? categoryTitle : `Category:${categoryTitle}`);
  url.searchParams.set('gcmnamespace', '6');
  url.searchParams.set('gcmtype', 'file');
  url.searchParams.set('gcmlimit', '40');
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'size|mime');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  url.searchParams.set('origin', '*');
  return url;
}

async function findCommonsCategoryImage(categoryTitle) {
  const payload = await getJson(buildCommonsCategoryUrl(categoryTitle));
  const rejectedWords = /map|locator|location|route|trail|station|temple|shrine|church|museum|sign|marker|diagram|flora|fauna|bird|plant|insect/i;
  const candidates = (payload.query?.pages ?? [])
    .map((page) => ({ page, info: page.imageinfo?.[0] }))
    .filter(({ page, info }) => info?.mime === 'image/jpeg' && info.width >= 640 && !rejectedWords.test(page.title))
    .sort((a, b) => {
      const aLandscape = a.info.width / a.info.height >= 1.1 ? 1 : 0;
      const bLandscape = b.info.width / b.info.height >= 1.1 ? 1 : 0;
      return bLandscape - aLandscape || b.info.width - a.info.width;
    });
  return candidates[0]?.page.title.replace(/^File:/, '') ?? null;
}

async function addLinkedImages(matches) {
  const withoutImage = matches.filter((match) => !match.pageImage && match.wikidataId);
  const entities = new Map();
  for (let start = 0; start < withoutImage.length; start += 40) {
    const ids = [...new Set(withoutImage.slice(start, start + 40).map((match) => match.wikidataId))];
    const payload = await getJson(buildWikidataUrl(ids));
    for (const [id, entity] of Object.entries(payload.entities ?? {})) entities.set(id, entity);
  }

  const englishArticles = [];
  for (const match of withoutImage) {
    const entity = entities.get(match.wikidataId);
    const wikidataImage = entity?.claims?.P18?.find((claim) => claim.mainsnak?.datavalue?.value)?.mainsnak.datavalue.value;
    if (typeof wikidataImage === 'string' && /\.jpe?g$/i.test(wikidataImage)) {
      match.pageImage = wikidataImage;
      match.imageOrigin = 'wikidata';
      continue;
    }
    const englishTitle = entity?.sitelinks?.enwiki?.title;
    if (englishTitle) englishArticles.push({ match, title: englishTitle });
  }

  for (let start = 0; start < englishArticles.length; start += 40) {
    const batch = englishArticles.slice(start, start + 40);
    const payload = await getJson(buildEnglishWikipediaUrl(batch.map((item) => item.title)));
    const pages = new Map((payload.query?.pages ?? []).map((page) => [page.title, page]));
    for (const item of batch) {
      const pageImage = pages.get(item.title)?.pageimage;
      if (pageImage && /\.jpe?g$/i.test(pageImage)) {
        item.match.pageImage = pageImage;
        item.match.imageOrigin = 'english_wikipedia';
      }
    }
  }

  const categories = matches.flatMap((match) => {
    if (match.pageImage || !match.wikidataId) return [];
    const entity = entities.get(match.wikidataId);
    const commonsTitle = entity?.sitelinks?.commonswiki?.title;
    const p373 = entity?.claims?.P373?.find((claim) => claim.mainsnak?.datavalue?.value)?.mainsnak.datavalue.value;
    const categoryTitle = commonsTitle?.startsWith('Category:') ? commonsTitle : p373;
    return categoryTitle ? [{ match, categoryTitle }] : [];
  });
  const categoryImages = await mapWithConcurrency(categories, 4, async (item) => ({
    ...item,
    pageImage: await findCommonsCategoryImage(item.categoryTitle),
  }));
  for (const item of categoryImages) {
    if (item.pageImage) {
      item.match.pageImage = item.pageImage;
      item.match.imageOrigin = 'commons_category';
    }
  }
}

async function mapWithConcurrency(items, concurrency, task) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      try {
        results[index] = await task(items[index], index);
      } catch (error) {
        results[index] = { mountain: items[index], status: 'error', error: String(error) };
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

function buildCommonsUrl(fileNames) {
  const url = new URL(COMMONS_API);
  url.searchParams.set('action', 'query');
  url.searchParams.set('titles', fileNames.map((name) => `File:${name}`).join('|'));
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'url|mime|extmetadata');
  url.searchParams.set('iiurlwidth', '1200');
  url.searchParams.set('iiextmetadatafilter', 'Artist|Credit|LicenseShortName|LicenseUrl|UsageTerms|AttributionRequired|Copyrighted|ImageDescription');
  url.searchParams.set('redirects', '1');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  url.searchParams.set('origin', '*');
  return url;
}

async function fetchCommonsMetadata(matches) {
  const metadata = new Map();
  for (let start = 0; start < matches.length; start += 25) {
    const batch = matches.slice(start, start + 25);
    const payload = await getJson(buildCommonsUrl(batch.map((match) => match.pageImage)));
    for (const page of payload.query?.pages ?? []) {
      const info = page.imageinfo?.[0];
      if (!info) continue;
      metadata.set(normalize(page.title.replace(/^File:/, '')), { page, info });
    }
  }
  return metadata;
}

function metadataValue(info, key) {
  return stripHtml(info.extmetadata?.[key]?.value ?? '');
}

function licenseIsAllowed(license) {
  return license === 'Public domain' || license === 'CC0' || /^CC BY(?:-SA)?(?:\s|$)/.test(license);
}

function resolvedLicenseUrl(license, suppliedUrl) {
  if (suppliedUrl) return suppliedUrl;
  if (license === 'Public domain') return 'https://creativecommons.org/publicdomain/mark/1.0/';
  if (license === 'CC0') return 'https://creativecommons.org/publicdomain/zero/1.0/';
  return '';
}

function sanitizeCredit(info) {
  const artist = metadataValue(info, 'Artist') || metadataValue(info, 'Credit') || 'Wikimedia Commons contributor';
  return artist.slice(0, 160);
}

async function downloadImage(url, outputPath) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  const type = response.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) throw new Error(`Expected an image, received ${type || 'unknown content type'}`);
  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
}

function createGeneratedModule(records) {
  const entries = records.map((record) => `  ${JSON.stringify(record.slug)}: {
    source: require(${JSON.stringify(`../../assets/photos/mountains/${record.slug}.jpg`)}),
    author: ${JSON.stringify(record.author)},
    license: ${JSON.stringify(record.license)},
    licenseUrl: ${JSON.stringify(record.licenseUrl)},
    sourceUrl: ${JSON.stringify(record.sourceUrl)},
    articleUrl: ${JSON.stringify(record.articleUrl)},
  },`).join('\n');

  return `// Generated by scripts/sync-wikimedia-mountain-images.mjs. Do not edit by hand.
export const MOUNTAIN_IMAGES = {
${entries}
} as const;

export type MountainImageSlug = keyof typeof MOUNTAIN_IMAGES;
export type MountainImageCredit = (typeof MOUNTAIN_IMAGES)[MountainImageSlug];
`;
}

const mountains = JSON.parse(await readFile(mountainsPath, 'utf8'));
const nameCounts = new Map();
for (const mountain of mountains) {
  const key = normalize(mountain.name_ko);
  nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
}
const duplicateNames = new Set([...nameCounts].filter(([, count]) => count > 1).map(([name]) => name));

console.log(`Searching Korean Wikipedia for ${mountains.length} mountain identities…`);
const searches = await mapWithConcurrency(mountains, 5, (mountain) => findWikipediaPage(mountain, duplicateNames));
const matched = searches.filter((result) => result.status === 'matched');
console.log(`Identity-matched Wikipedia pages: ${matched.length}/${mountains.length}`);
await addLinkedImages(matched);
for (const match of matched) {
  const reviewedImage = reviewedImageOverrides.get(match.mountain.slug);
  if (reviewedImage) {
    match.pageImage = reviewedImage;
    match.imageOrigin = 'reviewed_commons_search';
  }
}

const matchesWithImages = matched.filter((match) => match.pageImage);
console.log(`Identity-matched pages with a linked JPEG: ${matchesWithImages.length}/${mountains.length}`);
const commonsMetadata = await fetchCommonsMetadata(matchesWithImages);
const records = [];
const acceptedFiles = new Set();
for (const match of matchesWithImages) {
  if (rejectedImageFiles.get(match.mountain.slug) === match.pageImage) {
    match.status = 'visual_rejected';
    match.rejectedFile = match.pageImage;
    continue;
  }
  const normalizedFile = normalize(match.pageImage);
  if (acceptedFiles.has(normalizedFile)) {
    match.status = 'duplicate_image_rejected';
    match.rejectedFile = match.pageImage;
    continue;
  }
  const commons = commonsMetadata.get(normalize(match.pageImage));
  if (!commons) {
    match.status = 'missing_commons_metadata';
    continue;
  }
  const { info } = commons;
  const license = metadataValue(info, 'LicenseShortName');
  const licenseUrl = resolvedLicenseUrl(license, metadataValue(info, 'LicenseUrl'));
  const imageUrl = (info.thumburl ?? info.url)?.split('?')[0];
  if (!licenseIsAllowed(license) || !licenseUrl || !imageUrl || info.mime !== 'image/jpeg') {
    match.status = 'license_rejected';
    match.license = license || null;
    match.mime = info.mime ?? null;
    continue;
  }
  records.push({
    slug: match.mountain.slug,
    mountainName: match.mountain.name_ko,
    region: match.mountain.area ?? match.mountain.region,
    wikipediaTitle: match.pageTitle,
    imageFile: match.pageImage,
    imageUrl,
    sourceUrl: info.descriptionurl,
    articleUrl: match.articleUrl,
    author: sanitizeCredit(info),
    license,
    licenseUrl,
    matchDistanceKm: match.distanceKm,
    matchScore: match.score,
    imageOrigin: match.imageOrigin ?? 'wikipedia_page',
  });
  acceptedFiles.add(normalizedFile);
}

const acceptedSlugs = new Set(records.map((record) => record.slug));
const unresolved = searches.filter((result) => !acceptedSlugs.has(result.mountain.slug));
console.log(`Reusable JPEG photos accepted: ${records.length}/${mountains.length}`);
console.log(`Needs review or another source: ${unresolved.length}`);
console.log(unresolved.map((result) => `${result.mountain.slug}\t${result.mountain.name_ko}\t${result.status}`).join('\n'));

if (shouldWrite) {
  await mkdir(photoDirectory, { recursive: true });
  const expectedFiles = new Set(records.map((record) => `${record.slug}.jpg`));
  for (const file of await readdir(photoDirectory)) {
    if (/\.jpe?g$/i.test(file) && !expectedFiles.has(file)) await unlink(join(photoDirectory, file));
  }
  let downloaded = 0;
  await mapWithConcurrency(records, 4, async (record) => {
    await downloadImage(record.imageUrl, join(photoDirectory, `${record.slug}.jpg`));
    downloaded += 1;
    if (downloaded % 10 === 0 || downloaded === records.length) console.log(`Downloaded ${downloaded}/${records.length}`);
    return record;
  });
  await writeFile(auditPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    sourcePolicy: 'Wikimedia Commons files with Public domain, CC0, CC BY, or CC BY-SA licenses only; direct-search overrides are visually reviewed.',
    records,
    unresolved: unresolved.map((result) => ({
      slug: result.mountain.slug,
      mountainName: result.mountain.name_ko,
      region: result.mountain.area ?? result.mountain.region,
      status: result.status,
      candidates: result.candidates ?? [],
      error: result.error ?? null,
      rejectedLicense: result.license ?? null,
      rejectedMime: result.mime ?? null,
      rejectedFile: result.rejectedFile ?? null,
    })),
  }, null, 2)}\n`);
  await writeFile(generatedPath, createGeneratedModule(records));
  console.log(`Wrote ${auditPath}`);
  console.log(`Wrote ${generatedPath}`);
}
