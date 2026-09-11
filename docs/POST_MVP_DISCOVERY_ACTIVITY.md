# 100PEAKS discovery and activity roadmap

Status: user-approved post-MVP direction, 2026-09-11.

This document defines the safe implementation path for four requested extensions:

1. list/map mountain catalog,
2. restaurants near each mountain,
3. Apple Fitness-compatible hiking activity import,
4. pace records and an opt-in leaderboard for certified hikers.

It extends, but does not replace, the certification, collection, privacy, or visual rules in `100PEAKS_MASTER_SPEC.md`, `docs/COLLECTIONS.md`, and `docs/data/BAC100_DATA_POLICY.md`.

## 1. Mountain catalog: list and map

The mountain tab keeps one catalog and one set of filters. `리스트 / 지도` changes only the presentation; it must not create a separate collection or completion count.

Rules:

- show only mountains in the selected collection and current filter/search result,
- distinguish completed and incomplete pins with both color and text,
- open the existing mountain-detail route from a selected pin,
- never invent a pin for a mountain whose location is missing,
- never print or expose an exact certification coordinate,
- use a separate public display location when that model is available.

The current implementation asks for foreground location only when the user opens the map, defaults to a 50km radius, and lets the user choose 10/30/50/100km. It keeps the map centered on the user's location, stores no user coordinate, and shows only filtered mountains inside the selected radius. Existing eligible mountain coordinates are rounded to two decimal places before rendering a pin. This is an approximate, kilometre-level catalog location, not a certification target. Pending BAC verification points remain excluded.

Native maps use `react-native-maps`, which uses Apple Maps or Google Maps on iOS and Google Maps on Android. The web build keeps a safe fallback until a web map provider is selected. See the [Expo map documentation](https://docs.expo.dev/versions/latest/sdk/map-view/).

## 2. Restaurants near a mountain

Product placement:

- add `산 아래 뭐 먹지?` to mountain detail,
- show name, category, approximate distance, address, and an external-map action,
- include loading, empty, provider-attribution, and failure states,
- do not present paid or sponsored ordering unless explicitly labeled.

Data and security:

- search from a public mountain access/trailhead location, never a summit certification point,
- call the provider through a Supabase Edge Function so the REST key is not embedded in the app,
- prefer Kakao Local category search (`FD6`, food) for Korean coverage,
- confirm provider storage/display terms before caching results,
- do not copy restaurant images or reviews without a licensed source.

Required environment secret when implemented:

```text
KAKAO_REST_API_KEY
```

Provider reference: [Kakao Local REST API](https://developers.kakao.com/docs/latest/ko/local/dev-guide#search-by-category).

## 3. Hiking activity and Apple Fitness compatibility

Apple Fitness is not a separate sign-in provider for this feature. On iPhone, workout data is accessed through HealthKit after the user grants permission.

Version 1 is read-only:

- import hiking workouts the user explicitly selects,
- read only the minimum needed aggregates: start/end time, duration, distance, and elevation gain when available,
- keep raw workout routes on the device by default,
- never read or upload heart rate for pace ranking,
- make HealthKit optional; denial must not block mountain certification,
- show exactly which fields will be imported before requesting authorization.

HealthKit requires an iOS native capability and usage descriptions. It cannot be tested in Expo Go; it requires a new development/TestFlight build. Follow Apple's [HealthKit authorization](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data) and [workout](https://developer.apple.com/documentation/healthkit/workouts-and-activity-rings) guidance. Workout routes are HealthKit samples; see [HKWorkoutRoute](https://developer.apple.com/documentation/healthkit/hkworkoutroute).

Proposed aggregate model:

```text
hiking_activities
- id
- user_id
- mountain_id (nullable for an unlinked personal record)
- certification_id (nullable; required for ranking eligibility)
- source: manual | healthkit
- source_workout_id_hash (nullable, unique per user/source)
- started_at / ended_at
- moving_seconds
- distance_m
- elevation_gain_m (nullable)
- visibility: private | friends | public
- ranking_eligible
- created_at / updated_at
```

HealthKit fields are private by default. RLS must allow owners to read and edit their records; public screens receive only explicitly shared aggregates, never raw routes or HealthKit identifiers.

## 4. Pace records and ranking

Users may enter a manual activity for their own diary, but a client-entered pace is never trusted as a ranked score.

Ranking rules:

- calculate `pace_seconds_per_km` on the server from validated duration and distance,
- require an existing confirmed certification for the same user and mountain,
- initially allow only linked HealthKit imports to be ranking-eligible,
- require explicit `랭킹 공개` opt-in; the default is private,
- provide `친구 / 전체` scopes,
- label the result as a reference ranking because routes and conditions differ,
- exclude impossible/invalid duration or distance values and duplicated imports,
- never rank by heart rate, age, sex, weight, or other sensitive health attributes.

The client cannot write rank or computed pace fields directly. A server query/view calculates ordering and returns only display-safe profile fields plus aggregate activity values.

## 5. Implementation order

1. `리스트 / 지도` catalog presentation. **Implemented 2026-09-11.**
2. Create a public mountain display/trailhead location model; do not reuse certification targets.
3. Add the restaurant Edge Function and mountain-detail section after the provider key is configured.
4. Add the private hiking-activity schema, RLS, manual diary, and privacy controls.
5. Add read-only HealthKit import and ship a new TestFlight build.
6. Add server-computed, opt-in pace ranking and abuse/duplicate checks.

The BAC coordinate verification and `verification_points` migration remain safety-critical prerequisites for certification behavior. Discovery pins, restaurants, and activity ranking must never activate a pending BAC verification point.
