/**
 * Seed a demo survey session with responses and scored report.
 * Run after setup-local-tables.js and with API handlers or direct repo access.
 */
const { v4: uuidv4 } = require('uuid');
const { ALL_SUBSCALE_KEYS } = require('../src/constants/subscales');
const { pickQuestionsForCategories } = require('../src/constants/questions');
const { computeEngagementScores } = require('../src/services/scoring');
const {
  createSession,
  saveResponse,
  saveReport,
  markSessionComplete,
} = require('../src/repositories/survey');

const DEMO_RESPONSES = {
  cognitive: 5,
  social: 4,
  emotional: 4,
  self_regulation: 3,
  student_agency: 2,
  mitigating_factors: 4, // raw: distractions hard = 4 on reverse-scored item → effective 2
  lesson_design: 5,
  content_accessibility: 4,
  technology_use: 3,
};

async function seed() {
  const sessionId = process.env.SEED_SESSION_ID || uuidv4();
  const selectedCategories = ALL_SUBSCALE_KEYS;
  const questions = pickQuestionsForCategories(selectedCategories);

  await createSession({
    sessionId,
    lessonId: 'lesson-demo-001',
    teacherId: 'teacher-demo-001',
    lessonTitle: 'Introduction to Photosynthesis',
    selectedCategories,
    questions,
    status: 'open',
    createdAt: new Date().toISOString(),
  });

  const responses = [];
  for (const q of questions) {
    const answerValue = DEMO_RESPONSES[q.categoryKey] ?? 3;
    const responseId = uuidv4();
    await saveResponse(sessionId, {
      responseId,
      questionId: q.id,
      categoryKey: q.categoryKey,
      answerValue,
      reverseScored: q.reverseScored || false,
      submittedAt: new Date().toISOString(),
    });
    responses.push({
      questionId: q.id,
      categoryKey: q.categoryKey,
      answerValue,
      reverseScored: q.reverseScored || false,
    });
  }

  const scores = computeEngagementScores(responses, selectedCategories);
  await saveReport(sessionId, {
    reportId: sessionId,
    lessonId: 'lesson-demo-001',
    lessonTitle: 'Introduction to Photosynthesis',
    teacherId: 'teacher-demo-001',
    ...scores,
    responseCount: responses.length,
    createdAt: new Date().toISOString(),
  });
  await markSessionComplete(sessionId);

  console.log('Seed complete');
  console.log('Session ID:', sessionId);
  console.log('Report URL: /reports/' + sessionId);
  console.log('Survey URL: /survey/' + sessionId);
  console.log('Overall score:', scores.overallScore);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
