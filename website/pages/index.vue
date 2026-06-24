<script setup lang="ts">
const api = useLessonLoopApi()
const loading = ref(false)
const error = ref('')
const health = ref<{ status: string; service?: string } | null>(null)

const form = reactive({
  lessonTitle: 'Introduction to Photosynthesis',
  lessonId: 'lesson-' + Date.now(),
  teacherId: 'teacher-demo-001',
})

const lastSession = ref<{ sessionId: string; surveyUrl: string } | null>(null)

onMounted(async () => {
  try {
    health.value = await api.health()
  } catch {
    health.value = null
  }
})

async function createSurvey() {
  loading.value = true
  error.value = ''
  try {
    const session = await api.createSurveySession({
      lessonId: form.lessonId,
      teacherId: form.teacherId,
      lessonTitle: form.lessonTitle,
    })
    lastSession.value = {
      sessionId: session.sessionId,
      surveyUrl: `/survey/${session.sessionId}`,
    }
    await navigateTo(lastSession.value.surveyUrl)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to create survey'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1>Teacher Dashboard</h1>
      <p>Create a Student Engagement Survey and view lesson reports.</p>
    </div>

    <Message v-if="!health" severity="warn" class="mb-4">
      API not reachable at {{ useRuntimeConfig().public.apiBase }}. Start etl-api with Docker or <code>npm start</code>.
    </Message>
    <Message v-else severity="success" class="mb-4">
      API connected — {{ health.service || 'lessonloop-etl-api' }} ({{ health.status }})
    </Message>

    <Card class="mb-4">
      <template #title>Create New Survey Session</template>
      <template #content>
        <div class="form-field">
          <label for="lessonTitle">Lesson Title</label>
          <InputText id="lessonTitle" v-model="form.lessonTitle" class="w-full" />
        </div>
        <div class="form-field">
          <label for="lessonId">Lesson ID</label>
          <InputText id="lessonId" v-model="form.lessonId" class="w-full" />
        </div>
        <Message v-if="error" severity="error" class="mt-3">{{ error }}</Message>
      </template>
      <template #footer>
        <Button label="Create & Open Survey" icon="pi pi-plus" :loading="loading" @click="createSurvey" />
      </template>
    </Card>

    <Card>
      <template #title>Quick Links</template>
      <template #content>
        <p class="text-muted">After students complete the survey, view the engagement report:</p>
        <p v-if="lastSession">
          <NuxtLink :to="`/reports/${lastSession.sessionId}`">
            View report for session {{ lastSession.sessionId.slice(0, 8) }}…
          </NuxtLink>
        </p>
        <p v-else class="text-muted">Create a survey to get started.</p>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.form-field {
  margin-bottom: 1rem;
}

.form-field label {
  display: block;
  margin-bottom: 0.375rem;
  font-weight: 500;
}

.w-full {
  width: 100%;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mt-3 {
  margin-top: 0.75rem;
}

.text-muted {
  color: var(--ll-muted);
}
</style>
