const { ok, notFound, serverError } = require('../lib/response');
const { getReport } = require('../repositories/survey');

exports.handler = async (event) => {
  try {
    const sessionId = event.pathParameters?.sessionId;
    if (!sessionId) return notFound('Report not found');

    const report = await getReport(sessionId);
    if (!report) return notFound('Report not found. Complete the survey first.');

    return ok({
      sessionId: report.sessionId,
      lessonId: report.lessonId,
      lessonTitle: report.lessonTitle,
      overallScore: report.overallScore,
      overallPercent: report.overallPercent,
      subscaleScores: report.subscaleScores,
      responseCount: report.responseCount,
      scoredAt: report.scoredAt,
      createdAt: report.createdAt,
    });
  } catch (err) {
    console.error('getReport error', err.message);
    return serverError(err.message);
  }
};
