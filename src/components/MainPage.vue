<template>
  <div class="main-landing">
    <div class="welcome-block">
      <h1>Ласкаво просимо до 3D Visualizer</h1>
      <p>Створюйте, переглядайте та діліться своїми 3D моделями</p>
      <button @click="startJourney" class="start-btn">Почати</button>
    </div>
    <div id="scene-container" ref="sceneContainer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const router = useRouter();
const sceneContainer = ref(null);
let scene, camera, renderer, controls;
const modelGroup = new THREE.Group();

const startJourney = () => {
  router.push('/register');
};

onMounted(() => {
  initScene();
  loadPreloadedModel();
});

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const width = sceneContainer.value.clientWidth;
  const height = sceneContainer.value.clientHeight;

  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(90, 75, 90);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  sceneContainer.value.appendChild(renderer.domElement);

  const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x888888);
  gridHelper.position.y = -5; 
  scene.add(gridHelper);

  scene.add(modelGroup);

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

function loadPreloadedModel() {
  const loader = new GLTFLoader();
  const url = new URL('../assets/models/default.glb', import.meta.url).href;

  modelGroup.clear();
  modelGroup.position.set(0, 0, 0);
  modelGroup.rotation.set(0, 0, 0);
  modelGroup.scale.set(1, 1, 1);

  loader.load(url, (gltf) => {
    modelGroup.add(gltf.scene);
    resetCanvas();
  }, undefined, (error) => {
    console.error('Error loading default model:', error);
  });
}

function resetCanvas() {
  const box = new THREE.Box3().setFromObject(modelGroup);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);
  modelGroup.position.sub(center);
  modelGroup.position.y -= box.min.y;
  const maxSize = Math.max(size.x, size.y, size.z);
  const distance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
  const fovRadians = (camera.fov * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(fovRadians / 2) * distance;
  const targetSize = visibleHeight * 0.8;
  const scale = targetSize / maxSize;
  modelGroup.scale.setScalar(scale);
}

function handleResize() {
  if (!sceneContainer.value) return;
  const width = sceneContainer.value.clientWidth;
  const height = sceneContainer.value.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
</script>

<style scoped>
.main-landing {
  min-height: calc(100vh - 4rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, #ffa751 0%, #ff7272 100%);
}

.welcome-block {
  position: absolute;
  top: 10vh;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: white;
  z-index: 10;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.welcome-block h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: bold;
}

.welcome-block p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.start-btn {
  background: white;
  color: #ff7272;
  border: none;
  padding: 1rem 3rem;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  background: #ff7272;
  color: white;
}

#scene-container {
  margin-top: 40vh;
  width: 30vw;
  height: 50vh;
  display: block;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}
</style> 