<template>
    <div class="tab-content">
    <div v-if="isLoading" class="loading-container">
      <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
      <p>데이터를 불러오는 중...</p>
    </div>
    
    <template v-else>
      <!-- 모든 컨텐츠가 없을 때 빈 상태 UI 표시 -->
      <div v-if="!hasContent" class="empty-home-state">
        <div class="empty-home-content">
          <v-icon size="80" color="#444">mdi-home-variant-outline</v-icon>
          <h3 class="empty-home-title">아직 컨텐츠가 없습니다</h3>
          <p class="empty-home-text">라이브 방송, 동영상 또는 클립이 등록되면 이곳에 표시됩니다</p>
        </div>
      </div>

      <!-- 컨텐츠가 있을 때 해당 섹션 표시 -->
      <template v-else>
        <div v-if="isLive && streamInfo && streamingId" class="live-section">
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
            </div>
          </div>
        </div>

        <!-- 동영상 섹션 추가 -->
        <div v-if="videos.length > 0" class="recent-videos-section">
          <div class="section-header">
            <div class="title-container">
              <h2 class="section-title">동영상</h2>
              <span class="view-all" @click="goToVideosTab">더보기</span>
            </div>
            <div class="video-filters">
              <button
                :class="{ active: videoSortType === 'views' }"
                @click="changeVideoSort('views')"
              >
                인기순
              </button>
              <button
                :class="{ active: videoSortType === 'recent' }"
                @click="changeVideoSort('recent')"
              >
                최신순
              </button>
            </div>
          </div>

          <div class="videos-container" 
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
                    :class="{
                      'blur-thumbnail': isAdultContent(video) && userIsAdult,
                      'hide-thumbnail': isAdultContent(video) && !userIsAdult
                    }"
                  >
                  <video
                    v-if="video.showPreview && video.url && !isAdultContent(video)"
                    :src="video.url"
                    class="video-preview"
                    autoplay
                    muted
                    loop
                  ></video>
                  <div class="duration">{{ video.duration }}</div>

                  <!-- 연령 제한 표시 -->
                  <div v-if="isAdultContent(video)" class="age-restriction-overlay">
                    <div class="age-restriction-content">
                      <div class="age-icon-circle">19</div>
                      <div class="age-text">연령 제한</div>
                    </div>
                  </div>
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
              v-if="showNavButtons && currentPage < Math.ceil(videos.length / videosPerPage) - 1" 
              class="nav-button next-button" 
              @click="slideNext">
              <v-icon>mdi-chevron-right</v-icon>
            </button>
          </div>
        </div>

        <!-- 클립 섹션 추가 -->
        <div v-if="clips.length > 0" class="clips-section">
          <div class="section-header">
            <div class="title-container">
              <h2 class="section-title">클립</h2>
              <span class="view-all" @click="goToClipsTab">더보기</span>
            </div>
          </div>

          <!-- 필터 버튼 -->
          <div class="clips-filter-bar">
            <div class="filter-left">
              <button 
                :class="['clip-filter-btn', { active: selectedClipPeriod === 'ALL' }]"
                @click="changeClipFilter('ALL')"
              >
                전체
              </button>
              <button 
                :class="['clip-filter-btn', { active: selectedClipPeriod === 'DAYS_30' }]"
                @click="changeClipFilter('DAYS_30')"
              >
                한달
              </button>
              <button 
                :class="['clip-filter-btn', { active: selectedClipPeriod === 'DAYS_7' }]"
                @click="changeClipFilter('DAYS_7')"
              >
                주간
              </button>
              <button 
                :class="['clip-filter-btn', { active: selectedClipPeriod === 'HOURS_24' }]"
                @click="changeClipFilter('HOURS_24')"
              >
                하루
              </button>
            </div>
            <div class="filter-right">
              <button 
                :class="['clip-filter-btn', { active: selectedClipSort === 'views' }]"
                @click="changeClipSort('views')"
              >
                인기순
              </button>
              <button 
                :class="['clip-filter-btn', { active: selectedClipSort === 'recent' }]"
                @click="changeClipSort('recent')"
              >
                최신순
              </button>
            </div>
          </div>

          <div class="clips-container" 
              @mouseenter="showClipNavButtons = true" 
              @mouseleave="showClipNavButtons = false">
            <button 
              v-if="showClipNavButtons && clipCurrentPage > 0" 
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
                    :class="{
                      'blur-thumbnail': isAdultContent(clip) && userIsAdult,
                      'hide-thumbnail': isAdultContent(clip) && !userIsAdult
                    }"
                  >
                  
                  <!-- 연령 제한 표시 -->
                  <div v-if="isAdultContent(clip)" class="age-restriction-overlay">
                    <div class="age-restriction-content">
                      <div class="age-icon-circle">19</div>
                      <div class="age-text">연령 제한</div>
                    </div>
                  </div>
                  
                  <!-- 텍스트 오버레이 -->
                  <div class="clip-info-overlay">
                    <div class="clip-meta">
                      <div class="clip-title">{{ clip.title }}</div>
                      <span class="view-count">
                        <v-icon size="x-small" class="mr-1">mdi-eye</v-icon>
                        {{ formatNumber(clip.views) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              v-if="showClipNavButtons && clipCurrentPage < Math.ceil(clips.length / clipsPerPage) - 1" 
              class="nav-button next-button" 
              @click="slideClipNext">
              <v-icon>mdi-chevron-right</v-icon>
            </button>
          </div>
        </div>
      </template>
    </template>
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
  },
  streamingId: {
    type: [String, Number],
    default: null
  },
  userIsAdult: {
    type: Boolean,
    default: false
  }
});

// 상태
const isLoading = ref(true);
const streamingId = ref(props.streamingId);
const streamInfo = ref({});
const videoPlayer = ref(null);
const hlsInstance = ref(null);
const hlsRetryCount = ref(0);
const MAX_HLS_RETRIES = 3;
const vodInfo = ref(null);
const banners = ref(null);

// 라이브 여부는 ref로 정의하고 props에서 가져옵니다
const isLive = ref(props.streamerInfo?.streamingYn === 'Y');

// props.streamerInfo가 변경될 때 isLive 값도 업데이트
watch(() => props.streamerInfo?.streamingYn, (newValue) => {
  isLive.value = newValue === 'Y';
}, { immediate: true });

// props.streamingId가 변경될 때 내부 상태도 업데이트
watch(() => props.streamingId, (newValue) => {
  if (newValue !== streamingId.value) {
    streamingId.value = newValue;
    
    // streamingId가 유효하고 라이브 상태인 경우 스트리밍 정보 다시 로드
    if (newValue && isLive.value) {
      fetchStreamingInfo();
    }
  }
}, { immediate: true });

// 동영상 관련 변수와 메서드 추가
const videos = ref([]);
const videoSortType = ref('views');
const currentPage = ref(0);
const videosPerPage = 5;
const showNavButtons = ref(false);
const visibleVideos = computed(() => {
  const startIdx = currentPage.value * videosPerPage;
  return videos.value.slice(startIdx, startIdx + videosPerPage);
});
const videosSlider = ref(null);

// 클립 관련 변수 추가
const clips = ref([]);
const selectedClipPeriod = ref('ALL');
const selectedClipSort = ref('views');
const clipCurrentPage = ref(0);
const clipsPerPage = 5;
const showClipNavButtons = ref(false);
const visibleClips = computed(() => {
  const startIdx = clipCurrentPage.value * clipsPerPage;
  return clips.value.slice(startIdx, startIdx + clipsPerPage);
});
const clipsSlider = ref(null);

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
  const hlsSrc = `https://hls.bepl.site/hls/${streamInfo.value.streamKey}.m3u8`;
  // 로컬용
  // const hlsSrc = `http://localhost:8088/hls/${streamInfo.value.streamKey}.m3u8`;
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

// 동영상 목록 불러오기
const fetchVideos = async () => {
  try {
    const memberApi = process.env.VUE_APP_MEMBER_API;
    const url = `${memberApi}/video/vod/list/streamer/${videoSortType.value}`;
    
    const response = await axios.get(url, {
      params: {
        streamerId: route.params.memberId,
        page: 0 // 고정된 0페이지만 요청
      }
    });
    
    if (response.data && response.data.result) {
      const result = response.data.result;
      videos.value = (result.content || []).map(video => ({
        ...video,
        showPreview: false,
        hoverTimer: null,
        views: video.views || 0
      }));
      currentPage.value = 0; // 페이지 리셋
    }
  } catch (error) {
    console.error('동영상 목록을 불러오는 중 오류 발생:', error);
  }
};

// 정렬 방식 변경
const changeVideoSort = (sortType) => {
  videoSortType.value = sortType;
  fetchVideos();
};

// 슬라이드 네비게이션
const slideNext = () => {
  const maxPage = Math.ceil(videos.value.length / videosPerPage) - 1;
  if (currentPage.value < maxPage) {
    currentPage.value++;
  }
};

const slidePrev = () => {
  if (currentPage.value > 0) {
    currentPage.value--;
  }
};

// 썸네일 미리보기 관련 메서드
const startPreviewTimer = (index) => {
  const video = visibleVideos.value[index];
  if (!video || !video.url) return;
  
  // 성인 컨텐츠인 경우 미리보기 시작하지 않음
  if (video.isAdult === 'Y') return;
  
  // 기존 타이머가 있으면 클리어
  if (video.hoverTimer) {
    clearTimeout(video.hoverTimer);
  }
  
  // 0.5초 후에 미리보기 표시
  video.hoverTimer = setTimeout(() => {
    video.showPreview = true;
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
  
  // 미리보기 숨김
  video.showPreview = false;
};

// 성인 컨텐츠 관련 함수
const isAdultContent = (content) => {
  return content && content.isAdult === 'Y';
};

// 동영상 상세 페이지로 이동
const goToVideoDetail = (videoId) => {
  router.push(`/vod/${videoId}`);
};

// 숫자 포맷팅 (1000 -> 1,000)
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '만';
  }
  
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// 시간 포맷팅
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
};

// streamInfo 변경 시 비디오 플레이어 재초기화
watch(() => streamInfo.value, (newVal) => {
  if (newVal && newVal.streamKey) {
    destroyVideoPlayer();
    setTimeout(() => {
      initializeVideoPlayer();
    }, 500);
  }
});

// 동영상 탭으로 이동
const goToVideosTab = () => {
  // 부모 컴포넌트로 이벤트 발생: 탭 변경 요청
  const event = new CustomEvent('tabChange', { 
    detail: { tab: 'videos' },
    bubbles: true 
  });
  document.dispatchEvent(event);
};

// 클립 탭으로 이동
const goToClipsTab = () => {
  // 부모 컴포넌트로 이벤트 발생: 탭 변경 요청
  const event = new CustomEvent('tabChange', { 
    detail: { tab: 'clips' },
    bubbles: true 
  });
  document.dispatchEvent(event);
};

// 클립 상세 페이지로 이동
const goToClipDetail = (clipId) => {
  router.push(`/clip/${clipId}`);
};

// 클립 필터 변경
const changeClipFilter = (period) => {
  selectedClipPeriod.value = period;
  fetchClips();
};

// 클립 정렬 변경
const changeClipSort = (sort) => {
  selectedClipSort.value = sort;
  fetchClips();
};

// 클립 목록 불러오기
const fetchClips = async () => {
  try {
    const memberApi = process.env.VUE_APP_MEMBER_API;
    // 정렬 방식에 따라 엔드포인트 결정
    const endpoint = selectedClipSort.value === 'views' 
      ? '/video/clip/list/streamer/views' 
      : '/video/clip/list/streamer/recent';
    
    const response = await axios.get(`${memberApi}${endpoint}`, {
      params: {
        streamerId: route.params.memberId,
        page: 0, // 고정된 0페이지만 요청
        periodType: selectedClipPeriod.value
      }
    });
    
    if (response.data && response.data.result) {
      const result = response.data.result;
      clips.value = (result.content || []).map(clip => ({
        ...clip,
        views: clip.views || 0
      }));
      clipCurrentPage.value = 0; // 페이지 리셋
    }
  } catch (error) {
    console.error('클립 목록을 불러오는 중 오류 발생:', error);
  }
};

// 클립 슬라이드 네비게이션
const slideClipNext = () => {
  const maxPage = Math.ceil(clips.value.length / clipsPerPage) - 1;
  if (clipCurrentPage.value < maxPage) {
    clipCurrentPage.value++;
  }
};

const slideClipPrev = () => {
  if (clipCurrentPage.value > 0) {
    clipCurrentPage.value--;
  }
};

// 컨텐츠 유무 확인 computed 속성 추가
const hasContent = computed(() => {
  return (isLive.value && streamInfo.value && streamingId.value) || 
         (!isLive.value && vodInfo.value) ||
         (banners.value && banners.value.length > 0) || 
         videos.value.length > 0 || 
         clips.value.length > 0;
});

onMounted(async () => {
  isLoading.value = true;
  
  try {
    // 라이브 상태 확인 및 콘텐츠 로드
    if (isLive.value) {
      // 부모에서 전달받은 streamingId가 있는 경우 사용
      if (props.streamingId) {
        streamingId.value = props.streamingId;
        await fetchStreamingInfo();
      } else {
        // streamingId가 없는 경우 새로 요청
        await fetchStreamingInfo();
      }
    } else {
      // 라이브가 아닌 경우 VOD 정보 로드
      await fetchVodInfo();
    }
    
    // 배너 정보 가져오기
    await fetchBanners();
    
    // 동영상 정보 가져오기
    await fetchVideos();
    
    // 클립 정보 가져오기
    await fetchClips();
  } catch (error) {
    console.error('홈탭 초기화 중 오류 발생:', error);
    // 에러 발생 시 VOD로 폴백
    isLive.value = false;
    await fetchVodInfo();
  } finally {
    isLoading.value = false;
  }
});

onBeforeUnmount(() => {
  destroyVideoPlayer();
  
  // 동영상 관련 타이머 정리
  videos.value.forEach(video => {
    if (video.hoverTimer) {
      clearTimeout(video.hoverTimer);
    }
  });
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
  background: 
    linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.1) 100%);
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
  font-weight: 500;
  color: #ff3b3b;
  margin-left: 8px;
  letter-spacing: -1px;
}

.live-title {
  font-size: 28px;
  font-weight: 500;
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
  font-weight: 500;
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
  gap: 6px;
  flex-wrap: nowrap;
  margin-top: 2px;
  width: auto;
  max-width: 100%;
}

.hashtag {
  color: #bfc2c7;
  font-size: 14px;
  font-weight: 500;
  padding: 2px 10px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  border: 1px solid #bfc2c7;
  display: inline-flex;
  white-space: nowrap;
  flex-shrink: 0;
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

.vod-info {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 16px 24px;
  min-width: 0;
  width: 100%;
  height: 100%;
  position: relative;
}

.vod-meta-top {
  margin-bottom: 16px;
}

.vod-recommend {
  background: #e5e5e5;
  color: #222;
  font-size: 14px;
  font-weight: 500;
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
  margin-top: 0;
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
  font-weight: 500;
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
  padding-left: 0;
  margin-left: 0;
}

.banner-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
  padding: 0;
  margin-left: 0;
}

.banner-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  width: 130px;
  transition: transform 0.2s;
}

.banner-item:hover {
  /* 호버링 효과 제거 */
}

.banner-image-wrapper {
  width: 120px;
  height: 120px;
  border-radius: 8px;
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
  font-weight: 500;
  color: #fff;
  text-align: center;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 동영상 섹션 스타일 */
.recent-videos-section {
  margin-top: 36px;
  margin-bottom: 24px;
}

.section-header {
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

.section-title {
  font-size: 20px;
  font-weight: 500;
  color: #fff;
}

.view-all {
  color: #B084CC;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.view-all:hover {
  text-decoration: underline;
}

.video-filters {
  display: flex;
  gap: 8px;
}

.video-filters button {
  padding: 6px 14px;
  border: none;
  border-radius: 20px;
  background: #2c2c2c;
  color: #7B7B7B;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.video-filters button.active {
  background: #B084CC;
  color: #fff;
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
  padding-left: 0;
  margin-left: 0;
}

.videos-slider::-webkit-scrollbar {
  display: none;
}

.video-item {
  flex: 0 0 calc(20% - 13px);
  cursor: pointer;
  overflow: hidden;
  background-color: #141517;
  border-radius: 8px;
  transition: transform 0.2s;
}

.video-item:hover {
  transform: none;
}

.thumbnail-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 8px 8px 0 0;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-preview {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
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
}

.video-info {
  padding: 8px 0 10px 0;
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
  max-height: 30px;
}

.video-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #adb5bd;
  margin-top: 3px;
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

/* 성인 컨텐츠 스타일 */
.blur-thumbnail {
  filter: blur(10px);
}

.hide-thumbnail {
  filter: blur(15px);
}

.age-restriction-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
}

.age-restriction-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.age-icon-circle {
  width: 36px;
  height: 36px;
  background-color: rgba(255, 255, 255, 0.9);
  color: black;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
}

.age-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.video-duration-box {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  z-index: 2;
}

/* 배너 아래 동영상 섹션의 다시보기 박스만 크기 축소 */
.videos-slider .vod-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
}

/* 클립 섹션 스타일 */
.clips-section {
  margin-top: 36px;
  margin-bottom: 24px;
}

.clips-filter-bar {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
  padding-left: 0;
  margin-left: 0;
}

.filter-left {
  display: flex;
  gap: 8px;
}

.filter-right {
  display: flex;
  gap: 8px;
}

.clip-filter-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 20px;
  background: #2c2c2c;
  color: #7B7B7B;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.clip-filter-btn.active {
  background: #B084CC;
  color: #fff;
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
  padding-left: 0;
  margin-left: 0;
}

.clips-slider::-webkit-scrollbar {
  display: none;
}

.clip-item {
  flex: 0 0 calc(20% - 13px);
  cursor: pointer;
  overflow: hidden;
  background-color: #18191c;
  border-radius: 8px;
  position: relative;
}

.clip-item .thumbnail-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  width: 100%;
  aspect-ratio: 9 / 16;
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
  text-shadow: none;
  margin-right: 8px;
}

/* 전체 홈 빈 상태 UI */
.empty-home-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  width: 100%;
}

.empty-home-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  background-color: #18191c;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.empty-home-title {
  margin-top: 24px;
  color: #aaaaaa;
  font-size: 24px;
  font-weight: 500;
}

.empty-home-text {
  margin-top: 12px;
  color: #7B7B7B;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  max-width: 80%;
}
  </style>