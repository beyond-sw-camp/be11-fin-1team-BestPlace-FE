<template>
    <div class="following-all">
      <FollowingAllLive @see-all="goToTab('live')" />
      <FollowingAllVideos @see-all="goToTab('videos')" />
      <FollowingAllChannels @see-all="goToTab('channels')" />
    </div>
  </template>
  
  <script>
  import FollowingAllLive from './sections/FollowingAllLive.vue';
  import FollowingAllVideos from './sections/FollowingAllVideos.vue';
  import FollowingAllChannels from './sections/FollowingAllChannels.vue';
  
  export default {
    components: {
      FollowingAllLive,
      FollowingAllVideos,
      FollowingAllChannels
    },
    methods: {
      goToTab(tabName) {
        this.$emit('update-tab', tabName);
      }
    }
  };
  </script>
  