/** Original teaching material. Source links identify public inspiration, not copied questions. */
export const tracks = [
  { id: 'quantitative', title: 'Quantitative fluency', shortTitle: 'Numbers', subtitle: 'Numbers, scale & counting', symbol: 'Σ', color: '#93b5cf' },
  { id: 'probability', title: 'Probability', subtitle: 'Reason clearly about chance', symbol: 'P', color: '#a4b992' },
  { id: 'statistics', title: 'Statistics & research', shortTitle: 'Research', subtitle: 'Separate signal from noise', symbol: 'μ', color: '#c3ac83' },
  { id: 'decisions', title: 'Decision making', shortTitle: 'Decisions', subtitle: 'Act well with partial information', symbol: '↗', color: '#b2a3c4' },
  { id: 'markets', title: 'Markets & trading', shortTitle: 'Markets', subtitle: 'Prices, information & risk', symbol: '⇄', color: '#8db9b0' },
  { id: 'algorithms', title: 'Algorithms', subtitle: 'Build a useful mental model', symbol: 'O(n)', color: '#c89e8c' },
  { id: 'programming', title: 'Programming', subtitle: 'Invariants, state & verification', symbol: 'λ', color: '#98a5c4' },
  { id: 'communication', title: 'Collaborative reasoning', shortTitle: 'Reasoning', subtitle: 'Explain, question & revise', symbol: '∴', color: '#b6b48a' },
];

export const sources = [
  { id: 'probability-guide', title: 'Probability & Markets', url: 'https://www.janestreet.com/probability-markets/', note: 'Official introduction to probability, expected value and market making. Our questions are original.' },
  { id: 'trading', title: 'Trading interviews', url: 'https://www.janestreet.com/trading-interviews/', note: 'Official guidance emphasizing methodical, collaborative reasoning, probability, statistics, coding and data analysis.' },
  { id: 'engineering', title: 'Preparing for a software engineering interview', url: 'https://www.janestreet.com/preparing-for-a-software-engineering-interview/', note: 'Official guidance on coding, language fluency, collaboration and clear communication. SWE preparation differs from trading preparation.' },
  { id: 'engineering-update', title: 'Software engineering interviews are changing (a little)', url: 'https://blog.janestreet.com/software-engineering-interviews-are-changing-a-little/', note: 'November 2, 2026 update: some campus onsite rounds explore design, verification and LLM-assisted work. Most remain traditional coding rounds.' },
  { id: 'interviewing', title: 'What to expect', url: 'https://www.janestreet.com/join-jane-street/interviewing/', note: 'Official role overview. Quantitative research combines elements of trading and engineering; finance experience is not required.' },
  { id: 'puzzles', title: 'Jane Street puzzles', url: 'https://www.janestreet.com/puzzles/', note: 'Public creative problem-solving inspiration. These lessons do not reproduce archive puzzles.' },
  { id: 'ml', title: 'Machine learning at Jane Street', url: 'https://www.janestreet.com/join-jane-street/machine-learning/', note: 'Public context for noisy, changing data and predictive modeling. Research lessons here are general foundations, not a complete ML course.' },
];

const numeric = (id, role, prompt, answer, hints, explanation, difficulty = 1, tolerance = 0.0001) => ({ id, type: 'numeric', role, prompt, answer, hints, explanation, difficulty, tolerance });
const choice = (id, role, prompt, answer, options, hints, explanation, difficulty = 1) => ({ id, type: 'choice', role, prompt, answer, options: options.map(([value, label]) => ({ value, label })), hints, explanation, difficulty });

export const modules = [
  {
    id: 'percentages', track: 'quantitative', title: 'Think in proportions', summary: 'Translate ratios, percentages and changes without losing the denominator.', minutes: 12, level: 'Foundation', prerequisites: [],
    objectives: ['Convert between fractions and percentages.', 'Distinguish a percentage change from a percentage-point change.', 'Track the base when changes compound.'],
    lesson: [
      { title: 'Start with the base', body: 'A percentage is a fraction of a stated base. A 15% increase means multiply the original quantity by 1.15. Percentage points describe the difference between two percentages: 20% to 30% is 10 points, but a 50% relative increase.' },
      { title: 'Changes do not simply cancel', body: 'Successive changes act on different bases. An increase of r followed by a decrease of r multiplies the starting value by (1 + r)(1 − r) = 1 − r². Estimate the direction before calculating.' },
    ],
    questions: [
      numeric('percentages-f', 'foundation', 'A group has 80 people. Exactly 3/8 take the train. How many people take the train?', 30, ['What is one eighth of 80?', 'Multiply that number by three.'], '80 ÷ 8 × 3 = 30. The denominator divides the whole into equal groups.'),
      numeric('percentages-r', 'recall', 'A price rises from 40 to 46. What is the percentage increase? Enter the percentage, for example 12 for 12%.', 15, ['Measure the change relative to the starting price.', 'The change is 6, and 6/40 = 0.15.'], 'The increase is (46 − 40)/40 = 0.15, or 15%.'),
      numeric('percentages-e', 'edge', 'A value starts at 100, rises by 20%, then falls by 20%. What is its final value?', 96, ['After the rise, which number is the decrease applied to?', 'Multiply 100 by 1.2 and then by 0.8.'], '100 × 1.2 × 0.8 = 96. Equal percentage moves in opposite directions need not cancel.', 2),
    ], sourceIds: ['trading'],
  },
  {
    id: 'counting', track: 'quantitative', title: 'Count without double-counting', summary: 'Choose a sample space and decide whether order matters.', minutes: 14, level: 'Foundation', prerequisites: ['percentages'],
    objectives: ['Use the multiplication rule.', 'Distinguish ordered selections from unordered sets.', 'Count complements when direct counting is awkward.'],
    lesson: [
      { title: 'Define what one outcome means', body: 'If a code has three positions and each can contain any of four symbols, there are 4 × 4 × 4 outcomes. If symbols cannot repeat, the choices shrink to 4 × 3 × 2. Write the constraints before multiplying.' },
      { title: 'Order and the complement', body: 'Choosing a pair from n distinct objects gives n(n − 1)/2 possibilities because each unordered pair appears twice in the ordered count. Sometimes it is easier to count everything and subtract the outcomes that violate the requirement.' },
    ],
    questions: [
      numeric('counting-f', 'foundation', 'A badge has two letters. Each position can be A, B or C, and repeats are allowed. How many different badges exist?', 9, ['How many choices are available for each position?', 'Multiply 3 by 3.'], 'There are 3 × 3 = 9 ordered badges.'),
      numeric('counting-r', 'recall', 'You choose two different books from six. The order of selection does not matter. How many pairs are possible?', 15, ['Count ordered choices first.', 'There are 6 × 5 ordered choices; each pair is counted twice.'], '6 × 5 / 2 = 15 unordered pairs.', 2),
      numeric('counting-e', 'edge', 'A three-character code uses A or B in each position. How many codes contain at least one A?', 7, ['How many codes are there in total?', 'Subtract the only code containing no A.'], 'There are 2³ = 8 codes; only BBB contains no A, so 8 − 1 = 7.', 2),
    ], sourceIds: ['probability-guide', 'puzzles'],
  },
  {
    id: 'scale', track: 'quantitative', title: 'Scale & growth', summary: 'Use units and growth factors to keep estimates honest.', minutes: 12, level: 'Developing', prerequisites: ['percentages'],
    objectives: ['Convert rates into totals.', 'Calculate repeated multiplicative growth.', 'Catch unit mistakes with dimensional reasoning.'],
    lesson: [
      { title: 'Let the units guide you', body: 'A rate multiplied by a duration produces a total: events/second × seconds = events. Before calculating, convert all durations to a common unit. A rough order-of-magnitude estimate can reveal an extra factor of 60 or 1,000.' },
      { title: 'Repeated growth is exponential', body: 'If a quantity doubles every fixed interval, multiply by 2 for each interval. After k intervals it is 2ᵏ times the initial quantity. This differs from adding the same amount at every step.' },
    ],
    questions: [
      numeric('scale-f', 'foundation', 'A stream produces 25 events per second for 4 minutes. How many events arrive?', 6000, ['Convert four minutes into seconds.', 'Multiply 25 by 240.'], 'Four minutes is 240 seconds, giving 25 × 240 = 6,000 events.'),
      numeric('scale-r', 'recall', 'A population starts at 3 and doubles every hour. What is it after 5 hours?', 96, ['Five hours means five doublings.', 'Calculate 3 × 2⁵.'], '3 × 32 = 96. Doubling compounds rather than adding a fixed amount.', 2),
      numeric('scale-e', 'edge', 'A file is exactly 12,000,000 bytes. A link transfers 2,000,000 bits each second. Ignoring overhead and using 8 bits per byte, how many seconds does transfer take?', 48, ['The file size and speed use different units.', 'Convert 12,000,000 bytes to 96,000,000 bits.'], '96,000,000 bits ÷ 2,000,000 bits/second = 48 seconds.', 2),
    ], sourceIds: ['trading', 'engineering'],
  },
  {
    id: 'sample-spaces', track: 'probability', title: 'Build the sample space', summary: 'Turn an uncertain story into outcomes, events and probabilities.', minutes: 14, level: 'Foundation', prerequisites: ['counting'],
    objectives: ['Identify equally likely outcomes.', 'Calculate event probabilities.', 'Test whether events are independent.'],
    lesson: [
      { title: 'Outcomes must be weighted correctly', body: 'For equally likely outcomes, probability is favorable outcomes divided by all outcomes. Sums of dice are not equally likely even when individual rolls are. Count ordered roll pairs or explicitly assign probabilities.' },
      { title: 'Independence is a statement about information', body: 'Events A and B are independent when knowing B does not change the chance of A: P(A and B) = P(A)P(B). Disjoint events with positive probability are not independent, because one happening rules out the other.' },
    ],
    questions: [
      numeric('sample-f', 'foundation', 'Two fair coins are tossed independently. What is the probability of exactly one head? Enter a decimal from 0 to 1.', 0.5, ['List HH, HT, TH and TT.', 'Two of the four outcomes have exactly one head.'], 'HT and TH are the two favorable outcomes among four equally likely outcomes.'),
      numeric('sample-r', 'recall', 'A fair six-sided die is rolled twice independently. What is the probability both rolls are at least 5? Enter a decimal or fraction.', 1/9, ['Each roll succeeds on two of six faces.', 'Multiply the single-roll probability by itself.'], '(2/6)² = 1/9 because the rolls are independent.', 2),
      choice('sample-e', 'edge', 'For one fair die roll, let A mean “even” and B mean “odd.” Are A and B independent?', 'no', [['yes', 'Yes, because each has probability 1/2'], ['no', 'No, because observing one rules out the other'], ['unknown', 'Cannot tell without another roll']], ['What is P(A and B)?', 'Compare zero with P(A)P(B) = 1/4.'], 'They are disjoint, so P(A and B) = 0, while P(A)P(B) = 1/4. Independence fails.', 2),
    ], sourceIds: ['probability-guide'],
  },
  {
    id: 'conditioning', track: 'probability', title: 'Update on evidence', summary: 'Condition carefully and let the base rate do its work.', minutes: 18, level: 'Developing', prerequisites: ['sample-spaces'],
    objectives: ['Restrict the sample space after information arrives.', 'Apply Bayes’ rule using counts.', 'Distinguish P(A|B) from P(B|A).'],
    lesson: [
      { title: 'Conditioning changes the denominator', body: 'P(A|B) = P(A and B)/P(B), when P(B) is positive. Once B is known, only the B outcomes remain possible. A statement about a test being accurate among true cases does not directly give the proportion of positive tests that are true cases.' },
      { title: 'Use a population of imaginary cases', body: 'Bayes calculations often become clearer with counts. Out of 1,000 objects, first divide into true categories, then apply each category’s detection or false-positive rate. Compare true positives with all positives.' },
    ],
    questions: [
      numeric('conditioning-f', 'foundation', 'One fair six-sided die is rolled. You learn the result is greater than 3. What is the probability it is even?', 2/3, ['Which faces remain possible?', 'The remaining faces are 4, 5 and 6.'], 'Two of the three remaining equally likely faces, 4 and 6, are even.'),
      numeric('conditioning-r', 'recall', '10% of parts are defective. A detector flags every defective part and also flags 10% of good parts. Given a flag, what is the probability the part is defective?', 10/19, ['Imagine 100 parts: 10 defective and 90 good.', 'There are 10 true flags and 9 false flags.'], 'Among 19 flagged parts, 10 are defective, so the conditional probability is 10/19 ≈ 0.5263.', 3),
      numeric('conditioning-e', 'edge', 'A bag has 3 red and 2 blue balls. You draw a red ball and do not replace it. What is the probability the next ball is blue?', 0.5, ['Update the bag after the first draw.', 'Four balls remain, of which two are blue.'], 'The updated bag has 2 red and 2 blue balls, so the probability is 2/4 = 1/2.', 2),
    ], sourceIds: ['probability-guide'],
  },
  {
    id: 'expectation', track: 'probability', title: 'Expected value & linearity', summary: 'Average possible payoffs and exploit linearity.', minutes: 16, level: 'Developing', prerequisites: ['sample-spaces', 'percentages'],
    objectives: ['Compute a weighted average payoff.', 'Use linearity without assuming independence.', 'Distinguish expected profit from guaranteed profit.'],
    lesson: [
      { title: 'Expectation is a weighted average', body: 'For outcomes xᵢ with probabilities pᵢ, E[X] = Σpᵢxᵢ. Subtract costs to obtain expected profit. A positive expectation is compatible with losses on individual trials.' },
      { title: 'Linearity needs no independence', body: 'E[X + Y] = E[X] + E[Y] whether X and Y are independent or dependent. For counts, write the total as a sum of 0-or-1 indicators. The expectation of each indicator is just the probability of its event.' },
    ],
    questions: [
      numeric('expectation-f', 'foundation', 'A ticket pays 12 with probability 1/4 and 0 otherwise. It costs 2. What is the expected profit?', 1, ['Compute the expected payout first.', 'Expected payout is 12/4 = 3; subtract the cost.'], 'Expected profit = (1/4) × 12 − 2 = 1.'),
      numeric('expectation-r', 'recall', 'Ten indicator variables each equal 1 with probability 0.3. They may be dependent. What is the expected sum?', 3, ['Does linearity require independence?', 'Add the ten expectations of 0.3.'], 'Linearity gives 10 × 0.3 = 3 even with dependence.', 2),
      numeric('expectation-e', 'edge', 'A fair six-sided die is rolled once. You receive the square of its result. What is the expected payout?', 91/6, ['Square each possible result before averaging.', 'The squares sum to 1 + 4 + 9 + 16 + 25 + 36 = 91.'], 'E[X²] = 91/6 ≈ 15.1667. This is not (E[X])² = 12.25.', 3),
    ], sourceIds: ['probability-guide'],
  },
  {
    id: 'dispersion', track: 'statistics', title: 'Measure dispersion', summary: 'Understand variance and why a mean is only part of the story.', minutes: 16, level: 'Developing', prerequisites: ['expectation'],
    objectives: ['Compute variance from possible outcomes.', 'Predict the effect of scaling.', 'Account for covariance when combining risks.'],
    lesson: [
      { title: 'Variance measures squared distance from the mean', body: 'Var(X) = E[(X − E[X])²] = E[X²] − (E[X])². Standard deviation is the square root of variance and has the original units. Two payoffs can have the same mean and very different variability.' },
      { title: 'Dependence matters for risk', body: 'Var(aX + b) = a²Var(X): shifting leaves variance unchanged, while scaling squares the multiplier. Var(X + Y) includes 2Cov(X,Y), so variances simply add only when covariance is zero.' },
    ],
    questions: [
      numeric('dispersion-f', 'foundation', 'A variable is 0 or 2 with equal probability. What is its variance?', 1, ['The mean is 1.', 'Both possible values are one unit from the mean.'], 'Each squared deviation is 1, so the variance is 1.'),
      numeric('dispersion-r', 'recall', 'Var(X) = 3. What is Var(2X + 7)?', 12, ['Adding 7 shifts every outcome equally.', 'Multiplying by 2 multiplies variance by 2².'], 'Var(2X + 7) = 4Var(X) = 12.', 2),
      numeric('dispersion-e', 'edge', 'X has variance 4 and Y = −X exactly. What is Var(X + Y)?', 0, ['What is X + Y on every trial?', 'The sum is always zero.'], 'The sum is constant, so its variance is 0. Adding the separate variances would ignore perfect negative dependence.', 3),
    ], sourceIds: ['trading', 'probability-guide'],
  },
  {
    id: 'sampling', track: 'statistics', title: 'Sample & estimate', summary: 'Connect sample size, sampling error and confidence statements.', minutes: 16, level: 'Developing', prerequisites: ['dispersion'],
    objectives: ['Estimate a population mean from a sample.', 'Use the 1/√n standard-error relationship under stated assumptions.', 'Interpret frequentist confidence intervals.'],
    lesson: [
      { title: 'Precision depends on sampling assumptions', body: 'For n independent observations from the same distribution with finite variance σ², the sample mean has standard error σ/√n. Four times as many observations halves that standard error. Dependence can reduce the effective sample size.' },
      { title: 'What a confidence interval promises', body: 'A 95% confidence procedure covers the fixed population parameter in 95% of repeated samples, assuming its model and sampling conditions hold. It does not say 95% of observations lie in the reported interval.' },
    ],
    questions: [
      numeric('sampling-f', 'foundation', 'Three measurements are 4, 7 and 10. What is their sample mean?', 7, ['Add all observations.', 'Divide 21 by 3.'], 'The sample mean is (4 + 7 + 10)/3 = 7.'),
      numeric('sampling-r', 'recall', 'Independent observations have population standard deviation 12. What is the standard error of the mean for n = 36?', 2, ['Use σ/√n.', 'The square root of 36 is 6.'], '12/√36 = 12/6 = 2.', 2),
      choice('sampling-e', 'edge', 'Which is the correct repeated-sampling interpretation of a 95% confidence procedure?', 'coverage', [['data', '95% of individual observations fall inside each interval'], ['coverage', '95% of intervals constructed this way contain the fixed true parameter'], ['certainty', 'Every reported interval is 95% certain to be numerically correct']], ['Distinguish a parameter from an individual observation.', 'The probability statement describes the procedure over repeated samples.'], 'Frequentist confidence is repeated-sampling coverage of a fixed parameter, conditional on the procedure’s assumptions.', 3),
    ], sourceIds: ['probability-guide', 'trading'],
  },
  {
    id: 'validation', track: 'statistics', title: 'Test a research claim', summary: 'Use baselines, held-out data and a healthy suspicion of leakage.', minutes: 18, level: 'Advanced', prerequisites: ['sampling'],
    objectives: ['Compare a model with an appropriate baseline.', 'Identify information leakage.', 'Distinguish selection from genuine out-of-sample evidence.'],
    lesson: [
      { title: 'A number needs a comparison', body: 'Predictive accuracy means little without a baseline and a loss function that fits the decision. If 95% of observations are negative, always predicting negative scores 95% accuracy while missing every positive. Keep an untouched evaluation set.' },
      { title: 'Respect the arrow of time', body: 'For forecasting, features must be available when the prediction is made. Random splits can leak future regimes or repeated entities into training. Selecting the best of many experiments also creates optimism; evaluate the selected approach on genuinely held-out data.' },
    ],
    questions: [
      numeric('validation-f', 'foundation', 'A dataset contains 90 negative and 10 positive labels. What percentage accuracy does an always-negative classifier achieve?', 90, ['How many of its 100 predictions are correct?', 'All 90 negative examples are classified correctly.'], '90/100 = 90%. This baseline exposes why accuracy alone can hide poor performance on rare positives.'),
      choice('validation-r', 'recall', 'You predict tomorrow’s return at today’s close. Which feature is definitely unavailable at prediction time?', 'future', [['past', 'Yesterday’s closing price'], ['today', 'Today’s observed closing price'], ['future', 'Tomorrow’s realized trading volume']], ['Write down the exact prediction time.', 'A realized measurement from tomorrow has not happened yet.'], 'Tomorrow’s realized volume leaks future information into a forecast made today.', 2),
      choice('validation-e', 'edge', 'You choose the best of 200 models using one validation set. Which next step gives cleaner evidence about the selected model?', 'test', [['reuse', 'Report the best validation score as unbiased performance'], ['test', 'Evaluate once on an untouched test set using the fixed selection'], ['train', 'Report training performance on all 200 models']], ['Model selection has already used the validation set.', 'Reserve data that did not influence the choice.'], 'An untouched test set reduces selection optimism. It still must represent the intended deployment setting.', 3),
    ], sourceIds: ['ml', 'trading'],
  },
  {
    id: 'payoffs', track: 'decisions', title: 'Compare decisions', summary: 'Separate the quality of a decision from its eventual outcome.', minutes: 14, level: 'Developing', prerequisites: ['expectation'],
    objectives: ['Compute expected payoffs for alternative actions.', 'Distinguish expected value from risk preference.', 'Avoid judging decisions solely by realized outcomes.'],
    lesson: [
      { title: 'Make actions and outcomes explicit', body: 'A payoff table lists each possible state, its probability and the payoff of each action. A risk-neutral decision maker chooses the largest expected payoff. Risk limits or nonlinear utility can justify a different action.' },
      { title: 'Judge the process using available information', body: 'A good decision can lose money and a bad decision can get lucky. Evaluate whether the probabilities, payoff estimates and constraints were reasonable at the time; update them when new evidence arrives.' },
    ],
    questions: [
      numeric('payoffs-f', 'foundation', 'Action A pays 8 with probability 1/2 and −2 otherwise. What is its expected payoff?', 3, ['Weight both outcomes by one half.', 'Compute 4 − 1.'], 'E[A] = 0.5 × 8 + 0.5 × (−2) = 3.'),
      choice('payoffs-r', 'recall', 'A risk-neutral decision maker can choose a certain 4 or a fair coin gamble paying 12 on heads and 0 on tails. Which has higher expected payoff?', 'gamble', [['certain', 'The certain 4'], ['gamble', 'The coin gamble'], ['same', 'They have equal expectation']], ['Calculate the gamble’s expectation.', 'Half of 12 is 6.'], 'The gamble has expectation 6, above the certain 4. This comparison assumes risk neutrality.', 2),
      choice('payoffs-e', 'edge', 'A well-calibrated 80%-chance decision fails once. What can you conclude from that outcome alone?', 'limited', [['bad', 'The decision was necessarily bad'], ['limited', 'A single failure does not establish whether the decision process was sound'], ['false', 'The original 80% estimate was mathematically impossible']], ['An event with 20% probability is possible.', 'Evaluate the information and reasoning available before the outcome.'], 'A loss is compatible with a sound decision. One observation alone cannot validate or invalidate the whole process.', 2),
    ], sourceIds: ['trading', 'probability-guide'],
  },
  {
    id: 'information', track: 'decisions', title: 'Value information', summary: 'Ask how much a signal can improve your next action.', minutes: 18, level: 'Advanced', prerequisites: ['payoffs', 'conditioning'],
    objectives: ['Compute expected value with perfect information.', 'Subtract the best uninformed alternative.', 'Recognize when information cannot change an action.'],
    lesson: [
      { title: 'Information is valuable through decisions', body: 'Compute the best expected payoff without the signal. Then compute the expected payoff when you may condition your action on the signal. The difference is the expected value of information before any fee.' },
      { title: 'Perfect information is an upper bound', body: 'A free signal cannot make an optimal decision maker worse off when it can be ignored. A signal has no decision value if every possible signal leads to the same best action. Imperfect information cannot beat perfect information under the same action set.' },
    ],
    questions: [
      numeric('information-f', 'foundation', 'A hidden state is H or L, equally likely. You may decline for 0 or accept a bet paying +10 in H and −6 in L. What is the best expected payoff without information?', 2, ['Compare accepting with declining.', 'The bet’s expected payoff is (10 − 6)/2.'], 'Accepting yields 2 in expectation, above declining for 0.'),
      numeric('information-r', 'recall', 'For the same bet (+10 in H, −6 in L, each state equally likely), a signal reveals the state perfectly before you choose. What is the maximum fee a risk-neutral person would pay for the signal?', 3, ['With the signal, accept only in H.', 'The informed expected payoff is 5, versus 2 without information.'], 'Perfect information raises expected payoff from 2 to 5, so its value before fees is 3.', 3),
      choice('information-e', 'edge', 'A free signal changes your probability estimates but never changes your optimal action or its state-dependent payoff. What is its decision value in this setting?', 'zero', [['positive', 'Always strictly positive'], ['zero', 'Zero'], ['negative', 'Always negative']], ['How can the signal improve the resulting action?', 'Compare expected payoffs with the same action before and after the signal.'], 'If the optimal action and payoffs stay the same for every signal, the expected decision improvement is zero.', 3),
    ], sourceIds: ['probability-guide', 'trading'],
  },
  {
    id: 'stopping', track: 'decisions', title: 'Stop or continue', summary: 'Solve small sequential decisions by working backward.', minutes: 18, level: 'Advanced', prerequisites: ['payoffs', 'expectation'],
    objectives: ['Compare stopping value with continuation value.', 'Use backward induction.', 'Include costs and the remaining horizon.'],
    lesson: [
      { title: 'Start at the last decision', body: 'In a finite-horizon problem, compute what happens at the final opportunity, then move backward. At each state choose the larger of the immediate stopping payoff and the expected value of continuing, after any cost.' },
      { title: 'The horizon changes the policy', body: 'An option to try again has value because it changes future choices. The optimal stopping threshold can depend on how many attempts remain. Do not replace a sequential decision with an average over outcomes without accounting for the choices.' },
    ],
    questions: [
      numeric('stopping-f', 'foundation', 'You may keep 3 or discard it for one final fair die roll, receiving that roll. What is the expected payoff of rerolling?', 3.5, ['Average the six die faces.', 'The sum is 21.'], 'The last roll’s expectation is 21/6 = 3.5. A risk-neutral player would reroll rather than keep 3.'),
      numeric('stopping-r', 'recall', 'You roll a fair die and may either keep it or take one final independent roll. Before the first roll, what is the optimal expected payoff?', 4.25, ['After the first roll, compare its value with the final roll’s expectation of 3.5.', 'Reroll 1, 2 and 3; keep 4, 5 and 6. Average 3.5, 3.5, 3.5, 4, 5 and 6.'], '(3 × 3.5 + 4 + 5 + 6)/6 = 4.25.', 3),
      numeric('stopping-e', 'edge', 'A final reroll of a fair die costs 1, deducted from its payout. You can instead keep your current 3. What is the expected net payoff of rerolling?', 2.5, ['The expected gross payout is 3.5.', 'Subtract the cost regardless of the outcome.'], 'The continuation value is 3.5 − 1 = 2.5, so keeping 3 is better for a risk-neutral player.', 3),
    ], sourceIds: ['probability-guide', 'puzzles'],
  },
  {
    id: 'fair-price', track: 'markets', title: 'From payoff to fair price', summary: 'Connect expected value with a simple two-sided market.', minutes: 16, level: 'Developing', prerequisites: ['expectation'],
    objectives: ['Value a simple uncertain payout.', 'Read a bid and an ask from the dealer’s perspective.', 'Compute profit for a completed round trip.'],
    lesson: [
      { title: 'A baseline value needs assumptions', body: 'For a one-period payout, expected value is a useful reference price when ignoring discounting, fees and risk preferences. A dealer’s bid is the price they pay to buy; their ask is the price they charge to sell.' },
      { title: 'The spread is not guaranteed profit', body: 'The ask minus the bid is the quoted spread. Buying at the bid and later selling at the ask earns that difference only if both trades happen, with no adverse price movement or extra costs. Inventory and counterparty information create risk.' },
    ],
    questions: [
      numeric('fair-price-f', 'foundation', 'A contract pays 20 with probability 0.3 and 0 otherwise. Ignoring discounting and risk preferences, what is its expected payout?', 6, ['Weight each payout by its probability.', 'Compute 20 × 0.3.'], 'The expected payout is 6; this is a baseline valuation under the stated assumptions.'),
      numeric('fair-price-r', 'recall', 'A dealer quotes bid 9, ask 11. They buy one contract at 9 and later sell that same contract at 11, with no fees. What is the realized profit?', 2, ['Track cash paid and cash received.', 'Subtract 9 from 11.'], 'The completed round trip earns 11 − 9 = 2.'),
      choice('fair-price-e', 'edge', 'A dealer posts bid 9 and ask 11 but no one trades. How much spread profit has the dealer realized?', 'none', [['two', '2 per quoted unit'], ['none', '0'], ['ten', '10']], ['Does posting a quote itself exchange any cash?', 'A spread is a quote difference, not an executed trade.'], 'No trades occurred, so the realized trading profit is zero.', 2),
    ], sourceIds: ['probability-guide'],
  },
  {
    id: 'selection', track: 'markets', title: 'Who trades with you?', summary: 'Condition your valuation on the decision to trade.', minutes: 18, level: 'Advanced', prerequisites: ['fair-price', 'conditioning'],
    objectives: ['Explain adverse selection.', 'Condition on informed order flow.', 'Distinguish unconditional value from value after a trade.'],
    lesson: [
      { title: 'A trade can be evidence', body: 'If a counterparty knows more about value than you do, their choice to buy or sell reveals information. An ask above the unconditional mean can still lose money if buyers trade only when the asset is especially valuable.' },
      { title: 'Value the selected outcomes', body: 'Calculate the expected asset value conditional on the event that your quote is accepted. The relevant profit from selling is ask minus conditional value, not necessarily ask minus the unconditional mean.' },
    ],
    questions: [
      numeric('selection-f', 'foundation', 'A contract’s value is 0 or 10, equally likely. What is its unconditional expected value?', 5, ['Average the two equally likely values.', 'Compute (0 + 10)/2.'], 'The unconditional mean is 5.'),
      numeric('selection-r', 'recall', 'The value is 0 or 10. A perfectly informed buyer buys from you at ask 6 only when value is 10. Conditional on a sale, what is your profit at settlement?', -4, ['What value must the contract have when this buyer accepts?', 'You receive 6 for something that pays 10.'], 'Conditional on a sale, profit is 6 − 10 = −4. The buyer’s selection changes the relevant valuation.', 3),
      choice('selection-e', 'edge', 'After repeated informed buyers accept your ask, which response directly addresses adverse selection?', 'condition', [['ignore', 'Assume every trade is independent of asset value'], ['condition', 'Update value estimates using what the order flow implies'], ['volume', 'Increase size because all volume guarantees spread income']], ['An informed decision to buy is evidence about value.', 'Your valuation should reflect that evidence.'], 'Conditioning on order flow addresses the selection mechanism. More volume can magnify losses when quotes are systematically stale.', 3),
    ], sourceIds: ['probability-guide'],
  },
  {
    id: 'inventory', track: 'markets', title: 'Inventory & risk', summary: 'Track a position and understand what a price move does to it.', minutes: 16, level: 'Developing', prerequisites: ['fair-price', 'dispersion'],
    objectives: ['Compute net inventory after trades.', 'Calculate mark-to-market changes.', 'Reason about concentration and hedges.'],
    lesson: [
      { title: 'Separate position from profit', body: 'Buying adds units to inventory; selling subtracts them. Mark-to-market profit from an unchanged position is position × price change. A long position gains when the price rises, while a short position loses.' },
      { title: 'A hedge depends on the relationship', body: 'Equal and opposite positions in the identical payoff cancel exposure. Similar-looking assets may not hedge exactly: correlations can change, and basis risk remains. Position limits can matter even for positive-expectation trades.' },
    ],
    questions: [
      numeric('inventory-f', 'foundation', 'You start flat, buy 8 contracts, then sell 3. What is your net inventory?', 5, ['Treat a buy as positive and a sale as negative.', 'Compute 0 + 8 − 3.'], 'You are long 5 contracts.'),
      numeric('inventory-r', 'recall', 'You hold a short position of 4 units. The price rises by 3 per unit. What is the mark-to-market change in profit?', -12, ['Represent the short position as −4.', 'Multiply −4 by the price change of +3.'], 'The change is −4 × 3 = −12.', 2),
      choice('inventory-e', 'edge', 'Which pair of positions cancels settlement exposure exactly, assuming identical terms and no counterparty risk?', 'identical', [['similar', 'Long 5 of one stock and short 5 of a related stock'], ['identical', 'Long 5 and short 5 of the identical contract'], ['sameway', 'Long 5 of each of two correlated contracts']], ['Similarity does not guarantee equal payoffs.', 'Exact cancellation requires the same payoff with opposite positions.'], 'Equal opposite units of the identical contract net to zero payoff. Related assets can leave basis risk.', 2),
    ], sourceIds: ['probability-guide', 'trading'],
  },
  {
    id: 'complexity', track: 'algorithms', title: 'Reason about work', summary: 'Count operations before reaching for asymptotic notation.', minutes: 16, level: 'Foundation', prerequisites: ['counting'],
    objectives: ['Count simple loop iterations.', 'Recognize linear and quadratic growth.', 'Separate asymptotic scale from real runtime.'],
    lesson: [
      { title: 'Model the dominant work', body: 'A loop over n objects performs n iterations. A full nested loop over all ordered pairs performs n². Big-O describes a growth bound as input size increases, not the exact wall-clock time on one machine.' },
      { title: 'Use the right abstraction', body: 'State what counts as one operation and what n measures. A constant-time assumption for a primitive may fail for huge integers or variable-length strings. First produce a correct simple solution, then identify the actual bottleneck.' },
    ],
    questions: [
      numeric('complexity-f', 'foundation', 'An outer loop runs 7 times and its inner loop runs 4 times on every iteration. How many times does the inner body execute?', 28, ['The inner loop repeats once per outer iteration.', 'Multiply 7 by 4.'], '7 × 4 = 28 executions.'),
      choice('complexity-r', 'recall', 'A routine examines every ordered pair (i, j), each from 1 through n. What is its operation growth?', 'quadratic', [['linear', 'Linear: proportional to n'], ['quadratic', 'Quadratic: proportional to n²'], ['log', 'Logarithmic: proportional to log n']], ['There are n choices for each coordinate.', 'Multiply the choices.'], 'There are n² ordered pairs.', 2),
      choice('complexity-e', 'edge', 'Algorithm A is O(n), and B is O(n log n). Which statement must be true about a single input size n = 10?', 'neither', [['a', 'A must be faster'], ['b', 'B must be faster'], ['neither', 'The growth classes alone do not determine which is faster']], ['Big-O hides constants and lower-order terms.', 'Runtime also depends on implementation, hardware and the actual input.'], 'Asymptotic classes alone do not establish runtime at one small input size.', 2),
    ], sourceIds: ['engineering'],
  },
  {
    id: 'search', track: 'algorithms', title: 'Search with an invariant', summary: 'Make each comparison remove a well-defined region.', minutes: 18, level: 'Developing', prerequisites: ['complexity'],
    objectives: ['Explain why sortedness enables binary search.', 'Track a valid search interval.', 'Handle absent keys and boundary cases.'],
    lesson: [
      { title: 'Maintain a promise about the remaining region', body: 'Binary search preserves an invariant: if the target exists, it remains in the current candidate interval. Comparing with the midpoint removes one side because the data are sorted. Define inclusive or half-open boundaries consistently.' },
      { title: 'Specify the output before coding', body: 'Finding any occurrence, the first occurrence, and an insertion position are different tasks. Duplicates and absent keys make the difference visible. State the contract and test empty data and both ends of the range.' },
    ],
    questions: [
      numeric('search-f', 'foundation', 'A sorted list is [2, 5, 8, 11, 14]. The middle value 8 is below your target 11. How many elements remain strictly to the right of that middle position?', 2, ['List the elements after 8.', 'They are 11 and 14.'], 'Two elements remain as candidates when the midpoint is below the target.'),
      numeric('search-r', 'recall', 'A search starts with 64 candidate positions and exactly halves that count after each step. After 4 steps, how many candidates remain?', 4, ['Divide by 2 four times.', '64 → 32 → 16 → 8 → 4.'], '64/2⁴ = 4.', 2),
      choice('search-e', 'edge', 'You need the first occurrence of a duplicated target. After finding a matching midpoint, which reasoning is correct?', 'left', [['stop', 'Always return immediately'], ['left', 'Preserve the match and continue checking the left portion for an earlier match'], ['right', 'Discard every position left of the midpoint']], ['A matching element need not be the first match.', 'Earlier matching elements can only be on the left.'], 'The contract requires checking for earlier duplicates while preserving the best known match.', 3),
    ], sourceIds: ['engineering'],
  },
  {
    id: 'graphs', track: 'algorithms', title: 'Explore states & graphs', summary: 'Use a frontier and a visited set to explore without looping.', minutes: 18, level: 'Developing', prerequisites: ['complexity'],
    objectives: ['Model transitions as graph edges.', 'Use breadth-first search for unweighted shortest paths.', 'Avoid revisiting states in cyclic graphs.'],
    lesson: [
      { title: 'A state graph can be implicit', body: 'A node describes a complete state, and an edge describes one permitted transition. You can generate neighbors as needed rather than storing the whole graph. The state must retain every fact needed to determine future transitions.' },
      { title: 'Match the frontier to the objective', body: 'Breadth-first search uses a queue and discovers nodes in nondecreasing edge distance when every edge has equal cost. Marking nodes visited prevents cycles from causing repeated exploration. Weighted edges require different reasoning.' },
    ],
    questions: [
      numeric('graphs-f', 'foundation', 'An undirected graph has edges A–B, B–C, A–D and D–C. What is the shortest number of edges from A to C?', 2, ['Try the routes through B and D.', 'Either route uses two edges.'], 'A–B–C and A–D–C both have length 2.'),
      choice('graphs-r', 'recall', 'Which frontier discipline gives shortest edge-count paths in an unweighted graph?', 'queue', [['stack', 'A last-in, first-out stack'], ['queue', 'A first-in, first-out queue'], ['random', 'Randomly selecting an unexplored node']], ['Process all distance-one nodes before distance-two nodes.', 'A queue preserves discovery order.'], 'Breadth-first search uses a FIFO queue to expand layers in distance order.', 2),
      choice('graphs-e', 'edge', 'A graph contains A → B → A. What prevents a naive traversal from exploring that cycle forever?', 'visited', [['sorting', 'Alphabetically sorting node names'], ['visited', 'Recording discovered states and not rediscovering them'], ['recursion', 'Using recursion without any additional state']], ['The same state can be reached repeatedly.', 'Remember which states have already entered the frontier.'], 'A visited/discovered set prevents repeated exploration of the same state.', 2),
    ], sourceIds: ['engineering', 'puzzles'],
  },
  {
    id: 'invariants', track: 'programming', title: 'State your invariants', summary: 'Define what must stay true before implementing operations.', minutes: 16, level: 'Foundation', prerequisites: [],
    objectives: ['Write a data structure’s safety condition.', 'Check that each operation preserves it.', 'Recognize boundary cases.'],
    lesson: [
      { title: 'An invariant is a promise about every valid state', body: 'For a bounded queue, a useful invariant is 0 ≤ size ≤ capacity. Operations must either preserve the promise or explicitly reject the operation. Preconditions, postconditions and error behavior turn a vague feature into a checkable contract.' },
      { title: 'Trace the smallest cases', body: 'Empty and full states often expose errors hidden by ordinary examples. Trace one operation at a time and state which values change. Prefer a clear representation whose invariant is easy to preserve.' },
    ],
    questions: [
      numeric('invariants-f', 'foundation', 'A queue starts empty. Enqueue two items and dequeue one successful item. What is its size?', 1, ['Enqueue increases size by one.', 'Compute 0 + 2 − 1.'], 'The final queue size is 1.'),
      choice('invariants-r', 'recall', 'A queue has capacity 5. Which is a valid size invariant?', 'bounded', [['positive', 'size > 0 always'], ['bounded', '0 ≤ size ≤ 5'], ['fixed', 'size = 5 always']], ['The queue can be empty or full.', 'A valid size cannot be negative or exceed capacity.'], 'The inclusive bounds cover empty, partial and full queue states.'),
      choice('invariants-e', 'edge', 'A dequeue operation is requested on an empty queue. Which implementation contract is clearest?', 'explicit', [['negative', 'Reduce size to −1 and continue'], ['explicit', 'Return a documented empty result or raise a documented error without corrupting state'], ['invent', 'Return an arbitrary previous item']], ['The operation must preserve the invariant.', 'Specify what the caller receives when no item exists.'], 'Explicit empty/error behavior preserves state and gives callers a usable contract.', 2),
    ], sourceIds: ['engineering'],
  },
  {
    id: 'streams', track: 'programming', title: 'Process a stream safely', summary: 'Handle retries, duplicates and small pieces of state.', minutes: 18, level: 'Developing', prerequisites: ['invariants'],
    objectives: ['Update aggregates incrementally.', 'Identify idempotent operations.', 'Explain duplicate-processing risks.'],
    lesson: [
      { title: 'Incremental state needs enough information', body: 'A running mean needs a sum and a count, or an equivalent update rule. Keeping only the current mean loses how much weight it represents. For n observations, the new mean after x is (n × old_mean + x)/(n + 1).' },
      { title: 'Retries can repeat side effects', body: 'An idempotent operation has the same effect when applied again with the same identity. A payment or counter increment is not naturally idempotent. Stable event IDs and atomic deduplication can prevent a retried event from changing state twice.' },
    ],
    questions: [
      numeric('streams-f', 'foundation', 'A stream aggregate has sum 30 and count 5. A new observation is 12. What is the updated mean?', 7, ['Update both sum and count.', 'The new sum is 42 and count is 6.'], '42/6 = 7.'),
      choice('streams-r', 'recall', 'Which operation is idempotent when repeated with the same input?', 'set', [['increment', 'Increment the balance by 10'], ['append', 'Append a new row without a unique identity'], ['set', 'Set the user’s preferred language to English']], ['Compare applying the operation once with applying it twice.', 'Setting a fixed value leaves the same final state.'], 'Setting the same preference repeatedly has the same result. Incrementing or blindly appending repeats the effect.', 2),
      numeric('streams-e', 'edge', 'A total starts at 0. Events are (id=a, amount=4), (id=b, amount=7), (id=a, amount=4). Deduplicate by event ID. What total should result?', 11, ['The third event repeats identity a.', 'Count a once and b once.'], 'The unique events contribute 4 + 7 = 11.', 2),
    ], sourceIds: ['engineering', 'engineering-update'],
  },
  {
    id: 'verification', track: 'programming', title: 'Verify the behavior', summary: 'Use concrete cases and properties to challenge an implementation.', minutes: 18, level: 'Advanced', prerequisites: ['invariants', 'search'],
    objectives: ['Derive tests from a contract.', 'Use edge cases and independent properties.', 'Review generated code rather than trusting its appearance.'],
    lesson: [
      { title: 'Start with the behavior you need', body: 'A test should follow from a contract rather than duplicate the implementation. For a sorting routine, verify that output is ordered and preserves the input multiset. Either property alone is insufficient: an empty output is ordered but discards everything.' },
      { title: 'Small counterexamples are powerful', body: 'Try empty inputs, duplicates, boundaries and malformed data when relevant. Generated code still needs the same review: understand assumptions, inspect state changes and check results independently. A plausible explanation is not execution evidence.' },
    ],
    questions: [
      choice('verification-f', 'foundation', 'A sorting function returns an empty list for every input. Which test property catches the bug for input [3, 1]?', 'preserve', [['ordered', 'Output is in nondecreasing order'], ['preserve', 'Output preserves every input element with its multiplicity'], ['type', 'Output is a list']], ['An empty list satisfies sorted order.', 'Compare the content of the input and output.'], 'Multiset preservation catches missing elements; sortedness alone does not.'),
      choice('verification-r', 'recall', 'A function should return the maximum of a nonempty list. Which input specifically tests a common “initialize maximum to zero” bug?', 'negative', [['positive', '[1, 2, 3]'], ['negative', '[−8, −3, −5]'], ['zero', '[0, 2]']], ['What if every actual value is below zero?', 'A zero initializer could return a value absent from the list.'], 'For all-negative input, the correct maximum is −3. Initializing to zero can incorrectly return 0.', 2),
      choice('verification-e', 'edge', 'An AI-generated function passes its own three happy-path examples. What is the strongest next step?', 'independent', [['trust', 'Assume correctness because the explanation is convincing'], ['independent', 'Check the contract with independently chosen edge cases and properties'], ['style', 'Only rename variables']], ['The examples may share the implementation’s assumptions.', 'Look for cases that could falsify the intended behavior.'], 'Independent checks provide evidence beyond the generator’s own examples and explanation.', 3),
    ], sourceIds: ['engineering', 'engineering-update'],
  },
  {
    id: 'assumptions', track: 'communication', title: 'Clarify the model', summary: 'Ask the question that changes the mathematics.', minutes: 12, level: 'Foundation', prerequisites: [],
    objectives: ['Identify missing assumptions.', 'Clarify the objective and constraints.', 'Distinguish a useful question from premature calculation.'],
    lesson: [
      { title: 'Find the ambiguity that affects the result', body: 'Before solving, state the objective and the uncertain parts of the model. Does selection use replacement? Are outcomes equally likely? Does “best” mean expected return, worst-case performance or something else? Ask concise questions that affect the solution.' },
      { title: 'Make an explicit provisional assumption', body: 'When clarification is unavailable, state a reasonable assumption and explain how the answer depends on it. Separate given facts from your own modeling choices. This lets a collaborator correct the model before you invest in the wrong calculation.' },
    ],
    questions: [
      choice('assumptions-f', 'foundation', 'A problem says “draw two cards from a deck.” Which missing detail directly changes the chance of drawing the same physical card twice?', 'replacement', [['color', 'Whether the table is green'], ['replacement', 'Whether the first card is replaced before the second draw'], ['time', 'The wall-clock time of the draw']], ['Can a removed card appear again?', 'Replacement determines whether it is available on the second draw.'], 'Replacement changes the sample space and dependence between draws.'),
      choice('assumptions-r', 'recall', 'A collaborator asks for the “best” strategy without specifying a goal. What is the most useful first clarification?', 'objective', [['objective', 'Which objective and constraints define best?'], ['syntax', 'Which variable names should I use?'], ['answer', 'Can you tell me the final answer first?']], ['Different objectives may favor different strategies.', 'Expected return and worst-case loss are different criteria.'], 'An explicit objective and constraints make strategy comparisons meaningful.'),
      choice('assumptions-e', 'edge', 'You must proceed before a missing assumption can be clarified. Which response best supports collaboration?', 'state', [['hide', 'Silently choose an assumption and report a definitive answer'], ['state', 'State the provisional assumption and explain which conclusions depend on it'], ['halt', 'Declare the entire problem impossible without exploring anything']], ['Your collaborator needs to distinguish facts from modeling choices.', 'Proceed transparently so the model can be corrected.'], 'Explicit assumptions support progress while keeping uncertainty visible.', 2),
    ], sourceIds: ['trading', 'engineering'],
  },
  {
    id: 'calibration', track: 'communication', title: 'Express uncertainty', summary: 'Give confidence a meaning and change your mind with evidence.', minutes: 14, level: 'Developing', prerequisites: ['sample-spaces', 'assumptions'],
    objectives: ['Interpret probabilistic confidence.', 'Distinguish uncertainty from ignorance.', 'Update a claim without disguising an error.'],
    lesson: [
      { title: 'A probability is not a guarantee', body: 'If many comparable forecasts assigned 70% are calibrated, roughly 70% of those events occur. A single miss is expected sometimes. Calibration requires a collection of predictions and appropriate comparison, not one anecdote.' },
      { title: 'Name what would change your mind', body: 'State your current belief, the evidence supporting it and the assumptions carrying the most uncertainty. If new evidence contradicts a step, identify the step and update downstream conclusions. Clear correction is part of reliable reasoning.' },
    ],
    questions: [
      numeric('calibration-f', 'foundation', 'Across 100 comparable, well-calibrated forecasts each assigned 70%, approximately how many events should occur on average?', 70, ['Interpret 70% across repeated comparable forecasts.', 'Multiply 100 by 0.7.'], 'The expected count is 70. The realized count need not equal exactly 70.'),
      choice('calibration-r', 'recall', 'A 70% forecast fails once. Which statement is correct?', 'possible', [['impossible', 'This outcome was impossible under the forecast'], ['possible', 'The outcome was possible; one miss alone does not show miscalibration'], ['certain', 'The event’s probability was really zero']], ['The complementary outcome had 30% probability.', 'Calibration is assessed over suitable collections of forecasts.'], 'A 30% outcome can occur. One failure is insufficient to assess calibration.', 2),
      choice('calibration-e', 'edge', 'You discover a denominator error in your reasoning. What is the clearest correction?', 'revise', [['conceal', 'Keep the conclusion because changing it looks uncertain'], ['revise', 'Identify the denominator error, recompute, and update any dependent conclusions'], ['replace', 'Change the final number without explaining why']], ['Others may rely on the intermediate reasoning.', 'Explain exactly which step changed and propagate the correction.'], 'A specific, propagated correction makes the reasoning auditable and supports productive collaboration.', 2),
    ], sourceIds: ['trading', 'engineering', 'probability-guide'],
  },
  {
    id: 'collaboration', track: 'communication', title: 'Make your reasoning usable', summary: 'Communicate a plan, test it and work with feedback.', minutes: 14, level: 'Developing', prerequisites: ['assumptions', 'calibration'],
    objectives: ['Explain an approach before details overwhelm it.', 'Use counterexamples constructively.', 'Turn feedback into a testable revision.'],
    lesson: [
      { title: 'Give the collaborator a map', body: 'State the goal, the model and the next useful step. As you work, explain decisions that affect correctness, rather than narrating every mechanical action. Concrete examples make abstract claims easy to inspect.' },
      { title: 'Defend ideas by testing them', body: 'When challenged, identify the precise claim at issue and test a small example or boundary case. Preserve correct parts and revise the failed part. Good collaboration needs both independent thought and willingness to respond to evidence.' },
    ],
    questions: [
      choice('collaboration-f', 'foundation', 'Before implementing a nontrivial solution with a partner, which opening is most useful?', 'plan', [['silent', 'Start typing silently until the program is complete'], ['plan', 'State the goal, proposed representation and a small example to check'], ['jargon', 'List technical terms without connecting them to the problem']], ['Your partner needs to understand the approach early enough to help.', 'A compact plan plus an example creates shared context.'], 'A short, concrete plan lets collaborators inspect assumptions and suggest useful changes.'),
      choice('collaboration-r', 'recall', 'Your partner gives a counterexample to one step. What should you do first?', 'inspect', [['dismiss', 'Dismiss it because your answer seems plausible'], ['inspect', 'Walk through the counterexample and locate the failing claim'], ['restart', 'Discard every part of the work immediately']], ['A counterexample targets a particular claim.', 'Trace it carefully before deciding what must change.'], 'Inspecting the example reveals whether the objection is valid and which parts require revision.'),
      choice('collaboration-e', 'edge', 'You and a partner disagree about whether an optimization preserves behavior. What is the most useful next move?', 'contract', [['vote', 'Choose whichever idea was stated more confidently'], ['contract', 'State the required behavior and test the disputed cases against it'], ['speed', 'Assume the faster implementation must be better']], ['Correctness is relative to a shared contract.', 'Use concrete cases and invariants to compare both versions.'], 'An agreed behavioral contract and targeted tests turn a vague disagreement into a checkable claim.', 2),
    ], sourceIds: ['trading', 'engineering'],
  },
];

/** Held apart from lesson practice so the mixed assessment can connect several ideas. */
export const integrativeQuestion = {
  moduleId: 'conditioning',
  question: numeric(
    'integration-signal-price',
    'edge',
    'A contract pays 12 if a hidden state is H and 0 if it is L. Before a signal, P(H) = 1/4. A green signal has probability 4/5 in H and 1/5 in L. You observe green, then may buy one contract for 6. Ignoring fees, discounting and risk preferences, what is the expected profit from buying after this signal? Enter a number or fraction.',
    6/7,
    ['First calculate P(H | green) using the prior and both signal likelihoods.', 'P(H and green) = 1/5 and P(green) = 7/20, so P(H | green) = 4/7. Multiply by 12 and subtract the price of 6.'],
    'The joint chance of H and green is (1/4)(4/5) = 1/5. The green-signal chance is 1/5 + (3/4)(1/5) = 7/20. Therefore P(H | green) = 4/7, the conditional expected payout is 48/7, and expected profit is 48/7 − 6 = 6/7 ≈ 0.8571. This combines conditioning, valuation and a decision at a stated price.',
    4,
  ),
};
