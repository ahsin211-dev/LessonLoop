const { ok, notFound } = require('../lib/response');
const { requireSessionOwner } = require('../lib/auth');
const { withHandler } = require('../lib/handler');
const { getSession, getReport } = require('../repositories/survey');
const { generateRecommendations } = require('../services/recommendations');

exports.handler = withHandler(async (event) => {
  const sessionId = event.pathParameters?.sessionId;
  if (!sessionId) return notFound('Report not found');

  const session = await getSession(sessionId);
  if (!session) return notFound('Report not found');

  await requireSessionOwner(event, session);

  const report = await getReport(sessionId);
  if (!report) return notFound('Report not found. Complete the survey first.');

  const recommendations = await generateRecommendations(
    {
      sessionId: report.sessionId,
      lessonTitle: report.lessonTitle,
      overallScore: report.overallScore,
      subscaleScores: report.subscaleScores,
    },
    {
      lessonTitle: report.lessonTitle,
      grade: session.grade,
      subject: session.subject,
      includeActivities: true,
    },
  );

  return ok(recommendations);
});
