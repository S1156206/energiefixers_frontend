<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiRequest } from '@/services/api'
import { useAuthStore, type User } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const token = route.query.token as string

const email = ref('')
const firstName = ref('')
const password = ref('')
const errorMessage = ref('')
const isValidating = ref(true)
const isTokenValid = ref(false)
const isLoading = ref(false)

onMounted(async () => {
  if (!token) {
    router.push('/login')
    return
  }
  try {
    const invitation = await apiRequest<{ recipientEmail: string }>('GET', `/api/invitations/${token}`)
    email.value = invitation.recipientEmail
    isTokenValid.value = true
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Uitnodiging ongeldig of verlopen.'
  } finally {
    isValidating.value = false
  }
})

async function handleRegister() {
  errorMessage.value = ''
  isLoading.value = true
  try {
    const data = await apiRequest<{ accessToken: string; user: User }>('POST', `/api/invitations/${token}/accept`, {
      email: email.value,
      password: password.value,
      firstName: firstName.value,
    })
    authStore.setSession(data.accessToken, data.user)
    router.push('/my-property')
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="register-wrapper">
    <div class="register-card">
      <h1>Account aanmaken</h1>

      <div v-if="isValidating" class="state-message">Uitnodiging controleren...</div>

      <template v-else-if="isTokenValid">
        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label for="firstName">Voornaam</label>
            <input id="firstName" v-model="firstName" type="text" required placeholder="Jan" />
          </div>
          <div class="form-group">
            <label for="email">E-mailadres</label>
            <input id="email" v-model="email" type="email" required readonly />
          </div>
          <div class="form-group">
            <label for="password">Wachtwoord</label>
            <input id="password" v-model="password" type="password" required placeholder="••••••••" />
          </div>
          <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
          <button type="submit" :disabled="isLoading">
            {{ isLoading ? 'Bezig...' : 'Account aanmaken' }}
          </button>
        </form>
      </template>

      <div v-else class="error">{{ errorMessage }}</div>
    </div>
  </div>
</template>

<style scoped>
.register-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--color-primary);
}

.register-card {
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

input[readonly] {
  background: #f9fafb;
  color: #6b7280;
  cursor: default;
}

.error {
  color: #dc2626;
  font-size: 0.875rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
}

.state-message {
  color: #6b7280;
  text-align: center;
  padding: 1rem 0;
}

button {
  padding: 0.75rem;
  background: var(--color-primary);;
  color: var(--color-button-bg);
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 0.5rem;
}

button:hover:not(:disabled) {
  background: var(--color-primary-medium);
  color: var(--color-primary)
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
