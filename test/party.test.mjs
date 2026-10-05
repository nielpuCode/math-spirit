import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const party = require('../js/party.js');
const names = require('../js/names.js');

const room = party.createRoom();
assert.equal(party.size(room), 0);
assert.equal(party.allReady(room), false);

party.addPlayer(room, 'host', 'Thick Lipstick');
party.addPlayer(room, 'g1', 'Pen-Ink Sucker');
assert.equal(party.size(room), 2);
assert.equal(party.allReady(room), false);

party.setReady(room, 'host', true);
assert.deepEqual(party.notReady(room), ['Pen-Ink Sucker']);
assert.equal(party.allReady(room), false);
party.setReady(room, 'g1', true);
assert.equal(party.allReady(room), true);

// host dedupes a clashing join name the same way every time
const final = names.uniqueName('pen-ink sucker', party.names(room));
party.addPlayer(room, 'g2', final);
assert.ok(!/^pen-ink sucker$/i.test(party.names(room)[2]), `suffixed: ${final}`);
assert.equal(new Set(party.names(room).map(names.normalize)).size, 3);

// answers accumulate; late dupes for a finished player are ignored
assert.ok(party.applyAnswered(room, 'g1', { correct: true, ms: 4000 }));
assert.ok(party.applyAnswered(room, 'g1', { correct: false, ms: 9000, done: true }));
assert.equal(room.players.g1.answered, 2);
assert.equal(room.players.g1.correct, 1);
assert.equal(room.players.g1.done, true);
assert.equal(party.applyAnswered(room, 'g1', { correct: true, ms: 1 }), false);
assert.equal(party.applyAnswered(room, 'nope', { correct: true }), false);
assert.equal(party.allDone(room), false);

party.applyAnswered(room, 'host', { correct: true, ms: 8000, done: true });
party.applyAnswered(room, 'g2', { correct: true, ms: 7000, done: true });
assert.equal(party.allDone(room), true);

// roster round-trips through plain JSON (what actually goes over the wire)
const wire = JSON.parse(JSON.stringify(party.rosterList(room)));
const room2 = party.createRoom();
party.syncRoster(room2, wire);
assert.deepEqual(party.rosterList(room2), wire);

// drop keeps the game going for everyone else
assert.ok(party.removePlayer(room, 'g1'));
assert.equal(party.removePlayer(room, 'g1'), false);
assert.equal(party.size(room), 2);

// rematch zeroes scores and ready flags, keeps identities and seats
party.resetScores(room);
assert.equal(room.players.host.answered, 0);
assert.equal(room.players.host.correct, 0);
assert.equal(room.players.host.done, false);
assert.equal(room.players.host.ms, 0);
assert.equal(room.players.host.ready, false);
assert.equal(room.players.host.name, 'Thick Lipstick');
assert.equal(party.size(room), 2);
assert.equal(party.allReady(room), false);

// lobby rename: sanitized like join, deduped by host, empty keeps old
assert.ok(party.setName(room, 'g2', '  Night Owl  '));
assert.equal(room.players.g2.name, 'Night Owl');
assert.equal(party.setName(room, 'g2', '   '), false);
assert.equal(room.players.g2.name, 'Night Owl');
assert.equal(party.setName(room, 'nope', 'Ghost'), false);
const clash = names.uniqueName('night owl', party.names(room));
party.addPlayer(room, 'g3', clash);
assert.ok(party.setName(room, 'g3', clash));
assert.equal(new Set(party.names(room).map(names.normalize)).size, 3);

// cap enforced
const full = party.createRoom();
for (let i = 0; i < party.MAX_PLAYERS; i++) party.addPlayer(full, 'p' + i, 'N' + i);
assert.equal(party.addPlayer(full, 'extra', 'Extra'), null);

console.log('party ok');
