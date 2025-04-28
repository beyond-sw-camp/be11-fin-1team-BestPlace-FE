<template>
  <v-app-bar app color="#141517" dark elevation="0" class="header-no-border">
    <div class="logo-container ml-4">
      <router-link to="/" class="d-flex align-center text-decoration-none">
        <v-img src="@/assets/BEST_PLACE_logo.gif" height="30" width="100" alt="logo" />
      </router-link>
    </div>

    <v-spacer />

    <!-- 검색창 -->
    <div class="search-container mx-4">
      <v-combobox
          v-model="searchQuery"
          :items="autocompleteItems"
          v-model:search-input="searchInput"
          placeholder="스트리머 검색"
          prepend-inner-icon="mdi-magnify"
          variant="solo"
          hide-details
          density="compact"
          bg-color="#1e2029"
          class="search-bar chzzk-search"
          @update:search="handleSearchInput"
          @keyup.enter="search"
          item-title="text"
          item-value="text"
          no-filter
          return-object
          rounded
          clearable
          :menu-props="{ maxHeight: '200px' }"
          ref="searchCombobox"
          @keydown.down="onKeyDown"
          @keydown.up="onKeyUp"
          autocomplete="off"
      >
        <template v-slot:item="{ item, props }">
          <v-list-item 
            v-bind="props" 
            :title="item.raw.text" 
            @click="selectItem(item.raw)"
          ></v-list-item>
        </template>
      </v-combobox>
    </div>

    <v-spacer />

    <!-- 스튜디오 버튼 추가 -->
    <v-btn
      class="studio-btn mr-2"
      @click="goToStudio"
    >
      <span class="d-flex align-center">
        <v-icon class="studio-icon mr-1">mdi-video-box</v-icon>
        <span>스튜디오</span>
      </span>
    </v-btn>

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
            <v-list-item to="/streamer-profile">
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

  <!-- 로그인 필요 모달 -->
  <v-dialog v-model="loginRequiredDialog" max-width="400" content-class="custom-modal">
    <div class="modal-container">
      <div class="modal-header">
        <div class="modal-title">알림</div>
        <v-btn icon @click="loginRequiredDialog = false" class="close-btn">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
      <div class="modal-content">
        <div class="message-container">
          <v-icon icon="mdi-account-alert" color="#B084CC" size="x-large" class="message-icon"></v-icon>
          <div class="message-text">
            로그인이 필요한 서비스입니다.<br> 
            로그인 하시겠습니까?
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <div class="button-group">
          <v-btn
            variant="outlined"
            class="cancel-btn"
            @click="loginRequiredDialog = false"
          >
            아니오
          </v-btn>
          <v-btn
            color="#b084cc"
            class="confirm-btn"
            @click="goToLogin"
          >
            예
          </v-btn>
        </div>
      </div>
    </div>
  </v-dialog>
</template>

<script>
import Cookies from 'js-cookie';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export default {
  data() {
    return {
      isLogin: false,
      searchQuery: null,
      searchInput: '',
      autocompleteItems: [],
      profileMenuOpen: false,
      defaultAvatar: require('@/assets/default-avatar.png'),
      userProfile: {
        nickname: '',
        email: '',
        profileImage: '',
        id: ''
      },
      searchTimeout: null,
      currentIndex: -1,
      selectedItem: null,
      // 로그인 필요 모달
      loginRequiredDialog: false
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
      localStorage.clear();
      this.isLogin = false;
      this.profileMenuOpen = false;
      this.$router.push('/');
    },
    
    // 스튜디오 이동 메소드
    goToStudio() {
      if (this.isLogin) {
        // 로그인된 경우 스트리밍 대시보드로 이동
        const memberId = this.userProfile.id || '';
        this.$router.push(`/streamer/${memberId}/dashboard`);
      } else {
        // 로그인되지 않은 경우 모달 표시
        this.loginRequiredDialog = true;
      }
    },
    
    // 로그인 페이지로 이동
    goToLogin() {
      this.loginRequiredDialog = false;
      this.$router.push('/member/login');
    },
    
    // 방향키 아래로 이동
    onKeyDown() {
      if (this.autocompleteItems.length === 0) return;
      
      // 방향키 이벤트 캡처하고 기본 동작 실행
      this.$nextTick(() => {
        // 한 틱 후에 선택된 항목 확인
        const menu = this.$refs.searchCombobox.$el.querySelector('.v-list');
        if (menu) {
          // 선택된 항목 찾기
          const selectedItem = menu.querySelector('.v-list-item--active');
          if (selectedItem) {
            // 텍스트 추출 및 설정
            const itemText = selectedItem.textContent.trim();
            // searchInput 업데이트 (이것이 사용자에게 보이는 텍스트임)
            this.searchInput = itemText;
            
            // 일치하는 항목 찾기
            const matchingItem = this.autocompleteItems.find(item => item.text === itemText);
            if (matchingItem) {
              this.selectedItem = matchingItem;
            }
          }
        }
      });
    },
    
    // 방향키 위로 이동
    onKeyUp() {
      if (this.autocompleteItems.length === 0) return;
      
      // 기본 동작 실행 후 다음 틱에 확인
      this.$nextTick(() => {
        const menu = this.$refs.searchCombobox.$el.querySelector('.v-list');
        if (menu) {
          const selectedItem = menu.querySelector('.v-list-item--active');
          if (selectedItem) {
            const itemText = selectedItem.textContent.trim();
            this.searchInput = itemText;
            
            const matchingItem = this.autocompleteItems.find(item => item.text === itemText);
            if (matchingItem) {
              this.selectedItem = matchingItem;
            }
          }
        }
      });
    },
    
    selectItem(item) {
      if (item && item.text) {
        this.searchInput = item.text;
        this.searchQuery = item;
        this.selectedItem = item;
        this.search();
      }
    },
    
    handleSearchInput(keyword) {
      // 검색 입력 값을 searchInput에 직접 설정
      this.searchInput = keyword;
      
      // 디바운싱 처리: 이전 타이머 취소
      clearTimeout(this.searchTimeout);
      
      // 입력이 없거나 너무 짧으면 자동완성 목록 초기화
      if (!keyword || keyword.length < 2) {
        this.autocompleteItems = [];
        return;
      }
      
      // 300ms 후에 API 요청 (사용자가 타이핑을 멈춘 후)
      this.searchTimeout = setTimeout(() => {
        this.getAutocompleteResults(keyword);
      }, 300);
    },
    
    search() {
      let query = '';
      
      // 선택된 항목이 있는 경우
      if (this.selectedItem && this.selectedItem.text) {
        query = this.selectedItem.text;
      } 
      // searchQuery가 객체인지 문자열인지 확인 후 적절하게 처리
      else if (this.searchQuery && typeof this.searchQuery === 'object') {
        query = this.searchQuery.text;
      }
      // 직접 입력한 검색어가 있는 경우
      else if (this.searchInput && this.searchInput.trim() !== '') {
        query = this.searchInput.trim();
      } 
      // searchQuery가 문자열인 경우
      else if (this.searchQuery) {
        query = this.searchQuery;
      } else {
        return;
      }
      
      this.$router.push({
        path: '/search',
        query: { q: query }
      });
    },
    
    async getAutocompleteResults(keyword) {
      if (!keyword || keyword.trim() === '') {
        this.autocompleteItems = [];
        return;
      }
      
      try {
        // API 요청 중 오류 방지를 위한 기본 URL 설정
        const baseUrl = process.env.VUE_APP_MEMBER_API || '';
        const apiUrl = `${baseUrl}/member/autocomplete`;
        
        const response = await axios.get(apiUrl, {
          params: { keyword }
        });
        
        if (response.data && response.data.result && response.data.result.length > 0) {
          this.autocompleteItems = response.data.result.map(item => ({
            text: item
          }));
        } else {
          this.autocompleteItems = [];
        }
      } catch (error) {
        console.error('자동완성 결과 로드 실패:', error);
        this.autocompleteItems = [];
      }
    },
    
    async fetchUserProfile() {
      try {
        // 백엔드 API URL을 실제 서비스에 맞게 변경하세요
        const token = localStorage.getItem('token');
        if (!token) return;

        // 1. 토큰에서 정보 추출
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.sub;
        
        // 사용자 ID 저장
        this.userProfile.id = userId;
        
        // 이미 토큰에서 정보 추출 가능한 경우 설정
        this.userProfile = {
          id: userId,
          nickname: decodedToken.nickname || '',
          email: decodedToken.email || '',
          profileImage: this.defaultAvatar
        };
        
        // 2. 추가 정보 API 호출
        const response = await axios.get(`${process.env.VUE_APP_MEMBER_API}/member/detail/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // 3. API 응답으로 정보 업데이트
        if (response.data && response.data.result) {
          const userData = response.data.result;
          this.userProfile = {
            id: userId,
            nickname: userData.nickname || this.userProfile.nickname,
            email: userData.email || this.userProfile.email,
            profileImage: userData.profileImage || this.defaultAvatar
          };
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        // 온전한 오류 처리
        this.userProfile = {
          nickname: '사용자',
          email: '',
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

.search-container {
  position: relative;
  width: 100%;
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
  color: white !important;
  caret-color: white !important;
  padding: 8px 5px;
}

.chzzk-search :deep(.v-field__input input) {
  color: white !important;
  opacity: 1 !important;
  font-weight: normal;
}

.chzzk-search :deep(.v-field) {
  border-radius: 20px;
  background-color: #1e2029 !important;
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

.chzzk-search :deep(.v-autocomplete__selection) {
  color: white !important;
}

.chzzk-search :deep(.v-list-item) {
  color: #ffffff;
  min-height: 32px !important; /* 드롭다운 항목 높이 줄이기 */
  padding: 0 12px; /* 패딩 줄이기 */
}

.chzzk-search :deep(.v-list) {
  background-color: #1e2029;
  padding: 4px 0 !important; /* 목록 패딩 줄이기 */
}

.chzzk-search :deep(.v-list-item__content) {
  padding: 4px 0 !important; /* 내부 컨텐츠 패딩 줄이기 */
}

.chzzk-search :deep(.v-list-item--active) {
  background-color: rgba(255, 255, 255, 0.1);
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

.studio-btn {
  background-color: rgba(40, 40, 52, 0.95);
  color: white;
  border-radius: 8px;
  height: 36px;
  font-weight: 500;
  font-size: 14px;
  box-shadow: none;
  transition: all 0.2s ease;
  padding: 0 12px;
  margin-right: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.studio-btn:hover {
  background-color: rgba(60, 60, 72, 0.95);
}

.studio-icon {
  font-size: 18px;
  margin-right: 4px;
}

/* 모달 스타일 */
.custom-modal {
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

.close-btn {
  color: #aaa;
}

.modal-content {
  padding: 20px;
}

.message-container {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: rgba(176, 132, 204, 0.1);
  border-radius: 8px;
  margin-bottom: 10px;
}

.message-icon {
  margin-right: 16px;
}

.message-text {
  font-size: 16px;
  line-height: 1.5;
  color: #fff;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid #333;
}

.button-group {
  display: flex;
  width: 100%;
  gap: 10px;
}

.cancel-btn {
  flex: 1;
  border-color: #555 !important;
  color: white !important;
  height: 44px;
}

.confirm-btn {
  flex: 2;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}
</style>