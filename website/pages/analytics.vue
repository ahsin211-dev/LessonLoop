<script setup lang="ts">
import type { TeacherAnalytics } from '~/types/survey'

definePageMeta({ middleware: 'auth' })

const api = useLessonLoopApi()
const analytics = ref<TeacherAnalytics | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    analytics.value = await api.getAnalytics()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load analytics'
  } finally {
    loading.value = false
  }
})

function scoreColor(score: number | null) {
  if (score === null) return 'secondary'
  if (score >= 4) return 'success'
  if (score >= 3) return 'warn'
  return 'danger'
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <NuxtLink to="/" class="back-link"><i class="pi pi-arrow-left" /> Dashboard</NuxtLink>
      <h1>Engagement Analytics</h1>
      <p>Aggregated student engagement across your completed survey sessions.</p>
    </div>

    <ProgressSpinner v-if="loading" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else-if="analytics">
      <div class="card-grid two-col mb-4">
        <Card>
          <template #title>Average Overall Engagement</template>
          <template #content>
            <div class="stat-value">{{ analytics.averageOverallScore?.toFixed(1) ?? '—' }}</div>
            <div class="stat-label">Across {{ analytics.reportCount }} completed reports</div>
          </template>
        </Card>
        <Card>
          <template #title>Participation</template>
          <template #content>
            <div class="stat-value">{{ analytics.totalStudents }}</div>
            <div class="stat-label">Total student responses</div>
            <div class="text-muted mt-2">{{ analytics.sessionCount }} sessions</div>
          </template>
        </Card>
      </div>

      <h2 class="section-title">Subscale Averages</h2>
      <div class="card-grid mb-4">
        <Card v-for="sub in analytics.subscaleAggregates" :key="sub.categoryKey">
          <template #content>
            <div class="subscale-header">
              <span>{{ sub.displayName }}</span>
              <Tag :value="sub.averageScore?.toFixed(1) ?? '—'" :severity="scoreColor(sub.averageScore)" />
            </div>
            <small class="text-muted">{{ sub.sessionCount }} session(s)</small>
          </template>
        </Card>
      </div>

      <h2 class="section-title">Recent Sessions</h2>
      <DataTable :value="analytics.recentSessions" striped-rows>
        <Column field="lessonTitle" header="Lesson" />
        <Column field="overallScore" header="Score">
          <template #body="{ data }">{{ data.overallScore?.toFixed(1) }}</template>
        </Column>
        <Column field="studentCount" header="Students" />
        <Column field="scoredAt" header="Scored">
          <template #body="{ data }">{{ new Date(data.scoredAt).toLocaleDateString() }}</template>
        </Column>
        <Column header="">
          <template #body="{ data }">
            <NuxtLink :to="`/reports/${data.sessionId}`">
              <Button icon="pi pi-chart-bar" text rounded />
            </NuxtLink>
          </template>
        </Column>
      </DataTable>
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
.section-title { font-size: 1.25rem; margin: 0 0 1rem; }
.subscale-header { display: flex; justify-content: space-between; align-items: center; }
.mb-4 { margin-bottom: 1rem; }
.mt-2 { margin-top: 0.5rem; }
.text-muted { color: var(--ll-muted); }
</style>
