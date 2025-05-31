<template >
  <div class="main-landing">
  <div class="user-cabinet" >
    <h1>Мій кабінет</h1>
    <div class="breadcrumb">
      <span class="breadcrumb-item" :class="{ active: currentSection === 'models' }" @click="currentSection = 'models'">Мої моделі</span>
      <span class="breadcrumb-separator">|</span>
      <span class="breadcrumb-item" :class="{ active: currentSection === 'viewer' }" @click="currentSection = 'viewer'">Переглядач</span>
      <span class="breadcrumb-separator">|</span>
      <span class="breadcrumb-item" :class="{ active: currentSection === 'add' }" @click="currentSection = 'add'">Додати модель</span>
    </div>

    
    
    <!-- Форма завантаження нової моделі -->
    <div class="upload-section" v-if="isAuthenticated && currentSection === 'add'">
      <h2>Завантажити нову модель</h2>
      <form @submit.prevent="uploadModel" class="upload-form">
        <div class="form-group">
          <label for="title">Назва моделі:</label>
          <input type="text" id="title" v-model="newModel.title" required>
        </div>

        <div class="form-group">
          <label for="description">Короткий опис:</label>
          <textarea id="description" v-model="newModel.description" required></textarea>
        </div>

        <div class="form-group">
          <label for="description_big">Детальний опис:</label>
          <textarea id="description_big" v-model="newModel.description_big" required></textarea>
        </div>

        <div class="form-group">
          <label for="category">Категорія:</label>
          <select id="category" v-model="newModel.category" required>
            <option value="Архітектура">Архітектура</option>
            <option value="Меблі">Меблі</option>
            <option value="Техніка">Техніка</option>
            <option value="Іграшки">Іграшки</option>
            <option value="Інше">Інше</option>
          </select>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="newModel.isPublic">
            Публічна модель
          </label>
          <small class="help-text">Публічні моделі доступні всім користувачам</small>
        </div>

        <div class="form-group">
          <label for="image">Зображення:</label>
          <input type="file" id="image" @change="handleImageUpload" accept="image/*" required>
        </div>

        <div class="form-group">
          <label for="model">3D модель:</label>
          <input type="file" id="model" @change="handleModelUpload" accept=".glb,.gltf" required>
        </div>

        <button type="submit" :disabled="isUploading">
          {{ isUploading ? 'Завантаження...' : 'Опублікувати модель' }}
        </button>
      </form>
    </div>

    <!-- Список моделей користувача -->
    <div class="models-section" v-if="currentSection === 'models'">
      <h2>Мої моделі</h2>
      
      <!-- Фільтри -->
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

      <!-- Список моделей -->
      <div class="models-grid" v-if="userModels.length">
        <div v-for="model in filteredModels" :key="model._id" class="model-card">
          <img :src="getFileUrl(model.image)" :alt="model.title" class="model-image">
          <div class="model-info">
            <h3>{{ model.title }}</h3>
            <p>{{ model.description }}</p>
            <p class="category">Категорія: {{ getCategoryName(model.category) }}</p>
            <p class="visibility">
              <span :class="['status-badge', model.isPublic ? 'public' : 'private']">
                {{ model.isPublic ? 'Публічна' : 'Приватна' }}
              </span>
            </p>
            <div class="model-actions">
              <button @click="viewModel(model)" class="view-btn">Переглянути</button>
              <button @click="editModel(model)" class="edit-btn">Редагувати</button>
              <button @click="deleteModel(model._id)" class="delete-btn">Видалити</button>
            </div>
          </div>
        </div>
      </div>
      <p v-else class="no-models">У вас поки немає завантажених моделей</p>
    </div>

    <!-- ItemPopup -->
    <ItemPopup
      v-if="selectedModel"
      :item="selectedModel"
      @close-popup="selectedModel = null"
      @go-to-viewer="handleGoToViewer"
    />

    <!-- Viewer section -->
    <div class="viewer-section" v-if="currentSection === 'viewer'">
      <ModelViewer :selectedModel="selectedModelForViewer" />
    </div>

    <!-- Модальне вікно для редагування -->
    <div v-if="showEditModal" class="modal">
      <div class="modal-content">
        <h2>Редагувати модель</h2>
        <form @submit.prevent="updateModel">
          <div class="form-group">
            <label for="edit-title">Назва:</label>
            <input type="text" id="edit-title" v-model="editingModel.title" required>
          </div>

          <div class="form-group">
            <label for="edit-description">Опис:</label>
            <textarea id="edit-description" v-model="editingModel.description" required></textarea>
          </div>

          <div class="form-group">
            <label for="edit-category">Категорія:</label>
            <select id="edit-category" v-model="editingModel.category" required>
              <option value="Архітектура">Архітектура</option>
              <option value="Меблі">Меблі</option>
              <option value="Техніка">Техніка</option>
              <option value="Іграшки">Іграшки</option>
              <option value="Інше">Інше</option>
            </select>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="editingModel.isPublic">
              Публічна модель
            </label>
            <small class="help-text">Публічні моделі доступні всім користувачам</small>
          </div>

          <div class="modal-actions">
            <button type="submit" class="save-btn">Зберегти</button>
            <button type="button" @click="showEditModal = false" class="cancel-btn">Скасувати</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { useRouter } from 'vue-router';
import ModelViewer from '../components/ModelViewer.vue';
import ItemPopup from '../components/ItemPopup.vue';

const store = useStore();
const isAuthenticated = computed(() => store.getters.isAuthenticated);
const router = useRouter();

// API client with auth header
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
apiClient.interceptors.request.use(config => {
  const token = store.state.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Request interceptor:', {
    url: config.url,
    method: config.method,
    headers: config.headers
  });
  return config;
}, error => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

apiClient.interceptors.response.use(response => {
  console.log('Response interceptor:', {
    status: response.status,
    statusText: response.statusText,
    data: response.data
  });
  return response;
}, error => {
  console.error('Response interceptor error:', {
    message: error.message,
    response: error.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    } : 'No response'
  });
  return Promise.reject(error);
});

// Helper function to get full URL for files
const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `http://localhost:5000${path}`;
};

// State for new model
const newModel = ref({
  title: '',
  description: '',
  description_big: '',
  category: '',
  isPublic: false,
  image: null,
  modelFile: null
});

// State for models list
const userModels = ref([]);
const selectedCategory = ref('');
const isUploading = ref(false);
const showEditModal = ref(false);
const editingModel = ref(null);
const uploadProgress = ref(0);

// Add currentSection ref
const currentSection = ref('models');

// Add selectedModel ref
const selectedModel = ref(null);

// Add selectedModelForViewer ref
const selectedModelForViewer = ref(null);

// Fetch user models
const fetchUserModels = async () => {
  if (!isAuthenticated.value) {
    console.log('User is not authenticated');
    return;
  }

  try {
    console.log('Fetching models with token:', store.state.token);
    console.log('Request headers:', {
      Authorization: `Bearer ${store.state.token}`,
      'Content-Type': 'application/json'
    });

    const response = await apiClient.get('/items/my-models', {
      headers: {
        Authorization: `Bearer ${store.state.token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Full model data from API:', JSON.stringify(response.data, null, 2));
    userModels.value = response.data;
  } catch (error) {
    console.error('Error fetching models:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No response',
      request: error.request ? 'Request was made but no response received' : 'No request was made',
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers
      } : 'No config'
    });

    if (error.response?.status === 401) {
      store.dispatch('logout');
      alert('Сесія закінчилась. Будь ласка, увійдіть знову.');
    } else {
      alert('Помилка при отриманні моделей. Спробуйте ще раз.');
    }
  }
};

// Filtered models
const filteredModels = computed(() => {
  if (!selectedCategory.value) return userModels.value;
  return userModels.value.filter(model => model.category === selectedCategory.value);
});

// Handle image upload
const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image file size should be less than 5MB');
      event.target.value = '';
      return;
    }
    newModel.value.image = file;
  }
};

// Завантаження моделі
const handleModelUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 50 * 1024 * 1024) { // 50MB ліміт
      alert('Розмір моделі повине бути меншим за 50MB');
      event.target.value = '';
      return;
    }
    newModel.value.modelFile = file;
  }
};

// Заватажити нову модель
const uploadModel = async () => {
  if (!isAuthenticated.value) {
    alert('Будь ласка, увійдіть в систему для завантаження моделей');
    return;
  }

  if (!newModel.value.title || !newModel.value.description || !newModel.value.description_big || !newModel.value.category) {
    alert('Будь ласка, заповніть всі обов\'язкові поля');
    return;
  }

  if (!newModel.value.image || !newModel.value.modelFile) {
    alert('Будь ласка, виберіть зображення та 3D модель');
    return;
  }

  isUploading.value = true;
  uploadProgress.value = 0;

  const formData = new FormData();
  formData.append('title', newModel.value.title);
  formData.append('description', newModel.value.description);
  formData.append('description_big', newModel.value.description_big);
  formData.append('category', newModel.value.category);
  formData.append('isPublic', newModel.value.isPublic);
  formData.append('image', newModel.value.image);
  formData.append('model', newModel.value.modelFile);

  try {
    const response = await apiClient.post('/items', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      }
    });

    // Скинути форму
    newModel.value = {
      title: '',
      description: '',
      description_big: '',
      category: '',
      isPublic: false,
      image: null,
      modelFile: null
    };

    
    await fetchUserModels();
    alert('Модель успішно завантажена!');
  } catch (error) {
    console.error('Помилка завантаження моделі:', error);
    if (error.response?.status === 401) {
      store.dispatch('logout');
      alert('Сесія закінчилась. Будь ласка, увійдіть знову.');
    } else {
      alert(error.response?.data?.message || 'Помилка при завантаженні моделі. Спробуйте ще раз.');
    }
  } finally {
    isUploading.value = false;
    uploadProgress.value = 0;
  }
};

const deleteModel = async (modelId) => {
  console.log('Attempting to delete model with ID:', modelId);
  
  if (!confirm('Ви впевнені, що хочете видалити цю модель? Цю дію неможливо скасувати.')) {
    return;
  }

  try {
    console.log('Sending delete request to:', `/items/${modelId}`);
    console.log('Current auth token:', store.state.token);
    
    const response = await apiClient.delete(`/items/${modelId}`, {
      headers: {
        'Authorization': `Bearer ${store.state.token}`,
        'Content-Type': 'application/json'
      },
      validateStatus: function (status) {
        return status >= 200 && status < 500; 
      }
    });
    
    console.log('Delete response:', response);
    
    if (response.status === 200 || response.status === 204) {
      await fetchUserModels();
      alert('Модель успішно видалена');
    } else if (response.status === 404) {
      alert('Модель не знайдена. Перевірте, чи правильно передається ID моделі.');
    } else if (response.status === 403) {
      alert('У вас немає прав для видалення цієї моделі.');
    } else {
      throw new Error('Неочікувана відповідь від сервера');
    }
  } catch (error) {
    console.error('Помилка видалення моделі:', error);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    if (error.response?.status === 401) {
      store.dispatch('logout');
      alert('Сесія закінчилась. Будь ласка, увійдіть знову.');
    } else {
      alert('Помилка при видаленні моделі. Спробуйте ще раз.');
    }
  }
};

const editModel = (model) => {
  editingModel.value = { ...model };
  showEditModal.value = true;
};


const updateModel = async () => {
  try {
    console.log('Updating model:', editingModel.value);
    
    if (!editingModel.value._id) {
      console.error('No model ID provided');
      alert('Помилка: ID моделі не знайдено');
      return;
    }

    const updateData = {
      title: editingModel.value.title,
      description: editingModel.value.description,
      description_big: editingModel.value.description_big,
      category: editingModel.value.category,
      isPublic: editingModel.value.isPublic
    };

    console.log('Sending update request with data:', updateData);
    
    const response = await apiClient.put(`/items/${editingModel.value._id}`, updateData, {
      headers: {
        'Authorization': `Bearer ${store.state.token}`,
        'Content-Type': 'application/json'
      },
      validateStatus: function (status) {
        return status >= 200 && status < 500; 
      }
    });

    console.log('Update response:', response);
    
    if (response.status === 200) {
      showEditModal.value = false;
      await fetchUserModels();
      alert('Модель успішно оновлена');
    } else if (response.status === 404) {
      alert('Модель не знайдена');
    } else if (response.status === 403) {
      alert('У вас немає прав для редагування цієї моделі');
    } else {
      throw new Error('Неочікувана відповідь від сервера');
    }
  } catch (error) {
    console.error('Помилка оновлення моделі:', error);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    if (error.response?.status === 401) {
      store.dispatch('logout');
      alert('Сесія закінчилась. Будь ласка, увійдіть знову.');
    } else {
      alert('Помилка при оновленні моделі. Спробуйте ще раз.');
    }
  }
};


const getCategoryName = (category) => {
  return category || "Not specified";
};


const viewModel = (model) => {
  console.log('Viewing model:', model);
  console.log('Model properties:', Object.keys(model));
  console.log('Full model data:', JSON.stringify(model, null, 2));
  selectedModel.value = model;
};


const handleGoToViewer = (model) => {
  selectedModelForViewer.value = model;
  currentSection.value = 'viewer';
  selectedModel.value = null;
};


onMounted(() => {
  if (isAuthenticated.value) {
    fetchUserModels();
  }
});
</script>

<style scoped>
.main-landing {
  min-height: calc(100vh - 4rem);
  background: linear-gradient(135deg, #ffa751 0%, #ff7272 100%);
}
.user-cabinet {
  max-width: 100em;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #ffffff;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
}

.upload-section {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.upload-form {
  display: grid;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 600;
  color: #333;
}

input[type="text"],
textarea,
select {
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input[type="text"]:focus,
textarea:focus,
select:focus {
  border-color: #72ff72;
  outline: none;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

input[type="file"] {
  padding: 0.5rem;
  border: 2px dashed #ddd;
  border-radius: 8px;
  cursor: pointer;
}

input[type="file"]:hover {
  border-color: #72ff72;
}

button[type="submit"] {
  background: linear-gradient(135deg, #ffa751 0%, #ff7272 100%);
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

button[type="submit"]:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 114, 114, 0.2);
}

button[type="submit"]:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.models-section {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.filters {
  margin-bottom: 1.5rem;
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

.model-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  width: 100%;
}

.model-actions button {
  flex: 1 1 0;
  min-width: 0;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-btn {
  background: #4CAF50;
  color: #fff;
}
.view-btn:hover {
  background: #388e3c;
}

.edit-btn {
  background: #ffa751;
  color: #fff;
}
.edit-btn:hover {
  background: #ff9800;
}

.delete-btn {
  background: #ff7272;
  color: #fff;
}
.delete-btn:hover {
  background: #e53935;
}

.no-models {
  text-align: center;
  color: #666;
  padding: 2rem;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.save-btn,
.cancel-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.save-btn {
  background: #ffa751;
  color: white;
}

.cancel-btn {
  background: #ddd;
  color: #333;
}

.save-btn:hover,
.cancel-btn:hover {
  opacity: 0.9;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.help-text {
  color: #666;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.visibility {
  margin: 0.5rem 0;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-badge.public {
  background-color: #4CAF50;
  color: white;
}

.status-badge.private {
  background-color: #9E9E9E;
  color: white;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.breadcrumb-item {
  color: #666;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

.breadcrumb-item:hover {
  color: #ff7272;
  background: rgba(255, 114, 114, 0.1);
}

.breadcrumb-item.active {
  color: #ff7272;
  font-weight: 600;
  background: rgba(255, 114, 114, 0.1);
}

.breadcrumb-separator {
  color: #ddd;
  font-weight: 300;
}

.viewer-section {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
}
</style> 