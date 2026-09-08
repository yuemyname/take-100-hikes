# 100PEAKS Official Visual Direction

This document locks the current visual/product interpretation for 100PEAKS.

## Product identity

100PEAKS is a social collectible app for completing Korea's 100 famous mountains.

The thing users collect is the **mountain completion record / stamp**, not characters.

The product should feel closer to an editorial outdoor collectible project than a conventional fitness tracker.

## Visual target

The closest screen target is:

`docs/references/D5F2733C-13FD-40B4-96CC-EF3ABDBAF3DF.png`

Reproduce that concept as closely as practical in:

- cream / off-white page background,
- strong black type hierarchy,
- saturated red / yellow / blue / pink / green accents,
- large real mountain photography,
- official characters overlapping photos rather than sitting as tiny icons,
- imperfect sticker / doodle / collage energy,
- fewer generic white rounded cards,
- playful Korean microcopy next to otherwise serious mountain imagery.

## Official character cast

Files in `assets/official/` whose names contain `Take a Hike_Character` are the official recurring character artwork.

There are four color families:

- YELLOW
- RED
- BLUE
- PINK

Numbered files are pose/variant artwork within the same four-character cast.

Characters are **not mountain-specific**. Do not map Seoraksan to one character, Hallasan to another, etc. The same four characters can appear throughout the product according to mood and context.

Do not redraw official art as SVG, alter proportions, recolor it, or generate a new mascot per mountain.

## Situational official graphics

The `a.*.PNG` uploads are situational graphics/stickers rather than separate collectible characters. Stable aliases are available under `assets/official/stickers/`.

Suggested contextual use:

- `fresh-air.png` — home hero, mountain detail, good-weather/photo moments
- `want-to-go-home.png` — playful difficult-hike / friend-feed moments
- `did-it.png` — certification success
- `never-again.png` — post-hike/share humor
- `safe-descent.png` — completed hike / descent state
- `water.png` — camera/GPS verification or hike-prep accents
- `mountain.png` — home / mountain collection accents
- `save-me.png` — playful strenuous-hike state only, never for actual emergency UI
- `summit-today.png` — completion recap
- `summit-success.png` — certification success
- `why-i-hike.png` — scenic photo / mountain detail
- `summit-check.png` — summit verification
- `low-battery.png` — playful strenuous-hike state
- `flat-ground-best.png` — social/feed humor
- `sun.png` — scenic/editorial decoration

These are decorative assets. Do not let them obscure verification, safety, navigation, or accessibility-critical content.

## Supporting mascot library

`assets/mascots/` is intentionally preserved.

It is not the official four-character system. It may later be reused for:

- seasonal campaigns,
- easter eggs,
- profile decoration,
- event badges,
- empty states,
- experimental content.

Do not delete these files unless the user explicitly asks.

## Screen acceptance direction

### Home

- 100PEAKS wordmark on top.
- Progress (X / 100) is a dominant first-screen number.
- Large mountain hero photo.
- One official character overlaps the hero photo at large scale.
- One or two official situational graphics may be used as collage accents.
- Quick actions remain accessible but should not dominate the hero.
- The page must not resemble a generic fitness dashboard.

### Mountain collection

- The mountain/photo is the primary collectible visual.
- Completion state is expressed through stamp/check/progress treatment, not a newly unlocked mountain character.
- Official cast may appear as decoration, not one-to-one mountain identity.

### Mountain detail

- Large mountain photography and clear mountain facts.
- Certified-user list prioritizes mutual friends.
- Official cast/stickers may overlap photography editorially, but not become a mountain-specific mascot.

### Certification

- GPS eligibility, camera, and verification state remain dominant.
- `summit-check`, `water`, `did-it`, or `summit-success` may be used as decorative state graphics where appropriate.
- Never use joke graphics in a way that can be mistaken for safety or emergency guidance.

### Friends / shared certification

- Maintain the playful collectible tone.
- Use recurring official characters to make shared moments feel social.
- Do not turn characters into profile identities unless the user explicitly chooses one in a future feature.

### MY

- Emphasize 100-mountain completion, regions, history, shared hikes, and stamps.
- Do not show a collected-character count as a core metric.

## Priority when rules conflict

For behavior/data/business logic: `100PEAKS_MASTER_SPEC.md` wins.

For the newer character-system decision in this document: this file overrides older master-spec text that implies one mascot per mountain or character collection.

For visual composition: the original 100PEAKS UI concept image wins over generic implementation defaults.
