import { createRouter, createWebHistory } from 'vue-router'
import SphereGridView from '@/views/SphereGridView.vue'
import MonsterArenaView from '@/views/MonsterArenaView.vue'
import GridMapperView from '@/views/GridMapperView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'sphere-grid',
      component: SphereGridView,
    },
    {
      path: '/monster-arena',
      name: 'monster-arena',
      component: MonsterArenaView,
    },
    {
      path: '/grid-mapper',
      name: 'grid-mapper',
      component: GridMapperView,
    },
  ],
})

export default router
