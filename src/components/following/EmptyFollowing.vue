<template>
  <div class="empty-following">
    <p class="empty-message">팔로잉중인 채널이 없습니다.</p>
    <button class="go-live-btn" @click="goToHome">다른 방송 보러가기</button>
  </div>
</template>

<script>
export default {
  name: 'EmptyFollowing',
  methods: {
    goToHome() {
      this.$router.push('/');
    }
  }
}
</script>

<style scoped>
.empty-following {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  text-align: center;
}

.empty-message {
  font-size: 18px;
  color: #ffffff;
  margin-bottom: 24px;
}

.go-live-btn {
  background-color: #9147ff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.go-live-btn:hover {
  background-color: #772ce8;
}
</style>