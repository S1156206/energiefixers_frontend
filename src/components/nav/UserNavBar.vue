<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth';

const router = useRouter()
const authStore = useAuthStore()

const isStaffOrAdmin = computed(
  () => authStore.user?.role === 'STAFF' || authStore.user?.role === 'ADMIN',
)
</script>

<template>
    <header class="topbar">
        <span class="topbar-title">Energiefixers</span>
        <div class="topbar-right">
            <button v-if="isStaffOrAdmin" class="home-btn" @click="router.push('/beheer')">Beheer</button>
            <span>{{ authStore.user?.firstName }}</span>
            <button class="logout-btn" @click="authStore.logout()">Uitloggen</button>
        </div>
    </header>
</template>

<style>
.topbar {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 0 1.5rem;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.topbar-title {
    font-weight: 700;
    color: #1a1a2e;
    font-size: 1.1rem;
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