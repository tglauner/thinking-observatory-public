export const STORAGE_KEY = 'jane-street-observatory:v1';
export const DAY = 86_400_000;
const HOUR = 3_600_000;
const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,119}$/.test(value) && !forbidden.has(value);
const validTime = value => Number.isSafeInteger(value) && value >= 0;
const roles = new Set(['foundation', 'recall', 'edge']);

export function createState(now = Date.now()) {
  return { version: 1, createdAt: now, updatedAt: now, skills: {}, attempts: [], diagnostic: { completed: false, answers: [] }, preferences: {}, lastModule: null };
}

// Parse numbers without evaluating code or accepting JavaScript expressions.
function parseNumber(raw) {
  const value = String(raw ?? '').trim();
  const decimal = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)';
  const match = value.match(new RegExp(`^(${decimal})(?:\\s*/\\s*(${decimal}))?$`));
  if (!match) return null;
  const numerator = Number(match[1]);
  const denominator = match[2] === undefined ? 1 : Number(match[2]);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}

export function evaluateAnswer(question, raw) {
  if (question.type === 'numeric') {
    const value = parseNumber(raw);
    if (value === null) return { correct: false, valid: false, message: 'Enter a number or a fraction, such as 0.5 or 1/2.' };
    const tolerance = Number.isFinite(question.tolerance) && question.tolerance >= 0 ? question.tolerance : 1e-6;
    const correct = Number.isFinite(question.answer) && Math.abs(value - question.answer) <= tolerance;
    return { correct, valid: true, message: correct ? 'That result checks out.' : 'Reconsider the assumptions and try a smaller case.' };
  }
  if (question.type === 'choice') {
    const value = String(raw ?? '').trim();
    const valid = Array.isArray(question.options) && question.options.some(option => String(option.value) === value);
    if (!valid) return { correct: false, valid: false, message: 'Choose an answer before checking.' };
    const correct = value === String(question.answer);
    return { correct, valid: true, message: correct ? 'That conclusion follows.' : 'Try to find a case that contradicts that choice.' };
  }
  return { correct: false, valid: false, message: 'This question type is unavailable.' };
}

export function nextReviewAt(level, now = Date.now()) {
  const intervals = [DAY, HOUR, DAY, DAY, 3 * DAY, 7 * DAY];
  return now + intervals[Math.max(0, Math.min(5, Math.floor(level)))];
}

function newSkill() {
  return { level: 0, correctIds: [], recallIds: [], edgeIds: [], assistedAt: {}, dueAt: null, lastAt: null, milestoneAt: null };
}

/** Showing a bank explanation is exposure even outside a credited practice session.
 * It changes no earned level, review date, attempt history, or navigation state.
 */
export function markExposure(state, items, now = Date.now()) {
  if (!Array.isArray(items) || items.length > 500 || !validTime(now) || items.some(item => !isRecord(item) || !validId(item.moduleId) || !validId(item.questionId))) {
    throw new Error('Invalid exposure record.');
  }
  if (items.length === 0) return state;
  const skills = { ...state.skills };
  for (const { moduleId, questionId } of items) {
    const previous = skills[moduleId] ?? newSkill();
    skills[moduleId] = { ...previous, assistedAt: { ...previous.assistedAt, [questionId]: now } };
  }
  return { ...state, updatedAt: now, skills };
}

export function getLevel(state, id) {
  return state.skills?.[id]?.level ?? 0;
}

/** Independent evidence is question-specific; repeated submissions cannot manufacture it.
 * Later recall may earn a spaced milestone, and exposure expires only after a day.
 */
export function recordAttempt(state, { moduleId, questionId, correct, hinted = false, revealed = false, role = 'foundation', now = Date.now() }) {
  if (!validId(moduleId) || !validId(questionId) || !roles.has(role) || !validTime(now) || typeof correct !== 'boolean') {
    throw new Error('Invalid learning attempt.');
  }
  const previous = state.skills[moduleId] ?? newSkill();
  const skill = { ...previous, correctIds: [...previous.correctIds], recallIds: [...previous.recallIds], edgeIds: [...previous.edgeIds], assistedAt: { ...previous.assistedAt } };
  skill.level = Math.max(1, skill.level);
  const assisted = Boolean(hinted || revealed);
  if (assisted) skill.assistedAt[questionId] = now;
  const exposedAt = skill.assistedAt[questionId];
  const eligible = !assisted && (exposedAt === undefined || now - exposedAt >= DAY);

  if (correct && eligible) {
    if (!skill.correctIds.includes(questionId)) skill.correctIds.push(questionId);
    if (role === 'recall' && !skill.recallIds.includes(questionId)) skill.recallIds.push(questionId);
    if (role === 'edge' && !skill.edgeIds.includes(questionId)) skill.edgeIds.push(questionId);
    skill.level = Math.max(2, skill.level);
    if (skill.level < 3 && skill.correctIds.length >= 2 && skill.recallIds.length >= 1) {
      skill.level = 3;
      skill.milestoneAt = now;
    } else if (skill.level >= 3 && role === 'recall' && skill.milestoneAt !== null && now - skill.milestoneAt >= DAY) {
      if (skill.level === 3) skill.level = 4;
      else if (skill.level === 4 && skill.edgeIds.length >= 1) skill.level = 5;
      skill.milestoneAt = now;
    }
  } else if (!correct && eligible) {
    skill.level = Math.max(1, skill.level - 1);
    skill.correctIds = skill.correctIds.filter(id => id !== questionId);
    skill.recallIds = skill.recallIds.filter(id => id !== questionId);
    skill.edgeIds = skill.edgeIds.filter(id => id !== questionId);
    if (skill.correctIds.length < 2 || skill.recallIds.length < 1) skill.level = Math.min(skill.level, 2);
    skill.milestoneAt = now;
  }
  skill.lastAt = now;
  skill.dueAt = !correct ? now + HOUR : nextReviewAt(skill.level, now);
  return {
    ...state,
    updatedAt: now,
    lastModule: moduleId,
    skills: { ...state.skills, [moduleId]: skill },
    attempts: [...state.attempts, { moduleId, questionId, correct, hinted: Boolean(hinted), revealed: Boolean(revealed), role, at: now }].slice(-500),
  };
}

export function dueModules(state, modules, now = Date.now()) {
  return modules.filter(module => {
    const skill = state.skills[module.id];
    return skill && skill.level > 0 && skill.dueAt !== null && skill.dueAt <= now;
  }).sort((a, b) => state.skills[a.id].dueAt - state.skills[b.id].dueAt);
}

export function summarize(state, modules, now = Date.now()) {
  const levels = modules.map(module => getLevel(state, module.id));
  return {
    started: levels.filter(level => level > 0).length,
    independent: levels.filter(level => level >= 4).length,
    due: dueModules(state, modules, now).length,
    percent: levels.length ? Math.round(levels.reduce((sum, level) => sum + level, 0) / (levels.length * 5) * 100) : 0,
  };
}

function fail(message) { throw new Error(`Invalid progress file: ${message}`); }
function assertKeysSafe(value, depth = 0) {
  if (depth > 20) fail('too deeply nested.');
  if (value === null || typeof value !== 'object') return;
  for (const key of Object.keys(value)) {
    if (forbidden.has(key)) fail('unsafe property.');
    assertKeysSafe(value[key], depth + 1);
  }
}
function idList(value, name) {
  if (!Array.isArray(value) || value.length > 500 || value.some(id => !validId(id))) fail(`invalid ${name}.`);
  return [...new Set(value)];
}
function timestamp(value, name, nullable = false) {
  if (nullable && value === null) return null;
  if (!validTime(value)) fail(`invalid ${name}.`);
  return value;
}

/** Import only known fields into fresh objects. Never merge untrusted JSON. */
export function validateImport(input) {
  let raw;
  if (typeof input === 'string' && input.length > 2_000_000) fail('file is too large.');
  try { raw = typeof input === 'string' ? JSON.parse(input) : input; } catch { fail('unreadable JSON.'); }
  if (!isRecord(raw) || raw.version !== 1) fail('unsupported version.');
  assertKeysSafe(raw);
  if (!isRecord(raw.skills) || Object.keys(raw.skills).length > 1000) fail('invalid skill map.');
  if (!Array.isArray(raw.attempts) || raw.attempts.length > 500) fail('invalid attempt history.');
  if (!isRecord(raw.diagnostic) || typeof raw.diagnostic.completed !== 'boolean' || !Array.isArray(raw.diagnostic.answers) || raw.diagnostic.answers.length > 100) fail('invalid diagnostic.');
  if (!isRecord(raw.preferences)) fail('invalid preferences.');
  if (raw.lastModule !== null && !validId(raw.lastModule)) fail('invalid last module.');
  const state = createState();
  state.createdAt = timestamp(raw.createdAt ?? state.createdAt, 'created date');
  state.updatedAt = timestamp(raw.updatedAt ?? state.createdAt, 'updated date');
  state.lastModule = raw.lastModule;
  for (const [id, value] of Object.entries(raw.skills)) {
    if (!validId(id) || !isRecord(value) || !Number.isInteger(value.level) || value.level < 0 || value.level > 5) fail('invalid skill.');
    const skill = newSkill();
    skill.level = value.level;
    skill.correctIds = idList(value.correctIds, 'correct question IDs');
    skill.recallIds = idList(value.recallIds, 'recall question IDs');
    skill.edgeIds = idList(value.edgeIds, 'edge question IDs');
    if (skill.recallIds.some(id => !skill.correctIds.includes(id)) || skill.edgeIds.some(id => !skill.correctIds.includes(id))) fail('inconsistent question evidence.');
    if (skill.level >= 3 && (skill.correctIds.length < 2 || skill.recallIds.length < 1)) fail('insufficient evidence for level.');
    if (skill.level >= 5 && skill.edgeIds.length < 1) fail('insufficient edge evidence.');
    if (!isRecord(value.assistedAt ?? {}) || Object.keys(value.assistedAt ?? {}).length > 500) fail('invalid exposure history.');
    for (const [questionId, at] of Object.entries(value.assistedAt ?? {})) {
      if (!validId(questionId)) fail('invalid exposed question ID.');
      skill.assistedAt[questionId] = timestamp(at, 'exposure date');
    }
    skill.dueAt = timestamp(value.dueAt, 'review date', true);
    skill.lastAt = timestamp(value.lastAt, 'attempt date', true);
    skill.milestoneAt = timestamp(value.milestoneAt ?? null, 'milestone date', true);
    state.skills[id] = skill;
  }
  state.attempts = raw.attempts.map(value => {
    if (!isRecord(value) || !validId(value.moduleId) || !validId(value.questionId) || typeof value.correct !== 'boolean' || typeof value.hinted !== 'boolean' || typeof value.revealed !== 'boolean' || !roles.has(value.role)) fail('invalid attempt.');
    return { moduleId: value.moduleId, questionId: value.questionId, correct: value.correct, hinted: value.hinted, revealed: value.revealed, role: value.role, at: timestamp(value.at, 'attempt date') };
  });
  state.diagnostic = {
    completed: raw.diagnostic.completed,
    answers: raw.diagnostic.answers.map(value => {
      // Diagnostic answers can be booleans or compact result records, never arbitrary content.
      if (typeof value === 'boolean') return value;
      if (!isRecord(value) || !validId(value.moduleId) || !validId(value.questionId) || typeof value.correct !== 'boolean') fail('invalid diagnostic answer.');
      const answer = { moduleId: value.moduleId, questionId: value.questionId, correct: value.correct };
      if (value.answer !== undefined) {
        if (!((typeof value.answer === 'string' && value.answer.length <= 500) || (typeof value.answer === 'number' && Number.isFinite(value.answer)))) fail('invalid diagnostic response.');
        answer.answer = value.answer;
      }
      return answer;
    }),
  };
  for (const [key, value] of Object.entries(raw.preferences)) {
    if (!validId(key) || !(typeof value === 'boolean' || (typeof value === 'string' && value.length <= 200) || (typeof value === 'number' && Number.isFinite(value)))) fail('invalid preference.');
    state.preferences[key] = value;
  }
  return state;
}

export function loadState(storage, now = Date.now()) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? validateImport(raw) : createState(now);
  } catch { return createState(now); }
}

export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(validateImport(state))); return true; }
  catch { return false; }
}
