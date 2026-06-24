// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: ['@primevue/nuxt-module'],

  primevue: {
    options: {
      theme: {
        preset: 'Aura',
        options: {
          darkModeSelector: false,
        },
      },
    },
  },

  css: [
    'primeicons/primeicons.css',
    '~/assets/css/main.css',
  ],

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001/local',
    },
  },

  app: {
    head: {
      title: 'LessonLoop',
      meta: [
        { name: 'description', content: 'Student Engagement Survey platform' },
      ],
    },
  },
})
