<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import Navbar from './components/Navbar.vue'

const store = useStore();
const router = useRouter();

const isAuthenticated = computed(() => store.getters.isAuthenticated);

const logout = () => {
  store.dispatch('logout');
  router.push('/login');
};
</script>

<template>
  <Navbar />
  <div class="pt-16">
    <router-view />
  </div>
</template>

<style scoped>
.pt-16 {
  padding-top: 4rem;
}
</style>
