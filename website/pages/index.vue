<script setup lang="ts">
import { ALL_SUBSCALES } from '~/types/survey'
import type { TeacherSession } from '~/types/survey'

definePageMeta({ middleware: 'auth' })

const api = useLessonLoopApi()
const { teacher, clearAuth } = useAuth()
const loading = ref(false)
const error = ref('')
const sessions = ref<TeacherSession[]>([])
const completingId = ref<string | null>(null)

const form = reactive({
  lessonTitle: 'Introduction to Photosynthesis',
  lessonId: 'lesson-' + Date.now(),
  grade: '8',
  subject: 'Science',
  questionsPerCategory: 1,
  selectedCategories: ALL_SUBSCALES.map((s) => s.key),
})

async function loadSessions() {
  try {
    const result = await api.listSessions()
    sessions.value = result.sessions
  } catch {
    sessions.value = []
  }
}

onMounted(loadSessions)

async function createSurvey() {
  loading.value = true
  error.value = ''
  try {
    const session = await api.createSurveySession({
      lessonId: form.lessonId,
      lessonTitle: form.lessonTitle,
      grade: form.grade,
      subject: form.subject,
      selectedCategories: form.selectedCategories,
      questionsPerCategory: form.questionsPerCategory,
    })
    form.lessonId = 'lesson-' + Date.now()
    await loadSessions()
    await navigateTo(`/sessions/${session.sessionId}`)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to create survey'
  } finally {
    loading.value = false
  }
}

async function completeSession(sessionId: string) {
  completingId.value = sessionId
  try {
    await api.completeSurvey(sessionId)
    await loadSessions()
    await navigateTo(`/reports/${sessionId}`)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to complete survey'
  } finally {
    completingId.value = null
  }
}

function logout() {
  clearAuth()
  navigateTo('/login')
}

function copySurveyLink(sessionId: string) {
  const url = `${window.location.origin}/survey/${sessionId}`
  navigator.clipboard.writeText(url)
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1>Teacher Dashboard</h1>
      <p>Welcome, {{ teacher?.name }}. Create surveys and monitor student participation.</p>
    </div>

    <Card class="mb-4">
      <template #title>Create New Survey Session</template>
      <template #content>
        <div class="form-grid">
          <div class="form-field">
            <label for="lessonTitle">Lesson Title</label>
            <InputText id="lessonTitle" v-model="form.lessonTitle" class="w-full" />
          </div>
          <div class="form-field">
            <label for="grade">Grade</label>
            <InputText id="grade" v-model="form.grade" class="w-full" />
          </div>
          <div class="form-field">
            <label for="subject">Subject</label>
            <InputText id="subject" v-model="form.subject" class="w-full" />
          </div>
          <div class="form-field">
            <label for="qpc">Questions per Category</label>
            <InputNumber id="qpc" v-model="form.questionsPerCategory" :min="1" :max="3" class="w-full" />
          </div>
        </div>

        <div class="form-field mt-3">
          <label>Engagement Categories</label>
          <div class="category-grid">
            <div v-for="cat in ALL_SUBSCALES" :key="cat.key" class="category-check">
              <Checkbox v-model="form.selectedCategories" :input-id="cat.key" :value="cat.key" />
              <label :for="cat.key">{{ cat.label }}</label>
            </div>
          </div>
        </div>

        <Message v-if="error" severity="error" class="mt-3">{{ error }}</Message>
      </template>
      <template #footer>
        <Button label="Create Survey" icon="pi pi-plus" :loading="loading" @click="createSurvey" />
      </template>
    </Card>

    <Card>
      <template #title>Your Survey Sessions</template>
      <template #content>
        <DataTable v-if="sessions.length" :value="sessions" striped-rows>
          <Column field="lessonTitle" header="Lesson" />
          <Column field="status" header="Status">
            <template #body="{ data }">
              <Tag :value="data.status" :severity="data.status === 'open' ? 'success' : 'secondary'" />
            </template>
          </Column>
          <Column field="questionCount" header="Questions" />
          <Column field="createdAt" header="Created">
            <template #body="{ data }">{{ new Date(data.createdAt).toLocaleDateString() }}</template>
          </Column>
          <Column header="Actions">
            <template #body="{ data }">
              <div class="action-btns">
                <Button
                  v-if="data.status === 'open'"
                  icon="pi pi-copy"
                  text
                  rounded
                  v-tooltip.top="'Copy survey link'"
                  @click="copySurveyLink(data.sessionId)"
                />
                <NuxtLink :to="`/sessions/${data.sessionId}`">
                  <Button icon="pi pi-eye" text rounded v-tooltip.top="'Monitor'" />
                </NuxtLink>
                <Button
                  v-if="data.status === 'open'"
                  icon="pi pi-check"
                  text
                  rounded
                  severity="success"
                  v-tooltip.top="'Close & score'"
                  :loading="completingId === data.sessionId"
                  @click="completeSession(data.sessionId)"
                />
                <NuxtLink v-if="data.status === 'completed'" :to="`/reports/${data.sessionId}`">
                  <Button icon="pi pi-chart-bar" text rounded v-tooltip.top="'Report'" />
                </NuxtLink>
              </div>
            </template>
          </Column>
        </DataTable>
        <p v-else class="text-muted">No sessions yet. Create your first survey above.</p>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.form-grid {
  display: grid;
  gap: 1rem;
}

@media (min-width: 640px) {
  .form-grid { grid-template-columns: 1fr 1fr; }
}

.form-field label {
  display: block;
  margin-bottom: 0.375rem;
  font-weight: 500;
}

.category-grid {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}

.category-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btns {
  display: flex;
  gap: 0.25rem;
}

.w-full { width: 100%; }
.mb-4 { margin-bottom: 1rem; }
.mt-3 { margin-top: 0.75rem; }
.text-muted { color: var(--ll-muted); }
</style>
