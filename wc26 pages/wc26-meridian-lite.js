(() => {
  if (window.WC26Meridian) return;

  const STORAGE_PREFIX = 'WC26_MERIDIAN';
  const STATE_KEY = `${STORAGE_PREFIX}_STATE`;
  const SAVED_KEY = `${STORAGE_PREFIX}_SAVED_VIEWS`;
  const FOCUS_MATCH_KEY = `${STORAGE_PREFIX}_FOCUS_MATCH`;
  const FOCUS_TEAM_KEY = `${STORAGE_PREFIX}_FOCUS_TEAM`;
  const EVENT_PREFIX = 'wc26:';

  const safeParse = (value, fallback) => {
    if (value == null || value === '') return fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  const readJSON = (key, fallback) => safeParse(window.localStorage.getItem(key), fallback);
  const writeJSON = (key, value) => window.localStorage.setItem(key, JSON.stringify(value));

  const defaultView = {
    zoom: 0,
    layers: {
      drawer: true,
      pitchSummary: true,
      playerChips: true,
      playerNames: true,
      scoreBanner: true,
      narrative: true,
      matrix: true,
      visuals: true
    }
  };

  const currentView = () => {
    const saved = readJSON(STATE_KEY, null);
    const zoom = Number.isFinite(Number(saved?.zoom)) ? Number(saved.zoom) : defaultView.zoom;
    return {
      ...defaultView,
      ...(saved || {}),
      zoom,
      layers: { ...defaultView.layers, ...((saved && saved.layers) || {}) }
    };
  };

  const getViewState = () => currentView();

  const emit = (type, detail = {}) => {
    const payload = { type, detail, source: window.location.pathname, timestamp: Date.now() };
    window.dispatchEvent(new CustomEvent(`${EVENT_PREFIX}${type}`, { detail: payload }));
    if (type === 'focus-match') {
      window.dispatchEvent(new CustomEvent('wc26-focus-change', { detail: payload.detail }));
    }
    if (type === 'view') {
      window.dispatchEvent(new CustomEvent('wc26-view-change', { detail: payload.detail }));
    }
    return payload;
  };

  const on = (type, handler) => {
    const eventName = `${EVENT_PREFIX}${type}`;
    const wrapped = (event) => handler(event.detail);
    window.addEventListener(eventName, wrapped);
    return () => window.removeEventListener(eventName, wrapped);
  };

  const setView = (patch = {}) => {
    const view = currentView();
    const next = {
      ...view,
      ...patch,
      layers: { ...view.layers, ...((patch && patch.layers) || {}) }
    };
    writeJSON(STATE_KEY, next);
    emit('view', next);
    return next;
  };

  const setViewState = (nextView = {}) => setView(nextView);

  const setZoom = (zoom) => setView({ zoom });

  const toggleLayer = (layerName) => {
    const view = currentView();
    return setView({ layers: { [layerName]: !(view.layers && view.layers[layerName] === false) } });
  };

  const setLayer = (layerName, enabled) => setView({ layers: { [layerName]: !!enabled } });

  const applyView = (root, view = currentView()) => {
    if (!root) return view;
    root.dataset.wc26Zoom = view.zoom || defaultView.zoom;
    const scope = root.querySelectorAll ? root : document;
    scope.querySelectorAll('[data-wc26-layer]').forEach((node) => {
      const name = node.getAttribute('data-wc26-layer');
      const visible = view.layers[name] !== false;
      node.classList.toggle('wc26-layer-hidden', !visible);
    });
    return view;
  };

  const focusMatch = (match) => {
    writeJSON(FOCUS_MATCH_KEY, match || null);
    emit('focus-match', match || null);
    return match;
  };

  const focusTeam = (team) => {
    writeJSON(FOCUS_TEAM_KEY, team || null);
    emit('focus-team', team || null);
    return team;
  };

  const getFocusMatch = () => readJSON(FOCUS_MATCH_KEY, null);
  const getFocusTeam = () => readJSON(FOCUS_TEAM_KEY, null);

  const saveView = (name, snapshot) => {
    const saved = readJSON(SAVED_KEY, {});
    saved[name] = {
      name,
      snapshot,
      savedAt: new Date().toISOString()
    };
    writeJSON(SAVED_KEY, saved);
    emit('saved-view', saved[name]);
    return saved[name];
  };

  const saveState = () => {
    const snapshot = currentView();
    writeJSON(STATE_KEY, snapshot);
    emit('view', snapshot);
    return snapshot;
  };

  const restoreState = () => currentView();

  const listSavedViews = () => Object.values(readJSON(SAVED_KEY, {})).sort((left, right) => String(right.savedAt).localeCompare(String(left.savedAt)));

  if (!document.getElementById('wc26-meridian-lite-style')) {
    const style = document.createElement('style');
    style.id = 'wc26-meridian-lite-style';
    style.textContent = '.wc26-layer-hidden{display:none !important;}';
    document.head.appendChild(style);
  }

  window.WC26Meridian = {
    emit,
    on,
    currentView,
    getViewState,
    setView,
    setViewState,
    setZoom,
    toggleLayer,
    setLayer,
    applyView,
    focusMatch,
    focusTeam,
    getFocusMatch,
    getFocusTeam,
    saveView,
    listSavedViews,
    saveState,
    restoreState
  };
})();