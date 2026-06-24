const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { mean } = require('../src/services/scoring');

describe('mean', () => {
  it('computes average', () => {
    assert.equal(mean([2, 4]), 3);
    assert.equal(mean([]), null);
  });
});

describe('computeTeacherAnalytics', () => {
  it('aggregates subscale scores across reports', async () => {
    const surveyRepo = require('../src/repositories/survey');
    const originalList = surveyRepo.listSessionsForTeacher;
    const originalGet = surveyRepo.getReport;

    surveyRepo.listSessionsForTeacher = async () => [{
      sessionId: 's1',
      status: 'completed',
      lessonTitle: 'L1',
      lessonId: 'l1',
    }];
    surveyRepo.getReport = async () => ({
      overallScore: 4,
      studentCount: 10,
      subscaleScores: [
        { categoryKey: 'cognitive', score: 4 },
        { categoryKey: 'social', score: 3 },
      ],
      scoredAt: new Date().toISOString(),
    });

    const { computeTeacherAnalytics } = require('../src/services/analytics');
    const result = await computeTeacherAnalytics('teacher-1');

    assert.equal(result.reportCount, 1);
    assert.equal(result.totalStudents, 10);
    assert.equal(result.averageOverallScore, 4);
    assert.ok(result.subscaleAggregates.length >= 2);

    surveyRepo.listSessionsForTeacher = originalList;
    surveyRepo.getReport = originalGet;
  });
});
