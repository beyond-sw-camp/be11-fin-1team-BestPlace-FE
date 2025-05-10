<template>
  <v-navigation-drawer app permanent width="200" color="#141517" class="v-navigation-drawer v-navigation-drawer--left v-navigation-drawer--active v-theme--chzzkTheme elevation-0 sidebar">
    <div class="sidebar-content">
      <!-- 기본 메뉴 아이템 -->
      <div class="sidebar-menu">
        <router-link to="/lives" custom v-slot="{ isExactActive, navigate }">
          <div @click="navigate" :class="['menu-item', { 'is-active': isExactActive }]">
            <v-icon class="menu-icon">mdi-video</v-icon>
            <span class="menu-title">전체 방송</span>
          </div>
        </router-link>

        <router-link to="/clips" custom v-slot="{ isExactActive, navigate }">
          <div @click="navigate" :class="['menu-item', { 'is-active': isExactActive }]">
            <v-icon class="menu-icon">mdi-video-box</v-icon>
            <span class="menu-title">인기 클립</span>
          </div>
        </router-link>

        <router-link to="/category" custom v-slot="{ isActive, navigate }">
          <div @click="navigate" :class="['menu-item', { 'is-active': isActive || $route.path.startsWith('/category/') }]">
            <v-icon class="menu-icon">mdi-tag-multiple</v-icon>
            <span class="menu-title">카테고리</span>
          </div>
        </router-link>

        <router-link to="/following" custom v-slot="{ isExactActive, navigate }">
          <div @click="navigate" :class="['menu-item', { 'is-active': isExactActive }]">
            <v-icon class="menu-icon">mdi-star</v-icon>
            <span class="menu-title">팔로잉</span>
          </div>
        </router-link>

        <!-- 로그인한 사용자에게만 보이는 메뉴 -->
        <template v-if="isLoggedIn">
          <v-divider class="my-3 divider-style"></v-divider>
          
          <!-- 팔로잉 채널 섹션 -->
          <div class="px-3 py-2">
            <div class="d-flex align-center justify-space-between">
              <span class="caption text-grey font-weight-medium">팔로잉 채널</span>
              <v-icon 
                small 
                color="#5D5F61" 
                class="refresh-icon"
                :class="{ 'rotating': isRefreshing }"
                @click="fetchFollowedChannels"
              >mdi-refresh</v-icon>
            </div>
          </div>
          
          <div v-if="loading" class="text-center py-2">
            <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
          </div>
          <div v-else-if="followedChannels.length === 0" class="text-center pa-2 empty-follow-text">
            팔로우한 채널이 없습니다
          </div>
          <div v-else class="channel-list">
            <div
              v-for="(channel, idx) in followedChannels"
              :key="idx"
              class="channel-item"
              @click="$router.push(`/channel/${channel.userId}`)"
            >
              <div class="profile-wrapper">
                <div
                  class="profile-img"
                  :class="{ 'live-border': channel.liveYn === 'Y' }"
                  style="position: relative;"
                >
                  <img :src="channel.profileImage" alt="프로필" />
                  <span v-if="channel.liveYn === 'Y'" class="live-badge-bottom">LIVE</span>
                </div>
              </div>
              <span class="channel-name text-truncate">{{ channel.name }}</span>
            </div>
          </div>

          <v-divider class="my-3 divider-style"></v-divider>

          <router-link to="/my-profile" custom v-slot="{ isExactActive, navigate }">
            <div @click="navigate" :class="['menu-item', { 'is-active': isExactActive }]">
              <v-icon class="menu-icon">mdi-account</v-icon>
              <span class="menu-title">내 프로필</span>
            </div>
          </router-link>

          <router-link to="/member/my/berry" custom v-slot="{ isExactActive, navigate }">
            <div @click="navigate" :class="['menu-item', { 'is-active': isExactActive }]">
              <v-icon class="menu-icon">mdi-currency-usd</v-icon>
              <span class="menu-title">내 베리</span>
            </div>
          </router-link>

          <router-link to="/member/my/clip" custom v-slot="{ isExactActive, navigate }">
            <div @click="navigate" :class="['menu-item', { 'is-active': isExactActive }]">
              <v-icon class="menu-icon">mdi-video-box</v-icon>
              <span class="menu-title">내 클립</span>
            </div>
          </router-link>
        </template>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      followedChannels: [],
      loading: true,
      isLoggedIn: false,
      memberApi: process.env.VUE_APP_MEMBER_API,
      isRefreshing: false
    };
  },

  methods: {
    async fetchFollowedChannels() {
      if (this.isRefreshing) return;
      
      try {
        this.isRefreshing = true;
        this.loading = true;
        const userId = localStorage.getItem('userId') || '';

        if (!userId) {
          this.isLoggedIn = false;
          return;
        }
        this.isLoggedIn = true;
        const response = await axios.get(`${this.memberApi}/follow/list`);
        // API 응답에 맞게 매핑
        console.log(response.data.result);
        this.followedChannels = (response.data.result || []).map(item => ({
          userId: item.userId,
          name: item.followerNickName,
          profileImage: item.followerImg,
          liveYn: item.liveYn
        }));
      } catch (error) {
        console.error('팔로우 채널 목록을 가져오는 중 오류 발생:', error);
      } finally {
        this.loading = false;
        setTimeout(() => {
          this.isRefreshing = false;
        }, 500); // 애니메이션 시간과 동일하게 설정
      }
    },
    
    checkLoginStatus() {
      const userId = localStorage.getItem('userId');
      this.isLoggedIn = !!userId;
    }
  },

  mounted() {
    this.checkLoginStatus();
    if (this.isLoggedIn) {
      this.fetchFollowedChannels();
    }
  }
};
</script>

<style>
.sidebar {
  background-color: #141517 !important;
  border: none !important;
}

.sidebar-content {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 10px;
}

.sidebar-content::-webkit-scrollbar {
  display: none;
}

/* 기본 메뉴 스타일 */
.sidebar-menu {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  min-height: 42px;
  padding: 0 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  background-color: transparent !important;
  transition: none !important;
}

.menu-icon {
  color: #FFFFFF !important;
  margin-right: 8px !important;
  font-size: 20px !important;
}

.menu-title {
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 500;
}

/* 호버 효과 - 색상만 변경 */
.menu-item:hover .menu-icon,
.menu-item:hover .menu-title {
  color: #B084CC !important;
}

/* 활성화 상태 - 색상만 변경 */
.menu-item.is-active .menu-icon,
.menu-item.is-active .menu-title {
  color: #B084CC !important;
  font-weight: 500 !important;
}

/* 채널 목록 스타일 */
.channel-list {
  display: flex;
  flex-direction: column;
}

.channel-item {
  display: flex;
  align-items: center;
  min-height: 38px;
  padding: 0 12px;
  margin-bottom: 2px;
  border-radius: 8px;
  cursor: pointer;
  background-color: transparent !important;
  transition: none !important;
}

.profile-wrapper {
  position: relative;
  width: 32px;
  height: 32px;
  margin-right: 8px;
}
.profile-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: visible;
  border: 2px solid transparent;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.profile-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  position: relative;
  z-index: 1;
}
.profile-img.live-border {
  border: 2px solid #FF2A46;
}

.channel-name {
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 500;
  margin-left: 4px;
  flex-grow: 1;
}

/* 호버 효과 - 색상만 변경 */.channel-item:hover .channel-name {
  color: #B084CC !important;
}

/* 활성화 상태 - 색상만 변경 */
.channel-item.is-active .channel-name {
  color: #B084CC !important;
  font-weight: 600 !important;
}

/* LIVE 채널 */
.live-chip {
  background-color: #FF2A46 !important;
  font-size: 10px;
  font-weight: bold;
  height: 16px !important;
  flex-shrink: 0;
}

.channel-item:has(.live-chip) .channel-avatar {
  border: 2px solid #FF2A46;
}

.channel-item:has(.live-chip) .channel-name {
  color: #ffffff;
  font-weight: 600;
}

/* 기타 스타일 */
.empty-follow-text {
  font-size: 11px;
  color: #FFFFFF;
}

.text-truncate {
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.divider-style {
  border-color: #FFFFFF !important;
  border-width: 1px !important;
  margin-left: 8px;
  margin-right: 8px;
}

.caption.text-grey.font-weight-medium {
  color: #FFFFFF !important;
}

.live-badge-bottom {
  position: absolute;
  left: 50%;
  bottom: -4px;
  transform: translateX(-50%);
  background: #FF2A46;
  font-size: 6px;
  font-weight: 700;
  padding: 2px 2px 1px 2px;
  border-radius: 8px;
  z-index: 10;
  letter-spacing: 1px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.10);
  min-width: 20px;
  text-align: center;
  line-height: 1.3;
}

.refresh-icon {
  cursor: pointer;
}

.refresh-icon:hover {
  color: #B084CC !important;
}

.refresh-icon.rotating {
  animation: rotate 0.5s ease;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>