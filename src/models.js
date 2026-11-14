const finite = (value, name) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new RangeError(`${name} must be a finite number.`);
  return value;
};
const probability = (value, name) => {
  finite(value, name);
  if (value < 0 || value > 1) throw new RangeError(`${name} must be between 0 and 1.`);
  return value;
};
const nonnegative = (value, name) => {
  finite(value, name);
  if (value < 0) throw new RangeError(`${name} cannot be negative.`);
  return value;
};
const count = (value, name) => {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${name} must be a nonnegative safe integer.`);
  return value;
};
const logObservations = (n, p) => n === 0 ? 0 : n * Math.log(p);

/** Posterior probability of the biased coin, conditional on the observed flips.
 * Log likelihoods avoid underflow for long sequences. Counts omit ordering because
 * the binomial coefficient is common to both hypotheses and cancels.
 */
export function posterior({ prior, heads = 1, tails = 0, fair = 0.5, biased = 0.75 }) {
  probability(prior, 'Prior'); probability(fair, 'Fair-coin heads probability'); probability(biased, 'Biased-coin heads probability');
  count(heads, 'Heads'); count(tails, 'Tails');
  const biasedLog = Math.log(prior) + logObservations(heads, biased) + logObservations(tails, 1 - biased);
  const fairLog = Math.log1p(-prior) + logObservations(heads, fair) + logObservations(tails, 1 - fair);
  if (biasedLog === -Infinity && fairLog === -Infinity) throw new RangeError('The observations have zero probability under both weighted hypotheses.');
  if (biasedLog === -Infinity) return 0;
  if (fairLog === -Infinity) return 1;
  // This logistic form remains stable when the likelihood ratio is extreme.
  const difference = fairLog - biasedLog;
  if (difference >= 0) {
    const ratio = Math.exp(-difference);
    return ratio / (1 + ratio);
  }
  return 1 / (1 + Math.exp(difference));
}

/** Payout is the total amount received on a win; cost is paid on every bet. */
export function betExpectedValue(winProbability, payout, cost = 1) {
  probability(winProbability, 'Win probability'); nonnegative(payout, 'Payout'); nonnegative(cost, 'Cost');
  return winProbability * payout - cost;
}

/** One optional reroll of a fair die, with the second result binding. */
export function rollDecision(kept, sides = 6) {
  if (!Number.isSafeInteger(sides) || sides < 1) throw new RangeError('Sides must be a positive safe integer.');
  if (!Number.isSafeInteger(kept) || kept < 1 || kept > sides) throw new RangeError('Kept result must be an integer from 1 through sides.');
  const rerollValue = (sides + 1) / 2;
  const advantage = rerollValue - kept;
  return { rerollValue, advantage, choice: advantage > 0 ? 'reroll' : advantage < 0 ? 'keep' : 'indifferent' };
}

/** A deliberately simple inventory-skew model, not a calibrated trading model. */
export function marketQuote({ fairValue = 100, inventory = 0, risk = 0.1, spread = 2 } = {}) {
  finite(fairValue, 'Fair value'); finite(inventory, 'Inventory'); nonnegative(risk, 'Risk coefficient'); nonnegative(spread, 'Spread');
  const reservation = fairValue - inventory * risk;
  const bid = reservation - spread / 2;
  const ask = reservation + spread / 2;
  finite(reservation, 'Reservation value'); finite(bid, 'Bid'); finite(ask, 'Ask');
  return { reservation, bid, ask };
}

/** Exact binomial formula evaluated in log space, up to one million trials.
 * The bound keeps browser work predictable and floating-point precision useful.
 */
export function binomialProbability(n, k, p) {
  count(n, 'Trials'); count(k, 'Successes'); probability(p, 'Success probability');
  if (n > 1_000_000) throw new RangeError('Trials cannot exceed 1,000,000 in this experiment.');
  if (k > n) throw new RangeError('Successes cannot exceed trials.');
  if (n === 0) return 1;
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  const m = Math.min(k, n - k);
  let logCoefficient = 0;
  for (let i = 1; i <= m; i++) logCoefficient += Math.log(n - m + i) - Math.log(i);
  const logMass = logCoefficient + k * Math.log(p) + (n - k) * Math.log1p(-p);
  return Math.min(1, Math.exp(logMass));
}
