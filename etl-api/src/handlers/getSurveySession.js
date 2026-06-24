const { ok, notFound, serverError } = require('../lib/response');
const { getSession, getParticipationStats } = require('../repositories/survey');

exports.handler = async (event) => {
  try {
    const sessionId = event.pathParameters?.sessionId;
    if (!sessionId) return notFound('Session not found');

    const session = await getSession(sessionId);
    if (!session) return notFound('Session not found');

    const participation = session.status === 'open'
      ? await getParticipationStats(sessionId)
      : null;

    return ok({
      sessionId: session.sessionId,
      lessonId: session.lessonId,
      lessonTitle: session.lessonTitle,
      selectedCategories: session.selectedCategories,
      questionsPerCategory: session.questionsPerCategory,
      questions: session.questions,
      status: session.status,
      createdAt: session.createdAt,
      participation,
    });
  } catch (err) {
    console.error('getSurveySession error', err.message);
    return serverError(err.message);
  }
};
