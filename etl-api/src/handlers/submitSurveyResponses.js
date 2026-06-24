const { v4: uuidv4 } = require('uuid');
const { ok, badRequest, notFound, serverError, parseBody } = require('../lib/response');
const { validateAnswerValue } = require('../services/scoring');
const { QUESTION_BY_ID } = require('../constants/questions');
const {
  getSession,
  saveResponse,
  respondentExists,
  getParticipationStats,
} = require('../repositories/survey');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.handler = async (event) => {
  try {
    const sessionId = event.pathParameters?.sessionId;
    const body = parseBody(event);
    const { responses, respondentId } = body;

    if (!sessionId) return notFound('Session not found');
    if (!respondentId || !UUID_RE.test(respondentId)) {
      return badRequest('respondentId (UUID) is required for anonymous student tracking');
    }
    if (!Array.isArray(responses) || responses.length === 0) {
      return badRequest('responses array is required');
    }

    const session = await getSession(sessionId);
    if (!session) return notFound('Session not found');
    if (session.status === 'completed') {
      return badRequest('Survey session is already completed');
    }

    if (await respondentExists(sessionId, respondentId)) {
      return badRequest('This device has already submitted a response for this survey');
    }

    const batchId = uuidv4();
    const saved = [];

    for (const resp of responses) {
      const { questionId, answerValue } = resp;
      const question = QUESTION_BY_ID[questionId];
      if (!question) {
        return badRequest(`Unknown questionId: ${questionId}`);
      }
      if (!session.questions.some((q) => q.id === questionId)) {
        return badRequest(`Question ${questionId} is not part of this survey session`);
      }

      const validation = validateAnswerValue(answerValue);
      if (!validation.valid) {
        return badRequest(validation.error, { questionId });
      }

      const responseId = uuidv4();
      const record = {
        responseId,
        batchId,
        respondentId,
        questionId,
        categoryKey: question.categoryKey,
        answerValue: validation.value,
        reverseScored: question.reverseScored || false,
        submittedAt: new Date().toISOString(),
      };
      await saveResponse(sessionId, record);
      saved.push(record);
    }

    const participation = await getParticipationStats(sessionId);

    return ok({
      sessionId,
      batchId,
      respondentId,
      savedCount: saved.length,
      participation,
    });
  } catch (err) {
    console.error('submitSurveyResponses error', err.message);
    return serverError(err.message);
  }
};
