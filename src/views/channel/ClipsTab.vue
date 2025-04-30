<template>
  <div class="clips-wrapper">
    <div class="clips-content">
      <!-- 필터링 버튼 -->
      <div class="filter-bar">
        <div class="filter-left">
          <button 
            :class="['sort-btn', { active: selectedClipPeriod === 'ALL' }]"
            @click="resetAndLoadClips('ALL', null)"
          >
            전체
          </button>
          <button 
            :class="['sort-btn', { active: selectedClipPeriod === 'DAYS_30' }]"
            @click="resetAndLoadClips('DAYS_30', null)"
          >
            한달
          </button>
          <button 
            :class="['sort-btn', { active: selectedClipPeriod === 'DAYS_7' }]"
            @click="resetAndLoadClips('DAYS_7', null)"
          >
            주간
          </button>
          <button 
            :class="['sort-btn', { active: selectedClipPeriod === 'HOURS_24' }]"
            @click="resetAndLoadClips('HOURS_24', null)"
          >
            하루
          </button>
        </div>
        <div class="filter-right">
          <button 
            :class="['sort-btn', { active: selectedClipSort === 'views' }]"
            @click="resetAndLoadClips(null, 'views')"
          >
            인기순
          </button>
          <button 
            :class="['sort-btn', { active: selectedClipSort === 'recent' }]"
            @click="resetAndLoadClips(null, 'recent')"
          >
            최신순
          </button>
        </div>
      </div>
      
      <!-- 클립 그리드 -->
      <div class="clips-grid" v-if="clips.length > 0">
        <div 
          v-for="(clip, index) in clips" 
          :key="`clip-${clip.id || clip.clipId}-${index}`" 
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
              <div class="clip-meta">
                <div class="clip-title">{{ clip.title }}</div>
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
      <div v-if="clipLoading" class="text-center my-4">
        <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
      </div>
      
      <!-- 데이터 없음 표시 -->
      <v-card v-if="clips.length === 0 && !clipLoading" class="empty-card">
        <v-card-text class="text-center pa-6">
          <v-icon size="64" color="#B084CC" class="mb-4">mdi-video-box-off</v-icon>
          <h3 class="mb-2">클립이 없습니다</h3>
          <p>선택한 기간에 해당하는 클립이 없습니다.</p>
        </v-card-text>
      </v-card>
      
      <!-- 무한 스크롤 감지용 요소 -->
      <div ref="clipInfiniteScrollTrigger" class="infinite-scroll-trigger"></div>
    </div>
  </div>
  
  <!-- 미성년자/비로그인 사용자 알림 모달 -->
  <v-dialog v-model="clipAdultAlertModalOpen" max-width="400" content-class="adult-alert-modal">
    <div class="modal-container">
      <div class="modal-header">
        <div class="modal-title">연령 제한 컨텐츠</div>
        <v-btn icon @click="closeClipAdultAlertModal" class="close-btn">
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
          @click="closeClipAdultAlertModal"
          class="submit-btn"
        >
          확인
        </v-btn>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const props = defineProps({
  channelId: {
    type: [String, Number],
    required: true
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  userIsAdult: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['showAdultAlert']);

const router = useRouter();

// 클립 관련 데이터
const clips = ref([]);
const clipLoading = ref(false);
const selectedClipPeriod = ref('ALL');
const selectedClipSort = ref('views');
const clipPage = ref(0);
const clipTotalPages = ref(0);
const clipAdultAlertModalOpen = ref(false);
const selectedClipForModal = ref(null);
const clipObserver = ref(null);

// 클립 관련 메서드
const resetAndLoadClips = (period, sort) => {
  if (period) {
    selectedClipPeriod.value = period;
  }
  
  if (sort) {
    selectedClipSort.value = sort;
  }
  
  clips.value = [];
  clipPage.value = 0;
  clipTotalPages.value = 0;
  loadClips();
};

const loadClips = async () => {
  if (clipLoading.value || (clipPage.value >= clipTotalPages.value && clipTotalPages.value !== 0)) {
    return;
  }
  
  clipLoading.value = true;
  
  try {
    console.log('Loading clips:', {
      streamerId: props.channelId,
      page: clipPage.value,
      periodType: selectedClipPeriod.value,
      sort: selectedClipSort.value
    });
    
    // 정렬 방식에 따라 엔드포인트 결정
    const endpoint = selectedClipSort.value === 'views' 
      ? '/video/clip/list/streamer/views' 
      : '/video/clip/list/streamer/recent';
    
    const response = await axios.get(`${process.env.VUE_APP_MEMBER_API}${endpoint}`, {
      params: {
        page: clipPage.value,
        streamerId: props.channelId,
        periodType: selectedClipPeriod.value
      }
    });
    
    console.log('Clips API response:', response.data);
    
    if (response.data && response.data.result) {
      const clipData = response.data.result;
      
      if (clipPage.value === 0) {
        clips.value = [...clipData.content];
      } else {
        clips.value = [...clips.value, ...clipData.content];
      }
      
      clipTotalPages.value = clipData.totalPages;
      clipPage.value++;
    } else {
      console.error('클립 로드 실패:', response.data.message);
    }
  } catch (error) {
    console.error('클립 로드 중 오류 발생:', error);
  } finally {
    clipLoading.value = false;
  }
};

const handleClipClick = (clip) => {
  console.log('Clip clicked:', clip);
  
  // 성인 컨텐츠 체크
  if (clip.isAdult === 'Y') {
    // 로그인 안 된 경우 또는 성인 인증 안 된 경우
    if (!props.isLoggedIn || !props.userIsAdult) {
      selectedClipForModal.value = clip;
      clipAdultAlertModalOpen.value = true;
      return;
    }
  }
  
  // 클립 상세 페이지로 이동
  router.push(`/clips/${clip.id || clip.clipId}`);
};

const closeClipAdultAlertModal = () => {
  clipAdultAlertModalOpen.value = false;
  selectedClipForModal.value = null;
};

const goToLogin = () => {
  router.push('/member/login');
};

const setupClipInfiniteScroll = () => {
  // 기존 observer 해제
  if (clipObserver.value) {
    clipObserver.value.disconnect();
  }
  
  // 새 observer 생성
  const options = {
    root: null,
    rootMargin: '100px',
    threshold: 0.1
  };
  
  clipObserver.value = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !clipLoading.value) {
      loadClips();
    }
  }, options);
  
  setTimeout(() => {
    const trigger = document.querySelector('.infinite-scroll-trigger');
    if (trigger) {
      clipObserver.value.observe(trigger);
    }
  }, 100);
};

// 숫자 포맷팅 (1000 -> 1,000)
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '만';
  }
  
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// 성인 컨텐츠 관련 함수
const shouldBlurThumbnail = (clip) => {
  return clip.isAdult === 'Y' && props.isLoggedIn && props.userIsAdult;
};

const shouldHideThumbnail = (clip) => {
  return clip.isAdult === 'Y' && (!props.isLoggedIn || !props.userIsAdult);
};

onMounted(() => {
  loadClips();
  setupClipInfiniteScroll();
});

onBeforeUnmount(() => {
  if (clipObserver.value) {
    clipObserver.value.disconnect();
  }
});

// 채널ID 변경 시 클립 목록 다시 로드
watch(() => props.channelId, (newId) => {
  if (newId) {
    resetAndLoadClips(selectedClipPeriod.value, selectedClipSort.value);
  }
});
</script>

<style scoped>
.clips-wrapper {
  width: 100%;
  background-color: transparent;
  color: white;
}

.clips-content {
  width: 100%;
  margin: 0 auto;
  padding: 0;
}

.filter-bar {
  width: 100%;
  margin: 0 auto;
  padding: 0 0 15px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-left {
  display: flex;
  gap: 10px;
  margin-right: 20px;
}

.filter-right {
  display: flex;
  gap: 10px;
}

.sort-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background: #2c2c2c;
  color: #7B7B7B;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-btn.active {
  background: #B084CC;
  color: #fff;
}

.clips-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  width: 100%;
  margin: 0 auto;
  padding: 15px 0;
}

.clip-item {
  cursor: pointer;
  background-color: #18191c;
  border-radius: 8px;
  overflow: hidden;
  padding: 0;
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

.clip-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clip-title {
  color: #ffffff;
  font-weight: 500;
  font-size: 14px;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  text-shadow: none;
  margin-right: 8px;
}

.view-count {
  color: #ffffff;
  font-size: 11px;
  display: flex;
  align-items: center;
  text-shadow: none;
  white-space: nowrap;
  flex-shrink: 0;
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

/* 미디어 쿼리 */
@media (max-width: 1400px) {
  .clips-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1000px) {
  .clips-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .clips-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .clips-grid {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style> 