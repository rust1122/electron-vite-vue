import { createMemoryHistory, createRouter } from 'vue-router'

// import HomeView from './HomeView.vue'
// import AboutView from './AboutView.vue'
import home from '@/views/home/index.vue'

const routes = [
  { path: '/', component: home },
]

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})