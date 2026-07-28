(function () {
  const { Store, Sync, MapView } = window.FogApp;
  Store.load();

  const stageWrap = document.getElementById("stageWrap");
  const mapNameEl = document.getElementById("mapName");

  const view = new MapView(stageWrap, {
    dmMode: false,
    fogColor: Store.state.fogColor,
    onRegionClick: null // players don't interact
  });
  view.isRevealed = (region) => Store.isRevealed(view.mapDef.id, region);
  view.setPanMode(true); // players can drag to look around, never reveal anything

  function loadMap(mapId) {
    view.setMap(mapId);
    view.opts.fogColor = Store.state.fogColor;
    mapNameEl.textContent = "\u{1F5FA}️ " + (DND_MAPS[mapId] ? DND_MAPS[mapId].name : "Map");
    const check = () => {
      if (!view.imageLoaded) { requestAnimationFrame(check); return; }
      refresh();
    };
    check();
  }

  function refresh() {
    view.setRegions(Store.getRegions(view.mapDef.id));
  }

  Sync.onUpdate((state) => {
    const mapChanged = state.activeMap !== Store.state.activeMap;
    Store.state = state;
    view.opts.fogColor = state.fogColor;
    if (mapChanged) loadMap(state.activeMap);
    else refresh();
  });

  document.getElementById("fitBtn").onclick = () => view.fitToContainer();
  document.getElementById("zoomIn").onclick = () => view.zoomBy(1.25);
  document.getElementById("zoomOut").onclick = () => view.zoomBy(0.8);
  document.getElementById("fullscreenBtn").onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  };
  window.addEventListener("resize", () => view.fitToContainer());

  loadMap(Store.state.activeMap);
})();
