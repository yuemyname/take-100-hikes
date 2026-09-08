# 100PEAKS collection model

## Product rule

100PEAKS supports more than one 100-mountain challenge. The first two canonical collections are:

1. `forest_service_100` — 산림청 100대 명산
2. `bac_100` — BAC 명산100 기준

The user chooses one **primary collection** for Home and the default mountain catalog view. They can switch at any time. Switching never deletes or resets certifications.

A summit certification belongs to a mountain/session, not to one collection. The same confirmed summit can therefore count toward every collection that contains that mountain and whose verification rule is satisfied.

Example:

```text
설악산 certification
  ├─ 산림청 100대 명산 progress +1
  └─ BAC 명산100 progress +1
```

## Data model

`collections`
- challenge metadata and target count

`collection_mountains`
- many-to-many membership between collections and mountains
- separate display order per collection
- optional verification point

`verification_points`
- named summit/checkpoint such as 백운대, 신선대, 관음봉, 대청봉
- GPS coordinates are nullable until independently verified
- `coordinate_status` is `pending | verified | retired`

`profiles.primary_collection_id`
- server-side home/default preference once profile sync is enabled

For the current client prototype, the selected primary collection is persisted locally with AsyncStorage. This avoids blocking UI work on a database migration while preserving the same `CollectionId` values used by the database.

## BAC migration status

The current `src/data/mountains.json` is the existing Forestry Service-oriented seed. BAC has a partially overlapping set plus BAC-only entries.

- Never invent GPS coordinates for BAC-only mountains.
- `docs/data/bac100-candidates.csv` is the staging source for BAC mountain names, named certification points, regions and coordinate verification state.
- BAC-only rows are added to the canonical `mountains` table only after the mountain identity is resolved.
- A BAC `verification_point` may only be marked `verified` after its checkpoint coordinates are checked from a trustworthy source.
- Until those rows are connected, the app explicitly labels the BAC catalog as partially connected instead of pretending that unverified entries are usable for GPS certification.

## UX rules

Home
- show the primary collection switcher
- show `X / 100` for the selected collection
- changing the collection immediately changes recommendations and progress

명산 도감
- show the same collection switcher
- filter the catalog to the selected collection
- use collection-specific order

MY
- show the user's primary collection prominently
- show progress for both Forestry Service 100 and BAC 100
- one summit record may increment both

Certification
- certification is never tied to the currently selected collection only
- store the summit/session once
- collection progress is derived from memberships

## Brand/legal presentation

Use plain text such as `BAC 명산100 기준` to identify the source/list. Do not imply an official partnership, and do not copy BLACKYAK/BAC logos or visual identity unless permission is obtained.
