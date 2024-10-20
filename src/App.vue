<script setup lang="ts">
import { RouterView } from 'vue-router'
import menuComp from '@/components/menu.vue';
</script>

<template>
  <div id="app-page">
    <router-view v-slot="{ Component }">
      <div class="layout-area">
        <menuComp></menuComp>
        <component :is="Component" />
      </div>
      
    </router-view>
  </div>
 
</template>

<style lang="scss" scoped>
#app-page {
  height: 100%;
  .layout-area {
    display: flex;
    widows: 100%;
    height: 100%;
  }
}
</style>
