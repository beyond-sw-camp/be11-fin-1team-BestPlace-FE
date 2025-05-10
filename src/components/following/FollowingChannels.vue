<template>
  <div class="following-channels">
    <EmptyFollowing v-if="isEmpty || hasError" />
    <div v-else class="channels-list">
      <!-- 기존 채널 리스트 내용 -->
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import EmptyFollowing from './EmptyFollowing.vue';

export default {
  name: 'FollowingChannels',
  components: {
    EmptyFollowing
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
  }
};
</script>

<style scoped>
.following-channels {
  width: 100%;
}
</style>
