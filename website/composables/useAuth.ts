import type { Teacher } from '~/types/survey'

const TOKEN_KEY = 'lessonloop_token'
const TEACHER_KEY = 'lessonloop_teacher'

export function useAuth() {
  const token = useState<string | null>('auth-token', () => null)
  const teacher = useState<Teacher | null>('auth-teacher', () => null)

  if (import.meta.client && !token.value) {
    token.value = localStorage.getItem(TOKEN_KEY)
    const stored = localStorage.getItem(TEACHER_KEY)
    if (stored) teacher.value = JSON.parse(stored)
  }

  function setAuth(newToken: string, newTeacher: Teacher) {
    token.value = newToken
    teacher.value = newTeacher
    if (import.meta.client) {
      localStorage.setItem(TOKEN_KEY, newToken)
      localStorage.setItem(TEACHER_KEY, JSON.stringify(newTeacher))
    }
  }

  function clearAuth() {
    token.value = null
    teacher.value = null
    if (import.meta.client) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(TEACHER_KEY)
    }
  }

  const isAuthenticated = computed(() => !!token.value)

  return { token, teacher, isAuthenticated, setAuth, clearAuth }
}
