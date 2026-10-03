// ponytail: state machine + solo/1v1 UI. Ceiling: no rematch queue, no reconnect, no names.
// Upgrade path: rematch handshake; guest reconnect token; persistent settings.
(function () {
  const gen = globalThis.MathSprintGen;
  const multiApi = globalThis.MathSprintMulti;
  const generateProblem = gen.generateProblem;
  const generateChoices = gen.generateChoices;
  const decideWinner = multiApi.decideWinner;

  const $ = function (id) {
    return document.getElementById(id);
  };
  const SCREENS = ['home', 'play', 'result', 'multi-setup', 'multi-wait', 'result-1v1'];
  const FEEDBACK_MS = 550;
  const COUNTDOWN_MS = 3200;
  const DISCONNECT_GRACE_MS = 10;
  const OP_CLASS = { '+': 'op-plus', '−': 'op-sub', '×': 'op-mul', '÷': 'op-div' };

  let timer = null;
  let locked = false;
  let mode = 'fixed';
  let limit = 20;
  let current = 0;
  let correct = 0;
  let total = 0;
  let hostQuestionCount = 10;

  const multi = new multiApi.Multi();
  let multiState = null;
  let disconnectTimer = null;

  function readHostCount() {
    const el = $('multi-q-count');
    const raw = el && el.value;
    const n = Number.parseInt(String(raw).trim(), 10);
    if (!Number.isFinite(n) || n < 1) return 10;
    return Math.min(500, n);
  }

  function setHostCount(n) {
    hostQuestionCount = Math.min(500, Math.max(1, Number.isFinite(n) ? n : 10));
    const el = $('multi-q-count');
    if (el) el.value = String(hostQuestionCount);
    const disp = $('q-display');
    if (disp) disp.textContent = String(hostQuestionCount);
  }

  function showScreen(name) {
    for (let i = 0; i < SCREENS.length; i++) {
      const screen = SCREENS[i];
      const el = $('screen-' + screen);
      const on = screen === name;
      el.classList.toggle('hidden', !on);
      el.classList.toggle('flex', on);
      if (on) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    }
  }

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function clearDisconnect() {
    if (disconnectTimer !== null) {
      clearInterval(disconnectTimer);
      disconnectTimer = null;
    }
    $('overlay-disconnect').classList.add('hidden');
  }

  function clampCount(value, min, max, fallback) {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function buildQuestions(n) {
    const list = [];
    for (let i = 0; i < n; i++) {
      const p = generateProblem();
      list.push({
        a: p.a,
        b: p.b,
        op: p.op,
        answer: p.answer,
        choices: generateChoices(p),
      });
    }
    return list;
  }

  function updateLive() {
    if (multiState) {
      if (multiState.phase === 'waiting-opponent') {
        $('live-score').textContent = 'Waiting for friend…';
        return;
      }
      if (multiState.phase === 'playing') {
        const lim = multiState.limit || multiState.questions.length || 0;
        $('live-score').textContent = 'Q ' + Math.min(current + 1, lim) + ' / ' + lim;
        return;
      }
    }
    if (mode === 'infinite') {
      $('live-score').textContent = '✓ ' + correct + '  /  ' + total;
    } else {
      $('live-score').textContent = 'Q ' + Math.min(current + 1, limit) + ' / ' + limit;
    }
  }

  function updateFriendBadge() {
    const el = $('friend-answered');
    if (!el) return;
    if (!multiState || multiState.phase !== 'playing') {
      el.classList.add('hidden');
      return;
    }
    const show = multiState.opponent.answered > current;
    el.classList.toggle('hidden', !show);
  }

  function updateMultiBars() {
    if (!multiState) return;
    const totalQ = multiState.limit || 1;
    const youPct = Math.min(100, Math.round((current / totalQ) * 100));
    const fr = multiState.opponent;
    const frPct = Math.min(100, Math.round((fr.answered / totalQ) * 100));
    $('bar-you').style.width = youPct + '%';
    $('bar-friend').style.width = frPct + '%';
    $('bar-you-score').textContent = correct + '✓ ' + current + '/' + totalQ;
    $('bar-friend-score').textContent = fr.correct + '✓ ' + fr.answered + '/' + totalQ;
  }

  function showMultiPlayChrome() {
    $('play-meta').classList.remove('hidden');
    $('play-meta').classList.add('flex');
    $('btn-stop').hidden = true;
    $('btn-leave-1v1').hidden = false;
    $('multi-bars').classList.remove('hidden');
    updateMultiBars();
  }

  function showSoloPlayChrome(infinite) {
    $('multi-bars').classList.add('hidden');
    $('btn-leave-1v1').hidden = true;
    $('play-meta').classList.toggle('hidden', !infinite);
    $('play-meta').classList.toggle('flex', infinite);
    $('btn-stop').hidden = !infinite;
  }

  function startGame() {
    clearTimer();
    clearDisconnect();
    multiState = null;
    mode = $('q-infinite').checked ? 'infinite' : 'fixed';
    limit = clampCount($('q-count').value, 1, 500, 20);
    $('q-count').value = String(limit);
    current = 0;
    correct = 0;
    total = 0;
    locked = false;
    showSoloPlayChrome(mode === 'infinite');
    showScreen('play');
    nextQuestion();
  }

  function renderEquation(problem) {
    const eq = $('equation');
    eq.classList.remove('anim-rise');
    void eq.offsetWidth;
    eq.classList.add('anim-rise');
    eq.innerHTML =
      '<span class="text-slate-100">' + problem.a + '</span>' +
      ' <span class="' + (OP_CLASS[problem.op] || '') + '">' + problem.op + '</span> ' +
      '<span class="text-slate-100">' + problem.b + '</span>' +
      ' <span class="text-slate-500">=</span>';
  }

  function renderChoices(problem, choiceList) {
    const list = choiceList || problem.choices || generateChoices(problem);
    const box = $('choices');
    box.replaceChildren();
    for (let i = 0; i < list.length; i++) {
      const value = list[i];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = String(value);
      btn.className =
        'choice-btn col-span-2 flex min-h-24 items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-900/90 p-1 text-[clamp(1rem,4.2vw,1.5rem)] font-extrabold tabular-nums text-slate-100 shadow-md shadow-slate-950/40 transition hover:border-slate-500 hover:bg-slate-800 active:scale-[0.97] disabled:cursor-default disabled:hover:border-slate-700/80 disabled:hover:bg-slate-900/90';
      if (i === 3) btn.classList.add('col-start-2');
      if (i === 4) btn.classList.add('col-start-4');
      btn.addEventListener('click', function () {
        onAnswer(btn, value, problem);
      });
      box.appendChild(btn);
    }
  }

  function nextQuestion() {
    locked = false;

    if (multiState) {
      if (current >= multiState.questions.length) {
        finishLocalQuestions();
        return;
      }
      const problem = multiState.questions[current];
      renderEquation(problem);
      renderChoices(problem);
      updateLive();
      updateMultiBars();
      updateFriendBadge();
      return;
    }

    if (mode === 'fixed' && current >= limit) {
      endGame();
      return;
    }

    const problem = generateProblem();
    renderEquation(problem);
    renderChoices(problem);
    updateLive();
  }

  function sendProgress(doneFlag) {
    if (!multiState) return;
    const ms = multiState.startTime ? Date.now() - multiState.startTime : 0;
    multi.send({
      type: 'progress',
      answered: current,
      correct: correct,
      done: !!doneFlag,
      ms: ms,
      index: current,
    });
    updateMultiBars();
    updateFriendBadge();
  }

  function onAnswer(btn, value, problem) {
    if (locked) return;
    locked = true;
    clearTimer();

    total += 1;
    current += 1;
    const ok = value === problem.answer;
    if (ok) correct += 1;

    const nodes = $('choices').querySelectorAll('button');
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      node.disabled = true;
      if (Number(node.textContent) === problem.answer) {
        node.classList.add(
          'anim-pop',
          'border-emerald-400',
          'bg-emerald-500',
          'text-slate-950',
          'shadow-lg',
          'shadow-emerald-500/40',
        );
      } else {
        node.classList.add('opacity-40');
      }
    }
    if (!ok) {
      btn.classList.remove('opacity-40');
      btn.classList.add('anim-shake', 'border-rose-500', 'bg-rose-600/90', 'text-white');
    }

    if (multiState) {
      const lim = multiState.limit || multiState.questions.length || 0;
      const finished = lim > 0 && current >= lim;
      sendProgress(finished);
      updateLive();
      updateFriendBadge();
      if (finished) {
        finishLocalQuestions();
        return;
      }
      timer = setTimeout(function () {
        timer = null;
        nextQuestion();
      }, FEEDBACK_MS);
      return;
    }

    updateLive();
    timer = setTimeout(function () {
      timer = null;
      if (mode === 'fixed' && current >= limit) endGame();
      else nextQuestion();
    }, FEEDBACK_MS);
  }

  function finishLocalQuestions() {
    if (!multiState || multiState.localDone) return;
    multiState.localDone = true;
    multiState.phase = 'waiting-opponent';
    locked = true;
    sendProgress(true);
    updateLive();
    if (multiState.opponent.done) end1v1('natural');
  }

  function endGame() {
    clearTimer();
    locked = true;
    multiState = null;
    const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
    $('result-score').textContent = correct + ' / ' + total;
    $('result-detail').textContent = pct + '%' + (mode === 'infinite' ? ' · stopped early' : '');
    showScreen('result');
  }

  function formatMs(ms) {
    if (!Number.isFinite(ms) || ms < 0) return '—';
    return (ms / 1000).toFixed(1) + 's';
  }

  function show1v1Result(winner, youMs, friendMs, note) {
    const you = { correct: correct, ms: youMs };
    const friend = {
      correct: multiState ? multiState.opponent.correct : 0,
      ms: friendMs,
    };
    const screen = $('screen-result-1v1');
    screen.classList.remove('result-win', 'result-lose', 'result-draw');

    let title;
    if (winner === 'you') {
      title = 'You Win!';
      screen.classList.add('result-win');
    } else if (winner === 'friend') {
      title = 'You Lose';
      screen.classList.add('result-lose');
    } else {
      title = 'Draw!';
      screen.classList.add('result-draw');
    }

    $('winner-label').textContent = title;
    $('r1-you-score').textContent = you.correct + ' correct · ' + formatMs(you.ms);
    $('r1-friend-score').textContent = friend.correct + ' correct · ' + formatMs(friend.ms);
    $('r1-note').textContent = note || '';
    showScreen('result-1v1');
  }

  function end1v1(reason) {
    clearTimer();
    clearDisconnect();
    if (!multiState) return;
    multiState.phase = 'done';
    locked = true;
    const youMs = multiState.startTime ? Date.now() - multiState.startTime : 0;
    const friend = multiState.opponent;

    if (reason === 'disconnect') {
      show1v1Result('you', youMs, friend.ms, 'Opponent disconnected');
      return;
    }

    const winner = decideWinner(
      { correct: correct, ms: youMs, done: true },
      { correct: friend.correct, ms: friend.ms, done: true },
    );
    const note =
      correct === friend.correct
        ? 'Tie on score — faster time wins'
        : 'Most correct wins';
    show1v1Result(winner === 'a' ? 'you' : winner === 'b' ? 'friend' : 'draw', youMs, friend.ms, note);
  }

  function resetMultiState(role) {
    multiState = {
      role: role,
      phase: 'lobby',
      questions: [],
      limit: 0,
      pendingCount: 0,
      myReady: false,
      opponentReady: false,
      countdownStarted: false,
      localDone: false,
      startTime: 0,
      connOpen: false,
      opponent: {
        answered: 0,
        correct: 0,
        done: false,
        ms: 0,
        disconnected: false,
      },
    };
  }

  function showMultiError(msg) {
    const el = $('multi-error');
    el.textContent = msg;
    el.classList.remove('hidden');
    const wait = $('screen-multi-wait');
    if (wait && !wait.classList.contains('hidden')) {
      if (multiState && multiState.role === 'guest') {
        $('wait-status-guest').textContent = msg;
      } else {
        $('wait-status').textContent = msg;
      }
    }
  }

  function clearMultiError() {
    const el = $('multi-error');
    el.textContent = '';
    el.classList.add('hidden');
  }

  function updateReadyUI() {
    if (!multiState) return;
    const btn = $('btn-ready');
    const badge = $('ready-badge');
    const hostBox = $('wait-host');
    const guestBox = $('wait-guest');
    const status = multiState.role === 'host' ? $('wait-status') : $('wait-status-guest');

    hostBox.classList.toggle('hidden', multiState.role !== 'host');
    guestBox.classList.toggle('hidden', multiState.role !== 'guest');

    if (multiState.role === 'host' && multiState.code) {
      $('room-code').textContent = multiState.code;
    }

    const both = multiState.myReady && multiState.opponentReady;
    const readyVisible = !!multiState.connOpen && !both;
    btn.hidden = !readyVisible;
    btn.disabled = multiState.myReady;
    btn.textContent = multiState.myReady ? 'Waiting…' : 'Ready';

    badge.classList.toggle('hidden', !multiState.opponentReady);

    if (multiState.role === 'host') {
      const qn = multiState.pendingCount || hostQuestionCount || '';
      const qLabel = qn ? ' · ' + qn + ' questions' : '';
      if (both) status.textContent = 'Both ready — starting…';
      else if (multiState.myReady && !multiState.opponentReady) status.textContent = 'Waiting for friend to tap Ready…';
      else if (!multiState.myReady && multiState.opponentReady) status.textContent = 'Friend is ready. Tap Ready.';
      else if (multiState.connOpen) status.textContent = 'Opponent joined. Tap Ready when ready.' + qLabel;
      else status.textContent = 'Share this code' + qLabel + ' · waiting for opponent…';
    } else {
      if (both) status.textContent = 'Both ready — starting…';
      else if (multiState.myReady && !multiState.opponentReady) status.textContent = 'Waiting for host to tap Ready…';
      else if (!multiState.myReady && multiState.opponentReady) status.textContent = 'Host is ready. Tap Ready.';
      else status.textContent = 'Connected. Tap Ready when ready.';
    }
  }

  function maybeStartCountdown() {
    if (!multiState) return;
    if (!multiState.myReady || !multiState.opponentReady) return;
    if (multiState.countdownStarted) return;
    multiState.countdownStarted = true;
    multiState.phase = 'countdown';

    if (multiState.role === 'host') {
      const count = multiState.pendingCount > 0 ? multiState.pendingCount : (hostQuestionCount > 0 ? hostQuestionCount : readHostCount());
      hostQuestionCount = count;
      multiState.pendingCount = count;
      multiState.limit = count;
      if ($('multi-q-count')) $('multi-q-count').value = String(count);
      const disp = $('q-display');
      if (disp) disp.textContent = String(count);
      console.log('[1v1] host start', { count, hostQuestionCount, pendingCount: multiState.pendingCount, input: $('multi-q-count') && $('multi-q-count').value });
      const questions = buildQuestions(count);
      if (questions.length !== count) {
        console.warn('[1v1] build mismatch', questions.length, count);
      }
      multiState.questions = questions;
      multiState.limit = questions.length;
      const goAt = Date.now() + COUNTDOWN_MS;
      multi.send({ type: 'begin', questions: questions, goAt: goAt, count: questions.length });
      beginCountdown(goAt);
    }
  }

  function beginCountdown(goAt) {
    showScreen('play');
    showMultiPlayChrome();
    $('choices').replaceChildren();
    $('equation').textContent = '…';
    $('friend-answered').classList.add('hidden');
    $('overlay-countdown').classList.remove('hidden');
    $('countdown-num').textContent = '3';

    const tick = setInterval(function () {
      const left = goAt - Date.now();
      if (left <= 0) {
        clearInterval(tick);
        $('overlay-countdown').classList.add('hidden');
        if (!multiState) return;
        multiState.phase = 'playing';
        multiState.startTime = Date.now();
        current = 0;
        correct = 0;
        total = 0;
        locked = false;
        nextQuestion();
      } else {
        const n = Math.ceil(left / 1000);
        $('countdown-num').textContent = String(Math.max(1, n));
      }
    }, 100);
  }

  function startDisconnectGrace() {
    if (!multiState) return;
    if (multiState.phase === 'lobby') return;
    if (disconnectTimer !== null) return;
    if (multiState.phase === 'done') return;

    multiState.opponent.disconnected = true;
    $('overlay-disconnect').classList.remove('hidden');
    let n = DISCONNECT_GRACE_MS;
    $('disconnect-count').textContent = String(n);
    disconnectTimer = setInterval(function () {
      n -= 1;
      $('disconnect-count').textContent = String(Math.max(0, n));
      if (n <= 0) {
        clearDisconnect();
        end1v1('disconnect');
      }
    }, 1000);
  }

  function cleanupMulti() {
    clearTimer();
    clearDisconnect();
    multi.leave();
    multiState = null;
    locked = false;
    $('overlay-countdown').classList.add('hidden');
    $('multi-bars').classList.add('hidden');
    $('btn-leave-1v1').hidden = true;
  }

  function enterMultiSetup() {
    cleanupMulti();
    clearMultiError();
    $('multi-code').value = '';
    if ($('multi-q-count')) $('multi-q-count').value = String(hostQuestionCount);
    const disp = $('q-display');
    if (disp) disp.textContent = String(hostQuestionCount);
    showScreen('multi-setup');
  }

  function enterMultiWait(role) {
    clearMultiError();
    resetMultiState(role);
    multiState.phase = 'lobby';
    $('ready-badge').classList.add('hidden');
    $('btn-ready').hidden = true;
    $('btn-ready').disabled = false;
    $('btn-ready').textContent = 'Ready';
    showScreen('multi-wait');
    updateReadyUI();
  }

  function bindMultiEvents() {
    multi.on('room-ready', function (code) {
      if (!multiState) {
        resetMultiState('host');
      }
      multiState.role = 'host';
      multiState.code = code;
      multiState.phase = 'lobby';
      multiState.connOpen = false;
      // do not overwrite pendingCount — it was locked at Create
      if (!multiState.pendingCount) {
        const c = hostQuestionCount > 0 ? hostQuestionCount : readHostCount();
        hostQuestionCount = c;
        multiState.pendingCount = c;
      }
      multiState.limit = multiState.pendingCount;
      if ($('multi-q-count')) $('multi-q-count').value = String(multiState.pendingCount);
      const disp = $('q-display');
      if (disp) disp.textContent = String(multiState.pendingCount);
      $('room-code').textContent = code;
      $('wait-host').classList.remove('hidden');
      $('wait-guest').classList.add('hidden');
      showScreen('multi-wait');
      updateReadyUI();
      console.log('[1v1] room-ready', { code, pendingCount: multiState.pendingCount, hostQuestionCount, input: $('multi-q-count') && $('multi-q-count').value });
    });

    multi.on('connected', function () {
      if (!multiState) return;
      multiState.connOpen = true;
      if (multiState.role === 'host') {
        multiState.opponentReady = false;
      }
      updateReadyUI();
    });

    multi.on('joined', function () {
      if (!multiState || multiState.role !== 'host') return;
      updateReadyUI();
    });

    multi.on('ready', function () {
      if (!multiState) return;
      multiState.opponentReady = true;
      updateReadyUI();
      maybeStartCountdown();
    });

    multi.on('begin', function (data) {
      if (!multiState || multiState.role !== 'guest') return;
      multiState.questions = data.questions || [];
      multiState.limit = multiState.questions.length;
      beginCountdown(Number(data.goAt) || Date.now() + COUNTDOWN_MS);
    });

    multi.on('progress', function (data) {
      if (!multiState) return;
      multiState.opponent.answered = Number(data.answered) || 0;
      multiState.opponent.correct = Number(data.correct) || 0;
      multiState.opponent.done = !!data.done;
      multiState.opponent.ms = Number(data.ms) || 0;
      updateMultiBars();
      updateFriendBadge();
      if (multiState.localDone && multiState.opponent.done && multiState.phase !== 'done') {
        end1v1('natural');
      }
    });

    multi.on('left', function () {
      startDisconnectGrace();
    });

    multi.on('peer-closed', function () {
      if (!multiState) return;
      if (multiState.phase === 'lobby') {
        if (multiState.role === 'host') {
          multiState.myReady = false;
          multiState.opponentReady = false;
          multiState.countdownStarted = false;
          updateReadyUI();
          $('wait-status').textContent = 'Waiting for opponent…';
        } else {
          cleanupMulti();
          showMultiError('Connection lost. Room closed.');
          showScreen('multi-setup');
        }
        return;
      }
      startDisconnectGrace();
    });

    multi.on('error', function (type) {
      const map = {
        'unavailable-id': 'Room code already in use. Tap Cancel and create again.',
        'peer-unavailable': 'Room not found. Check the code and try again.',
        'invalid-code': 'Enter a 6-character room code.',
        'PeerJS not loaded': 'Multiplayer failed to load. Check network.',
        network: 'Network error talking to multiplayer service. Check connection.',
        'server-error': 'Multiplayer service error. Wait a moment and retry.',
        'socket-error': 'Socket error. Check connection and retry.',
        'socket-closed': 'Connection closed. Retry or check network.',
      };
      const msg = map[type] || 'Connection error: ' + (type || 'unknown');
      if (multiState && multiState.role === 'host' && multiState.phase === 'lobby') {
        showMultiError(msg);
        try {
          if (multi.peer) multi.peer.destroy();
        } catch (e) {}
        multi.peer = null;
        multi.conn = null;
        multiState.connOpen = false;
        updateReadyUI();
        return;
      }
      if (multiState && multiState.phase === 'lobby' && multiState.role === 'guest') {
        cleanupMulti();
        showMultiError(msg);
        showScreen('multi-setup');
        return;
      }
      showMultiError(msg);
    });
  }

  $('q-infinite').addEventListener('change', function () {
    $('q-count').disabled = $('q-infinite').checked;
  });

  $('btn-play').addEventListener('click', startGame);
  $('btn-again').addEventListener('click', startGame);
  $('btn-stop').addEventListener('click', endGame);
  $('btn-home').addEventListener('click', function () {
    cleanupMulti();
    showScreen('home');
  });
  $('btn-1v1-home').addEventListener('click', function () {
    cleanupMulti();
    showScreen('home');
  });

  $('btn-multi').addEventListener('click', enterMultiSetup);
  $('btn-multi-back').addEventListener('click', function () {
    cleanupMulti();
    showScreen('home');
  });

  $('btn-create-room').addEventListener('click', function () {
    clearMultiError();
    const rawVal = $('multi-q-count') && $('multi-q-count').value;
    const count = readHostCount();
    hostQuestionCount = count;
    console.log('[1v1] create click', { rawVal, count, hostQuestionCount });
    if ($('multi-q-count')) $('multi-q-count').value = String(count);
    const disp = $('q-display');
    if (disp) disp.textContent = String(count);
    enterMultiWait('host');
    multiState.pendingCount = count;
    multiState.limit = count;
    $('wait-status').textContent = 'Creating room… (' + count + ' questions)';
    updateReadyUI();
    multi.createRoom();
  });

  const multiCountInput = $('multi-q-count');
  if (multiCountInput) {
    multiCountInput.addEventListener('change', function () {
      const c = readHostCount();
      hostQuestionCount = c;
      this.value = String(c);
      const disp = $('q-display');
      if (disp) disp.textContent = String(c);
      if (multiState && multiState.role === 'host' && multiState.phase === 'lobby' && !multiState.connOpen) {
        multiState.pendingCount = c;
        multiState.limit = c;
        updateReadyUI();
      }
    });
  }

  const qMinus = $('q-minus');
  const qPlus = $('q-plus');
  const qDisplay = $('q-display');
  if (qMinus && qPlus) {
    qMinus.addEventListener('click', function () {
      const c = Math.max(1, (hostQuestionCount || readHostCount()) - 1);
      setHostCount(c);
      if (multiState && multiState.role === 'host' && multiState.phase === 'lobby' && !multiState.connOpen) {
        multiState.pendingCount = c;
        multiState.limit = c;
        updateReadyUI();
      }
    });
    qPlus.addEventListener('click', function () {
      const c = Math.min(500, (hostQuestionCount || readHostCount()) + 1);
      setHostCount(c);
      if (multiState && multiState.role === 'host' && multiState.phase === 'lobby' && !multiState.connOpen) {
        multiState.pendingCount = c;
        multiState.limit = c;
        updateReadyUI();
      }
    });
  }

  $('btn-join-room').addEventListener('click', function () {
    clearMultiError();
    const code = $('multi-code').value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    $('multi-code').value = code;
    if (code.length !== 6) {
      showMultiError('Enter a 6-character room code.');
      return;
    }
    enterMultiWait('guest');
    $('wait-status-guest').textContent = 'Connecting…';
    multi.joinRoom(code);
  });

  $('multi-code').addEventListener('input', function () {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  });

  $('btn-copy-code').addEventListener('click', function () {
    const codeEl = $('room-code');
    const code = (codeEl && codeEl.textContent ? codeEl.textContent : '').trim();
    if (!code || code === '------') {
      showMultiError('Room code not ready yet.');
      return;
    }
    if (codeEl) {
      const range = document.createRange();
      range.selectNodeContents(codeEl);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    copyText(code).then(function () {
      $('btn-copy-code').textContent = 'Copied';
      setTimeout(function () {
        $('btn-copy-code').textContent = 'Copy';
      }, 1200);
    }).catch(function () {
      $('btn-copy-code').textContent = 'Select code';
      setTimeout(function () {
        $('btn-copy-code').textContent = 'Copy';
      }, 2000);
    });
  });

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (e) {
        ok = false;
      }
      document.body.removeChild(ta);
      if (ok) resolve();
      else reject(new Error('copy-failed'));
    });
  }

  $('btn-ready').addEventListener('click', function () {
    if (!multiState || multiState.myReady) return;
    multiState.myReady = true;
    multi.send({ type: 'ready' });
    updateReadyUI();
    maybeStartCountdown();
  });

  $('btn-cancel-multi').addEventListener('click', function () {
    cleanupMulti();
    showScreen('home');
  });

  $('btn-leave-1v1').addEventListener('click', function () {
    multi.send({ type: 'left' });
    cleanupMulti();
    showScreen('home');
  });

  $('btn-dc-home').addEventListener('click', function () {
    multi.send({ type: 'left' });
    cleanupMulti();
    showScreen('home');
  });

  bindMultiEvents();

  // init display
  (function () {
    const v = readHostCount();
    hostQuestionCount = v;
    const el = $('multi-q-count');
    if (el) el.value = String(v);
    const disp = $('q-display');
    if (disp) disp.textContent = String(v);
  })();
})();
