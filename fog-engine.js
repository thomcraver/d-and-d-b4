// Shared engine for the B3 Map Reveal tool: state storage, sync, rendering.
// Loaded as a plain script (no ES modules) so it works over file:// with zero
// server setup. Exposes window.FogApp.

(function () {
  const STORAGE_KEY = "dnd-fog-state-v2";
  const CHANNEL_NAME = "dnd-fog-sync-v2";

  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  function defaultState() {
    return {
      activeMap: "level1",
      fogColor: "#000000",
      dimUnrevealed: true,
      perMap: {}
    };
  }

  function emptyMapState() {
    return { revealed: {}, secretsRevealed: {}, customRegions: [], overrides: {}, deleted: {} };
  }

  const Store = {
    state: null,

    load() {
      let s = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) s = JSON.parse(raw);
      } catch (e) { console.warn("state load failed", e); }
      if (!s) s = defaultState();
      if (!s.perMap) s.perMap = {};
      for (const id of Object.keys(DND_MAPS)) {
        if (!s.perMap[id]) s.perMap[id] = emptyMapState();
        else {
          const m = s.perMap[id];
          m.revealed = m.revealed || {};
          m.secretsRevealed = m.secretsRevealed || {};
          m.customRegions = m.customRegions || [];
          m.overrides = m.overrides || {};
          m.deleted = m.deleted || {};
        }
      }
      if (s.dimUnrevealed === undefined) s.dimUnrevealed = true;
      this.state = s;
      return s;
    },

    save(broadcast = true) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      if (broadcast) Sync.broadcast(this.state);
    },

    getMapState(mapId) {
      return this.state.perMap[mapId];
    },

    // Merge base data.js regions with DM custom regions / overrides / deletions.
    getRegions(mapId) {
      const def = DND_MAPS[mapId];
      const ms = this.getMapState(mapId);
      const base = def.rooms.map(r => ({ ...r }));
      const secrets = (def.secretFeatures || []).map(f => ({ ...f, secret: true, isFeature: true }));
      let all = base.concat(secrets);
      all = all.filter(r => !ms.deleted[r.id]);
      all = all.map(r => ms.overrides[r.id] ? { ...r, points: ms.overrides[r.id] } : r);
      all = all.concat(ms.customRegions.map(r => ({ ...r })));
      return all;
    },

    isRevealed(mapId, region) {
      const ms = this.getMapState(mapId);
      return region.secret ? !!ms.secretsRevealed[region.id] : !!ms.revealed[region.id];
    },

    setRevealed(mapId, region, value) {
      const ms = this.getMapState(mapId);
      const bucket = region.secret ? ms.secretsRevealed : ms.revealed;
      if (value) bucket[region.id] = true; else delete bucket[region.id];
    },

    addCustomRegion(mapId, region) {
      this.getMapState(mapId).customRegions.push(region);
    },

    deleteRegion(mapId, region) {
      const ms = this.getMapState(mapId);
      if (region.isCustom || ms.customRegions.some(r => r.id === region.id)) {
        ms.customRegions = ms.customRegions.filter(r => r.id !== region.id);
      } else {
        ms.deleted[region.id] = true;
      }
      delete ms.revealed[region.id];
      delete ms.secretsRevealed[region.id];
    },

    setRegionPoints(mapId, region, points) {
      const ms = this.getMapState(mapId);
      if (ms.customRegions.some(r => r.id === region.id)) {
        ms.customRegions = ms.customRegions.map(r => r.id === region.id ? { ...r, points } : r);
      } else {
        ms.overrides[region.id] = points;
      }
    },

    resetMap(mapId) {
      this.state.perMap[mapId] = emptyMapState();
    },

    exportJSON() {
      return JSON.stringify(this.state, null, 2);
    },

    importJSON(json) {
      const parsed = JSON.parse(json);
      this.state = parsed;
      this.load(); // normalize / fill gaps
    }
  };

  const Sync = {
    channel: null,
    listeners: [],
    statusListeners: [],
    ws: null,
    wsUrl: null,
    wsStatus: "disabled", // disabled | connecting | connected | offline
    wsReconnectDelay: 1000,
    suppressWsEcho: false,

    init() {
      if ("BroadcastChannel" in window) {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (ev) => this.listeners.forEach(fn => fn(ev.data));
      }
      window.addEventListener("storage", (ev) => {
        if (ev.key === STORAGE_KEY && ev.newValue) {
          try { this.listeners.forEach(fn => fn(JSON.parse(ev.newValue))); } catch (e) {}
        }
      });

      // Optional live cross-device sync: set window.DND_SYNC_WS_URL (e.g. in
      // index.html / dm/index.html) to a ws:// or wss:// URL to enable it.
      // Without it, sync stays same-device-only (BroadcastChannel/localStorage),
      // which is all file:// usage can support anyway.
      if (window.DND_SYNC_WS_URL) {
        this.wsUrl = window.DND_SYNC_WS_URL;
        this._connectWs();
      }
    },

    _setStatus(status) {
      this.wsStatus = status;
      this.statusListeners.forEach(fn => fn(status));
    },

    _connectWs() {
      this._setStatus("connecting");
      let ws;
      try {
        ws = new WebSocket(this.wsUrl);
      } catch (e) {
        this._setStatus("offline");
        this._scheduleReconnect();
        return;
      }
      this.ws = ws;

      ws.onopen = () => {
        this._setStatus("connected");
        this.wsReconnectDelay = 1000;
      };
      ws.onmessage = (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch (e) { return; }
        if (msg.type === "state" && msg.state) {
          this.listeners.forEach(fn => fn(msg.state));
        }
      };
      ws.onclose = () => {
        this._setStatus("offline");
        this._scheduleReconnect();
      };
      ws.onerror = () => { try { ws.close(); } catch (e) {} };
    },

    _scheduleReconnect() {
      setTimeout(() => this._connectWs(), this.wsReconnectDelay);
      this.wsReconnectDelay = Math.min(this.wsReconnectDelay * 1.6, 15000);
    },

    onStatus(fn) { this.statusListeners.push(fn); fn(this.wsStatus); },

    broadcast(state) {
      if (this.channel) this.channel.postMessage(deepClone(state));
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "state", state: deepClone(state) }));
      }
    },
    onUpdate(fn) { this.listeners.push(fn); }
  };
  Sync.init();

  function pointInPolygon(px, py, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i][0], yi = points[i][1];
      const xj = points[j][0], yj = points[j][1];
      const intersect = ((yi > py) !== (yj > py)) &&
        (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function polygonBounds(points) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of points) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    return { minX, minY, maxX, maxY };
  }

  // ---- Renderer: handles image, fog, zoom/pan, and (optionally) DM overlays ----
  class MapView {
    constructor(container, opts) {
      this.container = container;
      this.opts = Object.assign({
        dmMode: false,
        fogColor: "#000000",
        dimUnrevealed: true,
        onRegionClick: null
      }, opts || {});

      this.stage = document.createElement("div");
      this.stage.className = "fog-stage";
      this.canvas = document.createElement("canvas");
      this.stage.appendChild(this.canvas);
      this.container.appendChild(this.stage);
      this.ctx = this.canvas.getContext("2d");

      this.image = new Image();
      this.imageLoaded = false;
      this.mapDef = null;
      this.regions = [];

      this.zoom = 1;
      this.panX = 0;
      this.panY = 0;

      this.editMode = null; // null | 'draw' | 'move'
      this.drawPoints = [];
      this.editingRegion = null;
      this.dragVertexIndex = -1;
      this.dragMoveStart = null;

      this._bindEvents();
    }

    setMap(mapId) {
      this.mapDef = DND_MAPS[mapId];
      this.imageLoaded = false;
      this.image = new Image();
      this.image.onload = () => {
        this.imageLoaded = true;
        this.canvas.width = this.mapDef.width;
        this.canvas.height = this.mapDef.height;
        this.fitToContainer();
        this.render();
      };
      this.image.src = (window.DND_ASSET_BASE || "") + this.mapDef.image;
      this.cancelDraw();
      this.editingRegion = null;
    }

    setRegions(regions) { this.regions = regions; this.render(); }
    setRevealedTest(fn) { this.isRevealed = fn; this.render(); }

    fitToContainer() {
      const cw = this.container.clientWidth || 800;
      const ch = this.container.clientHeight || 600;
      const scale = Math.min(cw / this.mapDef.width, ch / this.mapDef.height) * 0.96;
      this.zoom = Math.max(scale, 0.05);
      this.panX = (cw - this.mapDef.width * this.zoom) / 2;
      this.panY = (ch - this.mapDef.height * this.zoom) / 2;
      this.applyTransform();
    }

    applyTransform() {
      this.stage.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    }

    zoomBy(factor, cx, cy) {
      const rect = this.container.getBoundingClientRect();
      const mx = cx !== undefined ? cx - rect.left : this.container.clientWidth / 2;
      const my = cy !== undefined ? cy - rect.top : this.container.clientHeight / 2;
      const stageX = (mx - this.panX) / this.zoom;
      const stageY = (my - this.panY) / this.zoom;
      this.zoom = Math.min(Math.max(this.zoom * factor, 0.08), 6);
      this.panX = mx - stageX * this.zoom;
      this.panY = my - stageY * this.zoom;
      this.applyTransform();
    }

    _bindEvents() {
      this.container.addEventListener("wheel", (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.12 : 0.89;
        this.zoomBy(factor, e.clientX, e.clientY);
      }, { passive: false });

      let panning = false, lastX = 0, lastY = 0;
      this.container.addEventListener("mousedown", (e) => {
        if (e.button === 2 || (e.button === 0 && this._panModeActive)) {
          panning = true; lastX = e.clientX; lastY = e.clientY;
          e.preventDefault();
          return;
        }
        this._handlePointerDown(e);
      });
      window.addEventListener("mousemove", (e) => {
        if (panning) {
          this.panX += (e.clientX - lastX);
          this.panY += (e.clientY - lastY);
          lastX = e.clientX; lastY = e.clientY;
          this.applyTransform();
        } else {
          this._handlePointerMove(e);
        }
      });
      window.addEventListener("mouseup", (e) => {
        panning = false;
        this._handlePointerUp(e);
      });
      this.container.addEventListener("contextmenu", (e) => e.preventDefault());
    }

    setPanMode(active) { this._panModeActive = active; }

    _toCanvasCoords(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width * this.canvas.width;
      const y = (e.clientY - rect.top) / rect.height * this.canvas.height;
      return [x, y];
    }

    _handlePointerDown(e) {
      const [x, y] = this._toCanvasCoords(e);

      if (this.editMode === "draw") {
        this.drawPoints.push([x, y]);
        this.render();
        return;
      }

      if (this.editMode === "reshape" && this.editingRegion) {
        const pts = this.editingRegion.points;
        const hitR = 10 / this.zoom;
        for (let i = 0; i < pts.length; i++) {
          const dx = pts[i][0] - x, dy = pts[i][1] - y;
          if (Math.sqrt(dx * dx + dy * dy) < hitR) {
            this.dragVertexIndex = i;
            return;
          }
        }
        if (pointInPolygon(x, y, pts)) {
          this.dragMoveStart = { x, y, orig: pts.map(p => [p[0], p[1]]) };
          return;
        }
        return;
      }

      // Normal click: hit-test regions (topmost/smallest first), fire callback.
      if (this.opts.onRegionClick && !this.editMode) {
        const hits = this.regions.filter(r => pointInPolygon(x, y, r.points));
        if (hits.length) {
          hits.sort((a, b) => this._area(a.points) - this._area(b.points));
          this.opts.onRegionClick(hits[0], e);
        }
      }
    }

    _handlePointerMove(e) {
      if (this.editMode !== "reshape" || !this.editingRegion) return;
      const [x, y] = this._toCanvasCoords(e);
      if (this.dragVertexIndex >= 0) {
        this.editingRegion.points[this.dragVertexIndex] = [x, y];
        this.render();
      } else if (this.dragMoveStart) {
        const dx = x - this.dragMoveStart.x, dy = y - this.dragMoveStart.y;
        this.editingRegion.points = this.dragMoveStart.orig.map(p => [p[0] + dx, p[1] + dy]);
        this.render();
      }
    }

    _handlePointerUp() {
      this.dragVertexIndex = -1;
      this.dragMoveStart = null;
    }

    _area(points) {
      const b = polygonBounds(points);
      return (b.maxX - b.minX) * (b.maxY - b.minY);
    }

    startDraw() { this.editMode = "draw"; this.drawPoints = []; this.render(); }
    cancelDraw() { this.editMode = null; this.drawPoints = []; this.render(); }
    finishDraw() {
      const pts = this.drawPoints;
      this.editMode = null;
      this.drawPoints = [];
      if (pts.length < 3) return null;
      return pts;
    }
    quickRectFromLastTwo() {
      // Convenience: if exactly 2 points were placed, treat as rectangle corners.
      if (this.drawPoints.length === 2) {
        const [[x1, y1], [x2, y2]] = this.drawPoints;
        return [[x1, y1], [x2, y1], [x2, y2], [x1, y2]];
      }
      return null;
    }

    startReshape(region) { this.editMode = "reshape"; this.editingRegion = region; this.render(); }
    stopReshape() { this.editMode = null; this.editingRegion = null; this.render(); }

    render() {
      const ctx = this.ctx;
      const w = this.canvas.width, h = this.canvas.height;
      ctx.clearRect(0, 0, w, h);
      if (this.imageLoaded) ctx.drawImage(this.image, 0, 0, w, h);

      const revealedFn = this.isRevealed || (() => false);
      const fog = this.opts.fogColor || "#000000";

      if (!this.opts.dmMode) {
        // Player view: the ENTIRE map is fogged except revealed regions.
        // Built on a separate offscreen layer so punching holes doesn't erase
        // the map image that's already been drawn onto the main canvas.
        if (!this._fogLayer || this._fogLayer.width !== w || this._fogLayer.height !== h) {
          this._fogLayer = document.createElement("canvas");
          this._fogLayer.width = w; this._fogLayer.height = h;
        }
        const fctx = this._fogLayer.getContext("2d");
        fctx.clearRect(0, 0, w, h);
        fctx.globalCompositeOperation = "source-over";
        fctx.fillStyle = fog;
        fctx.fillRect(0, 0, w, h);
        fctx.globalCompositeOperation = "destination-out";
        for (const region of this.regions) {
          if (revealedFn(region)) this._fillPoly(fctx, region.points, 1);
        }
        ctx.drawImage(this._fogLayer, 0, 0);
      }

      if (this.opts.dmMode) {
        // DM always sees the full map; unrevealed rooms just get a dim tint
        // + outline so they know what players can't see yet.
        ctx.save();
        for (const region of this.regions) {
          const revealed = revealedFn(region);
          const b = polygonBounds(region.points);
          if (!revealed) {
            ctx.globalAlpha = this.opts.dimUnrevealed ? 0.5 : 0.12;
            ctx.fillStyle = region.secret ? "#3b0764" : "#0b1a2e";
            this._fillPoly(ctx, region.points, 1);
          }
          ctx.globalAlpha = 1;
          ctx.strokeStyle = region.secret ? "#c084fc" : (revealed ? "#facc15" : "#7dd3fc");
          ctx.lineWidth = Math.max(1.5, 2 / this.zoom);
          this._strokePoly(ctx, region.points);

          if (region.kind !== "corridor" && (region.number || region.label)) {
            const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2;
            const fontSize = Math.max(14, Math.min(26, (b.maxX - b.minX) / 3));
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = region.secret ? "#e9d5ff" : "#ffffff";
            ctx.lineWidth = 3;
            ctx.strokeStyle = "rgba(0,0,0,0.85)";
            const label = region.number || "?";
            ctx.strokeText(label, cx, cy);
            ctx.fillText(label, cx, cy);
          }
        }
        ctx.restore();
      }

      // Draw in-progress polygon while drawing.
      if (this.editMode === "draw" && this.drawPoints.length) {
        ctx.save();
        ctx.strokeStyle = "#22d3ee";
        ctx.fillStyle = "rgba(34,211,238,0.25)";
        ctx.lineWidth = 2 / this.zoom;
        ctx.beginPath();
        this.drawPoints.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
        ctx.stroke();
        if (this.drawPoints.length > 2) { ctx.closePath(); ctx.fill(); }
        for (const [x, y] of this.drawPoints) {
          ctx.beginPath();
          ctx.arc(x, y, 6 / this.zoom, 0, Math.PI * 2);
          ctx.fillStyle = "#22d3ee";
          ctx.fill();
        }
        ctx.restore();
      }

      // Draw reshape handles.
      if (this.editMode === "reshape" && this.editingRegion) {
        ctx.save();
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 2 / this.zoom;
        this._strokePoly(ctx, this.editingRegion.points);
        for (const [x, y] of this.editingRegion.points) {
          ctx.beginPath();
          ctx.arc(x, y, 7 / this.zoom, 0, Math.PI * 2);
          ctx.fillStyle = "#facc15";
          ctx.fill();
          ctx.strokeStyle = "#000";
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    _fillPoly(ctx, points) {
      ctx.beginPath();
      points.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
      ctx.closePath();
      ctx.fill();
    }
    _strokePoly(ctx, points) {
      ctx.beginPath();
      points.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
      ctx.closePath();
      ctx.stroke();
    }
  }

  window.FogApp = { Store, Sync, MapView, pointInPolygon, polygonBounds };
})();
