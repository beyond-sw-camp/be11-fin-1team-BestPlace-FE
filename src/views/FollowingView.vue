<template>
    <div class="following-wrapper">
      <h1 class="section-title">팔로잉</h1>
      
      <FollowingTabs 
        :selected-tab="selectedTab"
        @update-tab="updateTab"
      />
  
      <component :is="currentTabComponent" />
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