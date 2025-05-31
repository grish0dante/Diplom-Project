import { createRouter, createWebHistory } from 'vue-router'
import MainPage from './components/MainPage.vue'
import Login from './views/Login.vue'
import Register from './views/Register.vue'
import UserCabinet from './views/UserCabinet.vue'
import GalleryView from './views/GalleryView.vue'
import ModelViewerView from './views/ModelViewerView.vue'
import store from './store'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: MainPage
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/cabinet',
    name: 'UserCabinet',
    component: UserCabinet,
    meta: { requiresAuth: true }
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: GalleryView
  },
  {
    path: '/viewer/:modelId',
    name: 'ModelViewer',
    component: ModelViewerView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Захист роутів, що вимагають автентифікації
router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!store.getters.isAuthenticated) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router 