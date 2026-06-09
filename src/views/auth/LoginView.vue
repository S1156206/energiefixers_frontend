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
    router.push('/properties')
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
  <div class="login-wrapper">
    <div class="login-card">
      <h1>Inloggen</h1>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">E-mailadres</label>
          <input id="email" v-model="email" type="email" required placeholder="jouw@email.nl" />
        </div>
        <div class="form-group">
          <label for="password">Wachtwoord</label>
          <input id="password" v-model="password" type="password" required placeholder="••••••••" />
        </div>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Bezig...' : 'Inloggen' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.login-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 100%;
  max-width: 400px;
}

h1 {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: #1a1a2e;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

input {
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.15s;
}

input:focus {
  border-color: #3b82f6;
}

.error {
  color: #dc2626;
  font-size: 0.875rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
}

button {
  padding: 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 0.5rem;
}

button:hover:not(:disabled) {
  background: #2563eb;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
