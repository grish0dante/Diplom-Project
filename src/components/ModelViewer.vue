<template>
  <div class="model-viewer-container">
    <div class="back">
      <div id="dropZone" ref="dropZone" @drop.prevent="handleDrop" @dragover.prevent>
        <p>
          Перетягніть вашу модель сюди (.glb,.obj,.stl) або
          <label class="labelito" for="fileInput">виберіть файл</label>
        </p>
        <p class="or-text">або</p>
        <button class="gallery-btn" @click="showGallery = true">
          <span class="gallery-icon">🖼️</span>
          оберіть модель з галереї
        </button>
        <input
          type="file"
          id="fileInput"
          ref="fileInput"
          accept=".glb,.gltf,.obj,.stl"
          hidden
          @change="handleFileSelect"
        />
      </div>
    </div>

   
    <div v-if="showGallery" class="gallery-modal">
      <div class="gallery-modal-content">
        <div class="gallery-modal-header">
          <h2>Галерея моделей</h2>
          <button class="close-btn" @click="showGallery = false">×</button>
        </div>
        <ModelGallery @model-selected="handleModelSelected" />
      </div>
    </div>

    <div class="header-container">
      
    </div>
    <section class="main-box">
      <div class="add-box">
        <div class="camera-position">
          Камера: X: {{ cameraPosition.x.toFixed(2) }}, 
          Y: {{ cameraPosition.y.toFixed(2) }}, 
          Z: {{ cameraPosition.z.toFixed(2) }}
        </div>
        <button class="settings-toggle" @click="menuOpen = !menuOpen" :class="{ active: menuOpen }">
          <span class="settings-icon">⚙️</span>
          <span class="settings-text">Налаштування</span>
        </button>
        <div id="scene-container" ref="sceneContainer">
          <div class="add-model-btn-canvas">
          </div>
          <div v-if="menuOpen" class="settings-panel">
            <div class="settings-menu">
              <h3>Налаштування моделі</h3>
              <div class="settings-group">
                <h4>Позиція</h4>
                <label>X: <input type="number" v-model="settings.positionX" step="0.1" /></label>
                <label>Y: <input type="number" v-model="settings.positionY" step="0.1" /></label>
                <label>Z: <input type="number" v-model="settings.positionZ" step="0.1" /></label>
              </div>

              <div class="settings-group">
                <h4>Обертання</h4>
                <label>X: <input type="number" v-model="settings.rotationX" step="0.1" /></label>
                <label>Y: <input type="number" v-model="settings.rotationY" step="0.1" /></label>
                <label>Z: <input type="number" v-model="settings.rotationZ" step="0.1" /></label>
              </div>

              <div class="settings-group">
                <h4>Масштаб</h4>
                <label>Масштаб: <input type="number" v-model="settings.scale" step="0.1" min="0.1" /></label>
              </div>

              <div class="settings-group">
                <h4>Відображення</h4>
                <label>
                  Текстури:
                  <input type="checkbox" v-model="settings.showTexture" />
                </label>
                <label>
                  Сітка:
                  <input type="checkbox" v-model="settings.showGrid" />
                </label>
                <label>
                  Осі:
                  <input type="checkbox" v-model="settings.showAxes" />
                </label>
              </div>

              <div class="settings-group">
                <h4>Колір фону</h4>
                <input type="color" v-model="settings.backgroundColor" />
              </div>

              <div class="settings-group">
                <h4>Керування</h4>
                <button @click="resetModel">Скинути модель</button>
                <button @click="resetCamera">Скинути камеру</button>
                <button @click="resetAll">Скинути все</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import ModelGallery from './ModelGallery.vue';
import axios from 'axios';
import { markRaw } from 'vue';

const props = defineProps({
  selectedModel: {
    type: Object,
    default: null
  },
  modelId: {
    type: String,
    default: null
  }
});

const sceneContainer = ref(null);
const fileInput = ref(null);
const dropZone = ref(null);

let scene, camera, renderer, controls;
const modelGroup = new THREE.Group();

const materialBackup = new Map();
 
const menuOpen = ref(false);
const showGallery = ref(false);

const settings = reactive({
  positionX: 0,
  positionY: 0,
  positionZ: 0,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  scale: 1,
  showTexture: true,
  showGrid: true,
  showAxes: true,
  backgroundColor: '#ffffff'
});

const cameraPosition = reactive({
  x: 60,
  y: 45,
  z: 60
});

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(settings.backgroundColor);

  const width = sceneContainer.value.clientWidth;
  const height = sceneContainer.value.clientHeight || window.innerHeight * 0.8;

  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(60, 45, 60);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  sceneContainer.value.appendChild(renderer.domElement);

  const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x888888);
  gridHelper.position.y = -5; 
  gridHelper.visible = settings.showGrid;
  scene.add(gridHelper);

  scene.add(modelGroup);
  const axesHelper = new THREE.AxesHelper(1000);
  axesHelper.visible = settings.showAxes;
  scene.add(axesHelper);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(2, 2, 5);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  animate();
  window.addEventListener('resize', handleResize);
}

function loadUserModel(file) {
  modelGroup.clear();
  modelGroup.position.set(0, 0, 0);
  modelGroup.rotation.set(0, 0, 0);
  modelGroup.scale.set(1, 1, 1);
  materialBackup.clear();

  const fileURL = URL.createObjectURL(file);
  const ext = file.name.split('.').pop().toLowerCase();

  const adjustModel = () => {
    const box = new THREE.Box3().setFromObject(modelGroup);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    modelGroup.children.forEach((child) => {
      if (child.geometry) {
        child.geometry.translate(-center.x, -center.y, -center.z);
      }
    });

    const maxSize = Math.max(size.x, size.y, size.z);
    const distance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
    const fovRadians = (camera.fov * Math.PI) / 180;
    const visibleHeight = 2 * Math.tan(fovRadians / 2) * distance;
    const targetSize = visibleHeight * 0.4;
    const scale = targetSize / maxSize;

    modelGroup.scale.setScalar(scale);
  };

  if (ext === 'glb' || ext === 'gltf') {
    const loader = new GLTFLoader();
    loader.load(fileURL, (gltf) => {
      gltf.scene.traverse((child) => {
        if (child.isMesh && child.material) {
          materialBackup.set(child.uuid, {
            map: child.material.map,
            material: child.material.clone(),
          });
        }
      });
      modelGroup.add(gltf.scene);
      adjustModel();
    });
  } else if (ext === 'stl') {
    const loader = new STLLoader();
    loader.load(fileURL, (geometry) => {
      const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
      const mesh = new THREE.Mesh(geometry, material);
      modelGroup.add(mesh);
      adjustModel();
    });
  } else if (ext === 'obj') {
    const loader = new OBJLoader();
    loader.load(fileURL, (obj) => {
      obj.traverse((child) => {
        if (child.isMesh) {
          materialBackup.set(child.uuid, {
            map: child.material.map,
            material: child.material.clone(),
          });
        }
      });
      modelGroup.add(obj);
      adjustModel();
    });
  }
}

function resetModel() {
  settings.positionX = 0;
  settings.positionY = 0;
  settings.positionZ = 0;
  settings.rotationX = 0;
  settings.rotationY = 0;
  settings.rotationZ = 0;
  settings.scale = 1;
  
  modelGroup.position.set(0, 0, 0);
  modelGroup.rotation.set(0, 0, 0);
  modelGroup.scale.set(1, 1, 1);
}

function resetCamera() {
  camera.position.set(60, 45, 60);
  camera.lookAt(0, 0, 0);
  controls.reset();
}

function resetAll() {
  resetModel();
  resetCamera();
  settings.showTexture = true;
  settings.showGrid = true;
  settings.showAxes = true;
  settings.backgroundColor = '#ff7272';
}

function handleResize() {
  if (!sceneContainer.value) return;
  const width = sceneContainer.value.clientWidth;
  const height = sceneContainer.value.clientHeight || window.innerHeight * 0.8;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  
  if (camera) {
    cameraPosition.x = camera.position.x;
    cameraPosition.y = camera.position.y;
    cameraPosition.z = camera.position.z;
  }
  
  renderer.render(scene, camera);
}

onMounted(() => {
  initScene();

  fileInput.value.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) loadUserModel(file);
  });

  dropZone.value.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.value.classList.add('dragover');
  });

  dropZone.value.addEventListener('dragleave', () => {
    dropZone.value.classList.remove('dragover');
  });

  dropZone.value.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.value.classList.remove('dragover');
    const file = event.dataTransfer.files[0];
    if (file && /\.(glb|gltf|obj|stl)$/i.test(file.name)) {
      loadUserModel(file);
    } else {
      alert('Please upload a valid GLB/GLTF/OBJ/STL file');
    }
  });
});

watch(settings, () => {
  modelGroup.position.set(settings.positionX, settings.positionY, settings.positionZ);
  
  modelGroup.rotation.set(
    THREE.MathUtils.degToRad(settings.rotationX),
    THREE.MathUtils.degToRad(settings.rotationY),
    THREE.MathUtils.degToRad(settings.rotationZ)
  );
  
  modelGroup.scale.setScalar(settings.scale);

  scene.background = new THREE.Color(settings.backgroundColor);

  scene.children.forEach(child => {
    if (child instanceof THREE.GridHelper) {
      child.visible = settings.showGrid;
    }
    if (child instanceof THREE.AxesHelper) {
      child.visible = settings.showAxes;
    }
  });

  modelGroup.traverse((child) => {
    if (child.isMesh && child.material) {
      const backup = materialBackup.get(child.uuid);

      if (!settings.showTexture) {
        if (backup && backup.map) {
          child.material.map = null;
          child.material.color = new THREE.Color('#cccccc');
          child.material.needsUpdate = true;
        }
      } else {
        if (backup && backup.map) {
          child.material.map = backup.map;
          child.material.color = new THREE.Color('#ffffff');
          child.material.needsUpdate = true;
        }
      }
    }
  });
}, { deep: true });


const handleModelSelected = async (model) => {
  try {
    if (!model || !model._id) {
      throw new Error('Invalid model data');
    }

    console.log('Attempting to load model:', {
      id: model._id,
      title: model.title,
      modelUrl: model.modelUrl
    });

    const response = await axios.get(`http://localhost:5000/api/items/${model._id}/model`, {
      responseType: 'blob',
      timeout: 30000, 
      headers: {
        'Accept': 'application/octet-stream'
      },
      
      withCredentials: true
    });
    
    console.log('Model response received:', {
      status: response.status,
      headers: response.headers,
      size: response.data.size
    });

    if (!response.data || response.data.size === 0) {
      throw new Error('Received empty model file');
    }

    const fileExtension = model.modelUrl.split('.').pop().toLowerCase();
    const mimeType = response.data.type || getMimeType(fileExtension);
    
    const file = new File([response.data], `${model.title}.${fileExtension}`, {
      type: mimeType
    });
    
    console.log('Created file object:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    loadUserModel(file);
    showGallery.value = false;
  } catch (error) {
    console.error('Error loading model from gallery:', {
      error,
      message: error.message,
      response: error.response,
      request: error.request
    });

    let errorMessage = 'Помилка при завантаженні моделі з галереї';
    
    if (error.response) {
   
      switch (error.response.status) {
        case 404:
          errorMessage = 'Модель не знайдена';
          break;
        case 500:
          errorMessage = 'Помилка сервера при завантаженні моделі';
          break;
        default:
          errorMessage = `Помилка ${error.response.status}: ${error.response.data?.message || 'Невідома помилка'}`;
      }
    } else if (error.request) {

      errorMessage = 'Не вдалося підключитися до сервера. Перевірте, чи запущений сервер.';
    } else {
 
      errorMessage = `Помилка: ${error.message}`;
    }
    
    alert(errorMessage);
  }
};


const getMimeType = (extension) => {
  const mimeTypes = {
    'glb': 'model/gltf-binary',
    'gltf': 'model/gltf+json',
    'obj': 'model/obj',
    'stl': 'model/stl'
  };
  return mimeTypes[extension] || 'application/octet-stream';
};


const loadModelFromUrl = (modelUrl) => {
  if (!modelUrl) return;

  const extension = modelUrl.split('.').pop().toLowerCase();
  let loader;

  switch (extension) {
    case 'glb':
    case 'gltf':
      loader = markRaw(new GLTFLoader());
      break;
    case 'obj':
      loader = markRaw(new OBJLoader());
      break;
    case 'stl':
      loader = markRaw(new STLLoader());
      break;
    default:
      console.error('Unsupported file format:', extension);
      return;
  }

  const fullUrl = `http://localhost:5000${modelUrl}`;
  console.log('Loading model from URL:', fullUrl);

  loader.load(
    fullUrl,
    (object) => {
      if (modelGroup) {
        scene.remove(modelGroup);
        if (modelGroup.children.length > 0) {
          modelGroup.children.forEach((child) => {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              child.material.dispose();
            }
          });
        }
      }

      let newModel;
      if (extension === 'glb' || extension === 'gltf') {
        newModel = markRaw(object.scene);
      } else if (extension === 'stl') {
        const material = markRaw(new THREE.MeshStandardMaterial({ 
          color: 0x808080,
          metalness: 0.5,
          roughness: 0.5
        }));
        newModel = markRaw(new THREE.Mesh(object, material));
      } else {
        newModel = markRaw(object);
      }

      modelGroup.add(newModel);

      const box = new THREE.Box3().setFromObject(newModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = (3 / maxDim) * 20;

      newModel.scale.multiplyScalar(scale);
      newModel.position.sub(center.multiplyScalar(scale));

      scene.add(modelGroup);

      camera.position.set(1, 0.75, 1.25);
      controls.reset();
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },
    (error) => {
      console.error('Error loading model:', error);
    }
  );
};


const loadModelById = async (id) => {
  if (!id) return;
  
  try {
    const response = await axios.get(`http://localhost:5000/api/items/${id}`);
    const model = response.data;
    loadModelFromUrl(model.modelUrl);
  } catch (error) {
    console.error('Error loading model by ID:', error);
  }
};


watch(() => props.selectedModel, (newModel) => {
  if (newModel) {
    loadModelFromUrl(newModel.modelUrl);
  }
}, { immediate: true });


watch(() => props.modelId, (newId) => {
  if (newId) {
    loadModelById(newId);
  }
}, { immediate: true });


</script>

<style scoped>
.model-viewer-container {
  width: 100%;
  height: 100%;
  
}

.back {
  padding: 2rem;
  border-radius: 15px;
  margin-bottom: 2rem;
  text-align: center;
}

#dropZone {
  border: 2px dashed #ff7272;
  border-radius: 8px;
  padding: 2rem;
  margin-top: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

#dropZone:hover, #dropZone.dragover {
  border-color: #ff5252;
  background: rgba(255, 114, 114, 0.05);
}

.labelito {
  color: #ff7272;
  text-decoration: underline;
  cursor: pointer;
  font-weight: 500;
}

.or-text {
  margin: 1rem 0;
  color: #666;
  font-size: 0.9rem;
}

.gallery-btn {
  background: #ff7272;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(255, 114, 114, 0.2);
}

.gallery-btn:hover {
  background: #ff5252;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 114, 114, 0.3);
}

.gallery-icon {
  font-size: 1.2rem;
}

.main-box {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
}

.add-box {
  position: relative;
  
}

.camera-position {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.settings-toggle {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.settings-toggle:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.settings-toggle.active {
  background: #ff7272;
}

.settings-icon {
  font-size: 1.2rem;
  transition: transform 0.3s;
}

.settings-toggle:hover .settings-icon {
  transform: rotate(45deg);
}

.settings-toggle.active .settings-icon {
  transform: rotate(180deg);
}

.settings-text {
  font-size: 0.9rem;
}

#scene-container {
  width: 100%;
  height: 600px;
  position: relative;
}

.add-model-btn-canvas {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
}

.add-model-btn {
  background: #a3a3a3;
  color: white;
  border: none;
  padding: 0.7rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(255, 114, 114, 0.2);
  transition: background 0.3s, transform 0.2s;
}
.add-model-btn:hover {
  background: #a3a3a3;
  transform: translateY(-2px);
}

.settings-panel {
  position: absolute;
  top: 4rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.7);
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.settings-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.settings-menu label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.settings-menu input[type="number"] {
  width: 80px;
  padding: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.settings-menu button {
  background: #919191;
  color: rgb(0, 0, 0);
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.settings-menu button:hover {
  background: #585858;
}

.settings-group {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #000000;
}

.settings-group:last-child {
  border-bottom: none;
}

.settings-group h4 {
  margin: 0 0 0.5rem 0;
  color: #000000;
  font-size: 0.9rem;
}

.settings-menu h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
}

.settings-menu button {
  width: 100%;
  margin-top: 0.5rem;
  background: #5f5f5f;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.settings-menu button:hover {
  background: #a3a3a3;
}

input[type="color"] {
  width: 100%;
  height: 30px;
  padding: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

input[type="number"] {
  width: 80px;
  padding: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.settings-panel {
  width: 300px;
  max-height: 80vh;
  overflow-y: auto;
}

.gallery-modal {
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

.gallery-modal-content {
  background: white;
  border-radius: 15px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.gallery-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid #eee;
}

.gallery-modal-header h2 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #ff7272;
}
</style> 