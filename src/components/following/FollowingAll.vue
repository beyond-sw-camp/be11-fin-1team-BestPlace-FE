<template>
    <div class="following-all">
      <FollowingLiveSection @see-all="goToTab('live')" />
      <FollowingAllVideos @see-all="goToTab('videos')" />
      <FollowingAllChannels @see-all="goToTab('channels')" />
    </div>
  </template>
  
  <script>
  import FollowingLiveSection from '@/components/home/FollowingLiveSection.vue';
  import FollowingAllVideos from './sections/FollowingAllVideos.vue';
  import FollowingAllChannels from './sections/FollowingAllChannels.vue';
  
  export default {
    components: {
      FollowingLiveSection,
      FollowingAllVideos,
      FollowingAllChannels
    },
    methods: {
      goToTab(tabName) {
        console.log('FollowingAll: goToTab called with', tabName);
        this.$emit('update-tab', tabName);
      }
    }
  };
  </script>
  