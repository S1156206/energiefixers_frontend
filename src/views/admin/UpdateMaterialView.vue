<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import { useMaterialsStore } from '@/stores/materials'
import type { MaterialRequest } from '@/types'
import 'primeicons/primeicons.css'


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

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'INSULATION', label: 'Isolatie' },
  { value: 'LIGHTING', label: 'Verlichting' },
  { value: 'WATER', label: 'Water' },
  { value: 'VENTILATION', label: 'Ventilatie' },
  { value: 'OTHER', label: 'Overig' },
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

function formatCategory(cat: string) {
  return CATEGORIES.find((c) => c.value === cat)?.label ?? cat
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}
</script>

<template>
  <div class="page">
    <UserNavBar />

    <main class="content">
      <div class="list-header">
        <h1>Materialen beheren</h1>
        <button class="btn-primary" @click="openCreate">+ Nieuw materiaal</button>
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
            <label for="price">Prijs (€)</label>
            <input id="price" v-model.number="priceEuros" type="number" min="0" step="0.01" required placeholder="0.00" />
          </div>

          <!-- <div class="form-row">
            <div class="form-group">
              <label for="gasSaving">Gasbesparing m³ <span class="optional">(optioneel)</span></label>
              <input id="gasSaving" v-model.number="estimatedGasSavingM3" type="number" min="0" step="0.01" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label for="elecSaving">Elektriciteitsbesparing kWh <span class="optional">(optioneel)</span></label>
              <input id="elecSaving" v-model.number="estimatedElectricitySavingKwh" type="number" min="0" step="0.01" placeholder="0.00" />
            </div>
          </div> -->

          <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="cancelForm" :disabled="isSubmitting">
              Annuleren
            </button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Opslaan...' : 'Opslaan' }}
            </button>
          </div>
        </form>
      </div>

      <div class="card table-card">
        <div class="search-bar">
          <input v-model="searchQuery" type="search" placeholder="Zoeken op naam of categorie..." />
        </div>
        <div v-if="!materialsStore.isLoaded" class="state-message">Data inladen...</div>
        <div v-else-if="filteredMaterials.length === 0" class="state-message">
          Geen materialen gevonden.
        </div>
        <div v-else class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Naam</th>
                <th>Categorie</th>
                <th class="text-right">Prijs</th>
                <!-- <th class="text-right">Gasbesparing</th>
                <th class="text-right">Elektriciteitsbesparing</th> -->
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mat in filteredMaterials" :key="mat.id">
                <td class="font-medium">{{ mat.name }}</td>
                <td class="subtext">{{ formatCategory(mat.category) }}</td>
                <td class="text-right">{{ formatCurrency(mat.priceEuros) }}</td>
                <!-- <td class="text-right subtext">
                  {{ mat.estimatedGasSavingM3 != null ? mat.estimatedGasSavingM3 + ' m³' : '—' }}
                </td>
                <td class="text-right subtext">
                  {{ mat.estimatedElectricitySavingKwh != null ? mat.estimatedElectricitySavingKwh + ' kWh' : '—' }}
                </td> -->
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
    </main>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; display: flex; flex-direction: column; }
.content { max-width: 1000px; width: 100%; margin: 2rem auto; padding: 0 1rem; display: flex; flex-direction: column; gap: 1.5rem; }

.list-header { display: flex; justify-content: space-between; align-items: center; }
.list-header h1 { font-size: 1.25rem; color: #1a1a2e; }

.card { background: white; border-radius: 8px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); padding: 1.5rem; }

.form-card h2 { font-size: 1.1rem; color: #1a1a2e; margin-bottom: 1.25rem; }

form { display: flex; flex-direction: column; gap: 1rem; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

.form-group { display: flex; flex-direction: column; gap: 0.25rem; }

label { font-size: 0.875rem; font-weight: 500; color: #374151; }

.optional { font-weight: 400; color: #9ca3af; }

input, select {
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  background: white;
  color: #111827;
  transition: border-color 0.15s;
}
input:focus, select:focus { border-color: #3b82f6; }

.form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 0.5rem; }

.btn-primary {
  padding: 0.625rem 1.25rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-primary:hover:not(:disabled) { background: #2563eb; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary {
  padding: 0.625rem 1.25rem;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.btn-secondary:hover:not(:disabled) { background: #f9fafb; border-color: #9ca3af; }
.btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-edit {
  padding: 0.475rem 0.875rem;
  background: white;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-edit:hover { background: #eff6ff; }

.search-bar { padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb; }
.search-bar input { width: 100%; max-width: 360px; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; outline: none; }
.search-bar input:focus { border-color: #3b82f6; }

.table-card { padding: 0; overflow: hidden; }
.table-wrapper { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; text-align: left; }
th { background-color: #f9fafb; color: #6b7280; font-size: 0.75rem; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; padding: 0.75rem 1.5rem; border-bottom: 1px solid #e5e7eb; }
td { padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 0.9rem; vertical-align: middle; }
tr:last-child td { border-bottom: none; }
tr:hover { background-color: #f9fafb; }
.font-medium { font-weight: 500; }
.text-right { text-align: right; }
.subtext { color: #6b7280; font-size: 0.85rem; }
.state-message { color: #6b7280; text-align: center; padding: 2rem; }
.error { color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem; font-size: 0.875rem; }
</style>
