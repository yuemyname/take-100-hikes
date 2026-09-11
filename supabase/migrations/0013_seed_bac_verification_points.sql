-- Seed BAC 명산100 named verification points without inventing GPS data.
-- Source: docs/data/bac100-candidates.csv, identity audit checked 2026-09-08.
-- Coordinates and radii remain null/pending until separately verified from
-- trustworthy official/public map sources.

alter table public.verification_points
  alter column verification_radius_m drop default,
  alter column verification_radius_m drop not null;

alter table public.verification_points
  drop constraint if exists verification_points_pending_fields_null_check,
  drop constraint if exists verification_points_verified_fields_complete_check,
  drop constraint if exists verification_points_radius_positive_check;

alter table public.verification_points
  add constraint verification_points_pending_fields_null_check
    check (
      coordinate_status <> 'pending'
      or (latitude is null and longitude is null and verification_radius_m is null)
    ),
  add constraint verification_points_verified_fields_complete_check
    check (
      coordinate_status <> 'verified'
      or (
        latitude is not null
        and longitude is not null
        and verification_radius_m is not null
        and nullif(trim(source_note), '') is not null
      )
    ),
  add constraint verification_points_radius_positive_check
    check (verification_radius_m is null or verification_radius_m > 0);

create unique index if not exists verification_points_mountain_name_unique
  on public.verification_points (mountain_id, name_ko);

create temporary table bac_verification_point_seed (
  display_order integer primary key,
  mountain_label text not null unique,
  verification_point_name text not null
) on commit drop;

insert into bac_verification_point_seed (
  display_order,
  mountain_label,
  verification_point_name
)
values
  (1, '관악산', '정상'),
  (2, '도봉산', '신선대'),
  (3, '북한산', '백운대'),
  (4, '수락산', '주봉'),
  (5, '청계산', '매봉'),
  (6, '금정산', '고당봉'),
  (7, '비슬산', '천왕봉'),
  (8, '마니산(강화도)', '정상'),
  (9, '무등산', '서석대 정상석/인왕봉 정상석'),
  (10, '계룡산', '관음봉'),
  (11, '신불산', '정상'),
  (12, '가지산', '정상'),
  (13, '연인산', '정상'),
  (14, '명지산', '정상'),
  (15, '화악산(가평)', '중봉'),
  (16, '유명산', '정상'),
  (17, '감악산(파주)', '정상'),
  (18, '천마산', '정상석'),
  (19, '소요산', '의상대'),
  (20, '용문산(양평)', '가섭봉 정상석'),
  (21, '감악산(원주)', '원주/제천 정상석'),
  (22, '가리산(홍천)', '정상'),
  (23, '가리왕산', '정상'),
  (24, '계방산', '정상'),
  (25, '덕항산', '정상'),
  (26, '두타산', '정상'),
  (27, '방태산', '주억봉'),
  (28, '백덕산', '정상'),
  (29, '백운산(동강)', '정상'),
  (30, '삼악산', '용화봉'),
  (31, '설악산', '대청봉'),
  (32, '오대산 노인봉', '노인봉'),
  (33, '오대산 비로봉', '비로봉'),
  (34, '오봉산(춘천)', '정상(5봉)'),
  (35, '용화산', '정상'),
  (36, '응봉산(울진)', '정상'),
  (37, '치악산', '비로봉'),
  (38, '태백산', '천제단'),
  (39, '태화산', '정상'),
  (40, '팔봉산(홍천)', '팔봉산(2봉인증)'),
  (41, '함백산', '정상'),
  (42, '구병산(보은)', '정상'),
  (43, '금수산', '정상'),
  (44, '대야산', '정상'),
  (45, '도락산', '정상'),
  (46, '민주지산', '정상'),
  (47, '속리산', '천왕봉'),
  (48, '월악산', '영봉'),
  (49, '천태산', '정상'),
  (50, '청화산', '정상'),
  (51, '칠보산(괴산)', '정상'),
  (52, '가야산(충남)', '정상(정상석 설치)'),
  (53, '광덕산', '정상'),
  (54, '대둔산', '마천대'),
  (55, '오서산(보령)', '정상'),
  (56, '용봉산(홍성)', '정상'),
  (57, '칠갑산(청양)', '정상'),
  (58, '구봉산(진안)', '천왕봉'),
  (59, '내변산(부안)', '관음봉'),
  (60, '내장산', '신선봉'),
  (61, '덕유산', '향적봉'),
  (62, '마이산(진안)', '비룡대'),
  (63, '모악산', '정상'),
  (64, '선운산', '수리봉'),
  (65, '운장산', '운장대'),
  (66, '장안산', '정상'),
  (67, '지리산 바래봉', '바래봉'),
  (68, '지리산 반야봉', '반야봉'),
  (69, '달마산', '달마봉'),
  (70, '덕룡산', '서봉'),
  (71, '동악산(곡성)', '시루봉'),
  (72, '두륜산', '가련봉'),
  (73, '방장산', '정상'),
  (74, '백암산', '상왕봉'),
  (75, '백운산(광양)', '상봉'),
  (76, '불갑산(영광)', '연실봉'),
  (77, '월출산', '천황봉 정상석'),
  (78, '조계산', '장군봉'),
  (79, '천관산', '연대봉'),
  (80, '축령산(장성)', '정상'),
  (81, '팔영산', '깃대봉'),
  (82, '금오산(구미)', '현월봉'),
  (83, '남산(경주)', '금오봉'),
  (84, '내연산', '삼지봉'),
  (85, '소백산', '비로봉'),
  (86, '조령산', '정상'),
  (87, '주왕산', '주봉'),
  (88, '주흘산', '주봉'),
  (89, '청량산', '장인봉'),
  (90, '팔공산', '비로봉'),
  (91, '황악산(김천)', '정상'),
  (92, '가야산(경상)', '정상'),
  (93, '재약산', '수미봉'),
  (94, '지리산', '지리산 천왕봉'),
  (95, '천성산', '원효봉'),
  (96, '화왕산(창녕)', '정상'),
  (97, '황매산(산청)', '정상'),
  (98, '황석산(함양)', '황석산 정상석'),
  (99, '운악산', '서봉'),
  (100, '한라산', '백록담');

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
  membership.mountain_id,
  seed.verification_point_name,
  null,
  null,
  null,
  'pending',
  'BAC 명산100 공개 목록의 인증지명(2026-09-08 확인). GPS 좌표와 인증 반경은 미검증.'
from bac_verification_point_seed seed
join public.collection_mountains membership
  on membership.collection_id = 'bac_100'
 and membership.display_order = seed.display_order
 and membership.source_label = seed.mountain_label
on conflict (mountain_id, name_ko) do nothing;

update public.collection_mountains membership
set verification_point_id = point.id
from bac_verification_point_seed seed
join public.verification_points point
  on point.name_ko = seed.verification_point_name
where membership.collection_id = 'bac_100'
  and membership.display_order = seed.display_order
  and membership.source_label = seed.mountain_label
  and point.mountain_id = membership.mountain_id;

do $$
declare
  source_count integer;
  matched_identity_count integer;
  linked_count integer;
  distinct_point_count integer;
  unsafe_pending_count integer;
begin
  select count(*) into source_count
  from bac_verification_point_seed;

  select count(*) into matched_identity_count
  from bac_verification_point_seed seed
  join public.collection_mountains membership
    on membership.collection_id = 'bac_100'
   and membership.display_order = seed.display_order
   and membership.source_label = seed.mountain_label;

  select count(*), count(distinct membership.verification_point_id)
  into linked_count, distinct_point_count
  from public.collection_mountains membership
  where membership.collection_id = 'bac_100'
    and membership.verification_point_id is not null;

  select count(*) into unsafe_pending_count
  from public.collection_mountains membership
  join public.verification_points point on point.id = membership.verification_point_id
  where membership.collection_id = 'bac_100'
    and point.coordinate_status = 'pending'
    and (
      point.latitude is not null
      or point.longitude is not null
      or point.verification_radius_m is not null
    );

  if source_count <> 100
    or matched_identity_count <> 100
    or linked_count <> 100
    or distinct_point_count <> 100
    or unsafe_pending_count <> 0
  then
    raise exception
      'invalid BAC verification point seed: source=%, identities=%, linked=%, distinct=%, unsafe_pending=%',
      source_count,
      matched_identity_count,
      linked_count,
      distinct_point_count,
      unsafe_pending_count;
  end if;
end;
$$;

comment on column public.verification_points.verification_radius_m is
  'Null until the named point radius is independently verified; required when coordinate_status is verified.';
