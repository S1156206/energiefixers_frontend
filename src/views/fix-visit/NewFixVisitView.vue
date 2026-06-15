<script setup lang="ts">
import { apiRequest } from '@/services/api'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import { Category } from '@/types/enums'
import type { Material, InstalledMaterial, FixVisitRequest } from '@/types'
import { useMaterialsStore } from '@/stores/materials'

const router = useRouter() 
const route = useRoute();
const materialsStore = useMaterialsStore();

const isLoading = ref(true)
const errorMessage = ref('')

const notes = ref('')
const totalMaterialCost = ref(0)
const visitDate = ref(new Date().toISOString().split('T')[0] ?? '')
const installedMaterials = ref<InstalledMaterial[]>([])

onMounted(async () => {
  await materialsStore.ensureLoaded()
})

function calculateMaterialCosts() {
    let totalCosts = 0 

    for (const installed of installedMaterials.value) {
        const materialDetails = materialsStore.materials.find(m => m.id === installed.materialId)
        
        if (materialDetails) {
            totalCosts += materialDetails.priceEuros * installed.quantity
        }
    }
    totalMaterialCost.value = totalCosts
}

async function handleSubmit() {
  errorMessage.value = ''
  isLoading.value = true
  
  calculateMaterialCosts() 

  try {
    const body: FixVisitRequest = {
      visitDate: visitDate.value,
      notes: notes.value,
      totalMaterialCost: totalMaterialCost.value,
      installedMaterials: installedMaterials.value
    }
    await apiRequest('POST', `/api/properties/${route.params.id}/fix-visits`, body)
    router.push(`/property/${route.params.id}`)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan'
  } finally {
    isLoading.value = false
  }
}

function addInstalledMaterial(material: Material) {
    const existingMaterial = installedMaterials.value.find(m => m.materialId === material.id)

    if (existingMaterial) {
        existingMaterial.quantity += 1
    } else {
        installedMaterials.value.push({
            materialId: material.id,
            materialName: material.name,
            quantity: 1
        })
    }
    calculateMaterialCosts()
}

function addExistingMaterial(material: InstalledMaterial) {
    const existingMaterial = installedMaterials.value.find(m => m.materialId === material.materialId)
    if (existingMaterial) {
        existingMaterial.quantity += 1
    }
    calculateMaterialCosts()
}

function removeInstalledMaterial(material: InstalledMaterial) {
    const idx = installedMaterials.value.findIndex(m => m.materialId === material.materialId)
    if (idx === -1) return
    const entry = installedMaterials.value[idx]!
    if (entry.quantity > 1) {
        entry.quantity -= 1
    } else {
        installedMaterials.value.splice(idx, 1)
    }
    calculateMaterialCosts()
}

function categoryLabel(category: Category | string): string {
    const key = typeof category === 'string' ? category.toUpperCase() : Category[category]
    const map: Record<string, string> = {
        INSULATION: 'Isolatie',
        LIGHTING: 'Verlichting',
        WATER: 'Water',
        VENTILATION: 'Ventilatie',
        OTHER: 'Overig',
    }
    return map[key] ?? category.toString()
}
</script>

<template>
  <div class="page">
    <UserNavBar />

    <main class="content">
      <div class="card">
        <h1>Nieuw reparatiebezoek</h1>

        <div v-if="isLoading" class="state-message">Laden...</div>

        <form v-else @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="visitDate">Datum bezoek</label>
            <input id="visitDate" v-model="visitDate" type="date" required />
          </div>

          <div class="form-group">
            <label for="notes">Notities <span class="optional">(optioneel)</span></label>
            <textarea
              id="notes"
              v-model="notes"
              rows="3"
              placeholder="Bijv. werkzaamheden, bijzonderheden..."
            ></textarea>
          </div>

          <div class="form-section">
            <h2 class="section-title">Beschikbare materialen</h2>

            <div v-if="materialsStore.materials.length === 0" class="state-message state-message--small">
              Geen materialen beschikbaar.
            </div>

            <div v-for="material in materialsStore.materials" :key="material.id" class="material-row">
              <div class="material-info">
                <span class="material-name">{{ material.name }}</span>
                <span :class="['category-badge', `category-badge--${material.category.toString().toLowerCase()}`]">
                  {{ categoryLabel(material.category) }}
                </span>
              </div>
              <div class="material-actions">
                <button type="button" class="btn-add" @click="addInstalledMaterial(material)">
                  Toevoegen +
                </button>
              </div>
            </div>
          </div>

          <div v-if="installedMaterials.length > 0" class="form-section">
            <h2 class="section-title">Geselecteerde materialen</h2>

            <div v-for="item in installedMaterials" :key="item.materialId" class="selected-row">
              <span class="selected-name">{{ item.materialName }}</span>
              <div class="qty-controls">
                <button type="button" class="qty-btn" @click="removeInstalledMaterial(item)">−</button>
                <span class="qty-value">{{ item.quantity }}</span>
                <button type="button" class="qty-btn" @click="addExistingMaterial(item)">+</button>
              </div>
            </div>

          </div>

          <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

          <button type="submit" :disabled="isLoading">
            {{ isLoading ? 'Opslaan...' : 'Bezoek opslaan' }}
          </button>
        </form>
      </div>
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
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
}

.card h1 {
  font-size: 1.25rem;
  color: #1a1a2e;
  margin-bottom: 1.5rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.optional {
  font-weight: 400;
  color: #9ca3af;
}

input,
select,
textarea {
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.15s;
  background: white;
  color: #111827;
  font-family: inherit;
}

textarea {
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #3b82f6;
}

.error {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  font-size: 0.875rem;
}

.state-message {
  color: #6b7280;
  text-align: center;
  padding: 2rem;
}

.state-message--small {
  padding: 0.75rem;
  text-align: left;
  font-size: 0.875rem;
}

button[type='submit'] {
  padding: 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 0.5rem;
}

button[type='submit']:hover:not(:disabled) {
  background: #2563eb;
}

button[type='submit']:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 1px solid #f3f4f6;
  padding-top: 1rem;
  margin-top: 0.5rem;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.25rem;
}

.material-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
}

.material-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.material-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a1a2e;
}

.material-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.category-badge {
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  display: inline-block;
}

.category-badge--0,
.category-badge--insulation {
  background: #fef9c3;
  color: #a16207;
}

.category-badge--1,
.category-badge--lighting {
  background: #fef3c7;
  color: #d97706;
}

.category-badge--2,
.category-badge--water {
  background: #eff6ff;
  color: #3b82f6;
}

.category-badge--3,
.category-badge--ventilation {
  background: #f0fdf4;
  color: #16a34a;
}

.category-badge--4,
.category-badge--other {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-add {
  padding: 0.35rem 0.7rem;
  background: #eff6ff;
  color: #3b82f6;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.btn-add:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}

.selected-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
}

.selected-name {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.qty-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.qty-btn {
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.1s;
  color: #374151;
}

.qty-btn:hover {
  background: #f3f4f6;
}

.qty-value {
  min-width: 1.25rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
}

.total-cost {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  padding: 0.6rem 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.total-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.total-value {
  font-size: 1rem;
  font-weight: 700;
  color: #3b82f6;
}
</style>