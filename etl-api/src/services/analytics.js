const { mean } = require('../services/scoring');
const { ALL_SUBSCALE_KEYS, SUBSCALE_BY_KEY } = require('../constants/subscales');
const { listSessionsForTeacher } = require('../repositories/survey');

/**
 * Aggregate engagement analytics across a teacher's completed sessions.
 */
async function computeTeacherAnalytics(teacherId) {
  const sessions = await listSessionsForTeacher(teacherId, 100);
  const completed = sessions.filter((s) => s.status === 'completed');

  const reports = [];
  for (const session of completed) {
    const { getReport } = require('../repositories/survey');
    const report = await getReport(session.sessionId);
    if (report) reports.push({ session, report });
  }

  const overallScores = reports.map((r) => r.report.overallScore).filter((s) => s != null);
  const totalStudents = reports.reduce((sum, r) => sum + (r.report.studentCount || 0), 0);

  const subscaleAggregates = ALL_SUBSCALE_KEYS.map((categoryKey) => {
    const scores = reports.flatMap((r) => {
      const sub = (r.report.subscaleScores || []).find((s) => s.categoryKey === categoryKey);
      return sub?.score != null ? [sub.score] : [];
    });
    const subscale = SUBSCALE_BY_KEY[categoryKey];
    return {
      categoryKey,
      displayName: subscale?.displayName ?? categoryKey,
      group: subscale?.group,
      averageScore: mean(scores),
      sessionCount: scores.length,
    };
  }).filter((s) => s.sessionCount > 0);

  return {
    teacherId,
    sessionCount: completed.length,
    reportCount: reports.length,
    totalStudents,
    averageOverallScore: mean(overallScores),
    subscaleAggregates,
    recentSessions: reports.slice(0, 10).map(({ session, report }) => ({
      sessionId: session.sessionId,
      lessonTitle: session.lessonTitle,
      lessonId: session.lessonId,
      overallScore: report.overallScore,
      studentCount: report.studentCount,
      scoredAt: report.scoredAt,
    })),
    computedAt: new Date().toISOString(),
  };
}

module.exports = { computeTeacherAnalytics };
