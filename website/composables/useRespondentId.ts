export function useRespondentId() {
  const STORAGE_KEY = 'lessonloop_respondent_id'

  function getOrCreateRespondentId(): string {
    if (!import.meta.client) return ''

    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  }

  function getRespondentIdForSession(sessionId: string): string {
    if (!import.meta.client) return ''
    const key = `${STORAGE_KEY}_${sessionId}`
    let id = sessionStorage.getItem(key)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(key, id)
    }
    return id
  }

  return { getOrCreateRespondentId, getRespondentIdForSession }
}
