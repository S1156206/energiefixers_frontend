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
</script>

<template>
    <header class="topbar">
        <img src="../../assets/energiefixers_logo.png" alt="Energiefixers logo">
        <div class="topbar-right">
            <button v-if="isStaffOrAdmin" class="home-btn" @click="router.push('/management')">Beheer</button>
            <button v-if="isStaffOrAdmin" class="home-btn" @click="router.push('/properties')">Woningen</button>
            <button v-if="isAdmin" class="home-btn" @click="router.push('/fix-rounds')">Fixrondes</button>
            <button v-if="isAdmin" class="home-btn" @click="router.push('/material-overview')">Materialen</button>
            <button v-if="isTenant" class="home-btn" @click="router.push('/my-energy')">Mijn verbruik</button>
            <button v-if="isTenant" class="home-btn" @click="router.push('/my-property')">Mijn woning</button>

            <span>{{ authStore.user?.firstName }}</span>
            <button class="logout-btn" @click="authStore.logout()">Uitloggen</button>
        </div>
    </header>
</template>

<style>
.topbar {
    background: var(--color-primary-light);
    border-bottom: 1px solid #e5e7eb;
    padding: 0 4rem 0 4rem;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.topbar img {
    height: 40px;
    width: auto;
}

.topbar-right {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: #6b7280;
    font-size: 0.9rem;
}

.logout-btn {
    background: none;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 0.35rem 0.75rem;
    font-size: 0.875rem;
    cursor: pointer;
    color: #374151;
}

.logout-btn:hover {
    background: #f3f4f6;
}

.home-btn {
    background: none;
    border: none;
    font-size: 0.875rem;
    font-weight: 500;
    color: #3b82f6;
    cursor: pointer;
    padding: 0.35rem 0;
}

.home-btn:hover {
    text-decoration: underline;
}
</style>