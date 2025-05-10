<template>
    <div class="following-all">
      <EmptyFollowing v-if="isEmpty || hasError" />
      <div v-else class="following-list">
        <FollowingLiveSection @see-all="goToTab('live')" />
        <FollowingAllVideos @see-all="goToTab('videos')" />
        <FollowingAllChannels @see-all="goToTab('channels')" />
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  import EmptyFollowing from './EmptyFollowing.vue';
  import FollowingLiveSection from '@/components/home/FollowingLiveSection.vue';
  import FollowingAllVideos from './sections/FollowingAllVideos.vue';
  import FollowingAllChannels from './sections/FollowingAllChannels.vue';
  
  export default {
    name: 'FollowingAll',
    components: {
      EmptyFollowing,
      FollowingLiveSection,
      FollowingAllVideos,
      FollowingAllChannels
    },
    data() {
      return {
        followingList: [],
        isEmpty: false,
        hasError: false
      };
    },
    async created() {
      try {
        const memberApi = process.env.VUE_APP_MEMBER_API;
        const response = await axios.get(`${memberApi}/follow/list`);
        
        if (response.data.status_code === 200) {
          this.followingList = response.data.result;
          this.isEmpty = this.followingList.length === 0;
        } else {
          this.hasError = true;
        }
      } catch (error) {
        console.error('팔로우 리스트 로딩 중 에러 발생:', error);
        this.hasError = true;
      }
    },
    methods: {
      goToTab(tabName) {
        console.log('FollowingAll: goToTab called with', tabName);
        this.$emit('update-tab', tabName);
      }
    }
  };
  </script>
  
  <style scoped>
  .following-all {
    width: 100%;
  }
  </style>
  