<template>
  <div class="category-detail-wrapper">
    <!-- 카테고리 헤더 섹션 -->
    <div class="category-header">
      <div class="category-image">
        <img :src="categoryImage" alt="Category Image" v-if="categoryImage">
      </div>
      <div class="category-info">
        <h1 class="category-name">{{ categoryName }}</h1>
      </div>
    </div>

    <!-- 탭 메뉴 -->
    <div class="tab-container">
      <div class="tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.value" 
          :class="['tab', { active: activeTab === tab.value }]"
          @click="setActiveTab(tab.value)"
        >
          {{ tab.text }}
        </div>
      </div>
    </div>

    <!-- 정렬 옵션 (동영상 탭에서만 표시) -->
    <div class="sort-container" v-if="activeTab === 'video'">
      <div class="sort-options">
        <button 
          :class="['sort-btn', { active: sortOption === 'views' }]" 
          @click="setSortOption('views')"
        >
          인기순
        </button>
        <button 
          :class="['sort-btn', { active: sortOption === 'recent' }]" 
          @click="setSortOption('recent')"
        >
          최신순
        </button>
      </div>
    </div>

    <!-- 동영상 목록 (동영상 탭에서만 표시) -->
    <div class="videos-grid" v-if="activeTab === 'video' && videos.length > 0">
      <div 
        v-for="(video, index) in videos" 
        :key="index" 
        class="video-item"
        @mouseenter="startPreviewTimer(index)"
        @mouseleave="stopPreview(index)"
        @click="handleVideoClick(video)"
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
            v-if="video.showPreview && video.videoUrl && !shouldHideThumbnail(video) && video.isAdult !== 'Y'" 
            :src="video.videoUrl" 
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
          <div class="streamer-info">
            <div class="streamer-profile">
              <img :src="video.streamerProfileImageUrl || defaultProfileImage" alt="Streamer Profile" class="profile-img">
            </div>
            <div class="streamer-detail">
              <div class="streamer-name">{{ video.streamerNickname }}</div>
              <div class="video-time">{{ formatTime(video.createdTime) }}</div>
            </div>
          </div>
          <div v-if="video.hashtags && video.hashtags.length > 0" class="hashtags">
            <span v-for="(tag, i) in video.hashtags" :key="i" class="hashtag">{{ tag }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 방송 목록 (라이브 탭에서만 표시) -->
    <div class="broadcasts-grid" v-if="activeTab === 'live'">
      <div 
        v-for="(broadcast, index) in broadcasts" 
        :key="index" 
        class="broadcast-item"
      >
        <div class="thumbnail-container">
          <img :src="broadcast.thumbnailUrl" alt="Broadcast Thumbnail" class="thumbnail">
          <div class="duration">{{ broadcast.duration }}</div>
          <div class="replay-badge">다시보기</div>
        </div>
        <div class="broadcast-info">
          <div class="broadcast-title">{{ broadcast.title }}</div>
          <div class="streamer-info">
            <div class="streamer-profile">
              <img :src="broadcast.streamerProfileUrl" alt="Streamer Profile" class="profile-img">
              <div class="live-badge" v-if="broadcast.isLive">LIVE</div>
            </div>
            <div class="streamer-name">{{ broadcast.streamerName }}</div>
            <div class="broadcast-time">{{ broadcast.time }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 로딩 표시 -->
    <div v-if="loading" class="loading-container">
      <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
    </div>
    
    <!-- 데이터 없음 표시 -->
    <v-card v-if="(activeTab === 'live' && broadcasts.length === 0 && !loading) || 
                  (activeTab === 'video' && videos.length === 0 && !loading)" 
           class="empty-card">
      <v-card-text class="text-center pa-6">
        <v-icon size="64" color="#B084CC" class="mb-4">mdi-television</v-icon>
        <h3 class="mb-2">{{ activeTab === 'live' ? '방송이 없습니다' : '동영상이 없습니다' }}</h3>
        <p>{{ activeTab === 'live' ? '이 카테고리에 등록된 방송이 없습니다.' : '이 카테고리에 등록된 동영상이 없습니다.' }}</p>
      </v-card-text>
    </v-card>

    <!-- 무한 스크롤 감지 요소 -->
    <div ref="infiniteScrollTrigger" class="infinite-scroll-trigger"></div>
    
    <!-- 미성년자/비로그인 사용자 알림 모달 -->
    <v-dialog v-model="adultAlertModalOpen" max-width="400" content-class="adult-alert-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">연령 제한 컨텐츠</div>
          <v-btn icon @click="closeAdultAlertModal" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="modal-content">
          <div class="adult-alert-icon">
            <div class="age-icon-circle modal-icon">19</div>
          </div>
          <p class="adult-alert-message" v-if="isLoggedIn">
            미성년자는 이용 불가능한 컨텐츠입니다.
          </p>
          <p class="adult-alert-message" v-else>
            이 컨텐츠는 성인만 이용할 수 있습니다.<br>
            로그인 후 성인인증이 필요합니다.
          </p>
        </div>
        
        <div class="modal-footer">
          <v-btn 
            v-if="!isLoggedIn"
            color="#b084cc" 
            block 
            @click="goToLogin"
            class="submit-btn"
          >
            로그인하기
          </v-btn>
          <v-btn 
            v-else
            color="#b084cc" 
            block 
            @click="closeAdultAlertModal"
            class="submit-btn"
          >
            확인
          </v-btn>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import {jwtDecode} from 'jwt-decode';

export default {
  name: 'CategoryDetailView',
  data() {
    return {
      categoryName: '',
      categoryImage: '',
      activeTab: 'live',
      tabs: [
        { text: '라이브', value: 'live' },
        { text: '동영상', value: 'video' },
        { text: '클립', value: 'clip' }
      ],
      broadcasts: [],
      videos: [],
      loading: false,
      sortOption: 'views', // 기본값은 인기순
      page: 0,
      totalPages: 0,
      hasMoreVideos: true,
      observer: null,
      defaultProfileImage: 'https://bestplace-media.s3.ap-northeast-2.amazonaws.com/bestplace-basic-profile-image.png',
      // 성인 콘텐츠 관련 추가
      userIsAdult: false,
      isLoggedIn: false,
      adultAlertModalOpen: false,
      selectedVideo: null
    };
  },
  
  computed: {
    // 라우터 파라미터에서 직접 ID를 가져오는 computed 속성
    categoryId() {
      return this.$route.params.id;
    }
  },
  
  created() {
    console.log('라우터 파라미터:', this.$route.params);
    console.log('카테고리 ID:', this.categoryId);
    this.checkLoginStatus();
  },
  
  mounted() {
    this.fetchCategoryDetail();
    this.setupInfiniteScroll();
  },

  beforeUnmount() {
    if (this.observer) {
      this.observer.disconnect();
    }
  },
  
  watch: {
    activeTab(newTab) {
      if (newTab === 'video' && this.videos.length === 0) {
        this.page = 0;
        this.hasMoreVideos = true;
        this.fetchVideos();
      }
    },
    sortOption() {
      this.page = 0;
      this.videos = [];
      this.hasMoreVideos = true;
      this.fetchVideos();
    }
  },
  
  methods: {
    checkLoginStatus() {
      const token = localStorage.getItem('token');
      this.isLoggedIn = !!token;
      
      if (this.isLoggedIn) {
        try {
          const decoded = jwtDecode(token);
          if(decoded.isAdult === 'Y'){
            this.userIsAdult = true;
          } else {
            this.userIsAdult = false;
          }
        } catch (error) {
          console.error('토큰 디코딩 중 오류 발생:', error);
          this.userIsAdult = false;
        }
      }
    },

    async fetchCategoryDetail() {
      if (!this.categoryId) {
        console.error('유효하지 않은 카테고리 ID:', this.categoryId);
        return;
      }
      
      this.loading = true;
      
      try {
        const apiUrl = process.env.VUE_APP_STREAMING_API;
        const url = `${apiUrl}/category/detail/${this.categoryId}`;
        console.log('요청 URL:', url);
        
        const response = await axios.get(url);
        console.log('응답 데이터:', response.data);
        
        if (response.data && response.data.result) {
          const categoryData = response.data.result;
          this.categoryName = categoryData.name;
          this.categoryImage = categoryData.image;
        }
      } catch (error) {
        console.error('카테고리 정보를 불러오는 중 오류 발생:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchVideos() {
      if (this.loading || !this.hasMoreVideos) return;
      
      this.loading = true;
      
      try {
        const apiUrl = process.env.VUE_APP_MEMBER_API;
        const sortEndpoint = this.sortOption === 'views' ? 'views' : 'recent';
        const url = `${apiUrl}/video/vod/list/category/${sortEndpoint}`;
        
        const response = await axios.get(url, {
          params: {
            page: this.page,
            category: this.categoryName
          }
        });
        
        console.log('동영상 응답 데이터:', response.data);
        
        if (response.data && response.data.result) {
          const result = response.data.result;
          const newVideos = result.content.map(video => ({
            ...video,
            showPreview: false,
            hoverTimer: null,
            videoUrl: video.url // API 응답에 url 필드가 있다고 가정합니다
          }));
          this.videos = [...this.videos, ...newVideos];
          this.totalPages = result.totalPages;
          this.hasMoreVideos = this.page < this.totalPages - 1;
          this.page++;
        }
      } catch (error) {
        console.error('동영상 목록을 불러오는 중 오류 발생:', error);
      } finally {
        this.loading = false;
      }
    },
    
    setActiveTab(tab) {
      this.activeTab = tab;
    },

    setSortOption(option) {
      this.sortOption = option;
    },

    setupInfiniteScroll() {
      const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      };
      
      this.observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !this.loading && this.activeTab === 'video') {
          this.fetchVideos();
        }
      }, options);
      
      if (this.$refs.infiniteScrollTrigger) {
        this.observer.observe(this.$refs.infiniteScrollTrigger);
      }
    },

    formatTime(timestamp) {
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
    },

    formatHashtags(hashtags) {
      // 빈 값인 경우 처리
      if (!hashtags) return [];
      console.log('hashtags:', hashtags);
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
    },

    // 썸네일 미리보기 관련 메서드
    startPreviewTimer(index) {
      const video = this.videos[index];
      if (!video || !video.videoUrl) return;
      
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
    },
    
    stopPreview(index) {
      const video = this.videos[index];
      if (!video) return;
      
      // 타이머가 있으면 클리어
      if (video.hoverTimer) {
        clearTimeout(video.hoverTimer);
        video.hoverTimer = null;
      }
      
      // 미리보기 숨기기
      video.showPreview = false;
    },

    // 성인 콘텐츠 관련 메서드
    isAdultContent(video) {
      return video.isAdult === 'Y';
    },
    
    shouldBlurThumbnail(video) {
      // 성인 컨텐츠이고, 로그인한 사용자가 성인인 경우 흐리게 표시
      return this.isAdultContent(video) && this.isLoggedIn && this.userIsAdult;
    },
    
    shouldHideThumbnail(video) {
      // 성인 컨텐츠이고, 로그인하지 않았거나 성인이 아닌 경우 숨김
      return this.isAdultContent(video) && (!this.isLoggedIn || !this.userIsAdult);
    },
    
    handleVideoClick(video) {
      if (video.isAdult === 'Y' && (!this.isLoggedIn || !this.userIsAdult)) {
        // 성인 컨텐츠이고 로그인하지 않았거나 성인이 아닌 경우, 모달 표시
        this.selectedVideo = video;
        this.adultAlertModalOpen = true;
      } else {
        // 아니면 동영상 페이지로 이동
        this.$router.push(`/vod/${video.id}`);
      }
    },
    
    closeAdultAlertModal() {
      this.adultAlertModalOpen = false;
      this.selectedVideo = null;
    },
    
    goToLogin() {
      this.closeAdultAlertModal();
      // 로그인 페이지로 이동
      this.$router.push('/member/login');
    }
  }
};
</script>

<style scoped>
.category-detail-wrapper {
  width: 100%;
  background-color: #141517;
  color: white;
  min-height: calc(100vh - 60px); /* 헤더 높이를 뺀 전체 화면 높이 */
}

.category-header {
  display: flex;
  align-items: flex-start;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 15px;
  gap: 20px;
}

.category-info {
  padding-top: 10px;
}

.category-name {
  font-size: 32px;
  font-weight: 700;
}

.category-image {
  width: 180px;
  height: 240px;
  overflow: hidden;
  border-radius: 8px;
}

.category-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tab-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
  border-bottom: 1px solid #2a2a2a;
}

.tabs {
  display: flex;
  gap: 20px;
}

.tab {
  padding: 15px 5px;
  font-size: 16px;
  font-weight: 500;
  color: #aaaaaa;
  cursor: pointer;
  position: relative;
}

.tab.active {
  color: white;
  font-weight: 600;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #B084CC;
}

.sort-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 15px;
}

.sort-options {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.sort-btn {
  background: none;
  border: none;
  color: #aaaaaa;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
}

.sort-btn.active {
  background-color: #2a2a2a;
  color: white;
}

.broadcasts-grid, .videos-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 15px;
}

.broadcast-item, .video-item {
  cursor: pointer;
  transition: transform 0.2s;
}

.broadcast-item:hover, .video-item:hover {
  transform: none;
}

.thumbnail-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 8px;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.video-item:hover .thumbnail {
  opacity: 0.6;
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
}

.replay-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: #7f3dbd;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.adult-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background-color: #ff2e2e;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  z-index: 2;
}

.broadcast-info, .video-info {
  padding: 10px 0;
}

.broadcast-title, .video-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #ffffff;
}

.streamer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.streamer-profile {
  flex-shrink: 0;
}

.profile-img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.live-badge {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background-color: #ff2e2e;
  color: white;
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 8px;
  font-weight: 700;
}

.streamer-name {
  font-size: 13px;
  color: #adb5bd;
  font-weight: 500;
}

.broadcast-time, .video-time {
  font-size: 12px;
  color: #6c757d;
}

.hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}

.hashtag {
  font-size: 11px;
  color: #aaaaaa;
  background-color: transparent;
  padding: 1px 4px;
  border-radius: 4px;
  display: inline-block;
  border: 1px solid #aaaaaa;
}

.loading-container {
  display: flex;
  justify-content: center;
  margin: 40px 0;
}

.empty-card {
  background-color: #1A1B1E !important;
  color: white;
  border-radius: 12px;
  margin: 30px auto;
  max-width: 500px;
}

.empty-card h3 {
  color: white;
}

.empty-card p {
  color: #aaaaaa;
}

.infinite-scroll-trigger {
  height: 20px;
  width: 100%;
  margin-top: 20px;
}

/* 반응형 그리드 */
@media (max-width: 1200px) {
  .broadcasts-grid, .videos-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .broadcasts-grid, .videos-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .broadcasts-grid, .videos-grid {
    grid-template-columns: repeat(1, 1fr);
  }
  
  .category-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .category-image {
    margin-top: 20px;
  }
}

.videos-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 15px;
}

.video-item {
  cursor: pointer;
  transition: transform 0.2s;
  background-color: transparent;
  overflow: hidden;
  border-radius: 0;
}

.video-item:hover {
  transform: none;
}

.video-info {
  padding: 10px 0;
}

.video-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.streamer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.streamer-profile {
  flex-shrink: 0;
}

.profile-img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.streamer-detail {
  display: flex;
  flex-direction: column;
}

.streamer-name {
  font-size: 13px;
  color: #adb5bd;
  font-weight: 500;
}

.video-time {
  font-size: 12px;
  color: #6c757d;
}

.hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}

.hashtag {
  font-size: 11px;
  color: #aaaaaa;
  background-color: transparent;
  padding: 1px 4px;
  border-radius: 4px;
  display: inline-block;
  border: 1px solid #aaaaaa;
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
  border-radius: 8px;
}

.age-restriction-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.age-icon-circle {
  width: 48px;
  height: 48px;
  background-color: rgba(255, 255, 255, 0.9);
  color: black;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 20px;
  margin-bottom: 10px;
}

.age-text {
  color: white;
  font-size: 16px;
  font-weight: 500;
}

.blur-thumbnail {
  filter: blur(3px);
  opacity: 0.9;
}

.hide-thumbnail {
  opacity: 0;
}

/* 모달 스타일 */
.adult-alert-modal {
  background: transparent !important;
  box-shadow: none !important;
}

.modal-container {
  background-color: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  color: white;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #333;
}

.modal-title {
  font-size: 18px;
  font-weight: 500;
  color: white;
}

.modal-content {
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.adult-alert-icon {
  margin-bottom: 20px;
}

.modal-icon {
  width: 60px;
  height: 60px;
  font-size: 24px;
}

.adult-alert-message {
  font-size: 16px;
  line-height: 1.6;
  color: #eee;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid #333;
}

.submit-btn {
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  text-transform: none;
}
</style>
