<!-- components/profile/ProfileHeader.vue -->
<template>
  <div class="profile-header">
    <div class="profile-banner">
      <img v-if="profile.bannerImg" :src="profile.bannerImg" alt="배너 이미지">
    </div>

    <div class="profile-info">
      <div class="profile-avatar">
        <v-avatar size="100">
          <v-img :src="profile.profileImage || '@/assets/profile-avatar.png'" />
        </v-avatar>
      </div>

      <div class="profile-details">
        <h1>{{ profile.nickname || '사용자' }}</h1>
        <div class="follower-info">
          팔로워 {{ profile.followers || 0 }}명 · 프로필 보기 >
        </div>
        <div class="channel-description">
          {{ profile.email }}
        </div>
      </div>

      <div class="profile-actions">
        <v-btn color="primary" class="action-btn">
          <v-icon left>mdi-video</v-icon>
          방송하기
        </v-btn>

        <v-btn variant="outlined" class="action-btn">
          <v-icon>mdi-cog</v-icon>
          채널 관리
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfileHeader',
  props: {
    profile: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
.profile-header {
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #1e2029;
}

.profile-banner {
  height: 180px;
  background-color: #2d2d39;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info {
  padding: 20px;
  display: flex;
  align-items: flex-start;
}

.profile-avatar {
  margin-right: 20px;
}

.profile-details {
  flex: 1;
}

.profile-details h1 {
  font-size: 24px;
  margin-bottom: 8px;
  color: #ffffff;
}

.follower-info {
  font-size: 14px;
  color: #c4bab4;
  margin-bottom: 8px;
}

.channel-description {
  font-size: 14px;
  color: #c4bab4;
}

.profile-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  min-width: auto;
}
</style>