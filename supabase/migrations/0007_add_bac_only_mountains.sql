-- Add the 21 BAC-only mountain identities audited in docs/data/BAC100_IDENTITY_AUDIT.md.
-- GPS coordinates and radii remain null until their verification points are independently verified.
-- Existing mountain/session ids are preserved on slug conflicts (notably the legacy oseosan row).

alter table public.mountains
  alter column latitude drop not null,
  alter column longitude drop not null,
  alter column verification_radius_m drop default,
  alter column verification_radius_m drop not null;

alter table public.mountains
  drop constraint if exists mountains_legacy_verification_fields_together_check;

alter table public.mountains
  add constraint mountains_legacy_verification_fields_together_check
  check (
    (latitude is null and longitude is null and verification_radius_m is null)
    or
    (latitude is not null and longitude is not null and verification_radius_m is not null)
  );

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
values
  ('38934190-408e-496b-a8b9-af7e2d4eda73', 'suraksan', '수락산', 'Suraksan', 640, '서울·경기', null, null, null, null, null, '서울 북동쪽과 남양주 경계에 솟은 바위산이에요. 도심에서 능선과 암릉 풍경을 가깝게 만날 수 있어요.', 101),
  ('6fd20871-a5ef-45e2-8b7c-6a062d460d29', 'cheonggyesan-seoul', '청계산', 'Cheonggyesan (Seoul)', 582, '서울·경기', null, null, null, null, null, '서울 남쪽 여러 도시의 경계를 잇는 친근한 산이에요. BAC 도전에서는 매봉을 인증지로 안내해요.', 102),
  ('72f34063-83a4-48eb-b085-793101ae02fe', 'yeoninsan', '연인산', 'Yeoninsan', 1068, '서울·경기', null, null, null, null, null, '가평의 깊은 능선과 계곡을 품은 산이에요. 봄 철쭉과 부드럽게 이어지는 능선길로 알려져 있어요.', 103),
  ('666730f2-dfe5-4836-a0da-42a9ed32cb2f', 'gamaksan-wonju', '감악산 (원주)', 'Gamaksan (Wonju)', 945, '강원', null, null, null, null, null, '원주와 제천 경계의 감악산이에요. 경기 파주의 감악산과는 다른 산 정체성으로 관리해요.', 104),
  ('fdf782be-74f6-4694-aa67-942afd96e8c7', 'odaesan-noinbong', '오대산 노인봉', 'Odaesan Noinbong', 1338, '강원', null, null, null, null, null, '오대산 권역의 노인봉 도전 대상이에요. 비로봉을 인증하는 오대산 항목과 별도로 기록해요.', 105),
  ('e58f9b28-8517-4735-9882-acfe6e66fc6e', 'hambaeksan', '함백산', 'Hambaeksan', 1573, '강원', null, null, null, null, null, '태백산맥의 높은 능선을 시원하게 조망할 수 있는 산이에요. 겨울 설경과 야생화 군락으로 사랑받아요.', 106),
  ('79603976-745d-4429-9d48-d13855fadfbd', 'cheonghwasan', '청화산', 'Cheonghwasan', 970, '충청', null, null, null, null, null, '괴산의 바위 능선과 백두대간 길이 만나는 산이에요. 주변 명산과 이어 걷는 산행지로도 알려져 있어요.', 107),
  ('534379d9-de49-4aa7-bb82-e99e4315e875', 'chilbosan-goesan', '칠보산 (괴산)', 'Chilbosan (Goesan)', 778, '충청', null, null, null, null, null, '괴산 쌍곡계곡 곁에 자리한 칠보산이에요. 같은 이름의 다른 산과 구분해 별도 정체성으로 관리해요.', 108),
  ('d061421b-de28-4545-8c15-c756a6c5e799', 'gayasan-yesan', '가야산 (충남)', 'Gayasan (Yesan)', 678, '충청', null, null, null, null, null, '충남 예산의 가야산이에요. 합천·성주의 가야산과 합치지 않고 별도 산으로 기록해요.', 109),
  ('27fe2f0a-0d76-4fd6-994c-5c8c7c516242', 'gwangdeoksan-cheonan', '광덕산', 'Gwangdeoksan (Cheonan)', 699, '충청', null, null, null, null, null, '천안 남쪽을 대표하는 산이에요. 완만한 숲길과 정상에서 펼쳐지는 충남 내륙 조망이 매력이에요.', 110),
  ('c78c7cff-16e4-4d3d-81a9-7bddbfc34b50', 'oseosan', '오서산 (보령)', 'Oseosan (Boryeong)', 791, '충청', null, null, null, null, null, '충남 보령과 홍성에 걸친 억새 명산이에요. BAC 기준 오서산 도전 대상이며 인증지 좌표는 검증 중이에요.', 69),
  ('37aa7401-345e-4695-8408-fb1020cd1aaa', 'yongbongsan-hongseong', '용봉산 (홍성)', 'Yongbongsan (Hongseong)', 381, '충청', null, null, null, null, null, '높이는 낮지만 기암이 촘촘히 이어지는 홍성의 바위산이에요. 짧은 산행에서도 다양한 암릉 풍경을 만나요.', 111),
  ('f51406e3-f89d-42b2-91b2-b1f3aa3b1308', 'gubongsan-jinan', '구봉산 (진안)', 'Gubongsan (Jinan)', 1002, '전라', null, null, null, null, null, '아홉 봉우리와 구름다리로 알려진 진안의 산이에요. BAC 도전 인증지는 천왕봉이에요.', 112),
  ('ddf46023-b9c6-466b-bd60-eb738106c53f', 'jirisan-baraebong', '지리산 바래봉', 'Jirisan Baraebong', 1165, '전라', null, null, null, null, null, '지리산 서북능선의 바래봉 도전 대상이에요. 천왕봉을 인증하는 지리산 항목과 별도로 기록해요.', 113),
  ('8ece158f-6817-410f-b37a-4867585b9515', 'jirisan-banyabong', '지리산 반야봉', 'Jirisan Banyabong', 1732, '전라', null, null, null, null, null, '지리산 주능선 가까이 솟은 반야봉 도전 대상이에요. 천왕봉·바래봉과 구분해 독립적으로 기록해요.', 114),
  ('e14f3850-3705-4287-904d-c90aeece5363', 'dalmasan', '달마산', 'Dalmasan', 489, '전라', null, null, null, null, null, '해남 땅끝 가까이 병풍처럼 솟은 암릉 산이에요. 낮은 고도와 달리 거친 능선과 남해 조망이 선명해요.', 115),
  ('2735db97-3028-4eab-85ba-ec51a88584c9', 'deongnyongsan', '덕룡산', 'Deongnyongsan', 432, '전라', null, null, null, null, null, '강진의 날카로운 암릉이 용의 등처럼 이어지는 산이에요. BAC 도전에서는 서봉을 인증지로 안내해요.', 116),
  ('5be1194d-d2d6-4b17-a121-7e6a10f1df62', 'dongaksan-gokseong', '동악산 (곡성)', 'Dongaksan (Gokseong)', 735, '전라', null, null, null, null, null, '곡성의 섬진강과 산줄기를 내려다보는 산이에요. BAC 도전 인증지는 시루봉이에요.', 117),
  ('66484cb1-9f9f-4f24-9aef-3c14aeb142ea', 'bulgapsan-yeonggwang', '불갑산 (영광)', 'Bulgapsan (Yeonggwang)', 516, '전라', null, null, null, null, null, '영광 불갑사 뒤편에 이어지는 산이에요. 가을 상사화와 부드러운 숲 능선으로 널리 알려져 있어요.', 118),
  ('761730d9-7fe8-4d01-a416-565b2915d988', 'chungnyeongsan-jangseong', '축령산 (장성)', 'Chungnyeongsan (Jangseong)', 621, '전라', null, null, null, null, null, '장성 편백숲을 품은 축령산이에요. 경기 남양주·가평의 축령산과 합치지 않고 별도 산으로 관리해요.', 119),
  ('26161aa2-d867-4720-af40-6221d5db0b25', 'joryeongsan', '조령산', 'Joryeongsan', 1026, '경상', null, null, null, null, null, '문경새재 남쪽의 백두대간을 잇는 산이에요. 암릉과 숲길이 번갈아 나타나는 힘 있는 산행지예요.', 120)
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

-- Legacy certification must fail closed for identities whose GPS point is pending.
create or replace function public.check_session_within_radius()
returns trigger
language plpgsql
as $$
declare
  m public.mountains%rowtype;
  d double precision;
begin
  select * into m from public.mountains where id = new.mountain_id;
  if not found then
    raise exception 'unknown mountain';
  end if;
  if m.latitude is null or m.longitude is null or m.verification_radius_m is null then
    raise exception 'mountain verification coordinates are pending';
  end if;
  new.verification_radius_m := m.verification_radius_m;
  d := public.distance_meters(new.latitude, new.longitude, m.latitude, m.longitude);
  if d > new.verification_radius_m + least(coalesce(new.gps_accuracy_m, 0), 50) then
    raise exception 'outside verification radius: % m', round(d);
  end if;
  return new;
end;
$$;

create or replace function public.check_member_within_radius()
returns trigger
language plpgsql
as $$
declare
  s public.certification_sessions%rowtype;
  m public.mountains%rowtype;
  d double precision;
begin
  if new.status <> 'confirmed' then
    return new;
  end if;
  if new.acceptance_latitude is null or new.acceptance_longitude is null then
    raise exception 'confirmed members must report their summit position';
  end if;
  select * into s from public.certification_sessions where id = new.certification_id;
  select * into m from public.mountains where id = s.mountain_id;
  if m.latitude is null or m.longitude is null or s.verification_radius_m is null then
    raise exception 'mountain verification coordinates are pending';
  end if;
  d := public.distance_meters(new.acceptance_latitude, new.acceptance_longitude, m.latitude, m.longitude);
  if d > s.verification_radius_m + least(coalesce(new.acceptance_accuracy_m, 0), 50) then
    raise exception 'outside verification radius: % m', round(d);
  end if;
  if new.confirmed_at is null then
    new.confirmed_at := now();
  end if;
  return new;
end;
$$;

comment on constraint mountains_legacy_verification_fields_together_check on public.mountains is
  'Legacy GPS fields are either all verified/present or all pending/null. New certification will migrate to verification_points.';
