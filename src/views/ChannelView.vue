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
            class="manage-button"
            @click="goToChannelManage"
          >
            <i class="fas fa-cog"></i>
            채널 관리
          </button>
        </div>
      </div>
      
      <!-- 채널 네비게이션 -->
      <div class="channel-navigation">
        <button 
          class="nav-item active"
          @click="activeTab = 'home'"
        >
          홈
        </button>
        <button 
          class="nav-item"
          @click="activeTab = 'videos'"
        >
          동영상
        </button>
        <button 
          class="nav-item"
          @click="activeTab = 'clips'"
        >
          클립
        </button>
        <button 
          class="nav-item"
          @click="activeTab = 'community'"
        >
          커뮤니티
        </button>
        <button 
          class="nav-item"
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
      <!-- 여기에 선택된 탭에 따른 컨텐츠 표시 -->
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
      defaultProfileImage: 'https://bestplace-media.s3.ap-northeast-2.amazonaws.com/bestplace-basic-profile-image.png'
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
  padding: 20px;
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

.fas.fa-cog {
  font-size: 14px;
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
  font-weight: 500;
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
  padding: 24px;
  min-height: 400px;
}

.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #adb5bd;
  font-size: 18px;
}

.channel-management {
  margin-left: auto;
  margin-right: 20px;
}
</style>