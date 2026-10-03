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

  function generateProblem() {
    return pick([genAdd, genSub, genMul, genDiv])();
  }

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
    randInt: randInt,
    pick: pick,
    shuffle: shuffle,
    digitShuffle: digitShuffle,
    generateProblem: generateProblem,
    generateChoices: generateChoices,
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MathSprintGen = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
