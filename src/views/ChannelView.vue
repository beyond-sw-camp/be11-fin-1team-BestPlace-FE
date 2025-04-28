<template>
  <div class="channel-container">
    <!-- 상단 스트리머 프로필 영역 -->
    <div v-if="loading" class="loading-container">
      <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
      <p>채널 정보를 불러오는 중...</p>
    </div>
    
    <div v-else-if="streamerInfo" class="channel-header">
      <div class="profile-section">
        <!-- 프로필 이미지 -->
        <div 
          class="profile-image-wrapper" 
          :class="{ 'streaming-active': streamerInfo.streamingYn === 'Y' }"
        >
          <img 
            :src="streamerInfo.streamerProfileImageUrl || defaultProfileImage" 
            alt="Profile Image" 
            class="profile-image"
          />
          <!-- LIVE 뱃지 -->
          <div v-if="streamerInfo.streamingYn === 'Y'" class="live-badge">
            LIVE
          </div>
        </div>
        
        <!-- 스트리머 정보 -->
        <div class="streamer-info">
          <h1 class="streamer-name">{{ streamerInfo.streamerNickName }}</h1>
          <p class="follower-count">팔로워 {{ formatNumber(streamerInfo.followerCount) }}명</p>
          
          <!-- 스트리머 소개 -->
          <p class="streamer-introduction" v-if="streamerInfo.introduction || streamerInfo.introduce">
            {{ streamerInfo.introduction || streamerInfo.introduce }}
          </p>
          
          <!-- 팔로우 버튼 - 자신의 ID가 아닌 경우에만 표시 -->
          <div class="channel-actions">
            <button 
              v-if="isLoggedIn && !isSameUser(currentUserId, streamerId)"
              class="follow-button" 
              :class="{ 'following': streamerInfo.isFollow === 'Y' }"
              @click="toggleFollow"
            >
              {{ streamerInfo.isFollow === 'Y' ? '팔로잉' : '팔로우' }}
            </button>
          </div>
        </div>
        
        <!-- 채널 관리 버튼 -->
        <div class="channel-management">
          <button 
            v-if="isChannelManager || isSameUser(currentUserId, streamerId)"
            class="stream-button"
            @click="goToStreamerDashboard"
          >
            <span class="mdi mdi-video"></span>
            <span>방송하기</span>
          </button>
          <button 
            v-if="isChannelManager || isSameUser(currentUserId, streamerId)"
            class="manage-button"
            @click="goToChannelManage"
          >
            <span class="mdi mdi-cog"></span>
            <span>채널 관리</span>
          </button>
        </div>
      </div>
      
      <!-- 채널 네비게이션 -->
      <div class="channel-navigation">
        <button 
          class="nav-item"
          :class="{ active: activeTab === 'home' }"
          @click="activeTab = 'home'"
        >
          홈
        </button>
        <button 
          class="nav-item"
          :class="{ active: activeTab === 'videos' }"
          @click="activeTab = 'videos'"
        >
          동영상
        </button>
        <button 
          class="nav-item"
          :class="{ active: activeTab === 'clips' }"
          @click="activeTab = 'clips'"
        >
          클립
        </button>
        <button 
          class="nav-item"
          :class="{ active: activeTab === 'community' }"
          @click="activeTab = 'community'"
        >
          커뮤니티
        </button>
        <button 
          class="nav-item"
          :class="{ active: activeTab === 'info' }"
          @click="activeTab = 'info'"
        >
          정보
        </button>
      </div>
    </div>
    
    <div v-else class="not-found">
      <p>채널 정보를 찾을 수 없습니다.</p>
    </div>
    
    <!-- 채널 컨텐츠 영역 (향후 확장) -->
    <div class="channel-content">
      <!-- 홈 탭 내용 -->
      <div v-if="activeTab === 'home'" class="tab-content">
        <p>홈 탭 내용이 여기에 표시됩니다.</p>
      </div>
      
      <!-- 동영상 탭 내용 -->
      <div v-if="activeTab === 'videos'" class="tab-content">
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
        
        <!-- 동영상 그리드 -->
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
        
        <!-- 로딩 표시 -->
        <div v-if="videoLoading" class="loading-container">
          <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
        </div>
        
        <!-- 비디오가 없을 때 -->
        <div v-if="videos.length === 0 && !videoLoading" class="no-videos">
          <p>등록된 동영상이 없습니다.</p>
        </div>
        
        <!-- 무한 스크롤 감지용 요소 -->
        <div ref="infiniteScrollTrigger" class="infinite-scroll-trigger"></div>
      </div>
      
      <!-- 다른 탭들의 영역 -->
      <div v-if="activeTab === 'clips'" class="tab-content">
        <p>클립 탭 내용이 여기에 표시됩니다.</p>
      </div>
      
      <div v-if="activeTab === 'community'" class="tab-content">
        <p>커뮤니티 탭 내용이 여기에 표시됩니다.</p>
      </div>
      
      <div v-if="activeTab === 'info'" class="tab-content">
        <p>정보 탭 내용이 여기에 표시됩니다.</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export default {
  data() {
    return {
      streamerId: null,
      streamerInfo: null,
      loading: true,
      error: null,
      isLoggedIn: false,
      currentUserId: null,
      isChannelManager: false,
      activeTab: 'home',
      defaultProfileImage: 'https://bestplace-media.s3.ap-northeast-2.amazonaws.com/bestplace-basic-profile-image.png',
      // 동영상 관련 데이터
      videos: [],
      videoPage: 0,
      hasMoreVideos: true,
      videoLoading: false,
      videoSortType: 'views',
      userIsAdult: false,
      observer: null
    };
  },
  
  created() {
    // URL에서 스트리머 ID 추출
    this.streamerId = this.$route.params.id;
    
    console.log('라우트 정보:', this.$route);
    console.log('파라미터 확인:', this.$route.params);
    console.log('추출된 스트리머 ID:', this.streamerId);
    
    // 라우트 파라미터에서 id를 찾을 수 없는 경우, URL 경로에서 직접 추출 시도
    if (!this.streamerId || this.streamerId === 'undefined') {
      const urlPath = window.location.pathname;
      console.log('현재 URL 경로:', urlPath);
      
      // URL 경로가 /channel/숫자 형태인지 확인
      const matches = urlPath.match(/\/channel\/(\d+)/);
      if (matches && matches[1]) {
        this.streamerId = matches[1];
        console.log('URL에서 직접 추출한 스트리머 ID:', this.streamerId);
      } else {
        console.error('URL에서 유효한 스트리머 ID를 찾을 수 없음');
        this.error = '유효하지 않은 채널 정보입니다.';
        this.loading = false;
        return;
      }
    }
    
    // 이 시점에서도 스트리머 ID가 유효하지 않으면 처리 중단
    if (!this.streamerId || this.streamerId === 'undefined' || isNaN(Number(this.streamerId))) {
      console.error('유효하지 않은 스트리머 ID:', this.streamerId);
      this.error = '유효하지 않은 채널 정보입니다.';
      this.loading = false;
      return;
    }
    
    // 로그인 상태 및 현재 사용자 ID 확인
    this.checkLoginStatus();
    this.getCurrentUserId();
    
    // 채널 정보 로드
    this.loadChannelInfo();
    
    // 채널 관리자 권한 확인 (로그인 상태이고 streamerId가 유효한 경우에만)
    if (this.isLoggedIn && this.streamerId && this.streamerId !== 'undefined') {
      this.checkChannelManagerPermission();
    }
  },
  
  mounted() {
    // 무한 스크롤 설정
    this.setupInfiniteScroll();
    
    // 유저 성인 여부 확인
    this.checkUserIsAdult();
  },
  
  beforeUnmount() {
    // 컴포넌트 언마운트 시 observer 해제
    this.cleanupObserver();
  },
  
  methods: {
    // 로그인 상태 확인
    checkLoginStatus() {
      const token = localStorage.getItem('token');
      this.isLoggedIn = !!token;
    },
    
    // 현재 사용자 ID 가져오기
    getCurrentUserId() {
      // 로컬스토리지에서 직접 userId 가져오기
      this.currentUserId = localStorage.getItem('userId');
      
      // userId가 없으면 토큰에서 시도
      if (!this.currentUserId && localStorage.getItem('token')) {
        try {
          const token = localStorage.getItem('token');
          const decodedToken = jwtDecode(token);
          if (decodedToken && decodedToken.sub) {
            this.currentUserId = decodedToken.sub;
          }
        } catch (error) {
          console.error('토큰 디코딩 실패:', error);
        }
      }
      
      console.log('현재 사용자 ID:', this.currentUserId);
    },
    
    // 채널 정보 로드
    async loadChannelInfo() {
      this.loading = true;
      
      try {
        // streamerId 유효성 검사
        if (!this.streamerId || this.streamerId === 'undefined') {
          throw new Error('유효하지 않은 스트리머 ID');
        }
        
        const memberApiUrl = process.env.VUE_APP_MEMBER_API;
        const endpoint = `/member/info/${this.streamerId}`;
        
        console.log('채널 정보 요청 URL:', `${memberApiUrl}${endpoint}`);
        
        // API 요청 헤더 설정
        const headers = {};
        if (this.isLoggedIn) {
          const token = localStorage.getItem('token');
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await axios.get(`${memberApiUrl}${endpoint}`, { headers });
        
        if (response.data && response.data.result) {
          this.streamerInfo = response.data.result;
          console.log('받은 스트리머 정보:', this.streamerInfo);
        } else {
          this.error = '채널 정보를 불러올 수 없습니다.';
        }
      } catch (error) {
        console.error('채널 정보 로드 실패:', error);
        this.error = '채널 정보를 불러오는 중 오류가 발생했습니다.';
      } finally {
        this.loading = false;
      }
    },
    
    // 채널 관리자 권한 확인
    async checkChannelManagerPermission() {
      try {
        // streamerId 유효성 검사
        if (!this.streamerId || this.streamerId === 'undefined') {
          console.error('유효하지 않은 스트리머 ID로 관리자 권한 확인 시도');
          this.isChannelManager = false;
          return;
        }
        
        // 현재 사용자가 스트리머 본인인 경우 바로 관리자 권한 부여
        if (this.isSameUser(this.currentUserId, this.streamerId)) {
          console.log('스트리머 본인입니다. 관리자 권한 부여');
          this.isChannelManager = true;
          return;
        }
        
        const streamingApiUrl = process.env.VUE_APP_STREAMING_API;
        const endpoint = `/manager/checking/${this.streamerId}`;
        
        console.log('채널 관리자 권한 확인 요청 URL:', `${streamingApiUrl}${endpoint}`);
        console.log('현재 사용자 ID:', this.currentUserId);
        console.log('스트리머 ID:', this.streamerId);
        
        const token = localStorage.getItem('token');
        const response = await axios.get(`${streamingApiUrl}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('관리자 권한 응답:', response.data);
        
        // 응답이 "Y"인 경우 채널 관리자로 설정
        this.isChannelManager = response.data === 'Y';
        console.log('채널 관리자 여부:', this.isChannelManager);
        
      } catch (error) {
        console.error('채널 관리자 권한 확인 실패:', error);
        this.isChannelManager = false;
      }
    },
    
    // 팔로우 토글
    async toggleFollow() {
      if (!this.isLoggedIn) {
        // 로그인 필요 알림
        alert('로그인이 필요한 기능입니다.');
        this.$router.push('/member/login');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const baseUrl = process.env.VUE_APP_MEMBER_API;
        
        // 스트리머 ID 사용
        const memberId = this.streamerId;
        
        // 팔로우 토글 API 호출
        const response = await axios.post(`${baseUrl}/follow/toggle/${memberId}`, null, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('팔로우 응답:', response.data);
        
        // 상태 업데이트
        this.streamerInfo.isFollow = this.streamerInfo.isFollow === 'Y' ? 'N' : 'Y';
        
        // 팔로워 수 업데이트
        if (this.streamerInfo.isFollow === 'Y') {
          this.streamerInfo.followerCount++;
        } else {
          this.streamerInfo.followerCount = Math.max(0, this.streamerInfo.followerCount - 1);
        }
      } catch (error) {
        console.error('팔로우 토글 실패:', error);
        alert('팔로우 처리 중 오류가 발생했습니다.');
      }
    },
    
    // 채널 관리 페이지로 이동
    goToChannelManage() {
      this.$router.push(`/channel/setting/${this.streamerId}`);
    },
    
    // 방송 대시보드로 이동
    goToStreamerDashboard() {
      this.$router.push(`/streamer/${this.streamerId}/dashboard`);
    },
    
    // 현재 사용자 ID가 스트리머 ID와 동일한지 확인
    isSameUser(userId, streamerId) {
      return String(userId) === String(streamerId);
    },
    
    // 숫자 포맷팅 (1000 -> 1,000)
    formatNumber(num) {
      if (num === undefined || num === null) return '0';
      
      if (num >= 10000) {
        return (num / 10000).toFixed(1) + '만';
      }
      
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    // 동영상 관련 메소드
    
    // 정렬 방식 변경
    changeVideoSort(sortType) {
      this.videoSortType = sortType;
      this.videos = [];
      this.videoPage = 0;
      this.hasMoreVideos = true;
      this.fetchVideos();
    },
    
    // 동영상 목록 불러오기
    async fetchVideos() {
      if (this.videoLoading || !this.hasMoreVideos) return;
      
      this.videoLoading = true;
      
      try {
        const memberApi = process.env.VUE_APP_MEMBER_API;
        const url = `${memberApi}/video/vod/list/streamer/${this.videoSortType}`;
        
        const response = await axios.get(url, {
          params: {
            streamerId: this.streamerId,
            page: this.videoPage
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
          
          this.videos = [...this.videos, ...newVideos];
          this.hasMoreVideos = this.videoPage < result.totalPages - 1;
          this.videoPage++;
        }
      } catch (error) {
        console.error('동영상 목록을 불러오는 중 오류 발생:', error);
      } finally {
        this.videoLoading = false;
      }
    },
    
    // 무한 스크롤 설정
    setupInfiniteScroll() {
      const options = {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
      };
      
      this.observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !this.videoLoading && this.activeTab === 'videos') {
          this.fetchVideos();
        }
      }, options);
      
      this.$nextTick(() => {
        const trigger = this.$refs.infiniteScrollTrigger;
        if (trigger) {
          this.observer.observe(trigger);
        }
      });
    },
    
    // Observer 정리
    cleanupObserver() {
      if (this.observer) {
        this.observer.disconnect();
      }
    },
    
    // 동영상 상세 페이지로 이동
    goToVideoDetail(videoId) {
      this.$router.push(`/vod/${videoId}`);
    },
    
    // 카테고리 페이지로 이동
    goToCategory(category) {
      this.$router.push(`/category/${category}`);
    },
    
    // 성인 컨텐츠 관련 함수
    
    // 유저 성인 여부 확인
    checkUserIsAdult() {
      try {
        const token = localStorage.getItem('token');
        this.isLoggedIn = !!token;
        
        if (this.isLoggedIn && token) {
          try {
            const decoded = jwtDecode(token);
            this.userIsAdult = decoded && decoded.isAdult === 'Y';
          } catch (error) {
            console.error('토큰 디코딩 중 오류 발생:', error);
            this.userIsAdult = false;
          }
        }
      } catch (error) {
        console.error('성인 여부 확인 중 오류:', error);
        this.userIsAdult = false;
      }
    },
    
    isAdultContent(video) {
      return video.isAdult === 'Y';
    },
    
    shouldBlurThumbnail(video) {
      return this.isAdultContent(video) && this.isLoggedIn && this.userIsAdult;
    },
    
    shouldHideThumbnail(video) {
      return this.isAdultContent(video) && (!this.isLoggedIn || !this.userIsAdult);
    },
    
    // 시간 포맷팅
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
    
    // 썸네일 미리보기 관련 메서드
    startPreviewTimer(index) {
      const video = this.videos[index];
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
    },
    
    stopPreview(index) {
      const video = this.videos[index];
      if (!video) return;
      
      // 타이머가 있으면 클리어
      if (video.hoverTimer) {
        clearTimeout(video.hoverTimer);
        video.hoverTimer = null;
      }
      
      // 미리보기 숨김
      video.showPreview = false;
    },
    
    // 해시태그 포맷팅
    formatHashtags(hashtags) {
      // 빈 값이거나 undefined인 경우 빈 배열 반환
      if (!hashtags) return [];
      
      try {
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
              if (!clean) return [];
              return clean.split(',').map(tag => tag.trim()).filter(Boolean);
            }
          }
          // 일반 문자열이면 그대로 반환
          return [hashtags];
        }
        
        // 배열인 경우 그대로 반환
        if (Array.isArray(hashtags)) {
          return hashtags;
        }
      } catch (error) {
        console.error('해시태그 파싱 오류:', error);
      }
      
      return [];
    }
  },
  
  watch: {
    // activeTab 변경 시 동영상 목록 로드
    activeTab(newTab) {
      if (newTab === 'videos' && this.videos.length === 0) {
        this.fetchVideos();
      }
      
      // 무한 스크롤 트리거 업데이트
      this.$nextTick(() => {
        const trigger = this.$refs.infiniteScrollTrigger;
        if (trigger && this.observer) {
          this.observer.disconnect();
          this.observer.observe(trigger);
        }
      });
    }
  }
};
</script>

<style scoped>
.channel-container {
  width: 100%;
  background-color: #141517;
  color: white;
  min-height: 100vh;
  padding-bottom: 40px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #adb5bd;
}

.channel-header {
  width: 100%;
  padding: 20px 20px 0 20px;
}

.profile-section {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 16px 0;
  position: relative;
}

.profile-image-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid transparent;
}

.streaming-active {
  border-color: #ff3b3b;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.live-badge {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ff3b3b;
  color: white;
  font-size: 12px;
  font-weight: bold;
  padding: 3px 8px;
  border-radius: 12px;
  text-transform: uppercase;
}

.streamer-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.streamer-name {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}

.follower-count {
  font-size: 16px;
  color: #adb5bd;
  margin: 0 0 2px 0;
}

.streamer-introduction {
  font-size: 15px;
  color: #e0e0e0;
  line-height: 1.5;
  max-width: 600px;
  white-space: pre-line;
  margin: 0 0 8px 0;
}

.channel-actions {
  display: flex;
  gap: 12px;
  margin-top: 6px;
}

.follow-button, .manage-button {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.follow-button {
  background: #B084CC;
  color: #000;
}

.follow-button.following {
  background: #2D2D2D;
  color: #fff;
}

.manage-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #1A1A1A;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 15px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  font-weight: 500;
}

.manage-button:hover {
  background-color: #333333;
}

.manage-button i, .stream-button i, 
.manage-button .mdi, .stream-button .mdi {
  margin-right: 7px;
  font-size: 16px;
}

.follow-button:hover {
  background: #9a6cb7;
}

.follow-button.following:hover {
  background: #3D3D3D;
}

.channel-navigation {
  display: flex;
  gap: 32px;
  border-bottom: 1px solid #2c2c2c;
  margin-top: 24px;
  padding-bottom: 0;
}

.nav-item {
  padding: 12px 4px;
  background: transparent;
  border: none;
  color: #7B7B7B;
  font-size: 16px;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.nav-item.active {
  color: #fff;
  font-weight: 700;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #B084CC;
}

.channel-content {
  padding: 0 20px;
  min-height: 400px;
  margin-top: 0;
}

.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #adb5bd;
  font-size: 18px;
  margin-top: 16px;
}

.channel-management {
  margin-left: auto;
  margin-right: 20px;
  display: flex;
  gap: 12px;
}

.manage-button, .stream-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #1A1A1A;
  color: white;
  border: 1px solid #ffffff;
  border-radius: 20px;
  padding: 8px 18px;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.3s;
  font-weight: 500;
}

.manage-button:hover, .stream-button:hover {
  background-color: #333333;
}

.fas.fa-cog, .fas.fa-video {
  font-size: 14px;
}

/* 탭 컨텐츠 영역 */
.tab-content {
  padding: 0;
  margin-top: 12px;
}

/* 동영상 관련 스타일 */
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
  border-radius: 0;
  overflow: hidden;
  background-color: #141517;
  transition: none;
  border: none;
  box-shadow: none;
}

.video-item:hover {
  background-color: transparent;
}

.thumbnail-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 0;
}

.thumbnail {
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
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 12px;
  font-weight: 400;
  color: white;
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
  min-height: auto;
}

.video-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #adb5bd;
  margin-bottom: 3px;
}

.dot-separator {
  color: #adb5bd;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 6px;
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
</style>