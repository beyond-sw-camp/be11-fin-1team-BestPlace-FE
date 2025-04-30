<template>
    <div class="tab-content">
      <!-- 필터 버튼 -->
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
  
      <!-- 동영상 목록 -->
      <div class="videos-grid">
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
            <div class="video-title">{{ video.title }}</div>
            <div class="video-meta">
              <span class="view-count">조회수 {{ formatNumber(video.views || 0) }}회</span>
              <span class="dot-separator">·</span>
              <span class="video-time">{{ formatTime(video.createdTime) }}</span>
            </div>
  
            <!-- 태그 -->
            <div class="tags-container">
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
  
      <!-- 로딩 -->
      <div v-if="videoLoading" class="loading-container">
        <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
      </div>
  
      <!-- 비디오 없을 때 -->
      <div v-if="videos?.length === 0 && !videoLoading" class="no-videos">
        <p>등록된 동영상이 없습니다.</p>
      </div>
  
      <!-- 무한 스크롤 트리거 -->
      <div ref="infiniteScrollTrigger" class="infinite-scroll-trigger"></div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import axios from 'axios';
  
  const props = defineProps({
    streamerId: {
      type: [String, Number],
      required: true
    },
    isLoggedIn: {
      type: Boolean,
      default: false
    },
    userIsAdult: {
      type: Boolean,
      default: false
    }
  });
  
  const router = useRouter();
  const route = useRoute();
  
  // 데이터
  const videos = ref([]);
  const videoPage = ref(0);
  const hasMoreVideos = ref(true);
  const videoLoading = ref(false);
  const videoSortType = ref('views');
  const observer = ref(null);
  
  // 동영상 목록 불러오기
  const fetchVideos = async () => {
    if (videoLoading.value || !hasMoreVideos.value) return;
    
    videoLoading.value = true;
    
    try {
      const memberApi = process.env.VUE_APP_MEMBER_API;
      const url = `${memberApi}/video/vod/list/streamer/${videoSortType.value}`;
      
      const response = await axios.get(url, {
        params: {
          streamerId: props.streamerId,
          page: videoPage.value
        }
      });
      
      if (response.data && response.data.result) {
        const result = response.data.result;
        const newVideos = (result.content || []).map(video => ({
          ...video,
          showPreview: false,
          hoverTimer: null,
          views: video.views || 0,
          hashtags: video.hashtags || []
        }));
        
        videos.value = [...videos.value, ...newVideos];
        hasMoreVideos.value = videoPage.value < result.totalPages - 1;
        videoPage.value++;
      }
    } catch (error) {
      console.error('동영상 목록을 불러오는 중 오류 발생:', error);
    } finally {
      videoLoading.value = false;
    }
  };
  
  // 정렬 방식 변경
  const changeVideoSort = (sortType) => {
    videoSortType.value = sortType;
    videos.value = [];
    videoPage.value = 0;
    hasMoreVideos.value = true;
    fetchVideos();
  };
  
  // 무한 스크롤 설정
  const setupInfiniteScroll = () => {
    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    };
    
    observer.value = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !videoLoading.value) {
        fetchVideos();
      }
    }, options);
    
    const trigger = document.querySelector('.infinite-scroll-trigger');
    if (trigger) {
      observer.value.observe(trigger);
    }
  };
  
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
  };
  
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
  };
  
  // 동영상 상세 페이지로 이동
  const goToVideoDetail = (videoId) => {
    router.push(`/vod/${videoId}`);
  };
  
  // 카테고리 페이지로 이동
  const goToCategory = (category) => {
    router.push(`/category/${category}`);
  };
  
  // 성인 컨텐츠 관련 함수
  const isAdultContent = (video) => {
    return video.isAdult === 'Y';
  };
  
  const shouldBlurThumbnail = (video) => {
    return isAdultContent(video) && props.isLoggedIn && props.userIsAdult;
  };
  
  const shouldHideThumbnail = (video) => {
    return isAdultContent(video) && (!props.isLoggedIn || !props.userIsAdult);
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
  
  // 해시태그 포맷팅
  const formatHashtags = (hashtags) => {
    // 빈 값이거나 undefined인 경우 빈 배열 반환
    if (!hashtags) return [];
    
    try {
      // 문자열인 경우 처리
      if (typeof hashtags === 'string') {
        // JSON 형태로 저장된 문자열인지 확인
        if (hashtags.startsWith('[') && hashtags.endsWith(']')) {
          try {
            // 작은따옴표를 큰따옴표로 변환하여 JSON 파싱 시도
            const parsedTags = JSON.parse(hashtags.replace(/'/g, '"'));
            return Array.isArray(parsedTags) ? parsedTags : [hashtags];
          } catch (e) {
            // 파싱 실패시 간단히 처리
            console.log('해시태그 파싱 오류, 문자열로 처리:', e);
            // 대괄호 제거 후 쉼표로 분리
            return hashtags
              .replace(/^\[|\]$/g, '')  // 시작과 끝의 대괄호 제거
              .split(',')               // 쉼표로 분리
              .map(tag => tag.trim().replace(/^['"]|['"]$/g, ''))  // 앞뒤 공백과 따옴표 제거
              .filter(tag => tag);      // 빈 값 필터링
          }
        }
        
        // 쉼표로 구분된 문자열인 경우
        if (hashtags.includes(',')) {
          return hashtags
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
        }
        
        // 단일 문자열인 경우 배열로 반환
        return [hashtags];
      }
      
      // 이미 배열인 경우 그대로 반환
      if (Array.isArray(hashtags)) {
        return hashtags.filter(tag => tag);
      }
    } catch (error) {
      console.error('해시태그 파싱 오류:', error);
    }
    
    // 모든 처리가 실패한 경우 빈 배열 반환
    return [];
  };
  
  // 컴포넌트 마운트 시 실행
  onMounted(() => {
    fetchVideos();
    setupInfiniteScroll();
  });
  
  // 컴포넌트 언마운트 시 실행
  onBeforeUnmount(() => {
    if (observer.value) {
      observer.value.disconnect();
    }
    
    // 타이머 정리
    videos.value.forEach(video => {
      if (video.hoverTimer) {
        clearTimeout(video.hoverTimer);
      }
    });
  });
  </script>
  
  <style scoped>
.video-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  margin-top: 4px;
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

.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 30px 20px;
  width: 100%;
  margin-bottom: 30px;
}

.video-item {
  cursor: pointer;
  overflow: hidden;
  background-color: #141517;
}

.thumbnail-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-info {
  padding: 8px 0 16px 0;
}

.video-title {
  font-size: 15px;
  font-weight: 500;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.3;
  margin-bottom: 4px;
}

.video-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #adb5bd;
}

.dot-separator {
  color: #adb5bd;
}

/* 태그 스타일 추가 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  max-height: 24px; /* 첫 번째 줄 높이만큼만 설정 */
  overflow: hidden; /* 넘치는 부분(두 번째 줄부터) 숨김 */
}

.category-tag {
  font-size: 12px;
  background-color: #B084CC;
  color: black;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.category-tag:hover {
  opacity: 0.9;
}

.hashtag {
  font-size: 12px;
  color: #aaaaaa;
  background-color: transparent;
  padding: 1px 6px;
  border-radius: 3px;
  border: 1px solid #aaaaaa;
}

.loading-container {
  display: flex;
  justify-content: center;
  margin: 40px 0;
}

.no-videos {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #adb5bd;
  font-size: 16px;
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
</style>

  