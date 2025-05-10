<template>
  <div class="search-page">
    <h1 class="text-white search-title">채널</h1>
    
    <div v-if="loading" class="text-center my-5">
      <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
      <p class="mt-3 text-white">검색 중...</p>
    </div>
    
    <div v-else-if="streamerResults.length > 0" class="search-results">
      <!-- 첫 번째 스트리머만 표시 -->
      <div class="streamer-list" v-if="streamerResults.length > 0">
        <div 
          class="streamer-item"
          @click="goToStreamerChannel(streamerResults[0].streamerId)"
        >
          <div class="streamer-profile">
            <!-- 프로필 이미지 (스트리밍 중인 경우 테두리 추가) -->
            <div 
              class="profile-image-wrapper" 
              :class="{ 'streaming-active': streamerResults[0].streamingYn === 'Y' }"
            >
              <v-img
                :src="streamerResults[0].streamerProfileImageUrl"
                class="profile-image"
                cover
              />
              <!-- LIVE 뱃지 -->
              <div v-if="streamerResults[0].streamingYn === 'Y'" class="live-badge">
                LIVE
              </div>
            </div>
            
            <div class="streamer-info">
              <h3 class="streamer-name">{{ streamerResults[0].streamerNickName }}</h3>
              <p class="follower-count">팔로워 {{ formatNumber(streamerResults[0].followerCount) }}명</p>
            </div>
          </div>
          
          <!-- 팔로우 버튼 - 자신의 ID가 아닌 경우에만 표시 -->
          <button 
            v-if="isLoggedIn && !isSameUser(currentUserId, streamerResults[0].streamerId)"
            class="follow-button" 
            :class="{ 'following': streamerResults[0].isFollow === 'Y' }"
            @click.stop="toggleFollow(streamerResults[0])"
          >
            {{ streamerResults[0].isFollow === 'Y' ? '팔로잉' : '팔로우' }}
          </button>
        </div>
      </div>
      
      <!-- 첫 번째 스트리머의 동영상 섹션 -->
      <div v-if="streamerResults.length > 0 && videos.length > 0" class="videos-section">
        <h3 class="section-title">{{ streamerResults[0].streamerNickName }}의 동영상</h3>
        
        <!-- 동영상 가로 스크롤 (최대 3개) -->
        <div class="videos-row">
          <div 
            v-for="(video, index) in limitedVideos" 
            :key="index" 
            class="video-item"
            @click="handleVideoClick(video)"
          >
            <!-- 비디오 아이템 내부 레이아웃 -->
            <div class="video-item-inner">
              <!-- 썸네일 컨테이너 (왼쪽) -->
              <div class="thumbnail-wrapper">
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
                  
                  <!-- 연령 제한 표시 -->
                  <div v-if="isAdultContent(video)" class="age-restriction-overlay">
                    <div class="age-restriction-content">
                      <div class="age-icon-circle">19</div>
                    </div>
                  </div>
                  
                  <!-- 재생 시간 -->
                  <div class="duration">{{ video.duration }}</div>
                </div>
              </div>
              
              <!-- 비디오 정보 (오른쪽) -->
              <div class="video-info">
                <div class="video-title">{{ video.title }}</div>
                
                <div class="video-meta">
                  <!-- 조회수와 시간 정보 -->
                  <div class="view-time-info">
                    <span class="view-count">
                      <v-icon size="x-small" class="mr-1">mdi-eye</v-icon>
                      {{ formatNumber(video.views || 0) }}
                    </span>
                    <span class="dot-separator">•</span>
                    <span class="video-time">{{ formatTime(video.createdTime) }}</span>
                  </div>
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
                    v-for="(tag, i) in video.hashtags.length > 0 ? limitHashtags(video.hashtags) : []" 
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
        
        <!-- 비디오 로딩 -->
        <div v-if="loadingVideos" class="text-center my-5">
          <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
          <p class="mt-3 text-white">동영상 불러오는 중...</p>
        </div>
      </div>
      
      <!-- 나머지 스트리머 목록 (첫 번째 제외) -->
      <div class="streamer-grid remaining-streamers" v-if="streamerResults.length > 1">
        <div 
          v-for="(streamer, index) in remainingStreamers" 
          :key="index"
          class="streamer-item"
          @click="goToStreamerChannel(streamer.streamerId)"
        >
          <div class="streamer-profile">
            <!-- 프로필 이미지 (스트리밍 중인 경우 테두리 추가) -->
            <div 
              class="profile-image-wrapper" 
              :class="{ 'streaming-active': streamer.streamingYn === 'Y' }"
            >
              <v-img
                :src="streamer.streamerProfileImageUrl"
                class="profile-image"
                cover
              />
              <!-- LIVE 뱃지 -->
              <div v-if="streamer.streamingYn === 'Y'" class="live-badge">
                LIVE
              </div>
            </div>
            
            <div class="streamer-info">
              <h3 class="streamer-name">{{ streamer.streamerNickName }}</h3>
              <p class="follower-count">팔로워 {{ formatNumber(streamer.followerCount) }}명</p>
            </div>
          </div>
          
          <!-- 팔로우 버튼 - 자신의 ID가 아닌 경우에만 표시 -->
          <button 
            v-if="isLoggedIn && !isSameUser(currentUserId, streamer.streamerId)"
            class="follow-button" 
            :class="{ 'following': streamer.isFollow === 'Y' }"
            @click.stop="toggleFollow(streamer)"
          >
            {{ streamer.isFollow === 'Y' ? '팔로잉' : '팔로우' }}
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="text-center my-5 text-white">
      <v-icon large color="white">mdi-magnify-close</v-icon>
      <h3 class="mt-3">검색 결과가 없습니다</h3>
      <p>다른 검색어로 다시 시도해보세요.</p>
    </div>
    
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
import { jwtDecode } from 'jwt-decode';

export default {
  data() {
    return {
      searchQuery: '',
      streamerResults: [],
      loading: true,
      isLoggedIn: false,
      currentUserId: null,
      // 동영상 관련 데이터
      videos: [],
      loadingVideos: false,
      defaultProfileImage: 'https://bestplace-media.s3.ap-northeast-2.amazonaws.com/bestplace-basic-profile-image.png',
      userIsAdult: false,
      adultAlertModalOpen: false,
      selectedVideo: null
    };
  },
  
  computed: {
    // 최대 2개로 제한된 비디오 목록
    limitedVideos() {
      return this.videos.slice(0, 2);
    },
    
    // 첫 번째 스트리머를 제외한 나머지 스트리머 목록
    remainingStreamers() {
      return this.streamerResults.slice(1);
    }
  },
  
  created() {
    // 현재 사용자 ID 가져오기
    this.getCurrentUserId();
    
    // 로그인 여부 확인
    this.checkLoginStatus();
    
    // URL에서 쿼리 파라미터 가져오기
    this.searchQuery = this.$route.query.q || '';
    
    // 검색어가 있으면 검색 실행
    if (this.searchQuery) {
      this.performSearch();
    } else {
      this.loading = false;
    }
  },
  
  watch: {
    // URL의 쿼리 파라미터가 변경될 때 검색 다시 실행
    '$route.query.q': function(newQuery) {
      this.searchQuery = newQuery || '';
      if (this.searchQuery) {
        this.performSearch();
      } else {
        this.streamerResults = [];
        this.videos = [];
        this.loading = false;
      }
    },
    // 스트리머 결과가 변경될 때 첫 번째 스트리머의 동영상 가져오기
    streamerResults(newResults) {
      if (newResults.length > 0) {
        this.fetchStreamerVideos(newResults[0].streamerId);
      } else {
        this.videos = [];
      }
    }
  },
  
  methods: {
    // 현재 사용자 ID 가져오기
    getCurrentUserId() {
      // 로컬스토리지에서 직접 userId 가져오기
      this.currentUserId = localStorage.getItem('userId');
      console.log('로컬스토리지에서 가져온 userId:', this.currentUserId);
      
      // userId가 없으면 토큰에서 시도
      if (!this.currentUserId && localStorage.getItem('token')) {
        try {
          const token = localStorage.getItem('token');
          const decodedToken = this.decodeToken(token);
          if (decodedToken && decodedToken.sub) {
            this.currentUserId = decodedToken.sub;
            console.log('토큰에서 가져온 userId:', this.currentUserId);
          }
        } catch (error) {
          console.error('토큰 디코딩 실패:', error);
        }
      }
    },
    
    // 토큰 디코딩 함수
    decodeToken(token) {
      try {
        return jwtDecode(token);
      } catch (e) {
        console.error('토큰 디코딩 오류:', e);
        return {};
      }
    },
    
    // 로그인 상태 확인
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
    
    // 숫자 포맷팅 (1000 -> 1,000)
    formatNumber(num) {
      if (num === undefined || num === null) return '0';
      
      if (num >= 10000) {
        return (num / 10000).toFixed(1) + '만';
      }
      
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    // 팔로우 토글
    async toggleFollow(streamer) {
      if (!this.isLoggedIn) {
        // 로그인 필요 알림
        alert('로그인이 필요한 기능입니다.');
        this.$router.push('/member/login');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const baseUrl = process.env.VUE_APP_MEMBER_API;
        
        // 라이브디테일과 동일하게 수정: memberId 사용, 정확한 엔드포인트 경로 사용
        // 스트리머 닉네임이 아닌 memberId를 사용해야 함
        const memberId = streamer.memberId || streamer.streamerId;
        
        console.log('팔로우 토글 요청:', `${baseUrl}/follow/toggle/${memberId}`);
        console.log('팔로우 대상:', memberId);
        
        // 라이브디테일과 정확히 동일한 경로 사용: /follow/toggle/
        const response = await axios.post(`${baseUrl}/follow/toggle/${memberId}`, null, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('팔로우 응답:', response.data);
        
        // 상태 업데이트
        streamer.isFollow = streamer.isFollow === 'Y' ? 'N' : 'Y';
        
        // 팔로워 수 업데이트
        if (streamer.isFollow === 'Y') {
          streamer.followerCount++;
        } else {
          streamer.followerCount = Math.max(0, streamer.followerCount - 1);
        }
      } catch (error) {
        console.error('팔로우 토글 실패:', error);
        alert('팔로우 처리 중 오류가 발생했습니다.');
      }
    },
    
    async performSearch() {
      this.loading = true;
      this.streamerResults = [];
      
      try {
        // 로그인 상태에 따른 엔드포인트 결정
        const baseUrl = process.env.VUE_APP_MEMBER_API;
        const endpoint = this.isLoggedIn 
          ? '/member/search/auto/nicknames/logined'
          : '/member/search/auto/nicknames/notlogin';
        
        // 요청 헤더 설정
        const headers = {};
        if (this.isLoggedIn) {
          const token = localStorage.getItem('token');
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // API 요청
        const response = await axios.get(`${baseUrl}${endpoint}`, {
          params: { keyword: this.searchQuery },
          headers
        });
        
        // 응답 데이터 처리
        if (response.data && response.data.result) {
          this.streamerResults = response.data.result;
        }
      } catch (error) {
        console.error('검색 결과 로드 실패:', error);
        // 에러 처리
      } finally {
        this.loading = false;
      }
    },
    
    // 현재 사용자 ID가 스트리머 ID와 동일한지 확인
    isSameUser(userId, streamerId) {
      console.log('비교: 현재 userId:', userId, '타입:', typeof userId);
      console.log('비교: 스트리머 ID:', streamerId, '타입:', typeof streamerId);
      
      // 둘 다 문자열로 변환해서 비교
      return String(userId) === String(streamerId);
    },
    
    // 스트리머의 동영상 가져오기
    async fetchStreamerVideos(streamerId) {
      if (!streamerId) return;
      
      this.loadingVideos = true;
      this.videos = [];
      
      try {
        const baseUrl = process.env.VUE_APP_MEMBER_API;
        const endpoint = '/video/vod/list/streamer/recent';
        const params = {
          streamerId: streamerId,
          page: 0,
        };
        
        console.log('동영상 요청 URL:', `${baseUrl}${endpoint}`);
        console.log('동영상 요청 파라미터:', params);
        
        const response = await axios.get(`${baseUrl}${endpoint}`, { params });
        console.log('동영상 응답 데이터:', response.data);
        
        if (response.data && response.data.result) {
          const result = response.data.result;
          this.videos = result.content.map(video => ({
            ...video,
            showPreview: false,
            hoverTimer: null
          }));
        }
      } catch (error) {
        console.error('동영상 목록 로드 실패:', error);
      } finally {
        this.loadingVideos = false;
      }
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
    },
    
    // 카테고리 페이지로 이동하는 메서드
    goToCategory(category) {
      if (!category) return;
      
      console.log('카테고리로 이동:', category);
      // 현재 경로가 이미 해당 카테고리 페이지면 이동하지 않음
      if (this.$route.path === `/category/${category}`) return;
      
      this.$router.push(`/category/${category}`);
    },
    
    // 스트리머 채널로 이동
    goToStreamerChannel(streamerId) {
      if (!streamerId) return;
      
      console.log('스트리머 채널로 이동:', streamerId);
      this.$router.push(`/channel/${streamerId}`);
    },
    
    // 화면에 맞는 해시태그만 표시하는 함수
    limitHashtags(hashtags) {
      if (!hashtags || !Array.isArray(hashtags)) return [];
      
      // 길이가 짧은 태그 우선 표시 (최대 3개)
      return hashtags
        .slice(0, 3)
        .filter(tag => tag && tag.length < 15); // 너무 긴 태그는 제외
    }
  }
};
</script>

<style scoped>
.search-page {
  padding: 16px 20px;
  width: 100%;
  color: white;
  min-height: calc(100vh - 64px);
}

.search-title {
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 500;
}

.search-results {
  margin-top: 20px;
}

.streamer-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.streamer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: #141517;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.streamer-item:hover {
  background-color: #1a1b1e;
}

.streamer-profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-image-wrapper {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.streaming-active {
  border: 2px solid #ff3b3b;
}

.live-badge {
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ff3b3b;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  text-transform: uppercase;
}

.streamer-info {
  display: flex;
  flex-direction: column;
}

.streamer-name {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 4px;
}

.follower-count {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.follow-button {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: #B084CC;
  color: #000;
}

.follow-button.following {
  background: #2D2D2D;
  color: #fff;
}

.follow-button:hover {
  background: #B084CC;
}

.follow-button.following:hover {
  background: #3D3D3D;
}

/* 동영상 섹션 스타일 */
.videos-section {
  margin-top: 30px;
  padding: 20px;
  background-color: #141517;
  border-radius: 8px;
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 20px;
  color: white;
}

/* 동영상 가로 스크롤 */
.videos-row {
  display: flex;
  justify-content: flex-start;
  gap: 20px;
  padding-bottom: 10px;
  overflow-x: hidden;
}

.video-item {
  flex: 0 0 48%;
  cursor: pointer;
  background-color: #141517;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  margin-bottom: 10px;
}

.video-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.video-item-inner {
  display: flex;
  height: 100%;
  min-height: 120px;
}

.thumbnail-wrapper {
  flex: 0 0 160px;
}

.thumbnail-container {
  position: relative;
  width: 100%;
  height: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: 500;
}

.view-time-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #adb5bd;
}

.dot-separator {
  font-size: 12px;
  color: #adb5bd;
}

.view-count {
  display: flex;
  align-items: center;
}

.video-info {
  flex: 1;
  padding: 8px 8px 12px 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 5px;
  color: white;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
}

.video-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.video-time {
  font-size: 12px;
  color: #adb5bd;
}

/* 태그 스타일 */
.tags-container {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  margin-top: 6px;
  max-height: 24px;
  overflow: hidden;
  width: 100%;
  max-width: 90%;
}

.category-tag {
  font-size: 11px;
  background-color: #B084CC;
  color: black;
  padding: 2px 5px;
  border-radius: 3px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-bottom: 2px;
  white-space: nowrap;
  flex-shrink: 0; /* 태그 너비 축소 방지 */
  display: inline-block;
}

.category-tag:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.hashtag {
  font-size: 11px;
  color: #aaaaaa;
  background-color: transparent;
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid #aaaaaa;
  margin-bottom: 2px;
  white-space: nowrap;
  flex-shrink: 0; /* 태그 너비 축소 방지 */
  display: inline-block;
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
  width: 32px;
  height: 32px;
  background-color: rgba(255, 255, 255, 0.9);
  color: black;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
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

.streamer-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 30px;
}

/* 화면 크기에 따른 반응형 그리드 */
@media (min-width: 992px) {
  .streamer-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 576px) {
  .streamer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
