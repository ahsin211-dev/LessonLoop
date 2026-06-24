export interface TeacherAnalytics {
  teacherId: string
  sessionCount: number
  reportCount: number
  totalStudents: number
  averageOverallScore: number | null
  subscaleAggregates: Array<{
    categoryKey: string
    displayName: string
    group?: string
    averageScore: number | null
    sessionCount: number
  }>
  recentSessions: Array<{
    sessionId: string
    lessonTitle: string
    lessonId: string
    overallScore: number
    studentCount: number
    scoredAt: string
  }>
  computedAt: string
}

export interface SubscaleScore {
  categoryKey: string
  displayName: string
  group: string
  score: number | null
  percent: number | null
  studentCount: number
  responseCount: number
  questionBreakdown: Array<{
    questionId: string
    categoryKey: string
    meanScore: number | null
    responseCount: number
  }>
}

export interface EngagementReport {
  sessionId: string
  lessonId: string
  lessonTitle: string
  overallScore: number
  overallPercent: number
  subscaleScores: SubscaleScore[]
  studentCount: number
  responseCount: number
  scoredAt: string
  createdAt: string
}

export interface SurveyQuestion {
  id: string
  categoryKey: string
  text: string
  reverseScored?: boolean
}

export interface SurveySession {
  sessionId: string
  lessonId: string
  lessonTitle: string
  selectedCategories: string[]
  questionsPerCategory?: number
  questions: SurveyQuestion[]
  status: string
  createdAt?: string
  participation?: {
    studentCount: number
    responseCount: number
  }
}

export interface TeacherSession {
  sessionId: string
  lessonId: string
  lessonTitle: string
  status: string
  selectedCategories: string[]
  questionsPerCategory?: number
  questionCount?: number
  createdAt: string
  completedAt?: string
  surveyUrl: string
  reportUrl: string
}

export interface Recommendation {
  categoryKey: string
  displayName: string
  currentScore: number
  priority: string
  strategy: {
    title: string
    goal: string
    steps: string[]
    citations: string[]
  }
  activity?: string
  aiGenerated?: boolean
  aiModel?: string
  source?: string
}

export interface Teacher {
  teacherId: string
  email: string
  name: string
}

export const LIKERT_OPTIONS = [
  { label: 'Strongly Disagree', value: 1 },
  { label: 'Disagree', value: 2 },
  { label: 'Somewhat Agree', value: 3 },
  { label: 'Agree', value: 4 },
  { label: 'Strongly Agree', value: 5 },
]

export const SUBSCALE_GROUPS: Record<string, string> = {
  learner_experience: 'Learner Experience',
  instructional_design: 'Instructional Design',
}

export const ALL_SUBSCALES = [
  { key: 'cognitive', label: 'Cognitive' },
  { key: 'social', label: 'Social' },
  { key: 'emotional', label: 'Emotional' },
  { key: 'self_regulation', label: 'Self-Regulation' },
  { key: 'student_agency', label: 'Student Agency' },
  { key: 'mitigating_factors', label: 'Mitigating Factors' },
  { key: 'lesson_design', label: 'Lesson Design' },
  { key: 'content_accessibility', label: 'Content Accessibility' },
  { key: 'technology_use', label: 'Technology Use' },
]
