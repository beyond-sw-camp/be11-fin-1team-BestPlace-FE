<template>
  <div class="following-channels">
    <EmptyFollowing v-if="isEmpty || hasError" />
    <div v-else class="channels-list">
      <div class="channel-grid">
        <div
          v-for="user in followingList"
          :key="user.userId"
          class="channel-item"
        >
          <div class="profile-wrapper" @click="goToChannel(user.userId)">
            <v-img
              :src="user.followerImg || require('@/assets/default-avatar.png')"
              class="profile-img"
              :class="{ 'live-border': user.liveYn === 'Y' }"
              cover
            />
            <div v-if="user.liveYn === 'Y'" class="live-badge">LIVE</div>
          </div>
          <div class="nickname" @click="goToChannel(user.userId)">{{ user.followerNickName }}</div>
          <v-btn
            class="follow-btn"
            :color="user.isFollow === 'Y' ? '#2D2D2D' : '#B084CC'"
            :class="{ following: user.isFollow === 'Y' }"
            @click="toggleFollow(user)"
            rounded
            block
          >
            {{ user.isFollow === 'Y' ? '팔로잉' : '팔로우' }}
          </v-btn>
        </div>
      </div>
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
    await this.fetchFollowingList();
  },
  methods: {
    async fetchFollowingList() {
      try {
        const memberApi = process.env.VUE_APP_MEMBER_API;
        const response = await axios.get(`${memberApi}/follow/list`);
        if (response.data.status_code === 200) {
          this.followingList = response.data.result;
          console.log(this.followingList);
          this.isEmpty = this.followingList.length === 0;
        } else {
          this.hasError = true;
        }
      } catch (error) {
        console.error('팔로우 리스트 로딩 중 에러 발생:', error);
        this.hasError = true;
      }
    },
    goToChannel(userId) {
      this.$router.push(`/channel/${userId}`);
    },
    async toggleFollow(user) {
      try {
        const memberApi = process.env.VUE_APP_MEMBER_API;
        await axios.post(`${memberApi}/follow/toggle/${user.userId}`);
        // Optimistically update UI
        user.isFollow = user.isFollow === 'Y' ? 'N' : 'Y';
      } catch (error) {
        alert('팔로우 처리 중 오류가 발생했습니다.');
      }
    }
  }
};
</script>

<style scoped>
.following-channels {
  width: 100%;
}
.channels-list {
  margin-top: 24px;
}
.channel-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px 16px;
}
.channel-item {
  background: #18191c;
  border-radius: 12px;
  padding: 24px 12px 20px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: box-shadow 0.2s;
}
.channel-item:hover {
  box-shadow: 0 4px 16px rgba(176,132,204,0.15);
}
.profile-wrapper {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: visible;
  margin-bottom: 20px;
  cursor: pointer;
}
.profile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  overflow: hidden;
}
.profile-img.live-border {
  border: 3px solid #ff3b3b;
}
.live-badge {
  position: absolute;
  left: 50%;
  bottom: -4px;
  transform: translateX(-50%);
  background: #ff3b3b;
  color: #fff;
  font-size: 11px;
  padding: 2px 10px 1px 10px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
  z-index: 10;
  pointer-events: none;
}
.nickname {
  margin: 8px 0 12px 0;
  font-size: 17px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  text-align: center;
  word-break: break-all;
}
.follow-btn {
  font-size: 15px;
  font-weight: 500;
  margin-top: 2px;
  background: #B084CC;
  color: #000;
  transition: background 0.2s, color 0.2s;
}
.follow-btn.following {
  background: #2D2D2D !important;
  color: #fff !important;
}
.follow-btn:not(.following):hover {
  background: #a06fc7;
}
.follow-btn.following:hover {
  background: #3D3D3D !important;
}
</style>
