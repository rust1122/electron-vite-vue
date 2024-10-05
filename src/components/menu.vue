<template>
  <div id="menu-comp">
      <Menu :model="items" @click="onClick(e)"/>
  </div>
</template>

<script setup lang='ts'>
import { ref } from "vue";
import Menu from 'primevue/menu'

const items = ref([
    { label: 'New', icon: 'pi pi-plus' },
    { label: 'Search', icon: 'pi pi-search' }
]);

const onClick = (e)=> {

}
</script>

<style lang="scss" scoped>
</style>