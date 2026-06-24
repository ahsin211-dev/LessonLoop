<script setup lang="ts">
import type { EngagementReport, Recommendation } from '~/types/survey'
import { SUBSCALE_GROUPS } from '~/types/survey'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const api = useLessonLoopApi()
const sessionId = route.params.sessionId as string

const report = ref<EngagementReport | null>(null)
const recommendations = ref<Recommendation[]>([])
const loading = ref(true)
const error = ref('')

function scoreColor(score: number | null) {
  if (score === null) return 'secondary'
  if (score >= 4) return 'success'
  if (score >= 3) return 'warn'
  return 'danger'
}

function scorePercent(score: number | null) {
  if (score === null) return 0
  return Math.round(((score - 1) / 4) * 100)
}

const groupedSubscales = computed(() => {
  if (!report.value) return {}
  const groups: Record<string, typeof report.value.subscaleScores> = {}
  for (const s of report.value.subscaleScores) {
    if (!groups[s.group]) groups[s.group] = []
    groups[s.group].push(s)
  }
  return groups
})

onMounted(async () => {
  try {
    report.value = await api.getReport(sessionId)
    const recs = await api.getRecommendations(sessionId)
    recommendations.value = recs.recommendations
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load report'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <NuxtLink to="/" class="back-link"><i class="pi pi-arrow-left" /> Dashboard</NuxtLink>
      <h1>Lesson Engagement Report</h1>
      <p v-if="report">{{ report.lessonTitle }}</p>
    </div>

    <ProgressSpinner v-if="loading" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else-if="report">
      <Card class="overall-card mb-4">
        <template #content>
          <div class="overall-grid">
            <div class="overall-score">
              <span class="score-label">Overall Engagement</span>
              <span class="score-value">{{ report.overallScore?.toFixed(1) }}</span>
              <span class="score-range">out of 5.0</span>
              <ProgressBar :value="report.overallPercent" :show-value="true" class="mt-2" />
            </div>
            <div class="meta-stats">
              <div><strong>{{ report.studentCount }}</strong> students responded</div>
              <div class="text-muted">{{ report.responseCount }} total answers</div>
              <div class="text-muted">Scored {{ new Date(report.scoredAt).toLocaleString() }}</div>
            </div>
          </div>
        </template>
      </Card>

      <h2 class="section-title">Nine Engagement Subscales</h2>

      <div v-for="(subscales, group) in groupedSubscales" :key="group" class="group-section">
        <h3 class="group-title">{{ SUBSCALE_GROUPS[group] || group }}</h3>
        <div class="card-grid">
          <Card v-for="sub in subscales" :key="sub.categoryKey" class="subscale-card">
            <template #content>
              <div class="subscale-header">
                <span class="subscale-name">{{ sub.displayName }}</span>
                <Tag :value="sub.score?.toFixed(1) ?? '—'" :severity="scoreColor(sub.score)" />
              </div>
              <ProgressBar :value="scorePercent(sub.score)" :show-value="false" class="mt-2" />
              <small class="text-muted">{{ sub.studentCount }} student(s), {{ sub.responseCount }} answer(s)</small>
            </template>
          </Card>
        </div>
      </div>

      <h2 class="section-title mt-4">Recommended Instructional Strategies</h2>
      <p class="text-muted mb-3">TEK-Base recommendations for subscales below threshold (3.5)</p>

      <Message v-if="recommendations.length === 0" severity="info">
        All subscales are at or above threshold. Great engagement!
      </Message>

      <Card v-for="rec in recommendations" :key="rec.categoryKey" class="mb-3">
        <template #title>
          <div class="rec-title">
            {{ rec.strategy.title }}
            <Tag :value="rec.priority" :severity="rec.priority === 'high' ? 'danger' : 'warn'" />
            <Tag v-if="rec.aiGenerated" value="AI" severity="info" />
          </div>
        </template>
        <template #subtitle>{{ rec.displayName }} — score {{ rec.currentScore }}</template>
        <template #content>
          <p><strong>Goal:</strong> {{ rec.strategy.goal }}</p>
          <ol class="steps-list">
            <li v-for="(step, i) in rec.strategy.steps" :key="i">{{ step }}</li>
          </ol>
          <div v-if="rec.activity" class="activity-block">
            <h4>Suggested Activity</h4>
            <pre class="activity-text">{{ rec.activity }}</pre>
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-flex; align-items: center; gap: 0.375rem;
  font-size: 0.875rem; margin-bottom: 0.75rem;
}
.overall-grid { display: grid; gap: 1.5rem; }
@media (min-width: 640px) {
  .overall-grid { grid-template-columns: 1fr 1fr; align-items: center; }
}
.overall-score .score-label {
  display: block; font-size: 0.875rem; color: var(--ll-muted);
  text-transform: uppercase; letter-spacing: 0.05em;
}
.overall-score .score-value {
  font-size: 3rem; font-weight: 700; color: var(--ll-primary); line-height: 1.1;
}
.overall-score .score-range { font-size: 0.875rem; color: var(--ll-muted); }
.section-title { font-size: 1.25rem; margin: 0 0 1rem; }
.group-title {
  font-size: 1rem; color: var(--ll-muted); margin: 0 0 0.75rem;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.group-section { margin-bottom: 1.5rem; }
.subscale-header { display: flex; justify-content: space-between; align-items: center; }
.subscale-name { font-weight: 600; }
.rec-title { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.steps-list { margin: 0.5rem 0 0; padding-left: 1.25rem; }
.activity-block { margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px; }
.activity-block h4 { margin: 0 0 0.5rem; font-size: 0.9rem; }
.activity-text {
  white-space: pre-wrap; font-family: inherit; font-size: 0.875rem;
  margin: 0; line-height: 1.5;
}
.text-muted { color: var(--ll-muted); }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-4 { margin-top: 1.5rem; }
</style>
