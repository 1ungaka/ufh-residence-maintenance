import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { prioritise, priorityScore } from '../src/services/priority.js';

const NOW = new Date('2026-08-10T12:00:00Z');

/** Build a request created `hours` hours before NOW. */
function req(id, urgency, hours) {
  const created = new Date(NOW.getTime() - hours * 3600000)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19);
  return { id, urgency, created_at: created };
}

describe('Prioritisation algorithm (TC-P01 ... TC-P04)', () => {
  test('TC-P01 higher urgency outranks lower urgency of the same age', () => {
    const high = priorityScore(req(1, 'High', 2), NOW);
    const medium = priorityScore(req(2, 'Medium', 2), NOW);
    const low = priorityScore(req(3, 'Low', 2), NOW);
    assert.ok(high > medium && medium > low);
  });

  test('TC-P02 within the same urgency the oldest request comes first', () => {
    const queue = prioritise([req(1, 'High', 1), req(2, 'High', 20), req(3, 'High', 5)], NOW);
    assert.deepEqual(queue.map((r) => r.id), [2, 3, 1]);
  });

  test('TC-P03 an old high-urgency request beats a new medium-urgency request', () => {
    const queue = prioritise([req(1, 'Medium', 0), req(2, 'High', 48)], NOW);
    assert.equal(queue[0].id, 2);
  });

  test('TC-P04 ageing is capped so a Low request never overtakes a fresh High one', () => {
    const veryOldLow = priorityScore(req(1, 'Low', 5000), NOW);
    const freshHigh = priorityScore(req(2, 'High', 0), NOW);
    assert.ok(freshHigh > veryOldLow);
  });

  test('TC-P05 the input array is not modified', () => {
    const input = [req(1, 'Low', 1), req(2, 'High', 1)];
    const copy = JSON.parse(JSON.stringify(input));
    prioritise(input, NOW);
    assert.deepEqual(input, copy);
  });
});
