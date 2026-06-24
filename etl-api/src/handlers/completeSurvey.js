const { ok, badRequest, notFound } = require('../lib/response');
const { requireSessionOwner } = require('../lib/auth');
const { withHandler } = require('../lib/handler');
const { computeEngagementScores } = require('../services/scoring');
const {
  getSession,
  listResponses,
  saveReport,
  markSessionComplete,
  getReport,
} = require('../repositories/survey');

exports.handler = withHandler(async (event) => {
  const sessionId = event.pathParameters?.sessionId;
  if (!sessionId) return notFound('Session not found');

  const session = await getSession(sessionId);
  if (!session) return notFound('Session not found');

  await requireSessionOwner(event, session);

  const existingReport = await getReport(sessionId);
  if (existingReport) {
    return ok({
      sessionId,
      status: 'completed',
      report: formatReport(existingReport),
      message: 'Report already generated',
    });
  }

  const rawResponses = await listResponses(sessionId);
  if (rawResponses.length === 0) {
    return badRequest('No responses submitted for this session');
  }

  const responses = rawResponses.map((r) => ({
    questionId: r.questionId,
    categoryKey: r.categoryKey,
    answerValue: r.answerValue,
    reverseScored: r.reverseScored,
    respondentId: r.respondentId,
  }));

  const scores = computeEngagementScores(responses, session.selectedCategories);

  const report = {
    reportId: sessionId,
    lessonId: session.lessonId,
    lessonTitle: session.lessonTitle,
    teacherId: session.teacherId,
    grade: session.grade,
    subject: session.subject,
    ...scores,
    createdAt: new Date().toISOString(),
  };

  await saveReport(sessionId, report);
  await markSessionComplete(sessionId);

  return ok({
    sessionId,
    status: 'completed',
    report: formatReport({ sessionId, ...report }),
  });
});

function formatReport(item) {
  return {
    sessionId: item.sessionId,
    lessonId: item.lessonId,
    lessonTitle: item.lessonTitle,
    overallScore: item.overallScore,
    overallPercent: item.overallPercent,
    subscaleScores: item.subscaleScores,
    studentCount: item.studentCount,
    responseCount: item.responseCount || item.totalResponses,
    scoredAt: item.scoredAt || item.createdAt,
    createdAt: item.createdAt,
  };
}
