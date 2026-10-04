import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const names = require('../js/names.js');

assert.ok(names.NAMES.length >= 20, `list has ${names.NAMES.length}, want >= 20`);
assert.equal(new Set(names.NAMES).size, names.NAMES.length, 'names unique');
for (const n of names.NAMES) {
  assert.ok(typeof n === 'string' && n.trim().length > 0, `non-empty: ${n}`);
}

for (let i = 0; i < 50; i++) {
  assert.ok(names.NAMES.includes(names.randomName()), 'randomName from list');
}

assert.equal(names.normalize(' Pen-Ink   Sucker '), 'pen ink sucker');
assert.equal(names.normalize("The 'Just Now' Genius"), 'the just now genius');
assert.equal(names.normalize('BOB'), 'bob');

assert.equal(names.uniqueName('Bob', ['Alice']), 'Bob');
assert.equal(names.uniqueName('  Bob  ', ['alice']), 'Bob');
const duped = names.uniqueName('Bob', ['Bob', 'bob ', 'ALICE']);
assert.ok(duped !== 'Bob' && names.normalize(duped) !== 'bob', `suffixed: ${duped}`);
assert.ok(/^Bob-[A-Z2-9]{2}$/.test(duped), `suffix shape: ${duped}`);
const duped2 = names.uniqueName('Bob', ['Bob', duped]);
assert.ok(duped2 !== 'Bob' && duped2 !== duped, `second clash differs: ${duped2}`);

// localStorage persistence: only explicit saves stick; random defaults never save themselves
const mem = {};
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
};
assert.equal(names.loadCustom(), '');
names.saveCustom('  Thick Lipstick  ');
assert.equal(names.loadCustom(), 'Thick Lipstick');
names.saveCustom('');
assert.equal(names.loadCustom(), 'Thick Lipstick', 'empty save is a no-op');
delete globalThis.localStorage;
assert.equal(names.loadCustom(), '', 'no storage -> empty, no crash');
names.saveCustom('x');

console.log('names ok');
