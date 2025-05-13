<template>
    <v-app-bar app color="#141517" dark elevation="0" class="header-no-border">
      <div class="logo-container ml-4">
        <router-link to="/" class="d-flex align-center text-decoration-none">
          <v-img src="@/assets/BEST_PLACE_logo.gif" height="30" width="100" alt="logo" />
        </router-link>
      </div>
  
      <v-spacer />
  
      <v-spacer />
      
      <!-- 방송하기 버튼 추가 -->
      <v-btn 
        text
        variant="plain"
        class="mr-2 broadcast-btn" 
        :to="`/streamer/${getMemberId()}/doBroadcast`"
      >
      <v-icon size="40">mdi-video</v-icon>
      </v-btn>
  
      <!-- 로그인 안 된 상태 -->
      <v-btn text v-if="!isLogin" @click="goToLogin">로그인</v-btn>
  
      <!-- 로그인 된 상태: 프로필 아바타 및 메뉴 -->
      <div v-if="isLogin" class="position-relative">
        <!-- 프로필 아바타 -->
        <v-avatar
            size="36"
            class="cursor-pointer mx-2"
            @click="profileMenuOpen = !profileMenuOpen"
        >
          <v-img :src="userProfile.profileImage || '@/assets/profile.png'" />
        </v-avatar>
  
        <!-- 프로필 드롭다운 메뉴 -->
        <v-menu
            v-model="profileMenuOpen"
            :close-on-content-click="false"
            location="bottom end"
            offset="5"
        >
          <template v-slot:activator="{ props }">
            <v-btn
                icon
                variant="plain"
                v-bind="props"
                size="small"
                class="ml-1"
            >
              <v-icon>mdi-chevron-down</v-icon>
            </v-btn>
          </template>
  
          <v-card min-width="200" class="profile-menu">
            <!-- 사용자 정보 헤더 -->
            <v-card-item>
              <div class="d-flex align-center">
                <v-avatar size="36" class="cursor-pointer mx-2" @click="profileMenuOpen = !profileMenuOpen">
                  <v-img :src="userProfile.profileImage || '@/assets/profile-avatar.png'" />
                </v-avatar>
                <div class="cursor-pointer" @click="$router.push('/my-profile')">
                  <v-card-title class="pa-0 text-body-1">{{ userProfile.nickname || '사용자' }}</v-card-title>
                  <v-card-subtitle class="pa-0 text-caption">{{ userProfile.email }}</v-card-subtitle>
                </div>
              </div>
            </v-card-item>
  
            <v-divider></v-divider>
  
            <!-- 메뉴 항목들 -->
            <v-list density="compact">
              <v-list-item :to="`/channel/${userProfile.id}`">
                <template v-slot:prepend>
                  <v-icon>mdi-account</v-icon>
                </template>
                <v-list-item-title>내 채널</v-list-item-title>
              </v-list-item>
  
              <v-list-item to="/member/my/clip">
                <template v-slot:prepend>
                  <v-icon>mdi-video-box</v-icon>
                </template>
                <v-list-item-title>내 클립</v-list-item-title>
              </v-list-item>
  
              <v-list-item to="/following">
                <template v-slot:prepend>
                  <v-icon>mdi-star</v-icon>
                </template>
                <v-list-item-title>팔로잉</v-list-item-title>
              </v-list-item>
  
              <v-divider></v-divider>
  
              <v-list-item @click="doLogout">
                <template v-slot:prepend>
                  <v-icon>mdi-logout</v-icon>
                </template>
                <v-list-item-title>로그아웃</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
      </div>
    </v-app-bar>
  </template>
  
  <script>
  import axios from 'axios';
  import { jwtDecode } from 'jwt-decode';
  
  export default {
    data() {
      return {
        isLogin: false,
        profileMenuOpen: false,
        defaultAvatar: require('@/assets/default-avatar.png'),
        userProfile: {
          nickname: '',
          email: '',
          profileImage: ''
        }
      };
    },
    mounted() {
      // 토큰이 존재하면 로그인 상태로 변경 및 사용자 정보 가져오기
      if (localStorage.getItem('token')) {
        this.isLogin = true;
        this.fetchUserProfile();
      }
    },
    methods: {
      doLogout() {
        localStorage.clear();
        this.isLogin = false;
        this.profileMenuOpen = false;
        this.$router.push('/');
      },
      async fetchUserProfile() {
        try {
          // 백엔드 API URL을 실제 서비스에 맞게 변경하세요
          const token = localStorage.getItem('token');
          if (!token) return;
          
          const response = await axios.get(`${process.env.VUE_APP_MEMBER_API}/member/my/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('API 응답 데이터:', response.data);
          
          if (response.data && response.data.result) {
            const userData = response.data.result;
            this.userProfile = {
              // 새 DTO 필드에 맞게 매핑
              id: userData.id,
              nickname: userData.memberNickname || '사용자',
              email: userData.email || '',
              profileImage: userData.profileImageUrl || this.defaultAvatar
            };
            console.log("사용자 정보 로드됨:", this.userProfile);
          }
        } catch (error) {
          console.error('사용자 정보를 가져오는 중 오류 발생:', error);
          console.error('에러 세부정보:', error.response?.data);
          this.userProfile = {
            nickname: '사용자',
            email: '없음',
            profileImage: this.defaultAvatar
          };
        }
      },
      goToLogin() {
        window.location.href = '/member/login';
      },
      getMemberId() {
        const token = localStorage.getItem('token');
        if (token) {
          const payload = jwtDecode(token);
          return payload.sub;
        }
        return '';
      }
    },
  };
  </script>
  
  <style scoped>
  .search-bar {
    max-width: 400px;
  }
  
  .logo-container {
    margin-left: 16px;
    padding-left: 5px;
  }
  
  .chzzk-search {
    border-radius: 20px;
    overflow: hidden;
  }
  
  .chzzk-search :deep(.v-field__outline) {
    color: rgba(255, 255, 255, 0.5) !important;
    opacity: 1;
  }
  
  .chzzk-search :deep(.v-field__input) {
    color: #ffffff;
  }
  
  .chzzk-search :deep(.v-field) {
    border-radius: 20px;
    background-color: #000000;
    border: 1px solid rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
  }
  
  .chzzk-search :deep(.v-field:hover) {
    border-color: rgba(255, 255, 255, 0.5);
  }
  
  .chzzk-search :deep(.v-field--focused) {
    border-color: rgba(255, 255, 255, 0.7) !important;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.3);
  }
  
  .chzzk-search :deep(.v-field--focused .v-field__outline) {
    opacity: 0;
  }
  
  .chzzk-search :deep(.v-field__prepend-inner) {
    color: #ffffff;
    opacity: 0.7;
    transition: opacity 0.3s ease;
  }
  
  .chzzk-search :deep(.v-field--focused .v-field__prepend-inner) {
    opacity: 1;
  }
  
  /* 모바일 화면에서 검색창 반응형 처리 */
  @media (max-width: 768px) {
    .search-bar {
      max-width: 200px;
    }
  }
  
  .cursor-pointer {
    cursor: pointer;
  }
  
  .position-relative {
    position: relative;
  }
  
  .profile-menu {
    background-color: #1e2029;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .header-no-border {
    box-shadow: none !important;
    border-bottom: none !important;
  }
  
  .header-no-border :deep(.v-toolbar__content) {
    box-shadow: none !important;
    border-bottom: none !important;
  }
  .broadcast-btn {
    color: rgba(255, 255, 255, 0.7); /* 살짝 회색 섞인 색상 */
    transition: color 0.3s ease;
    height: auto;
    width: auto;
    padding: 0; /* 패딩 제거 */
    margin: 0 10px; /* 좌우 여백 조정 */
    min-width: 0; /* 최소 너비 제거 */
    min-height: 0; /* 최소 높이 제거 */
  }
  
  .broadcast-btn:hover {
    color: #ffffff; /* 호버 시 완전한 하얀색 */
  }
  </style>