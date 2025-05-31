import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import axios from 'axios'
import './assets/main.css'

// Налаштування axios
axios.defaults.baseURL = 'http://localhost:5000'

// Додавання токена до всіх запитів, якщо він є
axios.interceptors.request.use(config => {
  const token = store.state.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => {
  return Promise.reject(error)
})

// Обробка помилок автентифікації
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      store.dispatch('logout')
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

const app = createApp(App)

app.use(router)
app.use(store)

// Перевірка автентифікації при запуску додатку
store.dispatch('verifyAuth').then(() => {
  app.mount('#app')
})
