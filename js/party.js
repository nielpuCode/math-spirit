// ponytail: plain-object room state, no DOM, no Peer. Ceiling: fixed cap of 8.
// Upgrade path: host-set cap carried in the roster message if rooms get crowded.
(function (root) {
  const MAX_PLAYERS = 8;

  function createRoom() {
    return { players: {} };
  }

  function size(state) {
    return Object.keys(state.players).length;
  }

  function addPlayer(state, id, name) {
    if (!id || state.players[id]) return state.players[id] || null;
    if (size(state) >= MAX_PLAYERS) return null;
    const p = {
      id: id,
      name: String(name == null ? '' : name).trim().slice(0, 20) || '???',
      ready: false,
      answered: 0,
      correct: 0,
      done: false,
      ms: 0,
    };
    state.players[id] = p;
    return p;
  }

  function removePlayer(state, id) {
    if (!state.players[id]) return false;
    delete state.players[id];
    return true;
  }

  function setReady(state, id, ready) {
    const p = state.players[id];
    if (!p) return false;
    p.ready = !!ready;
    return true;
  }

  // Lobby rename: same sanitizing as join, empty keeps the old name.
  function setName(state, id, name) {
    const p = state.players[id];
    if (!p) return false;
    const clean = String(name == null ? '' : name).trim().slice(0, 20);
    if (!clean) return false;
    p.name = clean;
    return true;
  }

  function names(state) {
    const out = [];
    const ids = Object.keys(state.players);
    for (let i = 0; i < ids.length; i++) out.push(state.players[ids[i]].name);
    return out;
  }

  function notReady(state) {
    const out = [];
    const ids = Object.keys(state.players);
    for (let i = 0; i < ids.length; i++) {
      if (!state.players[ids[i]].ready) out.push(state.players[ids[i]].name);
    }
    return out;
  }

  function allReady(state) {
    const ids = Object.keys(state.players);
    if (ids.length < 2) return false;
    for (let i = 0; i < ids.length; i++) {
      if (!state.players[ids[i]].ready) return false;
    }
    return true;
  }

  // One guest answer lands here on every client (directly, or via host relay).
  // ms accumulates per-question answering times into a total every client can
  // compare fairly (local deltas, never absolute timestamps). Addition
  // commutes, so relay arrival order never changes the final standings.
  function applyAnswered(state, fromId, msg) {
    const p = state.players[fromId];
    if (!p || p.done) return false;
    p.answered += 1;
    if (msg && msg.correct) p.correct += 1;
    const dms = msg ? Number(msg.dms) : NaN;
    if (Number.isFinite(dms) && dms >= 0) p.ms += dms;
    if (msg && msg.done) p.done = true;
    return true;
  }

  // Rematch: zero scores and ready flags, keep identities and seats.
  function resetScores(state) {
    const ids = Object.keys(state.players);
    for (let i = 0; i < ids.length; i++) {
      const p = state.players[ids[i]];
      p.ready = false;
      p.answered = 0;
      p.correct = 0;
      p.done = false;
      p.ms = 0;
    }
    return state;
  }

  function allDone(state) {
    const ids = Object.keys(state.players);
    if (ids.length === 0) return false;
    for (let i = 0; i < ids.length; i++) {
      if (!state.players[ids[i]].done) return false;
    }
    return true;
  }

  // Host is the source of truth for identity/ready; guests adopt it wholesale.
  function rosterList(state) {
    const out = [];
    const ids = Object.keys(state.players);
    for (let i = 0; i < ids.length; i++) {
      const p = state.players[ids[i]];
      out.push({ id: p.id, name: p.name, ready: p.ready, answered: p.answered, correct: p.correct, done: p.done, ms: p.ms });
    }
    return out;
  }

  function syncRoster(state, list) {
    state.players = {};
    for (let i = 0; i < (list || []).length; i++) {
      const e = list[i] || {};
      if (!e.id) continue;
      state.players[e.id] = {
        id: e.id,
        name: String(e.name == null ? '' : e.name).slice(0, 20) || '???',
        ready: !!e.ready,
        answered: Number(e.answered) || 0,
        correct: Number(e.correct) || 0,
        done: !!e.done,
        ms: Number(e.ms) || 0,
      };
    }
    return state;
  }

  const api = {
    MAX_PLAYERS: MAX_PLAYERS,
    createRoom: createRoom,
    size: size,
    addPlayer: addPlayer,
    removePlayer: removePlayer,
    setReady: setReady,
    setName: setName,
    names: names,
    notReady: notReady,
    allReady: allReady,
    applyAnswered: applyAnswered,
    allDone: allDone,
    resetScores: resetScores,
    rosterList: rosterList,
    syncRoster: syncRoster,
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MathSprintParty = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
