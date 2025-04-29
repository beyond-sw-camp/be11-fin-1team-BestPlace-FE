<template>
    <div class="tab-content">
    <div v-if="isLoading" class="loading-container">
      <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
      <p>데이터를 불러오는 중...</p>
    </div>
    
    <div v-else-if="isLive && streamInfo && streamingId" class="live-section">
      <div class="video-container" @click="goToLiveDetail">
        <video
          ref="videoPlayer"
          autoplay
          muted
          playsinline
          class="video-player"
        ></video>
        
        <!-- 비디오 위 오버레이 -->
        <div class="video-overlay">
          <div class="overlay-content">
            <div class="overlay-top">
              <div class="live-badge">
                <span class="live-dot"></span>
                LIVE
              </div>
              <div class="viewer-count">
                {{ streamInfo.viewerCount }}명 시청중
              </div>
            </div>
            
            <div class="overlay-bottom">
              <h2 class="live-title">{{ streamInfo.title }}</h2>
              <div class="stream-meta">
                <span 
                  class="category"
                  @click.stop="goToCategory(streamInfo.category)"
                >{{ streamInfo.category }}</span>
              </div>
              <div class="hashtags" v-if="streamInfo.hashTag && streamInfo.hashTag.length > 0">
                <span v-for="tag in streamInfo.hashTag" :key="tag" class="hashtag">{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else-if="!isLive && vodInfo" class="vod-section">
      <div class="vod-card" @click="goToVodDetail(vodInfo.id)">
        <div class="vod-thumbnail-wrapper">
          <img :src="vodInfo.thumbnailUrl" alt="VOD 썸네일" class="vod-thumbnail" />
          <div class="vod-badge">다시보기</div>
        </div>
        <div class="vod-info">
          <div class="vod-meta-top">
            <span class="vod-recommend">추천영상</span>
          </div>
          <div class="vod-title">{{ vodInfo.title }}</div>
          <div class="vod-meta-bottom">
            <span class="vod-views">조회수 {{ vodInfo.views }}회</span>
            <span class="vod-dot">·</span>
            <span class="vod-date">{{ formatRelativeTime(vodInfo.createdTime) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 배너 섹션 추가 -->
    <div v-if="banners && banners.length > 0" class="banner-section">
      <div class="banner-container">
        <div 
          v-for="banner in banners" 
          :key="banner.id" 
          class="banner-item"
          @click="goToBanner(banner.bannerUrl)"
        >
          <div class="banner-image-wrapper">
            <img :src="banner.imageUrl" :alt="banner.title" class="banner-image" />
          </div>
          <div class="banner-title">{{ banner.title }}</div>
        </div>
      </div>
    </div>
    </div>
  </template>
  
  <script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Hls from 'hls.js';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

// 부모에서 streamerInfo를 props로 받음
const props = defineProps({
  streamerInfo: {
    type: Object,
    default: () => ({})
  }
});

// 상태
const isLoading = ref(true);
const streamingId = ref(null);
const streamInfo = ref({});
const videoPlayer = ref(null);
const hlsInstance = ref(null);
const hlsRetryCount = ref(0);
const MAX_HLS_RETRIES = 3;
const vodInfo = ref(null);
const banners = ref(null);

// 라이브 여부는 streamerInfo.streamingYn으로 판단
const isLive = computed(() => props.streamerInfo?.streamingYn === 'Y');

// 스트리밍 정보 가져오기
const fetchStreamingInfo = async () => {
  try {
    isLoading.value = true;
    const streamerId = route.params.memberId;
    if (!streamerId) return;
    
    // 먼저 스트리밍 ID 가져오기
    const streamingApi = process.env.VUE_APP_STREAMING_API;
    let response = await axios.get(`${streamingApi}/streaming/find/streamId/${streamerId}`);
    
    if (response.status === 200 && response.data && response.data.result) {
      streamingId.value = response.data.result;
      
      // 스트리밍 ID가 있으면 상세 정보 가져오기
      response = await axios.get(`${streamingApi}/streaming/streamInfo/${streamingId.value}`);
      
      if (response.data && response.data.result) {
        streamInfo.value = response.data.result;
        isLive.value = true;
        
        // 비디오 플레이어 초기화
        setTimeout(() => {
          initializeVideoPlayer();
        }, 500);
      } else {
        isLive.value = false;
      }
    } else {
      isLive.value = false;
    }
  } catch (error) {
    console.error('스트리밍 정보 가져오기 실패:', error);
    isLive.value = false;
  } finally {
    isLoading.value = false;
  }
};

// 비디오 플레이어 초기화
const initializeVideoPlayer = () => {
  if (!streamInfo.value.streamKey) {
    console.error('스트림 키가 없습니다.');
    return;
  }
  
  const video = videoPlayer.value;
  if (!video) {
    console.error('비디오 요소를 찾을 수 없습니다.');
    return;
  }
  
  // HLS 소스 URL
  // 배포용
  // const hlsSrc = `https://hls.bepl.site/hls/${streamInfo.value.streamKey}.m3u8`;
  // 로컬용
  const hlsSrc = `http://localhost:8088/hls/${streamInfo.value.streamKey}.m3u8`;
  console.log('HLS 소스:', hlsSrc);
  
  // HLS.js 지원 확인
  if (Hls.isSupported()) {
    if (hlsInstance.value) {
      hlsInstance.value.destroy();
    }
    
    hlsInstance.value = new Hls({
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      manifestLoadingTimeOut: 10000,
      manifestLoadingMaxRetry: 5,
      levelLoadingTimeOut: 10000,
      levelLoadingMaxRetry: 4
    });
    
    hlsInstance.value.attachMedia(video);
    hlsInstance.value.loadSource(hlsSrc);
    
    hlsInstance.value.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log('매니페스트 파싱 완료, 재생 시도');
      video.play().catch(err => console.error('비디오 재생 실패:', err));
    });
    
    hlsInstance.value.on(Hls.Events.ERROR, (event, data) => {
      console.warn('HLS 에러 발생:', data);
      
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.error('네트워크 에러, 재시도 중...', data);
            hlsInstance.value.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.error('미디어 에러, 복구 시도 중...', data);
            hlsInstance.value.recoverMediaError();
            break;
          default:
            console.error('복구 불가능한 에러:', data);
            destroyVideoPlayer();
            
            // 최대 재시도 횟수 내에서만 재시도
            if (hlsRetryCount.value < MAX_HLS_RETRIES) {
              hlsRetryCount.value++;
              console.log(`재시도 ${hlsRetryCount.value}/${MAX_HLS_RETRIES}`);
              setTimeout(() => {
                initializeVideoPlayer();
              }, 2000);
            }
            break;
        }
      }
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // HLS.js를 지원하지 않는 iOS Safari용
    video.src = hlsSrc;
    video.addEventListener('loadedmetadata', () => {
      video.play().catch(err => console.error('비디오 재생 실패:', err));
    });
  } else {
    console.error('HLS를 지원하지 않는 브라우저입니다.');
  }
  
  // 항상 음소거 설정
  video.volume = 0;
  video.muted = true;
};

// 비디오 플레이어 정리
const destroyVideoPlayer = () => {
  if (hlsInstance.value) {
    hlsInstance.value.destroy();
    hlsInstance.value = null;
  }
  
  if (videoPlayer.value) {
    videoPlayer.value.removeAttribute('src');
    videoPlayer.value.load();
  }
};

// 라이브 디테일 페이지로 이동
const goToLiveDetail = () => {
  if (streamingId.value) {
    router.push(`/live/${streamingId.value}`);
  }
};

// 카테고리 페이지로 이동
const goToCategory = (category) => {
  if (category) {
    router.push(`/category/${category}`);
  }
};

// VOD 정보 가져오기
const fetchVodInfo = async () => {
  try {
    const streamerId = route.params.memberId;
    if (!streamerId) return;
    const memberApiUrl = process.env.VUE_APP_MEMBER_API;
    const response = await axios.get(`${memberApiUrl}/video/vod/streamer/recent-one`, {
      params: { streamerId }
    });
    if (response.data && response.data.result) {
      vodInfo.value = response.data.result;
    } else {
      vodInfo.value = null;
    }
  } catch (error) {
    console.error('VOD 정보 가져오기 실패:', error);
    vodInfo.value = null;
  }
};

// 배너 정보 가져오기
const fetchBanners = async () => {
  try {
    const streamerId = route.params.memberId;
    if (!streamerId) return;
    const memberApiUrl = process.env.VUE_APP_MEMBER_API;
    const response = await axios.get(`${memberApiUrl}/member/banner`, {
    params: { memberId: streamerId }
    });
    if (response.data && response.data.result) {
      banners.value = response.data.result;
    } else {
      banners.value = null;
    }
  } catch (error) {
    console.error('배너 정보 가져오기 실패:', error);
    banners.value = null;
  }
};

// VOD 상세로 이동
const goToVodDetail = (id) => {
  if (id) {
    router.push(`/vod/${id}`);
  }
};

// 배너 링크로 이동
const goToBanner = (url) => {
  if (url) {
    // URL이 http:// 또는 https://로 시작하는지 확인
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = 'https://' + url;
    }
    // 절대 URL로 새 탭에서 열기
    window.open(fullUrl, '_blank');
  }
};

// VOD 상대시간 포맷 함수 추가
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diff = (now - date) / 1000; // 초 단위
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
  return dateString.split('T')[0];
}

// streamInfo 변경 시 비디오 플레이어 재초기화
watch(() => streamInfo.value, (newVal) => {
  if (newVal && newVal.streamKey) {
    destroyVideoPlayer();
    setTimeout(() => {
      initializeVideoPlayer();
    }, 500);
  }
});

onMounted(async () => {
  await fetchStreamingInfo();
  
  if (!isLive.value) {
    await fetchVodInfo();
  }
  
  // 배너 정보 가져오기
  await fetchBanners();
  
  isLoading.value = false;
});

onBeforeUnmount(() => {
  destroyVideoPlayer();
});
  </script>
  
  <style scoped>
  .tab-content {
    padding: 0;
  margin-top: 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 16px;
}

.live-section {
  margin-bottom: 24px;
}

.video-container {
  position: relative;
  width: 100%;
  padding-top: 36%; /* 세로 비율 약간 늘림 */
  background-color: #000;
  margin-bottom: 16px;
  overflow: hidden;
  cursor: pointer;
}

.video-player {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* 비디오 비율 유지하며 컨테이너 채우기 */
  opacity: 0.8; /* 비디오 살짝 불투명하게 */
}

/* 비디오 위에 오버레이 */
.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.7) 100%);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
}

.overlay-content {
  width: 100%;
  height: 100%;
  padding: 24px 32px 16px 32px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
}

.overlay-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: #ff3b3b;
  color: white;
  font-size: 16px;
  font-weight: bold;
  padding: 4px 14px 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.live-dot {
  width: 10px;
  height: 10px;
  background: #fff;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

.viewer-count {
  font-size: 18px;
  font-weight: 700;
  color: #ff3b3b;
  margin-left: 8px;
  letter-spacing: -1px;
}

.live-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 18px 0;
  color: #fff;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.25;
  word-break: keep-all;
}

.overlay-bottom {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.stream-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 0;
}

.category {
  color: #B084CC;
  font-weight: 800;
  font-size: 18px;
  background: none;
  padding: 0;
  border-radius: 0;
  cursor: pointer;
  margin-right: 8px;
}

.category:hover {
  text-decoration: underline;
}

.dot {
  color: #7B7B7B;
  margin: 0 2px;
}

.hashtags {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.hashtag {
  color: #bfc2c7;
  font-size: 14px;
  font-weight: 600;
  padding: 2px 10px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
}

.vod-section {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  min-height: 220px;
  padding: 0;
}

.vod-card {
  display: flex;
  align-items: flex-start;
  background: #18191c;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.12);
  cursor: pointer;
  width: 100%;
  max-width: 100%;
  transition: box-shadow 0.2s;
  min-height: 220px;
  position: relative;
}

.vod-card:hover {
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
}

.vod-thumbnail-wrapper {
  position: relative;
  width: 450px;
  min-width: 350px;
  height: 220px;
  background: #222;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vod-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0;
}

.vod-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: #4b53e1;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 6px;
  z-index: 2;
  letter-spacing: -1px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

.vod-info {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 12px 24px;
  min-width: 0;
  width: 100%;
  height: 100%;
  position: relative;
}

.vod-meta-top {
  position: absolute;
  top: 12px;
  left: 24px;
  margin: 0;
}

.vod-recommend {
  background: #e5e5e5;
  color: #222;
  font-size: 14px;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 6px;
  margin-right: 8px;
  letter-spacing: -1px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

.vod-title {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  margin-top: 48px;
  margin-bottom: 12px;
  line-height: 1.3;
  word-break: keep-all;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.15);
}

.vod-meta-bottom {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #bfc2c7;
  font-size: 14px;
  font-weight: 600;
}

.vod-dot {
  color: #bfc2c7;
  font-size: 16px;
  margin: 0 4px;
}

/* 배너 섹션 스타일 */
.banner-section {
  margin-top: 36px;
  margin-bottom: 24px;
}

.banner-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: flex-start;
}

.banner-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  width: 120px;
  transition: transform 0.2s;
}

.banner-item:hover {
  /* 호버링 효과 제거 */
}

.banner-image-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background: #18191c;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-title {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
  </style>