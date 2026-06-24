/**
 * Seed demo survey with multi-student responses.
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

const STUDENTS = [
  { id: uuidv4(), answers: { cognitive: 5, social: 4, emotional: 4, self_regulation: 3, student_agency: 2, mitigating_factors: 2, lesson_design: 5, content_accessibility: 4, technology_use: 3 } },
  { id: uuidv4(), answers: { cognitive: 4, social: 5, emotional: 3, self_regulation: 4, student_agency: 3, mitigating_factors: 3, lesson_design: 4, content_accessibility: 5, technology_use: 4 } },
  { id: uuidv4(), answers: { cognitive: 3, social: 3, emotional: 4, self_regulation: 3, student_agency: 2, mitigating_factors: 4, lesson_design: 4, content_accessibility: 3, technology_use: 3 } },
];

async function seed() {
  const sessionId = process.env.SEED_SESSION_ID || uuidv4();
  const selectedCategories = ALL_SUBSCALE_KEYS;
  const questions = pickQuestionsForCategories(selectedCategories, { questionsPerCategory: 1, seed: 99 });

  await createSession({
    sessionId,
    lessonId: 'lesson-demo-001',
    teacherId: 'teacher-demo-001',
    lessonTitle: 'Introduction to Photosynthesis',
    selectedCategories,
    questionsPerCategory: 1,
    questions,
    status: 'open',
    createdAt: new Date().toISOString(),
  });

  const allResponses = [];
  for (const student of STUDENTS) {
    const batchId = uuidv4();
    for (const q of questions) {
      const answerValue = student.answers[q.categoryKey] ?? 3;
      const responseId = uuidv4();
      await saveResponse(sessionId, {
        responseId,
        batchId,
        respondentId: student.id,
        questionId: q.id,
        categoryKey: q.categoryKey,
        answerValue,
        reverseScored: q.reverseScored || false,
        submittedAt: new Date().toISOString(),
      });
      allResponses.push({
        questionId: q.id,
        categoryKey: q.categoryKey,
        answerValue,
        reverseScored: q.reverseScored || false,
        respondentId: student.id,
      });
    }
  }

  const scores = computeEngagementScores(allResponses, selectedCategories);
  await saveReport(sessionId, {
    reportId: sessionId,
    lessonId: 'lesson-demo-001',
    lessonTitle: 'Introduction to Photosynthesis',
    teacherId: 'teacher-demo-001',
    ...scores,
    createdAt: new Date().toISOString(),
  });
  await markSessionComplete(sessionId);

  console.log('Seed complete (3 students)');
  console.log('Session ID:', sessionId);
  console.log('Student count:', scores.studentCount);
  console.log('Overall score:', scores.overallScore);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
