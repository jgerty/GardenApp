<template>
  <div class="app-layout">
    <PlantPalette />
    <GardenGrid />
    <PlantDetailPanel />
  </div>
</template>

<script setup lang="ts">
import PlantPalette from './components/PlantPalette.vue'
import GardenGrid from './components/GardenGrid.vue'
import PlantDetailPanel from './components/PlantDetailPanel.vue'
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
</style>
