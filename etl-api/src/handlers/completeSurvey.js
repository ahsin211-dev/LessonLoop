const { ok, badRequest, notFound, serverError } = require('../lib/response');
const { computeEngagementScores } = require('../services/scoring');
const {
  getSession,
  listResponses,
  saveReport,
  markSessionComplete,
  getReport,
} = require('../repositories/survey');

exports.handler = async (event) => {
  try {
    const sessionId = event.pathParameters?.sessionId;
    if (!sessionId) return notFound('Session not found');

    const session = await getSession(sessionId);
    if (!session) return notFound('Session not found');

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
    }));

    const scores = computeEngagementScores(responses, session.selectedCategories);

    const report = {
      reportId: sessionId,
      lessonId: session.lessonId,
      lessonTitle: session.lessonTitle,
      teacherId: session.teacherId,
      ...scores,
      responseCount: rawResponses.length,
      createdAt: new Date().toISOString(),
    };

    await saveReport(sessionId, report);
    await markSessionComplete(sessionId);

    return ok({
      sessionId,
      status: 'completed',
      report: formatReport({ sessionId, ...report }),
    });
  } catch (err) {
    console.error('completeSurvey error', err.message);
    return serverError(err.message);
  }
};

function formatReport(item) {
  return {
    sessionId: item.sessionId,
    lessonId: item.lessonId,
    lessonTitle: item.lessonTitle,
    overallScore: item.overallScore,
    overallPercent: item.overallPercent,
    subscaleScores: item.subscaleScores,
    responseCount: item.responseCount || item.totalResponses,
    scoredAt: item.scoredAt || item.createdAt,
    createdAt: item.createdAt,
  };
}
