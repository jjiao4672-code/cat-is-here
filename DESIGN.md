# Design

## Visual World

Cat's scrapbook diagnosis desk. AdlerLens is a warm, handmade note from a round-headed tabby cat, not a dashboard or clinic. The cream paper sits on a deep sage desk and uses pencil texture, imperfect tape, and small rotations to create a quiet stationery world.

## Character

The fixed guide is a round-headed brown-gray tabby: broad face, distinct tabby forehead and cheek markings, white muzzle and chest, large greenish eyes, and a pink nose. The production illustration is `assets/tabby-therapist.png`. It is a character with a job, never a generic emoji mascot.

## Palette

- Cream paper: `#fffdf5`
- Peach field and action ink: `#f7dfc7`, `#db8f72`
- Butter note: `#f4d979`
- Sage selection: `#b8c59c`, `#71835c`
- Warm writing ink: `#554435`

## Layout Rules

- The desktop scene uses one shared 16:9 coordinate system: `desk-scene-v7-4k.webp` contains the clean-texture, centered physical paper and shadows; HTML contributes content and the transparent hand-drawn dialogue; `desk-foreground-v7-4k.png` repeats exact decoded pixels above the content.
- The v5 art direction is locked to the supplied vintage print reference: muted parchment/ochre/olive/terracotta, flat gouache shapes, broad shadows, and material-specific grain; avoid global texture overlays, photorealistic highlights, and saturated orange.
- Question changes update the fixed paper immediately. Encouragement replaces the dialogue text without opening a separate card.
- The painted paper occupies 32.6% of the rendered scene width and begins at 34.7% of its height. DOM content uses those same normalized coordinates.
- Foreground RGB must be copied from the decoded background asset; generated extraction may supply only the alpha-mask draft. Never use a separately rendered leaf.
- Desktop opens with the cat's handwritten consultation note and illustration in one view, followed immediately by the first question.
- The full cat illustration appears only for the introduction. Question, report, safety, and seven-day states collapse it so the current task becomes the visual focus.
- Mobile prioritizes the message, privacy note, progress, and question; the decorative cat image is intentionally removed.
- Question choices remain clear paper tiles in a three-column desktop grid and a single mobile column.
- Results remain recognizably paper notes, but safety information stays plain, calm, and unplayful.

## Typography And Motion

- `Gaegu` is reserved for the Latin wordmark; the supplied `PingFang XingChen` face appears only in the cat's spoken dialogue; Chinese system sans supplies page titles, reading text, and UI controls.
- Interactions use only short, tactile lifts and state color changes. Reduced motion turns those off.

## Accessibility

- Keyboard focus has a visible peach ring.
- Text does not depend on the character or color alone to convey safety guidance.
- Controls maintain fixed dimensions across their interaction states.
