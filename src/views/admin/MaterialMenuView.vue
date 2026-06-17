<script setup lang="ts">
import { useRouter } from 'vue-router'
import UserNavBar from '@/components/nav/UserNavBar.vue'

const router = useRouter()
</script>

<template>
  <div class="page">
    <UserNavBar />

    <main class="content">
      <div class="list-header">
        <h1>Materialen</h1>
      </div>

      <div class="nav-grid">
        <button class="nav-card" @click="router.push('/materials/manage')">
          <div class="card-column">
            <span class="nav-card__title">Materialen Beheren</span>
            <span class="nav-card__desc">Voeg nieuwe materialen toe of bewerk deze.</span>
          </div>
          <i class="pi pi-box card-icon"></i>
        </button>

        <button class="nav-card" @click="router.push('/materials/overview')">
          <div class="card-column">
            <span class="nav-card__title">Materialen Overzicht</span>
            <span class="nav-card__desc">Bekijk het overzicht van de totaal geplaatste materialen en de kosten hiervan.</span>
          </div>
          <i class="pi pi-chart-bar card-icon"></i>
        </button>
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

.content {
  max-width: 760px;
  width: 100%;
  margin: 2rem auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.nav-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.nav-card {
  background: var(--color-primary-light, #FDEEE8);
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  padding: 1.5rem;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  transition: box-shadow 0.15s, transform 0.15s;
}

.nav-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.25rem;
}

.nav-card__title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.nav-card__desc {
  font-size: 0.9rem;
  color: #4b5563;
}

.card-icon {
  font-size: 1.5rem;
  color: var(--color-primary, #f15a22);
  opacity: 0.8;
}
</style>