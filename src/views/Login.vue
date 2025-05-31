<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Вхід в обліковий запис
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email" class="sr-only">Електронна адреса</label>
            <input
              id="email"
              v-model="email"
              name="email"
              type="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
              placeholder="Email адреса"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Пароль</label>
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
              placeholder="Пароль"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            :disabled="loading"
          >
            {{ loading ? 'Вхід...' : 'Увійти' }}
          </button>
        </div>

        <div v-if="error" class="text-red-500 text-center text-sm">
          {{ error }}
        </div>

        <div class="text-center">
          <router-link to="/register" class="text-orange-600 hover:text-orange-500">
            Немає облікового запису? Зареєструватися
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStore } from 'vuex';

const router = useRouter();
const route = useRoute();
const store = useStore();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

// Якщо користувач вже авторизований, перенаправляємо на головну
onMounted(() => {
  if (store.getters.isAuthenticated) {
    router.push('/');
  }
});

const handleLogin = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    const result = await store.dispatch('login', {
      email: email.value,
      password: password.value
    });

    if (result.success) {
      // Перенаправляємо на сторінку, з якої прийшов користувач, або на головну
      const redirectPath = route.query.redirect || '/';
      router.push(redirectPath);
    } else {
      error.value = result.error;
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Помилка входу';
  } finally {
    loading.value = false;
  }
};
</script> 