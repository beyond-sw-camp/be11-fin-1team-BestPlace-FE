<template>
  <div class="post-detail-page">
    <div v-if="loading" class="loading-container">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <div v-else-if="error" class="error-container">
      <v-alert type="error" class="mb-4">{{ error }}</v-alert>
      <v-btn color="primary" @click="fetchPostDetail">다시 시도</v-btn>
    </div>

    <template v-else>
      <div class="post-header">
        <v-btn icon @click="$router.go(-1)" class="back-button">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <h1 class="post-title">{{ post.title }}</h1>
      </div>

      <v-card class="post-content">
        <div class="post-author">
          <v-avatar size="40" class="mr-3">
            <v-img :src="post.streamerProfileImage || '@/assets/profile-avatar.png'" />
          </v-avatar>
          <div>
            <div class="author-name">{{ post.streamerNickname }}</div>
            <div class="post-date">{{ formatDate(post.createdTime) }}</div>
          </div>
        </div>

        <v-divider class="my-4"></v-divider>

        <!-- 이미지 슬라이더 (이미지가 있는 경우에만 표시) -->
        <v-carousel
            v-if="post.imageUrls && post.imageUrls.length > 0"
            height="400"
            hide-delimiters
            show-arrows="hover"
            class="post-images mb-4"
        >
          <v-carousel-item
              v-for="(image, i) in post.imageUrls"
              :key="i"
              :src="image"
              cover
          ></v-carousel-item>
        </v-carousel>

        <!-- 본문 내용 -->
        <div class="post-text">
          <p>{{ post.content }}</p>
        </div>

        <div class="post-stats">
          <div class="stat-item">
            <v-icon class="mr-1">mdi-eye</v-icon>
            <span>{{ post.views }}</span>
          </div>
          <div class="stat-item" @click="toggleLike">
            <v-icon class="mr-1" :color="post.liked ? 'error' : ''">
              {{ post.liked ? 'mdi-heart' : 'mdi-heart-outline' }}
            </v-icon>
            <span>{{ post.likeCount }}</span>
          </div>
        </div>
      </v-card>

      <!-- 댓글 섹션 -->
      <v-card class="comments-section mt-4">
        <v-card-title>댓글 {{ comments.length }}</v-card-title>

        <!-- 댓글 작성 폼 -->
        <div class="comment-form pa-4">
          <div class="d-flex">
            <v-avatar size="36" class="mr-3">
              <v-img :src="userProfile.profileImage || '@/assets/profile-avatar.png'" />
            </v-avatar>
            <v-text-field
                v-model="newComment"
                placeholder="댓글을 입력하세요..."
                variant="outlined"
                density="comfortable"
                hide-details
                class="flex-grow-1"
            ></v-text-field>
            <v-btn
                color="primary"
                class="ml-2 align-self-center"
                :disabled="!newComment.trim()"
                :loading="commentSubmitting"
                @click="submitComment"
            >
              등록
            </v-btn>
          </div>
        </div>

        <v-divider></v-divider>

        <!-- 댓글 목록 -->
        <div v-if="commentsLoading" class="text-center py-4">
          <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
        </div>

        <div v-else-if="comments.length === 0" class="text-center py-6">
          <v-icon size="48" color="grey-darken-1" class="mb-3">mdi-comment-outline</v-icon>
          <div class="text-body-1">첫 번째 댓글을 남겨보세요!</div>
        </div>

        <div v-else class="comments-list">
          <div
              v-for="comment in comments"
              :key="comment.commentId"
              class="comment-item"
          >
            <div class="d-flex">
              <v-avatar size="36" class="mr-3">
                <v-img :src="comment.profileImageUrl || '@/assets/profile-avatar.png'" />
              </v-avatar>
              <div class="flex-grow-1">
                <div class="comment-header">
                  <span class="comment-author">{{ comment.nickName }}</span>
                  <span class="comment-date">{{ formatDate(comment.createdTime) }}</span>
                </div>
                <div class="comment-content">
                  {{ comment.contents }}
                </div>

                <!-- 댓글 이미지가 있으면 표시 -->
                <div v-if="comment.imageUrls && comment.imageUrls.length > 0" class="comment-images mt-2">
                  <img
                      v-for="(img, index) in comment.imageUrls"
                      :key="index"
                      :src="img"
                      class="comment-image"
                      @click="openImageDialog(img)"
                  />
                </div>

                <div class="comment-actions mt-1">
                  <span class="action-btn" @click="toggleCommentLike(comment)">
                    <v-icon
                        size="small"
                        :color="comment.isLiked ? 'error' : ''"
                    >
                      {{ comment.isLiked ? 'mdi-heart' : 'mdi-heart-outline' }}
                    </v-icon>
                    <span v-if="comment.likeCount > 0" class="ml-1">{{ comment.likeCount }}</span>
                  </span>

                  <span class="action-btn ml-3" @click="showReplyForm(comment.commentId)">
                    <v-icon size="small">mdi-reply</v-icon>
                    <span class="ml-1">답글</span>
                  </span>
                </div>

                <!-- 답글 폼 -->
                <div v-if="activeReplyId === comment.commentId" class="reply-form mt-2">
                  <div class="d-flex">
                    <v-text-field
                        v-model="replyText"
                        placeholder="답글을 입력하세요..."
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="flex-grow-1"
                    ></v-text-field>
                    <v-btn
                        color="primary"
                        size="small"
                        class="ml-2 align-self-center"
                        :disabled="!replyText.trim()"
                        :loading="replySubmitting"
                        @click="submitReply(comment.commentId)"
                    >
                      등록
                    </v-btn>
                  </div>
                </div>

                <!-- 대댓글 목록 -->
                <div v-if="Array.isArray(comment.childComments) && comment.childComments.length > 0" class="child-comments mt-3">
                  <div
                      v-for="childComment in comment.childComments"
                      :key="childComment.commentId"
                      class="child-comment-item mt-2"
                  >
                    <div class="d-flex">
                      <v-avatar size="28" class="mr-2">
                        <v-img :src="childComment.profileImageUrl || '@/assets/profile-avatar.png'" />
                      </v-avatar>
                      <div class="flex-grow-1">
                        <div class="comment-header">
                          <span class="comment-author">{{ childComment.nickName }}</span>
                          <span class="comment-date">{{ formatDate(childComment.createdTime) }}</span>
                        </div>
                        <div class="comment-content">
                          <span v-if="childComment.targetNickname" class="reply-target">
                            @{{ childComment.targetNickname }}
                          </span>
                          {{ childComment.contents }}
                        </div>

                        <!-- 대댓글 이미지가 있으면 표시 -->
                        <div v-if="childComment.imageUrls && childComment.imageUrls.length > 0" class="comment-images mt-2">
                          <img
                              v-for="(img, index) in childComment.imageUrls"
                              :key="index"
                              :src="img"
                              class="comment-image-small"
                              @click="openImageDialog(img)"
                          />
                        </div>

                        <div class="comment-actions mt-1">
                          <span class="action-btn" @click="toggleChildCommentLike(childComment)">
                            <v-icon
                                size="x-small"
                                :color="childComment.isLiked ? 'error' : ''"
                            >
                              {{ childComment.isLiked ? 'mdi-heart' : 'mdi-heart-outline' }}
                            </v-icon>
                            <span v-if="childComment.likeCount > 0" class="ml-1">{{ childComment.likeCount }}</span>
                          </span>

                          <span class="action-btn ml-3" @click="showReplyForm(comment.commentId, childComment.nickName)">
                            <v-icon size="x-small">mdi-reply</v-icon>
                            <span class="ml-1">답글</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 더 많은 댓글 로드 -->
          <div v-if="hasMoreComments" class="text-center py-4">
            <v-btn variant="text" @click="loadMoreComments" :loading="loadingMoreComments">
              댓글 더 보기
            </v-btn>
          </div>
        </div>
      </v-card>
    </template>

    <!-- 이미지 확대 보기 다이얼로그 -->
    <v-dialog v-model="imageDialog" max-width="90vw">
      <v-card>
        <v-img :src="selectedImage" contain max-height="90vh"></v-img>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn icon @click="imageDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      post: {
        id: null,
        title: '',
        content: '',
        imageUrls: [],
        streamerNickname: '',
        streamerId: null,
        streamerProfileImage: '',
        views: 0,
        likeCount: 0,
        liked: false,
        createdTime: null
      },
      comments: [],
      loading: true,
      error: null,
      commentsLoading: false,
      newComment: '',
      commentSubmitting: false,
      replyText: '',
      replySubmitting: false,
      activeReplyId: null,
      activeReplyTarget: null,
      userProfile: {
        nickname: '',
        profileImage: ''
      },
      commentPage: 0,
      commentSize: 10,
      hasMoreComments: false,
      loadingMoreComments: false,
      imageDialog: false,
      selectedImage: ''
    };
  },
  computed: {
    postId() {
      return this.$route.params.postId;
    }
  },
  mounted() {
    this.fetchPostDetail();
    this.fetchUserProfile();
  },
  methods: {
    async fetchPostDetail() {
      this.loading = true;
      this.error = null;

      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
          this.$router.push('/member/login');
          return;
        }

        // 게시물 상세 정보 가져오기
        const response = await axios.get(
            `http://localhost:8080/member-service/post/community/${userId}/detail/${this.postId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'X-User-Id': userId
              }
            }
        );

        if (response.data && response.data.result) {
          this.post = response.data.result;
          console.log('게시물 정보:', this.post);

          // 댓글 가져오기
          this.fetchComments();
        }
      } catch (error) {
        console.error('게시물 상세 정보 가져오기 실패:', error);
        this.error = '게시물을 불러오는 중 오류가 발생했습니다.';

        // API 없을 경우 예시 데이터
        this.post = {
          id: this.postId,
          title: '샘플 게시물 제목',
          content: '이 게시물은 예시 데이터입니다. 실제 API가 연결되면 서버에서 가져온 데이터로 교체됩니다.',
          imageUrls: [
            'https://via.placeholder.com/800x400?text=Sample+Image+1',
            'https://via.placeholder.com/800x400?text=Sample+Image+2'
          ],
          streamerNickname: '샘플 사용자',
          streamerId: 1,
          streamerProfileImage: '@/assets/profile-avatar.png',
          views: 123,
          likeCount: 45,
          liked: false,
          createdTime: new Date().toISOString()
        };

        // 샘플 댓글 가져오기
        this.loadSampleComments();
      } finally {
        this.loading = false;
      }
    },

    async fetchUserProfile() {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) return;

        const response = await axios.get(
            `http://localhost:8080/member-service/member/detail/${userId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'X-User-Id': userId
              }
            }
        );

        if (response.data && response.data.result) {
          const userData = response.data.result;
          this.userProfile = {
            nickname: userData.name || '사용자',
            profileImage: userData.profileImg || '@/assets/default-avatar.png',
          };
        }
      } catch (error) {
        console.error('사용자 프로필 가져오기 실패:', error);
      }
    },

    async fetchComments() {
      this.commentsLoading = true;

      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        const response = await axios.get(
            `http://localhost:8080/member-service/post/comment/list/${this.postId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'X-User-Id': userId
              },
              params: {
                page: this.commentPage,
                size: this.commentSize
              }
            }
        );

        if (response.data && response.data.result) {
          const newComments = response.data.result || [];

          if (this.commentPage === 0) {
            this.comments = newComments;
          } else {
            this.comments = [...this.comments, ...newComments];
          }

          // 댓글마다 좋아요 상태 추가
          this.comments = this.comments.map(comment => ({
            ...comment,
            commentId: comment.commentId || comment.id, // 🔥 서버에서 id로 들어온 경우 대응
            isLiked: false,
            childComments: (comment.childComments || []).map(child => ({
              ...child,
              commentId: child.commentId || child.id, // 🔥 대댓글도 대응
              isLiked: false
            }))
          }));

          this.hasMoreComments = newComments.length >= this.commentSize;
        }
      } catch (error) {
        console.error('댓글 가져오기 실패:', error);
        // API 없을 경우 예시 데이터
        this.loadSampleComments();
      } finally {
        this.commentsLoading = false;
        this.loadingMoreComments = false;
      }
    },

    loadSampleComments() {
      // API 없을 때 샘플 댓글 데이터
      this.comments = [
        {
          commentId: 1,
          nickName: '댓글 작성자1',
          profileImageUrl: 'https://via.placeholder.com/36',
          contents: '정말 유익한 게시물이네요!',
          createdTime: new Date(Date.now() - 3600000).toISOString(),
          imageUrls: [],
          likeCount: 5,
          isLiked: false,
          childComments: [
            {
              commentId: 3,
              nickName: '답글 작성자1',
              profileImageUrl: 'https://via.placeholder.com/36',
              contents: '저도 동의합니다!',
              createdTime: new Date(Date.now() - 1800000).toISOString(),
              targetNickname: '댓글 작성자1',
              imageUrls: [],
              likeCount: 2,
              isLiked: false
            }
          ]
        },
        {
          commentId: 2,
          nickName: '댓글 작성자2',
          profileImageUrl: 'https://via.placeholder.com/36',
          contents: '사진이 정말 멋져요! 어디서 찍으신 건가요?',
          createdTime: new Date(Date.now() - 7200000).toISOString(),
          imageUrls: ['https://via.placeholder.com/200x150?text=Comment+Image'],
          likeCount: 3,
          isLiked: false,
          childComments: []
        }
      ];

      this.hasMoreComments = false;
    },

    loadMoreComments() {
      this.commentPage++;
      this.loadingMoreComments = true;
      this.fetchComments();
    },

    async submitComment() {
      if (!this.newComment.trim()) return;

      this.commentSubmitting = true;

      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
          this.$router.push('/member/login');
          return;
        }

        const formData = new FormData();
        formData.append('contents', this.newComment);

        const response = await axios.post(
            `http://localhost:8080/member-service/post/comment/create/${this.postId}`,
            formData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'X-User-Id': userId,
                'Content-Type': 'multipart/form-data'
              }
            }
        );

        if (response.data && response.data.status_code === 201) {
          // 댓글 작성 성공, 댓글 목록 새로고침
          this.newComment = '';
          this.commentPage = 0;
          this.fetchComments();
        }
      } catch (error) {
        console.error('댓글 작성 실패:', error);
        alert('댓글 작성 중 오류가 발생했습니다.');

        // API 없을 경우 댓글 추가 시뮬레이션
        if (!this.comments) this.comments = [];

        const newComment = {
          commentId: Date.now(),
          nickName: this.userProfile.nickname || '사용자',
          profileImageUrl: this.userProfile.profileImage || '@/assets/default-avatar.png',
          contents: this.newComment,
          createdTime: new Date().toISOString(),
          imageUrls: [],
          likeCount: 0,
          isLiked: false,
          childComments: []
        };

        this.comments.unshift(newComment);
        this.newComment = '';
      } finally {
        this.commentSubmitting = false;
      }
    },

    showReplyForm(commentId, targetNickname = null) {
      if (this.activeReplyId === commentId && (!targetNickname || this.activeReplyTarget === targetNickname)) {
        // 같은 댓글의 답글 폼이 이미 열려있으면 닫기
        this.activeReplyId = null;
        this.activeReplyTarget = null;
        this.replyText = '';
      } else {
        // 다른 댓글이면 해당 댓글의 답글 폼 열기
        this.activeReplyId = commentId;
        this.activeReplyTarget = targetNickname;
        this.replyText = targetNickname ? `@${targetNickname} ` : '';
      }
    },

    async submitReply(parentCommentId) {
      if (!this.replyText.trim()) return;

      this.replySubmitting = true;

      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
          this.$router.push('/member/login');
          return;
        }

        const formData = new FormData();
        formData.append('contents', this.replyText);
        formData.append('parentCommentId', parentCommentId);

        const response = await axios.post(
            `http://localhost:8080/member-service/post/comment/create/${this.postId}`,
            formData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'X-User-Id': userId,
                'Content-Type': 'multipart/form-data'
              }
            }
        );

        if (response.data && response.data.status_code === 201) {
          // 답글 작성 성공, 댓글 목록 새로고침
          this.replyText = '';
          this.activeReplyId = null;
          this.activeReplyTarget = null;
          this.commentPage = 0;
          this.fetchComments();
        }
      } catch (error) {
        console.error('답글 작성 실패:', error);
        alert('답글 작성 중 오류가 발생했습니다.');

        // API 없을 경우 답글 추가 시뮬레이션
        const parentComment = this.comments.find(c => c.commentId === parentCommentId);
        if (parentComment) {
          if (!parentComment.childComments) parentComment.childComments = [];

          const newReply = {
            commentId: Date.now(),
            nickName: this.userProfile.nickname || '사용자',
            profileImageUrl: this.userProfile.profileImage || 'https://via.placeholder.com/36',
            contents: this.replyText.replace(`@${this.activeReplyTarget} `, ''),
            createdTime: new Date().toISOString(),
            targetNickname: this.activeReplyTarget,
            imageUrls: [],
            likeCount: 0,
            isLiked: false
          };

          parentComment.childComments.push(newReply);
          this.replyText = '';
          this.activeReplyId = null;
          this.activeReplyTarget = null;
        }
      } finally {
        this.replySubmitting = false;
      }
    },

    async toggleLike() {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
          this.$router.push('/member/login');
          return;
        }

        const endpoint = this.post.liked
            ? `http://localhost:8080/member-service/post/community/${this.postId}/like`
            : `http://localhost:8080/member-service/post/community/${this.postId}/like`;

        const method = this.post.liked ? 'delete' : 'post';

        const response = await axios({
          method,
          url: endpoint,
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': userId
          }
        });

        if (response.data && response.data.status_code === 200) {
          // 좋아요 상태 토글 및 카운트 업데이트
          this.post.liked = !this.post.liked;
          this.post.likeCount = this.post.liked
              ? this.post.likeCount + 1
              : Math.max(0, this.post.likeCount - 1);
        }
      } catch (error) {
        console.error('좋아요 토글 실패:', error);

        // API 없을 경우 좋아요 토글 시뮬레이션
        this.post.liked = !this.post.liked;
        this.post.likeCount = this.post.liked
            ? this.post.likeCount + 1
            : Math.max(0, this.post.likeCount - 1);
      }
    },

    async toggleCommentLike(comment) {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
          this.$router.push('/member/login');
          return;
        }

        const response = await axios.post(
            `http://localhost:8080/member-service/post/comment/like/${comment.commentId}`,
            {},
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'X-User-Id': userId
              }
            }
        );

        if (response.data && response.data.status_code === 201) {
          // 댓글 좋아요 상태 토글 및 카운트 업데이트
          comment.isLiked = !comment.isLiked;
          comment.likeCount = comment.isLiked
              ? comment.likeCount + 1
              : Math.max(0, comment.likeCount - 1);
        }
      } catch (error) {
        console.error('댓글 좋아요 토글 실패:', error);

        // API 없을 경우 좋아요 토글 시뮬레이션
        comment.isLiked = !comment.isLiked;
        comment.likeCount = comment.isLiked
            ? comment.likeCount + 1
            : Math.max(0, comment.likeCount - 1);
      }
    },

    toggleChildCommentLike(childComment) {
      // 대댓글 좋아요 토글 (위와 동일한 로직)
      childComment.isLiked = !childComment.isLiked;
      childComment.likeCount = childComment.isLiked
          ? childComment.likeCount + 1
          : Math.max(0, childComment.likeCount - 1);
    },

    openImageDialog(imageUrl) {
      this.selectedImage = imageUrl;
      this.imageDialog = true;
    },

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
    }
  }
};
</script>

<style scoped>
.post-detail-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.back-button {
  margin-right: 16px;
}

.post-title {
  font-size: 24px;
  color: #ffffff;
  flex: 1;
}

.post-content {
  background-color: #1e2029;
  padding: 24px;
  margin-bottom: 24px;
  border-radius: 8px;
}

.post-author {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.author-name {
  font-weight: 500;
  color: #ffffff;
}

.post-date {
  font-size: 12px;
  color: #c4bab4;
}

.post-images {
  border-radius: 8px;
  overflow: hidden;
}

.post-text {
  color: #ffffff;
  line-height: 1.6;
  margin-bottom: 24px;
  white-space: pre-line; /* 줄바꿈 보존 */
}

.post-stats {
  display: flex;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item {
  display: flex;
  align-items: center;
  color: #c4bab4;
  cursor: pointer;
}

.comments-section {
  background-color: #1e2029;
  border-radius: 8px;
}

.comment-form {
  padding: 16px;
}

.comments-list {
  padding: 0 16px;
}

.comment-item {
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.comment-author {
  font-weight: 500;
  color: #ffffff;
}

.comment-date {
  font-size: 12px;
  color: #c4bab4;
}

.comment-content {
  color: #ffffff;
  line-height: 1.5;
  white-space: pre-line; /* 줄바꿈 보존 */
}

.reply-target {
  color: #5ca1a8;
  font-weight: 500;
  margin-right: 4px;
}

.comment-actions {
  display: flex;
}

.action-btn {
  display: flex;
  align-items: center;
  color: #c4bab4;
  font-size: 12px;
  cursor: pointer;
}

.action-btn:hover {
  color: #ffffff;
}

.child-comments {
  margin-left: 16px;
  padding-left: 16px;
  border-left: 2px solid rgba(255, 255, 255, 0.1);
}

.child-comment-item {
  padding: 8px 0;
}

.comment-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.comment-image {
  width: 120px;
  height: 90px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}

.comment-image-small {
  width: 100px;
  height: 75px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}
</style>