<template>
  <div class="clips-wrapper">
    <div class="clips-content">
      <h1 class="clips-title">인기 <span class="purple-text">클립</span></h1>
      
      <!-- 필터링 버튼 -->
      <div class="filter-bar">
        <div class="filter-left">
          <button 
            v-for="period in periods" 
            :key="period.value"
            :class="['sort-btn', { active: selectedPeriod === period.value }]" 
            @click="selectedPeriod = period.value; resetAndLoad()"
          >
            {{ period.text }}
          </button>
        </div>
        <div class="filter-right">
          <button 
            v-for="sort in sorts" 
            :key="sort.value"
            :class="['sort-btn', { active: selectedSort === sort.value }]" 
            @click="selectedSort = sort.value; resetAndLoad()"
          >
            {{ sort.text }}
          </button>
        </div>
      </div>
      
      <!-- 클립 그리드 -->
      <div class="clips-grid" v-if="clips.length > 0">
        <div 
          v-for="clip in clips" 
          :key="clip.id" 
          class="clip-item"
          @click="handleClipClick(clip)"
        >
          <!-- 썸네일 컨테이너 -->
          <div class="thumbnail-container">
            <img 
              :src="clip.thumbnailUrl" 
              alt="Clip Thumbnail" 
              class="thumbnail"
              :class="{
                'blur-thumbnail': shouldBlurThumbnail(clip),
                'hide-thumbnail': shouldHideThumbnail(clip)
              }"
            >
            
            <!-- 연령 제한 표시 -->
            <div v-if="clip.isAdult === 'Y'" class="age-restriction-overlay">
              <div class="age-restriction-content">
                <div class="age-icon-circle">19</div>
                <div class="age-text">연령 제한</div>
              </div>
            </div>
            
            <!-- 텍스트 오버레이 -->
            <div class="clip-info-overlay">
              <div class="clip-title">{{ clip.title }}</div>
              <div class="clip-meta">
                <span class="streamer-name">{{ clip.streamerNickname }}</span>
                <span class="view-count">
                  <v-icon size="x-small" class="mr-1">mdi-eye</v-icon>
                  {{ formatNumber(clip.views) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 로딩 표시 -->
      <div v-if="loading" class="text-center my-4">
        <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
      </div>
      
      <!-- 데이터 없음 표시 -->
      <v-card v-if="clips.length === 0 && !loading" class="empty-card">
        <v-card-text class="text-center pa-6">
          <v-icon size="64" color="#B084CC" class="mb-4">mdi-video-box-off</v-icon>
          <h3 class="mb-2">클립이 없습니다</h3>
          <p>선택한 기간에 해당하는 클립이 없습니다.</p>
        </v-card-text>
      </v-card>
      
      <!-- 무한 스크롤 감지용 요소 -->
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
  </div>
</template>

<script>
import axios from 'axios';
import {jwtDecode} from 'jwt-decode';

export default {
  name: 'ClipsView',
  data() {
    return {
      clips: [],
      loading: false,
      page: 0,
      totalPages: 0,
      hasMore: true,
      selectedPeriod: 'DAYS_7', // 초기값: 주간
      selectedSort: 'popular',   // 초기값: 인기순
      userIsAdult: false,
      isLoggedIn: false,
      observer: null,
      periods: [
        { text: '전체', value: 'ALL' },
        { text: '한달', value: 'DAYS_30' },
        { text: '주간', value: 'DAYS_7' },
        { text: '하루', value: 'HOURS_24' }
      ],
      sortOptions: {
        ALL: [
          { text: '인기순', value: 'popular' },
          { text: '추천순', value: 'recommend' }
        ],
        others: [
          { text: '인기순', value: 'popular' },
          { text: '최신순', value: 'recent' }
        ]
      },
      adultAlertModalOpen: false,
      selectedClip: null
    };
  },
  
  computed: {
    // 현재 선택된 기간에 따라 정렬 옵션 반환
    sorts() {
      return this.selectedPeriod === 'ALL' ? this.sortOptions.ALL : this.sortOptions.others;
    }
  },
  
  created() {
    this.checkLoginStatus();
    this.loadClips();
  },
  
  mounted() {
    this.setupInfiniteScroll();
  },
  
  beforeUnmount() {
    // observer 해제
    if (this.observer) {
      this.observer.disconnect();
    }
  },
  
  watch: {
    selectedPeriod() {
      // 기간이 변경되면 정렬 옵션도 변경되어야 하므로
      // 전체 <-> 나머지 간 전환 시 정렬 옵션을 초기값으로 설정
      if (this.selectedPeriod === 'ALL' && this.selectedSort === 'recent') {
        this.selectedSort = 'popular';
      } else if (this.selectedPeriod !== 'ALL' && this.selectedSort === 'recommend') {
        this.selectedSort = 'popular';
      }
      this.resetAndLoad();
    },
    selectedSort() {
      this.resetAndLoad();
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
    
    async loadClips() {
      if (this.loading || !this.hasMore) return;
      
      this.loading = true;
      const apiUrl = process.env.VUE_APP_MEMBER_API;
      
      try {
        let endpoint;
        let params = {
          page: this.page,
          periodType: this.selectedPeriod
        };
        
        if (this.selectedSort === 'popular') {
          endpoint = `${apiUrl}/video/clip/list/popular/views`;
        } else if (this.selectedSort === 'recent') {
          endpoint = `${apiUrl}/video/clip/list/popular/recent`;
        } else {
          endpoint = `${apiUrl}/video/clip/list/recommend`;
          if (this.isLoggedIn) {
            endpoint += '/logined';
          }
        }
        
        const response = await axios.get(endpoint, { params });
        
        if (response.data && response.data.result) {
          const result = response.data.result;
          this.clips = [...this.clips, ...result.content];
          this.totalPages = result.totalPages;
          this.hasMore = this.page < this.totalPages - 1;
          this.page++;
        }
      } catch (error) {
        console.error('클립 로드 중 오류 발생:', error);
      } finally {
        this.loading = false;
      }
    },
    
    resetAndLoad() {
      this.clips = [];
      this.page = 0;
      this.hasMore = true;
      this.loadClips();
    },
    
    setupInfiniteScroll() {
      const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      };
      
      this.observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !this.loading) {
          this.loadClips();
        }
      }, options);
      
      if (this.$refs.infiniteScrollTrigger) {
        this.observer.observe(this.$refs.infiniteScrollTrigger);
      }
    },
    
    formatNumber(num) {
      if (num >= 10000) {
        return (num / 10000).toFixed(1) + '만';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + '천';
      }
      return num.toString();
    },
    
    isAdultContent(clip) {
      return clip.isAdult === 'Y';
    },
    
    shouldBlurThumbnail(clip) {
      // 성인 컨텐츠이고, 로그인한 사용자가 성인인 경우 희미하게 표시
      return this.isAdultContent(clip) && this.isLoggedIn && this.userIsAdult;
    },
    
    shouldHideThumbnail(clip) {
      // 성인 컨텐츠이고, 로그인하지 않았거나 성인이 아닌 경우 숨김
      return this.isAdultContent(clip) && (!this.isLoggedIn || !this.userIsAdult);
    },
    
    handleClipClick(clip) {
      if (clip.isAdult === 'Y' && (!this.isLoggedIn || !this.userIsAdult)) {
        // 성인 컨텐츠이고 로그인하지 않았거나 성인이 아닌 경우, 모달 표시
        this.selectedClip = clip;
        this.adultAlertModalOpen = true;
      } else {
        // 아니면 클립 페이지로 이동
        this.$router.push(`/clip/${clip.id}`);
      }
    },
    
    closeAdultAlertModal() {
      this.adultAlertModalOpen = false;
      this.selectedClip = null;
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
.clips-wrapper {
  width: 100%;
  background-color: #141517;
  color: white;
  min-height: 100vh;
}

.clips-content {
  max-width: 1920px;
  margin: 0 auto;
  padding: 24px;
}

.clips-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 20px;
}

.purple-text {
  color: #B084CC;
}

.filter-bar {
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-left {
  display: flex;
  gap: 15px;
}

.filter-right {
  display: flex;
  gap: 15px;
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

.clips-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 20px;
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  padding: 15px;
}

.clip-item {
  cursor: pointer;
  background-color: #18191c;
  border-radius: 8px;
  overflow: hidden;
  padding: 0;
}

.clip-card {
  background-color: #0F0F0F;
  border-radius: 12px;
  overflow: hidden;
  transition: none;
  height: 100%;
  margin-bottom: 24px;
}

.clip-card:hover {
  transform: none;
}

.thumbnail-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  width: 100%;
  aspect-ratio: 9 / 16;
  background-color: #000;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center center;
  background-color: #000;
}

.blur-thumbnail {
  filter: blur(3px);
  opacity: 0.9;
}

.hide-thumbnail {
  opacity: 0;
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

.clip-info-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 2;
}

.clip-title {
  color: #ffffff;
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
  text-shadow: none;
}

.clip-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.streamer-name, .view-count {
  color: #ffffff;
  font-size: 11px;
  display: flex;
  align-items: center;
  text-shadow: none;
}

.streamer-name {
  margin-right: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;
}

.view-count {
  white-space: nowrap;
}

.empty-card {
  background-color: #141517;
  border-radius: 12px;
  margin-top: 20px;
}

.empty-card h3 {
  color: white;
}

.empty-card p {
  color: #aaa;
}

.infinite-scroll-trigger {
  height: 20px;
  width: 100%;
  margin-top: 20px;
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
