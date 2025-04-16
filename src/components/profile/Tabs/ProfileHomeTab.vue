<!-- components/profile/ProfileHomeTab.vue -->
<template>
  <div>
    <div v-if="isLoading" class="d-flex justify-center pa-6">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <div v-else-if="noContent" class="no-content-container">
      <div class="no-content-icon">
        <v-icon size="100" color="grey-darken-1">mdi-video-off</v-icon>
      </div>
      <div class="no-content-message">
        콘텐츠가 없습니다
      </div>
    </div>

    <div v-else class="home-content pa-4">
      <!-- 커뮤니티 게시물 섹션 -->
      <div v-if="recentPosts.length > 0" class="section mb-6">
        <div class="d-flex align-center justify-space-between mb-4">
          <h3>최근 게시물</h3>
          <v-btn
              variant="text"
              color="primary"
              size="small"
              @click="$emit('switch-tab', 'community')"
          >
            더보기
          </v-btn>
        </div>

        <v-row>
          <v-col
              v-for="post in recentPosts"
              :key="post.postId"
              cols="12"
              sm="6"
              md="4"
          >
            <post-card :post="post" @click="$emit('view-post', post.postId)" />
          </v-col>
        </v-row>
      </div>

      <!-- 비디오 섹션 -->
      <div v-if="recentVideos.length > 0" class="section mb-6">
        <div class="d-flex align-center justify-space-between mb-4">
          <h3>최근 동영상</h3>
          <v-btn
              variant="text"
              color="primary"
              size="small"
              @click="$emit('switch-tab', 'videos')"
          >
            더보기
          </v-btn>
        </div>

        <v-row>
          <v-col
              v-for="video in recentVideos"
              :key="video.id"
              cols="12"
              sm="6"
              md="4"
          >
            <video-card :video="video" @click="$emit('view-video', video.id)" />
          </v-col>
        </v-row>
      </div>

      <!-- 클립 섹션 -->
      <div v-if="recentClips.length > 0" class="section mb-6">
        <div class="d-flex align-center justify-space-between mb-4">
          <h3>인기 클립</h3>
          <v-btn
              variant="text"
              color="primary"
              size="small"
              @click="$emit('switch-tab', 'clips')"
          >
            더보기
          </v-btn>
        </div>

        <v-row>
          <v-col
              v-for="clip in recentClips"
              :key="clip.id"
              cols="12"
              sm="6"
              md="4"
          >
            <clip-card :clip="clip" @click="$emit('view-clip', clip.id)" />
          </v-col>
        </v-row>
      </div>
    </div>
  </div>
</template>

<script>
import PostCard from '../PostCard.vue';
import VideoCard from '../VideoCard.vue';
import ClipCard from '../ClipCard.vue';

export default {
  name: 'ProfileHomeTab',
  components: {
    PostCard,
    VideoCard,
    ClipCard
  },
  props: {
    recentPosts: {
      type: Array,
      default: () => []
    },
    recentVideos: {
      type: Array,
      default: () => []
    },
    recentClips: {
      type: Array,
      default: () => []
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    noContent() {
      return this.recentPosts.length === 0 &&
          this.recentVideos.length === 0 &&
          this.recentClips.length === 0;
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

.section h3 {
  font-size: 20px;
  color: #ffffff;
}
</style>