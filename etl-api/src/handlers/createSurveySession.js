const { v4: uuidv4 } = require('uuid');
const { ALL_SUBSCALE_KEYS } = require('../constants/subscales');
const { pickQuestionsForCategories } = require('../constants/questions');
const { created, badRequest, serverError, parseBody } = require('../lib/response');
const { requireAuth } = require('../lib/auth');
const { withHandler } = require('../lib/handler');
const { createSession } = require('../repositories/survey');

exports.handler = withHandler(async (event) => {
  const user = await requireAuth(event);
  const body = parseBody(event);
  const {
    lessonId,
    lessonTitle,
    selectedCategories = ALL_SUBSCALE_KEYS,
    questionsPerCategory = 1,
    seed,
    grade,
    subject,
  } = body;

  if (!lessonId) {
    return badRequest('lessonId is required');
  }

  const invalid = selectedCategories.filter((k) => !ALL_SUBSCALE_KEYS.includes(k));
  if (invalid.length) {
    return badRequest('Invalid category keys', { invalid });
  }

  const qpc = Math.min(Math.max(1, Number(questionsPerCategory) || 1), 3);
  const sessionId = uuidv4();
  const questions = pickQuestionsForCategories(selectedCategories, {
    questionsPerCategory: qpc,
    seed: seed != null ? Number(seed) : undefined,
  });

  const session = {
    sessionId,
    lessonId,
    teacherId: user.teacherId,
    lessonTitle: lessonTitle || 'Untitled Lesson',
    grade: grade || null,
    subject: subject || null,
    selectedCategories,
    questionsPerCategory: qpc,
    questions,
    status: 'open',
    createdAt: new Date().toISOString(),
  };

  await createSession(session);

  return created({
    sessionId,
    lessonId,
    lessonTitle: session.lessonTitle,
    teacherId: user.teacherId,
    selectedCategories,
    questionsPerCategory: qpc,
    questions,
    surveyUrl: `/survey/${sessionId}`,
    status: 'open',
  });
});
