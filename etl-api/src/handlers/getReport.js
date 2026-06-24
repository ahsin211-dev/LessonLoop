const { ok, notFound } = require('../lib/response');
const { requireSessionOwner } = require('../lib/auth');
const { withHandler } = require('../lib/handler');
const { getSession, getReport } = require('../repositories/survey');

exports.handler = withHandler(async (event) => {
  const sessionId = event.pathParameters?.sessionId;
  if (!sessionId) return notFound('Report not found');

  const session = await getSession(sessionId);
  if (!session) return notFound('Report not found');

  await requireSessionOwner(event, session);

  const report = await getReport(sessionId);
  if (!report) return notFound('Report not found. Complete the survey first.');

  return ok({
    sessionId: report.sessionId,
    lessonId: report.lessonId,
    lessonTitle: report.lessonTitle,
    overallScore: report.overallScore,
    overallPercent: report.overallPercent,
    subscaleScores: report.subscaleScores,
    studentCount: report.studentCount,
    responseCount: report.responseCount,
    scoredAt: report.scoredAt,
    createdAt: report.createdAt,
  });
});
