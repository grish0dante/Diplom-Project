<template>
  <div class="gallery-container">
    <div class="gallery-header">
      <h2> </h2>
      <div class="filters">
        <select v-model="selectedCategory" @change="filterModels">
          <option value="">Всі категорії</option>
          <option value="Архітектура">Архітектура</option>
          <option value="Меблі">Меблі</option>
          <option value="Техніка">Техніка</option>
          <option value="Іграшки">Іграшки</option>
          <option value="Інше">Інше</option>
        </select>
      </div>
    </div>

    <div v-if="isLoading" class="loading">
      Завантаження моделей...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else-if="filteredModels.length === 0" class="no-models">
      Немає доступних моделей
    </div>

    <div v-else class="models-grid">
      <div v-for="model in filteredModels" :key="model._id" class="model-card">
        <img :src="getFileUrl(model.image)" :alt="model.title" class="model-image">
        <div class="model-info">
          <h3>{{ model.title }}</h3>
          <p>{{ model.description }}</p>
          <p class="category">Категорія: {{ model.category }}</p>
          <p class="author">Автор: {{ model.user }}</p>
          
          <button @click="selectModel(model)" class="select-btn">
            Обрати модель
          </button>
          
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';


import axios from 'axios';
const router = useRouter();
const emit = defineEmits(['model-selected']);

const models = ref([]);
const selectedCategory = ref('');
const isLoading = ref(true);
const error = ref(null);

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `http://localhost:5000${path}`;
};

const fetchPublicModels = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    console.log('Fetching public models...');
    const response = await apiClient.get('/items/public');
    console.log('Public models response:', response.data);
    models.value = response.data;
  } catch (err) {
    console.error('Error fetching public models:', err);
    error.value = 'Помилка при завантаженні моделей. Спробуйте ще раз.';
  } finally {
    isLoading.value = false;
  }
};

const filteredModels = computed(() => {
  if (!selectedCategory.value) return models.value;
  return models.value.filter(model => model.category === selectedCategory.value);
});

const selectModel = (model) => {
  const isAuthenticated = !!localStorage.getItem('auth_token');

  if (!isAuthenticated) {
    alert('Будь ласка, зареєструйтесь для доступу до моделі.');
    router.push('/register');
  } else {
    emit('model-selected', model);
  }
};

onMounted(() => {
  fetchPublicModels();
});
</script>

<style scoped>
.gallery-container {
  padding: 1rem;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.filters select {
  padding: 0.5rem 1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.model-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.model-card:hover {
  transform: translateY(-5px);
}

.model-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.model-info {
  padding: 1.5rem;
}

.model-info h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.model-info p {
  color: #666;
  margin: 0.5rem 0;
}

.category {
  color: #ff7272;
  font-weight: 600;
}

.select-btn {
  background: #ff7272;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  width: 100%;
  margin-top: 1rem;
  transition: background-color 0.3s;
}

.select-btn:hover {
  background: #ff5252;
}

.loading, .error, .no-models {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  color: #ff5252;
}
</style> 