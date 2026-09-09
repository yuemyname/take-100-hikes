import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = '/private/tmp/100peaks-commons-candidates.json';
const previewDirectory = '/private/tmp/100peaks-commons-candidates';
const api = 'https://commons.wikimedia.org/w/api.php';
const userAgent = '100PEAKS-image-research/0.1 (https://github.com/yuemyname/take-100-hikes)';

const mountains = JSON.parse(await readFile(join(root, 'src/data/mountains.json'), 'utf8'));
const wikimedia = JSON.parse(await readFile(join(root, 'docs/data/WIKIMEDIA_MOUNTAIN_IMAGES.json'), 'utf8'));
const tourApi = JSON.parse(await readFile(join(root, 'docs/data/TOURAPI_MOUNTAIN_IMAGES.json'), 'utf8'));
const forestService = JSON.parse(
  await readFile(join(root, 'docs/data/FOREST_SERVICE_MOUNTAIN_IMAGES.json'), 'utf8'),
);
const openLicense = JSON.parse(
  await readFile(join(root, 'docs/data/OPEN_LICENSE_MOUNTAIN_IMAGES.json'), 'utf8'),
);
const resolved = new Set(
  [...wikimedia.records, ...tourApi.records, ...forestService.records, ...openLicense.records]
    .map((record) => record.slug),
);
const unresolved = mountains.filter((mountain) => !resolved.has(mountain.slug));

const cleanName = (value) => value.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
const stripHtml = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const metadataValue = (info, key) => stripHtml(info.extmetadata?.[key]?.value ?? '');
const licenseIsAllowed = (license) => license === 'Public domain'
  || license === 'CC0'
  || /^CC BY(?:-SA)?(?:\s|$)/.test(license);

async function getJson(url) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': userAgent } });
    if (response.ok) return response.json();
    if (response.status !== 429 && response.status < 500) throw new Error(`${response.status} ${response.statusText}`);
    await new Promise((resolve) => setTimeout(resolve, 1200 * (2 ** attempt)));
  }
  throw new Error('Wikimedia request did not recover after retries.');
}

async function searchFiles(query) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `"${query}"`,
    gsrnamespace: '6',
    gsrlimit: '20',
    prop: 'imageinfo',
    iiprop: 'url|mime|size|extmetadata',
    iiurlwidth: '1000',
    iiextmetadatafilter: 'Artist|Credit|LicenseShortName|LicenseUrl|UsageTerms|AttributionRequired|ImageDescription|Categories',
    format: 'json',
    formatversion: '2',
    origin: '*',
  });
  const payload = await getJson(`${api}?${params}`);
  return payload.query?.pages ?? [];
}

const results = [];
for (const [index, mountain] of unresolved.entries()) {
  const queries = [...new Set([cleanName(mountain.name_ko), mountain.name_en].filter(Boolean))];
  const pages = (await Promise.all(queries.map(searchFiles))).flat();
  const seen = new Set();
  const candidates = [];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    const license = metadataValue(info ?? {}, 'LicenseShortName');
    const key = page.title.toLowerCase();
    if (seen.has(key) || info?.mime !== 'image/jpeg' || info.width < 640 || !licenseIsAllowed(license)) continue;
    seen.add(key);
    candidates.push({
      file: page.title.replace(/^File:/, ''),
      width: info.width,
      height: info.height,
      author: metadataValue(info, 'Artist') || metadataValue(info, 'Credit') || 'Wikimedia Commons contributor',
      license,
      licenseUrl: metadataValue(info, 'LicenseUrl'),
      description: metadataValue(info, 'ImageDescription'),
      categories: metadataValue(info, 'Categories'),
      imageUrl: (info.thumburl ?? info.url)?.split('?')[0],
      sourceUrl: info.descriptionurl,
    });
  }
  results.push({
    slug: mountain.slug,
    mountainName: mountain.name_ko,
    region: mountain.area ?? mountain.region,
    candidates,
  });
  if ((index + 1) % 10 === 0 || index + 1 === unresolved.length) {
    console.log(`Searched ${index + 1}/${unresolved.length}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 150));
}

await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`);
console.log(`Found candidates for ${results.filter((result) => result.candidates.length > 0).length}/${results.length} mountains.`);
console.log(`Wrote ${outputPath}`);

const downloadArgument = process.argv.find((argument) => argument.startsWith('--download='));
if (downloadArgument) {
  const requestedSlugs = new Set(downloadArgument.slice('--download='.length).split(',').filter(Boolean));
  await mkdir(previewDirectory, { recursive: true });
  let downloaded = 0;
  for (const result of results.filter((item) => requestedSlugs.has(item.slug))) {
    for (const [index, candidate] of result.candidates.slice(0, 8).entries()) {
      if (!candidate.imageUrl) continue;
      const response = await fetch(candidate.imageUrl, { headers: { 'User-Agent': userAgent } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${candidate.imageUrl}`);
      await writeFile(join(previewDirectory, `${result.slug}-${index + 1}.jpg`), Buffer.from(await response.arrayBuffer()));
      downloaded += 1;
    }
  }
  console.log(`Downloaded ${downloaded} candidate previews to ${previewDirectory}.`);
}
