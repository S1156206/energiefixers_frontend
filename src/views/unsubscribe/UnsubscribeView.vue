<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiRequest } from '@/services/api'

const route = useRoute()
const token = route.params.token as string

const isLoading = ref(true)
const isSuccess = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  try {
    await apiRequest('GET', `/api/unsubscribe/${token}`)
    isSuccess.value = true
  } catch {
    errorMessage.value = 'Er is iets fout gegaan bij het uitschrijven.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="page">
    <main class="content">
      <div v-if="isLoading" class="state-message">Bezig met uitschrijven...</div>

      <div v-else-if="isSuccess" class="success-card">
        <p class="success-icon">✓</p>
        <h1>Je bent uitgeschreven</h1>
        <p>Je ontvangt geen e-mails meer van Energiefixers071.</p>
      </div>

      <div v-else class="error-card">
        <p class="error-icon">⚠️</p>
        <h1>Er is iets fout gegaan</h1>
        <p>{{ errorMessage }}</p>
        <p>Neem contact op met <a href="mailto:info@energiefixers071.nl">info@energiefixers071.nl</a> als dit probleem blijft bestaan.</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-primary);
  display: flex;
  flex-direction: column;
}

.content {
  max-width: 640px;
  width: 100%;
  margin: 2rem auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  justify-content: center;
  flex: 1;
}

.state-message {
  color: white;
  text-align: center;
  padding: 3rem;
}

.success-card,
.error-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 3rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.success-icon {
  font-size: 3rem;
  color: #16a34a;
  background: #f0fdf4;
  border-radius: 50%;
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.error-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.success-card h1,
.error-card h1 {
  font-size: 1.4rem;
  color: #1a1a2e;
}

.success-card p,
.error-card p {
  color: #4b5563;
  font-size: 0.95rem;
  max-width: 380px;
  line-height: 1.6;
}

.error-card a {
  color: var(--color-primary);
  font-weight: 500;
}
</style>
