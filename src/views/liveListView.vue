<template>
  <div class="live-list-container">
    <div class="live-header">
      <h1 class="header-title">전체 방송</h1>
      <div class="header-tabs">
        <div class="content-tabs">
          <button 
            :class="{ active: currentContentType === 'live' }" 
            @click="currentContentType = 'live'"
          >
            라이브
          </button>
          <button 
            :class="{ active: currentContentType === 'video' }" 
            @click="currentContentType = 'video'"
            disabled
          >
            동영상
          </button>
        </div>
        <div class="sort-tabs">
          <button 
            :class="{ active: currentTab === 'popular' }" 
            @click="changeTab('popular')"
          >
            인기
          </button>
          <button 
            :class="{ active: currentTab === 'recent' }" 
            @click="changeTab('recent')"
          >
            최신
          </button>
        </div>
      </div>
    </div>

    <div class="streams-grid">
      <div 
        v-for="stream in streams" 
        :key="stream.streamId"
        class="stream-card"
      >
        <div class="thumbnail-container" @click="goToLiveDetail(stream.streamId)">
          <img 
            :src="stream.thumbnailUrl + '?ts=' + Date.now()" 
            :alt="stream.title" 
            class="thumbnail"
            :class="{ 'darken': isHovered === stream.streamId }"
            @mouseover="isHovered = stream.streamId"
            @mouseleave="isHovered = null"
          >
          <div class="live-badge">LIVE</div>
          <div class="viewer-count">
            <span class="viewer-icon">👁</span>
            {{ stream.viewerCount }}명
          </div>
        </div>
        <div class="stream-info">
          <div class="streamer-info">
            <img 
              :src="stream.streamerProfileUrl" 
              :alt="stream.streamerNickname" 
              class="streamer-avatar"
              @click="goToStreamerProfile(stream.streamerId)"
            >
            <div class="streamer-details">
              <div 
                class="stream-title"
                @click="goToLiveDetail(stream.streamId)"
              >{{ stream.title }}</div>
              <div 
                class="streamer-name"
                @click="goToStreamerProfile(stream.streamerId)"
              >{{ stream.streamerNickname }}</div>
            </div>
          </div>
          <div class="stream-meta">
            <span 
              class="category"
              @click="goToCategory(stream.category)"
            >{{ stream.category }}</span>
            <div class="hashtags" v-if="stream.hashTag && stream.hashTag.length > 0">
              <span v-for="tag in stream.hashTag" :key="tag" class="hashtag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const streamingApi = process.env.VUE_APP_STREAMING_API
const streams = ref([])
const currentTab = ref('popular')
const currentContentType = ref('live')
const isHovered = ref(null)

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

const goToLiveDetail = (streamId) => {
  router.push(`/live/${streamId}`)
}

const goToStreamerProfile = (streamerId) => {
  router.push(`/streamer/${streamerId}`)
}

const goToCategory = (category) => {
  router.push(`/category/${category}`)
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
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.header-title {
  color: #fff;
  font-size: 24px;
  font-weight: 600;
}

.header-tabs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.content-tabs {
  display: flex;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #2c2c2c;
}

.sort-tabs {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.content-tabs button {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #7B7B7B;
  font-size: 16px;
  cursor: pointer;
  transition: color 0.2s;
}

.sort-tabs button {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background: #2c2c2c;
  color: #7B7B7B;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.content-tabs button.active {
  color: #fff;
  font-weight: 500;
  position: relative;
}

.content-tabs button.active::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #B084CC;
}

.sort-tabs button.active {
  background: #B084CC;
  color: #fff;
}

.content-tabs button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.streams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.stream-card {
  background: #1A1A1A;
  border-radius: 8px;
  overflow: hidden;
}

.thumbnail-container {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 aspect ratio */
  cursor: pointer;
}

.thumbnail {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.3s ease;
}

.thumbnail.darken {
  filter: brightness(0.5);
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

.stream-info {
  padding: 16px;
}

.streamer-info {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.streamer-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

.streamer-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0; /* 텍스트 오버플로우 방지 */
}

.stream-title {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  cursor: pointer;
}

.streamer-name {
  color: #7B7B7B;
  font-size: 14px;
  cursor: pointer;
}

.stream-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category {
  color: #00E693;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
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
