const { ok, notFound, serverError } = require('../lib/response');
const { getReport } = require('../repositories/survey');
const { generateRecommendations } = require('../services/recommendations');

exports.handler = async (event) => {
  try {
    const sessionId = event.pathParameters?.sessionId;
    if (!sessionId) return notFound('Report not found');

    const report = await getReport(sessionId);
    if (!report) return notFound('Report not found. Complete the survey first.');

    const recommendations = generateRecommendations({
      sessionId: report.sessionId,
      overallScore: report.overallScore,
      subscaleScores: report.subscaleScores,
    });

    return ok(recommendations);
  } catch (err) {
    console.error('getRecommendations error', err.message);
    return serverError(err.message);
  }
};
