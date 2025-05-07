<template>
  <div class="streamer-videos" v-if="videos.length > 0">
    <div class="videos-header">
      <div class="title-container">
        <h2 class="videos-title">이 채널의 동영상</h2>
        <router-link :to="`/channel/${streamerId}/videos`" class="view-all">전체보기</router-link>
      </div>
    </div>
    
    <div v-if="loading" class="videos-loading">
      <div class="loading-spinner"></div>
      <p>동영상을 불러오는 중...</p>
    </div>
    
    <div v-else class="videos-container" 
         @mouseenter="showNavButtons = true" 
         @mouseleave="showNavButtons = false">
      <button 
        v-if="showNavButtons && currentPage > 0" 
        class="nav-button prev-button" 
        @click="slidePrev">
        <v-icon>mdi-chevron-left</v-icon>
      </button>

      <div class="videos-slider" ref="videosSlider">
        <div
          v-for="(video, index) in visibleVideos"
          :key="video.id"
          class="video-item"
          @mouseenter="startPreviewTimer(index)"
          @mouseleave="stopPreview(index)"
          @click="goToVideoDetail(video.id)"
        >
          <div class="thumbnail-container">
            <div class="vod-badge">다시보기</div>
            <img
              :src="video.thumbnailUrl"
              alt="Video Thumbnail"
              class="thumbnail"
              :class="{'preview-loading': video.isPreviewLoading}"
            >
            <video
              v-if="video.showPreview && video.url"
              :src="video.url"
              class="video-preview"
              autoplay
              muted
              loop
            ></video>
            <div class="duration">{{ formatDuration(video.duration) }}</div>
          </div>

          <div class="video-info">
            <div class="video-title">{{ video.title }}</div>
            <div class="video-meta">
              <span class="view-count">조회수 {{ formatNumber(video.views || 0) }}회</span>
              <span class="dot-separator">·</span>
              <span class="video-time">{{ formatTime(video.createdTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <button 
        v-if="showNavButtons && currentPage < maxPage" 
        class="nav-button next-button" 
        @click="slideNext">
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

const videos = ref([])
const loading = ref(true)
const videoSortType = ref('recent')
const memberApi = process.env.VUE_APP_MEMBER_API

const currentPage = ref(0)
const videosPerPage = 2
const showNavButtons = ref(false)
const videosSlider = ref(null)

// 표시할 비디오 목록 계산
const visibleVideos = computed(() => {
  const startIdx = currentPage.value * videosPerPage;
  return videos.value.slice(startIdx, startIdx + videosPerPage);
})

// 최대 페이지 계산
const maxPage = computed(() => {
  return Math.ceil(videos.value.length / videosPerPage) - 1
})

const loadVideos = async () => {
  try {
    loading.value = true
    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    
    // 최신순 엔드포인트로 변경
    const url = `${memberApi}/video/vod/list/streamer/${videoSortType.value}`
    
    const response = await axios.get(url, {
      params: {
        streamerId: props.streamerId,
        page: 0,
        size: props.limit // 더 많은 데이터를 가져와서 슬라이더에 사용
      },
      headers
    })
    
    if (response.data && response.data.result && response.data.result.content) {
      console.log('Video API 응답 데이터:', response.data.result.content[0]);
      
      videos.value = response.data.result.content.map(video => {
        // 디버깅용 로그
        console.log(`Video ${video.id} duration:`, video.duration);
        
        return {
          ...video,
          showPreview: false,
          isPreviewLoading: false,
          hoverTimer: null,
          // duration 데이터 처리 개선
          duration: video.duration || 0,
        };
      });
      
      currentPage.value = 0 // 페이지 리셋
    } else {
      videos.value = []
    }
  } catch (error) {
    console.error('동영상 로드 실패:', error)
    videos.value = []
  } finally {
    loading.value = false
  }
}

// 슬라이드 네비게이션
const slideNext = () => {
  if (currentPage.value < maxPage.value) {
    currentPage.value++;
  }
}

const slidePrev = () => {
  if (currentPage.value > 0) {
    currentPage.value--;
  }
}

// 썸네일 미리보기 관련 메서드
const startPreviewTimer = (index) => {
  const video = visibleVideos.value[index];
  if (!video || !video.url) return;
  
  // 기존 타이머가 있으면 클리어
  if (video.hoverTimer) {
    clearTimeout(video.hoverTimer);
  }
  
  // 즉시 로딩 상태로 변경
  video.isPreviewLoading = true;
  
  // 0.5초 후에 미리보기 표시
  video.hoverTimer = setTimeout(() => {
    video.showPreview = true;
    video.isPreviewLoading = false;
  }, 500);
};

const stopPreview = (index) => {
  const video = visibleVideos.value[index];
  if (!video) return;
  
  // 타이머가 있으면 클리어
  if (video.hoverTimer) {
    clearTimeout(video.hoverTimer);
    video.hoverTimer = null;
  }
  
  // 미리보기 및 로딩 상태 숨김
  video.showPreview = false;
  video.isPreviewLoading = false;
};

const formatDuration = (seconds) => {
  if (seconds === undefined || seconds === null) return '0:00';
  
  // 문자열인 경우 처리
  if (typeof seconds === 'string') {
    // 이미 포맷팅된 형식(00:00:00)인지 확인
    if (seconds.includes(':')) {
      return seconds;
    }
    
    // 숫자 문자열로 파싱
    seconds = parseFloat(seconds);
  }
  
  if (isNaN(seconds)) return '0:00';
  
  // 소수점이 있는 경우 정수로 변환
  seconds = Math.floor(Number(seconds));
  
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '만';
  }
  
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}초 전`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}분 전`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  } else if (diffInSeconds < 604800) {
    return `${Math.floor(diffInSeconds / 86400)}일 전`;
  } else if (diffInSeconds < 2592000) {
    return `${Math.floor(diffInSeconds / 604800)}주 전`;
  } else if (diffInSeconds < 31536000) {
    return `${Math.floor(diffInSeconds / 2592000)}개월 전`;
  } else {
    return `${Math.floor(diffInSeconds / 31536000)}년 전`;
  }
}

const goToVideoDetail = (videoId) => {
  window.location.href = `/vod/${videoId}`
}

// 컴포넌트 언마운트 시 타이머 정리
const cleanupTimers = () => {
  videos.value.forEach(video => {
    if (video.hoverTimer) {
      clearTimeout(video.hoverTimer);
    }
  });
};

watchEffect(() => {
  if (props.streamerId) {
    loadVideos()
  }
})

onMounted(() => {
  if (props.streamerId) {
    loadVideos()
  }
})

// 컴포넌트 언마운트 시 타이머 정리
onBeforeUnmount(() => {
  cleanupTimers();
});
</script>

<style scoped>
.streamer-videos {
  background: #141517;
  padding: 24px;
  margin-top: 20px;
}

.videos-header {
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

.videos-title {
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

.videos-container {
  position: relative;
  display: flex;
  align-items: center;
}

.videos-slider {
  display: flex;
  gap: 16px;
  overflow-x: hidden;
  width: 100%;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.videos-slider::-webkit-scrollbar {
  display: none;
}

.video-item {
  flex: 0 0 calc(50% - 12px);
  cursor: pointer;
  overflow: hidden;
  background-color: #18191c;
  border-radius: 8px;
}

.thumbnail-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 8px 8px 0 0;
}

.vod-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #4b53e1;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 4px;
  z-index: 2;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.preview-loading {
  opacity: 0.7;
}

.video-preview {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 2;
}

.video-info {
  padding: 8px 12px 12px 12px;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  margin: 0;
}

.video-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #adb5bd;
  margin-top: 4px;
}

.dot-separator {
  color: #adb5bd;
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

.videos-loading {
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