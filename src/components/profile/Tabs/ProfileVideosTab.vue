<!-- components/profile/ProfileVideosTab.vue -->
<template>
  <div>
    <div v-if="isLoading" class="d-flex justify-center pa-6">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <div v-else-if="error" class="text-center pa-6">
      <v-alert type="error">{{ error }}</v-alert>
      <v-btn color="primary" @click="$emit('retry')" class="mt-4">다시 시도</v-btn>
    </div>

    <div v-else-if="videos.length === 0" class="no-content-container">
      <div class="no-content-icon">
        <v-icon size="100" color="grey-darken-1">mdi-video-off</v-icon>
      </div>
      <div class="no-content-message">
        영상이 하나도 없네요...
      </div>
      <v-btn color="primary" class="upload-btn" rounded>
        동영상 업로드
      </v-btn>
    </div>

    <div v-else class="videos-grid pa-4">
      <v-row>
        <v-col
            v-for="video in videos"
            :key="video.id"
            cols="12"
            sm="6"
            md="4"
        >
          <video-card :video="video" @click="$emit('view-video', video.id)" />
        </v-col>
      </v-row>

      <div v-if="hasMoreVideos" class="text-center mt-4">
        <v-btn variant="outlined" @click="$emit('load-more')" :loading="loadingMore">더 보기</v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import VideoCard from '../VideoCard.vue';

export default {
  name: 'ProfileVideosTab',
  components: {
    VideoCard
  },
  props: {
    videos: {
      type: Array,
      default: () => []
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: null
    },
    hasMoreVideos: {
      type: Boolean,
      default: false
    },
    loadingMore: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.no-content-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
  text-align: center;
}

.no-content-icon {
  margin-bottom: 20px;
}

.no-content-message {
  font-size: 18px;
  color: #c4bab4;
  margin-bottom: 30px;
}

.upload-btn {
  min-width: 180px;
  font-size: 16px;
  height: 48px;
}

.videos-grid {
  min-height: 300px;
}
</style>