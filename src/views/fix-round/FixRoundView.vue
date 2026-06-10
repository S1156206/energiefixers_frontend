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

    <main class="content">
      <div class="card">
        <div class="card-header">
          <h1>Fix Rondes</h1>
          <button class="btn btn--primary" :disabled="fixRoundsStore.isLoading" @click="openAddForm">
            Nieuwe ronde
          </button>
        </div>

        <p v-if="successMessage" class="message message--success">{{ successMessage }}</p>
        <p v-if="errorMessage" class="message message--error">{{ errorMessage }}</p>

        <div v-if="showAddForm" class="inline-form">
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

        <div v-if="fixRoundsStore.rounds.length === 0 && !fixRoundsStore.isLoading" class="state-message">
          Geen fixrondes gevonden.
        </div>
        <div v-else-if="fixRoundsStore.isLoading && fixRoundsStore.rounds.length === 0" class="state-message">
          Laden...
        </div>

        <ul v-else class="round-list">
          <li v-for="round in fixRoundsStore.rounds" :key="round.id" class="round-item">
            <div class="round-main">
              <div class="round-title">
                <span class="round-name">{{ round.name }}</span>
                <span v-if="round.current" class="badge badge--active">Actief</span>
              </div>
              <p v-if="round.description" class="round-description">{{ round.description }}</p>
              <div class="round-meta">
                <span>{{ formatDate(round.startDate) }} — {{ formatDate(round.endDate) }}</span>
                <span class="round-count">{{ round.propertyCount }} woning{{ round.propertyCount === 1 ? '' : 'en' }}</span>
              </div>
            </div>

            <div class="round-actions">
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
          </li>
        </ul>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
}

.content {
  max-width: 720px;
  width: 100%;
  margin: 2rem auto;
  padding: 0 1rem;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.card-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.message {
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
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
  color: #6b7280;
  font-size: 0.9rem;
  text-align: center;
  padding: 2rem 0;
}

.inline-form {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.inline-form--edit {
  margin-top: 0.75rem;
}

.inline-form h2 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;
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
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #1a1a2e;
  background: white;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.25rem;
}

.required {
  color: #dc2626;
}

.round-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.round-item {
  padding: 1rem 0;
  border-top: 1px solid #f3f4f6;
}

.round-item:first-child {
  border-top: none;
  padding-top: 0;
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
  font-weight: 600;
  color: #1a1a2e;
  font-size: 0.95rem;
}

.badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.badge--active {
  background: #dcfce7;
  color: #16a34a;
}

.round-description {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
}

.round-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #9ca3af;
}

.round-count {
  color: #6b7280;
}

.round-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.15s, opacity 0.15s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn--primary {
  background: #3b82f6;
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn--secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn--secondary:hover:not(:disabled) {
  background: #f9fafb;
}

.btn--ghost {
  background: transparent;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.btn--ghost:hover:not(:disabled) {
  background: #f3f4f6;
}

.btn--sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
}
</style>
