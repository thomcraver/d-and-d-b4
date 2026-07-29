(function () {
  const { Store, MapView, Sync } = window.FogApp;
  Store.load();

  const mapSelect = document.getElementById("mapSelect");
  const stageWrap = document.getElementById("stageWrap");
  const roomList = document.getElementById("roomList");
  const statusBar = document.getElementById("statusBar");
  const fogColorSel = document.getElementById("fogColor");
  const drawForm = document.getElementById("drawForm");
  const finishDrawBtn = document.getElementById("finishDrawBtn");
  const cancelDrawBtn = document.getElementById("cancelDrawBtn");
  const panBtn = document.getElementById("panBtn");
  const syncStatusEl = document.getElementById("syncStatus");

  const SYNC_LABELS = {
    disabled: "Sync: local only",
    connecting: "Sync: connecting…",
    connected: "Sync: live ●",
    offline: "Sync: offline (retrying…)"
  };
  if (syncStatusEl) {
    Sync.onStatus((status) => {
      syncStatusEl.textContent = SYNC_LABELS[status] || status;
      syncStatusEl.style.color = status === "connected" ? "#34d399" : status === "offline" ? "#ef4444" : "";
    });
  }

  for (const id of Object.keys(DND_MAPS)) {
    const opt = document.createElement("option");
    opt.value = id; opt.textContent = DND_MAPS[id].name;
    mapSelect.appendChild(opt);
  }
  mapSelect.value = Store.state.activeMap;
  fogColorSel.value = Store.state.fogColor;

  const view = new MapView(stageWrap, {
    dmMode: true,
    fogColor: Store.state.fogColor,
    dimUnrevealed: Store.state.dimUnrevealed,
    onRegionClick: (region) => {
      if (pendingRegionForForm) return; // don't toggle while naming a new region
      const cur = Store.isRevealed(view.mapDef.id, region);
      Store.setRevealed(view.mapDef.id, region, !cur);
      Store.save();
      refreshAll();
      setStatus(`${!cur ? "Revealed" : "Hidden"}: ${region.number ? "Room " + region.number : region.label}`);
    }
  });
  view.isRevealed = (region) => Store.isRevealed(view.mapDef.id, region);

  let pendingRegionForForm = null;

  function loadMap(mapId) {
    Store.state.activeMap = mapId;
    Store.save(); // broadcast so player views switch maps immediately, same as any reveal click
    view.setMap(mapId);
    const check = () => {
      if (!view.imageLoaded) { requestAnimationFrame(check); return; }
      refreshAll();
    };
    check();
  }

  function refreshAll() {
    const regions = Store.getRegions(view.mapDef.id);
    view.setRegions(regions);
    renderRoomList(regions);
  }

  function setStatus(msg) { statusBar.textContent = msg; }

  function renderRoomList(regions) {
    roomList.innerHTML = "";
    const rooms = regions.filter(r => !r.secret && r.kind !== "corridor")
      .sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0));
    const corridors = regions.filter(r => !r.secret && r.kind === "corridor");
    const secrets = regions.filter(r => r.secret);

    const addHeading = (text) => {
      const h = document.createElement("div");
      h.className = "hint";
      h.style.padding = "0.5rem 0.8rem 0.2rem";
      h.style.textTransform = "uppercase";
      h.style.letterSpacing = "0.06em";
      h.textContent = text;
      roomList.appendChild(h);
    };

    addHeading(`Rooms (${rooms.length})`);
    rooms.forEach(r => roomList.appendChild(buildRoomItem(r)));

    addHeading(`Secrets / traps (${secrets.length})`);
    secrets.forEach(r => roomList.appendChild(buildRoomItem(r)));

    const revealedCorridors = corridors.filter(r => Store.isRevealed(view.mapDef.id, r)).length;
    const note = document.createElement("div");
    note.className = "hint";
    note.style.padding = "0.6rem 0.8rem";
    note.textContent = `${corridors.length} corridor segments (${revealedCorridors} revealed) — click hallways directly on the map to reveal them; they're not listed individually here.`;
    roomList.appendChild(note);
  }

  function buildRoomItem(region) {
    const mapId = view.mapDef.id;
    const revealed = Store.isRevealed(mapId, region);
    const div = document.createElement("div");
    div.className = "room-item" + (region.secret ? " secret" : "") + (revealed ? " revealed" : "");

    const num = document.createElement("div");
    num.className = "num";
    num.textContent = region.number || "?";
    div.appendChild(num);

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = region.label || "";
    div.appendChild(label);

    const actions = document.createElement("div");
    actions.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "✎";
    editBtn.title = "Reshape on map";
    editBtn.onclick = (e) => {
      e.stopPropagation();
      startReshapeFlow(region);
    };
    actions.appendChild(editBtn);

    const delBtn = document.createElement("button");
    delBtn.textContent = "✕";
    delBtn.title = "Delete";
    delBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`Delete "${region.label || region.number}"?`)) {
        Store.deleteRegion(mapId, region);
        Store.save();
        refreshAll();
      }
    };
    actions.appendChild(delBtn);

    div.appendChild(actions);

    div.onclick = () => {
      const cur = Store.isRevealed(mapId, region);
      Store.setRevealed(mapId, region, !cur);
      Store.save();
      refreshAll();
    };

    return div;
  }

  function startReshapeFlow(region) {
    const liveRegion = view.regions.find(r => r.id === region.id);
    view.startReshape(liveRegion);
    setStatus(`Reshaping "${region.label || region.number}" — drag the yellow handles, drag inside to move the whole shape.`);
    showFloatingDone(() => {
      Store.setRegionPoints(view.mapDef.id, liveRegion, liveRegion.points);
      Store.save();
      view.stopReshape();
      refreshAll();
      setStatus("Shape saved.");
    });
  }

  let floatingDoneEl = null;
  function showFloatingDone(onDone) {
    if (floatingDoneEl) floatingDoneEl.remove();
    floatingDoneEl = document.createElement("button");
    floatingDoneEl.textContent = "Done reshaping";
    floatingDoneEl.className = "primary";
    Object.assign(floatingDoneEl.style, { position: "absolute", top: "1rem", left: "1rem", zIndex: 10 });
    floatingDoneEl.onclick = () => { onDone(); floatingDoneEl.remove(); floatingDoneEl = null; };
    stageWrap.appendChild(floatingDoneEl);
  }

  // ---- Drawing new regions ----
  let drawingSecret = false;

  document.getElementById("newRoomBtn").onclick = () => beginDraw(false);
  document.getElementById("newSecretBtn").onclick = () => beginDraw(true);

  function beginDraw(secret) {
    drawingSecret = secret;
    view.startDraw();
    finishDrawBtn.style.display = "";
    cancelDrawBtn.style.display = "";
    setStatus(secret
      ? "Click points to trace the secret/trap area, then Finish."
      : "Click points to trace the room/corridor outline (2 clicks = quick rectangle), then Finish.");
  }

  finishDrawBtn.onclick = () => finishDraw();
  cancelDrawBtn.onclick = () => {
    view.cancelDraw();
    finishDrawBtn.style.display = "none";
    cancelDrawBtn.style.display = "none";
    setStatus("Cancelled.");
  };

  window.addEventListener("keydown", (e) => {
    if (view.editMode === "draw") {
      if (e.key === "Enter") finishDraw();
      if (e.key === "Escape") cancelDrawBtn.onclick();
    }
  });

  function finishDraw() {
    let pts = view.quickRectFromLastTwo();
    if (!pts) pts = view.finishDraw();
    if (!pts) { setStatus("Need at least 2 clicks (rectangle) or 3+ (polygon)."); return; }
    view.editMode = null; view.drawPoints = []; view.render();
    finishDrawBtn.style.display = "none";
    cancelDrawBtn.style.display = "none";
    openNamingForm(pts, drawingSecret);
  }

  function openNamingForm(points, secret) {
    drawForm.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "editor-form";

    const numLabel = document.createElement("label");
    numLabel.textContent = secret ? "Feature name" : "Room/corridor number";
    const numInput = document.createElement("input");
    numInput.type = "text";
    numInput.placeholder = secret ? "e.g. Trap in Room 27" : "e.g. 12 or corridor-5-6";

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Label (optional)";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "e.g. Storeroom";

    const row = document.createElement("div");
    row.className = "row";
    const saveBtn = document.createElement("button");
    saveBtn.className = "primary";
    saveBtn.textContent = "Save";
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    row.appendChild(saveBtn); row.appendChild(cancelBtn);

    wrap.appendChild(numLabel); wrap.appendChild(numInput);
    wrap.appendChild(nameLabel); wrap.appendChild(nameInput);
    wrap.appendChild(row);
    drawForm.appendChild(wrap);
    numInput.focus();

    saveBtn.onclick = () => {
      const id = "custom-" + Date.now();
      const region = {
        id,
        number: secret ? "" : (numInput.value || "?"),
        label: secret ? (numInput.value || "Secret feature") : (nameInput.value || ""),
        points,
        secret,
        isCustom: true
      };
      Store.addCustomRegion(view.mapDef.id, region);
      Store.save();
      drawForm.innerHTML = "";
      refreshAll();
      setStatus(`Added "${region.label || region.number}".`);
    };
    cancelBtn.onclick = () => { drawForm.innerHTML = ""; setStatus("Cancelled."); };
  }

  // ---- Toolbar wiring ----
  document.getElementById("fitBtn").onclick = () => view.fitToContainer();
  document.getElementById("zoomIn").onclick = () => view.zoomBy(1.25);
  document.getElementById("zoomOut").onclick = () => view.zoomBy(0.8);

  let panActive = false;
  panBtn.onclick = () => {
    panActive = !panActive;
    view.setPanMode(panActive);
    panBtn.classList.toggle("active-toggle", panActive);
  };

  fogColorSel.onchange = () => {
    Store.state.fogColor = fogColorSel.value;
    view.opts.fogColor = fogColorSel.value;
    Store.save();
    view.render();
  };

  mapSelect.onchange = () => loadMap(mapSelect.value);

  document.getElementById("revealAllBtn").onclick = () => {
    const regions = Store.getRegions(view.mapDef.id).filter(r => !r.secret);
    regions.forEach(r => Store.setRevealed(view.mapDef.id, r, true));
    Store.save();
    refreshAll();
    setStatus("All rooms/corridors revealed (secrets/traps untouched).");
  };
  document.getElementById("hideAllBtn").onclick = () => {
    const regions = Store.getRegions(view.mapDef.id);
    regions.forEach(r => Store.setRevealed(view.mapDef.id, r, false));
    Store.save();
    refreshAll();
    setStatus("Map hidden.");
  };

  document.getElementById("resetMapBtn").onclick = () => {
    if (confirm("Reset all reveal progress and custom rooms for this map?")) {
      Store.resetMap(view.mapDef.id);
      Store.save();
      refreshAll();
      setStatus("Map reset.");
    }
  };

  document.getElementById("exportBtn").onclick = () => {
    const blob = new Blob([Store.exportJSON()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "silver-princess-map-state.json";
    a.click();
  };
  const importFile = document.getElementById("importFile");
  document.getElementById("importBtn").onclick = () => importFile.click();
  importFile.onchange = () => {
    const file = importFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        Store.importJSON(reader.result);
        Store.save();
        mapSelect.value = Store.state.activeMap;
        fogColorSel.value = Store.state.fogColor;
        loadMap(Store.state.activeMap);
        setStatus("Imported saved state.");
      } catch (e) {
        alert("Could not read that file: " + e.message);
      }
    };
    reader.readAsText(file);
  };

  document.getElementById("openPlayerBtn").onclick = () => {
    window.open("../index.html", "dnd-player-view", "width=1200,height=800");
    setStatus("Player view opened. Drag it to your TV/second monitor and press F11 there for fullscreen.");
  };

  window.addEventListener("resize", () => view.fitToContainer());

  loadMap(Store.state.activeMap);
})();
