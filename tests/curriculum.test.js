import test from 'node:test';
import assert from 'node:assert/strict';
import { tracks, modules, sources, integrativeQuestion } from '../src/curriculum.js';
import { evaluateAnswer } from '../src/engine.js';

const moduleMap = new Map(modules.map(module => [module.id, module]));
const allQuestions = [...modules.flatMap(module => module.questions), integrativeQuestion.question];
const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-10, message);

// These fixtures independently enumerate outcomes or calculate from the stated quantities.
// They protect the answer key against accidental edits independently of the evaluator.
const numericFixtures = {
  'percentages-f': 80 * 3 / 8,
  'percentages-r': (46 - 40) / 40 * 100,
  'percentages-e': 100 * 1.2 * .8,
  'counting-f': 3 ** 2,
  'counting-r': 6 * 5 / 2,
  'counting-e': 2 ** 3 - 1,
  'scale-f': 25 * 4 * 60,
  'scale-r': 3 * 2 ** 5,
  'scale-e': 12_000_000 * 8 / 2_000_000,
  'sample-f': ['HH', 'HT', 'TH', 'TT'].filter(value => [...value].filter(c => c === 'H').length === 1).length / 4,
  'sample-r': (2 / 6) ** 2,
  'conditioning-f': [4, 5, 6].filter(value => value % 2 === 0).length / 3,
  'conditioning-r': 10 / (10 + 90 * .1),
  'conditioning-e': 2 / (3 + 2 - 1),
  'expectation-f': 12 * .25 - 2,
  'expectation-r': 10 * .3,
  'expectation-e': [1, 2, 3, 4, 5, 6].reduce((sum, value) => sum + value * value, 0) / 6,
  'dispersion-f': ((0 - 1) ** 2 + (2 - 1) ** 2) / 2,
  'dispersion-r': 2 ** 2 * 3,
  'dispersion-e': 0,
  'sampling-f': (4 + 7 + 10) / 3,
  'sampling-r': 12 / Math.sqrt(36),
  'validation-f': 90 / (90 + 10) * 100,
  'payoffs-f': 8 * .5 + (-2) * .5,
  'information-f': Math.max(0, 10 * .5 - 6 * .5),
  'information-r': .5 * Math.max(0, 10) + .5 * Math.max(0, -6) - Math.max(0, 10 * .5 - 6 * .5),
  'stopping-f': (1 + 2 + 3 + 4 + 5 + 6) / 6,
  'stopping-r': [1, 2, 3, 4, 5, 6].reduce((sum, roll) => sum + Math.max(roll, 3.5), 0) / 6,
  'stopping-e': 3.5 - 1,
  'fair-price-f': 20 * .3,
  'fair-price-r': 11 - 9,
  'selection-f': (0 + 10) / 2,
  'selection-r': 6 - 10,
  'inventory-f': 0 + 8 - 3,
  'inventory-r': -4 * 3,
  'complexity-f': 7 * 4,
  'search-f': [11, 14].length,
  'search-r': 64 / 2 ** 4,
  'graphs-f': 2,
  'invariants-f': 0 + 2 - 1,
  'streams-f': (30 + 12) / (5 + 1),
  'streams-e': [...new Map([['a', 4], ['b', 7], ['a', 4]]).values()].reduce((a, b) => a + b, 0),
  'calibration-f': 100 * .7,
  'integration-signal-price': 12 * ((.25 * .8) / (.25 * .8 + .75 * .2)) - 6,
};

test('curriculum supplies three complete explorations in each of eight distinct tracks', () => {
  assert.equal(tracks.length, 8);
  assert.equal(new Set(tracks.map(track => track.id)).size, tracks.length);
  assert.equal(modules.length, 24);
  assert.equal(moduleMap.size, modules.length);
  for (const track of tracks) {
    assert.equal(modules.filter(module => module.track === track.id).length, 3, track.id);
    assert.ok(track.title && track.subtitle && track.symbol && track.color);
  }
});

test('module content and references resolve, with foundation, recall and edge checks', () => {
  const knownTracks = new Set(tracks.map(track => track.id));
  const knownSources = new Set(sources.map(source => source.id));
  for (const module of modules) {
    assert.ok(knownTracks.has(module.track), module.id);
    assert.ok(module.title && module.summary && module.level, module.id);
    assert.ok(Number.isFinite(module.minutes) && module.minutes > 0, module.id);
    assert.ok(module.objectives.length >= 3, module.id);
    assert.ok(module.lesson.length >= 2 && module.lesson.every(section => section.title && section.body.length > 80), module.id);
    assert.deepEqual(module.questions.map(question => question.role), ['foundation', 'recall', 'edge'], module.id);
    for (const id of module.prerequisites) assert.ok(moduleMap.has(id), `${module.id}: missing ${id}`);
    assert.ok(module.sourceIds.length > 0, module.id);
    for (const id of module.sourceIds) assert.ok(knownSources.has(id), `${module.id}: missing source ${id}`);
  }
});

test('prerequisite graph has no cycles, including cross-track dependencies', () => {
  const visited = new Set();
  const active = new Set();
  function visit(id) {
    assert.ok(!active.has(id), `Cycle at ${id}`);
    if (visited.has(id)) return;
    active.add(id);
    moduleMap.get(id).prerequisites.forEach(visit);
    active.delete(id);
    visited.add(id);
  }
  modules.forEach(module => visit(module.id));
  assert.equal(visited.size, modules.length);
});

test('every question has a unique ID, two narrowing hints and a usable deterministic answer', () => {
  assert.equal(allQuestions.length, 73);
  assert.equal(new Set(allQuestions.map(question => question.id)).size, allQuestions.length);
  for (const question of allQuestions) {
    assert.ok(question.prompt && question.explanation, question.id);
    assert.equal(question.hints.length, 2, question.id);
    assert.ok(question.hints.every(hint => typeof hint === 'string' && hint.trim().length > 5), question.id);
    assert.ok(Number.isInteger(question.difficulty) && question.difficulty >= 1 && question.difficulty <= 5, question.id);
    if (question.type === 'numeric') {
      assert.ok(Number.isFinite(question.answer), question.id);
      assert.ok(question.tolerance > 0 && question.tolerance <= .01, question.id);
    } else {
      assert.equal(question.type, 'choice', question.id);
      const values = question.options.map(option => option.value);
      assert.equal(new Set(values).size, values.length, question.id);
      assert.equal(values.filter(value => value === question.answer).length, 1, question.id);
      assert.ok(question.options.length >= 3 && question.options.every(option => option.label), question.id);
    }
    assert.equal(evaluateAnswer(question, String(question.answer)).correct, true, question.id);
  }
});

test('all numeric answer keys match independent fixtures', () => {
  const numeric = allQuestions.filter(question => question.type === 'numeric');
  assert.equal(numeric.length, Object.keys(numericFixtures).length);
  for (const question of numeric) {
    assert.ok(Object.hasOwn(numericFixtures, question.id), `No fixture for ${question.id}`);
    close(question.answer, numericFixtures[question.id], question.id);
  }
});

test('fractional answers accept exact fractions and useful decimal precision', () => {
  for (const [id, fraction, decimal] of [
    ['sample-r', '1/9', '.1111'],
    ['conditioning-f', '2/3', '.6667'],
    ['conditioning-r', '10/19', '.5263'],
    ['expectation-e', '91/6', '15.1667'],
    ['integration-signal-price', '6/7', '.8571'],
  ]) {
    const question = allQuestions.find(candidate => candidate.id === id);
    assert.equal(evaluateAnswer(question, fraction).correct, true, id);
    assert.equal(evaluateAnswer(question, decimal).correct, true, id);
  }
});

test('connecting assessment combines Bayes, payout valuation and purchase cost', () => {
  assert.ok(moduleMap.has(integrativeQuestion.moduleId));
  assert.equal(integrativeQuestion.question.role, 'edge');
  assert.ok(!modules.flatMap(module => module.questions).includes(integrativeQuestion.question), 'Keep the connecting question separate from lesson practice.');
  close(integrativeQuestion.question.answer, 6 / 7, 'Correct net conditional profit');
  assert.equal(evaluateAnswer(integrativeQuestion.question, '48/7').correct, false, 'Gross payout must not pass as net profit.');
  assert.equal(evaluateAnswer(integrativeQuestion.question, '-3').correct, false, 'Unconditional expected profit must not pass after observing the signal.');
});

test('source links are HTTPS primary Jane Street references with provenance notes', () => {
  assert.equal(new Set(sources.map(source => source.id)).size, sources.length);
  for (const source of sources) {
    const url = new URL(source.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(url.hostname === 'www.janestreet.com' || url.hostname === 'blog.janestreet.com');
    assert.ok(source.title && source.note);
  }
});
