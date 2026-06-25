<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth';

const router = useRouter()
const authStore = useAuthStore()

const isStaffOrAdmin = computed(
  () => authStore.user?.role === 'STAFF' || authStore.user?.role === 'ADMIN',
)

const isAdmin = computed(() => authStore.user?.role === 'ADMIN')

const isTenant = computed(
  () => authStore.user?.role === 'TENANT')

function goHome(){
  router.push("/")
}
</script>

<template>
  <header class="energiefixers-header">
    <div class="header-logo-wrapper" @click="goHome">
      <img src="../../assets/energiefixers_logo.png" alt="Energiefixers logo" class="header-logo">
    </div>

    <nav class="header-nav" aria-label="Menu">
      <ul class="nav-list">
        <li class="nav-item">
          <button class="nav-link" @click="router.push('/dashboard')">Dashboard</button>
        </li>
        <li v-if="isStaffOrAdmin" class="nav-item">
          <button class="nav-link" @click="router.push('/management')">Beheer</button>
        </li>
        <li v-if="isStaffOrAdmin" class="nav-item">
          <button class="nav-link" @click="router.push('/properties')">Woningen</button>
        </li>
        <li v-if="isAdmin" class="nav-item">
          <button class="nav-link" @click="router.push('/fix-rounds')">Fixrondes</button>
        </li>
        <li v-if="isAdmin" class="nav-item">
          <button class="nav-link" @click="router.push('/admin/savings')">Besparingen</button>
        </li>
        <li v-if="isAdmin" class="nav-item">
          <button class="nav-link" @click="router.push('/materials/menu')">Materialen</button>
        </li>
        <li v-if="isTenant" class="nav-item">
          <button class="nav-link" @click="router.push('/my-energy')">Mijn verbruik</button>
        </li>
        <li v-if="isTenant" class="nav-item">
          <button class="nav-link" @click="router.push('/my-property')">Mijn woning</button>
        </li>
        <li v-if="isTenant" class="nav-item">
          <button class="nav-link" @click="router.push('/profile')">Profiel</button>
        </li>
      </ul>

      <div class="account-section">
        <button class="logout-btn" @click="authStore.logout()">Uitloggen</button>
      </div>
    </nav>
  </header>
</template>

<style scoped>
@font-face {
  font-family: 'Roihu';
  font-style: normal;
  font-weight: 300;
  font-display: auto;
  src: url('https://energiefixers071.nl/wp-content/uploads/2023/02/Roihu-Light.woff2') format('woff2');
}

.energiefixers-header {
  background-color: #FFFFFF;
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.2);
  padding: 20px 5%;
  position: sticky;
  top: 0;
  z-index: 9995;
  font-family: 'Roihu', sans-serif !important;
  font-weight: 400;
  -webkit-font-smoothing: antialiased;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.header-logo-wrapper {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.header-logo {
  height: 60px;
  width: auto;
}

.header-nav {
  display: flex;
  align-items: center;
}

.nav-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 5px;
}

.nav-item {
  display: flex;
  align-items: center;
}

.nav-link {
  position: relative;
  background: transparent;
  border: none;
  color: #F15A22;
  font-family: 'Roihu', sans-serif !important;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  cursor: pointer;
  padding: 10px 15px;
  transition: color 0.3s ease;
  z-index: 1;
}

.nav-link::before,
.nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 50%;
  background-color: #F15A22;
  z-index: -1;
  transition: transform 0.3s ease;
}

.nav-link::before {
  top: 0;
  border-radius: 4px 4px 0 0;
  transform: scaleY(0);
  transform-origin: top;
}

.nav-link::after {
  bottom: 0;
  border-radius: 0 0 4px 4px;
  transform: scaleY(0);
  transform-origin: bottom;
}

.nav-link:hover::before,
.nav-link:hover::after {
  transform: scaleY(1);
}

.nav-link:hover {
  color: #FFFFFF;
}

.account-section {
  display: flex;
  align-items: center;
  margin-left: 20px;
  border-left: 1px solid #e5e7eb;
  padding-left: 20px;
}

.logout-btn {
  position: relative;
  background-color: transparent;
  color: #ED1B36;
  border: none;
  border-radius: 4px;
  padding: 9px 14px;
  font-family: 'Roihu', sans-serif !important;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.3s ease;
  z-index: 1;
  overflow: hidden;
}

.logout-btn::before,
.logout-btn::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 50%;
  background-color: #ED1B36;
  z-index: -1;
  transition: transform 0.3s ease;
}

.logout-btn::before {
  top: 0;
  transform: scaleY(0);
  transform-origin: top;
}

.logout-btn::after {
  bottom: 0;
  transform: scaleY(0);
  transform-origin: bottom;
}

.logout-btn:hover::before,
.logout-btn:hover::after {
  transform: scaleY(1);
}

.logout-btn:hover {
  color: #FFFFFF;
  border: none;
}
</style>