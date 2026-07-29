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
(`index.html`, `dm/index.html`) pick the connection automatically:
- Served over **http** → connects directly to `ws://<host>:8181`.
- Served over **https** → connects to `wss://<host>/dnd-sync` instead,
  reverse-proxied through your existing web server so it can reuse its TLS
  cert (see "HTTPS sites" below) rather than needing its own.
- Opened via `file://` → sync stays same-device-only, no connection
  attempted at all.

If you want a different port, change `PORT` below and update the `:8181`
in both HTML files' inline `<script>` block to match.

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

**If your site is plain http**, the browser connects to port 8181 directly,
so it needs to be reachable from the outside — open it in your Linode's
firewall / cloud firewall rules:
```bash
sudo ufw allow 8181/tcp
```

**If your site is https** (see below), the browser never talks to 8181
directly — only your web server does, over localhost — so you can skip the
firewall rule above entirely (or remove it if you'd already added it) and
keep 8181 unreachable from the outside world. More secure, and one less
moving part.

### HTTPS sites

Browsers refuse to open a plain `ws://` connection from a secure (`https://`)
page — it has to be `wss://`. Rather than managing a separate TLS
certificate just for this port, reverse-proxy it through the web server
you're already using for the site, reusing the cert it already has.

**Apache** — inside the existing `<VirtualHost *:443>` block for your
domain (the one with `SSLCertificateFile` already configured), add:
```apache
ProxyPass /dnd-sync ws://127.0.0.1:8181/
ProxyPassReverse /dnd-sync ws://127.0.0.1:8181/
```
then enable the WebSocket proxy module (separate from the regular proxy
modules you may already have enabled for other sites) and reload:
```bash
sudo a2enmod proxy proxy_http proxy_wstunnel
sudo apache2ctl configtest && sudo systemctl reload apache2
```

**Nginx** — inside the existing `server { listen 443 ssl; ... }` block:
```nginx
location /dnd-sync {
    proxy_pass http://127.0.0.1:8181;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```
then `sudo nginx -t && sudo systemctl reload nginx`.

Either way, no client-side changes are needed — `index.html`/`dm/index.html`
already request `wss://<host>/dnd-sync` automatically whenever the page
itself is loaded over https.

## What it stores

Just the single shared reveal-state blob (which rooms/corridors are
revealed, current map, fog color, custom regions) in `state.json` next to
the server so a restart doesn't wipe your progress. No player data, no
accounts, nothing else.
