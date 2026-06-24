/**
 * SES question bank — multiple items per subscale with random selection support.
 */

const QUESTIONS = [
  // Cognitive
  {
    id: 'cog_active_learning',
    categoryKey: 'cognitive',
    text: 'I learned through activities and/or discussion in class, as opposed to passively listening to my teacher during this class lesson.',
  },
  {
    id: 'cog_critical_thinking',
    categoryKey: 'cognitive',
    text: 'This lesson challenged me to think critically about what I was learning.',
  },
  {
    id: 'cog_connections',
    categoryKey: 'cognitive',
    text: 'I was able to connect new ideas in this lesson to things I already knew.',
  },
  // Social
  {
    id: 'soc_collaboration',
    categoryKey: 'social',
    text: 'I had meaningful opportunities to interact with my classmates during this lesson.',
  },
  {
    id: 'soc_respect',
    categoryKey: 'social',
    text: 'I felt respected by my teacher and classmates during this lesson.',
  },
  {
    id: 'soc_belonging',
    categoryKey: 'social',
    text: 'I felt like I belonged in this class during today\'s lesson.',
  },
  // Emotional
  {
    id: 'emo_interest',
    categoryKey: 'emotional',
    text: 'I felt interested and engaged during this lesson.',
  },
  {
    id: 'emo_excitement',
    categoryKey: 'emotional',
    text: 'I felt excited about what we were learning today.',
  },
  {
    id: 'emo_safe',
    categoryKey: 'emotional',
    text: 'I felt emotionally safe participating in this lesson.',
  },
  // Self-regulation
  {
    id: 'self_focus',
    categoryKey: 'self_regulation',
    text: 'I was able to stay focused and manage my attention during this lesson.',
  },
  {
    id: 'self_effort',
    categoryKey: 'self_regulation',
    text: 'I put in strong effort even when parts of the lesson were difficult.',
  },
  {
    id: 'self_goals',
    categoryKey: 'self_regulation',
    text: 'I understood what I was supposed to be learning in this lesson.',
  },
  // Student agency
  {
    id: 'agency_voice',
    categoryKey: 'student_agency',
    text: 'I had opportunities to share my ideas and influence how we learned today.',
  },
  {
    id: 'agency_choice',
    categoryKey: 'student_agency',
    text: 'I had meaningful choices about how to approach my learning in this lesson.',
  },
  {
    id: 'agency_questions',
    categoryKey: 'student_agency',
    text: 'My questions and ideas were valued during this lesson.',
  },
  // Mitigating factors (reverse-scored)
  {
    id: 'mitigate_distraction',
    categoryKey: 'mitigating_factors',
    text: 'Distractions made it hard for me to stay engaged during this lesson.',
    reverseScored: true,
  },
  {
    id: 'mitigate_confusion',
    categoryKey: 'mitigating_factors',
    text: 'I felt confused and that made it hard to stay engaged.',
    reverseScored: true,
  },
  {
    id: 'mitigate_pace',
    categoryKey: 'mitigating_factors',
    text: 'The lesson moved too fast or too slow for me to stay engaged.',
    reverseScored: true,
  },
  // Lesson design
  {
    id: 'design_structure',
    categoryKey: 'lesson_design',
    text: 'The lesson was well organized and easy to follow.',
  },
  {
    id: 'design_pacing',
    categoryKey: 'lesson_design',
    text: 'The pacing of this lesson helped me learn effectively.',
  },
  {
    id: 'design_objectives',
    categoryKey: 'lesson_design',
    text: 'It was clear what I was supposed to learn by the end of this lesson.',
  },
  // Content accessibility
  {
    id: 'access_content',
    categoryKey: 'content_accessibility',
    text: 'The lesson content was presented in a way I could understand.',
  },
  {
    id: 'access_language',
    categoryKey: 'content_accessibility',
    text: 'The language and materials used in this lesson were accessible to me.',
  },
  {
    id: 'access_supports',
    categoryKey: 'content_accessibility',
    text: 'I had the supports I needed to access the lesson content.',
  },
  // Technology use
  {
    id: 'tech_purpose',
    categoryKey: 'technology_use',
    text: 'Technology used in this lesson helped me learn.',
  },
  {
    id: 'tech_ease',
    categoryKey: 'technology_use',
    text: 'I was able to use the technology in this lesson without difficulty.',
  },
  {
    id: 'tech_engagement',
    categoryKey: 'technology_use',
    text: 'Technology made this lesson more engaging for me.',
  },
];

const QUESTIONS_BY_CATEGORY = QUESTIONS.reduce((acc, q) => {
  if (!acc[q.categoryKey]) acc[q.categoryKey] = [];
  acc[q.categoryKey].push(q);
  return acc;
}, {});

const QUESTION_BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));

/**
 * Pick random questions from each category's bank.
 * @param {string[]} categoryKeys
 * @param {{ questionsPerCategory?: number, seed?: number }} options
 */
function pickQuestionsForCategories(categoryKeys, options = {}) {
  const { questionsPerCategory = 1, seed } = options;
  const rng = seed != null ? seededRandom(seed) : Math.random;

  return categoryKeys.flatMap((key) => {
    const pool = [...(QUESTIONS_BY_CATEGORY[key] || [])];
    if (!pool.length) return [];

    const count = Math.min(questionsPerCategory, pool.length);
    const picked = [];

    for (let i = 0; i < count; i++) {
      const idx = Math.floor(rng() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    return picked;
  });
}

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

module.exports = {
  QUESTIONS,
  QUESTIONS_BY_CATEGORY,
  QUESTION_BY_ID,
  pickQuestionsForCategories,
};
