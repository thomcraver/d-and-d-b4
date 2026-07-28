# B3 — Palace of the Silver Princess: Map Reveal Tool

A fog-of-war map viewer for running the *B3: Palace of the Silver Princess*
module (green cover edition). It uses the actual scanned dungeon maps from
the module and lets you, the DM, click rooms and corridors to reveal them
to your players as they explore.

## Folder layout

- Repo root (`index.html`) — the **player-facing display**. This is what
  you hand out, e.g. `yoursite.com/dnd` if you clone this repo into a
  folder named `dnd` on your server.
- `/dm/` — the **DM console**. Keep this to yourself, e.g.
  `yoursite.com/dnd/dm`. Security here is "obscurity" — there's no login —
  so don't rely on it being private if that matters to you.
- `data.js`, `fog-engine.js`, `styles.css`, `maps/` — shared assets used by
  both entry points.
- `sync-server/` — optional live cross-device sync server, see below.

## Quick start (no server, single device)

1. Open `dm/index.html` directly in a browser (double-click it — no
   install, no build step).
2. Click **Open Player View**, drag that window to your TV/second monitor,
   click its **Fullscreen** button.
3. As the party explores, click rooms **and hallways** directly on the map
   (or in the sidebar list) to reveal them. Click again to hide.

This works with zero setup because the DM console and Player View sync via
the browser's own `BroadcastChannel`/`localStorage` — but that only works
between windows in **the same browser on the same device**. If you're
projecting from your own laptop to a TV, this is all you need.

## Cross-device sync (phones, multiple players' own devices)

If players load the Player View on their *own* phones/tablets rather than
watching a single shared screen, the setup above **will not work** —
`BroadcastChannel`/`localStorage` cannot reach a different physical
device, so their screen would just stay blank no matter what you reveal.
For that, run the small relay server in `sync-server/` (needs Node.js on
whatever's hosting the site) — see `sync-server/README.md` for setup. Once
it's running, every device (DM console, TV, and every player's phone) shows
a live "Sync: live ●" badge in the header and updates instantly. Without
it, everything still works for the single-shared-screen setup above; the
badge will just read "Sync: local only".

## How it matches the way the module actually plays

- Clicking a room or corridor segment reveals exactly that shape from the
  real map — walls, doors, portcullises, whatever's drawn there — nothing
  about neighboring spaces.
- **Corridors are chunked into roughly 30-foot (3-square) pieces**, not
  one giant hallway. A random encounter partway down a long corridor only
  lights up the stretch the party is actually standing in. Staircases are
  their own atomic piece, so a chunk boundary never cuts through the
  middle of one.
- **Secret doors and traps are a separate hidden layer**, listed under
  "Secrets / traps" in the sidebar. They never appear just because the
  room or corridor around them is revealed — you reveal them independently,
  once the players actually find/spring them (e.g. Room 1's secret door to
  Room 4, Room 27's pit trap, Room 59's secret door to the Secret Closet).
- The **DM console** (`/dm/`) always shows you the *entire* map, dimmed
  where players haven't been, so you never lose track of the dungeon.
- The **Player View** (repo root) is fully opaque outside revealed areas —
  solid fog color, no outlines, no numbers, no hint of what's underneath.

## Adding or fixing rooms

Room shapes were traced by hand from the scanned module maps; corridor
segments were computer-generated from the uncovered floor space between
rooms. Both are close but not pixel-perfect. To fix one:

- Click the pencil icon (✎) next to a room in the sidebar, drag its yellow
  corner handles (or drag inside it to move the whole shape), then click
  **Done reshaping**.
- To add a room/corridor that isn't mapped yet, click **+ New room**, click
  points on the map to trace its outline (or just click two opposite
  corners for a quick rectangle), then **Finish** and give it a
  number/label.
- **+ New secret/trap** works the same way but adds it to the hidden layer
  instead — use this for anything that shouldn't show up just because the
  surrounding room is revealed (secret doors, trap doors, pits, archer
  bushes/vampire roses, etc.).
- ✕ deletes a room from the list.

Corridor segments aren't listed individually in the sidebar (there are a
few hundred across both levels) — click directly on the map to work with
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

- `index.html` / `app-player.js` — Player-facing display (repo root).
- `dm/index.html` / `dm/app-dm.js` — DM console.
- `data.js` — room and corridor geometry for both dungeon levels, sourced
  from the module's own maps.
- `fog-engine.js` — shared rendering/state engine used by both pages,
  including the sync layer (same-device `BroadcastChannel`/`localStorage`
  always; cross-device WebSocket when `sync-server/` is running).
- `maps/level1.png`, `maps/level2.png` — the actual "First Level
  (Entrance)" and "Second Level (Upper)" maps from the module.
- `sync-server/` — optional Node.js relay for cross-device live sync.
