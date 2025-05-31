<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Створити аккаунт
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="username" class="sr-only">Ім'я користувача</label>
            <input
              id="username"
              v-model="username"
              name="username"
              type="text"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
              placeholder="Ім'я користувача"
            />
          </div>
          <div>
            <label for="email" class="sr-only">Електронна адреса</label>
            <input
              id="email"
              v-model="email"
              name="email"
              type="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
              placeholder="Електронна адреса"
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
            {{ loading ? 'Створення аккаунту...' : 'Створити аккаунт' }}
          </button>
        </div>

        <div v-if="error" class="text-red-500 text-center text-sm">
          {{ error }}
        </div>

        <div class="text-center">
          <router-link to="/login" class="text-orange-600 hover:text-orange-500">
            Вже зареєстровані? Увійдіть у свій аккаунт
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const username = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const handleRegister = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      username: username.value,
      email: email.value,
      password: password.value
    });

    localStorage.setItem('token', response.data.token);
    router.push('/');
  } catch (err) {
    error.value = err.response?.data?.message || 'An error occurred during registration';
  } finally {
    loading.value = false;
  }
};
</script> 