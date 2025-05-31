<template>
  <nav class="navbar">
    <div class="container">
      <div class="navbar-row">
        
        <div class="left">
          <a href="https://github.com/YOUR_GITHUB_REPO" target="_blank" rel="noopener" class="github-link">
            <svg class="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.606-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.468-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.984-.399 3.003-.404 1.018.005 2.046.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.804 5.624-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.796 24 17.299 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            Переглянути проект на GitHub  
          </a>
          <span class="title"><router-link to="/" class="nav-link">   3D Візуалізатор </router-link> </span>
        </div>
        
        
        
        <div class="right">
          <div class="nav-links">
            <router-link to="/" class="nav-link">Домівка</router-link>
            <router-link to="/gallery" class="nav-link">Галерея</router-link>
            
            
            <template v-if="!isAuthenticated">
              <router-link to="/register" class="ml-4 bg-white text-orange-500 hover:bg-orange-100 font-bold px-4 py-2 rounded-md shadow transition">Зареєструватися
              </router-link>
              
            </template>
            
           
            <template v-else>
              <router-link to="/cabinet" class="nav-link">Мій кабінет</router-link>
              
              <button @click="handleLogout" class="auth">Вийти</button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const router = useRouter();
const store = useStore();

const isAuthenticated = computed(() => store.getters.isAuthenticated);
const username = computed(() => store.getters.currentUser?.username || '');


const handleLogout = () => {
  store.dispatch('logout');
  router.push('/login');
};
</script>

<style>
.navbar {
  @apply bg-orange-400 shadow-md fixed w-full z-50 top-0 left-0;
  min-height: 4rem;
}

.container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

.navbar-row {
  @apply flex items-center justify-between h-16;
}

.left {
  @apply flex-1 flex items-center;
}

.center {
  @apply flex-1 flex justify-center items-center;
}

.right {
  @apply flex-1 flex justify-end items-center;
}

.github-link {
  @apply flex items-center text-white hover:text-gray-200 font-medium text-sm;
}

.logo {
  @apply h-10 w-10 mr-3;
}

.title {
  @apply text-white font-bold text-xl tracking-wide font-bold px-4;
}

.nav-links {
  @apply hidden md:flex space-x-4;
}

.nav-link {
  @apply text-white hover:bg-orange-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition;
} 
.auth{
  @apply text-white ml-2 bg-white text-orange-500 hover:bg-orange-100 font-bold px-4 py-2 rounded-md shadow transition;
}
</style>