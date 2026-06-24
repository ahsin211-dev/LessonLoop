import type {
  EngagementReport,
  Recommendation,
  SurveySession,
} from '~/types/survey'

export function useLessonLoopApi() {
  const config = useRuntimeConfig()
  const base = config.public.apiBase

  async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${base}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
      ...options,
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || `API error ${res.status}`)
    }
    return data as T
  }

  return {
    health: () => api<{ status: string }>('/health'),

    createSurveySession: (body: {
      lessonId: string
      teacherId: string
      lessonTitle?: string
      selectedCategories?: string[]
    }) => api<SurveySession & { surveyUrl: string }>('/surveys/sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

    getSurveySession: (sessionId: string) =>
      api<SurveySession>(`/surveys/sessions/${sessionId}`),

    submitResponses: (sessionId: string, responses: Array<{ questionId: string; answerValue: number }>) =>
      api<{ savedCount: number }>(`/surveys/sessions/${sessionId}/responses`, {
        method: 'POST',
        body: JSON.stringify({ responses }),
      }),

    completeSurvey: (sessionId: string) =>
      api<{ report: EngagementReport }>(`/surveys/sessions/${sessionId}/complete`, {
        method: 'POST',
      }),

    getReport: (sessionId: string) =>
      api<EngagementReport>(`/reports/${sessionId}`),

    getRecommendations: (sessionId: string) =>
      api<{ recommendations: Recommendation[]; metadata: Record<string, unknown> }>(
        `/reports/${sessionId}/recommendations`,
      ),
  }
}
