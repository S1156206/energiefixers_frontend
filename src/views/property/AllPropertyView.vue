<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import PaginationControls from '@/components/pagination/PaginationControls.vue'
import { TenantStatus } from '@/types/enums'
import { useFixRoundsStore } from '@/stores/fixRounds'
import { usePropertiesStore } from '@/stores/properties'
import addIcon from '@/assets/icons/add_icon.png'
import searchIcon from '@/assets/icons/search_icon.png'

const PAGE_SIZE = 24

const router = useRouter()
const fixRoundsStore = useFixRoundsStore()
const propertiesStore = usePropertiesStore()

const selectedRoundId = ref<number | null>(null)
const searchQuery = ref('')
const currentPage = ref(1)

const properties = computed(() => propertiesStore.getForRound(selectedRoundId.value))

const filteredProperties = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return properties.value
  return properties.value.filter((property) => {
    const address = `${property.street} ${property.houseNumber}${property.houseNumberSuffix ?? ''} ${property.postcode} ${property.city}`.toLowerCase()
    return address.includes(query)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredProperties.value.length / PAGE_SIZE)))

const paginatedProperties = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredProperties.value.slice(start, start + PAGE_SIZE)
})

watch([searchQuery, selectedRoundId], () => {
  currentPage.value = 1
})

onMounted(async () => {
  await Promise.all([
    fixRoundsStore.ensureLoaded(),
    propertiesStore.ensureLoaded(),
  ])
  selectedRoundId.value = fixRoundsStore.currentRound?.id ?? null
})

function addProperty() {
  router.push('/properties/new')
}

function goToPropertyDetail(id: number) {
  router.push('/property/' + id)
}

function tenantStatusInfo(status: TenantStatus): { label: string; modifier: string } {
  switch (status) {
    case TenantStatus.NOT_INVITED:   return { label: 'Geen uitnodiging', modifier: 'not-invited' }
    case TenantStatus.INVITE_EXPIRED: return { label: 'Verlopen',        modifier: 'invite-expired' }
    case TenantStatus.INVITED:        return { label: 'Uitgenodigd',      modifier: 'invited' }
    case TenantStatus.REGISTERED:     return { label: 'Geregistreerd',    modifier: 'registered' }
    case TenantStatus.LINK_SENT:      return { label: 'Link verstuurd',   modifier: 'link-sent' }
    case TenantStatus.DATA_PRESENT:   return { label: 'Data aanwezig',    modifier: 'data-present' }
  }
}
</script>

<template>
  <div class="page">
    <UserNavBar />

    <div class="content-container header-section">
      <h1>Overzicht Woningen</h1>
      <div class="divider-container">
      <img src="../../assets/stekker_wit.png" alt="douchekop divider" class="douchekop-img" />
    </div>
    </div>

    <main class="content-container main-section">
      <div v-if="fixRoundsStore.error" class="error">{{ fixRoundsStore.error }}</div>

      <div class="toolbar">
        <label class="search-field">
          <span class="search-field__label">Zoeken naar adressen:</span>
          <span class="search-field__input-wrap">
            <input v-model="searchQuery" type="text" placeholder="Adres zoeken" />
            <img :src="searchIcon" alt="" class="search-icon" />
          </span>
        </label>

        <button class="add-btn" @click="addProperty">
          <img :src="addIcon" alt="" class="add-btn__icon" />
          Toevoegen
        </button>
      </div>

      <div v-if="fixRoundsStore.isLoaded" class="round-filter">
        <span class="round-filter__label">Fixronde:</span>
        <div class="round-filter__select-wrap">
          <select v-model="selectedRoundId" class="round-filter__select">
            <option :value="null">Alle</option>
            <option v-for="round in fixRoundsStore.rounds" :key="round.id" :value="round.id">
              {{ round.name }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="propertiesStore.isLoading" class="state-message">Gegevens laden...</div>

      <div v-else-if="propertiesStore.error" class="error">{{ propertiesStore.error }}</div>

      <div v-else-if="filteredProperties.length === 0" class="state-message">
        Geen woningen gevonden.
      </div>

      <template v-else>
        <div class="property-table">
          <div class="property-table__header">
            <span>Straatnaam &amp; Huisnummer</span>
            <span>Postcode</span>
            <span>Status</span>
          </div>
          <div
            v-for="property in paginatedProperties"
            :key="property.id"
            class="property-table__row"
            @click="goToPropertyDetail(property.id)"
          >
            <span class="address">
              {{ property.street }} {{ property.houseNumber }}{{ property.houseNumberSuffix ?? '' }}
            </span>
            <span class="postcode">{{ property.postcode }}</span>
            <span
              :class="['status-badge', `status-badge--${tenantStatusInfo(property.tenantStatus).modifier}`]"
            >
              {{ tenantStatusInfo(property.tenantStatus).label }}
            </span>
          </div>
        </div>

        <PaginationControls
          v-if="totalPages > 1"
          v-model="currentPage"
          :total-pages="totalPages"
        />
      </template>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f15a22;
}

.content-container {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
}

.header-section {
  margin-top: 2rem;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.header-section h1 {
  font-size: 1.5rem;
  color: white;
  margin: 0 0 0.5rem;
}

.main-section {
  margin-top: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
  padding: 0.55rem 2.25rem 0.55rem 0.9rem;
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
  color: #6b7280;
  pointer-events: none;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: var(--color-primary-light, #FDEEE8);
  color: var(--color-primary);
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}

.add-btn:hover {
  opacity: 0.9;
  color: #f15a22;
}

.add-btn__icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.round-filter {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--color-primary-medium);
  padding: 0.8rem;
  border-radius: 0.8rem;
  width: fit-content;
}

.round-filter__label {
  color: var(--color-primary);
  font-size: 0.95rem;
  font-weight: 500;
}

.round-filter__select-wrap {
  display: inline-flex;
}

.round-filter__select {
  padding: 0.35rem 1.75rem 0.35rem 0.9rem;
  border: 1px solid var(--color-primary-light);
  border-radius: 9999px;
  background: transparent;
  color: var(--color-primary);;
  font-size: 0.85rem;
  cursor: pointer;
  appearance: none;
  background-color: var(--color-primary-light);
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'><path d='M0 0 L5 6 L10 0' fill='%23f15a22'/></svg>");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 10px 6px;
}

.round-filter__select option {
  color: #1f2937;
}

.property-table {
  background: var(--color-primary-medium);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.property-table__header {
  display: grid;
  grid-template-columns: 1fr 140px 160px;
  padding: 0.9rem 1.5rem;
  background:  var(--color-primary-medium);
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}

.property-table__row {
  display: grid;
  grid-template-columns: 1fr 140px 160px;
  align-items: center;
  padding: 0.85rem 1.5rem;
  border-top: 1px solid #c4c4c4;
  cursor: pointer;
  transition: background-color 0.15s;
}

.property-table__row:hover {
  background-color: #fdf3ef;
}

.address {
  font-size: 0.95rem;
  color: #1f2937;
}

.postcode {
  font-size: 0.9rem;
  color: #4b5563;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  display: inline-block;
  white-space: nowrap;
  width: fit-content;
}

.status-badge--not-invited   { background: #f3f4f6; color: #6b7280; }
.status-badge--invite-expired { background: #fee2e2; color: #dc2626; }
.status-badge--invited        { background: #fffbeb; color: #b45309; }
.status-badge--registered     { background: #eff6ff; color: #2563eb; }
.status-badge--link-sent      { background: #fffbeb; color: #d97706; }
.status-badge--data-present   { background: #f0fdf4; color: #16a34a; }

.state-message {
  color: white;
  text-align: center;
  padding: 2rem;
}

.error {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
}

.divider-container {
  width: 100%;
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
