<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFixRoundsStore } from '@/stores/fixRounds'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import type { FixRoundRequest } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const fixRoundsStore = useFixRoundsStore()

const showAddForm = ref(false)
const editingRoundId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')

const form = reactive<FixRoundRequest>({
  name: '',
  description: null,
  startDate: null,
  endDate: null,
})

function resetForm() {
  form.name = ''
  form.description = null
  form.startDate = null
  form.endDate = null
}

function openAddForm() {
  editingRoundId.value = null
  resetForm()
  showAddForm.value = true
  errorMessage.value = ''
  successMessage.value = ''
}

function openEditForm(id: number) {
  const round = fixRoundsStore.rounds.find((r) => r.id === id)
  if (!round) return
  showAddForm.value = false
  editingRoundId.value = id
  form.name = round.name
  form.description = round.description
  form.startDate = round.startDate
  form.endDate = round.endDate
  errorMessage.value = ''
  successMessage.value = ''
}

function cancelForm() {
  showAddForm.value = false
  editingRoundId.value = null
  resetForm()
  errorMessage.value = ''
}

async function handleAdd() {
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const created = await fixRoundsStore.createRound({
      name: form.name,
      description: form.description || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    })
    showAddForm.value = false
    resetForm()
    successMessage.value = `Ronde "${created.name}" is aangemaakt.`
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan'
  }
}

async function handleEdit() {
  if (editingRoundId.value === null) return
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const updated = await fixRoundsStore.updateRound(editingRoundId.value, {
      name: form.name,
      description: form.description || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    })
    editingRoundId.value = null
    resetForm()
    successMessage.value = `Ronde "${updated.name}" is bijgewerkt.`
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan'
  }
}

async function handleSetCurrent(id: number) {
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await fixRoundsStore.setCurrentRound(id)
    const round = fixRoundsStore.rounds.find((r) => r.id === id)
    successMessage.value = `"${round?.name}" is nu de actieve ronde.`
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan'
  }
}

function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

onMounted(async () => {
  if (authStore.user?.role !== 'ADMIN') {
    router.push('/management')
    return
  }
  fixRoundsStore.isLoaded = false
  await fixRoundsStore.ensureLoaded()
})
</script>

<template>
  <div class="page">
    <UserNavBar />

    <div class="content-container header-section">
      <div class="list-header">
        <h1>Fixrondes</h1>
        <button class="btn-add" :disabled="fixRoundsStore.isLoading" @click="openAddForm">
          Nieuwe ronde toevoegen
        </button>
      </div>
    </div>

    <div class="divider-container">
      <img src="../../assets/stekkerdoos.png" alt="divider" class="douchekop-img" />
    </div>

    <main class="content-container main-section">
      <p v-if="successMessage" class="message message--success">{{ successMessage }}</p>
      <p v-if="errorMessage" class="message message--error">{{ errorMessage }}</p>

      <div v-if="showAddForm" class="round-card">
        <div class="inline-form">
          <h2>Nieuwe ronde toevoegen</h2>
          <form @submit.prevent="handleAdd">
            <div class="form-group">
              <label for="add-name">Naam <span class="required">*</span></label>
              <input id="add-name" v-model="form.name" type="text" required placeholder="Ronde 6" />
            </div>
            <div class="form-group">
              <label for="add-description">Omschrijving</label>
              <input id="add-description" v-model="form.description" type="text" placeholder="Optionele omschrijving" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="add-start">Startdatum</label>
                <input id="add-start" v-model="form.startDate" type="date" />
              </div>
              <div class="form-group">
                <label for="add-end">Einddatum</label>
                <input id="add-end" v-model="form.endDate" type="date" />
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn--primary" :disabled="fixRoundsStore.isLoading">
                {{ fixRoundsStore.isLoading ? 'Opslaan...' : 'Opslaan' }}
              </button>
              <button type="button" class="btn btn--secondary" @click="cancelForm">Annuleren</button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="fixRoundsStore.rounds.length === 0 && !fixRoundsStore.isLoading" class="state-message">
        Geen fixrondes gevonden.
      </div>
      <div v-else-if="fixRoundsStore.isLoading && fixRoundsStore.rounds.length === 0" class="state-message">
        Gegevens laden...
      </div>

      <div v-else class="property-list">
        <div v-for="round in fixRoundsStore.rounds" :key="round.id" class="round-card">

          <div class="round-main">
            <div class="round-title">
              <span class="round-name">{{ round.name }}</span>
              <span v-if="round.current" class="badge badge--active">Actief</span>
            </div>
            <p v-if="round.description" class="round-description">{{ round.description }}</p>
            <div class="round-meta">
              <span>{{ formatDate(round.startDate) }} — {{ formatDate(round.endDate) }}</span>
              <span class="round-count">| {{ round.propertyCount }} woning{{ round.propertyCount === 1 ? '' : 'en' }}</span>
            </div>
          </div>

          <div class="round-actions" v-if="editingRoundId !== round.id">
            <button
              v-if="!round.current"
              class="btn btn--secondary btn--sm"
              :disabled="fixRoundsStore.isLoading"
              @click="handleSetCurrent(round.id)"
            >
              Stel in als huidig
            </button>
            <button
              class="btn btn--ghost btn--sm"
              :disabled="fixRoundsStore.isLoading"
              @click="openEditForm(round.id)"
            >
              Bewerken
            </button>
          </div>

          <div v-if="editingRoundId === round.id" class="inline-form inline-form--edit">
            <hr class="divider" />
            <h2>Ronde bewerken</h2>
            <form @submit.prevent="handleEdit">
              <div class="form-group">
                <label :for="`edit-name-${round.id}`">Naam <span class="required">*</span></label>
                <input :id="`edit-name-${round.id}`" v-model="form.name" type="text" required />
              </div>
              <div class="form-group">
                <label :for="`edit-desc-${round.id}`">Omschrijving</label>
                <input :id="`edit-desc-${round.id}`" v-model="form.description" type="text" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label :for="`edit-start-${round.id}`">Startdatum</label>
                  <input :id="`edit-start-${round.id}`" v-model="form.startDate" type="date" />
                </div>
                <div class="form-group">
                  <label :for="`edit-end-${round.id}`">Einddatum</label>
                  <input :id="`edit-end-${round.id}`" v-model="form.endDate" type="date" />
                </div>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn--primary" :disabled="fixRoundsStore.isLoading">
                  {{ fixRoundsStore.isLoading ? 'Opslaan...' : 'Opslaan' }}
                </button>
                <button type="button" class="btn btn--secondary" @click="cancelForm">Annuleren</button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-primary, #f15a22);
}

.content-container {
  max-width: 760px;
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
}

.header-section {
  margin-top: 2rem;
  margin-bottom: 1.5rem;
}

.main-section {
  margin-top: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.divider-container {
  width: 100%;
  padding: 0 5%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.douchekop-img {
  width: 100%;
  max-width: 850px;
  height: auto;
  display: block;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-header h1 {
  font-size: 1.5rem;
  color: white;
  margin: 0;
}

.message {
  margin: 0;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message--success {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.message--error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.state-message {
  color: white;
  font-size: 1rem;
  text-align: center;
  padding: 2rem 0;
}

.property-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.round-card {
  background: var(--color-primary-light, #FDEEE8);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f3f4f6;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: box-shadow 0.15s, transform 0.15s;
}

.round-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.round-main {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.round-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.round-name {
  font-weight: 500;
  color: #1f2937;
  font-size: 1.05rem;
}

.badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.2rem 0.7rem;
  border-radius: 6px;
  display: inline-block;
  white-space: nowrap;
}

.badge--active {
  background: #F15A22;
  color: #f0fdf4;
  border-radius: 6px;
}

.round-description {
  font-size: 0.9rem;
  color: #4b5563;
  margin: 0.25rem 0 0 0;
}

.round-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 0.2rem;
}

.round-count {
  color: #6b7280;
}

.round-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.inline-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.inline-form--edit {
  margin-top: 0.5rem;
}

.divider {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 0.5rem 0 1rem 0;
}

.inline-form h2 {
  font-size: 1.05rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}

.form-group input {
  padding: 0.6rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #1a1a2e;
  background: white;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary, #f15a22);
  box-shadow: 0 0 0 2px rgba(241, 90, 34, 0.2);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.required {
  color: #dc2626;
}

.btn, .btn-add {
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-add {
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  background: var(--color-primary-light, #FDEEE8);
  color: #374151;
  border: none;
}

.btn-add:hover:not(:disabled) {
  opacity: 0.9;
  color: var(--color-primary, #f15a22);
}

.btn {
  padding: 0.5rem 1.2rem;
  border: 1px solid transparent;
}

.btn:disabled, .btn-add:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--color-primary, #f15a22);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn--secondary {
  background: white;
  color: #374151;
  border-color: #d1d5db;
}

.btn--secondary:hover:not(:disabled) {
  background: #f9fafb;
  color: var(--color-primary, #f15a22);
  border-color: var(--color-primary, #f15a22);
}

.btn--ghost {
  background: transparent;
  color: #4b5563;
  border-color: #d1d5db;
}

.btn--ghost:hover:not(:disabled) {
  background: white;
  color: var(--color-primary, #f15a22);
  border-color: var(--color-primary, #f15a22);
}

.btn--sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
}
</style>