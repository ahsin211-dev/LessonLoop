<script setup lang="ts">
definePageMeta({ layout: 'default' })

const api = useLessonLoopApi()
const { setAuth } = useAuth()
const loading = ref(false)
const error = ref('')

const teacherId = ref('teacher-demo-001')

const presets = [
  { id: 'teacher-demo-001', label: 'Demo Teacher' },
  { id: 'teacher-demo-002', label: 'Coach Demo' },
]

async function login() {
  loading.value = true
  error.value = ''
  try {
    const result = await api.login(teacherId.value)
    setAuth(result.token, result.teacher)
    await navigateTo('/')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-container login-page">
    <Card class="login-card">
      <template #title>Teacher Sign In</template>
      <template #subtitle>Dev login for local development. Production uses SSO/Cognito.</template>
      <template #content>
        <div class="form-field">
          <label>Teacher Account</label>
          <Select
            v-model="teacherId"
            :options="presets"
            option-label="label"
            option-value="id"
            class="w-full"
          />
        </div>
        <Message v-if="error" severity="error" class="mt-3">{{ error }}</Message>
      </template>
      <template #footer>
        <Button label="Sign In" icon="pi pi-sign-in" :loading="loading" @click="login" class="w-full" />
      </template>
    </Card>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  padding-top: 4rem;
}

.login-card {
  width: 100%;
  max-width: 420px;
}

.form-field label {
  display: block;
  margin-bottom: 0.375rem;
  font-weight: 500;
}

.w-full { width: 100%; }
.mt-3 { margin-top: 0.75rem; }
</style>
