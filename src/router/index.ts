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
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/management',
      name: 'admin-home',
      component: () => import('@/views/admin/AdminHomeView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/my-property',
      name: 'my-property',
      component: () => import('@/views/property/MyPropertyView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/my-energy',
      name: 'my-energy',
      component: () => import('@/views/energy/MyEnergyView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/properties',
      name: 'properties',
      component: () => import('@/views/property/AllPropertyView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/properties/new',
      name: 'new-property',
      component: () => import('@/views/property/NewPropertyView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/property/:id',
      name: 'property-details',
      component: () => import('@/views/property/PropertyDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/edit-property/:id',
      name: 'edit-property',
      component: () => import('@/views/property/EditPropertyView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/property/:id/add-visit',
      name: 'new-fix-visit',
      component: () => import('@/views/fix-visit/NewFixVisitView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/fix-rounds',
      name: 'fix-rounds',
      component: () => import('@/views/fix-round/FixRoundView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/materials/overview',
      name: 'material-overview',
      component: () => import('@/views/admin/MaterialOverviewView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/materials/manage',
      name: 'update-materials',
      component: () => import('@/views/admin/UpdateMaterialView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/materials/menu',
      name: 'material-menu',
      component: () => import('@/views/admin/MaterialMenuView.vue')
    },
    {
      path: '/submit/:token',
      name: 'submit-form',
      component: () => import('@/views/submission/SubmitFormView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/my-savings',
      name: 'my-savings',
      component: () => import('@/views/energy/MySavingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/dashboard/PublicDashBoardView.vue'),
      meta: { requiresAuth: true},
    },
  ],

})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return authStore.user?.role === 'TENANT' ? { name: 'my-property' } : { name: 'admin-home' }
  }
})

export default router
