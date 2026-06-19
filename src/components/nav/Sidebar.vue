<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  activeKey: string
}>()

const router = useRouter()
const authStore = useAuthStore()

const navItems = [
  { key: 'home', label: 'Starters Pagina', icon: 'pi pi-home', to: '/management' },
  { key: 'fixbezoek', label: 'Fixbezoek', icon: 'pi pi-map-marker', to: null },
  { key: 'fixronden', label: 'Fixronden', icon: 'pi pi-question-circle', to: '/fix-rounds' },
  { key: 'materialen', label: 'Materialen', icon: 'pi pi-cog', to: '/materials/menu' },
]

function go(item: (typeof navItems)[number]) {
  if (!item.to) return
  router.push(item.to)
}
</script>

<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <i class="pi pi-bars"></i>
      <span>Opties</span>
    </div>

    <nav class="sidebar-nav">
      <button
        v-for="item in navItems"
        :key="item.key"
        type="button"
        class="nav-pill"
        :class="{ 'nav-pill--active': item.key === props.activeKey, 'nav-pill--disabled': !item.to }"
        :disabled="!item.to"
        @click="go(item)"
      >
        <i :class="item.icon"></i>
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <button type="button" class="logout-pill" @click="authStore.logout()">
      <i class="pi pi-sign-out"></i>
      <span>UITLOGGEN</span>
    </button>
  </div>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 220px;
  flex-shrink: 0;
  height: 70vh;
  margin: 1rem 0 0 4rem;
  border-radius: 1rem;
  background: var(--color-primary-light, #fdeee8);
  box-sizing: border-box;
}

.sidebar-header {
  color: var(--color-primary);
  background: var(--color-background);
  border-radius: 1rem;
  padding: 1rem;
  font-size: 1.3rem;
  font-weight: bold;
}

.sidebar-header i {
  margin-right: 1rem;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.75rem 1.25rem;
}

.nav-pill {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem 1.1rem;
  /* border-radius: 999px; */
  /* border: 2px solid var(--color-primary, #f15a22); */
  border: transparent;
  background: transparent;
  color: var(--color-primary, #f15a22);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.nav-pill:hover:not(:disabled) {
  background: rgba(241, 90, 34, 0.1);
}

.nav-pill--active {
  background: var(--color-primary, #f15a22);
  border-radius: 1rem;
  color: black;
}

.nav-pill--active:hover {
  background: var(--color-primary, #f15a22);
}

.nav-pill--disabled {
  border-color: var(--color-border, #d1d5db);
  color: var(--color-text-muted, #374151);
  opacity: 0.6;
  cursor: not-allowed;
}

.logout-pill {
  margin: auto 1.75rem 1rem 1.75rem;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem 1.1rem;
  border-radius: 999px;
  border: transparent;
  background:  var(--color-danger, #ed1b36);
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.logout-pill:hover {
  background: var(--color-danger, #ed1b36);
  color: white;
}
</style>
