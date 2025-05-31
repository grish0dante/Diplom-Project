<template>
  <div class="model-viewer-view">
    <ModelViewer :modelId="$route.params.modelId" />
  </div>
</template>

<script setup>
import ModelViewer from '../components/ModelViewer.vue';
</script>

<style scoped>
.model-viewer-view {
  width: 100%;
  height: calc(100vh - 64px);
}
</style> 