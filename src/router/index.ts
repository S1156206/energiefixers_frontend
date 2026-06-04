import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/my-property',
      name: 'my-property',
      component: () => import('@/views/MyPropertyView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/my-energy',
      name: 'my-energy',
      component: () => import('@/views/MyEnergyView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/properties',
      name: 'properties',
      component: () => import('@/views/AllPropertyView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/properties/new',
      name: 'new-property',
      component: () => import('@/views/NewPropertyView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/property/:id',
      name: 'property-details',
      component: () => import('@/views/PropertyDetailView.vue'),
      meta: { requiresAuth: true }
    }
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return authStore.user?.role === 'TENANT' ? { name: 'my-property' } : { name: 'properties' }
  }
})

export default router
