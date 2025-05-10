<template>
    <div class="following-wrapper">
      <div class="following-content">
        <h1 class="following-title">팔로잉</h1>
        
        <!-- 탭 버튼 -->
        <div class="tab-bar">
          <FollowingTabs 
            :selected-tab="selectedTab"
            @update-tab="updateTab"
          />
        </div>
        
        <!-- 컴포넌트 렌더링 영역 -->
        <div class="following-component">
          <component 
            :is="currentTabComponent" 
            @update-tab="updateTab"
          />
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import FollowingTabs from '@/components/following/FollowingTabs.vue';
  import FollowingAll from '@/components/following/FollowingAll.vue';
  import FollowingLive from '@/components/following/FollowingLive.vue';
  import FollowingVideos from '@/components/following/FollowingVideos.vue';
  import FollowingChannels from '@/components/following/FollowingChannels.vue';
  import { useRoute } from 'vue-router';
  
  export default {
    components: {
      FollowingTabs,
      FollowingAll,
      FollowingLive,
      FollowingVideos,
      FollowingChannels,
    },
    data() {
      return {
        selectedTab: 'all',  // 기본값: 전체
      };
    },
    computed: {
      currentTabComponent() {
        const map = {
          all: 'FollowingAll',
          live: 'FollowingLive',
          videos: 'FollowingVideos',
          channels: 'FollowingChannels',
        };
        return map[this.selectedTab];
      }
    },
    methods: {
      updateTab(tab) {
        this.selectedTab = tab;
        // 탭 변경 시 URL 업데이트
        this.$router.push({ 
          path: '/following',
          query: { tab: tab }
        });
        // 탭 변경 시 스크롤을 맨 위로 올립니다
        window.scrollTo({
          top: 0,
        });
      }
    },
    mounted() {
      const route = this.$route;
      // URL 경로에 따라 탭 설정
      if (route.path === '/following/live') {
        this.selectedTab = 'live';
      } else if (route.path === '/following/videos') {
        this.selectedTab = 'videos';
      } else if (route.path === '/following/channels') {
        this.selectedTab = 'channels';
      } else if (route.query.tab && ['all', 'live', 'videos', 'channels'].includes(route.query.tab)) {
        this.selectedTab = route.query.tab;
      }
    },
    watch: {
      '$route'(to) {
        // URL 경로 변경 감지
        if (to.path === '/following/live') {
          this.selectedTab = 'live';
        } else if (to.path === '/following/videos') {
          this.selectedTab = 'videos';
        } else if (to.path === '/following/channels') {
          this.selectedTab = 'channels';
        } else if (to.query.tab && ['all', 'live', 'videos', 'channels'].includes(to.query.tab)) {
          this.selectedTab = to.query.tab;
        }
      }
    }
  };
  </script>

<style scoped>
.following-wrapper {
  width: 100%;
  background-color: #141517;
  color: white;
  min-height: 100vh;
}

.following-content {
  max-width: 1920px;
  margin: 0 auto;
  padding: 24px;
}

.following-title {
  font-size: 32px;
  font-weight: 500;
  margin-bottom: 24px;
}

.tab-bar {
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  padding: 0 0 6px 0;
}

.following-component {
  margin-top: 6px;
}
</style>