<template>
  <v-card class="stream-card">
    <div class="position-relative">
      <v-img :src="stream.thumbnail" height="160" cover></v-img>
      <div class="position-absolute pa-2" style="bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center;">
        <div class="live-badge">LIVE</div>
        <div class="viewer-count">
          <v-icon size="small" class="mr-1">mdi-eye</v-icon>
          {{ stream.viewerCount.toLocaleString() }}
        </div>
      </div>
    </div>
    <v-card-item>
      <div class="d-flex align-center mb-2">
        <v-avatar size="36" class="mr-3">
          <v-img :src="stream.streamerAvatar"></v-img>
        </v-avatar>
        <div>
          <v-card-title class="pa-0 text-truncate" style="font-size: 16px;">{{ stream.title }}</v-card-title>
          <v-card-subtitle class="pa-0 text-truncate">{{ stream.streamerName }}</v-card-subtitle>
        </div>
      </div>
      <div class="d-flex mt-2 flex-wrap">
        <span v-for="(tag, tagIndex) in stream.tags" :key="tagIndex" class="stream-tag mr-1 mb-1">
          {{ tag }}
        </span>
      </div>
    </v-card-item>
  </v-card>
</template>

<script>
export default {
  props: {
    stream: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
.stream-card {
  background-color: #1e2029;
  transition: transform 0.2s;
}
.stream-card:hover {
  transform: translateY(-4px);
}
.position-relative {
  position: relative;
}
.position-absolute {
  position: absolute;
}
.live-badge {
  background-color: #c82c35;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}
.viewer-count {
  font-size: 12px;
  color: #c4bab4;
}
.stream-tag {
  background-color: rgba(255, 255, 255, 0.1);
  color: #c4bab4;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}
</style>
