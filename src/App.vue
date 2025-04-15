<template>
  <v-app>
    <HeaderComponent/>
    <v-main>
      <router-view/>
    </v-main>
    <FooterComponent/>
  </v-app>
  </template>

<script>
import HeaderComponent from './components/HeaderComponent.vue';
import FooterComponent from "./components/FooterComponent.vue";
export default{
  components : {
    FooterComponent,
    HeaderComponent
  }
}
</script>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');

body {
  font-family: 'Noto Sans KR', sans-serif;
}
</style>
