<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Sidebar from '@/components/nav/Sidebar.vue'
import PaginationControls from '@/components/pagination/PaginationControls.vue'
import { useMaterialsStore } from '@/stores/materials'
import type { MaterialRequest } from '@/types'
import 'primeicons/primeicons.css'
import UserNavBar from '@/components/nav/UserNavBar.vue'

const materialsStore = useMaterialsStore()

const formMode = ref<'create' | 'edit' | null>(null)
const editingId = ref<number | null>(null)
const isSubmitting = ref(false)
const errorMessage = ref('')

const name = ref('')
const description = ref('')
const priceEuros = ref<number | null>(null)
const estimatedGasSavingM3 = ref<number | null>(null)
const estimatedElectricitySavingKwh = ref<number | null>(null)
const category = ref('INSULATION')
const unit = ref('PIECE')

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'INSULATION', label: 'Isolatie' },
  { value: 'LIGHTING', label: 'Verlichting' },
  { value: 'WATER', label: 'Water' },
  { value: 'VENTILATION', label: 'Ventilatie' },
  { value: 'OTHER', label: 'Overig' },
]

const UNITS: { value: string; label: string }[] = [
  { value: 'PIECE', label: 'Stuk' },
  { value: 'METER', label: 'Meter' },
  { value: 'SQUARE_METER', label: 'Vierkante Meter' },
  { value: 'ROLL', label: 'Rol' },
]

onMounted(async () => {
  await materialsStore.ensureLoaded()
})

function openCreate() {
  editingId.value = null
  name.value = ''
  description.value = ''
  priceEuros.value = null
  estimatedGasSavingM3.value = null
  estimatedElectricitySavingKwh.value = null
  category.value = 'INSULATION'
  unit.value = 'PIECE'
  errorMessage.value = ''
  formMode.value = 'create'
}

function openEdit(id: number) {
  const mat = materialsStore.materials.find((m) => m.id === id)
  if (!mat) return
  editingId.value = id
  name.value = mat.name
  description.value = mat.description ?? ''
  priceEuros.value = mat.priceEuros
  estimatedGasSavingM3.value = mat.estimatedGasSavingM3 ?? null
  estimatedElectricitySavingKwh.value = mat.estimatedElectricitySavingKwh ?? null
  category.value = mat.category
  unit.value = mat.unit
  errorMessage.value = ''
  formMode.value = 'edit'
}

function cancelForm() {
  formMode.value = null
  errorMessage.value = ''
}

async function handleSubmit() {
  if (!priceEuros.value) return
  errorMessage.value = ''
  isSubmitting.value = true
  try {
    const body: MaterialRequest = {
      name: name.value,
      description: description.value || null,
      priceEuros: priceEuros.value,
      estimatedGasSavingM3: estimatedGasSavingM3.value,
      estimatedElectricitySavingKwh: estimatedElectricitySavingKwh.value,
      category: category.value,
      unit: unit.value
    }
    if (formMode.value === 'create') {
      await materialsStore.createMaterial(body)
    } else if (formMode.value === 'edit' && editingId.value !== null) {
      await materialsStore.updateMaterial(editingId.value, body)
    }
    formMode.value = null
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan'
  } finally {
    isSubmitting.value = false
  }
}

const searchQuery = ref('')

const filteredMaterials = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return materialsStore.materials
  return materialsStore.materials.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      formatCategory(m.category).toLowerCase().includes(q),
  )
})

const PAGE_SIZE = 13                            
const currentPage = ref(1)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredMaterials.value.length / PAGE_SIZE)),
)

const paginatedMaterials = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredMaterials.value.slice(start, start + PAGE_SIZE)
})

watch(searchQuery, () => {
  currentPage.value = 1
})

function formatCategory(cat: string) {
  return CATEGORIES.find((c) => c.value === cat)?.label ?? cat
}

function formatUnit(unit: string){
  return UNITS.find((u) => u.value === unit)?.label ?? unit
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}
</script>

<template>
  <UserNavBar></UserNavBar>
  <div class="page-wrapper">
    <div class="page">

    <main class="content">
      <div class="welcome">
        <h1>Materiaal Beheer</h1>
      </div>

    <div class="divider-container">
      <img src="../../assets/douchekop.png" alt="douchekop divider" class="douchekop-img" />
    </div>
      <div v-if="materialsStore.error" class="error">{{ materialsStore.error }}</div>

      <div v-if="formMode" class="card form-card">
        <h2>{{ formMode === 'create' ? 'Nieuw materiaal' : 'Materiaal bewerken' }}</h2>

        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="name">Naam</label>
            <input id="name" v-model="name" type="text" required placeholder="bijv. LED lamp" />
          </div>

          <div class="form-group">
            <label for="description">Omschrijving <span class="optional">(optioneel)</span></label>
            <input id="description" v-model="description" type="text" placeholder="Korte omschrijving van het materiaal" />
          </div>

          <div class="form-group">
            <label for="category">Categorie</label>
            <select id="category" v-model="category">
              <option v-for="cat in CATEGORIES" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="unit">Eenheid</label>
            <select id="unit" v-model="unit">
              <option v-for="u in UNITS" :key="u.value" :value="u.value">
                {{ u.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="price">Prijs (€)</label>
            <input id="price" v-model.number="priceEuros" type="number" min="0" step="0.01" required placeholder="0.00" />
          </div>

          <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="cancelForm" :disabled="isSubmitting">
              Annuleren
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Opslaan...' : 'Opslaan' }}
            </button>
          </div>
        </form>
      </div>

      <div class="toolbar">
        <div>Zoeken naar materialen:</div>
        <div class="search-bar">
          <input v-model="searchQuery" type="text" placeholder="Materiaal zoeken" />
          <i class="pi pi-search"></i>
        </div>
        <button class="btn-new" @click="openCreate">Nieuwe materiaal</button>
      </div>

      <div class="card table-card">
        <div v-if="!materialsStore.isLoaded" class="state-message-card">Data inladen...</div>
        <div v-else-if="filteredMaterials.length === 0" class="state-message-card">
          Geen materialen gevonden.
        </div>
        <div v-else class="table-wrapper">
          <table>
            <thead>
            <tr>
              <th>Productnaam</th>
              <th>Type</th>
              <th class="text-right">Prijs</th>
              <th>Eenheid</th>
              <th class="text-right">Bewerken</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="mat in paginatedMaterials" :key="mat.id">
              <td class="font-medium">{{ mat.name }}</td>
              <td class="subtext">{{ formatCategory(mat.category) }}</td>
              <td class="text-right font-medium text-primary">{{ formatCurrency(mat.priceEuros) }}</td>
              <td class="subtext">{{ formatUnit(mat.unit) }}</td>
              <td class="text-right">
                <button class="btn-edit" @click="openEdit(mat.id)">
                  <i class="pi pi-pencil"></i>
                </button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="pagination-wrapper">
        <PaginationControls v-if="filteredMaterials.length > 0" v-model="currentPage" :total-pages="totalPages" />
      </div>
    </main>
    </div>
  </div>
</template>

<style scoped>

.page-wrapper {
  background-color: var(--color-primary);
  min-height: 100vh;
}

.page {
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
}

.content {
  max-width: 1000px;
  width: 100%;
  margin: 2rem auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: var(--color-primary-light, #FDEEE8);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f3f4f6;
  padding: 1.5rem;
  transition: box-shadow 0.15s, transform 0.15s;
}

.card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.form-card h2 {
  font-size: 1.1rem;
  color: #1a1a2e;
  margin-top: 0;
  margin-bottom: 1.25rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}

.optional {
  font-weight: 400;
  color: #9ca3af;
}

input, select {
  padding: 0.6rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  outline: none;
  background: white;
  color: #1a1a2e;
  transition: border-color 0.15s;
}

input:focus, select:focus {
  outline: none;
  border-color: var(--color-primary, #f15a22);
  box-shadow: 0 0 0 2px rgba(241, 90, 34, 0.2);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.toolbar {
  display: flex;
  gap: 1rem;
  align-items: center;
  color: white;
}

.search-bar {
  flex: 1;
  /* max-width: 400px; */
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: white;
  border-radius: 1rem;
  padding: 1rem 2rem;
  color: var(--color-text-muted, #374151);
}

.search-bar input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0;
}

.search-bar input:focus {
  outline: none;
  box-shadow: none;
}

.btn-new {
  padding: 1rem 2rem;
  background: var(--color-button-bg);
  color: var(--color-primary);
  border: none;
  border-radius: 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-new:hover {
  background: var(--color-button-hover);
}

.table-card {
  padding: 0;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.pagination-wrapper {
  margin-top: auto;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th {
  background-color: rgba(255, 255, 255, 0.4);
  color: #374151;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 0.85rem 1.5rem;
  border-bottom: 1px solid #d1d5db;
}

td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
  font-size: 0.95rem;
  vertical-align: middle;
}

tr:last-child td {
  border-bottom: none;
}

tr:nth-child(even) td {
  background-color: rgba(0, 0, 0, 0.02);
}

tr:hover td {
  background-color: rgba(255, 255, 255, 0.3);
}

.font-medium {
  font-weight: 500;
}

.text-right {
  text-align: right;
}

th.text-right:not(:last-child),
td.text-right:not(:last-child) {
  padding-right: 3rem;
}

.subtext {
  color: #4b5563;
  font-size: 0.9rem;
}

.text-primary {
  color: var(--color-primary, #f15a22);
}

.state-message {
  color: white;
  text-align: center;
  padding: 2rem;
  font-size: 1rem;
}

.state-message-card {
  color: #4b5563;
  text-align: center;
  padding: 3rem;
  font-size: 1rem;
}

.error {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn {
  padding: 0.5rem 1.2rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-primary, #f15a22);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #d14917;
}

.btn-secondary {
  background-color: white;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.btn-edit {
  padding: 0.475rem 0.875rem;
  background: white;
  color: var(--color-primary, #f15a22);
  border: 1px solid var(--color-primary, #f15a22);
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-edit:hover {
  background: var(--color-primary-light, #FDEEE8);
}

.welcome h1{
  font-size: 1.5rem;
  color: white;
  margin-bottom: 0.25rem;
}

.douchekop-img {
  width: 100%;
  max-width: 900px;
  height: auto;
  display: block;
}
</style>