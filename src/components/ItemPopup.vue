<template>
  <div class="popup-overlay" @click="closePopup">
    <div class="popup-content" @click.stop>
      <button class="close-btn" @click="closePopup">×</button>
      <div class="model-viewer" ref="container">
        <div class="camera-position">
          Камера: X: {{ cameraPos.x.toFixed(2) }}, 
          Y: {{ cameraPos.y.toFixed(2) }}, 
          Z: {{ cameraPos.z.toFixed(2) }}
        </div>
        <canvas ref="canvas"></canvas>
        <div class="loading-overlay" v-if="isLoading">
          Завантаження моделі...
        </div>
      </div>
      <div class="popup-actions">
        <button class="viewer-btn" @click="goToViewer">
          <span class="icon">👁️</span>
          Перейти до вьювера
        </button>
      </div>
      <p class="popup-description-big" v-html="item.description_big.replace(/\\n/g, '<br>')"></p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { markRaw } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close-popup', 'go-to-viewer']);

const container = ref(null);
const canvas = ref(null);
const scene = ref(null);
const camera = ref(null);
const renderer = ref(null);
const controls = ref(null);
const model = ref(null);
const isLoading = ref(true);
const animationFrameId = ref(null);

const cameraPos = ref({
  x: 1,
  y: 0.75,
  z: 1.25
});

const router = useRouter();

const closePopup = () => {
  cleanup();
  emit('close-popup');
};

const initThree = () => {
  scene.value = markRaw(new THREE.Scene());
  scene.value.background = new THREE.Color(0xf0f0f0);

  camera.value = markRaw(new THREE.PerspectiveCamera(
    75,
    container.value.clientWidth / container.value.clientHeight,
    0.1,
    1000
  ));
  camera.value.position.set(1, 0.75, 1.25);

  renderer.value = markRaw(new THREE.WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
    alpha: true
  }));
  renderer.value.setSize(
    container.value.clientWidth,
    container.value.clientHeight
  );
  renderer.value.setPixelRatio(window.devicePixelRatio);
  renderer.value.outputEncoding = THREE.sRGBEncoding;

  const ambientLight = markRaw(new THREE.AmbientLight(0xffffff, 0.5));
  scene.value.add(ambientLight);

  const directionalLight = markRaw(new THREE.DirectionalLight(0xffffff, 1));
  directionalLight.position.set(0, 1, 0);
  scene.value.add(directionalLight);

  controls.value = markRaw(new OrbitControls(camera.value, renderer.value.domElement));
  controls.value.enableDamping = true;
  controls.value.dampingFactor = 0.05;
  controls.value.enableZoom = true;
  controls.value.enablePan = true;

  loadModel();

  window.addEventListener('resize', onWindowResize);

  animate();
};

const loadModel = () => {
  console.log('ItemPopup received item:', props.item);
  
  if (!props.item) {
    console.error('No item provided');
    isLoading.value = false;
    return;
  }

  // Use modelUrl property
  const modelFile = props.item.modelUrl;
  
  if (!modelFile) {
    console.error('No model file found in item:', props.item);
    isLoading.value = false;
    return;
  }

  const extension = modelFile.split('.').pop().toLowerCase();
  console.log('Model file extension:', extension);
  
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
      isLoading.value = false;
      return;
  }

  const modelUrl = `http://localhost:5000${modelFile}`;
  console.log('Loading model from URL:', modelUrl);
  
  loader.load(
    modelUrl,
    (object) => {
      if (model.value) {
        scene.value.remove(model.value);
        if (model.value.geometry) {
          model.value.geometry.dispose();
        }
        if (model.value.material) {
          model.value.material.dispose();
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

      model.value = newModel;

      const box = new THREE.Box3().setFromObject(newModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3 / maxDim;

      newModel.scale.multiplyScalar(scale);
      newModel.position.sub(center.multiplyScalar(scale));

      scene.value.add(newModel);

      camera.value.position.set(1, 0.75, 1.25);
      controls.value.reset();

      isLoading.value = false;
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },
    (error) => {
      console.error('Error loading model:', error);
      isLoading.value = false;
    }
  );
};

const animate = () => {
  if (!renderer.value || !scene.value || !camera.value) return;

  animationFrameId.value = requestAnimationFrame(animate);

  if (controls.value) {
    controls.value.update();
  }

  cameraPos.value.x = camera.value.position.x;
  cameraPos.value.y = camera.value.position.y;
  cameraPos.value.z = camera.value.position.z;

  try {
    renderer.value.render(scene.value, camera.value);
  } catch (error) {
    console.error('Render error:', error);
    cancelAnimationFrame(animationFrameId.value);
  }
};

const onWindowResize = () => {
  if (camera.value && renderer.value && container.value) {
    camera.value.aspect = container.value.clientWidth / container.value.clientHeight;
    camera.value.updateProjectionMatrix();
    renderer.value.setSize(
      container.value.clientWidth,
      container.value.clientHeight
    );
  }
};

const cleanup = () => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value);
  }

  if (controls.value) {
    controls.value.dispose();
  }

  if (model.value) {
    scene.value.remove(model.value);
    if (model.value.geometry) {
      model.value.geometry.dispose();
    }
    if (model.value.material) {
      model.value.material.dispose();
    }
  }

  if (renderer.value) {
    renderer.value.dispose();
  }

  window.removeEventListener('resize', onWindowResize);
};

const goToViewer = () => {
  router.push({ name: 'ModelViewer', params: { modelId: props.item._id } });
  closePopup();
};

onMounted(() => {
  initThree();
});

onBeforeUnmount(() => {
  cleanup();
});
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.popup-content {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 10px;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #b40000;
  z-index: 1;
}

.model-viewer {
  width: 100%;
  height: 400px;
  position: relative;
  background-color: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  margin: 20px 0;
}

.model-viewer canvas {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(240, 240, 240, 0.8);
  font-size: 1.2rem;
  color: #666;
}

.popup-description-big {
  font-size: 1rem;
  color: #666;
  margin-top: 20px;
  white-space: pre-line;
  word-break: break-word;
}

.camera-position {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 8px 12px;
  border-radius: 8px;
  color: #b40000;
  font-weight: bold;
  font-size: 0.9em;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.popup-actions {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.viewer-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #ffa751 0%, #ff7272 100%);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.viewer-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 114, 114, 0.2);
}

.viewer-btn .icon {
  font-size: 1.2rem;
}
</style> 