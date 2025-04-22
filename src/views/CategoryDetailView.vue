<template>
  <div class="category-detail-wrapper">
    <!-- 카테고리 헤더 섹션 -->
    <div class="category-header">
      <div class="category-info">
        <h1 class="category-name">{{ categoryName }}</h1>
      </div>
      <div class="category-image">
        <img :src="categoryImage" alt="Category Image" v-if="categoryImage">
      </div>
    </div>

    <!-- 탭 메뉴 -->
    <div class="tab-container">
      <div class="tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.value" 
          :class="['tab', { active: activeTab === tab.value }]"
          @click="setActiveTab(tab.value)"
        >
          {{ tab.text }}
        </div>
      </div>
    </div>

    <!-- 방송 목록 -->
    <div class="broadcasts-grid">
      <div 
        v-for="(broadcast, index) in broadcasts" 
        :key="index" 
        class="broadcast-item"
      >
        <div class="thumbnail-container">
          <img :src="broadcast.thumbnailUrl" alt="Broadcast Thumbnail" class="thumbnail">
          <div class="duration">{{ broadcast.duration }}</div>
          <div class="replay-badge">다시보기</div>
        </div>
        <div class="broadcast-info">
          <div class="broadcast-title">{{ broadcast.title }}</div>
          <div class="streamer-info">
            <div class="streamer-profile">
              <img :src="broadcast.streamerProfileUrl" alt="Streamer Profile" class="profile-img">
              <div class="live-badge" v-if="broadcast.isLive">LIVE</div>
            </div>
            <div class="streamer-name">{{ broadcast.streamerName }}</div>
            <div class="broadcast-time">{{ broadcast.time }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 로딩 표시 -->
    <div v-if="loading" class="loading-container">
      <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
    </div>
    
    <!-- 데이터 없음 표시 -->
    <v-card v-if="broadcasts.length === 0 && !loading" class="empty-card">
      <v-card-text class="text-center pa-6">
        <v-icon size="64" color="#B084CC" class="mb-4">mdi-television</v-icon>
        <h3 class="mb-2">방송이 없습니다</h3>
        <p>이 카테고리에 등록된 방송이 없습니다.</p>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'CategoryDetailView',
  data() {
    return {
      categoryName: '',
      categoryImage: '',
      activeTab: 'live',
      tabs: [
        { text: '라이브', value: 'live' },
        { text: '동영상', value: 'video' },
        { text: '클립', value: 'clip' }
      ],
      broadcasts: [],
      loading: false
    };
  },
  
  computed: {
    // 라우터 파라미터에서 직접 ID를 가져오는 computed 속성
    categoryId() {
      return this.$route.params.id;
    }
  },
  
  created() {
    console.log('라우터 파라미터:', this.$route.params);
    console.log('카테고리 ID:', this.categoryId);
  },
  
  mounted() {
    this.fetchCategoryDetail();
  },
  
  methods: {
    async fetchCategoryDetail() {
      if (!this.categoryId) {
        console.error('유효하지 않은 카테고리 ID:', this.categoryId);
        return;
      }
      
      this.loading = true;
      
      try {
        const apiUrl = process.env.VUE_APP_STREAMING_API;
        const url = `${apiUrl}/category/${this.categoryId}`;
        console.log('요청 URL:', url);
        
        const response = await axios.get(url);
        console.log('응답 데이터:', response.data);
        
        if (response.data && response.data.result) {
          const categoryData = response.data.result;
          this.categoryName = categoryData.name;
          this.categoryImage = categoryData.image;
        }
      } catch (error) {
        console.error('카테고리 정보를 불러오는 중 오류 발생:', error);
      } finally {
        this.loading = false;
      }
    },
    
    setActiveTab(tab) {
      this.activeTab = tab;
    }
  }
};
</script>

<style scoped>
.category-detail-wrapper {
  width: 100%;
  background-color: #141517;
  color: white;
  min-height: calc(100vh - 60px); /* 헤더 높이를 뺀 전체 화면 높이 */
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 15px;
}

.category-name {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 10px;
}

.category-image {
  width: 120px;
  height: 160px;
  overflow: hidden;
  border-radius: 8px;
}

.category-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tab-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
  border-bottom: 1px solid #2a2a2a;
}

.tabs {
  display: flex;
  gap: 20px;
}

.tab {
  padding: 15px 5px;
  font-size: 16px;
  font-weight: 500;
  color: #aaaaaa;
  cursor: pointer;
  position: relative;
}

.tab.active {
  color: white;
  font-weight: 600;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #B084CC;
}

.broadcasts-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 15px;
}

.broadcast-item {
  cursor: pointer;
  transition: transform 0.2s;
}

.broadcast-item:hover {
  transform: translateY(-5px);
}

.thumbnail-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #2a2a2a; /* 플레이스홀더 */
}

.duration {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 12px;
}

.replay-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: #7f3dbd;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.broadcast-info {
  padding: 0 5px;
}

.broadcast-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.streamer-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.streamer-profile {
  position: relative;
}

.profile-img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.live-badge {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background-color: #ff2e2e;
  color: white;
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 8px;
  font-weight: 700;
}

.streamer-name {
  font-size: 14px;
  color: #cccccc;
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.broadcast-time {
  font-size: 13px;
  color: #888888;
}

.loading-container {
  display: flex;
  justify-content: center;
  margin: 40px 0;
}

.empty-card {
  background-color: #1A1B1E !important;
  color: white;
  border-radius: 12px;
  margin: 30px auto;
  max-width: 500px;
}

.empty-card h3 {
  color: white;
}

.empty-card p {
  color: #aaaaaa;
}

/* 반응형 그리드 */
@media (max-width: 1200px) {
  .broadcasts-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .broadcasts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .broadcasts-grid {
    grid-template-columns: repeat(1, 1fr);
  }
  
  .category-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .category-image {
    margin-top: 20px;
  }
}
</style>
