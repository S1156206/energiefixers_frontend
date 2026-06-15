<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import UserNavBar from '@/components/nav/UserNavBar.vue'

const router = useRouter()
const authStore = useAuthStore()

interface NavItem {
  title: string
  description: string
  route: string
  roles: Array<'ADMIN' | 'STAFF'>
}

const navItems: NavItem[] = [
  {
    title: 'Woningen',
    description: 'Bekijk en beheer alle woningen in het systeem.',
    route: '/properties',
    roles: ['ADMIN', 'STAFF'],
  },
  {
    title: 'Nieuw Fixbezoek',
    description: 'Noteer de data van het nieuwste fixbezoek.',
    route: '/properties/new',
    roles: ['ADMIN', 'STAFF'],
  },
  {
    title: 'Fixronde Overview',
    description: 'Beheer fixrondes en stel de actieve ronde in.',
    route: '/fix-rounds',
    roles: ['ADMIN'],
  },
  {
    title: 'Materiaal Beheer',
    description: 'Update het magazijn.',
    route: '', //moet nog toegevoegd worden
    roles: ['ADMIN'],
  },
]

const visibleItems = computed(() =>
  navItems.filter(
    (item) => authStore.user?.role && item.roles.includes(authStore.user.role as 'ADMIN' | 'STAFF'),
  ),
)
</script>

<template>
  <div class="page">
    <UserNavBar />

    <main class="content">
      <div class="welcome">
        <h1>Hallo, {{ authStore.user?.firstName }}</h1>
      </div>

      <div class="nav-grid">
        <button
          v-for="item in visibleItems"
          :key="item.route"
          class="nav-card"
          @click="router.push(item.route)"
        >
          <span class="nav-card__title">{{ item.title }}</span>
          <span class="nav-card__desc">{{ item.description }}</span>
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
  background: var(--color-primary);
}

.content {
  max-width: 720px;
  width: 100%;
  margin: 2rem auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.welcome h1 {
  font-size: 1.5rem;
  color: white;
  margin-bottom: 0.25rem;
}

.welcome-sub {
  font-size: 0.95rem;
  color: #6b7280;
}

.nav-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.nav-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.nav-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  border-color: #3b82f6;
}

.nav-card__title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;
}

.nav-card__desc {
  font-size: 0.85rem;
  color: #6b7280;
}
</style>
