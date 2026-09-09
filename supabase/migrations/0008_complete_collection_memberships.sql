-- Restore the audited Forestry Service identity omitted by the legacy seed, then
-- materialize both challenge memberships from explicit, reviewed mountain slugs.
-- Source: Korea Forest Service 100 Famous Mountains detail for Gitdaebong, checked 2026-09-09.
-- GPS verification coordinates remain null until independently verified.

insert into public.mountains (
  id,
  slug,
  name_ko,
  name_en,
  altitude_m,
  region,
  latitude,
  longitude,
  verification_radius_m,
  image_url,
  mascot_key,
  description,
  display_order
)
values (
  '3c630ad6-14c4-4e68-a694-646921fe0d61',
  'gitdaebong-hongdo',
  '깃대봉 (홍도)',
  'Gitdaebong (Hongdo)',
  368,
  '전라',
  null,
  null,
  null,
  null,
  null,
  '홍도의 최고봉으로, 섬과 다도해 풍경을 함께 만나는 산림청 100대 명산이에요. 인증 지점 좌표는 별도 검증 전까지 사용하지 않아요.',
  121
)
on conflict (slug) do update set
  name_ko = excluded.name_ko,
  name_en = excluded.name_en,
  altitude_m = excluded.altitude_m,
  region = excluded.region,
  latitude = null,
  longitude = null,
  verification_radius_m = null,
  image_url = coalesce(public.mountains.image_url, excluded.image_url),
  mascot_key = excluded.mascot_key,
  description = excluded.description,
  display_order = excluded.display_order;

-- Collection membership is derived from the audited source identities, never name-matched in SQL.
-- The BAC order is the repository's documented staging order, not an official BAC ranking.
create temporary table collection_membership_seed (
  collection_id text not null,
  mountain_slug text not null,
  display_order integer not null,
  source_label text not null
) on commit drop;

insert into collection_membership_seed (collection_id, mountain_slug, display_order, source_label)
values
  ('forest_service_100', 'hallasan', 1, '산림청 100대 명산'),
  ('forest_service_100', 'jirisan', 2, '산림청 100대 명산'),
  ('forest_service_100', 'seoraksan', 3, '산림청 100대 명산'),
  ('forest_service_100', 'bukhansan', 4, '산림청 100대 명산'),
  ('forest_service_100', 'deogyusan', 5, '산림청 100대 명산'),
  ('forest_service_100', 'sobaeksan', 6, '산림청 100대 명산'),
  ('forest_service_100', 'gyebangsan', 7, '산림청 100대 명산'),
  ('forest_service_100', 'taebaeksan', 8, '산림청 100대 명산'),
  ('forest_service_100', 'odaesan', 9, '산림청 100대 명산'),
  ('forest_service_100', 'gariwangsan', 10, '산림청 100대 명산'),
  ('forest_service_100', 'hwaaksan', 11, '산림청 100대 명산'),
  ('forest_service_100', 'bangtaesan', 12, '산림청 100대 명산'),
  ('forest_service_100', 'gayasan', 13, '산림청 100대 명산'),
  ('forest_service_100', 'jeombongsan', 14, '산림청 100대 명산'),
  ('forest_service_100', 'dutasan', 15, '산림청 100대 명산'),
  ('forest_service_100', 'baekdeoksan', 16, '산림청 100대 명산'),
  ('forest_service_100', 'daeamsan', 17, '산림청 100대 명산'),
  ('forest_service_100', 'chiaksan', 18, '산림청 100대 명산'),
  ('forest_service_100', 'myeongjisan', 19, '산림청 100대 명산'),
  ('forest_service_100', 'minjujisan', 20, '산림청 100대 명산'),
  ('forest_service_100', 'gajisan', 21, '산림청 100대 명산'),
  ('forest_service_100', 'jangansan', 22, '산림청 100대 명산'),
  ('forest_service_100', 'baegunsan-gwangyang', 23, '산림청 100대 명산'),
  ('forest_service_100', 'unmunsan', 24, '산림청 100대 명산'),
  ('forest_service_100', 'palgongsan', 25, '산림청 100대 명산'),
  ('forest_service_100', 'hwangseoksan', 26, '산림청 100대 명산'),
  ('forest_service_100', 'mudeungsan', 27, '산림청 100대 명산'),
  ('forest_service_100', 'sinbulsan', 28, '산림청 100대 명산'),
  ('forest_service_100', 'yongmunsan', 29, '산림청 100대 명산'),
  ('forest_service_100', 'unjangsan', 30, '산림청 100대 명산'),
  ('forest_service_100', 'hwangaksan', 31, '산림청 100대 명산'),
  ('forest_service_100', 'jaeyaksan', 32, '산림청 100대 명산'),
  ('forest_service_100', 'hwangmaesan', 33, '산림청 100대 명산'),
  ('forest_service_100', 'juheulsan', 34, '산림청 100대 명산'),
  ('forest_service_100', 'woraksan', 35, '산림청 100대 명산'),
  ('forest_service_100', 'biseulsan', 36, '산림청 100대 명산'),
  ('forest_service_100', 'hwangjangsan', 37, '산림청 100대 명산'),
  ('forest_service_100', 'deokhangsan', 38, '산림청 100대 명산'),
  ('forest_service_100', 'songnisan', 39, '산림청 100대 명산'),
  ('forest_service_100', 'garisan', 40, '산림청 100대 명산'),
  ('forest_service_100', 'jeoksangsan', 41, '산림청 100대 명산'),
  ('forest_service_100', 'taehwasan', 42, '산림청 100대 명산'),
  ('forest_service_100', 'geumsusan', 43, '산림청 100대 명산'),
  ('forest_service_100', 'eungbongsan', 44, '산림청 100대 명산'),
  ('forest_service_100', 'huiyangsan', 45, '산림청 100대 명산'),
  ('forest_service_100', 'seonginbong', 46, '산림청 100대 명산'),
  ('forest_service_100', 'geumosan', 47, '산림청 100대 명산'),
  ('forest_service_100', 'doraksan', 48, '산림청 100대 명산'),
  ('forest_service_100', 'unaksan', 49, '산림청 100대 명산'),
  ('forest_service_100', 'daeyasan', 50, '산림청 100대 명산'),
  ('forest_service_100', 'myeongseongsan', 51, '산림청 100대 명산'),
  ('forest_service_100', 'cheonseongsan', 52, '산림청 100대 명산'),
  ('forest_service_100', 'baegunsan-pocheon', 53, '산림청 100대 명산'),
  ('forest_service_100', 'seodaesan', 54, '산림청 100대 명산'),
  ('forest_service_100', 'gongjaksan', 55, '산림청 100대 명산'),
  ('forest_service_100', 'chungnyeongsan', 56, '산림청 100대 명산'),
  ('forest_service_100', 'jogyesan', 57, '산림청 100대 명산'),
  ('forest_service_100', 'baegunsan-jeongseon', 58, '산림청 100대 명산'),
  ('forest_service_100', 'daedunsan', 59, '산림청 100대 명산'),
  ('forest_service_100', 'yonghwasan', 60, '산림청 100대 명산'),
  ('forest_service_100', 'gubyeongsan', 61, '산림청 100대 명산'),
  ('forest_service_100', 'cheongnyangsan', 62, '산림청 100대 명산'),
  ('forest_service_100', 'yumyeongsan', 63, '산림청 100대 명산'),
  ('forest_service_100', 'gyeryongsan', 64, '산림청 100대 명산'),
  ('forest_service_100', 'cheonmasan', 65, '산림청 100대 명산'),
  ('forest_service_100', 'wolchulsan', 66, '산림청 100대 명산'),
  ('forest_service_100', 'geumjeongsan', 67, '산림청 100대 명산'),
  ('forest_service_100', 'moaksan', 68, '산림청 100대 명산'),
  ('forest_service_100', 'gitdaebong-hongdo', 69, '산림청 100대 명산'),
  ('forest_service_100', 'obongsan', 70, '산림청 100대 명산'),
  ('forest_service_100', 'naejangsan', 71, '산림청 100대 명산'),
  ('forest_service_100', 'muhaksan', 72, '산림청 100대 명산'),
  ('forest_service_100', 'hwawangsan', 73, '산림청 100대 명산'),
  ('forest_service_100', 'bangjangsan', 74, '산림청 100대 명산'),
  ('forest_service_100', 'baegamsan', 75, '산림청 100대 명산'),
  ('forest_service_100', 'dobongsan', 76, '산림청 100대 명산'),
  ('forest_service_100', 'chuwolsan', 77, '산림청 100대 명산'),
  ('forest_service_100', 'cheongwansan', 78, '산림청 100대 명산'),
  ('forest_service_100', 'juwangsan', 79, '산림청 100대 명산'),
  ('forest_service_100', 'cheontaesan', 80, '산림청 100대 명산'),
  ('forest_service_100', 'naeyeonsan', 81, '산림청 100대 명산'),
  ('forest_service_100', 'duryunsan', 82, '산림청 100대 명산'),
  ('forest_service_100', 'maisan', 83, '산림청 100대 명산'),
  ('forest_service_100', 'geumsan', 84, '산림청 100대 명산'),
  ('forest_service_100', 'gamaksan', 85, '산림청 100대 명산'),
  ('forest_service_100', 'samaksan', 86, '산림청 100대 명산'),
  ('forest_service_100', 'gwanaksan', 87, '산림청 100대 명산'),
  ('forest_service_100', 'paryeongsan', 88, '산림청 100대 명산'),
  ('forest_service_100', 'soyosan', 89, '산림청 100대 명산'),
  ('forest_service_100', 'gangcheonsan', 90, '산림청 100대 명산'),
  ('forest_service_100', 'chilgapsan', 91, '산림청 100대 명산'),
  ('forest_service_100', 'yeonhwasan', 92, '산림청 100대 명산'),
  ('forest_service_100', 'byeonsan', 93, '산림청 100대 명산'),
  ('forest_service_100', 'deoksungsan', 94, '산림청 100대 명산'),
  ('forest_service_100', 'manisan', 95, '산림청 100대 명산'),
  ('forest_service_100', 'namsan-gyeongju', 96, '산림청 100대 명산'),
  ('forest_service_100', 'mireuksan', 97, '산림청 100대 명산'),
  ('forest_service_100', 'jirisan-tongyeong', 98, '산림청 100대 명산'),
  ('forest_service_100', 'seonunsan', 99, '산림청 100대 명산'),
  ('forest_service_100', 'palbongsan', 100, '산림청 100대 명산'),
  ('bac_100', 'gwanaksan', 1, '관악산'),
  ('bac_100', 'dobongsan', 2, '도봉산'),
  ('bac_100', 'bukhansan', 3, '북한산'),
  ('bac_100', 'suraksan', 4, '수락산'),
  ('bac_100', 'cheonggyesan-seoul', 5, '청계산'),
  ('bac_100', 'geumjeongsan', 6, '금정산'),
  ('bac_100', 'biseulsan', 7, '비슬산'),
  ('bac_100', 'manisan', 8, '마니산(강화도)'),
  ('bac_100', 'mudeungsan', 9, '무등산'),
  ('bac_100', 'gyeryongsan', 10, '계룡산'),
  ('bac_100', 'sinbulsan', 11, '신불산'),
  ('bac_100', 'gajisan', 12, '가지산'),
  ('bac_100', 'yeoninsan', 13, '연인산'),
  ('bac_100', 'myeongjisan', 14, '명지산'),
  ('bac_100', 'hwaaksan', 15, '화악산(가평)'),
  ('bac_100', 'yumyeongsan', 16, '유명산'),
  ('bac_100', 'gamaksan', 17, '감악산(파주)'),
  ('bac_100', 'cheonmasan', 18, '천마산'),
  ('bac_100', 'soyosan', 19, '소요산'),
  ('bac_100', 'yongmunsan', 20, '용문산(양평)'),
  ('bac_100', 'gamaksan-wonju', 21, '감악산(원주)'),
  ('bac_100', 'garisan', 22, '가리산(홍천)'),
  ('bac_100', 'gariwangsan', 23, '가리왕산'),
  ('bac_100', 'gyebangsan', 24, '계방산'),
  ('bac_100', 'deokhangsan', 25, '덕항산'),
  ('bac_100', 'dutasan', 26, '두타산'),
  ('bac_100', 'bangtaesan', 27, '방태산'),
  ('bac_100', 'baekdeoksan', 28, '백덕산'),
  ('bac_100', 'baegunsan-jeongseon', 29, '백운산(동강)'),
  ('bac_100', 'samaksan', 30, '삼악산'),
  ('bac_100', 'seoraksan', 31, '설악산'),
  ('bac_100', 'odaesan-noinbong', 32, '오대산 노인봉'),
  ('bac_100', 'odaesan', 33, '오대산 비로봉'),
  ('bac_100', 'obongsan', 34, '오봉산(춘천)'),
  ('bac_100', 'yonghwasan', 35, '용화산'),
  ('bac_100', 'eungbongsan', 36, '응봉산(울진)'),
  ('bac_100', 'chiaksan', 37, '치악산'),
  ('bac_100', 'taebaeksan', 38, '태백산'),
  ('bac_100', 'taehwasan', 39, '태화산'),
  ('bac_100', 'palbongsan', 40, '팔봉산(홍천)'),
  ('bac_100', 'hambaeksan', 41, '함백산'),
  ('bac_100', 'gubyeongsan', 42, '구병산(보은)'),
  ('bac_100', 'geumsusan', 43, '금수산'),
  ('bac_100', 'daeyasan', 44, '대야산'),
  ('bac_100', 'doraksan', 45, '도락산'),
  ('bac_100', 'minjujisan', 46, '민주지산'),
  ('bac_100', 'songnisan', 47, '속리산'),
  ('bac_100', 'woraksan', 48, '월악산'),
  ('bac_100', 'cheontaesan', 49, '천태산'),
  ('bac_100', 'cheonghwasan', 50, '청화산'),
  ('bac_100', 'chilbosan-goesan', 51, '칠보산(괴산)'),
  ('bac_100', 'gayasan-yesan', 52, '가야산(충남)'),
  ('bac_100', 'gwangdeoksan-cheonan', 53, '광덕산'),
  ('bac_100', 'daedunsan', 54, '대둔산'),
  ('bac_100', 'oseosan', 55, '오서산(보령)'),
  ('bac_100', 'yongbongsan-hongseong', 56, '용봉산(홍성)'),
  ('bac_100', 'chilgapsan', 57, '칠갑산(청양)'),
  ('bac_100', 'gubongsan-jinan', 58, '구봉산(진안)'),
  ('bac_100', 'byeonsan', 59, '내변산(부안)'),
  ('bac_100', 'naejangsan', 60, '내장산'),
  ('bac_100', 'deogyusan', 61, '덕유산'),
  ('bac_100', 'maisan', 62, '마이산(진안)'),
  ('bac_100', 'moaksan', 63, '모악산'),
  ('bac_100', 'seonunsan', 64, '선운산'),
  ('bac_100', 'unjangsan', 65, '운장산'),
  ('bac_100', 'jangansan', 66, '장안산'),
  ('bac_100', 'jirisan-baraebong', 67, '지리산 바래봉'),
  ('bac_100', 'jirisan-banyabong', 68, '지리산 반야봉'),
  ('bac_100', 'dalmasan', 69, '달마산'),
  ('bac_100', 'deongnyongsan', 70, '덕룡산'),
  ('bac_100', 'dongaksan-gokseong', 71, '동악산(곡성)'),
  ('bac_100', 'duryunsan', 72, '두륜산'),
  ('bac_100', 'bangjangsan', 73, '방장산'),
  ('bac_100', 'baegamsan', 74, '백암산'),
  ('bac_100', 'baegunsan-gwangyang', 75, '백운산(광양)'),
  ('bac_100', 'bulgapsan-yeonggwang', 76, '불갑산(영광)'),
  ('bac_100', 'wolchulsan', 77, '월출산'),
  ('bac_100', 'jogyesan', 78, '조계산'),
  ('bac_100', 'cheongwansan', 79, '천관산'),
  ('bac_100', 'chungnyeongsan-jangseong', 80, '축령산(장성)'),
  ('bac_100', 'paryeongsan', 81, '팔영산'),
  ('bac_100', 'geumosan', 82, '금오산(구미)'),
  ('bac_100', 'namsan-gyeongju', 83, '남산(경주)'),
  ('bac_100', 'naeyeonsan', 84, '내연산'),
  ('bac_100', 'sobaeksan', 85, '소백산'),
  ('bac_100', 'joryeongsan', 86, '조령산'),
  ('bac_100', 'juwangsan', 87, '주왕산'),
  ('bac_100', 'juheulsan', 88, '주흘산'),
  ('bac_100', 'cheongnyangsan', 89, '청량산'),
  ('bac_100', 'palgongsan', 90, '팔공산'),
  ('bac_100', 'hwangaksan', 91, '황악산(김천)'),
  ('bac_100', 'gayasan', 92, '가야산(경상)'),
  ('bac_100', 'jaeyaksan', 93, '재약산'),
  ('bac_100', 'jirisan', 94, '지리산'),
  ('bac_100', 'cheonseongsan', 95, '천성산'),
  ('bac_100', 'hwawangsan', 96, '화왕산(창녕)'),
  ('bac_100', 'hwangmaesan', 97, '황매산(산청)'),
  ('bac_100', 'hwangseoksan', 98, '황석산(함양)'),
  ('bac_100', 'unaksan', 99, '운악산'),
  ('bac_100', 'hallasan', 100, '한라산');

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
  null,
  seed.display_order,
  seed.source_label
from collection_membership_seed seed
join public.mountains mountain on mountain.slug = seed.mountain_slug
on conflict (collection_id, mountain_id) do update set
  verification_point_id = excluded.verification_point_id,
  display_order = excluded.display_order,
  source_label = excluded.source_label;

do $$
declare
  forest_count integer;
  bac_count integer;
  shared_count integer;
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

  if available_identity_count = desired_identity_count
     and (forest_count <> 100 or bac_count <> 100 or shared_count <> 79) then
    raise exception 'invalid collection membership counts: forest=%, bac=%, shared=%', forest_count, bac_count, shared_count;
  end if;
end;
$$;
