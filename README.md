# B3 — Palace of the Silver Princess: Map Reveal Tool

A fog-of-war map viewer for running the *B3: Palace of the Silver Princess*
module (green cover edition). It uses the actual scanned dungeon maps from
the module and lets you, the DM, click rooms to reveal them to your players
as they explore — nothing else, no server, no build step.

## Quick start

1. Open `index.html` in a browser (double-click it, or serve the folder
   with any static file server — both work).
2. Click **Open Player View**. Drag that window to your TV/second monitor
   and click its **Fullscreen** button.
3. As the party explores, click rooms directly on the map (or in the
   sidebar list) to reveal them on the player screen. Click again to hide.

Your reveal progress is saved automatically in the browser (`localStorage`),
so closing and reopening `index.html` picks up right where you left off.

## How it matches the way the module actually plays

- Clicking a room reveals exactly that room's shape from the real map —
  its walls, its doors, its portcullises, whatever's drawn there — nothing
  about neighboring rooms.
- **Secret doors and secret rooms are a separate layer.** They're listed
  under "Secret doors / features" in the sidebar and never appear just
  because the room they're attached to is revealed. Reveal a secret only
  once the players actually find it (e.g. Room 1's secret door to Room 4,
  or Room 59's secret door to the Secret Closet, Room 60).
- The DM console always shows you the *entire* map (dimmed where players
  haven't been), so you never lose track of the dungeon. The Player View
  only ever shows revealed regions — everything else is solid fog.

## Adding or fixing rooms

The room outlines were traced by hand from the scanned module maps and are
close but not pixel-perfect. To fix one:

- Click the pencil icon (✎) next to a room in the sidebar, drag its yellow
  corner handles (or drag inside it to move the whole shape), then click
  **Done reshaping**.
- To add a room/corridor that isn't mapped yet, click **+ New room**, click
  points on the map to trace its outline (or just click two opposite
  corners for a quick rectangle), then **Finish** and give it a
  number/label.
- **+ New secret door** works the same way but adds it to the hidden
  layer instead.
- ✕ deletes a room from the list.

## Other controls

- **Scroll wheel** zooms in/out on the cursor. **Pan** button (or
  right-click drag) lets you drag the map around.
- **Fog color** (DM console, top bar) — black, white, or midnight blue —
  affects both DM and Player views for contrast/accessibility.
- **Reveal all rooms / Hide all rooms** — bulk actions; secrets are never
  touched by these.
- **Export/Import JSON** — back up or transfer your reveal progress and
  any custom rooms you've added.
- **Reset this map** — wipes reveal progress and custom rooms for the
  currently selected level only.

## Files

- `index.html` / `app-dm.js` — DM console (the one you drive).
- `player.html` / `app-player.js` — Player-facing display window; stays in
  sync with the DM console live via `BroadcastChannel` (same browser,
  different window/tab — e.g. one window on your laptop, one dragged to a
  TV or projector).
- `data.js` — room geometry for both dungeon levels, sourced from the
  module's own maps.
- `fog-engine.js` — shared rendering/state engine used by both pages.
- `maps/level1.png`, `maps/level2.png` — the actual "First Level
  (Entrance)" and "Second Level (Upper)" maps from the module.
