const { ok } = require('../lib/response');
const { requireAuth } = require('../lib/auth');
const { withHandler } = require('../lib/handler');
const { listSessionsForTeacher } = require('../repositories/survey');

exports.handler = withHandler(async (event) => {
  const user = requireAuth(event);
  const sessions = await listSessionsForTeacher(user.teacherId);

  return ok({
    sessions: sessions.map((s) => ({
      sessionId: s.sessionId,
      lessonId: s.lessonId,
      lessonTitle: s.lessonTitle,
      status: s.status,
      selectedCategories: s.selectedCategories,
      questionsPerCategory: s.questionsPerCategory,
      questionCount: s.questions?.length,
      createdAt: s.createdAt,
      completedAt: s.completedAt,
      surveyUrl: `/survey/${s.sessionId}`,
      reportUrl: `/reports/${s.sessionId}`,
    })),
  });
});
