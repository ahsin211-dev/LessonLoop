const { SUBSCALE_BY_KEY, SCORE_MIN, SCORE_MAX } = require('../constants/subscales');
const { QUESTION_BY_ID } = require('../constants/questions');

function effectiveScore(rawValue, reverseScored) {
  if (reverseScored) {
    return SCORE_MAX + SCORE_MIN - rawValue;
  }
  return rawValue;
}

function validateAnswerValue(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < SCORE_MIN || num > SCORE_MAX) {
    return { valid: false, error: `Answer must be integer ${SCORE_MIN}–${SCORE_MAX}` };
  }
  return { valid: true, value: num };
}

function mean(values) {
  if (!values.length) return null;
  return round2(values.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Score a single student's responses.
 */
function scoreStudentResponses(responses) {
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
      respondentId: resp.respondentId,
    });

    if (!byCategory[resp.categoryKey]) byCategory[resp.categoryKey] = [];
    byCategory[resp.categoryKey].push(scored);
  }

  const categoryMeans = {};
  for (const [key, values] of Object.entries(byCategory)) {
    categoryMeans[key] = mean(values);
  }

  return { byCategory, categoryMeans, questionScores };
}

/**
 * Aggregate responses from multiple anonymous students into subscale and overall scores.
 * Per-student category means are computed first, then averaged across students.
 */
function computeEngagementScores(responses, selectedCategories) {
  const byRespondent = {};
  for (const resp of responses) {
    const rid = resp.respondentId || 'legacy-anonymous';
    if (!byRespondent[rid]) byRespondent[rid] = [];
    byRespondent[rid].push(resp);
  }

  const studentCount = Object.keys(byRespondent).length;
  const studentScores = Object.entries(byRespondent).map(([respondentId, studentResponses]) => ({
    respondentId,
    ...scoreStudentResponses(studentResponses),
  }));

  const allQuestionScores = studentScores.flatMap((s) => s.questionScores);

  const subscaleScores = selectedCategories.map((categoryKey) => {
    const subscale = SUBSCALE_BY_KEY[categoryKey];
    const studentCategoryMeans = studentScores
      .map((s) => s.categoryMeans[categoryKey])
      .filter((v) => v != null);

    const score = mean(studentCategoryMeans);
    const percent = score !== null ? round2(((score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100) : null;

    const questionIds = [...new Set(
      allQuestionScores.filter((q) => q.categoryKey === categoryKey).map((q) => q.questionId),
    )];

    const questionBreakdown = questionIds.map((questionId) => {
      const qScores = allQuestionScores.filter((q) => q.questionId === questionId);
      return {
        questionId,
        categoryKey,
        meanScore: mean(qScores.map((q) => q.effectiveValue)),
        responseCount: qScores.length,
      };
    });

    return {
      categoryKey,
      displayName: subscale?.displayName ?? categoryKey,
      group: subscale?.group ?? 'unknown',
      score,
      percent,
      studentCount: studentCategoryMeans.length,
      responseCount: allQuestionScores.filter((q) => q.categoryKey === categoryKey).length,
      questionBreakdown,
    };
  });

  const scoredSubscales = subscaleScores.filter((s) => s.score !== null);
  const overallScore = scoredSubscales.length
    ? mean(scoredSubscales.map((s) => s.score))
    : null;
  const overallPercent = overallScore !== null
    ? round2(((overallScore - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100)
    : null;

  return {
    overallScore,
    overallPercent,
    subscaleScores,
    studentCount,
    totalResponses: responses.length,
    responseCount: responses.length,
    scoredAt: new Date().toISOString(),
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = {
  effectiveScore,
  validateAnswerValue,
  scoreStudentResponses,
  computeEngagementScores,
  mean,
};
