<!-- components/profile/ProfileAboutTab.vue -->
<template>
  <v-card color="surface" class="pa-6">
    <v-card-text>
      <h3 class="mb-4">채널 정보</h3>
      <p class="mb-4">{{ profile.description || '아직 채널 설명이 없습니다.' }}</p>

      <h4 class="mb-2">통계</h4>
      <p>가입일: {{ profile.joinDate || '정보 없음' }}</p>
      <p>총 조회수: {{ profile.totalViews || 0 }}</p>
      <p>베리 잔액: {{ profile.berryBalance || 0 }}</p>
      <p>스트리머 여부: {{ profile.streamer === 'Y' ? '스트리머' : '일반 사용자' }}</p>

      <div v-if="profile.adult || profile.gender || profile.birthYear" class="mt-4">
        <h4 class="mb-2">개인 정보</h4>
        <p v-if="profile.gender">성별: {{ profile.gender }}</p>
        <p v-if="profile.birthYear">출생년도: {{ profile.birthYear }}</p>
        <p v-if="profile.adult">성인 여부: {{ profile.adult === 'Y' ? '성인' : '미성년자' }}</p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'ProfileAboutTab',
  props: {
    profile: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
h3 {
  font-size: 20px;
  color: #ffffff;
  margin-bottom: 16px;
}

h4 {
  font-size: 16px;
  color: #ffffff;
  margin-bottom: 12px;
}

p {
  color: #c4bab4;
  margin-bottom: 8px;
  line-height: 1.5;
}
</style>