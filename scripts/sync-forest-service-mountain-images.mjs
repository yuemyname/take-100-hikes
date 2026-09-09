import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mountainsPath = join(root, 'src/data/mountains.json');
const auditPath = join(root, 'docs/data/FOREST_SERVICE_MOUNTAIN_IMAGES.json');
const generatedPath = join(root, 'src/data/forestServiceMountainImages.generated.ts');
const photoDirectory = join(root, 'assets/photos/forest-service-mountains');
const previewDirectory = '/private/tmp/100peaks-forest-service-preview';
const shouldWrite = process.argv.includes('--write');

const FOREST_ROOT = 'https://www.forest.go.kr';
const LIST_URL = `${FOREST_ROOT}/kfsweb/kfi/kfs/foreston/main/contents/FmmntSrch/selectFmmntSrchList.do?mn=AR02_02_05_01&orgId=fon&mntUnit=100&mntIndex=1&searchCnd=10&searchMnt=`;
const DETAIL_PATH = '/kfsweb/kfi/kfs/foreston/main/contents/ClbngManage/selectMntnInfoDetail.do';
const DATASET_URL = 'https://www.data.go.kr/data/3071170/openapi.do';

// Each id is the Forest Service's own 100-famous-mountains detail id. Region
// guards are deliberately redundant so duplicate mountain names cannot be
// silently matched to the wrong mountain.
const reviewedDetailIds = new Map([
  ['gyebangsan', { id: '20000043', regionGuard: '홍천' }],
  ['baekdeoksan', { id: '20000263', regionGuard: '평창' }],
  ['myeongjisan', { id: '20000218', regionGuard: '가평' }],
  ['baegunsan-gwangyang', { id: '20000281', regionGuard: '광양' }],
  ['unmunsan', { id: '20000492', regionGuard: '청도' }],
  ['hwangseoksan', { id: '20000686', regionGuard: '함양' }],
  ['yongmunsan', { id: '20000476', regionGuard: '양평' }],
  ['unjangsan', { id: '20000495', regionGuard: '진안' }],
  ['hwangaksan', { id: '20000687', regionGuard: '김천' }],
  ['jaeyaksan', { id: '20000545', regionGuard: '밀양' }],
  ['juheulsan', { id: '20000575', regionGuard: '문경' }],
  ['deokhangsan', { id: '20000149', regionGuard: '삼척' }],
  ['garisan', { id: '20000004', regionGuard: '홍천' }],
  ['taehwasan', { id: '20000803', regionGuard: '영월' }],
  ['geumsusan', { id: '20000091', regionGuard: '제천' }],
  ['eungbongsan', { id: '20000522', regionGuard: '울진' }],
  ['huiyangsan', { id: '20000699', regionGuard: '문경' }],
  ['unaksan', { id: '20000493', regionGuard: '가평' }],
  ['daeyasan', { id: '20000138', regionGuard: '괴산' }],
  ['baegunsan-pocheon', { id: '20000279', regionGuard: '포천' }],
  ['seodaesan', { id: '20000370', regionGuard: '금산' }],
  ['gongjaksan', { id: '20000058', regionGuard: '홍천', fileNumber: 2 }],
  ['jogyesan', { id: '20000559', regionGuard: '순천' }],
  ['baegunsan-jeongseon', { id: '20001076', regionGuard: '정선' }],
  ['yonghwasan', { id: '20000484', regionGuard: '화천' }],
  ['gubyeongsan', { id: '20000073', regionGuard: '보은' }],
  ['cheonmasan', { id: '20000597', regionGuard: '남양주' }],
  ['muhaksan', { id: '20000227', regionGuard: '창원' }],
  ['cheongwansan', { id: '20000591', regionGuard: '장흥' }],
  ['cheontaesan', { id: '20000606', regionGuard: '영동', fileNumber: 2 }],
  ['chilgapsan', { id: '20000629', regionGuard: '청양' }],
  ['yeonhwasan', { id: '20000451', regionGuard: '고성' }],
  ['palbongsan', { id: '20000652', regionGuard: '홍천' }],
]);

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function cleanMountainName(value) {
  return value.replace(/\s*\([^)]*\)\s*/g, '').replace(/\s+/g, '').trim();
}

async function fetchWithRetry(url) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, {
      headers: { 'User-Agent': '100PEAKS-mountain-photo-sync/0.1' },
    });
    if (response.ok) return response;
    if (response.status !== 429 && response.status < 500) {
      throw new Error(`Forest Service returned ${response.status} ${response.statusText}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * (2 ** attempt)));
  }
  throw new Error('Forest Service request did not recover after retries.');
}

function parseList(html) {
  const records = [];
  const pattern = /<a href="([^"]*mntnId=(\d+)[^"]*)"[^>]*>[\s\S]*?<div class="list_item">[\s\S]*?<img[^>]+src="([^"]+)"[^>]+alt="([^"]+)"[^>]*>[\s\S]*?<div class="list_info">[\s\S]*?<strong>([^<]+)<\/strong>[\s\S]*?<span>소재지 : <\/span>\s*<span>([^<]*)<\/span>[\s\S]*?<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const [, encodedDetailPath, detailId, encodedImagePath, imageAlt, name, area] = match;
    const imageUrl = new URL(decodeHtml(encodedImagePath), FOREST_ROOT);
    imageUrl.pathname = imageUrl.pathname.replace('/FileDown.do', '/getImage.do');
    imageUrl.searchParams.delete('thumbYn');
    records.push({
      detailId,
      name: decodeHtml(name).trim(),
      area: decodeHtml(area).trim(),
      imageAlt: decodeHtml(imageAlt).trim(),
      imageUrl: imageUrl.toString(),
      detailUrl: new URL(decodeHtml(encodedDetailPath), FOREST_ROOT).toString(),
    });
  }
  return records;
}

function extensionForContentType(contentType) {
  if (contentType.startsWith('image/jpeg') || contentType.startsWith('image/jpg')) return 'jpg';
  if (contentType.startsWith('image/png')) return 'png';
  if (contentType.startsWith('image/gif')) return 'gif';
  throw new Error(`Unsupported Forest Service image type: ${contentType || 'unknown'}`);
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
    source: require(${JSON.stringify(`../../assets/photos/forest-service-mountains/${record.slug}.${record.fileExtension}`)}),
    author: ${JSON.stringify(`산림청 「${record.mountainName}」`)},
    license: "공공데이터 이용허락범위 제한 없음",
    licenseUrl: ${JSON.stringify(DATASET_URL)},
    sourceUrl: ${JSON.stringify(record.imageUrl)},
    articleUrl: ${JSON.stringify(record.detailUrl)},
  },`).join('\n');
  return `// Generated by scripts/sync-forest-service-mountain-images.mjs. Do not edit by hand.
export const FOREST_SERVICE_MOUNTAIN_IMAGES = {
${entries}
} as const;
`;
}

const mountains = JSON.parse(await readFile(mountainsPath, 'utf8'));
const mountainBySlug = new Map(mountains.map((mountain) => [mountain.slug, mountain]));
const listResponse = await fetchWithRetry(LIST_URL);
const forestRecords = parseList(await listResponse.text());
if (forestRecords.length !== 100) {
  throw new Error(`Expected 100 Forest Service mountain records, received ${forestRecords.length}.`);
}
const forestById = new Map(forestRecords.map((record) => [record.detailId, record]));

const candidates = [];
for (const [slug, reviewed] of reviewedDetailIds) {
  const mountain = mountainBySlug.get(slug);
  if (!mountain) throw new Error(`Unknown mountain slug: ${slug}`);
  const forestRecord = forestById.get(reviewed.id);
  if (!forestRecord) throw new Error(`Forest Service detail ${reviewed.id} was not returned for ${mountain.name_ko}.`);
  if (cleanMountainName(forestRecord.name) !== cleanMountainName(mountain.name_ko)) {
    throw new Error(`${mountain.name_ko} name no longer matches Forest Service record ${forestRecord.name}.`);
  }
  if (!forestRecord.area.includes(reviewed.regionGuard)) {
    throw new Error(`${mountain.name_ko} area no longer contains ${reviewed.regionGuard}: ${forestRecord.area}`);
  }
  const imageUrl = new URL(forestRecord.imageUrl);
  imageUrl.searchParams.set('fileSn', String(reviewed.fileNumber ?? 1));
  forestRecord.imageUrl = imageUrl.toString();
  candidates.push({ slug, mountain, forestRecord });
}

const outputDirectory = shouldWrite ? photoDirectory : previewDirectory;
await mkdir(outputDirectory, { recursive: true });
const downloaded = await mapWithConcurrency(candidates, 4, async ({ slug, mountain, forestRecord }) => {
  const response = await fetchWithRetry(forestRecord.imageUrl);
  const contentType = response.headers.get('content-type') ?? '';
  const fileExtension = extensionForContentType(contentType);
  const outputPath = join(outputDirectory, `${slug}.${fileExtension}`);
  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
  return {
    slug,
    mountainName: mountain.name_ko,
    repositoryArea: mountain.area ?? mountain.region,
    forestServiceName: forestRecord.name,
    forestServiceArea: forestRecord.area,
    detailId: forestRecord.detailId,
    imageAlt: forestRecord.imageAlt,
    imageUrl: forestRecord.imageUrl,
    detailUrl: forestRecord.detailUrl,
    fileExtension,
    provider: '산림청 100대 명산',
    datasetUrl: DATASET_URL,
    license: '공공데이터 이용허락범위 제한 없음',
    gpsCoordinateChanged: false,
  };
});

const expectedFiles = new Set(downloaded.map((record) => `${record.slug}.${record.fileExtension}`));
for (const file of await readdir(outputDirectory)) {
  if (/\.(jpe?g|png|gif)$/i.test(file) && !expectedFiles.has(file)) await unlink(join(outputDirectory, file));
}

if (shouldWrite) {
  await writeFile(auditPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    sourcePolicy: 'Forest Service 100-famous-mountains detail images matched by official detail id, mountain name, and region. The linked public dataset states no usage-license restriction.',
    gpsPolicy: 'Forest Service mountain records and photos are never copied into GPS verification fields.',
    records: downloaded,
  }, null, 2)}\n`);
  await writeFile(generatedPath, createGeneratedModule(downloaded));
  console.log(`Wrote ${downloaded.length} Forest Service mountain photos.`);
} else {
  await writeFile(join(previewDirectory, 'manifest.json'), `${JSON.stringify(downloaded, null, 2)}\n`);
  console.log(`Downloaded ${downloaded.length} Forest Service preview photos to ${previewDirectory}.`);
}
