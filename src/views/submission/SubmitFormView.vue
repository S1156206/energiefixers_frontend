<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiRequest } from '@/services/api'
import type { SubmissionInfo, SubmissionFormData, SubmissionResult } from '@/types'
import UserNavBar from '@/components/nav/UserNavBar.vue'

const route = useRoute()
const token = route.params.token as string

const isLoading = ref(true)
const tokenError = ref('')
const info = ref<SubmissionInfo | null>(null)

const isSubmitting = ref(false)
const submitError = ref('')
const result = ref<SubmissionResult | null>(null)

const form = ref<SubmissionFormData>({
  gasUsageM3: null,
  electricityUsageKwh: null,
  totalCostEuros: null,
  periodStart: '',
  periodEnd: '',
})

onMounted(async () => {
  try {
    info.value = await apiRequest<SubmissionInfo>('GET', `/api/submission/${token}`)
  } catch (err) {
    tokenError.value = err instanceof Error ? err.message : 'Er is iets misgegaan.'
  } finally {
    isLoading.value = false
  }
})

async function handleSubmit() {
  submitError.value = ''
  isSubmitting.value = true
  try {
    result.value = await apiRequest<SubmissionResult>('POST', `/api/submission/${token}`, form.value)
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : 'Er is iets misgegaan bij het indienen.'
  } finally {
    isSubmitting.value = false
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function categoryLabel(category: string): string {
  const map: Record<string, string> = {
    WINDOWS: 'Ramen',
    INSULATION: 'Isolatie',
    HEATING: 'Verwarming',
    SOLAR: 'Zonnepanelen',
    VENTILATION: 'Ventilatie',
    OTHER: 'Overig',
  }
  return map[category] ?? category
}
</script>

<template>
  <div class="page">
    <UserNavBar></UserNavBar>

    <main class="content">
      <div v-if="isLoading" class="state-message">Formulier laden...</div>

      <div v-else-if="tokenError" class="error-card">
        <p class="error-icon">⚠️</p>
        <p class="error-title">{{ tokenError }}</p>
        <p class="error-sub">Neem contact op met uw energieadviseur als u denkt dat dit een fout is.</p>
      </div>

      <template v-else-if="result">
        <div class="success-card">
          <p class="success-icon">✓</p>
          <h1>Bedankt!</h1>
          <p>Uw jaarverbruik is succesvol ingediend. We nemen de gegevens mee in uw energieanalyse.</p>
          <a v-if="result.invitationToken" :href="`/register?token=${result.invitationToken}`" class="btn btn--primary">
            Account aanmaken
          </a>
        </div>
      </template>

      <template v-else-if="info">
        <div class="card info-card">
          <h1>Jaarverbruik doorgeven</h1>
          <p class="intro">
            Om te zien hoeveel onze fixbezoeken daadwerkelijk bij u besparen verzoeken wij u om uw laatste
            energieverbruik door te geven voor de woning
            <strong>{{ info.address }}</strong>.
          </p>

          <div v-if="info.materials.length" class="materials-block">
            <h2>Geïnstalleerde maatregelen</h2>
            <ul class="materials-list">
              <li v-for="(mat, i) in info.materials" :key="i" class="material-item">
                <span class="mat-name">{{ mat.name }}</span>
                <span class="mat-meta">
                  {{ categoryLabel(mat.category) }} · {{ mat.quantity }}×
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div class="card form-card">
          <form @submit.prevent="handleSubmit">
            <div class="period-row">
              <div class="form-group">
                <label for="periodStart">Periode van</label>
                <input id="periodStart" v-model="form.periodStart" type="date" required />
              </div>
              <div class="form-group">
                <label for="periodEnd">tot en met</label>
                <input id="periodEnd" v-model="form.periodEnd" type="date" required />
              </div>
            </div>

            <div class="form-group">
              <label for="gas">Gasverbruik (m³)</label>
              <input id="gas" v-model.number="form.gasUsageM3" type="number" min="0" step="0.01"
                placeholder="bijv. 1200" required />
            </div>

            <div class="form-group">
              <label for="electricity">Elektriciteitsverbruik (kWh)</label>
              <input id="electricity" v-model.number="form.electricityUsageKwh" type="number" min="0" step="0.01"
                placeholder="bijv. 3500" required />
            </div>

            <div class="form-group">
              <label for="cost">Totale energiekosten (€)</label>
              <input id="cost" v-model.number="form.totalCostEuros" type="number" min="0" step="0.01"
                placeholder="bijv. 1200.50" required />
            </div>

            <p v-if="submitError" class="error">{{ submitError }}</p>

            <button type="submit" :disabled="isSubmitting" class="btn btn--success">
              {{ isSubmitting ? 'Bezig met indienen...' : 'Verbruik indienen' }}
            </button>
          </form>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background-color: var(--color-primary, #f15a22);
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
}

.state-message {
  color: white;
  text-align: center;
  padding: 3rem;
}

.card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f3f4f6;
  padding: 1.75rem;
  transition: box-shadow 0.15s, transform 0.15s;
}

.card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.info-card h1 {
  font-size: 1.4rem;
  color: var(--color-primary);
  margin-bottom: 0.75rem;
  margin-top: 0;
}

.intro {
  color: #4b5563;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.materials-block h2 {
  font-size: 0.85rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.75rem;
}

.materials-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.material-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--color-primary-light);
  border-radius: 6px;
  font-size: 0.875rem;
}

.mat-name {
  color: #374151;
  font-weight: 500;
}

.mat-meta {
  color: #9ca3af;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.period-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

input {
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.15s;
  background: white;
}

input:focus {
  border-color: var(--color-primary);
}

.error {
  color: #dc2626;
  font-size: 0.875rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
}

.error-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f3f4f6;
  padding: 3rem 2rem;
  text-align: center;
}

.error-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.error-sub {
  color: #6b7280;
  font-size: 0.9rem;
}

.success-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f3f4f6;
  padding: 3rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.success-icon {
  font-size: 3rem;
  color: var(--color-secondary);
  background: #f0fdf4;
  border-radius: 50%;
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.success-card h1 {
  font-size: 1.4rem;
  color: var(--color-primary);
}

.success-card p {
  color: #4b5563;
  font-size: 0.95rem;
  max-width: 380px;
  line-height: 1.6;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.15s, opacity 0.15s;
  text-decoration: none;
  display: inline-block;
  margin-top: 0.5rem;
}

.btn--primary {
  background: var(--color-primary);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: #d94e1a;
}

.btn--success {
  background: var(--color-secondary);
  color: white;
}

.btn--success:hover:not(:disabled) {
  background: #5da637;
}

.btn--primary:disabled,
.btn--success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
