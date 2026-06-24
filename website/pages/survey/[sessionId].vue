<script setup lang="ts">
import { LIKERT_OPTIONS } from '~/types/survey'
import type { SurveySession } from '~/types/survey'

const route = useRoute()
const api = useLessonLoopApi()
const sessionId = route.params.sessionId as string

const session = ref<SurveySession | null>(null)
const answers = ref<Record<string, number>>({})
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const submitted = ref(false)

onMounted(async () => {
  try {
    session.value = await api.getSurveySession(sessionId)
    for (const q of session.value.questions) {
      answers.value[q.id] = 3
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load survey'
  } finally {
    loading.value = false
  }
})

async function submitSurvey() {
  if (!session.value) return
  submitting.value = true
  error.value = ''
  try {
    const responses = session.value.questions.map((q) => ({
      questionId: q.id,
      answerValue: answers.value[q.id],
    }))
    await api.submitResponses(sessionId, responses)
    await api.completeSurvey(sessionId)
    submitted.value = true
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to submit survey'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <Tag value="Anonymous SES" severity="info" class="mb-2" />
      <h1>{{ session?.lessonTitle || 'Student Engagement Survey' }}</h1>
      <p>Your responses are anonymous. This survey takes about 1–2 minutes.</p>
    </div>

    <ProgressSpinner v-if="loading" />

    <template v-else-if="submitted">
      <Card>
        <template #content>
          <div class="success-state">
            <i class="pi pi-check-circle success-icon" />
            <h2>Thank you!</h2>
            <p>Your feedback helps your teacher improve the next lesson.</p>
            <NuxtLink :to="`/reports/${sessionId}`">
              <Button label="View Sample Report (Teacher)" icon="pi pi-chart-bar" outlined />
            </NuxtLink>
          </div>
        </template>
      </Card>
    </template>

    <template v-else-if="session">
      <form @submit.prevent="submitSurvey">
        <Card v-for="(q, idx) in session.questions" :key="q.id" class="question-card">
          <template #content>
            <div class="question-meta">
              <Tag :value="q.categoryKey.replace(/_/g, ' ')" severity="secondary" />
            </div>
            <p class="question-text">{{ idx + 1 }}. {{ q.text }}</p>
            <div class="likert-group">
              <div
                v-for="opt in LIKERT_OPTIONS"
                :key="opt.value"
                class="likert-option"
                :class="{ selected: answers[q.id] === opt.value }"
                @click="answers[q.id] = opt.value"
              >
                <RadioButton
                  :input-id="`${q.id}-${opt.value}`"
                  :value="opt.value"
                  v-model="answers[q.id]"
                  :name="q.id"
                />
                <label :for="`${q.id}-${opt.value}`">{{ opt.label }}</label>
              </div>
            </div>
          </template>
        </Card>

        <Message v-if="error" severity="error" class="mb-3">{{ error }}</Message>

        <Button
          type="submit"
          label="Submit Survey"
          icon="pi pi-send"
          :loading="submitting"
          class="submit-btn"
        />
      </form>
    </template>

    <Message v-else-if="error" severity="error">{{ error }}</Message>
  </div>
</template>

<style scoped>
.question-card {
  margin-bottom: 1rem;
}

.question-meta {
  margin-bottom: 0.5rem;
}

.question-text {
  font-size: 1.05rem;
  line-height: 1.5;
  margin: 0 0 1rem;
}

.likert-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.likert-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--ll-border);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.likert-option:hover,
.likert-option.selected {
  border-color: var(--ll-primary);
  background: #eff6ff;
}

.likert-option label {
  cursor: pointer;
  flex: 1;
}

.submit-btn {
  width: 100%;
  margin-top: 0.5rem;
}

.success-state {
  text-align: center;
  padding: 2rem 1rem;
}

.success-icon {
  font-size: 3rem;
  color: var(--ll-success);
}

.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
</style>
