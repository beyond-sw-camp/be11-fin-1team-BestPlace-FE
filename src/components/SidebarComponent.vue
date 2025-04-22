<template>
  <v-navigation-drawer app permanent width="200" color="#141517" class="sidebar" elevation="0">
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

        <router-link to="/category" custom v-slot="{ isExactActive, navigate }">
          <div @click="navigate" :class="['menu-item', { 'is-active': isExactActive }]">
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
              <v-icon small color="#5D5F61">mdi-chevron-down</v-icon>
            </div>
          </div>
          
          <div v-if="loading" class="text-center py-2">
            <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
          </div>
          <div v-else-if="followedChannels.length === 0" class="text-center pa-2 empty-follow-text">
            팔로우한 채널이 없습니다
          </div>
          <div v-else class="channel-list">
            <router-link 
              v-for="channel in followedChannels" 
              :key="channel.id" 
              :to="`/channel/${channel.id}`" 
              custom 
              v-slot="{ isExactActive, navigate }"
            >
              <div @click="navigate" :class="['channel-item', { 'is-active': isExactActive }]">
                <v-avatar size="32" class="channel-avatar">
                  <v-img :src="channel.profileImage || '/default-profile.png'" alt="채널 이미지"></v-img>
                </v-avatar>
                <span class="channel-name text-truncate">{{ channel.name }}</span>
                <v-chip
                  v-if="channel.isLive"
                  color="error"
                  size="x-small"
                  class="px-1 live-chip ml-auto"
                >
                  LIVE
                </v-chip>
              </div>
            </router-link>
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
      isLoggedIn: false
    };
  },

  methods: {
    async fetchFollowedChannels() {
      try {
        this.loading = true;
        const userId = localStorage.getItem('userId') || '';

        if (!userId) {
          this.isLoggedIn = false;
          return;
        }
        
        this.isLoggedIn = true;
        
        const response = await axios.get('/follow/list', {
          headers: {
            'X-User-Id': userId
          }
        });

        if (response.data && response.data.result) {
          this.followedChannels = response.data.result.map(channel => ({
            id: channel.id,
            name: channel.name,
            profileImage: channel.profileImage,
            isLive: channel.isLive || false
          }));
        }
      } catch (error) {
        console.error('팔로우 채널 목록을 가져오는 중 오류 발생:', error);
      } finally {
        this.loading = false;
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
  color: #5D5F61 !important;
  margin-right: 8px !important;
  font-size: 20px !important;
}

.menu-title {
  color: #A0A0A0;
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
  font-weight: 600 !important;
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

.channel-avatar {
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-right: 8px;
  flex-shrink: 0;
}

.channel-name {
  color: #A0A0A0;
  font-size: 12px;
  font-weight: 500;
  margin-left: 4px;
  flex-grow: 1;
}

/* 호버 효과 - 색상만 변경 */
.channel-item:hover .channel-name {
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
  color: #444;
}

.text-truncate {
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.divider-style {
  border-color: rgba(255, 255, 255, 0.1) !important;
  margin-left: 8px;
  margin-right: 8px;
}
</style>