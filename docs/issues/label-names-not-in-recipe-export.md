# Labels are unreadable in the raw Firestore export

**Type:** data model
**Status:** open
**Found:** 2026-09-04, while reworking how a category is stored
**Priority:** medium — the same requirement that drove the category change applies here

## Problem

Firestore is treated as an export format: the owner takes the raw JSON out and uses it
elsewhere, so a recipe document has to be readable on its own. The category now satisfies that
by storing `{ key, name }` — see
`docs/superpowers/specs/2026-09-04-labels-categories-separation-design.md`.

Labels do not. A recipe stores only ids:

```json
{
  "title": "Linzenstoof met wortel",
  "category": { "key": "main", "name": "Hoofdgerecht" },
  "labelIds": ["x7Kp2QmVn8", "aB3dEf9Hij"]
}
```

Reading that export tells you nothing about the labels without also exporting the `labels`
collection and joining on it by hand.

## Why this is harder than the category was

Categories are a closed set defined in code, so a stable, readable key could simply be
invented. Labels are user-created, which removes both of those properties:

- There is no controlled key. A name like "Pittig / scherp!" has no obvious slug, and two users
  can create labels whose slugs would collide.
- The name is genuinely mutable. A category rename is a deliberate code change; a label rename
  is an ordinary user action, so a denormalised copy goes stale far more often.
- A recipe holds several labels, so any denormalised field is an array that has to be kept in
  step on every label edit, not a single value.

## Options

**A. Denormalise the names alongside the ids.**

```json
"labels": [
  { "id": "x7Kp2QmVn8", "name": "Pittig" },
  { "id": "aB3dEf9Hij", "name": "Glutenvrij" }
]
```

Readable, and it matches what the category now does. Cost: renaming a label means fanning out
an update across every recipe that carries it, or accepting stale names in the export. Note
there is currently no rename feature for labels at all, which makes this cheaper today than it
sounds — but it silently adds one more thing that a future rename feature has to do.

**B. Store only names, drop the ids.** The `labels` collection then holds nothing the recipe
needs, and label identity becomes the string itself. Simplest export, but it makes "rename a
label everywhere" impossible to do reliably and invites near-duplicates ("pittig" vs "Pittig").

**C. Leave it, and export the `labels` collection alongside `recipes`.** No code change and no
drift. It just means the recipe JSON is not self-contained, so whatever consumes it needs the
join. Acceptable if the consumer is a script the owner controls.

## Recommendation

Decide **A versus C** by asking one question: does whatever consumes this export do a join, or
does it expect flat readable rows? If a script consumes it, C costs nothing. If the answer is
"I want to open the JSON and read it", A is the answer, and the rename fan-out should be
written down as a known consequence at the same time.

Do not pick B. Losing stable label identity is a worse trade than either alternative.

## Notes

- This is deliberately deferred: label *display* is awaiting its own design, and that design
  may change what a label even is. Revisit both together.
- Related: `docs/issues/label-lookup-n-plus-one.md` — option A would also remove the need to
  resolve label names on read at all, which would incidentally fix that issue.
