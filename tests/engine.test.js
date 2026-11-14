import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, DAY, createState, evaluateAnswer, recordAttempt, markExposure, getLevel, dueModules, summarize, nextReviewAt, validateImport, loadState, saveState } from '../src/engine.js';

const numeric = { type: 'numeric', answer: 0.5 };
const choice = { type: 'choice', answer: 'b', options: [{ value: 'a' }, { value: 'b' }] };
const pass = (state, questionId, role = 'foundation', now = 1000, extra = {}) => recordAttempt(state, { moduleId: 'probability', questionId, correct: true, role, now, ...extra });
const level3 = () => pass(pass(createState(0), 'a'), 'b', 'recall', 2000);

test('fresh state has no invented learning evidence', () => {
  const state = createState(42);
  assert.equal(state.version, 1); assert.equal(state.createdAt, 42);
  assert.deepEqual(state.skills, {}); assert.deepEqual(state.attempts, []);
  assert.deepEqual(state.diagnostic, { completed: false, answers: [] });
});
test('numeric evaluator accepts a decimal', () => assert.equal(evaluateAnswer(numeric, ' 0.5 ').correct, true));
test('numeric evaluator accepts a fraction', () => assert.equal(evaluateAnswer(numeric, '1 / 2').correct, true));
test('numeric evaluator accepts signed decimals and fractions', () => assert.equal(evaluateAnswer({ type: 'numeric', answer: -0.25 }, '-.5/2').correct, true));
test('numeric evaluator rejects empty and whitespace answers', () => { for (const value of ['', ' ', null, undefined]) assert.equal(evaluateAnswer(numeric, value).valid, false); });
test('numeric evaluator rejects division by zero and nonfinite values', () => { for (const value of ['1/0', 'Infinity', 'NaN', '1e309']) assert.equal(evaluateAnswer(numeric, value).valid, false); });
test('numeric evaluator never executes expressions', () => { for (const value of ['1+1', 'globalThis.hacked=true', '0.5;process.exit()', '1/2/3']) assert.equal(evaluateAnswer(numeric, value).valid, false); });
test('numeric tolerance is inclusive and configurable', () => {
  assert.equal(evaluateAnswer({ ...numeric, tolerance: 0.01 }, '0.509').correct, true);
  assert.equal(evaluateAnswer({ ...numeric, tolerance: 0.01 }, '0.52').correct, false);
});
test('wrong numeric answers remain valid attempts', () => assert.deepEqual(evaluateAnswer(numeric, '2').valid, true));
test('choice evaluator accepts only offered values', () => { assert.equal(evaluateAnswer(choice, 'b').correct, true); assert.equal(evaluateAnswer(choice, 'a').correct, false); assert.equal(evaluateAnswer(choice, 'c').valid, false); });
test('unsupported question types fail explicitly', () => assert.equal(evaluateAnswer({ type: 'free-form' }, 'answer').valid, false));
test('one independent answer earns level two only', () => assert.equal(getLevel(pass(createState(), 'a'), 'probability'), 2));
test('two foundation checks cannot earn level three without recall', () => assert.equal(getLevel(pass(pass(createState(), 'a'), 'b'), 'probability'), 2));
test('two independent checks including recall earn level three', () => assert.equal(getLevel(level3(), 'probability'), 3));
test('repeating one question cannot inflate independent evidence', () => { const state = pass(pass(createState(), 'a'), 'a', 'recall'); assert.equal(getLevel(state, 'probability'), 2); assert.equal(state.skills.probability.correctIds.length, 1); });
test('hinted and revealed answers do not earn credit', () => { for (const extra of [{ hinted: true }, { revealed: true }]) { const state = pass(createState(), 'a', 'foundation', 1000, extra); assert.equal(getLevel(state, 'probability'), 1); assert.deepEqual(state.skills.probability.correctIds, []); } });
test('immediate retry after exposure still earns no credit', () => { const state = pass(pass(createState(), 'a', 'foundation', 1000, { hinted: true }), 'a', 'recall', 2000); assert.equal(getLevel(state, 'probability'), 1); });
test('exposed material becomes eligible only after a day', () => { const initial = pass(createState(), 'a', 'foundation', 1000, { revealed: true }); assert.equal(getLevel(pass(initial, 'a', 'recall', 1000 + DAY - 1), 'probability'), 1); assert.equal(getLevel(pass(initial, 'a', 'recall', 1000 + DAY), 'probability'), 2); });
test('markExposure records a new question without awarding a skill level', () => {
  const state = markExposure(createState(0), [{ moduleId: 'probability', questionId: 'a' }], 500);
  assert.equal(getLevel(state, 'probability'), 0);
  assert.equal(state.skills.probability.assistedAt.a, 500);
  assert.equal(state.skills.probability.dueAt, null);
  assert.deepEqual(validateImport(state), state);
});
test('markExposure preserves earned levels, evidence, dates and attempt history', () => {
  const original = level3();
  const exposed = markExposure(original, [{ moduleId: 'probability', questionId: 'a' }], 9000);
  assert.equal(getLevel(exposed, 'probability'), 3);
  assert.equal(exposed.skills.probability.dueAt, original.skills.probability.dueAt);
  assert.equal(exposed.skills.probability.milestoneAt, original.skills.probability.milestoneAt);
  assert.equal(exposed.skills.probability.lastAt, original.skills.probability.lastAt);
  assert.deepEqual(exposed.skills.probability.correctIds, original.skills.probability.correctIds);
  assert.deepEqual(exposed.attempts, original.attempts);
  assert.equal(exposed.lastModule, original.lastModule);
});
test('markExposure handles multiple questions and duplicate items immutably', () => {
  const original = level3(), snapshot = JSON.stringify(original);
  const exposed = markExposure(original, [{ moduleId: 'probability', questionId: 'a' }, { moduleId: 'probability', questionId: 'b' }, { moduleId: 'probability', questionId: 'a' }, { moduleId: 'markets', questionId: 'q1' }], 9000);
  assert.equal(JSON.stringify(original), snapshot);
  assert.deepEqual(exposed.skills.probability.assistedAt, { a: 9000, b: 9000 });
  assert.deepEqual(exposed.skills.markets.assistedAt, { q1: 9000 });
});
test('outside-session exposure blocks immediate independent credit', () => {
  const exposed = markExposure(createState(0), [{ moduleId: 'probability', questionId: 'a' }], 500);
  assert.equal(getLevel(pass(exposed, 'a', 'foundation', 1000), 'probability'), 1);
  assert.equal(getLevel(pass(exposed, 'a', 'foundation', 500 + DAY), 'probability'), 2);
});
test('markExposure rejects invalid identifiers and timestamps', () => {
  for (const item of [null, { moduleId: '__proto__', questionId: 'a' }, { moduleId: 'safe', questionId: '<script>' }]) assert.throws(() => markExposure(createState(), [item], 100));
  assert.throws(() => markExposure(createState(), [{ moduleId: 'safe', questionId: 'a' }], NaN));
  assert.throws(() => markExposure(createState(), null, 100));
});
test('an empty exposure batch leaves the record unchanged', () => { const state = createState(0); assert.equal(markExposure(state, [], 500), state); });
test('same-day recall cannot earn independent level four', () => assert.equal(getLevel(pass(level3(), 'b', 'recall', 2000 + DAY - 1), 'probability'), 3));
test('next-day recall earns level four', () => assert.equal(getLevel(pass(level3(), 'b', 'recall', 2000 + DAY), 'probability'), 4));
test('level five requires edge evidence and a later spaced recall', () => {
  const four = pass(level3(), 'b', 'recall', 2000 + DAY);
  assert.equal(getLevel(pass(four, 'b', 'recall', 2000 + 2 * DAY), 'probability'), 4);
  const edge = pass(four, 'c', 'edge', 3000 + DAY);
  assert.equal(getLevel(edge, 'probability'), 4);
  assert.equal(getLevel(pass(edge, 'b', 'recall', 2000 + 2 * DAY), 'probability'), 5);
});
test('failed recall lowers level and schedules an early review', () => {
  const state = recordAttempt(level3(), { moduleId: 'probability', questionId: 'b', correct: false, role: 'recall', now: 9000 });
  assert.equal(getLevel(state, 'probability'), 2); assert.equal(state.skills.probability.dueAt, 9000 + 3_600_000);
  assert.deepEqual(state.skills.probability.recallIds, []);
});
test('recordAttempt is immutable', () => { const original = level3(); const snapshot = JSON.stringify(original); pass(original, 'c', 'edge', 3000); assert.equal(JSON.stringify(original), snapshot); });
test('a failed independent review remains serializable with reduced evidence', () => {
  const four = pass(level3(), 'b', 'recall', DAY + 2000);
  const failed = recordAttempt(four, { moduleId: 'probability', questionId: 'b', correct: false, role: 'recall', now: 2 * DAY + 2000 });
  assert.equal(getLevel(failed, 'probability'), 2);
  assert.deepEqual(validateImport(JSON.stringify(failed)), failed);
});
test('attempt history is bounded to the latest 500 entries', () => { let state = createState(); for (let i = 0; i < 510; i++) state = pass(state, 'a', 'foundation', i); assert.equal(state.attempts.length, 500); assert.equal(state.attempts[0].at, 10); });
test('unsafe and malformed attempt identifiers are rejected', () => { for (const questionId of ['__proto__', 'constructor', '<script>', '']) assert.throws(() => pass(createState(), questionId)); });
test('due modules include only started modules and are sorted', () => {
  const state = level3(); state.skills.other = { ...state.skills.probability, dueAt: 100 };
  assert.deepEqual(dueModules(state, [{ id: 'probability' }, { id: 'unseen' }, { id: 'other' }], DAY + 5000).map(module => module.id), ['other', 'probability']);
});
test('summary derives percent and independent counts from known modules', () => { const state = pass(level3(), 'b', 'recall', DAY + 2000); assert.deepEqual(summarize(state, [{ id: 'probability' }, { id: 'unseen' }], DAY + 3000), { started: 1, independent: 1, due: 0, percent: 40 }); });
test('empty curriculum summary is zero rather than NaN', () => assert.equal(summarize(createState(), []).percent, 0));
test('review intervals grow for independent and edge evidence levels', () => { assert.equal(nextReviewAt(3, 0), DAY); assert.equal(nextReviewAt(4, 0), 3 * DAY); assert.equal(nextReviewAt(5, 0), 7 * DAY); });
test('valid export round trips without losing evidence', () => { const state = level3(); assert.deepEqual(validateImport(JSON.stringify(state)), state); });
test('import strips unknown fields without merging arbitrary objects', () => { const state = { ...createState(), arbitrary: { injected: true } }; assert.equal(validateImport(state).arbitrary, undefined); });
test('import rejects prototype pollution anywhere in the payload', () => { for (const key of ['__proto__', 'constructor', 'prototype']) assert.throws(() => validateImport(JSON.stringify(createState()).replace('"preferences":{}', `"preferences":{"${key}":{}}`))); assert.equal({}.polluted, undefined); });
test('import rejects invalid version, impossible level and insufficient evidence', () => { assert.throws(() => validateImport({ ...createState(), version: 999 })); const state = level3(); state.skills.probability.level = 9; assert.throws(() => validateImport(state)); state.skills.probability.level = 3; state.skills.probability.correctIds = []; assert.throws(() => validateImport(state)); });
test('import rejects malformed diagnostic data and excessive history', () => { assert.throws(() => validateImport({ ...createState(), diagnostic: { completed: true, answers: ['arbitrary'] } })); assert.throws(() => validateImport({ ...createState(), attempts: Array(501).fill({}) })); });
test('diagnostic answers retain bounded text or numeric responses', () => { const state = createState(); state.diagnostic.answers.push({ moduleId: 'probability', questionId: 'a', correct: true, answer: '1/2' }); assert.deepEqual(validateImport(state).diagnostic, state.diagnostic); });
test('oversized imports are rejected before parsing', () => assert.throws(() => validateImport(' '.repeat(2_000_001))));
test('storage loading falls back cleanly on missing, corrupt, or blocked storage', () => {
  for (const storage of [{ getItem: () => null }, { getItem: () => '{broken' }, { getItem: () => JSON.stringify({ version: 1 }) }, { getItem: () => { throw new Error('blocked'); } }]) assert.deepEqual(loadState(storage, 42), createState(42));
});
test('storage saves under the namespaced key and loads it again', () => { const values = {}; const storage = { setItem: (key, value) => { values[key] = value; }, getItem: key => values[key] }; const state = level3(); assert.equal(saveState(storage, state), true); assert.ok(values[STORAGE_KEY]); assert.deepEqual(loadState(storage), state); });
test('storage quota failures are surfaced as false', () => assert.equal(saveState({ setItem: () => { throw new Error('quota'); } }, createState()), false));
