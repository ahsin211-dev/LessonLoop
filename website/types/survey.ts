export interface SubscaleScore {
  categoryKey: string
  displayName: string
  group: string
  score: number | null
  percent: number | null
  responseCount: number
  questionScores: Array<{
    questionId: string
    categoryKey: string
    rawValue: number
    effectiveValue: number
    reverseScored: boolean
  }>
}

export interface EngagementReport {
  sessionId: string
  lessonId: string
  lessonTitle: string
  overallScore: number
  overallPercent: number
  subscaleScores: SubscaleScore[]
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
  questions: SurveyQuestion[]
  status: string
  createdAt?: string
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
