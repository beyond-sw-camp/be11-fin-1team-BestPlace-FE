<!-- components/profile/ClipCard.vue -->
<template>
  <v-card class="clip-card" @click="$emit('click')">
    <v-img
        :src="clip.thumbnailUrl || 'https://via.placeholder.com/300x180?text=클립'"
        height="180"
        cover
    >
      <div class="position-absolute pa-2" style="bottom: 0; right: 0;">
        <div class="video-duration">{{ formatDuration(clip.duration) }}</div>
      </div>
    </v-img>

    <v-card-title class="text-truncate">{{ clip.title }}</v-card-title>

    <v-card-text>
      <div class="d-flex align-center mt-2">
        <v-icon size="small" class="mr-1">mdi-heart</v-icon>
        <span class="text-caption">{{ clip.likeCount }}</span>
        <span class="text-caption ml-auto">{{ formatDate(clip.createdTime) }}</span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'ClipCard',
  props: {
    clip: {
      type: Object,
      required: true
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return '';

      const date = new Date(dateString);
      const now = new Date();

      // 오늘 날짜인 경우
      if (date.toDateString() === now.toDateString()) {
        return `오늘 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }

      // 어제 날짜인 경우
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `어제 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }

      // 일주일 이내인 경우
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      if (date > oneWeekAgo) {
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        return `${days[date.getDay()]}요일 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }

      // 그 외의 경우
      return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
    },
    formatDuration(seconds) {
      if (!seconds) return '00:00';

      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);

      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
      }

      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }
}
</script>

<style scoped>
.clip-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease;
  background-color: #1e2029;
}

.clip-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.position-absolute {
  position: absolute;
}

.video-duration {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
</style>