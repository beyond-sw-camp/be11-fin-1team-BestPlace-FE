<template>
  <div class="tab-content">
    <div class="info-card">
      <h2 class="info-card-title">정보</h2>
      <div class="sns-links-container" v-if="snsLinks.length > 0">
        <a 
          v-for="link in snsLinks" 
          :key="link.id" 
          class="sns-link-item"
          :href="link.url" 
          target="_blank"
        >
          <div class="sns-icon">
            <img :src="getFavicon(link.url)" alt="Site Icon" class="favicon">
          </div>
          <div class="sns-title">{{ link.title }}</div>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const snsLinks = ref([]);

onMounted(async () => {
  await fetchSnsLinks();
});

// SNS 링크 데이터 가져오기
const fetchSnsLinks = async () => {
  try {
    const streamerId = route.params.memberId;
    if (!streamerId) return;
    
    const memberApi = process.env.VUE_APP_MEMBER_API;
    const response = await axios.get(`${memberApi}/member/sns`, {
    params: { streamerId }
    });
    
    if (response.data && response.data.result) {
      snsLinks.value = response.data.result;
    }
  } catch (error) {
    console.error('SNS 링크 로드 실패:', error);
  }
};

// 파비콘 URL 생성
const getFavicon = (url) => {
  try {
    const domain = new URL(url).hostname;
    if (domain.includes('youtube')) {
      return 'https://www.youtube.com/s/desktop/3c05a869/img/favicon.ico';
    } else if (domain.includes('instagram')) {
      return 'https://static.cdninstagram.com/rsrc.php/v3/yt/r/30PrGfR3xhB.png';
    } else if (domain.includes('cafe.daum') || domain.includes('cafe.naver')) {
      return 'https://ssl.pstatic.net/static/cafe/cafe_pc/ico/favicon/favicon.ico?v=2';
    }
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return 'https://www.google.com/s2/favicons?domain=example.com&sz=64';
  }
};
</script>

<style scoped>
.tab-content {
  padding: 20px;
  margin-top: 0;
}

.info-card {
  background-color: #1f1f1f;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.info-card-title {
  font-size: 18px;
  padding: 10px 20px;
  color: #fff;
  font-weight: 600;
  margin: 0;
}

.sns-links-container {
  display: flex;
  flex-wrap: wrap;
  padding: 5px 16px 16px;
  gap: 8px;
}

.sns-link-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: calc(25% - 6px);
  text-decoration: none;
  padding: 16px 8px;
  border-radius: 8px;
  background-color: #2c2c2c;
  transition: background-color 0.2s;
}

.sns-link-item:hover {
  background-color: #383838;
}

.sns-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 8px;
}

.favicon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.sns-title {
  font-size: 14px;
  color: #ffffff;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}
</style>
