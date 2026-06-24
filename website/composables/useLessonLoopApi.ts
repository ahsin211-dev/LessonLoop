import type {
  EngagementReport,
  Recommendation,
  SurveySession,
  Teacher,
  TeacherSession,
} from '~/types/survey'

export function useLessonLoopApi() {
  const config = useRuntimeConfig()
  const base = config.public.apiBase
  const { token } = useAuth()

  async function api<T>(path: string, options: RequestInit = {}, auth = false): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }
    if (auth && token.value) {
      headers.Authorization = `Bearer ${token.value}`
    }

    const res = await fetch(`${base}${path}`, { ...options, headers })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || `API error ${res.status}`)
    }
    return data as T
  }

  return {
    health: () => api<{ status: string; service?: string }>('/health'),

    login: (teacherId: string) =>
      api<{ token: string; teacher: Teacher }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ teacherId }),
      }),

    me: () => api<{ teacher: Teacher }>('/auth/me', {}, true),

    createSurveySession: (body: {
      lessonId: string
      lessonTitle?: string
      selectedCategories?: string[]
      questionsPerCategory?: number
      grade?: string
      subject?: string
    }) => api<SurveySession & { surveyUrl: string }>('/surveys/sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    }, true),

    listSessions: () =>
      api<{ sessions: TeacherSession[] }>('/surveys/sessions', {}, true),

    getSurveySession: (sessionId: string) =>
      api<SurveySession>(`/surveys/sessions/${sessionId}`),

    getSessionStatus: (sessionId: string) =>
      api<{
        sessionId: string
        status: string
        participation: { studentCount: number; responseCount: number }
        hasReport: boolean
      }>(`/surveys/sessions/${sessionId}/status`, {}, true),

    submitResponses: (
      sessionId: string,
      respondentId: string,
      responses: Array<{ questionId: string; answerValue: number }>,
    ) => api<{ savedCount: number; participation: { studentCount: number } }>(
      `/surveys/sessions/${sessionId}/responses`,
      { method: 'POST', body: JSON.stringify({ respondentId, responses }) },
    ),

    completeSurvey: (sessionId: string) =>
      api<{ report: EngagementReport }>(`/surveys/sessions/${sessionId}/complete`, {
        method: 'POST',
      }, true),

    getReport: (sessionId: string) =>
      api<EngagementReport>(`/reports/${sessionId}`, {}, true),

    getRecommendations: (sessionId: string) =>
      api<{ recommendations: Recommendation[]; metadata: Record<string, unknown> }>(
        `/reports/${sessionId}/recommendations`,
        {},
        true,
      ),
  }
}
