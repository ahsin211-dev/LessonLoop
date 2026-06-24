const { ok, notFound, serverError } = require('../lib/response');
const { getSession } = require('../repositories/survey');

exports.handler = async (event) => {
  try {
    const sessionId = event.pathParameters?.sessionId;
    if (!sessionId) return notFound('Session not found');

    const session = await getSession(sessionId);
    if (!session) return notFound('Session not found');

    return ok({
      sessionId: session.sessionId,
      lessonId: session.lessonId,
      lessonTitle: session.lessonTitle,
      selectedCategories: session.selectedCategories,
      questions: session.questions,
      status: session.status,
      createdAt: session.createdAt,
    });
  } catch (err) {
    console.error('getSurveySession error', err.message);
    return serverError(err.message);
  }
};
