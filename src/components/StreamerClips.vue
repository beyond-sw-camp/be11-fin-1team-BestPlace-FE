<template>
  <div class="streamer-clips" v-if="clips.length > 0">
    <div class="clips-header">
      <div class="title-container">
        <h2 class="clips-title">이 채널의 클립</h2>
        <router-link :to="`/channel/${streamerId}/clips`" class="view-all">전체보기</router-link>
      </div>
    </div>
    
    <div v-if="loading" class="clips-loading">
      <div class="loading-spinner"></div>
      <p>클립을 불러오는 중...</p>
    </div>
    
    <div v-else class="clips-container" 
         @mouseenter="showNavButtons = true" 
         @mouseleave="showNavButtons = false">
      <button 
        v-if="showNavButtons && clipCurrentPage > 0" 
        class="nav-button prev-button" 
        @click="slideClipPrev">
        <v-icon>mdi-chevron-left</v-icon>
      </button>

      <div class="clips-slider" ref="clipsSlider">
        <div
          v-for="clip in visibleClips"
          :key="clip.id || clip.clipId"
          class="clip-item"
          @click="goToClipDetail(clip.id || clip.clipId)"
        >
          <div class="thumbnail-container">
            <div class="clip-badge">클립</div>
            <img
              :src="clip.thumbnailUrl"
              alt="Clip Thumbnail"
              class="thumbnail"
            >
            
            <!-- 텍스트 오버레이 -->
            <div class="clip-info-overlay">
              <div class="clip-meta">
                <div class="clip-title">{{ clip.title }}</div>
                <span class="view-count">
                  <v-icon size="x-small" class="mr-1">mdi-eye</v-icon>
                  {{ formatNumber(clip.views || 0) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button 
        v-if="showNavButtons && clipCurrentPage < maxPage" 
        class="nav-button next-button" 
        @click="slideClipNext">
        <v-icon>mdi-chevron-right</v-icon>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watchEffect, computed, onBeforeUnmount } from 'vue'
import axios from 'axios'

const props = defineProps({
  streamerId: {
    type: [String, Number],
    required: true
  },
  streamerName: {
    type: String,
    default: ''
  },
  limit: {
    type: Number,
    default: 8
  }
})

const clips = ref([])
const loading = ref(true)
const memberApi = process.env.VUE_APP_MEMBER_API

// 클립 관련 변수
const selectedClipPeriod = ref('ALL')
const selectedClipSort = ref('recent')
const clipCurrentPage = ref(0)
const clipsPerPage = 4
const showNavButtons = ref(false)
const clipsSlider = ref(null)

// 표시할 클립 목록 계산
const visibleClips = computed(() => {
  const startIdx = clipCurrentPage.value * clipsPerPage;
  return clips.value.slice(startIdx, startIdx + clipsPerPage);
})

// 최대 페이지 계산
const maxPage = computed(() => {
  return Math.ceil(clips.value.length / clipsPerPage) - 1;
})

const loadClips = async () => {
  try {
    loading.value = true
    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    
    // 최신순 엔드포인트로 변경
    const endpoint = selectedClipSort.value === 'views' 
      ? '/video/clip/list/streamer/views' 
      : '/video/clip/list/streamer/recent'
    
    const response = await axios.get(`${memberApi}${endpoint}`, {
      params: {
        streamerId: props.streamerId,
        page: 0,
        size: props.limit,
        periodType: selectedClipPeriod.value
      },
      headers
    })
    
    if (response.data && response.data.result && response.data.result.content) {
      clips.value = response.data.result.content.map(clip => ({
        ...clip,
        views: clip.views || 0,
        thumbnailUrl: clip.thumbnailUrl || ''
      }))
      clipCurrentPage.value = 0 // 페이지 리셋
    } else {
      clips.value = []
    }
  } catch (error) {
    console.error('클립 로드 실패:', error)
    clips.value = []
  } finally {
    loading.value = false
  }
}

// 클립 슬라이드 네비게이션
const slideClipNext = () => {
  if (clipCurrentPage.value < maxPage.value) {
    clipCurrentPage.value++;
  }
}

const slideClipPrev = () => {
  if (clipCurrentPage.value > 0) {
    clipCurrentPage.value--;
  }
}

// 숫자 포맷팅 (1000 -> 1,000)
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '만';
  }
  
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const goToClipDetail = (clipId) => {
  window.location.href = `/clip/${clipId}`
}

watchEffect(() => {
  if (props.streamerId) {
    loadClips()
  }
})

onMounted(() => {
  if (props.streamerId) {
    loadClips()
  }
})

// 컴포넌트 언마운트 시 정리 작업
onBeforeUnmount(() => {
  // 필요한 정리 작업이 있다면 여기에 구현
})
</script>

<style scoped>
.streamer-clips {
  background: #141517;
  padding: 24px;
  margin-top: 20px;
}

.clips-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.title-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.clips-title {
  font-size: 20px;
  font-weight: 500;
  color: #fff;
  margin: 0;
}

.view-all {
  color: #B084CC;
  font-size: 14px;
  font-weight: 500;
  margin-left: 10px;
  text-decoration: none;
  cursor: pointer;
}

.view-all:hover {
  text-decoration: underline;
}

.clips-container {
  position: relative;
  display: flex;
  align-items: center;
}

.clips-slider {
  display: flex;
  gap: 16px;
  overflow-x: hidden;
  width: 100%;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.clips-slider::-webkit-scrollbar {
  display: none;
}

.clip-item {
  flex: 0 0 calc(25% - 12px);
  cursor: pointer;
  overflow: hidden;
  background-color: #18191c;
  border-radius: 8px;
  position: relative;
}

.thumbnail-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  width: 100%;
  aspect-ratio: 3 / 5;
  background-color: #000;
}

.clip-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #E05C8C;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 3px;
  z-index: 2;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center center;
  background-color: #000;
}

.clip-info-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 2;
}

.clip-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clip-title {
  color: #ffffff;
  font-weight: 500;
  font-size: 14px;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  margin-right: 8px;
}

.view-count {
  display: flex;
  align-items: center;
  white-space: nowrap;
  color: #adb5bd;
  font-size: 12px;
}

.nav-button {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  z-index: 5;
}

.prev-button {
  left: -20px;
}

.next-button {
  right: -20px;
}

.clips-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #7B7B7B;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(176, 132, 204, 0.3);
  border-top-color: #B084CC;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style> 