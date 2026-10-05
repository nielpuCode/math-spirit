// ponytail: state machine + solo/multiplayer UI. Ceiling: no rematch queue, no reconnect, rooms die with host.
// Upgrade path: rematch handshake; guest reconnect token; persistent settings.
(function () {
  const gen = globalThis.MathSprintGen;
  const multiApi = globalThis.MathSprintMulti;
  const namesApi = globalThis.MathSprintNames;
  const partyApi = globalThis.MathSprintParty;
  const roastApi = globalThis.MathSprintRoast;
  const generateProblem = gen.generateProblem;
  const generateChoices = gen.generateChoices;
  const rankBoard = multiApi.rank;

  const $ = function (id) {
    return document.getElementById(id);
  };
  const SCREENS = ['home', 'play', 'result', 'multi-setup', 'multi-wait', 'result-1v1', 'qr'];
  const FEEDBACK_MS = 550;
  const COUNTDOWN_MS = 3200;
  const ANSWER_GRACE_MS = 3000;
  const DISCONNECT_GRACE_MS = 10;
  const OP_CLASS = { '+': 'op-plus', '−': 'op-sub', '×': 'op-mul', '÷': 'op-div' };

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Story equations ('12,5% dari 80', '47.623 −10%'): same operator colors as
  // classic problems so symbols always contrast against the numbers.
  function paintStoryOps(text) {
    return String(text).split('').map(function (ch) {
      const cls = ch === '%' ? 'op-div' : OP_CLASS[ch];
      if (!cls) return escapeHtml(ch);
      return '<span class="' + cls + '">' + escapeHtml(ch) + '</span>';
    }).join('');
  }

  let timer = null;
  let graceTimer = null;
  let goTimer = null; // GO! flash timeout inside beginCountdown
  const GO_MS = 600;
  let locked = false;
  let mode = 'fixed';
  let limit = 10;
  let current = 0;
  let correct = 0;
  let total = 0;
  let hostQuestionCount = 10;
  let hostGraceSec = 3;
  const GRACE_STORE_KEY = 'mathsprint.grace';
  const LANG_STORE_KEY = 'mathsprint.lang';

  function loadLang() {
    try {
      if (typeof localStorage === 'undefined') return 'id';
      return localStorage.getItem(LANG_STORE_KEY) === 'en' ? 'en' : 'id';
    } catch (e) {
      return 'id';
    }
  }

  function gameLang() {
    return loadLang();
  }

  function applyLang(lang) {
    const l = lang === 'en' ? 'en' : 'id';
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(LANG_STORE_KEY, l);
    } catch (e) {}
    const idBtn = $('lang-id');
    const enBtn = $('lang-en');
    const on = 'border-[#F5A623] bg-[#F5A623]/15 text-[#F5A623]';
    const off = 'border-slate-700 text-slate-400';
    if (idBtn) {
      idBtn.classList.remove('border-[#F5A623]', 'bg-[#F5A623]/15', 'text-[#F5A623]', 'border-slate-700', 'text-slate-400');
      idBtn.classList.add.apply(idBtn.classList, (l === 'id' ? on : off).split(' '));
    }
    if (enBtn) {
      enBtn.classList.remove('border-[#F5A623]', 'bg-[#F5A623]/15', 'text-[#F5A623]', 'border-slate-700', 'text-slate-400');
      enBtn.classList.add.apply(enBtn.classList, (l === 'en' ? on : off).split(' '));
    }
  }
  let nameEdited = false; // true only while the box holds a user-typed name

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

  // Host's per-question pressure timer, seconds. 0 = off (own-pace race).
  function readGraceDur() {
    const el = $('grace-count');
    const raw = el && el.value;
    const n = Number.parseInt(String(raw).trim(), 10);
    if (!Number.isFinite(n)) return 3;
    return Math.max(0, Math.min(10, n));
  }

  function graceCaption(n) {
    return n <= 0 ? 'Off · play at your own pace' : n + 's per question · 0 = off';
  }

  function setGraceDur(n, save) {
    hostGraceSec = Math.max(0, Math.min(10, Number.isFinite(n) ? n : 3));
    const el = $('grace-count');
    if (el) el.value = String(hostGraceSec);
    const disp = $('g-display');
    if (disp) disp.textContent = graceCaption(hostGraceSec);
    if (save !== false) {
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(GRACE_STORE_KEY, String(hostGraceSec));
      } catch (e) {}
    }
  }

  function loadGraceDur() {
    try {
      if (typeof localStorage === 'undefined') return 3;
      const raw = localStorage.getItem(GRACE_STORE_KEY);
      if (raw === null || raw === '') return 3;
      const n = Number.parseInt(String(raw).trim(), 10);
      if (!Number.isFinite(n)) return 3;
      return Math.max(0, Math.min(10, n));
    } catch (e) {
      return 3;
    }
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
    $('overlay-disconnect').hidden = true;
  }

  function clearGo() {
    if (goTimer !== null) {
      clearTimeout(goTimer);
      goTimer = null;
    }
  }

  function clampCount(value, min, max, fallback) {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function buildQuestions(n) {
    const list = [];
    for (let i = 0; i < n; i++) {
      const p = generateProblem(gameLang());
      list.push({
        a: p.a,
        b: p.b,
        op: p.op,
        answer: p.answer,
        choices: generateChoices(p),
        text: p.text,
        sub: p.sub,
        fmt: p.fmt,
      });
    }
    return list;
  }

  function updateLive() {
    if (multiState) {
      if (multiState.phase === 'waiting-players') {
        $('live-score').textContent = 'Waiting for others…';
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
      const n = Math.min(current + 1, limit);
      const left = Math.max(0, limit - n);
      $('live-score').textContent = 'Q ' + n + ' / ' + limit + (left > 0 ? ' · ' + left + ' left' : ' · last one!');
    }
  }

function hidePeerAlert() {
    const el = $('peer-alert');
    if (el) {
      el.classList.add('hidden');
      el.hidden = true; // <--- ADD THIS
    }
    const eq = $('equation');
    if (eq) eq.style.boxShadow = '';
  }

  function showPeerAlert(name, seconds) {
    const el = $('peer-alert');
    if (!el) return;
    $('peer-alert-text').textContent = name + ' answered — hurry!';
    $('peer-alert-num').textContent = String(seconds);
    const fill = $('peer-alert-fill');
    if (fill) fill.style.width = '100%';
    
    el.classList.remove('hidden');
    el.hidden = false; // <--- ADD THIS
    
    const eq = $('equation');
    if (eq) eq.style.boxShadow = '0 0 0 2px rgba(251,191,36,.8), 0 0 28px rgba(251,191,36,.35)';
  }

  function clearGrace() {
    if (graceTimer !== null) {
      clearInterval(graceTimer);
      graceTimer = null;
    }
  }

  function renderBars() {
    if (!multiState) return;
    const box = $('multi-bars');
    if (!box) return;
    const lim = multiState.limit || 1;
    const ids = Object.keys(multiState.party.players);
    ids.sort(function (a, b) {
      if (a === multiState.me) return -1;
      if (b === multiState.me) return 1;
      return multiState.party.players[b].answered - multiState.party.players[a].answered;
    });
    box.replaceChildren();
    for (let i = 0; i < ids.length; i++) {
      const p = multiState.party.players[ids[i]];
      const you = ids[i] === multiState.me;
      const row = document.createElement('div');
      row.className = 'flex items-center gap-2';
      const dot = document.createElement('span');
      dot.className = 'h-3 w-3 shrink-0 rounded-full ' + (you
        ? 'bg-cyan-400 shadow shadow-cyan-400/50'
        : 'bg-amber-400 shadow shadow-amber-400/50');
      const name = document.createElement('span');
      name.className = 'w-20 shrink-0 truncate text-xs font-bold ' + (you ? 'text-cyan-300' : 'text-amber-300');
      name.textContent = (you ? p.name + ' (you)' : p.name) + (p.done ? ' ✓' : '');
      const track = document.createElement('div');
      track.className = 'h-3 flex-1 overflow-hidden rounded-full bg-slate-800/90 ring-1 ring-slate-700/80';
      const fill = document.createElement('div');
      fill.className = 'h-full rounded-full transition-all duration-300 ' + (you
        ? 'bg-gradient-to-r from-cyan-500 to-cyan-300'
        : 'bg-gradient-to-r from-amber-500 to-amber-300');
      fill.style.width = Math.min(100, Math.round((p.answered / lim) * 100)) + '%';
      track.appendChild(fill);
      const score = document.createElement('span');
      score.className = 'w-16 shrink-0 text-right text-xs font-bold tabular-nums text-slate-300';
      score.textContent = p.correct + '✓ ' + p.answered + '/' + lim;
      row.appendChild(dot);
      row.appendChild(name);
      row.appendChild(track);
      row.appendChild(score);
      box.appendChild(row);
    }
  }

  function showMultiPlayChrome() {
    $('play-meta').classList.remove('hidden');
    $('play-meta').classList.add('flex');
    $('btn-stop').hidden = true;
    $('btn-leave-1v1').hidden = false;
    $('multi-bars').classList.remove('hidden');
    renderBars();
  }

  function showSoloPlayChrome(infinite) {
    $('multi-bars').classList.add('hidden');
    $('btn-leave-1v1').hidden = true;
    // The meta bar carries the Q-progress pill: always visible in solo,
    // only the Give Up button stays infinite-only.
    $('play-meta').classList.remove('hidden');
    $('play-meta').classList.add('flex');
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

  // Shrink-to-fit: long expressions (32.999 − 12,5%) stay on one neat
  // line on phones instead of wrapping mid-equation. Only ever shrinks —
  // short equations keep their full display size on every viewport.
  function fitEquation(eq) {
    if (!eq || !eq.clientWidth) return;
    eq.style.fontSize = '';
    let size = parseFloat(window.getComputedStyle(eq).fontSize) || 44;
    let guard = 12;
    while (eq.scrollWidth > eq.clientWidth && size > 20 && guard-- > 0) {
      size -= 2;
      eq.style.fontSize = size + 'px';
    }
  }

  function renderEquation(problem) {
    const eq = $('equation');
    eq.classList.remove('anim-rise');
    void eq.offsetWidth;
    eq.classList.add('anim-rise');
    if (problem.text) {
      eq.replaceChildren();
      const main = document.createElement('div');
      main.className = 'text-slate-100';
      main.innerHTML = paintStoryOps(problem.text);
      eq.appendChild(main);
      fitEquation(eq);
      return;
    }
    eq.innerHTML =
      '<span class="text-slate-100">' + problem.a + '</span>' +
      ' <span class="' + (OP_CLASS[problem.op] || '') + '">' + problem.op + '</span> ' +
      '<span class="text-slate-100">' + problem.b + '</span>' +
      ' <span class="text-slate-500">=</span>';
    fitEquation(eq);
  }

  function renderChoices(problem, choiceList) {
    const list = choiceList || problem.choices || generateChoices(problem);
    const box = $('choices');
    box.classList.remove('anim-shake');
    box.replaceChildren();
    for (let i = 0; i < list.length; i++) {
      const value = list[i];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.value = String(value); // raw number: textContent may be locale-formatted
      btn.textContent = problem.fmt && gen.fmt ? gen.fmt(value, problem.fmt) : String(value);
      // Replace this line inside renderChoices:
btn.className =
  'choice-btn col-span-2 flex min-h-20 sm:min-h-24 md:min-h-28 items-center justify-center rounded-2xl border-4 border-[#12100E] bg-[#161D27] p-2 sm:p-4 text-[clamp(1.1rem,2.8vw,2rem)] font-black tabular-nums text-[#FFF7EB] shadow-[0_5px_0_#12100E] transition hover:bg-[#0D1117] active:translate-y-1 active:shadow-[0_1px_0_#12100E] disabled:cursor-default disabled:hover:bg-[#161D27]';
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
    clearGrace();
    hidePeerAlert();

    if (multiState) {
      if (current >= multiState.questions.length) {
        finishLocalQuestions();
        return;
      }
      const problem = multiState.questions[current];
      renderEquation(problem);
      renderChoices(problem);
      updateLive();
      renderBars();
      if (multiState.pendingGrace) {
        const pg = multiState.pendingGrace;
        multiState.pendingGrace = null;
        if (pg.index === current) maybeStartAnswerGrace(pg);
      } else {
        // A rival may have answered this question while I was behind
        // (slow start, feedback lock): no new message will come, so check now.
        const ahead = someoneAhead();
        if (ahead) maybeStartAnswerGrace({ index: current, from: ahead.id });
      }
      return;
    }

    if (mode === 'fixed' && current >= limit) {
      endGame();
      return;
    }

    const problem = generateProblem(gameLang());
    renderEquation(problem);
    renderChoices(problem);
    updateLive();
  }

  // value may be null (timed-out blank): reveal the answer, no pick highlighted.
  function paintChoices(problem, value) {
    const ok = value === problem.answer;
    const nodes = $('choices').querySelectorAll('button');
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      node.disabled = true;
      if (Number(node.dataset.value) === problem.answer) {
        node.classList.add('anim-pop', 'flash-right');
      } else {
        node.classList.add('flash-dim');
      }
    }
    if (value === null) {
      $('choices').classList.add('anim-shake');
      return ok;
    }
    if (!ok) {
      const picked = Array.prototype.filter.call(nodes, function (node) {
        return Number(node.dataset.value) === value;
      })[0];
      if (picked) {
        picked.classList.remove('flash-dim');
        picked.classList.add('anim-shake', 'flash-wrong');
      }
    }
    return ok;
  }

  function commitMultiAnswer(ok, blank) {
    const lim = multiState.limit || multiState.questions.length || 0;
    const finished = lim > 0 && current >= lim;
    const ms = multiState.startTime ? Date.now() - multiState.startTime : 0;
    const msg = {
      type: 'answered',
      index: current - 1,
      correct: !!ok,
      blank: !!blank,
      done: finished,
      ms: ms,
      from: multiState.me,
    };
    multiState.pendingGrace = null;
    partyApi.applyAnswered(multiState.party, multiState.me, msg);
    multi.send(msg); // guest -> host, host -> broadcast to all guests
    renderBars();
    updateLive();
    hidePeerAlert();
    if (finished) {
      finishLocalQuestions();
      return;
    }
    timer = setTimeout(function () {
      timer = null;
      nextQuestion();
    }, FEEDBACK_MS);
  }

  function onAnswer(btn, value, problem) {
    if (locked) return;
    locked = true;
    clearTimer();
    clearGrace();

    total += 1;
    current += 1;
    const ok = value === problem.answer;
    if (ok) correct += 1;
    paintChoices(problem, value);

    if (multiState) {
      commitMultiAnswer(ok, false);
      return;
    }

    updateLive();
    timer = setTimeout(function () {
      timer = null;
      if (mode === 'fixed' && current >= limit) endGame();
      else nextQuestion();
    }, FEEDBACK_MS);
  }

  // Effective pressure timer in ms. Host's setting, relayed in `begin`;
  // 0 means the host turned the countdown off (own-pace race).
  function graceTotalMs() {
    const sec = multiState && Number.isFinite(multiState.graceSec) ? multiState.graceSec : ANSWER_GRACE_MS / 1000;
    return Math.max(0, Math.min(10, sec)) * 1000;
  }

  // Someone else answered first: countdown to answer or this question locks in as blank.
  function maybeStartAnswerGrace(data) {
    if (!multiState || multiState.phase !== 'playing') return;
    if (graceTimer !== null) return;
    if (!data || data.index !== current) return;
    if (graceTotalMs() <= 0) return;
    // Answered during my own feedback lock: the message is for the question
    // already on screen, so park it and start the countdown right after render.
    if (locked) {
      multiState.pendingGrace = { index: data.index, from: data.from };
      return;
    }
    const p = multiState.party.players[data.from];
    const name = p ? p.name : 'Someone';
    const total = graceTotalMs();
    const deadline = Date.now() + total;
    showPeerAlert(name, Math.ceil(total / 1000));
    graceTimer = setInterval(function () {
      const left = deadline - Date.now();
      if (left <= 0) {
        clearGrace();
        forceBlank();
        return;
      }
      const num = $('peer-alert-num');
      if (num) num.textContent = String(Math.ceil(left / 1000));
      const fill = $('peer-alert-fill');
      if (fill) fill.style.width = Math.max(0, (left / total) * 100) + '%';
    }, 100);
  }

  function forceBlank() {
    if (!multiState || multiState.phase !== 'playing') return;
    if (locked) return;
    locked = true;
    clearTimer();
    clearGrace();
    hidePeerAlert();
    const problem = multiState.questions[current];
    if (!problem) return;
    total += 1;
    current += 1;
    paintChoices(problem, null);
    commitMultiAnswer(false, true);
  }

  function finishLocalQuestions() {
    if (!multiState || multiState.localDone) return;
    multiState.localDone = true;
    multiState.phase = 'waiting-players';
    locked = true;
    updateLive();
    maybeEndMulti();
  }

  function maybeEndMulti() {
    if (!multiState || multiState.phase === 'done') return;
    if (!partyApi.allDone(multiState.party)) return;
    endMulti();
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

  function showStandings() {
    const board = rankBoard(partyApi.rosterList(multiState.party));
    const screen = $('screen-result-1v1');
    screen.classList.remove('result-win', 'result-lose', 'result-draw');

    const first = board[0] || { name: 'Nobody', correct: 0, ms: 0 };
    const mePos = board.findIndex(function (p) { return p.id === multiState.me; }) + 1;
    // Strict tie lives in roast.headline: same score AND same time only.
    const head = roastApi && roastApi.headline
      ? roastApi.headline(board, multiState.me)
      : { title: '#' + (mePos > 0 ? mePos : board.length) + ' of ' + board.length, cls: 'result-lose', note: '' };
    screen.classList.add(head.cls);

    $('winner-label').textContent = head.title;
    // Main sub-display: one shared walk-of-shame for last place, shown to
    // every viewer right under their own rank. The name pops in an amber
    // chip so it reads first. Hidden on an exact-tie draw (no bottom frag
    // when the crown is shared) and on a solo board.
    const botEl = $('botfrag');
    if (botEl) {
      const last = board.length > 1 && head.cls !== 'result-draw' ? board[board.length - 1] : null;
      botEl.replaceChildren();
      if (last) {
        const pre = document.createElement('span');
        pre.textContent = '🤡 Botfrag ';
        const nm = document.createElement('span');
        nm.className = 'whitespace-nowrap rounded-md bg-[#D72638]/20 px-1.5 text-[#F5A623]';
        nm.textContent = last.name;
        const post = document.createElement('span');
        post.textContent = ' literally needs to go back to kindergarten, fr 💀';
        botEl.appendChild(pre);
        botEl.appendChild(nm);
        botEl.appendChild(post);
        botEl.hidden = false;
        botEl.classList.remove('hidden');
      } else {
        botEl.hidden = true;
        botEl.classList.add('hidden');
      }
    }
    const homeBtn = $('btn-1v1-home');
    if (homeBtn) {
      homeBtn.textContent = board.length > 0 && board[0].id === multiState.me
        ? "Let's Go Home, Winner... 🏆"
        : "Let's Go Home, Loser... 💀";
    }
    const list = $('r1-standings');
    list.replaceChildren();
    for (let i = 0; i < board.length; i++) {
      const p = board[i];
      const you = p.id === multiState.me;
      const row = document.createElement('li');
      row.className = 'flex flex-col gap-1 rounded-2xl border-2 border-[#12100E] px-4 py-3 shadow-[0_3px_0_#12100E] ' + (you
  ? 'bg-[#29B6F6]/20 text-[#29B6F6]'
  : 'bg-[#0D1117] text-[#FFF7EB]');
      const top = document.createElement('div');
      top.className = 'flex items-center justify-between gap-3';
      const left = document.createElement('span');
      left.className = 'truncate font-bold ' + (you ? 'text-cyan-300' : 'text-slate-200');
      left.textContent = '#' + (i + 1) + ' ' + p.name + (you ? ' (you)' : '');
      const right = document.createElement('span');
      right.className = 'shrink-0 text-right font-extrabold tabular-nums text-slate-100';
      right.textContent = p.correct + '✓ · ' + formatMs(p.ms);
      top.appendChild(left);
      top.appendChild(right);
      row.appendChild(top);
      row.classList.add('anim-rise');
      row.style.animationDelay = (i * 70) + 'ms';
      // Every row carries its roast caption — the roast list lives here in
      // the rankings, while the headline above is rank + the botfrag callout.
      if (roastApi && roastApi.pick) {
        const roast = roastApi.pick({
          id: p.id,
          correct: p.correct,
          answered: p.answered,
          ms: p.ms,
          rank: i + 1,
          players: board.length,
          total: multiState.limit,
          firstCorrect: first.correct,
        });
        const cap = document.createElement('p');
        cap.className = 'text-[11px] font-bold leading-snug text-slate-400';
        const capTitle = document.createElement('span');
        capTitle.className = 'font-black uppercase tracking-wide text-[#F5A623]';
        capTitle.textContent = roast.title;
        const capLine = document.createElement('span');
        capLine.textContent = ' — ' + roast.line;
        cap.appendChild(capTitle);
        cap.appendChild(capLine);
        row.appendChild(cap);
      }
      list.appendChild(row);
    }
    $('r1-note').textContent = head.note;
    showScreen('result-1v1');
  }

  function endMulti() {
    clearTimer();
    clearGrace();
    clearDisconnect();
    hidePeerAlert();
    if (!multiState || multiState.phase === 'done') return;
    multiState.phase = 'done';
    locked = true;
    showStandings();
  }

  function resetMultiState(role) {
    multiState = {
      role: role,
      me: '',
      myName: '',
      typedName: false,
      code: '',
      phase: 'lobby',
      questions: [],
      limit: 0,
      pendingCount: 0,
      myReady: false,
      countdownStarted: false,
      renamePending: false,
      localDone: false,
      pendingGrace: null,
      graceSec: 3,
      startTime: 0,
      connOpen: false,
      party: partyApi.createRoom(),
    };
  }

  // Back to the same room: code, seats and identities kept, match reset.
  // Safe to call from either side in any order; the host broadcast converges.
  function resetForRematch() {
    if (!multiState) return;
    partyApi.resetScores(multiState.party);
    multiState.phase = 'lobby';
    multiState.myReady = false;
    multiState.countdownStarted = false;
    multiState.localDone = false;
    multiState.questions = [];
    multiState.pendingGrace = null;
    locked = false;
    if (multiState.role === 'host') broadcastRoster();
    updateReadyUI();
    showScreen('multi-wait');
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

  function renderRoom() {
    if (!multiState) return;
    const n = partyApi.size(multiState.party);
    const count = $('player-count');
    if (count) count.textContent = n + ' / ' + partyApi.MAX_PLAYERS + ' joined';
    const box = $('roster');
    if (!box) return;
    box.replaceChildren();
    const ids = Object.keys(multiState.party.players);
    for (let i = 0; i < ids.length; i++) {
      const p = multiState.party.players[ids[i]];
      const you = ids[i] === multiState.me;
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 ' + (you
        ? 'border-cyan-500/30 bg-cyan-500/10'
        : 'border-slate-700/60 bg-slate-900/70');
      const left = document.createElement('span');
      left.className = 'truncate font-bold ' + (you ? 'text-cyan-200' : 'text-slate-200');
      left.textContent = p.name + (you ? ' (you)' : '')
        + (ids[i] === 'host' && multiState.me !== 'host' ? ' 👑 (host)' : '');
      const chip = document.createElement('span');
      chip.className = 'shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ' + (p.ready
        ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40'
        : 'bg-slate-800 text-slate-400 ring-1 ring-slate-700');
      chip.textContent = p.ready ? 'Ready ✓' : 'Waiting';
      row.appendChild(left);
      row.appendChild(chip);
      row.classList.add('anim-rise');
      row.style.animationDelay = (i * 50) + 'ms';
      box.appendChild(row);
    }
  }

  function broadcastRoster() {
    if (!multiState || multiState.role !== 'host') return;
    multi.send({
      type: 'roster',
      players: partyApi.rosterList(multiState.party),
      count: partyApi.size(multiState.party),
      cap: partyApi.MAX_PLAYERS,
      rounds: multiState.pendingCount,
    });
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
    } else if (multiState.role === 'guest' && multiState.code) {
      $('room-code-guest').textContent = multiState.code;
    }
    const rdisp = $('r-display');
    if (rdisp) rdisp.textContent = String(multiState.pendingCount > 0 ? multiState.pendingCount : (hostQuestionCount || ''));

    renderRoom();

    const both = partyApi.allReady(multiState.party);
    const waiting = [];
    const wids = Object.keys(multiState.party.players);
    for (let i = 0; i < wids.length; i++) {
      const wp = multiState.party.players[wids[i]];
      if (!wp.ready && wids[i] !== multiState.me) waiting.push(wp.name);
    }
    const waitingLabel = waiting.length ? waiting.join(', ') : '…';

    const linked = multiState.role === 'host' ? !!multiState.code : multiState.connOpen;
    const readyVisible = multiState.phase === 'lobby' && linked && !both;
    btn.hidden = !readyVisible;
    btn.disabled = multiState.myReady;
    btn.textContent = multiState.myReady ? 'Waiting…' : 'Ready';

    const othersReady = partyApi.size(multiState.party) >= 2 && waiting.length === 0 && !multiState.myReady;
    badge.classList.toggle('hidden', !othersReady);
    badge.hidden = !othersReady;

    const roundsTxt = multiState.pendingCount > 0 ? ' · ' + multiState.pendingCount + ' questions' : '';
    if (both) status.textContent = 'Everyone ready — starting…';
    else if (multiState.role === 'host' && partyApi.size(multiState.party) < 2 && !multiState.connOpen) {
      const qn = multiState.pendingCount || hostQuestionCount || '';
      status.textContent = 'Share this code' + (qn ? ' · ' + qn + ' questions' : '') + ' · waiting for players…';
    } else if (multiState.myReady) status.textContent = 'Waiting for: ' + waitingLabel + roundsTxt;
    else status.textContent = 'Tap Ready · waiting for: ' + waitingLabel + roundsTxt;
  }

  // Name shown to the room. Only user-typed (or previously saved) names
  // persist; random prefill/reroll values are used as-is and never stored.
  function resolveName() {
    const inp = $('player-name');
    const typed = inp && inp.value ? inp.value.trim().slice(0, 20) : '';
    if (typed) {
      const custom = nameEdited || typed === namesApi.loadCustom();
      if (custom) namesApi.saveCustom(typed);
      inp.value = typed;
      return { name: typed, typed: custom };
    }
    const saved = namesApi.loadCustom();
    if (saved) return { name: saved, typed: true };
    return { name: namesApi.randomName(), typed: false };
  }

  function maybeStartCountdown() {
    if (!multiState) return;
    if (multiState.role !== 'host') return;
    if (!partyApi.allReady(multiState.party)) return;
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
      const questions = buildQuestions(count);
      if (questions.length !== count) {
        console.warn('[1v1] build mismatch', questions.length, count);
      }
      multiState.questions = questions;
      multiState.limit = questions.length;
      multi.send({ type: 'begin', questions: questions, count: questions.length, grace: multiState.graceSec });
      beginCountdown();
    }
  }

  // Clock skew can put a rival ahead before my countdown ends.
  // If anyone already answered my current question, start the grace now.
  function someoneAhead() {
    if (!multiState) return null;
    const ids = Object.keys(multiState.party.players);
    for (let i = 0; i < ids.length; i++) {
      if (ids[i] === multiState.me) continue;
      const p = multiState.party.players[ids[i]];
      if (p.answered > current) return p;
    }
    return null;
  }

  function punchCountdown() {
    const el = $('countdown-num');
    el.classList.remove('cd-punch');
    void el.offsetWidth;
    el.classList.add('cd-punch');
  }

  function beginCountdown() {
    showScreen('play');
    showMultiPlayChrome();
    $('choices').replaceChildren();
    $('equation').textContent = '…';
    hidePeerAlert();
    clearGo();
    const cdOverlay = $('overlay-countdown');
    cdOverlay.classList.remove('hidden');
    cdOverlay.hidden = false;
    $('countdown-num').textContent = '3';

    // Local duration, not a host timestamp: phone clocks differ by seconds,
    // so a shared absolute deadline starts everyone at different times.
    const deadline = Date.now() + COUNTDOWN_MS;
    const tick = setInterval(function () {
      const left = deadline - Date.now();
      if (left <= 0) {
        clearInterval(tick);
        if (!multiState) {
          hideCountdown();
          return;
        }
        $('countdown-num').textContent = 'GO!';
        punchCountdown();
        goTimer = setTimeout(function () {
          goTimer = null;
          hideCountdown();
          if (!multiState) return;
          multiState.phase = 'playing';
          multiState.startTime = Date.now();
          current = 0;
          correct = 0;
          total = 0;
          locked = false;
          nextQuestion();
        }, GO_MS);
      } else {
        const n = Math.min(3, Math.ceil(left / 1000));
        const txt = String(Math.max(1, n));
        if ($('countdown-num').textContent !== txt) {
          $('countdown-num').textContent = txt;
          punchCountdown();
        }
      }
    }, 100);
  }

  function hideCountdown() {
    const cdOverlay = $('overlay-countdown');
    cdOverlay.classList.add('hidden');
    cdOverlay.hidden = true;
  }

  // Guest-only: the host link dropped. Mid-round stragglers are removed, not waited on.
  function startDisconnectGrace() {
    if (!multiState) return;
    if (multiState.phase === 'lobby') return;
    if (disconnectTimer !== null) return;
    if (multiState.phase === 'done') return;

    $('overlay-disconnect').classList.remove('hidden');
    $('overlay-disconnect').hidden = false;
    let n = DISCONNECT_GRACE_MS;
    $('disconnect-count').textContent = String(n);
    disconnectTimer = setInterval(function () {
      n -= 1;
      $('disconnect-count').textContent = String(Math.max(0, n));
      if (n <= 0) {
        clearDisconnect();
        enterMultiSetup(); // re-rolls an unsaved random name
        showMultiError('Room closed.');
      }
    }, 1000);
  }

  function cleanupMulti() {
    multiState = null;
    clearTimer();
    clearGo();
    clearGrace();
    clearDisconnect();
    hidePeerAlert();
    multi.leave();
    locked = false;
    hideCountdown();
    $('multi-bars').classList.add('hidden');
    $('btn-leave-1v1').hidden = true;
  }

  // QR share page: encodes this page's own URL, so the code is always
  // right on localhost, LAN, or the live deploy with zero config.
  function enterQr() {
    const url = window.location.href;
    const img = $('qr-img');
    if (img) {
      img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data='
        + encodeURIComponent(url);
    }
    const label = $('qr-url');
    if (label) label.textContent = url;
    showScreen('qr');
  }

  function enterMultiSetup() {
    cleanupMulti();    clearMultiError();
    $('multi-code').value = '';
    const nameInp = $('player-name');
    if (nameInp) nameInp.value = namesApi.loadCustom() || namesApi.randomName();
    nameEdited = false;
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
    $('ready-badge').hidden = true;
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
      multiState.me = 'host';
      multiState.code = code;
      multiState.phase = 'lobby';
      multiState.connOpen = true;
      if (multiState.myName) {
        partyApi.addPlayer(multiState.party, 'host', multiState.myName);
      }
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
    });

    multi.on('connected', function () {
      if (!multiState || multiState.role !== 'guest') return;
      multiState.connOpen = true;
      multi.send({ type: 'hello', name: multiState.myName });
      updateReadyUI();
    });

    multi.on('hello', function (data) {
      if (!multiState || multiState.role !== 'host') return;
      const from = data && data.from;
      if (!from || multiState.party.players[from]) {
        updateReadyUI();
        return;
      }
      if (multiState.phase !== 'lobby') {
        multi.sendTo(from, { type: 'error', error: 'room-started' });
        multi.drop(from);
        return;
      }
      if (partyApi.size(multiState.party) >= partyApi.MAX_PLAYERS) {
        multi.sendTo(from, { type: 'error', error: 'room-full' });
        multi.drop(from);
        return;
      }
      const finalName = namesApi.uniqueName(data.name, partyApi.names(multiState.party));
      partyApi.addPlayer(multiState.party, from, finalName);
      multi.sendTo(from, { type: 'welcome', id: from, name: finalName });
      broadcastRoster();
      updateReadyUI();
    });

    multi.on('welcome', function (data) {
      if (!multiState || multiState.role !== 'guest') return;
      multiState.me = data.id;
      partyApi.addPlayer(multiState.party, data.id, data.name);
      if (multiState.typedName) namesApi.saveCustom(data.name);
      const inp = $('player-name');
      if (inp) inp.value = data.name;
      const gInp = $('guest-name');
      if (gInp) gInp.value = data.name;
    });

    multi.on('roster', function (data) {
      if (!multiState || multiState.role !== 'guest') return;
      partyApi.syncRoster(multiState.party, data.players);
      if (Number.isFinite(Number(data.rounds))) {
        multiState.pendingCount = Math.max(1, Math.min(500, Number(data.rounds)));
      }
      // Adopt a host-confirmed rename: the roster echo is the source of
      // truth (it may carry an auto-suffixed variant on collision).
      const me = multiState.me && multiState.party.players[multiState.me];
      if (me && me.name && me.name !== multiState.myName) {
        multiState.myName = me.name;
        const gInp = $('guest-name');
        if (gInp && document.activeElement !== gInp) gInp.value = me.name;
        if (multiState.renamePending) {
          multiState.renamePending = false;
          namesApi.saveCustom(me.name);
        }
      }
      if (multiState.phase === 'lobby') updateReadyUI();
      else {
        renderBars();
        maybeEndMulti();
      }
    });

    multi.on('ready', function (data) {
      if (!multiState || multiState.role !== 'host') return;
      partyApi.setReady(multiState.party, data.from, true);
      broadcastRoster();
      updateReadyUI();
      maybeStartCountdown();
    });

    // Guest lobby rename. Host dedupes against everyone else, applies it,
    // and the next roster broadcast echoes the final name back.
    multi.on('rename', function (data) {
      if (!multiState || multiState.role !== 'host') return;
      if (multiState.phase !== 'lobby') return;
      const from = data && data.from;
      if (!from || !multiState.party.players[from]) return;
      const want = String(data.name == null ? '' : data.name).trim().slice(0, 20);
      if (!want) return;
      const ids = Object.keys(multiState.party.players);
      const taken = [];
      for (let i = 0; i < ids.length; i++) {
        if (ids[i] !== from) taken.push(multiState.party.players[ids[i]].name);
      }
      if (!partyApi.setName(multiState.party, from, namesApi.uniqueName(want, taken))) return;
      broadcastRoster();
      updateReadyUI();
    });

    multi.on('begin', function (data) {
      if (!multiState || multiState.role !== 'guest') return;
      multiState.questions = data.questions || [];
      multiState.limit = multiState.questions.length;
      if (Number.isFinite(Number(data.count))) {
        multiState.pendingCount = Math.max(1, Math.min(500, Number(data.count)));
      }
      multiState.graceSec = Number.isFinite(Number(data.grace)) ? Math.max(0, Math.min(10, Number(data.grace))) : 3;
      beginCountdown();
    });

    multi.on('answered', function (data) {
      if (!multiState) return;
      const from = data && data.from;
      if (!from || from === multiState.me) return;
      if (multiState.phase === 'lobby' || multiState.phase === 'done') return;
      multi.relay(data, from); // host fans out; guests have a single conn so this is a no-op for them
      if (!partyApi.applyAnswered(multiState.party, from, data)) return;
      renderBars();
      maybeStartAnswerGrace(data); // gates on phase + index internally
      maybeEndMulti();
    });

    multi.on('left', function (data) {
      if (!multiState) return;
      const from = data && data.from;
      if (from === 'host' && multiState.role === 'guest') {
        enterMultiSetup(); // re-rolls an unsaved random name
        showMultiError('Room closed.');
        return;
      }
      if (multiState.role !== 'host') return;
      multi.drop(from);
      if (partyApi.removePlayer(multiState.party, from)) {
        broadcastRoster();
        if (multiState.phase === 'lobby') updateReadyUI();
        else {
          renderBars();
          maybeEndMulti();
        }
      }
    });

    multi.on('peer-closed', function (peerId) {
      if (!multiState) return;
      if (multiState.role === 'host') {
        multi.drop(peerId);
        if (partyApi.removePlayer(multiState.party, peerId)) {
          broadcastRoster();
          if (multiState.phase === 'lobby') updateReadyUI();
          else {
            renderBars();
            maybeEndMulti();
          }
        }
        return;
      }
      if (multiState.phase === 'lobby') {
        enterMultiSetup(); // re-rolls an unsaved random name
        showMultiError('Connection lost. Room closed.');
        return;
      }
      startDisconnectGrace();
    });

    multi.on('error', function (type) {
      if (type && typeof type === 'object') {
        const code = type.error;
        const msg = code === 'room-started'
          ? 'Game already started. Ask the host for a new room.'
          : code === 'room-full'
            ? 'Room is full. Ask the host for a new room.'
            : 'Connection error: ' + (code || 'unknown');
        enterMultiSetup(); // re-rolls an unsaved random name
        showMultiError(msg);
        return;
      }
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
        enterMultiSetup(); // re-rolls an unsaved random name
        showMultiError(msg);
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

  const langIdBtn = $('lang-id');
  const langEnBtn = $('lang-en');
  if (langIdBtn) langIdBtn.addEventListener('click', function () { applyLang('id'); });
  if (langEnBtn) langEnBtn.addEventListener('click', function () { applyLang('en'); });
  $('btn-stop').addEventListener('click', endGame);
  $('btn-home').addEventListener('click', function () {
    cleanupMulti();
    showScreen('home');
  });
  $('btn-1v1-home').addEventListener('click', function () {
    if (multiState && multiState.role === 'host') multi.send({ type: 'left', from: 'host' });
    cleanupMulti();
    showScreen('home');
  });

  $('btn-1v1-rematch').addEventListener('click', function () {
    resetForRematch();
  });

  $('btn-multi').addEventListener('click', enterMultiSetup);
  $('btn-qr').addEventListener('click', enterQr);
  $('btn-qr-back').addEventListener('click', function () {
    showScreen('home');
  });
  $('btn-multi-back').addEventListener('click', function () {
    cleanupMulti();
    showScreen('home');
  });

  $('btn-create-room').addEventListener('click', function () {
    clearMultiError();
    const count = readHostCount();
    hostQuestionCount = count;
    if ($('multi-q-count')) $('multi-q-count').value = String(count);
    const disp = $('q-display');
    if (disp) disp.textContent = String(count);
    const resolved = resolveName();
    enterMultiWait('host');
    multiState.myName = resolved.name;
    multiState.typedName = resolved.typed;
    partyApi.addPlayer(multiState.party, 'host', resolved.name);
    multiState.me = 'host';
    multiState.pendingCount = count;
    multiState.limit = count;
    multiState.graceSec = readGraceDur();
    setGraceDur(multiState.graceSec);
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
      if (multiState && multiState.role === 'host' && multiState.phase === 'lobby') {
        multiState.pendingCount = c;
        multiState.limit = c;
        broadcastRoster();
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
      if (multiState && multiState.role === 'host' && multiState.phase === 'lobby') {
        multiState.pendingCount = c;
        multiState.limit = c;
        broadcastRoster();
        updateReadyUI();
      }
    });
    qPlus.addEventListener('click', function () {
      const c = Math.min(500, (hostQuestionCount || readHostCount()) + 1);
      setHostCount(c);
      if (multiState && multiState.role === 'host' && multiState.phase === 'lobby') {
        multiState.pendingCount = c;
        multiState.limit = c;
        broadcastRoster();
        updateReadyUI();
      }
    });
  }

  // Host rounds stepper inside the live lobby (setup screen is gone mid-room).
  function nudgeLobbyRounds(delta) {
    if (!multiState || multiState.role !== 'host' || multiState.phase !== 'lobby') return;
    const base = multiState.pendingCount > 0 ? multiState.pendingCount : (hostQuestionCount || 10);
    const c = Math.max(1, Math.min(500, base + delta));
    hostQuestionCount = c;
    multiState.pendingCount = c;
    multiState.limit = c;
    broadcastRoster();
    updateReadyUI();
  }

  const rMinus = $('r-minus');
  const rPlus = $('r-plus');
  if (rMinus && rPlus) {
    rMinus.addEventListener('click', function () { nudgeLobbyRounds(-1); });
    rPlus.addEventListener('click', function () { nudgeLobbyRounds(1); });
  }

  const graceInput = $('grace-count');
  if (graceInput) {
    graceInput.addEventListener('change', function () {
      const g = readGraceDur();
      setGraceDur(g);
      this.value = String(hostGraceSec);
    });
  }

  const gMinus = $('g-minus');
  const gPlus = $('g-plus');
  if (gMinus && gPlus) {
    gMinus.addEventListener('click', function () {
      setGraceDur((Number.isFinite(hostGraceSec) ? hostGraceSec : readGraceDur()) - 1);
    });
    gPlus.addEventListener('click', function () {
      setGraceDur((Number.isFinite(hostGraceSec) ? hostGraceSec : readGraceDur()) + 1);
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
    const resolved = resolveName();
    enterMultiWait('guest');
    multiState.code = code; // keep the typed code for the wait display (+ rematch)
    multiState.myName = resolved.name;
    multiState.typedName = resolved.typed;
    $('wait-status-guest').textContent = 'Connecting…';
    multi.joinRoom(code);
  });

  const nameInput = $('player-name');
  if (nameInput) {
    nameInput.addEventListener('change', function () {
      const v = this.value.trim().slice(0, 20);
      this.value = v;
      nameEdited = v !== '';
      if (v) namesApi.saveCustom(v);
    });
  }

  const rerollBtn = $('btn-reroll-name');
  if (rerollBtn) {
    rerollBtn.addEventListener('click', function () {
      const inp = $('player-name');
      if (!inp) return;
      inp.value = namesApi.randomName();
      nameEdited = false;
    });
  }

  $('multi-code').addEventListener('input', function () {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  });

  function bindCopyCode(btnId, codeElId) {
    const btn = $(btnId);
    if (!btn) return;
    btn.addEventListener('click', function () {
      const codeEl = $(codeElId);
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
        btn.textContent = 'Copied';
        setTimeout(function () {
          btn.textContent = 'Copy';
        }, 1200);
      }).catch(function () {
        btn.textContent = 'Select code';
        setTimeout(function () {
          btn.textContent = 'Copy';
        }, 2000);
      });
    });
  }

  bindCopyCode('btn-copy-code', 'room-code');
  bindCopyCode('btn-copy-code-guest', 'room-code-guest');

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
    partyApi.setReady(multiState.party, multiState.me, true);
    if (multiState.role === 'host') {
      broadcastRoster();
      updateReadyUI();
      maybeStartCountdown();
    } else {
      multi.send({ type: 'ready' });
      updateReadyUI();
    }
  });

  function sendGuestRename() {
    if (!multiState || multiState.role !== 'guest' || multiState.phase !== 'lobby') return;
    if (!multiState.connOpen) {
      showMultiError('Not connected yet.');
      return;
    }
    const inp = $('guest-name');
    const v = inp ? inp.value.trim().slice(0, 20) : '';
    if (!v) {
      showMultiError('Type a name first.');
      return;
    }
    multiState.renamePending = true;
    multi.send({ type: 'rename', name: v });
  }

  const guestNameBtn = $('btn-guest-name');
  if (guestNameBtn) guestNameBtn.addEventListener('click', sendGuestRename);
  const guestNameInp = $('guest-name');
  if (guestNameInp) guestNameInp.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      sendGuestRename();
    }
  });

  $('btn-cancel-multi').addEventListener('click', function () {
    cleanupMulti();
    showScreen('home');
  });

  $('btn-leave-1v1').addEventListener('click', function () {
    const me = multiState ? multiState.me : '';
    multi.send({ type: 'left', from: me || 'host' });
    cleanupMulti();
    showScreen('home');
  });

  $('btn-dc-home').addEventListener('click', function () {
    const me = multiState ? multiState.me : '';
    multi.send({ type: 'left', from: me || 'host' });
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
    setGraceDur(loadGraceDur(), false);
    applyLang(loadLang());
  })();
})();
