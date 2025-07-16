<script setup lang="ts">
import GitCommitsExtractor from './components/GitCommitsExtractor.vue'
</script>

<template>
  <GitCommitsExtractor />
</template>

<style scoped>
.minimal-app-bg {
  min-height: 100vh;
  background: #f6f8fa;
  display: flex;
  align-items: center;
  justify-content: center;
}
.extractor-center {
  width: 100%;
  max-width: 700px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
}
</style>
