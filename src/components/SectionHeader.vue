<template>
  <div class="d-flex align-center justify-space-between" :class="spacing">
    <h2>{{ title }}</h2>
    <v-btn v-if="showMore" variant="text" color="primary" size="small" @click="$emit('more')">
      더보기 <v-icon right>mdi-chevron-right</v-icon>
    </v-btn>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true
    },
    showMore: {
      type: Boolean,
      default: true
    },
    spacing: {
      type: String,
      default: 'mb-4'
    }
  }
}
</script>
