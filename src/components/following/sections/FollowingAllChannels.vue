<template>
    <div class="offline-section">
        <h2>오프라인</h2>
        <br>
        <br>
        <div class="offline-list">
            <div
                v-for="user in offlineUsers.slice(0, 10)"
                :key="user.userId"
                @click="goToChannel(user.userId)"
                class="offline-item"
            >
                <img
                    :src="user.followerImg"
                    alt="profile"
                    class="profile-img"
                />
                <br>
                <div class="nickname ellipsis">
                    {{ user.followerNickName }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const memberApi = process.env.VUE_APP_MEMBER_API;
const offlineUsers = ref([]);
const router = useRouter();

onMounted(async () => {
  const { data } = await axios.get(`${memberApi}/follow/list`);
  offlineUsers.value = data.result.filter(user => user.liveYn === 'N');
});

function goToChannel(userId) {
  router.push(`/channel/${userId}`);
}
</script>

<style scoped>
.offline-section {
  width: 100%;
  padding: 16px 0;
}
.offline-list {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: flex-start;
}
.offline-item {
  cursor: pointer;
  text-align: center;
  flex: 1 1 120px;
  min-width: 100px;
  max-width: 140px;
  margin-bottom: 16px;
  transition: transform 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}
.offline-item:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.profile-img {
  width: 70%;
  max-width: 80px;
  min-width: 80px;
  aspect-ratio: 1/1;
  border-radius: 50%;
  border: 3px solid #222;
  object-fit: cover;
  background: #222;
}
.nickname {
  margin-top: 14px;
  color: #bfc9db;
  font-size: 1rem;
  word-break: break-all;
  max-width: 100%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
  min-height: 2.4em;
}
.ellipsis {
  max-width: 100%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
@media (max-width: 600px) {
  .offline-list {
    gap: 12px;
  }
  .offline-item {
    min-width: 80px;
    max-width: 100px;
  }
  .profile-img {
    max-width: 60px;
  }
}
</style>
