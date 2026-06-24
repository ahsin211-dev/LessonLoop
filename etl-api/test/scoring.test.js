const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { computeEngagementScores, effectiveScore, validateAnswerValue } = require('../src/services/scoring');
const { ALL_SUBSCALE_KEYS } = require('../src/constants/subscales');
const { pickQuestionsForCategories } = require('../src/constants/questions');
const { generateRecommendations } = require('../src/services/recommendations');
const { signToken, verifyDevToken } = require('../src/lib/auth');

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
    const questions = pickQuestionsForCategories(ALL_SUBSCALE_KEYS);
    const realResponses = questions.map((q, i) => ({
      questionId: q.id,
      categoryKey: q.categoryKey,
      answerValue: (i % 5) + 1,
      reverseScored: q.reverseScored || false,
      respondentId: 'student-1',
    }));

    const result = computeEngagementScores(realResponses, ALL_SUBSCALE_KEYS);

    assert.equal(result.subscaleScores.length, 9);
    assert.equal(result.studentCount, 1);
    assert.ok(result.overallScore >= 1 && result.overallScore <= 5);
    for (const sub of result.subscaleScores) {
      assert.ok(sub.score >= 1 && sub.score <= 5);
      assert.ok(sub.questionBreakdown.length >= 1);
    }
  });

  it('aggregates multiple students per subscale', () => {
    const q = pickQuestionsForCategories(['cognitive'])[0];
    const result = computeEngagementScores([
      { questionId: q.id, categoryKey: 'cognitive', answerValue: 5, respondentId: 's1' },
      { questionId: q.id, categoryKey: 'cognitive', answerValue: 3, respondentId: 's2' },
    ], ['cognitive']);

    assert.equal(result.studentCount, 2);
    assert.equal(result.subscaleScores[0].score, 4);
  });

  it('handles mitigating_factors reverse scoring', () => {
    const q = pickQuestionsForCategories(['mitigating_factors'])[0];
    const result = computeEngagementScores(
      [{ questionId: q.id, categoryKey: 'mitigating_factors', answerValue: 5, respondentId: 's1' }],
      ['mitigating_factors'],
    );
    assert.equal(result.subscaleScores[0].score, 1);
  });
});

describe('pickQuestionsForCategories', () => {
  it('picks multiple questions per category', () => {
    const questions = pickQuestionsForCategories(['cognitive', 'social'], { questionsPerCategory: 2, seed: 42 });
    assert.equal(questions.length, 4);
    const cogIds = questions.filter((q) => q.categoryKey === 'cognitive').map((q) => q.id);
    assert.equal(new Set(cogIds).size, 2);
  });
});

describe('generateRecommendations', () => {
  it('recommends strategies for low-scoring subscales', async () => {
    const report = {
      sessionId: 'test',
      lessonTitle: 'Test Lesson',
      overallScore: 2.5,
      subscaleScores: [
        { categoryKey: 'student_agency', displayName: 'Student Agency', score: 2.0 },
        { categoryKey: 'cognitive', displayName: 'Cognitive', score: 4.5 },
      ],
    };
    const recs = await generateRecommendations(report, { threshold: 3.5 });
    assert.equal(recs.recommendations.length, 1);
    assert.equal(recs.recommendations[0].categoryKey, 'student_agency');
    assert.ok(recs.recommendations[0].activity);
    assert.ok(recs.metadata.bedrockStub);
  });
});

describe('auth', () => {
  it('signs and verifies JWT tokens', () => {
    const token = signToken({ teacherId: 't1', email: 't@x.com', name: 'Teacher' });
    const decoded = verifyDevToken(token);
    assert.equal(decoded.sub, 't1');
    assert.equal(decoded.email, 't@x.com');
  });
});
