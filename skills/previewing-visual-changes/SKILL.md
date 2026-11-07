---
name: previewing-visual-changes
description: Use when your human partner asks to change how an existing screen, page or interface looks - colors, theme, layout, typography, spacing, animation - before editing any source file; shows visibly different options as previews and implements only the one they pick
---

# Previewing Visual Changes

## Overview

People judge appearance by eye. A visual change made straight in the code gets judged after the fact, and a subtle one gets judged as "nothing changed". Showing options first turns one guess into a choice.

**Core principle:** No source file changes until your human partner has seen the options and picked one.

## The Iron Law

```
NO VISUAL CHANGE TO SOURCE BEFORE YOUR HUMAN PARTNER PICKS A PREVIEW
```

A request that names the exact result ("make the button #6366f1") is already a pick: implement it, then show a before/after.

## The Steps

1. **Look at what exists.** Read the styles and markup involved. Capture the current state as the "before" (screenshot if you can, otherwise note it).
2. **Make two to four options that differ visibly.** Different directions, not one or two shades apart. Name each by what it is ("Indigo, rounded, soft shadow"), not "Option 1".
3. **Build the previews without touching source:**
   - Running app and a browser tool (Playwright or similar): inject each option's CSS into the real page and screenshot it. Record a short GIF when the change moves.
   - Otherwise: copy the page into a preview folder, add each option's overrides, and render or open it.
   - Put previews in `.lib-builder/previews/<topic>/` (add it to `.gitignore`) or wherever your human partner's instructions say.
   - Previews are local files. Don't publish them to an outside service (hosted pages, artifacts, pastebins) unless your human partner asks: that shares their unreleased work.
4. **Show them.** Use the brainstorming visual companion if it is running, or give the image or HTML paths and open them in the way your partner prefers. List what each option changes in one line.
5. **Ask which one,** then stop and wait. Tweaks come one change per round: "make it darker" gets a new preview, not an edit to source.
6. **Implement only the pick,** exactly as previewed. Then show the real result next to the chosen preview so they can confirm it matches.
7. **Offer to delete the preview folder** once they're happy.

## Red Flags

| Thought | Reality |
|---------|---------|
| "It's just a color, I'll change it and show them" | That is the change this skill exists for. Preview first. |
| "I'll describe the options in text" | They decide by eye. Show pictures. |
| "I'll publish the previews so they can open them" | Local files first. Publishing shares their work; ask. |
| "A slightly different shade is a second option" | If they can't tell options apart at a glance, it isn't a choice. |
| "I'll edit the CSS and revert if they don't like it" | Editing source first is exactly what the gate forbids. |
| "They said 'more modern', so I know what they want" | "Modern" has many looks. That's why there are options. |
| "One more tweak straight in the code" | Every tweak is a new preview until they say implement. |
