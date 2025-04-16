<template>
  <v-app-bar app color="surface" dark>
    <router-link to="/" class="d-flex align-center text-decoration-none">
      <v-img src="@/assets/BEST_PLACE_logo.gif" height="30" width="91" alt="logo" />
    </router-link>

    <v-spacer />

    <!-- 검색창 추가 -->
    <v-text-field
        v-model="searchQuery"
        placeholder="스트리머, 게임 검색"
        prepend-inner-icon="mdi-magnify"
        variant="solo"
        hide-details
        density="compact"
        bg-color="grey-darken-3"
        class="search-bar mx-4"
        @keyup.enter="search"
        rounded
        clearable
    ></v-text-field>

    <v-spacer />

    <!-- 로그인 안 된 상태 -->
    <v-btn text v-if="!isLogin" to="/member/login">로그인</v-btn>

    <!-- 로그인 된 상태: 프로필 아바타 및 메뉴 -->
    <div v-if="isLogin" class="position-relative">
      <!-- 프로필 아바타 -->
      <v-avatar
          size="36"
          class="cursor-pointer mx-2"
          @click="profileMenuOpen = !profileMenuOpen"
      >
        <v-img :src="userProfile.profileImage || 'https://via.placeholder.com/36'" />
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
                <v-img :src="userProfile.profileImage || 'https://via.placeholder.com/36'" />
              </v-avatar>
              <div>
                <v-card-title class="pa-0 text-body-1">{{ userProfile.nickname || '사용자' }}</v-card-title>
                <v-card-subtitle class="pa-0 text-caption">{{ userProfile.email }}</v-card-subtitle>
              </div>
            </div>
          </v-card-item>

          <v-divider></v-divider>

          <!-- 메뉴 항목들 -->
          <v-list density="compact">
            <v-list-item to="/my-profile">
              <template v-slot:prepend>
                <v-icon>mdi-account</v-icon>
              </template>
              <v-list-item-title>내 채널</v-list-item-title>
            </v-list-item>

            <v-list-item to="/my-clips">
              <template v-slot:prepend>
                <v-icon>mdi-video-box</v-icon>
              </template>
              <v-list-item-title>내 클립</v-list-item-title>
            </v-list-item>

            <v-list-item to="/my-following">
              <template v-slot:prepend>
                <v-icon>mdi-star</v-icon>
              </template>
              <v-list-item-title>팔로잉 채널</v-list-item-title>
            </v-list-item>

            <v-list-item to="/my-purchases">
              <template v-slot:prepend>
                <v-icon>mdi-shopping</v-icon>
              </template>
              <v-list-item-title>내 구독</v-list-item-title>
            </v-list-item>

            <v-list-item to="/settings">
              <template v-slot:prepend>
                <v-icon>mdi-cog</v-icon>
              </template>
              <v-list-item-title>설정</v-list-item-title>
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
import Cookies from 'js-cookie';
import axios from 'axios';

export default {
  data() {
    return {
      isLogin: false,
      searchQuery: '',
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
    const token = Cookies.get('token');
    if (token) {
      localStorage.setItem('token', token);
      Cookies.remove('token');
      this.$router.push('/');
    }

    // 토큰이 존재하면 로그인 상태로 변경 및 사용자 정보 가져오기
    if (localStorage.getItem('token')) {
      this.isLogin = true;
      this.fetchUserProfile();
    }
  },
  methods: {
    doLogout() {
      localStorage.removeItem('token');
      this.isLogin = false;
      this.profileMenuOpen = false;
      this.$router.push('/');
    },
    search() {
      if (this.searchQuery.trim()) {
        this.$router.push({
          path: '/search',
          query: { q: this.searchQuery }
        });
      }
    },
    async fetchUserProfile() {
      try {
        // 백엔드 API URL을 실제 서비스에 맞게 변경하세요
        const token = localStorage.getItem('token');
        if (!token) return;

        // 사용자 ID 먼저 확인 (localStorage에 저장되어 있을 수 있음)
        let userId = localStorage.getItem('userId');

        if (!userId) {
          // userId가 없으면 토큰에서 추출하거나 API로 확인해야 함
          // 여기서는 임시로 1로 설정 (실제 구현에서는 토큰 디코딩 또는 API 호출 필요)
          userId = 1;
          localStorage.setItem('userId', userId);
        }

        // API 호출: /member/detail/{id} 엔드포인트 사용
        const response = await axios.get(`http://localhost:8080/member-service/member/detail/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': userId
          }
        });

        // 응답에서 사용자 정보 설정
        if (response.data && response.data.result) {
          const userData = response.data.result;
          this.userProfile = {
            nickname: userData.name || '사용자', // 'name' 필드 사용
            email: userData.email || '',
            profileImage: userData.profileImg || this.defaultAvatar // 'profileImg' 필드 사용
          };
          console.log("사용자 정보 로드됨:", this.userProfile);
        }
      } catch (error) {
        console.error('사용자 정보를 가져오는 중 오류 발생:', error);
        // 에러 발생 시 기본 데이터 사용
        this.userProfile = {
          nickname: '에러입니다 다시 수정하시길',
          email: 'fuckingError@Error.com',
          profileImage: this.defaultAvatar
        };
      }
    }
  },
};
</script>

<style scoped>
.search-bar {
  max-width: 400px;
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
</style>