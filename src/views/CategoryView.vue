<template>
  <div class="category-wrapper">
    <div class="category-content">
      <h1 class="category-title"><span class="purple-text">카테고리</span></h1>
      
      <!-- 카테고리 리스트 -->
      <div class="category-grid" v-if="categories.length > 0">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-item"
          @click="goToCategoryDetail(category)"
        >
          <div class="category-thumbnail">
            <img :src="category.image" :alt="category.name" class="thumbnail-image">
          </div>
          <div class="category-name">{{ category.name }}</div>
        </div>
      </div>
      
      <!-- 로딩 표시 -->
      <div v-if="loading" class="loading-container">
        <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
      </div>
      
      <!-- 데이터 없음 표시 -->
      <v-card v-if="categories.length === 0 && !loading" class="empty-card">
        <v-card-text class="text-center pa-6">
          <v-icon size="64" color="#B084CC" class="mb-4">mdi-tag-multiple</v-icon>
          <h3 class="mb-2">카테고리가 없습니다</h3>
          <p>등록된 카테고리가 없습니다.</p>
        </v-card-text>
      </v-card>
      
      <!-- 무한 스크롤 감지용 요소 -->
      <div ref="infiniteScrollTrigger" class="infinite-scroll-trigger"></div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'CategoryView',
  data() {
    return {
      categories: [],
      loading: false,
      page: 0,
      totalPages: 0,
      hasMore: true,
      observer: null
    };
  },
  
  mounted() {
    this.fetchCategories();
    this.setupInfiniteScroll();
  },
  
  beforeUnmount() {
    // observer 해제
    if (this.observer) {
      this.observer.disconnect();
    }
  },
  
  methods: {
    async fetchCategories() {
      if (this.loading || !this.hasMore) return;
      
      this.loading = true;
      
      try {
        const apiUrl = process.env.VUE_APP_STREAMING_API;
        const response = await axios.get(`${apiUrl}/category/list`, {
          params: {
            page: this.page
          }
        });
        
        if (response.data && response.data.result) {
          const result = response.data.result;
          this.categories = [...this.categories, ...result.content];
          this.totalPages = result.totalPages;
          this.hasMore = this.page < this.totalPages - 1;
          this.page++;
        }
      } catch (error) {
        console.error('카테고리 목록을 불러오는 중 오류 발생:', error);
      } finally {
        this.loading = false;
      }
    },
    
    setupInfiniteScroll() {
      const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      };
      
      this.observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !this.loading) {
          this.fetchCategories();
        }
      }, options);
      
      if (this.$refs.infiniteScrollTrigger) {
        this.observer.observe(this.$refs.infiniteScrollTrigger);
      }
    },
    
    goToCategoryDetail(category) {
      this.$router.push(`/category/${category.name}`);
    }
  }
};
</script>

<style scoped>
.category-wrapper {
  width: 100%;
  background-color: #141517;
  color: white;
  min-height: calc(100vh - 60px); /* 헤더 높이를 뺀 전체 화면 높이 */
}

.category-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 15px;
}

.category-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 30px;
}

.purple-text {
  color: #B084CC;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.category-item {
  cursor: pointer;
  transition: transform 0.2s;
  overflow: hidden;
}

.category-item:hover {
  transform: translateY(-5px);
}

.category-thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1.3;
  overflow: hidden;
  border-radius: 10px;
  background-color: #0F0F0F;
  margin-bottom: 12px;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-name {
  font-size: 16px;
  font-weight: 500;
  color: white;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 4px;
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
  margin-top: 30px;
}

.empty-card h3 {
  color: white;
}

.empty-card p {
  color: #aaaaaa;
}

.infinite-scroll-trigger {
  height: 20px;
  width: 100%;
  margin-top: 20px;
}

/* 반응형 그리드 */
@media (max-width: 1200px) {
  .category-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (max-width: 992px) {
  .category-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .category-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 576px) {
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
