<template>
  <div class="live-list-container">
    <div class="live-header">
      <h1 class="header-title">전체 방송</h1>
      <div class="header-tabs">
        <div class="content-tabs">
          <button 
            :class="{ active: currentContentType === 'live' }" 
            @click="changeContentType('live')"
          >
            라이브
          </button>
          <button 
            :class="{ active: currentContentType === 'video' }" 
            @click="changeContentType('video')"
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

    <!-- 라이브 스트림 그리드 -->
    <div v-if="currentContentType === 'live'" class="streams-grid">
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
            <div class="tag-container" ref="tagContainer">
              <span 
                class="category"
                @click="goToCategory(stream.category)"
              >{{ stream.category }}</span>
              <div class="hashtags" v-if="stream.hashTag && stream.hashTag.length > 0">
                <span 
                  v-for="(tag, index) in getVisibleHashtags(stream.hashTag, stream.streamId)" 
                  :key="tag + '-' + index"
                  class="hashtag"
                >{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 동영상 그리드 -->
    <div v-if="currentContentType === 'video'" class="videos-grid">
      <div 
        v-for="(video, index) in videos" 
        :key="video.id"
        class="video-item"
        @mouseenter="startPreviewTimer(index)"
        @mouseleave="stopPreview(index)"
        @click="goToVideoDetail(video.id)"
      >
        <div class="thumbnail-container">
          <img 
            :src="video.thumbnailUrl" 
            alt="Video Thumbnail" 
            class="thumbnail"
            :class="{
              'blur-thumbnail': shouldBlurThumbnail(video),
              'hide-thumbnail': shouldHideThumbnail(video)
            }"
          >
          <video 
            v-if="video.showPreview && video.url && !shouldHideThumbnail(video) && video.isAdult !== 'Y'" 
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
          <div class="profile-row">
            <div class="streamer-profile">
              <img :src="video.streamerProfileImageUrl || defaultProfileImage" alt="Streamer Profile" class="profile-img">
            </div>
            <div class="video-details">
              <div class="video-title">{{ video.title }}</div>
              <div 
                class="streamer-nickname"
                @click.stop="goToStreamerProfile(video.streamerId)"
              >{{ video.streamerNickname }}</div>
              <div class="video-meta">
                <span class="view-count">조회수 {{ video.viewCount || 0 }}회</span>
                <span class="dot-separator">·</span>
                <span class="video-time">{{ formatTime(video.createdTime) }}</span>
              </div>
              <!-- 태그 컨테이너 -->
              <div class="tags-container">
                <!-- 카테고리 태그 -->
                <span 
                  v-if="video.category" 
                  class="category-tag"
                  @click.stop="goToCategory(video.category)"
                >
                  {{ video.category }}
                </span>
                
                <!-- 해시태그 목록 -->
                <span 
                  v-for="(tag, i) in formatHashtags(video.hashtags)" 
                  :key="i" 
                  class="hashtag"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 로딩 표시 -->
    <div v-if="loading" class="loading-container">
      <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
    </div>

    <!-- 무한 스크롤 감지용 요소 -->
    <div ref="infiniteScrollTrigger" class="infinite-scroll-trigger"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { jwtDecode } from 'jwt-decode'

const router = useRouter()
const streamingApi = process.env.VUE_APP_STREAMING_API
const memberApi = process.env.VUE_APP_MEMBER_API
const streams = ref([])
const videos = ref([])
const currentTab = ref('popular')
const currentContentType = ref('live')
const isHovered = ref(null)
const loading = ref(false)
const observer = ref(null)
const userIsAdult = ref(false)
const isLoggedIn = ref(false)
const defaultProfileImage = 'https://bestplace-media.s3.ap-northeast-2.amazonaws.com/bestplace-basic-profile-image.png'

// 동영상 로드 관련 상태
const videoPage = ref(0)
const hasMoreVideos = ref(true)

// 컨테이너 및 측정용 ref 추가
const tagContainer = ref(null)
const tagMeasurements = ref({})

const fetchStreams = async (type) => {
  try {
    const endpoint = type === 'popular' 
      ? '/streaming/streamListViewer'
      : '/streaming/streamListStartTime'
    const response = await axios.get(`${streamingApi}${endpoint}`)
    if (response.data && response.data.result) {
      streams.value = response.data.result.content
      
      // 해시태그 측정을 위한 딜레이
      setTimeout(() => {
        calculateVisibleHashtags()
      }, 100)
    }
  } catch (error) {
    console.error('방송 목록 로드 실패:', error)
  }
}

const fetchVideos = async () => {
  if (loading.value || !hasMoreVideos.value) return;
  
  loading.value = true;
  
  try {
    const sortEndpoint = currentTab.value === 'popular' ? 'views' : 'recent';
    const url = `${memberApi}/video/vod/list/${sortEndpoint}`;
    
    const response = await axios.get(url, {
      params: {
        page: videoPage.value
      }
    });
    
    if (response.data && response.data.result) {
      const result = response.data.result;
      const newVideos = result.content.map(video => ({
        ...video,
        showPreview: false,
        hoverTimer: null
      }));
      videos.value = [...videos.value, ...newVideos];
      hasMoreVideos.value = videoPage.value < result.totalPages - 1;
      videoPage.value++;
    }
  } catch (error) {
    console.error('동영상 목록을 불러오는 중 오류 발생:', error);
  } finally {
    loading.value = false;
  }
}

const changeTab = async (tab) => {
  currentTab.value = tab
  if (currentContentType.value === 'live') {
    await fetchStreams(tab)
  } else {
    // 동영상 탭에서는 목록 초기화 후 다시 로드
    videos.value = []
    videoPage.value = 0
    hasMoreVideos.value = true
    await fetchVideos()
  }
}

const changeContentType = async (type) => {
  currentContentType.value = type
  if (type === 'live') {
    await fetchStreams(currentTab.value)
  } else {
    // 동영상 탭으로 전환하면 동영상 로드
    if (videos.value.length === 0) {
      await fetchVideos()
    }
  }
}

const goToLiveDetail = (streamId) => {
  router.push(`/live/${streamId}`)
}

const goToVideoDetail = (videoId) => {
  router.push(`/vod/${videoId}`)
}

const goToStreamerProfile = (streamerId) => {
  router.push(`/channel/${streamerId}`)
}

const goToCategory = (category) => {
  router.push(`/category/${category}`)
}

// 무한 스크롤 설정
const setupInfiniteScroll = () => {
  const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  observer.value = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !loading.value) {
      if (currentContentType.value === 'video') {
        fetchVideos();
      }
    }
  }, options);
  
  if (document.querySelector('.infinite-scroll-trigger')) {
    observer.value.observe(document.querySelector('.infinite-scroll-trigger'));
  }
}

// 로그인 상태 및 성인 여부 확인
const checkLoginStatus = () => {
  const token = localStorage.getItem('token');
  isLoggedIn.value = !!token;
  
  if (isLoggedIn.value) {
    try {
      const decoded = jwtDecode(token);
      userIsAdult.value = decoded.isAdult === 'Y';
    } catch (error) {
      console.error('토큰 디코딩 중 오류 발생:', error);
      userIsAdult.value = false;
    }
  }
}

// 성인 컨텐츠 관련 함수
const isAdultContent = (video) => {
  return video.isAdult === 'Y';
}

const shouldBlurThumbnail = (video) => {
  return isAdultContent(video) && isLoggedIn.value && userIsAdult.value;
}

const shouldHideThumbnail = (video) => {
  return isAdultContent(video) && (!isLoggedIn.value || !userIsAdult.value);
}

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
}

// 썸네일 미리보기 관련 메서드
const startPreviewTimer = (index) => {
  const video = videos.value[index];
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
}

const stopPreview = (index) => {
  const video = videos.value[index];
  if (!video) return;
  
  // 타이머가 있으면 클리어
  if (video.hoverTimer) {
    clearTimeout(video.hoverTimer);
    video.hoverTimer = null;
  }
  
  // 미리보기 숨김
  video.showPreview = false;
}

// 보이는 해시태그만 필터링하는 함수
const getVisibleHashtags = (hashTags, streamId) => {
  if (!hashTags || !hashTags.length) return []
  
  // 측정 정보가 없으면 모든 태그 반환
  if (!tagMeasurements.value[streamId]) return hashTags
  
  return tagMeasurements.value[streamId].visibleTags || []
}

// 해시태그 측정 및 계산
const calculateVisibleHashtags = async () => {
  await nextTick()
  
  const containers = document.querySelectorAll('.tag-container')
  if (!containers.length) return
  
  containers.forEach((container, idx) => {
    const streamId = streams.value[idx]?.streamId
    if (!streamId) return
    
    const hashTags = streams.value[idx]?.hashTag
    if (!hashTags || !hashTags.length) return
    
    // 컨테이너 계산
    const containerWidth = container.offsetWidth
    const categoryElem = container.querySelector('.category')
    const categoryText = categoryElem ? categoryElem.textContent : ''
    const availableWidth = containerWidth - (categoryElem ? categoryElem.offsetWidth + 8 : 0) // 8px는 gap
    
    // 가상 태그 엘리먼트로 너비 측정
    const tempDiv = document.createElement('div')
    tempDiv.style.visibility = 'hidden'
    tempDiv.style.position = 'absolute'
    tempDiv.style.whiteSpace = 'nowrap'
    document.body.appendChild(tempDiv)
    
    let totalWidth = 0
    let totalLength = categoryText.length // 카테고리 글자 수부터 시작
    const visibleTags = []
    
    // 각 태그의 너비 측정
    for (const tag of hashTags) {
      // 현재까지의 총 글자 수 + 현재 태그의 글자 수가 20을 초과하면 중단
      if (totalLength + tag.length > 20) {
        break
      }
      
      tempDiv.innerHTML = `<span class="hashtag" style="font-size:14px;margin-right:8px;">${tag}</span>`
      const tagWidth = tempDiv.firstChild.offsetWidth
      
      if (totalWidth + tagWidth <= availableWidth) {
        visibleTags.push(tag)
        totalWidth += tagWidth + 8 // 8px는 gap
        totalLength += tag.length // 총 글자 수 업데이트
      } else {
        break // 더 이상 표시할 수 없으면 중단
      }
    }
    
    document.body.removeChild(tempDiv)
    
    // 결과 저장
    tagMeasurements.value[streamId] = {
      visibleTags
    }
  })
}

onMounted(async () => {
  checkLoginStatus();
  await fetchStreams('popular');
  setupInfiniteScroll();
  
  // 화면 크기가 변경될 때마다 태그 계산
  window.addEventListener('resize', calculateVisibleHashtags)
})

// 컴포넌트 언마운트 시 observer 해제
onUnmounted(() => {
  cleanupObserver();
  window.removeEventListener('resize', calculateVisibleHashtags)
})

const cleanupObserver = () => {
  if (observer.value) {
    observer.value.disconnect();
  }
}

// 해시태그 포맷팅
const formatHashtags = (hashtags) => {
  // 빈 값인 경우 처리
  if (!hashtags) return [];
  
  // 문자열인 경우 처리
  if (typeof hashtags === 'string') {
    // ['클립', '테스트'] 형태인지 확인
    if (hashtags.startsWith('[') && hashtags.endsWith(']')) {
      try {
        // JSON 파싱 시도
        return JSON.parse(hashtags.replace(/'/g, '"'));
      } catch (e) {
        // 파싱 실패시 기본 형태로 분리
        const clean = hashtags.replace(/^\[|\]$/g, '').replace(/'/g, '').replace(/"/g, '');
        return clean.split(',').map(tag => tag.trim());
      }
    }
    // 일반 문자열이면 그대로 반환
    return [hashtags];
  }
  
  // 배열인 경우 그대로 반환
  if (Array.isArray(hashtags)) {
    return hashtags;
  }
  
  return [];
}
</script>

<style scoped>
.live-list-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 24px;
  background: #141517;
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
  font-size: 32px;
  font-weight: 500;
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

/* 라이브 스트림 그리드 */
.streams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.stream-card {
  background: #141517;
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
  font-weight: 500;
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
  align-items: center;
  margin-top: 8px;
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
  margin-top: 8px;
}

.tag-container {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  overflow: hidden;
  max-width: 100%;
  height: 28px; /* 한 줄 높이로 고정 */
}

.category {
  background-color: #B084CC;
  color: #000000;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 1px 5px;
  border-radius: 3px;
  flex-shrink: 0;
  height: 22px;
  display: flex;
  align-items: center;
}

.hashtags {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.hashtag {
  color: #7B7B7B;
  font-size: 14px;
  white-space: nowrap;
}

/* 동영상 그리드 스타일 */
.videos-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  padding: 10px 0 24px 0;
}

.video-item {
  cursor: pointer;
  background-color: #141517;
  border-radius: 8px;
  padding: 8px;
  overflow: hidden;
}

.videos-grid .thumbnail-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 6px;
  padding-top: 0;
}

.videos-grid .thumbnail {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.blur-thumbnail {
  filter: blur(3px);
  opacity: 0.9;
}

.hide-thumbnail {
  opacity: 0;
}

.video-preview {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 2;
}

.duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: white;
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
  font-size: 16px;
  margin-bottom: 8px;
}

.age-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.video-info {
  padding: 10px;
}

.video-title {
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 6px;
}

.profile-row {
  display: flex;
  gap: 12px;
}

.streamer-profile {
  flex-shrink: 0;
}

.profile-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.video-details {
  flex: 1;
  padding-top: 2px;
}

.streamer-nickname {
  font-size: 14px;
  color: #adb5bd;
  margin-bottom: 4px;
  cursor: pointer;
}

.streamer-nickname:hover {
  text-decoration: underline;
  color: #B084CC;
}

.video-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #adb5bd;
  margin-bottom: 6px;
}

.dot-separator {
  color: #adb5bd;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 6px;
  max-height: 24px; /* 첫 번째 줄 높이만큼만 설정 */
  overflow: hidden; /* 넘치는 부분(두 번째 줄부터) 숨김 */
}

.category-tag {
  font-size: 12px;
  background-color: #B084CC;
  color: black;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.hashtag {
  font-size: 12px;
  color: #aaaaaa;
  background-color: transparent;
  padding: 1px 6px;
  border-radius: 3px;
  display: inline-block;
  border: 1px solid #aaaaaa;
}

.loading-container {
  display: flex;
  justify-content: center;
  margin: 40px 0;
}

.infinite-scroll-trigger {
  height: 20px;
  width: 100%;
  margin-top: 20px;
}
</style>
