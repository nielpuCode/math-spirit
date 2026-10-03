// ponytail: state machine in one module. Ceiling: no settings persistence, no sound, no streaks.
// Upgrade path: localStorage for count/mode; add streak UI only if playtests ask.
(function () {
  const gen = globalThis.MathSprintGen;
  const generateProblem = gen.generateProblem;
  const generateChoices = gen.generateChoices;

  const $ = function (id) {
    return document.getElementById(id);
  };
  const SCREENS = ['home', 'play', 'result'];
  const FEEDBACK_MS = 550;
  const OP_CLASS = { '+': 'op-plus', '−': 'op-sub', '×': 'op-mul', '÷': 'op-div' };

  let timer = null;
  let locked = false;
  let mode = 'fixed';
  let limit = 20;
  let current = 0;
  let correct = 0;
  let total = 0;

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

  function updateLive() {
    $('live-score').textContent =
      mode === 'infinite'
        ? '✓ ' + correct + '  /  ' + total
        : 'Q ' + Math.min(current + 1, limit) + ' / ' + limit;
  }

  function startGame() {
    clearTimer();
    mode = $('q-infinite').checked ? 'infinite' : 'fixed';
    limit = Math.max(1, Math.min(500, Number.parseInt($('q-count').value, 10) || 20));
    $('q-count').value = String(limit);
    current = 0;
    correct = 0;
    total = 0;
    locked = false;
    $('play-meta').classList.toggle('hidden', mode !== 'infinite');
    $('play-meta').classList.toggle('flex', mode === 'infinite');
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

  function nextQuestion() {
    locked = false;
    if (mode === 'fixed' && current >= limit) {
      endGame();
      return;
    }

    const problem = generateProblem();
    const choices = generateChoices(problem);
    renderEquation(problem);

    const box = $('choices');
    box.replaceChildren();
    for (let i = 0; i < choices.length; i++) {
      const value = choices[i];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = String(value);
      btn.className =
        'choice-btn col-span-2 flex min-h-12 items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-900/90 px-2 py-3 text-[clamp(1rem,4.2vw,1.5rem)] font-extrabold tabular-nums text-slate-100 shadow-md shadow-slate-950/40 transition hover:border-slate-500 hover:bg-slate-800 active:scale-[0.97] disabled:cursor-default disabled:hover:border-slate-700/80 disabled:hover:bg-slate-900/90';
      if (i === 3) btn.classList.add('col-start-2');
      if (i === 4) btn.classList.add('col-start-4');
      btn.addEventListener('click', function () {
        onAnswer(btn, value, problem);
      });
      box.appendChild(btn);
    }
    updateLive();
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

    updateLive();
    timer = setTimeout(function () {
      timer = null;
      if (mode === 'fixed' && current >= limit) endGame();
      else nextQuestion();
    }, FEEDBACK_MS);
  }

  function endGame() {
    clearTimer();
    locked = true;
    const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
    $('result-score').textContent = correct + ' / ' + total;
    $('result-detail').textContent = pct + '%' + (mode === 'infinite' ? ' · stopped early' : '');
    showScreen('result');
  }

  $('q-infinite').addEventListener('change', function () {
    $('q-count').disabled = $('q-infinite').checked;
  });

  $('btn-play').addEventListener('click', startGame);
  $('btn-again').addEventListener('click', startGame);
  $('btn-stop').addEventListener('click', endGame);
  $('btn-home').addEventListener('click', function () {
    clearTimer();
    showScreen('home');
  });
})();
