<template>
    <div class="home-wrapper">
      <LiveSection />
      <FollowingLiveSection />
      <RecommendedReplaySection />
      <PopularClipSection />
    </div>
  </template>
  
  <script setup>
  import LiveSection from '@/components/home/LiveSection.vue';
  import FollowingLiveSection from '@/components/home/FollowingLiveSection.vue';
  import RecommendedReplaySection from '@/components/home/RecommendedReplaySection.vue';
  import PopularClipSection from '@/components/home/RecommendedClipSection.vue';
  </script>
  
  <style scoped>
  .home-wrapper {
    padding: 20px;
  }
  </style>