<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import Sidebar from '@/components/nav/Sidebar.vue'
import PaginationControls from '@/components/pagination/PaginationControls.vue'
import { usePropertiesStore } from '@/stores/properties'
import 'primeicons/primeicons.css'

const router = useRouter()
const propertiesStore = usePropertiesStore()

onMounted(async () => {
  await propertiesStore.ensureLoaded()
})

function addProperty() {
  router.push('/properties/new')
}

function goToPropertyDetail(id: number) {
  router.push('/property/' + id)
}

function formatAddress(property: { street: string; houseNumber: string; houseNumberSuffix: string | null; postcode: string; city: string }) {
  const suffix = property.houseNumberSuffix ? `-${property.houseNumberSuffix}` : ''
  return `${property.street} ${property.houseNumber}${suffix}, ${property.postcode} ${property.city}`
}

const searchQuery = ref('')

const filteredProperties = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return propertiesStore.getForRound(null)
  return propertiesStore.getForRound(null).filter((p) => formatAddress(p).toLowerCase().includes(q))
})

const PAGE_SIZE = 20
const currentPage = ref(1)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredProperties.value.length / PAGE_SIZE)),
)

const paginatedProperties = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredProperties.value.slice(start, start + PAGE_SIZE)
})

watch(searchQuery, () => {
  currentPage.value = 1
})
</script>

<template>
  <UserNavBar></UserNavBar>
  <div class="page-wrapper">
    <div class="page">
      <Sidebar active-key="fixronden" />

      <main class="content">
        <div v-if="propertiesStore.error" class="error">{{ propertiesStore.error }}</div>

        <div class="toolbar">
          <div>Zoeken naar adres: </div>
          <div class="search-bar">
            <input v-model="searchQuery" type="text" placeholder="Adres zoeken" />
            <i class="pi pi-search"></i>
          </div>
          <!-- <button class="btn-new" @click="addProperty">Nieuwe woning toevoegen</button> -->
        </div>

        <div class="card table-card">
          <div v-if="!propertiesStore.isLoaded" class="state-message-card">Data inladen...</div>
          <div v-else-if="filteredProperties.length === 0" class="state-message-card">
            Geen woningen gevonden.
          </div>
          <div v-else class="table-wrapper">
            <table>
              <tbody>
                <tr
                  v-for="property in paginatedProperties"
                  :key="property.id"
                  @click="goToPropertyDetail(property.id)"
                >
                  <td class="font-medium">{{ formatAddress(property) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="pagination-wrapper">
          <PaginationControls v-if="filteredProperties.length > 0" v-model="currentPage" :total-pages="totalPages" />
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
  max-height: 80vh;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
}

.content {
  flex: 1;
  width: 100%;
  padding: 2rem;
  box-sizing: border-box;
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

.toolbar {
  display: flex;
  gap: 1rem;
  align-items: center;
  color: white;
  margin-right: 10rem;
}

.search-bar {
  flex: 1;
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
  white-space: nowrap;
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

tr {
  cursor: pointer;
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
</style>
