#!/usr/bin/env node
/**
 * End-to-end integration test against a running etl-api + DynamoDB Local.
 * Usage: API_BASE=http://localhost:3001/local node scripts/integration-test.js
 */
const API_BASE = process.env.API_BASE || 'http://localhost:3001/local';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${options.method || 'GET'} ${path} → ${res.status}: ${data.error || JSON.stringify(data)}`);
  return data;
}

function uuid() {
  return crypto.randomUUID();
}

async function run() {
  console.log('Integration test against', API_BASE);

  const health = await request('/health');
  console.log('✓ health:', health.status);

  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ teacherId: 'teacher-demo-001' }),
  });
  const token = login.token;
  console.log('✓ login:', login.teacher.name);

  const auth = { Authorization: `Bearer ${token}` };

  const session = await request('/surveys/sessions', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      lessonId: `integration-${Date.now()}`,
      lessonTitle: 'Integration Test Lesson',
      selectedCategories: ['cognitive', 'social', 'emotional'],
      questionsPerCategory: 1,
    }),
  });
  const sessionId = session.sessionId;
  console.log('✓ session created:', sessionId, `(${session.questions.length} questions)`);

  for (const score of [5, 3, 4]) {
    const respondentId = uuid();
    const responses = session.questions.map((q) => ({
      questionId: q.id,
      answerValue: score,
    }));
    const submit = await request(`/surveys/sessions/${sessionId}/responses`, {
      method: 'POST',
      body: JSON.stringify({ respondentId, responses }),
    });
    console.log(`✓ student submitted (score pattern ${score}):`, submit.participation.studentCount, 'students');
  }

  const status = await request(`/surveys/sessions/${sessionId}/status`, { headers: auth });
  console.log('✓ participation:', status.participation.studentCount, 'students');

  const complete = await request(`/surveys/sessions/${sessionId}/complete`, {
    method: 'POST',
    headers: auth,
  });
  console.log('✓ report scored: overall', complete.report.overallScore, 'students', complete.report.studentCount);

  const report = await request(`/reports/${sessionId}`, { headers: auth });
  if (report.subscaleScores.length !== 3) throw new Error('Expected 3 subscales');
  console.log('✓ report retrieved:', report.subscaleScores.length, 'subscales');

  const recs = await request(`/reports/${sessionId}/recommendations`, { headers: auth });
  console.log('✓ recommendations:', recs.recommendations.length, 'strategies');

  const analytics = await request('/analytics', { headers: auth });
  console.log('✓ analytics: avg overall', analytics.averageOverallScore, 'across', analytics.reportCount, 'reports');

  const sessions = await request('/surveys/sessions', { headers: auth });
  console.log('✓ session list:', sessions.sessions.length, 'sessions');

  console.log('\nAll integration checks passed.');
}

run().catch((err) => {
  console.error('\nIntegration test failed:', err.message);
  process.exit(1);
});
