const { v4: uuidv4 } = require('uuid');
const { ok, badRequest, notFound, serverError, parseBody } = require('../lib/response');
const { validateAnswerValue } = require('../services/scoring');
const { QUESTION_BY_ID } = require('../constants/questions');
const { getSession, saveResponse } = require('../repositories/survey');

exports.handler = async (event) => {
  try {
    const sessionId = event.pathParameters?.sessionId;
    const body = parseBody(event);
    const { responses } = body;

    if (!sessionId) return notFound('Session not found');
    if (!Array.isArray(responses) || responses.length === 0) {
      return badRequest('responses array is required');
    }

    const session = await getSession(sessionId);
    if (!session) return notFound('Session not found');
    if (session.status === 'completed') {
      return badRequest('Survey session is already completed');
    }

    const saved = [];
    for (const resp of responses) {
      const { questionId, answerValue } = resp;
      const question = QUESTION_BY_ID[questionId];
      if (!question) {
        return badRequest(`Unknown questionId: ${questionId}`);
      }
      if (!session.selectedCategories.includes(question.categoryKey)) {
        return badRequest(`Category ${question.categoryKey} not in this session`);
      }

      const validation = validateAnswerValue(answerValue);
      if (!validation.valid) {
        return badRequest(validation.error, { questionId });
      }

      const responseId = uuidv4();
      const record = {
        responseId,
        questionId,
        categoryKey: question.categoryKey,
        answerValue: validation.value,
        reverseScored: question.reverseScored || false,
        submittedAt: new Date().toISOString(),
      };
      await saveResponse(sessionId, record);
      saved.push(record);
    }

    return ok({ sessionId, savedCount: saved.length, responses: saved });
  } catch (err) {
    console.error('submitSurveyResponses error', err.message);
    return serverError(err.message);
  }
};
