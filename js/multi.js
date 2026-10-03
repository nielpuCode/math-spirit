// ponytail: PeerJS transport only. Ceiling: public broker, host dies with tab, no reconnect.
// Upgrade path: own signaling worker / Supabase Realtime if rooms must outlive host.
(function (root) {
  function decideWinner(a, b) {
    if (a.disconnected && !b.disconnected) return 'b';
    if (b.disconnected && !a.disconnected) return 'a';
    if (a.correct > b.correct) return 'a';
    if (b.correct > a.correct) return 'b';
    if (a.ms < b.ms) return 'a';
    if (b.ms < a.ms) return 'b';
    return 'draw';
  }

  function makeCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 6; i++) {
      s += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return s;
  }

  function Multi() {
    this.peer = null;
    this.conn = null;
    this.role = null;
    this.code = null;
    this.handlers = {};
  }

  Multi.prototype.on = function (event, fn) {
    this.handlers[event] = fn;
  };

  Multi.prototype.emit = function (event, data) {
    const fn = this.handlers[event];
    if (fn) fn(data);
  };

  Multi.prototype.createRoom = function () {
    const self = this;
    this.leave();
    const Peer = root.Peer;
    if (!Peer) {
      this.emit('error', 'PeerJS not loaded');
      return;
    }
    this.role = 'host';
    this.code = makeCode();
    this.peer = new Peer('ms-' + this.code);
    this.peer.on('open', function () {
      self.emit('room-ready', self.code);
    });
    this.peer.on('connection', function (conn) {
      self.setupConn(conn);
    });
    this.peer.on('error', function (err) {
      self.emit('error', (err && err.type) || 'peer-error');
    });
  };

  Multi.prototype.joinRoom = function (code) {
    const self = this;
    this.leave();
    const Peer = root.Peer;
    if (!Peer) {
      this.emit('error', 'PeerJS not loaded');
      return;
    }
    this.role = 'guest';
    this.code = String(code || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
    if (this.code.length !== 6) {
      this.emit('error', 'invalid-code');
      return;
    }
    this.peer = new Peer();
    this.peer.on('open', function () {
      const conn = self.peer.connect('ms-' + self.code, { reliable: true });
      self.setupConn(conn);
    });
    this.peer.on('error', function (err) {
      self.emit('error', (err && err.type) || 'peer-error');
    });
  };

  Multi.prototype.setupConn = function (conn) {
    const self = this;
    this.conn = conn;
    conn.on('open', function () {
      self.emit('connected');
      if (self.role === 'guest') {
        conn.send({ type: 'joined' });
      }
    });
    conn.on('data', function (data) {
      if (!data || !data.type) return;
      self.emit(data.type, data);
    });
    conn.on('close', function () {
      self.emit('peer-closed');
    });
    conn.on('error', function () {
      self.emit('peer-closed');
    });
  };

  Multi.prototype.send = function (obj) {
    if (this.conn && this.conn.open) this.conn.send(obj);
  };

  Multi.prototype.leave = function () {
    if (this.conn) {
      try {
        this.conn.close();
      } catch (e) {}
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (e) {}
    }
    this.peer = null;
    this.conn = null;
  };

  const api = {
    Multi: Multi,
    decideWinner: decideWinner,
    makeCode: makeCode,
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MathSprintMulti = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
