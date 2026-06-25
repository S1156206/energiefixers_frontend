<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { apiRequest } from '@/services/api'
import UserNavBar from '@/components/nav/UserNavBar.vue'

const authStore = useAuthStore()
const loading = ref(true)
const saving = ref(false)
const optedOut = ref(false)
const error = ref('')
const success = ref('')

onMounted(async () => {
  try {
    const data = await apiRequest<{ email: string; optOut: boolean }>('GET', '/api/users/me/email-preference')
    optedOut.value = data.optOut
  } catch {
    error.value = 'Kon je voorkeuren niet laden'
  } finally {
    loading.value = false
  }
})

async function toggleOptOut(event: Event) {
  const newValue = (event.target as HTMLInputElement).checked
  optedOut.value = newValue
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await apiRequest<{ optOut: boolean }>('POST', '/api/users/me/email-preference', { optOut: newValue })
    success.value = newValue
      ? 'Je ontvangt geen e-mails meer van Energiefixers'
      : 'Je ontvangt weer e-mails van Energiefixers'
  } catch {
    optedOut.value = !newValue
    error.value = 'Instelling opslaan mislukt'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page">
    <UserNavBar />
    <main class="content">
      <div class="section-header">
        <h1>Mijn profiel</h1>
      </div>

      <div v-if="loading" class="state-message">Laden...</div>

      <template v-else>
        <div class="card">
          <div class="info-row">
            <span class="info-label">E-mailadres</span>
            <span class="info-value">{{ authStore.user?.email }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Naam</span>
            <span class="info-value">{{ authStore.user?.firstName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Rol</span>
            <span class="info-value">{{ authStore.user?.role === 'TENANT' ? 'Huurder' : authStore.user?.role === 'ADMIN' ? 'Beheerder' : 'Medewerker' }}</span>
          </div>
        </div>

        <div class="card">
          <div class="preference-header">
            <div>
              <h3 class="preference-title">E-mailvoorkeuren</h3>
              <p class="preference-desc">
                Krijg je liever geen e-mails meer over uitnodigingen en herinneringen?
                Zet dan hieronder e-mails uit.
              </p>
            </div>
            <label class="toggle">
              <input
                type="checkbox"
                :checked="optedOut"
                :disabled="saving"
                aria-label="E-mailnotificaties aan- of uitzetten"
                @change="toggleOptOut"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <p v-if="saving" class="saving-text">Bezig met opslaan...</p>
          <p v-if="success" class="success-text">{{ success }}</p>
          <p v-if="error" class="error-text">{{ error }}</p>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  max-width: 720px;
  width: 100%;
  margin: 2rem auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h1 {
  font-size: 1.25rem;
  color: #1a1a2e;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 1.25rem 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.info-value {
  font-size: 0.95rem;
  font-weight: 500;
  color: #1a1a2e;
}

.preference-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.preference-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 0.5rem;
}

.preference-desc {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
  cursor: pointer;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: #d1d5db;
  border-radius: 12px;
  transition: background 0.2s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  left: 2px;
  bottom: 2px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle input:checked + .toggle-slider {
  background: #3b82f6;
}

.toggle input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle input:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.saving-text {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0.75rem 0 0;
}

.success-text {
  font-size: 0.85rem;
  color: #16a34a;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  margin: 0.75rem 0 0;
}

.error-text {
  font-size: 0.85rem;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  margin: 0.75rem 0 0;
}

.state-message {
  color: #6b7280;
  text-align: center;
  padding: 2rem;
}
</style>
