<template>
  <div class="app-shell">
    <header class="app-header">
      <NuxtLink to="/" class="brand">
        <i class="pi pi-chart-line" />
        LessonLoop
      </NuxtLink>
      <nav>
        <template v-if="isAuthenticated">
          <NuxtLink to="/">Dashboard</NuxtLink>
          <span class="user-name">{{ teacher?.name }}</span>
          <Button label="Sign Out" text size="small" @click="logout" />
        </template>
        <NuxtLink v-else to="/login">Sign In</NuxtLink>
      </nav>
    </header>
    <main>
      <slot />
    </main>
    <footer class="app-footer">
      <small>Anonymous Student Engagement Surveys — FERPA-aware local development</small>
    </footer>
  </div>
</template>

<script setup lang="ts">
const { isAuthenticated, teacher, clearAuth } = useAuth()

function logout() {
  clearAuth()
  navigateTo('/login')
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--ll-card);
  border-bottom: 1px solid var(--ll-border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--ll-text);
  text-decoration: none;
}

.brand:hover {
  text-decoration: none;
  color: var(--ll-primary);
}

nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

nav a {
  color: var(--ll-muted);
  font-weight: 500;
}

nav a.router-link-active {
  color: var(--ll-primary);
}

.user-name {
  font-size: 0.875rem;
  color: var(--ll-muted);
}

main { flex: 1; }

.app-footer {
  padding: 1rem 1.5rem;
  text-align: center;
  color: var(--ll-muted);
  border-top: 1px solid var(--ll-border);
}
</style>
