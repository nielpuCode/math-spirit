import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { generateProblem, generateChoices } = require('../js/generator.js');

for (let i = 0; i < 300; i++) {
  const p = generateProblem();
  const choices = generateChoices(p);

  assert.ok(['+', '−', '×', '÷'].includes(p.op), `op ${p.op}`);
  assert.ok(Number.isInteger(p.a) && Number.isInteger(p.b), 'operands integer');
  assert.ok(Number.isInteger(p.answer), 'answer integer');
  assert.ok(p.a >= 10 && p.a <= 99, `a=${p.a}`);
  assert.ok(p.b >= 2 && p.b <= 99, `b=${p.b}`);
  assert.equal(choices.length, 5, `choices len ${choices.length}`);
  assert.equal(new Set(choices).size, 5, 'choices unique');
  assert.ok(choices.includes(p.answer), 'contains correct');

  if (p.op === '+') assert.equal(p.answer, p.a + p.b);
  if (p.op === '−') assert.equal(p.answer, p.a - p.b);
  if (p.op === '×') assert.equal(p.answer, p.a * p.b);
  if (p.op === '÷') assert.equal(p.a % p.b, 0);
}

console.log('generator ok: 300 problems');
