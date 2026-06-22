<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFixRoundsStore } from '@/stores/fixRounds'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import type { FixRoundRequest } from '@/types'
import searchIcon from '@/assets/icons/search_icon.png'
import pencilIcon from '@/assets/icons/pencil_icon.png'
import houseIcon from '@/assets/icons/house_icon.png'
import clockIcon from '@/assets/icons/clock_icon.png'

const router = useRouter()
const authStore = useAuthStore()
const fixRoundsStore = useFixRoundsStore()

const showAddForm = ref(false)
const editingRoundId = ref<number | null>(null)
const editStatus = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const searchQuery = ref('')

const filteredRounds = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return fixRoundsStore.rounds
  return fixRoundsStore.rounds.filter((round) => round.name.toLowerCase().includes(query))
})

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
  editStatus.value = round.current ? 'ACTIEF' : 'NIET_ACTIEF'
  errorMessage.value = ''
  successMessage.value = ''
}

function cancelForm() {
  showAddForm.value = false
  editingRoundId.value = null
  editStatus.value = ''
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
    successMessage.value = `${created.name} is aangemaakt.`
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan'
  }
}

async function handleEdit() {
  if (editingRoundId.value === null) return
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const id = editingRoundId.value
    const wasCurrent = fixRoundsStore.rounds.find((r) => r.id === id)?.current ?? false
    const updated = await fixRoundsStore.updateRound(id, {
      name: form.name,
      description: form.description || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    })
    if (editStatus.value === 'ACTIEF' && !wasCurrent) {
      await fixRoundsStore.setCurrentRound(id)
    }
    editingRoundId.value = null
    editStatus.value = ''
    resetForm()
    successMessage.value = `${updated.name} is bijgewerkt.`
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
      <h1>Overzicht Fixrondes</h1>
    </div>

    <div class="divider-container">
      <img src="../../assets/stekkerdoos.png" alt="divider" class="douchekop-img" />
    </div>

    <main class="content-container main-section">
      <p v-if="successMessage" class="message message--success">{{ successMessage }}</p>
      <p v-if="errorMessage" class="message message--error">{{ errorMessage }}</p>

      <div class="toolbar">
        <label class="search-field">
          <span class="search-field__label">Zoeken naar Fixrondes:</span>
          <span class="search-field__input-wrap">
            <input v-model="searchQuery" type="text" placeholder="Fixronde zoeken" />
            <img :src="searchIcon" alt="" class="search-icon" />
          </span>
        </label>

        <button class="btn-add" :disabled="fixRoundsStore.isLoading" @click="openAddForm">
          Nieuwe Fixronde
        </button>
      </div>

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

      <div v-if="filteredRounds.length === 0 && !fixRoundsStore.isLoading" class="state-message">
        Geen fixrondes gevonden.
      </div>
      <div v-else-if="fixRoundsStore.isLoading && fixRoundsStore.rounds.length === 0" class="state-message">
        Gegevens laden...
      </div>

      <div v-else class="property-list">
        <div v-for="round in filteredRounds" :key="round.id" class="round-card">

          <div class="round-header">
            <div class="round-title">
              <span class="round-name">{{ round.name }}</span>
              <span v-if="round.current" class="badge badge--active">Actief</span>
            </div>
            <button v-if="editingRoundId !== round.id" class="btn btn--ghost btn--sm"
              :disabled="fixRoundsStore.isLoading" @click="openEditForm(round.id)">
              <img :src="pencilIcon" alt="" class="btn__icon" />
              Bewerken
            </button>
          </div>

          <div class="round-main">
            <p v-if="round.description" class="round-description">{{ round.description }}</p>
            <div class="round-meta">
              <span class="round-meta__dates">
                <img :src="clockIcon" alt="" class="round-meta__icon round-meta__icon--clock" />
                {{ formatDate(round.startDate) }} — {{ formatDate(round.endDate) }}
              </span>
              <span class="round-meta__count">
                <img :src="houseIcon" alt="" class="round-meta__icon" />
                {{ round.propertyCount }} Fixbezoek
              </span>
            </div>
          </div>

          <div v-if="editingRoundId === round.id" class="inline-form inline-form--edit">
            <!-- <div class="divider-container">
              <img src="../../assets/stekker_wit.png" alt="witte stekker" class="douchekop-img"/>
            </div> -->
            <h2>FixRonde bewerken :</h2>
            <form @submit.prevent="handleEdit">
              <div class="form-group">
                <label :for="`edit-name-${round.id}`">Fixronde nummer:</label>
                <input :id="`edit-name-${round.id}`" v-model="form.name" type="text" required />
              </div>
              <div class="form-group">
                <label :for="`edit-status-${round.id}`">Status:</label>
                <select :id="`edit-status-${round.id}`" v-model="editStatus">
                  <option value="" disabled>Kies een status</option>
                  <option value="ACTIEF">Actief</option>
                  <option value="NIET_ACTIEF">Niet actief</option>
                </select>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label :for="`edit-start-${round.id}`">Begin datum:</label>
                  <input :id="`edit-start-${round.id}`" v-model="form.startDate" type="date" />
                </div>
                <div class="form-group">
                  <label :for="`edit-end-${round.id}`">Eind datum:</label>
                  <input :id="`edit-end-${round.id}`" v-model="form.endDate" type="date" />
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn--secondary" @click="cancelForm">Annuleren</button>
                <button type="submit" class="btn btn--primary" :disabled="fixRoundsStore.isLoading">
                  {{ fixRoundsStore.isLoading ? 'Opslaan...' : 'Opslaan' }}
                </button>
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
  text-align: center;
}

.header-section h1 {
  font-size: 1.75rem;
  color: white;
  margin: 0;
}

.main-section {
  margin-top: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1 1 auto;
  min-width: 0;
}

.search-field__label {
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
}

.search-field__input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
}

.search-field__input-wrap input {
  padding: 1rem 2.25rem 1rem 0.9rem;
  border: none;
  border-radius: 6px;
  background: #f3f4f6;
  font-size: 0.9rem;
  width: 100%;
}

.search-field__input-wrap input:focus {
  outline: 2px solid var(--color-primary-medium, #f9a489);
}

.search-icon {
  position: absolute;
  right: 0.65rem;
  width: 16px;
  height: 16px;
  pointer-events: none;
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
  padding-right: 2rem;
  max-width: 850px;
  height: auto;
  display: block;
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

.round-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
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
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-primary);
  font-size: 1.05rem;
}

.badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.2rem 0.8rem;
  border-radius: 9999px;
  display: inline-block;
  white-space: nowrap;
}

.badge--active {
  background: var(--color-primary);
  color: white;
  border: 1px solid var(--color-primary, #f15a22);
}

.round-description {
  font-size: 0.9rem;
  color: var(--color-primary);
  margin: 0.25rem 0 0 0;
}

.round-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 0.2rem;
}

.round-meta__dates,
.round-meta__count {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
}

.round-meta__icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
  flex-shrink: 0;
}

.round-meta__icon--clock {
  color: var(--color-primary, #f15a22);
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
  color: var(--color-primary);
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
  color: var(--color-primary);
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

.form-group select {
  padding: 0.6rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  color: var(--color-primary, #f15a22);
  background: white;
}

.form-group select:focus {
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
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.required {
  color: #dc2626;
}

.btn,
.btn-add {
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-add {
  padding: 1rem 1.2rem;
  font-weight: 600;
  background: var(--color-primary-medium);
  color: var(--color-primary);
  border: none;
}

.btn-add:hover:not(:disabled) {
  opacity: 0.9;
  color: var(--color-primary, #f15a22);
}

.btn {
  box-sizing: border-box;
  padding: 0.65rem 1.4rem;
  border: 2px solid transparent;
  line-height: 1.2;
}

.btn:disabled,
.btn-add:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--color-secondary, #6FBE44);
  color: white;
  font-weight: 600;
}

.btn--primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn--secondary {
  background: var(--color-primary-light);
  color: var(--color-primary, #f15a22);
  border-color: var(--color-primary, #f15a22);
  font-weight: 600;
}

.btn--secondary:hover:not(:disabled) {
  background: var(--color-primary, #f15a22);
  color: white;
}

.btn--ghost {
  background: white;
  color: var(--color-primary, #f15a22);
  border-color: var(--color-primary, #f15a22);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.btn--ghost:hover:not(:disabled) {
  background: var(--color-primary-light, #FDEEE8);
}

.btn__icon {
  width: 13px;
  height: 13px;
  object-fit: contain;
}

.btn--sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
  border-radius: 9999px;
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
  max-width: 900px;
  height: auto;
  display: block;
}
</style>