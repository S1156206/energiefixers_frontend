<script setup lang="ts">
import { apiRequest } from '@/services/api'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import { Category } from '@/types/enums'
import type { Material, InstalledMaterial, FixVisitRequest, Property } from '@/types'
import { useMaterialsStore } from '@/stores/materials'
import searchIcon from '@/assets/icons/search_icon.png'

const router = useRouter()
const route = useRoute();
const materialsStore = useMaterialsStore();

const visitId = route.params.visitId as string | undefined
const isEditMode = computed(() => !!visitId)

const isLoading = ref(true)
const errorMessage = ref('')

const notes = ref('')
const totalMaterialCost = ref(0)
const visitDate = ref(new Date().toISOString().split('T')[0] ?? '')
const installedMaterials = ref<InstalledMaterial[]>([])
const searchQuery = ref('')

const filteredMaterials = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return materialsStore.materials
  return materialsStore.materials.filter(m => m.name.toLowerCase().includes(query))
})

function addedQuantity(materialId: number): number {
  return installedMaterials.value.find(m => m.materialId === materialId)?.quantity ?? 0
}

onMounted(async () => {
  await materialsStore.ensureLoaded()

  if (isEditMode.value) {
    try {
      const property = await apiRequest<Property>('GET', `/api/properties/${route.params.id}`)
      const visit = property.fixVisits.find(v => v.id === Number(visitId))
      if (!visit) {
        errorMessage.value = 'Bezoek niet gevonden.'
      } else {
        visitDate.value = visit.visitDate.split('T')[0] ?? visit.visitDate
        notes.value = visit.notes
        totalMaterialCost.value = visit.totalMaterialCost
        installedMaterials.value = visit.installedMaterials.map(m => ({ ...m }))
      }
    } catch (err) {
      errorMessage.value = err instanceof Error ? err.message : 'Kan het bezoek niet inladen'
    }
  }

  isLoading.value = false;
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
    if (isEditMode.value) {
      await apiRequest('PUT', `/api/properties/${route.params.id}/fix-visits/${visitId}`, body)
    } else {
      await apiRequest('POST', `/api/properties/${route.params.id}/fix-visits`, body)
    }
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

function removeInstalledMaterial(material: Material) {
    const idx = installedMaterials.value.findIndex(m => m.materialId === material.id)
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

    <main class="content-container main-section">
      <div class="welcome">
        <h1>{{ isEditMode ? 'Fixbezoek bewerken' : 'Fixbezoek aanmaken' }}</h1>
      </div>

    <div class="divider-container">
      <img src="../../assets/douchekop.png" alt="douchekop divider" class="douchekop-img" />
    </div>

      <div v-if="isLoading" class="state-message">Laden...</div>

      <form v-else @submit.prevent="handleSubmit">
        <div class="card">
          <h2 class="section-title">Vul de informatie van de nieuwe fixbezoek in :</h2>

          <div class="form-group">
            <label for="visitDate">Datum:</label>
            <input id="visitDate" v-model="visitDate" type="date" required />
          </div>

          <div class="form-group">
            <label for="notes">Notities:</label>
            <textarea
              id="notes"
              v-model="notes"
              rows="3"
              placeholder="Bijv. werkzaamheden, bijzonderheden..."
            ></textarea>
          </div>
        </div>

        <div class="card">
          <h2 class="section-title">Gebruikte materialen:</h2>
          <p class="section-hint">Selecteer hieronder de materialen die tijdens het fixbezoek worden toegepast</p>

          <label class="search-field">
            <span class="search-field__input-wrap">
              <input v-model="searchQuery" type="text" placeholder="Materiaal zoeken" />
              <img :src="searchIcon" alt="" class="search-icon" />
            </span>
          </label>

          <div v-if="filteredMaterials.length === 0" class="state-message state-message--small">
            Geen materialen gevonden.
          </div>

          <div v-for="material in filteredMaterials" :key="material.id" class="material-row">
            <div class="material-info">
              <span class="material-name">{{ material.name }}</span>
              <span :class="['category-badge', `category-badge--${material.category.toString().toLowerCase()}`]">
                {{ categoryLabel(material.category) }}
              </span>
            </div>
            <div class="material-actions qty-controls">
              <button
                type="button"
                class="qty-btn"
                :disabled="addedQuantity(material.id) === 0"
                @click="removeInstalledMaterial(material)"
              >-</button>
              <span class="qty-value">{{ addedQuantity(material.id) }}</span>
              <button type="button" class="qty-btn" @click="addInstalledMaterial(material)">+</button>
            </div>
          </div>
        </div>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

        <button type="submit" class="btn-submit" :disabled="isLoading">
          {{ isLoading ? 'Opslaan...' : (isEditMode ? 'Wijzigingen opslaan' : 'Bezoek opslaan') }}
        </button>
      </form>
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

.divider-container {
  width: 100%;
  padding: 0 5%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-section {
  margin-top: 0;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: var(--color-primary-light, #FDEEE8);
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f3f4f6;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

form {
  display: flex;
  flex-direction: column;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 1rem;
}

label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-primary, #f15a22);
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
  color: white;
  text-align: center;
  padding: 2rem;
}

.state-message--small {
  padding: 0.75rem;
  text-align: left;
  font-size: 0.875rem;
  color: var(--color-primary, #f15a22);
}

.btn-submit {
  padding: 0.85rem;
  background: var(--color-secondary, #6FBE44);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  margin-top: 0.5rem;
}

.btn-submit:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-primary, #f15a22);
  margin: 0 0 0.25rem 0;
}

.section-hint {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
}

.search-field {
  display: block;
  margin-bottom: 1rem;
}

.search-field__input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-field__input-wrap input {
  padding: 0.7rem 2.25rem 0.7rem 0.9rem;
  border: none;
  border-radius: 6px;
  background: white;
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

.material-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.75rem;
  background: white;
  border-radius: 6px;
  margin-bottom: 0.5rem;
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
  flex-shrink: 0;
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

.qty-controls {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.qty-btn {
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary, #f15a22);
  border: none;
  border-radius: 9999px;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  transition: opacity 0.15s;
  color: white;
}

.qty-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qty-value {
  min-width: 1.25rem;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a2e;
}

.douchekop-img {
  width: 100%;
  max-width: 900px;
  height: auto;
  display: block;
}

.welcome h1 {
  font-size: 1.5rem;
  color: white;
  margin-bottom: 0.25rem;
  margin-top: 2rem;
}
</style>