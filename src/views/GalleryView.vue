<template>
  <div class="main-landing">
    <h1>Галерея моделей</h1>
  <div class="gallery-view">
    
    <ModelGallery @model-selected="handleModelSelected" />
  </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import ModelGallery from '../components/ModelGallery.vue';

const router = useRouter();

const handleModelSelected = (model) => {
  router.push({
    name: 'ModelViewer',
    params: { modelId: model._id }
  });
};
</script>

<style scoped>
.main-landing {
  min-height: calc(100vh - 4rem);
  background: linear-gradient(135deg, #ffa751 0%, #ff7272 100%);
}
.gallery-view {
  max-width: 80vw;
  margin: 0 auto;
  
  
  padding: 2rem;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
}

h1 {
  color: #ffffff;
  text-align: center;
  padding-top: 2rem;
  margin-bottom: 4rem;
  font-size: 2.5rem;
  
}
</style> 