# Live sync server (optional)

Without this, the DM console and Player View only sync between windows in
the *same browser on the same device* — fine for testing two tabs on your
own laptop, but a phone loading the site is a different device with its
own private storage, so it never sees your reveals. This tiny server
fixes that: every device opens a WebSocket connection to it, and it relays
state to all of them the instant the DM changes something.

You do **not** need this for local/offline use (double-clicking `index.html`
or `dm/index.html` directly still works exactly as before — same-device
sync via `BroadcastChannel`/`localStorage` keeps working regardless). This
is only needed once you're serving the app to *other people's devices*.

## Setup

```bash
cd sync-server
npm install
node server.js
```

By default it listens on port **8181** on all interfaces. The client pages
(`index.html`, `dm/index.html`) auto-connect to
`ws://<whatever host you loaded the page from>:8181` whenever they're
served over http/https (this is skipped entirely for `file://` use). If you
want a different port, change `PORT` below and also update the `:8181` in
both HTML files' inline `<script>` block.

### Keep it running

This needs to stay running in the background. Options:

**pm2** (recommended, restarts automatically on crash/reboot):
```bash
npm install -g pm2
pm2 start server.js --name dnd-sync
pm2 save
pm2 startup   # follow the printed instructions to survive reboots
```

**systemd**, if you'd rather not add pm2 — create
`/etc/systemd/system/dnd-sync.service`:
```ini
[Unit]
Description=B3 map reveal sync server
After=network.target

[Service]
WorkingDirectory=/path/to/d-and-d-b4/sync-server
ExecStart=/usr/bin/node server.js
Restart=always
Environment=PORT=8181

[Install]
WantedBy=multi-user.target
```
then `systemctl enable --now dnd-sync`.

### Firewall

The browser connects to this port directly (not proxied through your web
server), so it needs to be reachable: open port 8181 (or whatever you set
`PORT` to) in your Linode's firewall / cloud firewall rules, e.g.:
```bash
sudo ufw allow 8181/tcp
```

### HTTPS sites

If your site is served over `https://`, browsers require the WebSocket to
also be secure (`wss://`), which means this port needs a valid TLS
certificate too — either terminate TLS here directly, or reverse-proxy
`wss://yourdomain.com/dnd-sync` through Nginx/Apache to this process on
localhost and update the URL construction in `index.html`/`dm/index.html`
accordingly. Plain `http://` sites (like the current deployment) don't need
any of this — plain `ws://` works fine.

## What it stores

Just the single shared reveal-state blob (which rooms/corridors are
revealed, current map, fog color, custom regions) in `state.json` next to
the server so a restart doesn't wipe your progress. No player data, no
accounts, nothing else.
