const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { computeEngagementScores, effectiveScore, validateAnswerValue } = require('../src/services/scoring');
const { ALL_SUBSCALE_KEYS } = require('../src/constants/subscales');
const { generateRecommendations } = require('../src/services/recommendations');

describe('validateAnswerValue', () => {
  it('accepts valid Likert values 1-5', () => {
    assert.equal(validateAnswerValue(3).valid, true);
    assert.equal(validateAnswerValue(3).value, 3);
  });

  it('rejects out of range values', () => {
    assert.equal(validateAnswerValue(0).valid, false);
    assert.equal(validateAnswerValue(6).valid, false);
  });
});

describe('effectiveScore', () => {
  it('reverse scores negatively framed items', () => {
    assert.equal(effectiveScore(1, true), 5);
    assert.equal(effectiveScore(5, true), 1);
    assert.equal(effectiveScore(3, false), 3);
  });
});

describe('computeEngagementScores', () => {
  it('computes overall and nine subscale scores', () => {
    const responses = ALL_SUBSCALE_KEYS.map((key, i) => ({
      questionId: `${key}_q`,
      categoryKey: key,
      answerValue: (i % 5) + 1,
      reverseScored: key === 'mitigating_factors',
    }));

    // Override with known question IDs from bank
    const { pickQuestionsForCategories } = require('../src/constants/questions');
    const questions = pickQuestionsForCategories(ALL_SUBSCALE_KEYS);
    const realResponses = questions.map((q, i) => ({
      questionId: q.id,
      categoryKey: q.categoryKey,
      answerValue: (i % 5) + 1,
      reverseScored: q.reverseScored || false,
    }));

    const result = computeEngagementScores(realResponses, ALL_SUBSCALE_KEYS);

    assert.equal(result.subscaleScores.length, 9);
    assert.ok(result.overallScore >= 1 && result.overallScore <= 5);
    assert.ok(result.overallPercent >= 0 && result.overallPercent <= 100);
    for (const sub of result.subscaleScores) {
      assert.ok(sub.score >= 1 && sub.score <= 5);
      assert.equal(sub.questionScores.length, 1);
    }
  });

  it('handles mitigating_factors reverse scoring', () => {
    const { pickQuestionsForCategories } = require('../src/constants/questions');
    const q = pickQuestionsForCategories(['mitigating_factors'])[0];
    const result = computeEngagementScores(
      [{ questionId: q.id, categoryKey: 'mitigating_factors', answerValue: 5 }],
      ['mitigating_factors'],
    );
    // High distraction (5) reverse-scored → effective 1
    assert.equal(result.subscaleScores[0].score, 1);
  });
});

describe('generateRecommendations', () => {
  it('recommends strategies for low-scoring subscales', () => {
    const report = {
      sessionId: 'test',
      overallScore: 2.5,
      subscaleScores: [
        { categoryKey: 'student_agency', displayName: 'Student Agency', score: 2.0 },
        { categoryKey: 'cognitive', displayName: 'Cognitive', score: 4.5 },
      ],
    };
    const recs = generateRecommendations(report, 3.5);
    assert.equal(recs.recommendations.length, 1);
    assert.equal(recs.recommendations[0].categoryKey, 'student_agency');
    assert.ok(recs.metadata.bedrockStub);
  });
});
