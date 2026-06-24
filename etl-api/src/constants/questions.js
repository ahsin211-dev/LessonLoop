/**
 * SES question bank — one primary question per subscale for local dev.
 * Production uses a larger randomized bank per category.
 */

const QUESTIONS = [
  {
    id: 'cog_active_learning',
    categoryKey: 'cognitive',
    text: 'I learned through activities and/or discussion in class, as opposed to passively listening to my teacher during this class lesson.',
  },
  {
    id: 'soc_collaboration',
    categoryKey: 'social',
    text: 'I had meaningful opportunities to interact with my classmates during this lesson.',
  },
  {
    id: 'emo_interest',
    categoryKey: 'emotional',
    text: 'I felt interested and engaged during this lesson.',
  },
  {
    id: 'self_focus',
    categoryKey: 'self_regulation',
    text: 'I was able to stay focused and manage my attention during this lesson.',
  },
  {
    id: 'agency_voice',
    categoryKey: 'student_agency',
    text: 'I had opportunities to share my ideas and influence how we learned today.',
  },
  {
    id: 'mitigate_distraction',
    categoryKey: 'mitigating_factors',
    text: 'Distractions made it hard for me to stay engaged during this lesson.',
    reverseScored: true,
  },
  {
    id: 'design_structure',
    categoryKey: 'lesson_design',
    text: 'The lesson was well organized and easy to follow.',
  },
  {
    id: 'access_content',
    categoryKey: 'content_accessibility',
    text: 'The lesson content was presented in a way I could understand.',
  },
  {
    id: 'tech_purpose',
    categoryKey: 'technology_use',
    text: 'Technology used in this lesson helped me learn.',
  },
];

const QUESTIONS_BY_CATEGORY = QUESTIONS.reduce((acc, q) => {
  if (!acc[q.categoryKey]) acc[q.categoryKey] = [];
  acc[q.categoryKey].push(q);
  return acc;
}, {});

const QUESTION_BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));

function pickQuestionsForCategories(categoryKeys) {
  return categoryKeys.map((key) => {
    const pool = QUESTIONS_BY_CATEGORY[key];
    if (!pool?.length) return null;
    return pool[0];
  }).filter(Boolean);
}

module.exports = {
  QUESTIONS,
  QUESTIONS_BY_CATEGORY,
  QUESTION_BY_ID,
  pickQuestionsForCategories,
};
