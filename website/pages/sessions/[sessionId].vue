<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const api = useLessonLoopApi()
const sessionId = route.params.sessionId as string

const status = ref<{
  sessionId: string
  status: string
  lessonTitle: string
  participation: { studentCount: number; responseCount: number }
  hasReport: boolean
} | null>(null)
const loading = ref(true)
const completing = ref(false)
const error = ref('')

const surveyLink = computed(() =>
  import.meta.client ? `${window.location.origin}/survey/${sessionId}` : '',
)

async function refresh() {
  try {
    status.value = await api.getSessionStatus(sessionId)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load session'
  } finally {
    loading.value = false
  }
}

onMounted(refresh)

async function completeSurvey() {
  completing.value = true
  error.value = ''
  try {
    await api.completeSurvey(sessionId)
    await navigateTo(`/reports/${sessionId}`)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to generate report'
  } finally {
    completing.value = false
  }
}

function copyLink() {
  if (surveyLink.value) navigator.clipboard.writeText(surveyLink.value)
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <NuxtLink to="/" class="back-link"><i class="pi pi-arrow-left" /> Dashboard</NuxtLink>
      <h1>{{ status?.lessonTitle || 'Survey Session' }}</h1>
      <p>Share the survey link with students. Close the session when ready to score.</p>
    </div>

    <ProgressSpinner v-if="loading" />

    <template v-else-if="status">
      <div class="card-grid two-col mb-4">
        <Card>
          <template #title>Participation</template>
          <template #content>
            <div class="stat-value">{{ status.participation?.studentCount ?? 0 }}</div>
            <div class="stat-label">Students responded</div>
            <div class="text-muted mt-2">{{ status.participation?.responseCount ?? 0 }} total answers</div>
          </template>
        </Card>
        <Card>
          <template #title>Status</template>
          <template #content>
            <Tag :value="status.status" :severity="status.status === 'open' ? 'success' : 'secondary'" class="mb-2" />
            <p v-if="status.hasReport" class="text-muted">Report generated</p>
            <p v-else class="text-muted">Collecting responses</p>
          </template>
        </Card>
      </div>

      <Card class="mb-4">
        <template #title>Student Survey Link</template>
        <template #content>
          <div class="link-row">
            <InputText :model-value="surveyLink" readonly class="flex-1" />
            <Button icon="pi pi-copy" label="Copy" @click="copyLink" />
          </div>
          <p class="text-muted mt-2">Students open this link — no login required. Each device can submit once.</p>
        </template>
      </Card>

      <Message v-if="error" severity="error" class="mb-3">{{ error }}</Message>

      <div class="action-row" v-if="status.status === 'open'">
        <Button
          label="Close Session & Generate Report"
          icon="pi pi-check-circle"
          :loading="completing"
          :disabled="!status.participation?.studentCount"
          @click="completeSurvey"
        />
        <Button label="Refresh" icon="pi pi-refresh" outlined @click="refresh" />
      </div>

      <div v-else>
        <NuxtLink :to="`/reports/${sessionId}`">
          <Button label="View Report" icon="pi pi-chart-bar" />
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-flex; align-items: center; gap: 0.375rem;
  font-size: 0.875rem; margin-bottom: 0.75rem;
}
.stat-value { font-size: 2.5rem; font-weight: 700; color: var(--ll-primary); }
.stat-label { color: var(--ll-muted); }
.link-row { display: flex; gap: 0.5rem; }
.flex-1 { flex: 1; }
.action-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.mb-4 { margin-bottom: 1rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mt-2 { margin-top: 0.5rem; }
.text-muted { color: var(--ll-muted); }
</style>
