// ponytail: pure generator — no DOM. Ceiling: heuristic traps, not real learner-error data.
// Upgrade path: log missed answers, weight traps by frequency.
(function (root) {
  const OPS = ['+', '−', '×', '÷'];

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(items) {
    return items[randInt(0, items.length - 1)];
  }

  function shuffle(items) {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function digitShuffle(n) {
    const sign = n < 0 ? -1 : 1;
    const abs = Math.abs(n);
    if (abs < 10) return sign * (abs + 1);
    const chars = String(abs).split('');
    const i = randInt(0, chars.length - 1);
    let j = randInt(0, chars.length - 1);
    if (i === j) j = (j + 1) % chars.length;
    const tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
    return sign * Number(chars.join(''));
  }

  function genAdd() {
    const a = randInt(10, 99);
    const b = randInt(10, 99);
    return { a: a, b: b, op: '+', answer: a + b };
  }

  function genSub() {
    const a = randInt(10, 99);
    const b = randInt(10, 99);
    return { a: a, b: b, op: '−', answer: a - b };
  }

  function genMul() {
    const a = randInt(10, 99);
    const b = randInt(10, 99);
    return { a: a, b: b, op: '×', answer: a * b };
  }

  function genDiv() {
    if (Math.random() < 0.65) {
      const b = randInt(2, 9);
      const qMin = Math.max(2, Math.ceil(10 / b));
      const qMax = Math.floor(99 / b);
      if (qMin > qMax) return genDiv();
      const q = randInt(qMin, qMax);
      return { a: b * q, b: b, op: '÷', answer: q };
    }
    const pairs = [];
    for (let b = 10; b <= 99; b++) {
      for (let q = 2; q <= 9; q++) {
        const a = b * q;
        if (a >= 10 && a <= 99) pairs.push({ a: a, b: b, op: '÷', answer: q });
      }
    }
    if (!pairs.length) return genDiv();
    return pick(pairs);
  }

  function generateProblem(lang) {
    return pick(MIX)(langOf(lang));
  }

  // ---- Real-life bilingual kinds: percent, discount/fee, rupiah, split ----

  var WORDS = {
    id: { of: 'dari', percent: 'PERSEN', off: 'DISKON', fee: 'SERVIS', groceries: 'JAJAN', change: 'KEMBALIAN', split: 'PATUNGAN' },
    en: { of: 'of', percent: 'PERCENT', off: 'DISCOUNT', fee: 'SERVICE', groceries: 'GROCERIES', change: 'CHANGE', split: 'SPLIT BILL' },
  };

  function langOf(l) {
    return l === 'en' ? 'en' : 'id';
  }

  // Display-only grouping, locale-correct: 47623 -> '47.623' (id) / '47,623' (en).
  function fmt(n, lang) {
    const sep = langOf(lang) === 'en' ? ',' : '.';
    const neg = n < 0 ? '-' : '';
    const digits = String(Math.abs(Math.trunc(n)));
    let out = '';
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && (digits.length - i) % 3 === 0) out += sep;
      out += digits[i];
    }
    return neg + out;
  }

  // Percent stored as integer tenths: 125 -> '12,5%' (id) / '12.5%' (en).
  function fmtPct(tenths, lang) {
    const dec = langOf(lang) === 'en' ? '.' : ',';
    const whole = Math.floor(tenths / 10);
    const frac = tenths % 10;
    return whole + (frac ? dec + frac : '') + '%';
  }

  const PCT_TENTHS = [50, 75, 100, 125, 150, 200, 250, 300, 500, 750];

  function genPct(lang) {
    const L = langOf(lang);
    const W = WORDS[L];
    for (let i = 0; i < 60; i++) {
      const t = pick(PCT_TENTHS);
      const ans = randInt(6, 240);
      if ((ans * 1000) % t !== 0) continue;
      const base = (ans * 1000) / t;
      if (base < 20 || base > 999) continue;
      return { op: '%', a: t, b: base, answer: ans, lang: L, fmt: L,
        text: fmtPct(t, L) + ' ' + W.of + ' ' + fmt(base, L), sub: W.percent };
    }
    const ans = randInt(6, 240); // fallback: 50% always divides cleanly
    return { op: '%', a: 500, b: ans * 2, answer: ans, lang: L, fmt: L,
      text: fmtPct(500, L) + ' ' + W.of + ' ' + fmt(ans * 2, L), sub: W.percent };
  }

  function charmPrice() {
    const r = Math.random();
    if (r < 0.3) return randInt(2, 250) * 1000 - 1; // 1.999 .. 249.999
    if (r < 0.55) return randInt(2, 250) * 1000 - 500; // round .500
    if (r < 0.8) return randInt(10, 2500) * 100; // round hundreds
    return randInt(1000, 250000); // anything, e.g. 47.623
  }

  // Cashier rounding in integer math only: half-up to whole rupiah.
  function pctFinal(price, tenths, down) {
    const num = down ? 1000 - tenths : 1000 + tenths;
    return Math.floor((price * num + 500) / 1000);
  }

  const OFF_TENTHS = [50, 75, 100, 125, 150, 200, 250, 500];

  function genOff(lang) {
    const L = langOf(lang);
    const W = WORDS[L];
    const price = charmPrice();
    const t = pick(OFF_TENTHS);
    return { op: 'off', a: price, b: t, answer: pctFinal(price, t, true), lang: L, fmt: L,
      text: fmt(price, L) + ' −' + fmtPct(t, L), sub: W.off };
  }

  function genFee(lang) {
    const L = langOf(lang);
    const W = WORDS[L];
    const price = charmPrice();
    const t = pick(OFF_TENTHS);
    return { op: 'fee', a: price, b: t, answer: pctFinal(price, t, false), lang: L, fmt: L,
      text: fmt(price, L) + ' +' + fmtPct(t, L), sub: W.fee };
  }

  function genRpAdd(lang) {
    const L = langOf(lang);
    const W = WORDS[L];
    const a = randInt(2000, 99999); // text budget: '99.999 + 99.999' = 15 chars
    const b = randInt(2000, 99999);
    return { op: '+', a: a, b: b, answer: a + b, lang: L, fmt: L,
      text: fmt(a, L) + ' + ' + fmt(b, L), sub: W.groceries };
  }

  function genRpSub(lang) {
    const L = langOf(lang);
    const W = WORDS[L];
    const a = randInt(5000, 99999); // text budget: '99.999 − 99.999' = 15 chars
    const b = randInt(1000, a);
    return { op: '−', a: a, b: b, answer: a - b, lang: L, fmt: L,
      text: fmt(a, L) + ' − ' + fmt(b, L), sub: W.change };
  }

  function genSplit(lang) {
    const L = langOf(lang);
    const W = WORDS[L];
    const n = randInt(2, 9);
    const q = randInt(2000, 30000);
    return { op: '÷', a: n * q, b: n, answer: q, lang: L, fmt: L,
      text: fmt(n * q, L) + ' ÷ ' + n, sub: W.split };
  }

  // ~55% classic head-math, ~45% real-life. Tune the ratio here.
  const MIX = [genAdd, genSub, genMul, genDiv, genAdd, genSub, genMul,
    genPct, genOff, genFee, genRpAdd, genRpSub, genSplit];

  function collectTraps(problem) {
    const a = problem.a;
    const b = problem.b;
    const op = problem.op;
    const answer = problem.answer;
    const raw = [];

    if (op === '+') {
      const noCarry = (a % 10 + b % 10) + (Math.floor(a / 10) + Math.floor(b / 10)) * 10;
      raw.push(noCarry, answer + 10, answer - 10, a, b, answer + 1, answer - 1);
    } else if (op === '−') {
      raw.push(
        a + b,
        -answer,
        Math.abs(answer),
        (a % 10 - b % 10) + (Math.floor(a / 10) - Math.floor(b / 10)) * 10,
        answer + 1,
        answer - 1,
      );
    } else if (op === '×') {
      raw.push(
        answer * 10,
        a + b,
        a * (b + 1),
        a * (b - 1),
        (a + 1) * b,
        (a - 1) * b,
        a * (Math.floor(b / 10) * 10 || 10),
        answer + 10,
        answer - 10,
      );
    } else if (op === '÷') {
      raw.push(
        a * b,
        answer * 10,
        answer + 1,
        answer - 1,
        Math.floor(a / (b + 1)),
        Math.floor(a / Math.max(2, b - 1)),
        Math.floor(a / 10),
      );
    } else if (op === '%') {
      raw.push(
        b - answer, // answered the remainder instead of the percent
        answer + 10,
        answer - 10,
      );
      if (a % 10 === 0) raw.push(a / 10); // echoed the percent itself
    } else if (op === 'off') {
      raw.push(
        a, // forgot to take the discount
        a - Math.round(b / 10), // subtracted the percent itself
        answer + 1000,
        answer - 1000,
      );
    } else if (op === 'fee') {
      raw.push(
        a, // forgot to add the fee
        a - Math.round(b / 10), // subtracted instead of adding
        answer + 1000,
        answer - 1000,
      );
    }

    raw.push(answer + 1, answer - 1, answer + 10, answer - 10, answer + 100, answer - 100);
    if (answer !== 0) {
      raw.push(digitShuffle(answer), -digitShuffle(answer), answer * 10, Math.floor(answer / 10));
      if (answer >= 10) raw.push(Math.abs(answer) + 1, Math.abs(answer) - 1);
    } else {
      raw.push(1, -1, 10, -10, 2, -2);
    }

    return raw;
  }

  function uniqueNear(correct, candidates) {
    const seen = new Set([correct]);
    const out = [];
    for (let i = 0; i < candidates.length; i++) {
      const value = candidates[i];
      if (!Number.isFinite(value) || seen.has(value)) continue;
      seen.add(value);
      out.push(value);
      if (out.length >= 4) return out;
    }
    let pad = 1;
    while (out.length < 4) {
      const batch = [correct + pad, correct - pad, correct + pad * 10, correct - pad * 10];
      for (let i = 0; i < batch.length; i++) {
        const value = batch[i];
        if (seen.has(value)) continue;
        seen.add(value);
        out.push(value);
        if (out.length >= 4) return out;
      }
      pad += 1;
    }
    return out;
  }

  function generateChoices(problem) {
    const traps = uniqueNear(problem.answer, collectTraps(problem));
    return shuffle([problem.answer].concat(traps));
  }

  const api = {
    OPS: OPS,
    WORDS: WORDS,
    randInt: randInt,
    pick: pick,
    shuffle: shuffle,
    digitShuffle: digitShuffle,
    fmt: fmt,
    fmtPct: fmtPct,
    pctFinal: pctFinal,
    generateProblem: generateProblem,
    generateChoices: generateChoices,
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MathSprintGen = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
