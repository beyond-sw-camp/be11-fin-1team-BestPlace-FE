<template>
  <v-card class="post-card" @click="$emit('click', post.postId)">
    <!-- 썸네일 이미지 -->
    <v-img
        v-if="post.thumbnailUrl"
        :src="post.thumbnailUrl"
        height="180px"
        cover
    />

    <v-card-title class="text-truncate">{{ post.title }}</v-card-title>

    <v-card-text>
      <p class="text-truncate-2">{{ post.content }}</p>
      <div class="d-flex align-center mt-2">
        <span class="text-caption">{{ post.streamerNickname }}</span>
        <span class="text-caption ml-auto">{{ formatDate(post.createdTime) }}</span>
      </div>
    </v-card-text>

    <v-card-actions class="justify-space-between">
      <span class="text-caption">
        <v-icon size="16" class="mr-1">mdi-thumb-up-outline</v-icon>{{ post.likeCount }}
      </span>
      <span class="text-caption">
        <v-icon size="16" class="mr-1">mdi-comment-outline</v-icon>{{ post.commentCount }}
      </span>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'PostCard',
  props: {
    post: {
      type: Object,
      required: true
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return '';

      const date = new Date(dateString);
      const now = new Date();

      if (date.toDateString() === now.toDateString()) {
        return `오늘 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `어제 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      if (date > oneWeekAgo) {
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        return `${days[date.getDay()]}요일 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }

      return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
    }
  }
}
</script>

<style scoped>
.post-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease;
  background-color: #1e2029;
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
