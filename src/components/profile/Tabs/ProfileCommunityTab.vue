<template>
  <div>
    <div v-if="isLoading" class="d-flex justify-center pa-6">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <div v-else-if="error" class="text-center pa-6">
      <v-alert type="error">{{ error }}</v-alert>
      <v-btn color="primary" @click="$emit('retry')" class="mt-4">다시 시도</v-btn>
    </div>

    <div v-else-if="posts.length === 0" class="no-content-container">
      <div class="no-content-icon">
        <v-icon size="100" color="grey-darken-1">mdi-forum-outline</v-icon>
      </div>
      <div class="no-content-message">
        게시물이 하나도 없네요...
      </div>
      <v-btn color="primary" class="upload-btn" rounded @click="$emit('create-post')">
        게시물 작성
      </v-btn>
    </div>

    <div v-else class="posts-grid pa-4">
      <v-row>
        <v-col
            v-for="post in posts"
            :key="post.postId"
            cols="12"
            sm="6"
            md="4"
        >
          <post-card :post="post" @click="$emit('view-post', post.postId)" />
        </v-col>
      </v-row>

      <div v-if="hasMorePosts" class="text-center mt-4">
        <v-btn variant="outlined" @click="$emit('load-more')" :loading="loadingMore">더 보기</v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import PostCard from '../PostCard.vue';

export default {
  name: 'ProfileCommunityTab',
  components: {
    PostCard
  },
  props: {
    posts: {
      type: Array,
      default: () => []
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: null
    },
    hasMorePosts: {
      type: Boolean,
      default: false
    },
    loadingMore: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.no-content-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
  text-align: center;
}

.no-content-icon {
  margin-bottom: 20px;
}

.no-content-message {
  font-size: 18px;
  color: #c4bab4;
  margin-bottom: 30px;
}

.upload-btn {
  min-width: 180px;
  font-size: 16px;
  height: 48px;
}

.posts-grid {
  min-height: 300px;
}
</style>
