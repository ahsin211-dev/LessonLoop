/**
 * Nine Student Engagement Survey (SES) subscale definitions.
 * Based on LessonLoop public product documentation (lessonloop.org/about-us).
 */

const SUBSCALES = [
  {
    id: 'cognitive',
    key: 'cognitive',
    displayName: 'Cognitive',
    group: 'learner_experience',
    description: 'How students experience thinking, active learning, and cognitive engagement in the lesson.',
  },
  {
    id: 'social',
    key: 'social',
    displayName: 'Social',
    group: 'learner_experience',
    description: 'Peer interaction, collaboration, and social belonging during the lesson.',
  },
  {
    id: 'emotional',
    key: 'emotional',
    displayName: 'Emotional',
    group: 'learner_experience',
    description: 'Emotional safety, excitement, interest, and joy in learning.',
  },
  {
    id: 'self_regulation',
    key: 'self_regulation',
    displayName: 'Self-Regulation',
    group: 'learner_experience',
    description: 'Student ability to manage attention, effort, and learning behaviors.',
  },
  {
    id: 'student_agency',
    key: 'student_agency',
    displayName: 'Student Agency',
    group: 'learner_experience',
    description: 'Student voice, choice, and ownership over their learning.',
  },
  {
    id: 'mitigating_factors',
    key: 'mitigating_factors',
    displayName: 'Mitigating Factors',
    group: 'learner_experience',
    description: 'Barriers and distractions that reduce engagement during the lesson.',
    reverseScored: true,
  },
  {
    id: 'lesson_design',
    key: 'lesson_design',
    displayName: 'Lesson Design',
    group: 'instructional_design',
    description: 'Structure, pacing, and design quality of the lesson experience.',
  },
  {
    id: 'content_accessibility',
    key: 'content_accessibility',
    displayName: 'Content Accessibility',
    group: 'instructional_design',
    description: 'Whether lesson content is understandable and accessible to all learners.',
  },
  {
    id: 'technology_use',
    key: 'technology_use',
    displayName: 'Technology Use',
    group: 'instructional_design',
    description: 'Effective and purposeful use of technology during the lesson.',
  },
];

const SUBSCALE_BY_KEY = Object.fromEntries(SUBSCALES.map((s) => [s.key, s]));

const ALL_SUBSCALE_KEYS = SUBSCALES.map((s) => s.key);

const LIKERT_LABELS = {
  1: 'Strongly Disagree',
  2: 'Disagree',
  3: 'Somewhat Agree',
  4: 'Agree',
  5: 'Strongly Agree',
};

const SCORE_MIN = 1;
const SCORE_MAX = 5;

module.exports = {
  SUBSCALES,
  SUBSCALE_BY_KEY,
  ALL_SUBSCALE_KEYS,
  LIKERT_LABELS,
  SCORE_MIN,
  SCORE_MAX,
};
