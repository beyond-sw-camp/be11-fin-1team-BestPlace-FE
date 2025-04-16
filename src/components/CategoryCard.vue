<template>
  <v-card class="category-card">
    <v-img :src="category.image" height="120" cover></v-img>
    <v-card-item>
      <v-card-title class="text-truncate" style="font-size: 14px;">{{ category.name }}</v-card-title>
      <v-card-subtitle>시청자 {{ category.viewers.toLocaleString() }}</v-card-subtitle>
    </v-card-item>
  </v-card>
</template>

<script>
export default {
  props: {
    category: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
.category-card {
  background-color: #1e2029;
  transition: transform 0.2s;
}
.category-card:hover {
  transform: translateY(-4px);
}
</style>
