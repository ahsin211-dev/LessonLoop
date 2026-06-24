const { ok, notFound } = require('../lib/response');
const { requireSessionOwner } = require('../lib/auth');
const { withHandler } = require('../lib/handler');
const { getSession, getReport, getParticipationStats } = require('../repositories/survey');

exports.handler = withHandler(async (event) => {
  const sessionId = event.pathParameters?.sessionId;
  if (!sessionId) return notFound('Session not found');

  const session = await getSession(sessionId);
  if (!session) return notFound('Session not found');

  await requireSessionOwner(event, session);

  const participation = await getParticipationStats(sessionId);
  const report = await getReport(sessionId);

  return ok({
    sessionId,
    status: session.status,
    lessonTitle: session.lessonTitle,
    participation,
    hasReport: !!report,
    report: report ? {
      overallScore: report.overallScore,
      studentCount: report.studentCount,
      scoredAt: report.scoredAt,
    } : null,
  });
});
