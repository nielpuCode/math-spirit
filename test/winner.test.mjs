import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { decideWinner, makeCode } = require('../js/multi.js');

assert.equal(decideWinner({ correct: 8, ms: 12000 }, { correct: 6, ms: 9000 }), 'a');
assert.equal(decideWinner({ correct: 5, ms: 12000 }, { correct: 7, ms: 99000 }), 'b');
assert.equal(decideWinner({ correct: 7, ms: 15000 }, { correct: 7, ms: 12000 }), 'b');
assert.equal(decideWinner({ correct: 7, ms: 11000 }, { correct: 7, ms: 12000 }), 'a');
assert.equal(decideWinner({ correct: 7, ms: 12000 }, { correct: 7, ms: 12000 }), 'draw');
assert.equal(decideWinner({ correct: 9, ms: 5000, disconnected: true }, { correct: 1, ms: 99000 }), 'b');
assert.equal(decideWinner({ correct: 1, ms: 99000 }, { correct: 9, ms: 5000, disconnected: true }), 'a');
assert.equal(decideWinner({ correct: 4, ms: 8000, disconnected: true }, { correct: 4, ms: 8000, disconnected: true }), 'draw');

const code = makeCode();
assert.equal(code.length, 6);
assert.match(code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);

console.log('winner ok');
