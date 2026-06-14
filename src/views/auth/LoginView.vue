<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

onMounted(() => {
  if (authStore.isAuthenticated) {
    redirectToDashboard()
  }
})

function redirectToDashboard() {
  if (authStore.user?.role === 'TENANT') {
    router.push('/my-property')
  } else {
    router.push('/management')
  }
}

async function handleLogin() {
  errorMessage.value = ''
  isLoading.value = true
  try {
    await authStore.login(email.value, password.value)
    redirectToDashboard()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="card">
      <div class="card-left">
        <h1>Log in</h1>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="email">email:</label>
            <input id="email" v-model="email" type="email" required />
          </div>
          <div class="form-group">
            <label for="password">wachtwoord</label>
            <input id="password" v-model="password" type="password" required />
          </div>
          <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
          <button type="submit" :disabled="isLoading">
            {{ isLoading ? 'Bezig...' : 'Inloggen' }}
          </button>
        </form>
      </div>
      <div class="card-right">
        <img src="@/assets/energiefixers_logo.png" alt="Energiefixers logo" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f3f4f6;
}

.card {
  display: flex;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  overflow: hidden;
  width: 600px;
  min-height: 320px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-left {
  flex: 1;
  background: white;
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.card-right {
  flex: 1;
  background: #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.card-right img {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
}

h1 {
  margin: 0 0 1.5rem 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: #111;
}

form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

label {
  font-size: 0.875rem;
  color: #374151;
}

input {
  padding: 0.5rem 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.95rem;
  outline: none;
}

input:focus {
  border-color: #6b7280;
}

.error {
  color: #dc2626;
  font-size: 0.875rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
}

button {
  padding: 0.55rem;
  background: #e5e7eb;
  color: #111;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 0.25rem;
}

button:hover:not(:disabled) {
  background: #d1d5db;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
