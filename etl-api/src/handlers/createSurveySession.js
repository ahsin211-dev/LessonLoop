const { v4: uuidv4 } = require('uuid');
const { ALL_SUBSCALE_KEYS } = require('../constants/subscales');
const { pickQuestionsForCategories } = require('../constants/questions');
const { created, badRequest, serverError, parseBody } = require('../lib/response');
const { createSession } = require('../repositories/survey');

exports.handler = async (event) => {
  try {
    const body = parseBody(event);
    const {
      lessonId,
      teacherId,
      lessonTitle,
      selectedCategories = ALL_SUBSCALE_KEYS,
    } = body;

    if (!lessonId || !teacherId) {
      return badRequest('lessonId and teacherId are required');
    }

    const invalid = selectedCategories.filter((k) => !ALL_SUBSCALE_KEYS.includes(k));
    if (invalid.length) {
      return badRequest('Invalid category keys', { invalid });
    }

    const sessionId = uuidv4();
    const questions = pickQuestionsForCategories(selectedCategories);

    const session = {
      sessionId,
      lessonId,
      teacherId,
      lessonTitle: lessonTitle || 'Untitled Lesson',
      selectedCategories,
      questions,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    await createSession(session);

    return created({
      sessionId,
      lessonId,
      lessonTitle: session.lessonTitle,
      selectedCategories,
      questions,
      surveyUrl: `/survey/${sessionId}`,
      status: 'open',
    });
  } catch (err) {
    console.error('createSurveySession error', err.message);
    return serverError(err.message);
  }
};
