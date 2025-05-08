<template>
  <div class="transparent-layout">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'TransparentLayout'
}
</script>

<style scoped>
.transparent-layout {
  width: 100%;
  height: 100vh;
  background-color: transparent;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>

<style>
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: transparent !important;
}

.v-application {
  background-color: transparent !important;
}
</style> 