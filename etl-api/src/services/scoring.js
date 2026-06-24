const { SUBSCALE_BY_KEY, SCORE_MIN, SCORE_MAX } = require('../constants/subscales');
const { QUESTION_BY_ID } = require('../constants/questions');

/**
 * Apply reverse scoring for negatively framed items (e.g. mitigating factors).
 * Raw Likert 1–5 becomes effective score where higher = better engagement.
 */
function effectiveScore(rawValue, reverseScored) {
  if (reverseScored) {
    return SCORE_MAX + SCORE_MIN - rawValue;
  }
  return rawValue;
}

/**
 * Validate a single Likert response value.
 */
function validateAnswerValue(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < SCORE_MIN || num > SCORE_MAX) {
    return { valid: false, error: `Answer must be integer ${SCORE_MIN}–${SCORE_MAX}` };
  }
  return { valid: true, value: num };
}

/**
 * Aggregate raw responses into per-question, per-subscale, and overall scores.
 *
 * @param {Array<{questionId: string, categoryKey: string, answerValue: number}>} responses
 * @param {string[]} selectedCategories - categories included in this survey session
 * @returns {object} Scored report payload
 */
function computeEngagementScores(responses, selectedCategories) {
  const byCategory = {};
  const questionScores = [];

  for (const resp of responses) {
    const question = QUESTION_BY_ID[resp.questionId];
    const reverseScored = resp.reverseScored ?? question?.reverseScored ?? SUBSCALE_BY_KEY[resp.categoryKey]?.reverseScored ?? false;
    const validation = validateAnswerValue(resp.answerValue);
    if (!validation.valid) {
      throw new Error(`Invalid answer for question ${resp.questionId}: ${validation.error}`);
    }

    const raw = validation.value;
    const scored = effectiveScore(raw, reverseScored);

    questionScores.push({
      questionId: resp.questionId,
      categoryKey: resp.categoryKey,
      rawValue: raw,
      effectiveValue: scored,
      reverseScored,
    });

    if (!byCategory[resp.categoryKey]) {
      byCategory[resp.categoryKey] = [];
    }
    byCategory[resp.categoryKey].push(scored);
  }

  const subscaleScores = selectedCategories.map((categoryKey) => {
    const values = byCategory[categoryKey] || [];
    const subscale = SUBSCALE_BY_KEY[categoryKey];
    const score = values.length
      ? round2(values.reduce((a, b) => a + b, 0) / values.length)
      : null;
    const percent = score !== null ? round2(((score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100) : null;

    return {
      categoryKey,
      displayName: subscale?.displayName ?? categoryKey,
      group: subscale?.group ?? 'unknown',
      score,
      percent,
      responseCount: values.length,
      questionScores: questionScores.filter((q) => q.categoryKey === categoryKey),
    };
  });

  const scoredSubscales = subscaleScores.filter((s) => s.score !== null);
  const overallScore = scoredSubscales.length
    ? round2(scoredSubscales.reduce((a, b) => a + b.score, 0) / scoredSubscales.length)
    : null;
  const overallPercent = overallScore !== null
    ? round2(((overallScore - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100)
    : null;

  return {
    overallScore,
    overallPercent,
    subscaleScores,
    totalResponses: responses.length,
    scoredAt: new Date().toISOString(),
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = {
  effectiveScore,
  validateAnswerValue,
  computeEngagementScores,
};
