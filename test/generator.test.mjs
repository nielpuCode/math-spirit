import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { generateProblem, generateChoices, fmt, fmtPct, pctFinal, WORDS } = require('../js/generator.js');

// locale formatting is display-correct in both languages
assert.equal(fmt(47623, 'id'), '47.623');
assert.equal(fmt(47623, 'en'), '47,623');
assert.equal(fmt(1999, 'id'), '1.999');
assert.equal(fmt(47, 'id'), '47');
assert.equal(fmtPct(125, 'id'), '12,5%');
assert.equal(fmtPct(125, 'en'), '12.5%');
assert.equal(fmtPct(500, 'id'), '50%');
// cashier rounding: 47623 - 12.5% = 41670.125 -> 41670
assert.equal(pctFinal(47623, 125, true), 41670);
assert.equal(pctFinal(19999, 100, true), 17999);

const seenOp = {};
const seenLifeLang = {};
for (let i = 0; i < 1600; i++) {
  const lang = i % 2 ? 'en' : 'id';
  const p = generateProblem(lang, 'hard');
  const choices = generateChoices(p);
  seenOp[p.op] = true;

  assert.ok(Number.isInteger(p.answer), `answer integer ${p.op}`);
  assert.equal(choices.length, 5, `choices len ${choices.length}`);
  assert.equal(new Set(choices).size, 5, 'choices unique');
  assert.ok(choices.includes(p.answer), 'contains correct');

  if (p.op === '+') assert.equal(p.answer, p.a + p.b);
  if (p.op === '−') assert.equal(p.answer, p.a - p.b);
  if (p.op === '×') assert.equal(p.answer, p.a * p.b);
  if (p.op === '÷') assert.equal(p.a % p.b, 0);

  // classic head-math ranges are unchanged (no text field on those)
  if (!p.text && ['+', '−', '×'].includes(p.op)) {
    assert.ok(p.a >= 10 && p.a <= 99, `classic a=${p.a}`);
    assert.ok(p.b >= 10 && p.b <= 99, `classic b=${p.b}`);
  }
  if (!p.text && p.op === '÷') {
    assert.ok(p.a >= 10 && p.a <= 99, `classic a=${p.a}`);
    assert.ok(p.b >= 2 && p.b <= 99, `classic b=${p.b}`);
  }

  // real-life kinds carry story text in the active language, phone-width
  if (['%', 'off', 'fee'].includes(p.op) || p.text) {
    assert.ok(typeof p.text === 'string' && p.text.length > 0, 'story text');
    assert.ok(p.text.length <= 16, `fits phone: ${p.text}`);
    assert.ok(typeof p.sub === 'string' && p.sub.length > 0, 'caption');
    assert.equal(p.fmt, lang, 'formats in active language');
    assert.equal(p.lang, lang);
    seenLifeLang[p.op + ':' + lang] = true;
  }
  if (p.op === '%') {
    assert.equal(p.answer * 1000, p.a * p.b, 'percent exact');
    assert.ok(p.text.includes(WORDS[lang].of), `says ${WORDS[lang].of}: ${p.text}`);
  }
  if (p.op === 'off') {
    assert.equal(p.answer, Math.floor((p.a * (1000 - p.b) + 500) / 1000), 'discount rounded');
  }
  if (p.op === 'fee') {
    assert.equal(p.answer, Math.floor((p.a * (1000 + p.b) + 500) / 1000), 'fee rounded');
  }
}

// every kind appears, in both languages for story kinds
for (const op of ['+', '−', '×', '÷', '%', 'off', 'fee']) {
  assert.ok(seenOp[op], 'kind covered: ' + op);
}
for (const op of ['%', 'off', 'fee']) {
  assert.ok(seenLifeLang[op + ':id'], op + ' in ID');
  assert.ok(seenLifeLang[op + ':en'], op + ' in EN');
}

// normal mode: speed-friendly easy ops only, rounded numbers, never charm
// prices or decimal percents
for (let i = 0; i < 800; i++) {
  const lang = i % 2 ? 'en' : 'id';
  const p = generateProblem(lang, 'normal');
  const choices = generateChoices(p);
  assert.ok(Number.isInteger(p.answer), 'normal integer');
  assert.equal(choices.length, 5);
  assert.ok(choices.includes(p.answer));
  if (!p.text) assert.ok(['+', '−'].includes(p.op), `normal classic easy: ${p.op}`);
  else assert.ok(['+', '−', '÷'].includes(p.op), `normal story easy: ${p.op}`);
  if (['off', 'fee'].includes(p.op)) assert.equal(p.a % 1000, 0, `rounded price: ${p.a}`);
  if (p.op === '%') assert.equal(p.a % 10, 0, `whole percent: ${p.a}`);
  if (p.op === '+' && p.text) assert.ok(p.a % 1000 === 0 && p.b % 1000 === 0, 'rounded rupiah');
  if (p.op === '−' && p.text) assert.ok(p.a % 1000 === 0 && p.b % 1000 === 0, 'rounded change');
  if (p.op === '÷' && p.text) assert.equal(p.answer % 1000, 0, 'rounded split');
  if (p.text) assert.ok(p.text.length <= 16, `fits phone: ${p.text}`);
}

// hard mode: tricky kinds (x, /, %, off, fee) dominate instead of plain +/-
let hardKinds = 0;
for (let i = 0; i < 600; i++) {
  const p = generateProblem(i % 2 ? 'en' : 'id', 'hard');
  assert.ok(Number.isInteger(p.answer), 'hard integer');
  if (['×', '÷', '%', 'off', 'fee'].includes(p.op)) hardKinds++;
}
assert.ok(hardKinds / 600 > 0.6, `hard intensity: ${hardKinds}/600`);

console.log('generator ok: classic + bilingual real-life kinds');
