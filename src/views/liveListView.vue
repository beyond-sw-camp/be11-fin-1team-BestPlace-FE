<template>
  <div class="live-list-container">
    <div class="live-header">
      <h1>전체 방송</h1>
      <div class="live-tabs">
        <button 
          :class="{ active: currentTab === 'popular' }" 
          @click="changeTab('popular')"
        >
          인기순
        </button>
        <button 
          :class="{ active: currentTab === 'recent' }" 
          @click="changeTab('recent')"
        >
          최신순
        </button>
      </div>
    </div>

    <div class="streams-grid">
      <router-link 
        v-for="stream in streams" 
        :key="stream.streamId"
        :to="'/live/' + stream.streamId"
        class="stream-card"
      >
        <div class="thumbnail-container">
          <img :src="stream.thumbnailUrl" :alt="stream.title" class="thumbnail">
          <div class="live-badge">LIVE</div>
          <div class="viewer-count">
            <span class="viewer-icon">👁</span>
            {{ stream.viewerCount }}명
          </div>
        </div>
        <div class="stream-info">
          <div class="streamer-info">
            <img :src="stream.streamerProfileUrl" :alt="stream.streamerNickname" class="streamer-avatar">
            <span class="stream-title">{{ stream.title }}</span>
          </div>
          <div class="stream-meta">
            <span class="streamer-name">{{ stream.streamerNickname }}</span>
            <span class="category">{{ stream.category }}</span>
          </div>
          <div class="hashtags" v-if="stream.hashTag && stream.hashTag.length > 0">
            <span v-for="tag in stream.hashTag" :key="tag" class="hashtag">#{{ tag }}</span>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const streamingApi = process.env.VUE_APP_STREAMING_API
const streams = ref([])
const currentTab = ref('popular')

const fetchStreams = async (type) => {
  try {
    const endpoint = type === 'popular' 
      ? '/streaming/streamListViewer'
      : '/streaming/streamListStartTime'
    
    const response = await axios.get(`${streamingApi}${endpoint}`)
    if (response.data && response.data.result) {
      streams.value = response.data.result.content
    }
  } catch (error) {
    console.error('방송 목록 로드 실패:', error)
  }
}

const changeTab = async (tab) => {
  currentTab.value = tab
  await fetchStreams(tab)
}

onMounted(async () => {
  await fetchStreams('popular')
})
</script>

<style scoped>
.live-list-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 24px;
  background: #0F0F0F;
  min-height: 100vh;
}

.live-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.live-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
}

.live-tabs {
  display: flex;
  gap: 16px;
}

.live-tabs button {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #7B7B7B;
  font-size: 16px;
  cursor: pointer;
  transition: color 0.2s;
}

.live-tabs button.active {
  color: #00E693;
  font-weight: 500;
}

.streams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.stream-card {
  text-decoration: none;
  color: inherit;
  background: #1A1A1A;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}

.stream-card:hover {
  transform: translateY(-4px);
}

.thumbnail-container {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 aspect ratio */
}

.thumbnail {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.live-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: #FF0000;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.viewer-count {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.viewer-icon {
  font-size: 14px;
}

.stream-info {
  padding: 16px;
}

.streamer-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.streamer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.stream-title {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.stream-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.streamer-name {
  color: #7B7B7B;
  font-size: 14px;
}

.category {
  color: #00E693;
  font-size: 14px;
  font-weight: 500;
}

.hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hashtag {
  color: #7B7B7B;
  font-size: 14px;
}
</style>
