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
          <component :is="currentTabComponent" />
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