<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import { useFixRoundsStore } from '@/stores/fixRounds'
import { useMaterialsStore } from '@/stores/materials'
import houseIcon from '@/assets/icons/house_icon.png'
import notepadIcon from '@/assets/icons/notepad_icon.png'
import blueprintIcon from '@/assets/icons/blueprint_icon.png'

const router = useRouter()
const authStore = useAuthStore()
const fixRoundStore = useFixRoundsStore()
const materialsStore = useMaterialsStore()

interface NavItem {
  title: string
  description: string
  route: string
  roles: Array<'ADMIN' | 'STAFF'>
  hasIcon: boolean
  icon: string
}

const navItems: NavItem[] = [
  {
    title: 'Nieuwe Woning',
    description: 'Voeg een nieuwe woning toe om te fixen.',
    route: '/properties/new',
    roles: ['ADMIN', 'STAFF'],
    hasIcon: true,
    icon: houseIcon
  },
  {
    title: 'Nieuw Fixbezoek',
    description: 'Bekijk en beheer alle woningen in het systeem en registreer een fixbezoek.',
    route: '/properties',
    roles: ['ADMIN', 'STAFF'],
    hasIcon: true,
    icon: notepadIcon
  },
  {
    title: 'Fixronde Overview',
    description: 'Bekijk de fixrondes en voeg een  nieuwe fixronde toe.',
    route: '/fix-rounds',
    roles: ['ADMIN'],
    hasIcon: false,
    icon: ""
  },
  {
    title: 'Materialen',
    description: 'Bekijk een overzicht van het materiaal in het magazijn.',
    route: '/materials/menu',
    roles: ['ADMIN'],
    hasIcon: true,
    icon: blueprintIcon
  },
]

const visibleItems = computed(() =>
  navItems.filter(
    (item) => authStore.user?.role && item.roles.includes(authStore.user.role as 'ADMIN' | 'STAFF'),
  ),
)

onMounted(async () => {
  await Promise.all([
    fixRoundStore.ensureLoaded(),
    materialsStore.ensureLoaded(),
  ])
  totalFixRounds.value = fixRoundStore.currentRound?.name
})

const totalFixRounds = ref(fixRoundStore.currentRound?.name)

</script>

<template>
  <div class="page">
    <UserNavBar />

    <div class="content-container welcome-section">
      <div class="welcome">
        <h1>Hallo, {{ authStore.user?.firstName }}</h1>
      </div>
    </div>

    <div class="divider-container">
      <img src="../../assets/douchekop.png" alt="douchekop divider" class="douchekop-img" />
    </div>

    <main class="content-container grid-section">
      <div class="nav-grid">
        <template v-for="item in visibleItems" :key="item.route">
          <div v-if="item.title === 'Fixronde Overview'" class="fixround-row">
            <button class="nav-card fixround-card" @click="router.push(item.route)">
              <div class="card-column">
                <span class="nav-card__title">{{ item.title }}</span>
                <span class="nav-card__desc">{{ item.description }}</span>
              </div>
            </button>
            <div class="fixround-box">
              <span class="fixround-box__label">Fixronde:</span>
              <span class="fixround-box__value">{{ totalFixRounds }}</span>
            </div>
          </div>
          <button v-else class="nav-card" @click="router.push(item.route)">
            <div class="card-column">
              <span class="nav-card__title">{{ item.title }}</span>
              <span class="nav-card__desc">{{ item.description }}</span>
            </div>
            <img v-if="item.hasIcon" :src="item.icon" class="nav-card__icon" alt="" />
          </button>
        </template>
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

.welcome-section {
  margin-top: 2rem;
  margin-bottom: 1.5rem;
}

.grid-section {
  margin-top: 1.5rem;
  margin-bottom: 2rem;
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

.welcome h1 {
  font-size: 1.5rem;
  color: white;
  margin-bottom: 0.25rem;
}

.nav-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.nav-card {
  background: var(--color-primary-medium);
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  padding: 1.5rem;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
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

.nav-card__icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  align-self: center;
  flex-shrink: 0;
}

.fixround-row {
  display: flex;
  gap: 1rem;
  align-items: stretch;
}

.fixround-card {
  flex: 1;
}

.fixround-box {
  background: var(--color-primary-medium);
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  flex-shrink: 0;
  min-width: 110px;
}

.fixround-box__label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-primary);
  white-space: nowrap;
}

.fixround-box__value {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-primary);
}

.nav-card__title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-primary);
}

.nav-card__desc {
  font-size: 0.9rem;
  color: var(--color-primary);
}
</style>