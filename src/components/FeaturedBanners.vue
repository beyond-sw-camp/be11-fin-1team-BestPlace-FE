<template>
  <v-carousel
      cycle
      show-arrows="hover"
      hide-delimiter-background
      delimiter-icon="mdi-circle"
      height="180"
      class="rounded mb-6"
  >
    <v-carousel-item
        v-for="(banner, i) in banners"
        :key="i"
        :src="banner.image"
        cover
    >
      <div class="d-flex flex-column justify-end fill-height pa-4">
        <div class="text-h6 text-white">{{ banner.title }}</div>
        <div class="text-subtitle-2 text-white">{{ banner.subtitle }}</div>
      </div>
    </v-carousel-item>
  </v-carousel>
</template>

<script>
export default {
  props: {
    banners: {
      type: Array,
      required: true
    }
  }
}
</script>
