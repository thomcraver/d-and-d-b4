# B3 — Palace of the Silver Princess: Map Reveal Tool

A fog-of-war map viewer for running the *B3: Palace of the Silver Princess*
module (green cover edition). It uses the actual scanned dungeon maps from
the module and lets you, the DM, click rooms and corridors to reveal them
to your players as they explore — nothing else, no server, no build step.

## Folder layout

- `/dm/` — the DM console. Keep this to yourself.
- `/dnd/` — the player-facing display. This is the one you hand out, e.g.
  `yoursite.com/dnd`.
- `data.js`, `fog-engine.js`, `styles.css`, `maps/` — shared assets used by
  both, referenced via relative paths (`../`) from each subfolder.

If you clone this to a web server, `/dm/` and `/dnd/` work as clean URLs
(each folder has its own `index.html`). Security here is "obscurity" —
there's no login — so don't rely on `/dm/` being private if that matters
to you.

## Quick start

1. Open `dm/index.html` in a browser (double-click it, or serve the repo
   root with any static file server — both work, no build step).
2. Click **Open Player View**. Drag that window to your TV/second monitor
   and click its **Fullscreen** button. Or just send players to `/dnd/`
   on whatever's hosting this.
3. As the party explores, click rooms **and hallways** directly on the map
   (or in the sidebar list) to reveal them. Click again to hide.

Your reveal progress is saved automatically in the browser (`localStorage`),
so closing and reopening `dm/index.html` picks up right where you left off.

## How it matches the way the module actually plays

- Clicking a room or corridor segment reveals exactly that shape from the
  real map — walls, doors, portcullises, whatever's drawn there — nothing
  about neighboring spaces.
- **Corridors are chunked into roughly 30-foot (3-square) pieces**, not
  one giant hallway. A random encounter partway down a long corridor only
  lights up the stretch the party is actually standing in.
- **Secret doors and traps are a separate hidden layer**, listed under
  "Secrets / traps" in the sidebar. They never appear just because the
  room or corridor around them is revealed — you reveal them independently,
  once the players actually find/spring them (e.g. Room 1's secret door to
  Room 4, Room 27's pit trap, Room 59's secret door to the Secret Closet).
- The **DM console** (`/dm/`) always shows you the *entire* map, dimmed
  where players haven't been, so you never lose track of the dungeon.
- The **Player View** (`/dnd/`) is fully opaque outside revealed areas —
  solid fog color, no outlines, no numbers, no hint of what's underneath.

## Adding or fixing rooms

Room shapes were traced by hand from the scanned module maps; corridor
segments were auto-detected from the uncovered floor space between rooms.
Both are close but not pixel-perfect. To fix one:

- Click the pencil icon (✎) next to a room in the sidebar, drag its yellow
  corner handles (or drag inside it to move the whole shape), then click
  **Done reshaping**.
- To add a room/corridor that isn't mapped yet, click **+ New room**, click
  points on the map to trace its outline (or just click two opposite
  corners for a quick rectangle), then **Finish** and give it a
  number/label.
- **+ New secret/trap** works the same way but adds it to the hidden layer
  instead — use this for anything that shouldn't show up just because the
  surrounding room is revealed.
- ✕ deletes a room from the list.

Corridor segments aren't listed individually in the sidebar (there are
~180 of them across both levels) — click directly on the map to work with
them; the sidebar shows a running count instead.

## Other controls

- **Scroll wheel** zooms in/out on the cursor. **Pan** button (or
  right-click drag) lets you drag the map around.
- **Fog color** (DM console, top bar) — black, Map Blue, white, or
  midnight — affects both DM and Player views for contrast/accessibility.
- **Reveal all rooms / Hide all rooms** — bulk actions; secrets/traps are
  never touched by these.
- **Export/Import JSON** — back up or transfer your reveal progress and
  any custom rooms you've added.
- **Reset this map** — wipes reveal progress and custom rooms for the
  currently selected level only.

## Files

- `dm/index.html` / `dm/app-dm.js` — DM console.
- `dnd/index.html` / `dnd/app-player.js` — Player-facing display; stays in
  sync with the DM console live via `BroadcastChannel` (same browser,
  different window/tab — e.g. one window on your laptop, one dragged to a
  TV or projector).
- `data.js` — room and corridor geometry for both dungeon levels, sourced
  from the module's own maps.
- `fog-engine.js` — shared rendering/state engine used by both pages.
- `maps/level1.png`, `maps/level2.png` — the actual "First Level
  (Entrance)" and "Second Level (Upper)" maps from the module.
