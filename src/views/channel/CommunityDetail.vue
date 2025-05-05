<template>
  <div class="community-detail">
    <!-- 로딩 스피너 -->
    <div v-if="loading" class="loading-container">
      <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
      <p>게시글을 불러오는 중...</p>
    </div>

    <!-- 게시글 상세 정보 + 댓글 -->
    <div v-else-if="post" class="post-container">
      <!-- 게시글 상세 -->
      <div class="post-detail">
        <div class="post-header">
          <div class="user-info">
            <img :src="post.authorProfileImage || defaultProfileImage" alt="프로필 이미지" class="profile-image">
            <div class="user-text">
              <span class="author-name">{{ post.authorNickname }}</span>
              <span class="post-time">{{ formatRelativeTime(post.createdTime) }}</span>
            </div>
          </div>
          <div class="post-options" v-if="post.isOwner === 'Y'">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn icon size="small" v-bind="props" class="menu-btn">
                  <v-icon size="small">mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list density="compact" class="options-list">
                <v-list-item @click="editPost(post.postId)" density="compact" class="option-item">
                  <v-list-item-title>
                    <div class="menu-item edit-item">
                      <v-icon size="x-small">mdi-pencil</v-icon>
                      <span class="menu-text">수정</span>
                    </div>
                  </v-list-item-title>
                </v-list-item>
                <v-list-item @click="deletePost(post.postId)" density="compact" class="option-item">
                  <v-list-item-title>
                    <div class="menu-item delete-item">
                      <v-icon size="x-small">mdi-delete</v-icon>
                      <span class="menu-text">삭제</span>
                    </div>
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>
        
        <div class="post-content">
          <p class="content-text">{{ post.postContent }}</p>
        </div>
        
        <div class="post-images" v-if="post.imageUrlList && post.imageUrlList.length > 0">
          <div v-for="(image, index) in post.imageUrlList" :key="index" class="image-item">
            <img :src="image" alt="게시글 이미지" class="post-image">
          </div>
        </div>
        
        <div class="post-actions">
          <div class="buff-button post-buff" 
            :class="{ 'liked': post.isLiked === 'Y' }" 
            @click="toggleLike"
          >
            버프 {{ post.likesCount || 0 }}
          </div>
        </div>
      </div>
      
      <!-- 댓글 섹션 -->
      <div class="comments-section">
        <div class="comment-input-container">
          <img :src="userProfileImage" alt="내 프로필" class="profile-image">
          <div class="comment-input-wrapper">
            <textarea 
              v-model="commentContent" 
              class="comment-input" 
              placeholder="댓글을 남겨보세요"
              @input="checkCommentLength"
            ></textarea>
            <div class="comment-input-footer">
              <div class="content-count" :class="{ 'limit-exceeded': commentContent.length > 500 }">
                {{ commentContent.length }}/500
              </div>
              <v-btn 
                color="#B084CC" 
                class="submit-btn" 
                :disabled="commentContent.trim() === '' || commentContent.length > 500"
                @click="submitComment"
              >
                등록
              </v-btn>
            </div>
          </div>
        </div>
        
        <div class="comments-header">
          <h3>댓글 {{ totalCommentsCount }}</h3>
        </div>
        
        <div class="comments-list" ref="commentListRef" v-if="comments.length > 0">
          <div v-for="comment in comments" :key="comment.commentId" class="comment-item" :class="{ 'deleted': comment.isDeleted === 'Y' }">
            <template v-if="comment.isDeleted === 'Y'">
              <div class="deleted-comment">
                <span>삭제된 댓글입니다.</span>
              </div>
            </template>
            <template v-else>
              <div class="comment-user-info">
                <img :src="comment.authorProfileUrl || defaultProfileImage" alt="프로필 이미지" class="profile-image">
                <div class="comment-author-info">
                  <div class="author-name-time">
                    <span class="comment-author">{{ comment.authorNickName }}</span>
                    <span class="comment-time">{{ formatRelativeTime(comment.createdTime) }}</span>
                  </div>
                  <div class="comment-options" v-if="comment.isOwner === 'Y' || comment.authorId === currentUserId">
                    <v-menu>
                      <template v-slot:activator="{ props }">
                        <v-btn icon size="x-small" v-bind="props" class="menu-btn">
                          <v-icon size="x-small">mdi-dots-vertical</v-icon>
                        </v-btn>
                      </template>
                      <v-list density="compact" class="options-list">
                        <v-list-item v-if="comment.authorId === currentUserId" @click="showEditCommentForm(comment)" density="compact" class="option-item">
                          <v-list-item-title>
                            <div class="menu-item edit-item">
                              <v-icon size="x-small">mdi-pencil</v-icon>
                              <span class="menu-text">수정</span>
                            </div>
                          </v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="deleteComment(comment.commentId)" density="compact" class="option-item">
                          <v-list-item-title>
                            <div class="menu-item delete-item">
                              <v-icon size="x-small">mdi-delete</v-icon>
                              <span class="menu-text">삭제</span>
                            </div>
                          </v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </div>
                </div>
              </div>
              
              <div class="comment-body">
                <!-- 댓글 내용 (일반 모드) -->
                <div v-if="!comment.isEditing" class="comment-text">{{ comment.content }}</div>
                
                <!-- 댓글 수정 모드 -->
                <div v-else class="comment-edit-form">
                  <textarea 
                    v-model="comment.editContent" 
                    class="comment-edit-input" 
                    placeholder="댓글을 입력하세요"
                    @input="checkEditCommentLength(comment)"
                  ></textarea>
                  <div class="comment-edit-footer">
                    <div class="content-count" :class="{ 'limit-exceeded': comment.editContent.length > 500 }">
                      {{ comment.editContent.length }}/500
                    </div>
                    <div class="button-group">
                      <v-btn text size="small" @click="cancelEditComment(comment)" class="cancel-edit-btn">취소</v-btn>
                      <v-btn 
                        color="#B084CC" 
                        size="small" 
                        class="save-edit-btn" 
                        :disabled="comment.editContent.trim() === '' || comment.editContent.length > 500"
                        @click="updateComment(comment)"
                      >
                        수정
                      </v-btn>
                    </div>
                  </div>
                </div>
                
                <div class="comment-actions">
                  <div v-if="!comment.parentCommentId" class="reply-button" @click="showReplyForm(comment)">
                    <span>답글 쓰기</span>
                  </div>
                  
                  <div class="buff-button comment-buff" 
                    :class="{ 'liked': comment.isLike === 'Y' }" 
                    @click="toggleCommentLike(comment)"
                  >
                    버프 {{ comment.likeCount || 0 }}
                  </div>
                </div>
              </div>
              
              <!-- 답글 작성 폼 -->
              <div v-if="comment.showReplyForm && !comment.parentCommentId" class="reply-form">
                <div class="reply-input-container">
                  <img :src="userProfileImage" alt="내 프로필" class="profile-image small">
                  <div class="reply-input-wrapper">
                    <textarea 
                      v-model="comment.replyContent" 
                      class="reply-input" 
                      placeholder="답글을 입력하세요"
                      @input="checkReplyLength(comment)"
                    ></textarea>
                    <div class="reply-input-footer">
                      <div class="content-count" :class="{ 'limit-exceeded': comment.replyContent.length > 500 }">
                        {{ comment.replyContent.length }}/500
                      </div>
                      <div class="button-group">
                        <v-btn text size="small" @click="hideReplyForm(comment)" class="cancel-reply-btn">취소</v-btn>
                        <v-btn 
                          color="#B084CC" 
                          size="small" 
                          class="submit-reply-btn" 
                          :disabled="comment.replyContent.trim() === '' || comment.replyContent.length > 500"
                          @click="submitReply(comment)"
                        >
                          등록
                        </v-btn>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            
            <!-- 대댓글 목록 -->
            <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
              <div v-for="reply in comment.replies" :key="reply.commentId" class="reply-item" :class="{ 'deleted': reply.isDeleted === 'Y' }">
                <template v-if="reply.isDeleted === 'Y'">
                  <div class="deleted-comment">
                    <span>삭제된 답글입니다.</span>
                  </div>
                </template>
                <template v-else>
                  <div class="reply-user-info">
                    <img :src="reply.authorProfileUrl || defaultProfileImage" alt="프로필 이미지" class="profile-image small">
                    <div class="reply-author-info">
                      <div class="author-name-time">
                        <span class="comment-author">{{ reply.authorNickName }}</span>
                        <span class="comment-time">{{ formatRelativeTime(reply.createdTime) }}</span>
                      </div>
                      <div class="comment-options" v-if="reply.isOwner === 'Y' || reply.authorId === currentUserId">
                        <v-menu>
                          <template v-slot:activator="{ props }">
                            <v-btn icon size="x-small" v-bind="props" class="menu-btn">
                              <v-icon size="x-small">mdi-dots-vertical</v-icon>
                            </v-btn>
                          </template>
                          <v-list density="compact" class="options-list">
                            <v-list-item v-if="reply.authorId === currentUserId" @click="showEditCommentForm(reply)" density="compact" class="option-item">
                              <v-list-item-title>
                                <div class="menu-item edit-item">
                                  <v-icon size="x-small">mdi-pencil</v-icon>
                                  <span class="menu-text">수정</span>
                                </div>
                              </v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="deleteComment(reply.commentId)" density="compact" class="option-item">
                              <v-list-item-title>
                                <div class="menu-item delete-item">
                                  <v-icon size="x-small">mdi-delete</v-icon>
                                  <span class="menu-text">삭제</span>
                                </div>
                              </v-list-item-title>
                            </v-list-item>
                          </v-list>
                        </v-menu>
                      </div>
                    </div>
                  </div>
                  
                  <div class="reply-body">
                    <!-- 대댓글 내용 (일반 모드) -->
                    <div v-if="!reply.isEditing" class="reply-text">{{ reply.content }}</div>
                    
                    <!-- 대댓글 수정 모드 -->
                    <div v-else class="reply-edit-form">
                      <textarea 
                        v-model="reply.editContent" 
                        class="reply-edit-input" 
                        placeholder="답글을 입력하세요"
                        @input="checkEditCommentLength(reply)"
                      ></textarea>
                      <div class="reply-edit-footer">
                        <div class="content-count" :class="{ 'limit-exceeded': reply.editContent.length > 500 }">
                          {{ reply.editContent.length }}/500
                        </div>
                        <div class="button-group">
                          <v-btn text size="small" @click="cancelEditComment(reply)" class="cancel-edit-btn">취소</v-btn>
                          <v-btn 
                            color="#B084CC" 
                            size="small" 
                            class="save-edit-btn" 
                            :disabled="reply.editContent.trim() === '' || reply.editContent.length > 500"
                            @click="updateComment(reply)"
                          >
                            수정
                          </v-btn>
                        </div>
                      </div>
                    </div>
                    
                    <div class="reply-actions">
                      <div class="reply-button" @click="showReplyFormFromReply(reply)">
                        <span>답글 쓰기</span>
                      </div>
                      <div class="buff-button comment-buff" 
                        :class="{ 'liked': reply.isLike === 'Y' }" 
                        @click="toggleCommentLike(reply)"
                      >
                        버프 {{ reply.likeCount || 0 }}
                      </div>
                    </div>
                  </div>
                  
                  <!-- 대댓글의 답글 폼 추가 -->
                  <div v-if="reply.showReplyForm" class="reply-form reply-to-reply-form">
                    <div class="reply-input-container">
                      <img :src="userProfileImage" alt="내 프로필" class="profile-image small">
                      <div class="reply-input-wrapper">
                        <textarea 
                          v-model="reply.replyContent" 
                          class="reply-input" 
                          placeholder="답글을 입력하세요"
                          @input="checkReplyLength(reply)"
                        ></textarea>
                        <div class="reply-input-footer">
                          <div class="content-count" :class="{ 'limit-exceeded': reply.replyContent.length > 500 }">
                            {{ reply.replyContent.length }}/500
                          </div>
                          <div class="button-group">
                            <v-btn text size="small" @click="hideReplyForm(reply)" class="cancel-reply-btn">취소</v-btn>
                            <v-btn 
                              color="#B084CC" 
                              size="small" 
                              class="submit-reply-btn" 
                              :disabled="reply.replyContent.trim() === '' || reply.replyContent.length > 500"
                              @click="submitReply(reply)"
                            >
                              등록
                            </v-btn>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
          
          <!-- 무한 스크롤 로딩 표시 -->
          <div v-if="commentsLoading" class="comments-loading">
            <v-progress-circular indeterminate color="#B084CC" size="24"></v-progress-circular>
            <span>댓글 불러오는 중...</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 게시글이 없는 경우 -->
    <div v-else-if="!loading" class="empty-container">
      <p>존재하지 않는 게시글입니다.</p>
      <v-btn color="#B084CC" text @click="goBack">목록으로 돌아가기</v-btn>
    </div>

    <!-- 알림 모달 -->
    <v-dialog v-model="alertModalOpen" max-width="400" content-class="community-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">알림</div>
          <v-btn icon @click="closeAlertModal" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="modal-content">
          <div class="message-container">
            <v-icon :icon="alertModalIcon" :color="alertModalIconColor" size="x-large" class="message-icon"></v-icon>
            <div class="message-text">{{ alertModalMessage }}</div>
          </div>
        </div>
        
        <div class="modal-footer">
          <v-btn 
            color="#B084CC" 
            block
            @click="closeAlertModal"
            class="confirm-btn"
          >
            확인
          </v-btn>
        </div>
      </div>
    </v-dialog>

    <!-- 로그인 확인 모달 -->
    <v-dialog v-model="loginConfirmModalOpen" max-width="400" content-class="community-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">로그인 필요</div>
          <v-btn icon @click="closeLoginConfirmModal" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="modal-content">
          <div class="message-container login-container">
            <v-icon icon="mdi-account-alert" color="#B084CC" size="x-large" class="message-icon"></v-icon>
            <div class="message-text">
              <p>로그인이 필요한 기능입니다.</p>
              <p class="login-submessage">로그인 페이지로 이동하시겠습니까?</p>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <div class="button-group">
            <v-btn 
              variant="outlined" 
              class="cancel-btn" 
              @click="closeLoginConfirmModal"
            >
              아니오
            </v-btn>
            <v-btn 
              color="#B084CC" 
              class="login-confirm-btn" 
              @click="goToLogin"
            >
              예, 로그인하기
            </v-btn>
          </div>
        </div>
      </div>
    </v-dialog>

    <!-- 삭제 확인 모달 -->
    <v-dialog v-model="deleteConfirmModalOpen" max-width="400" content-class="community-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">게시글 삭제</div>
          <v-btn icon @click="cancelDeleteConfirm" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="modal-content">
          <div class="message-container warning-container">
            <v-icon icon="mdi-alert" color="#ff9800" size="x-large" class="message-icon"></v-icon>
            <div class="message-text">
              <p>정말 이 게시글을 삭제하시겠습니까?</p>
              <p class="warning-submessage">삭제 후에는 다시 복구할 수 없습니다.</p>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <div class="button-group">
            <v-btn 
              variant="outlined" 
              class="cancel-btn" 
              @click="cancelDeleteConfirm"
            >
              취소
            </v-btn>
            <v-btn 
              color="#ff5252" 
              class="delete-confirm-btn" 
              @click="confirmDelete"
            >
              삭제
            </v-btn>
          </div>
        </div>
      </div>
    </v-dialog>

    <!-- 게시글 수정 모달 -->
    <v-dialog v-model="editModalOpen" max-width="600" content-class="community-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">게시글 수정</div>
          <v-btn icon @click="closeEditModal" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="modal-content">
          <div class="edit-form">
            <textarea 
              v-model="editContent" 
              class="content-textarea" 
              placeholder="게시글 내용을 입력하세요"
              @input="checkEditContentLength"
            ></textarea>
            
            <div class="image-preview-container" v-if="editImages.length > 0">
              <div 
                v-for="(image, index) in editImages" 
                :key="index" 
                class="image-preview"
              >
                <img :src="image.preview || image.url" alt="미리보기" />
                <v-btn icon class="image-delete-btn" @click.stop="removeEditImage(index)">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
            
            <div class="edit-footer">
              <div class="edit-tools">
                <label for="editImageUpload" class="tool-btn">
                  <v-icon>mdi-image</v-icon>
                  <span>사진</span>
                  <input 
                    type="file" 
                    id="editImageUpload" 
                    multiple 
                    accept="image/*" 
                    @change="handleEditImageUpload" 
                    hidden
                  />
                </label>
              </div>
              <div class="content-count" :class="{ 'limit-exceeded': editContent.length > 3000 }">
                {{ editContent.length }}/3000
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <div class="button-group">
            <v-btn 
              variant="outlined" 
              class="cancel-btn" 
              @click="closeEditModal"
            >
              취소
            </v-btn>
            <v-btn 
              color="#B084CC" 
              class="update-btn" 
              :disabled="editContent.trim() === '' || editContent.length > 3000"
              @click="updatePost"
            >
              수정
            </v-btn>
          </div>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

// 데이터 상태
const post = ref(null);
const comments = ref([]);
const loading = ref(true);
const commentsLoading = ref(false);
const defaultProfileImage = ref('https://bestplace-media.s3.ap-northeast-2.amazonaws.com/bestplace-basic-profile-image.png');
const userProfileImage = ref(localStorage.getItem('profileImageUrl') || 'https://bestplace-media.s3.ap-northeast-2.amazonaws.com/bestplace-basic-profile-image.png');
const currentUserId = ref(localStorage.getItem('userId'));
const commentPage = ref(0);
const hasMoreComments = ref(true);
const commentListRef = ref(null);
const commentObserver = ref(null);

// 댓글 작성 상태
const commentContent = ref('');

// 알림 모달 상태
const alertModalOpen = ref(false);
const alertModalMessage = ref('');
const alertModalIcon = ref('mdi-alert-circle');
const alertModalIconColor = ref('#ff5252');

// 로그인 확인 모달 상태
const loginConfirmModalOpen = ref(false);

// 삭제 확인 모달 상태
const deleteConfirmModalOpen = ref(false);
const deleteTargetId = ref(null);
const deleteTargetType = ref('post'); // 'post' 또는 'comment'

// 게시글 ID와 채널 소유자 ID 가져오기
const postId = computed(() => route.params.postId);
const channelOwnerId = ref(route.query.channelOwnerId || null);

// 게시글 수정 모달 상태
const editModalOpen = ref(false);
const editContent = ref('');
const editImages = ref([]);
const originalImageUrls = ref([]);

// 총 댓글 수 계산 (부모 댓글 + 대댓글)
const totalCommentsCount = computed(() => {
  let total = 0;
  comments.value.forEach(comment => {
    // 부모 댓글 카운트
    total++;
    // 대댓글 카운트
    if (comment.replies && comment.replies.length > 0) {
      total += comment.replies.length;
    }
  });
  return total;
});

// 게시글 상세 정보 가져오기
const fetchPostDetail = async () => {
  loading.value = true;
  try {
    const memberApiUrl = process.env.VUE_APP_MEMBER_API;
    
    // API 요청 헤더 설정
    const headers = {};
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.get(
      `${memberApiUrl}/post/${postId.value}`,
      { headers }
    );
    
    if (response.data && response.data.result) {
      post.value = response.data.result;
      // 채널 소유자 ID가 없으면 API 응답에서 가져오기
      if (!channelOwnerId.value && post.value.channelOwnerId) {
        channelOwnerId.value = post.value.channelOwnerId;
      }
    }
  } catch (error) {
    console.error('게시글 로드 실패:', error);
    showAlertModal('게시글을 불러올 수 없습니다.', 'mdi-alert-circle', '#ff5252');
  } finally {
    loading.value = false;
  }
};

// 댓글 목록 가져오기
const fetchComments = async (page = 0, refresh = false) => {
  if (!hasMoreComments.value && !refresh) return;
  
  commentsLoading.value = true;
  try {
    const memberApiUrl = process.env.VUE_APP_MEMBER_API;
    
    // API 요청 헤더 설정
    const headers = {};
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.get(
      `${memberApiUrl}/comment/list/${postId.value}?page=${page}`,
      { headers }
    );
    
    if (response.data && response.data.result) {
      const newComments = response.data.result.content;
      
      // 새 댓글이 없으면 더 이상 불러올 댓글이 없음
      if (newComments.length === 0) {
        hasMoreComments.value = false;
      } else {
        // 부모 댓글과 대댓글 구분
        const parentComments = [];
        const childComments = {};
        
        newComments.forEach(comment => {
          // 추가 속성 설정
          comment.isEditing = false;
          comment.editContent = '';
          comment.showReplyForm = false;
          comment.replyContent = '';
          
          if (comment.parentCommentId) {
            // 대댓글인 경우
            if (!childComments[comment.parentCommentId]) {
              childComments[comment.parentCommentId] = [];
            }
            childComments[comment.parentCommentId].push(comment);
          } else {
            // 부모 댓글인 경우
            comment.replies = [];
            parentComments.push(comment);
          }
        });
        
        // 대댓글을 부모 댓글에 연결
        parentComments.forEach(parent => {
          if (childComments[parent.commentId]) {
            parent.replies = childComments[parent.commentId];
          }
        });
        
        if (refresh) {
          comments.value = parentComments;
        } else {
          // 기존 댓글에 새 댓글 추가
          comments.value = [...comments.value, ...parentComments];
        }
        
        commentPage.value = page;
        
        // 마지막 페이지 확인
        hasMoreComments.value = !response.data.result.last;
      }
    } else {
      hasMoreComments.value = false;
    }
  } catch (error) {
    console.error('댓글 로드 실패:', error);
    hasMoreComments.value = false;
  } finally {
    commentsLoading.value = false;
  }
};

// 댓글 수정 폼 표시
const showEditCommentForm = (comment) => {
  if (comment.authorId !== currentUserId.value) {
    showAlertModal('자신이 작성한 댓글만 수정할 수 있습니다.', 'mdi-alert-circle', '#ff5252');
    return;
  }
  
  comment.isEditing = true;
  comment.editContent = comment.content;
};

// 댓글 수정 취소
const cancelEditComment = (comment) => {
  comment.isEditing = false;
  comment.editContent = '';
};

// 댓글 수정
const updateComment = async (comment) => {
  if (comment.authorId !== currentUserId.value) {
    showAlertModal('자신이 작성한 댓글만 수정할 수 있습니다.', 'mdi-alert-circle', '#ff5252');
    return;
  }
  
  if (comment.editContent.trim() === '') {
    showAlertModal('댓글 내용을 입력해주세요.', 'mdi-comment-alert', '#ff9800');
    return;
  }
  
  if (comment.editContent.length > 500) {
    showAlertModal('댓글은 최대 500자까지 입력 가능합니다.', 'mdi-text', '#ff5252');
    return;
  }
  
  const token = localStorage.getItem('token');
  if (!token) {
    loginConfirmModalOpen.value = true;
    return;
  }
  
  try {
    const memberApiUrl = process.env.VUE_APP_MEMBER_API;
    
    const response = await axios.post(
      `${memberApiUrl}/comment/update`,
      {
        commentId: comment.commentId,
        content: comment.editContent
      },
      { 
        headers: { 
          'Authorization': `Bearer ${token}`
        } 
      }
    );
    
    if (response.status === 200) {
      // 댓글 내용 업데이트
      comment.content = comment.editContent;
      comment.isEditing = false;
      comment.editContent = '';
      
      showAlertModal('댓글이 수정되었습니다.', 'mdi-check-circle', '#4CAF50');
    }
  } catch (error) {
    console.error('댓글 수정 실패:', error);
    
    let errorMessage = '댓글 수정에 실패했습니다.';
    
    if (error.response && error.response.data) {
      if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data.status_message) {
        errorMessage = error.response.data.status_message;
      } else if (error.response.data.result && typeof error.response.data.result === 'string') {
        errorMessage = error.response.data.result;
      }
    }
    
    showAlertModal(errorMessage, 'mdi-alert-circle', '#ff5252');
  }
};

// 답글 폼 표시
const showReplyForm = (comment) => {
  // 모든 답글 폼 닫기
  comments.value.forEach(c => {
    c.showReplyForm = false;
  });
  
  // 선택한 댓글의 답글 폼만 열기
  comment.showReplyForm = true;
  comment.replyContent = '';
};

// 답글 폼 닫기
const hideReplyForm = (comment) => {
  comment.showReplyForm = false;
  comment.replyContent = '';
  if (comment.parentCommentForReply) {
    comment.parentCommentForReply = null;
  }
};

// 답글 작성
const submitReply = async (comment) => {
  if (comment.replyContent.trim() === '') {
    showAlertModal('답글 내용을 입력해주세요.', 'mdi-comment-alert', '#ff9800');
    return;
  }
  
  if (comment.replyContent.length > 500) {
    showAlertModal('답글은 최대 500자까지 입력 가능합니다.', 'mdi-text', '#ff5252');
    return;
  }
  
  const token = localStorage.getItem('token');
  if (!token) {
    loginConfirmModalOpen.value = true;
    return;
  }
  
  try {
    const memberApiUrl = process.env.VUE_APP_MEMBER_API;
    
    // 대댓글에서 답글 달 때 원본 댓글 ID 사용
    let targetCommentId = comment.commentId;
    if (comment.parentCommentForReply) {
      targetCommentId = comment.parentCommentForReply;
    }
    
    const response = await axios.post(
      `${memberApiUrl}/comment/reply`,
      {
        commentId: targetCommentId,
        content: comment.replyContent
      },
      { 
        headers: { 
          'Authorization': `Bearer ${token}`
        } 
      }
    );
    
    if (response.status === 200) {
      // 페이지 0부터 다시 불러와서 최신 댓글 목록 갱신
      await fetchComments(0, true);
      
      // 답글 폼 닫기
      comment.showReplyForm = false;
      comment.replyContent = '';
      if (comment.parentCommentForReply) {
        comment.parentCommentForReply = null;
      }
    }
  } catch (error) {
    console.error('답글 등록 실패:', error);
    
    let errorMessage = '답글 등록에 실패했습니다.';
    
    if (error.response && error.response.data) {
      if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data.status_message) {
        errorMessage = error.response.data.status_message;
      } else if (error.response.data.result && typeof error.response.data.result === 'string') {
        errorMessage = error.response.data.result;
      }
    }
    
    showAlertModal(errorMessage, 'mdi-alert-circle', '#ff5252');
  }
};

// 댓글 작성
const submitComment = async () => {
  if (commentContent.value.trim() === '') {
    showAlertModal('댓글 내용을 입력해주세요.', 'mdi-comment-alert', '#ff9800');
    return;
  }
  
  if (commentContent.value.length > 500) {
    showAlertModal('댓글은 최대 500자까지 입력 가능합니다.', 'mdi-text', '#ff5252');
    return;
  }
  
  const token = localStorage.getItem('token');
  if (!token) {
    loginConfirmModalOpen.value = true;
    return;
  }
  
  try {
    const memberApiUrl = process.env.VUE_APP_MEMBER_API;
    
    const response = await axios.post(
      `${memberApiUrl}/comment/create`,
      {
        postId: postId.value,
        content: commentContent.value
      },
      { 
        headers: { 
          'Authorization': `Bearer ${token}`
        } 
      }
    );
    
    if (response.status === 200) {
      // 페이지 0부터 다시 불러와서 최신 댓글 목록 갱신
      await fetchComments(0, true);
      commentContent.value = '';
    }
  } catch (error) {
    console.error('댓글 등록 실패:', error);
    
    // 서버에서 반환된 에러 메시지 추출
    let errorMessage = '댓글 등록에 실패했습니다.';
    
    if (error.response && error.response.data) {
      if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data.status_message) {
        errorMessage = error.response.data.status_message;
      } else if (error.response.data.result && typeof error.response.data.result === 'string') {
        errorMessage = error.response.data.result;
      }
    }
    
    showAlertModal(errorMessage, 'mdi-alert-circle', '#ff5252');
  }
};

// 댓글 글자 수 체크
const checkCommentLength = () => {
  if (commentContent.value.length > 500) {
    showAlertModal('최대 500자까지 입력 가능합니다.', 'mdi-alert', '#ff9800');
  }
};

// 답글 글자 수 체크
const checkReplyLength = (comment) => {
  if (comment.replyContent.length > 500) {
    showAlertModal('최대 500자까지 입력 가능합니다.', 'mdi-alert', '#ff9800');
  }
};

// 댓글 수정 글자 수 체크
const checkEditCommentLength = (comment) => {
  if (comment.editContent.length > 500) {
    showAlertModal('최대 500자까지 입력 가능합니다.', 'mdi-alert', '#ff9800');
  }
};

// 댓글 삭제
const deleteComment = (commentId) => {
  // 댓글 찾기
  let targetComment = null;
  
  // 원댓글 검색
  for (const comment of comments.value) {
    if (comment.commentId === commentId) {
      targetComment = comment;
      break;
    }
    
    // 대댓글 검색
    if (comment.replies) {
      for (const reply of comment.replies) {
        if (reply.commentId === commentId) {
          targetComment = reply;
          break;
        }
      }
      if (targetComment) break;
    }
  }
  
  // 권한 체크
  if (targetComment && targetComment.authorId !== currentUserId.value && targetComment.isOwner !== 'Y') {
    showAlertModal('삭제 권한이 없습니다.', 'mdi-alert-circle', '#ff5252');
    return;
  }
  
  deleteTargetId.value = commentId;
  deleteTargetType.value = 'comment';
  deleteConfirmModalOpen.value = true;
};

// 댓글 좋아요 토글
const toggleCommentLike = async (comment) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      loginConfirmModalOpen.value = true;
      return;
    }
    
    const memberApiUrl = process.env.VUE_APP_MEMBER_API;
    const response = await axios.post(
      `${memberApiUrl}/comment/toggle/${comment.commentId}`,
      null,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (response.status === 200) {
      // 좋아요 상태 업데이트
      comment.isLike = comment.isLike === 'Y' ? 'N' : 'Y';
      
      // 좋아요 개수 업데이트
      if (comment.isLike === 'Y') {
        comment.likeCount = (comment.likeCount || 0) + 1;
      } else {
        comment.likeCount = Math.max(0, (comment.likeCount || 0) - 1);
      }
    }
  } catch (error) {
    console.error('좋아요 토글 실패:', error);
    showAlertModal('좋아요 처리 중 오류가 발생했습니다.', 'mdi-alert-circle', '#ff5252');
  }
};

// 무한 스크롤 설정
const setupInfiniteScroll = () => {
  // Intersection Observer 설정
  commentObserver.value = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !commentsLoading.value && hasMoreComments.value) {
      // 다음 페이지 로드
      fetchComments(commentPage.value + 1);
    }
  }, { threshold: 0.5 });
  
  // 로딩 요소 관찰 시작
  nextTick(() => {
    const loadingElement = document.querySelector('.comments-loading');
    if (loadingElement && commentObserver.value) {
      commentObserver.value.observe(loadingElement);
    }
  });
};

// 삭제 확인
const confirmDelete = async () => {
  if (!deleteTargetId.value) return;
  
  try {
    const token = localStorage.getItem('token');
    const memberApiUrl = process.env.VUE_APP_MEMBER_API;
    
    if (deleteTargetType.value === 'post') {
      await axios.post(
        `${memberApiUrl}/post/delete/${deleteTargetId.value}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // 삭제 후 목록으로 이동
      goBack();
    } else if (deleteTargetType.value === 'comment') {
      await axios.post(
        `${memberApiUrl}/comment/delete/${deleteTargetId.value}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // 페이지 0부터 다시 불러와서 최신 댓글 목록 갱신
      await fetchComments(0, true);
    }
    
    deleteConfirmModalOpen.value = false;
    deleteTargetId.value = null;
  } catch (error) {
    console.error('삭제 실패:', error);
    showAlertModal('삭제 중 오류가 발생했습니다.', 'mdi-alert-circle', '#ff5252');
  }
};

// 목록으로 돌아가기
const goBack = () => {
  const memberId = route.params.memberId;
  router.push(`/channel/${memberId}/community`);
};

// 상대적 시간 포맷팅
const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return '방금 전';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}일 전`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}년 전`;
};

// 알림 모달 표시
const showAlertModal = (message, icon = 'mdi-alert-circle', color = '#ff5252') => {
  alertModalMessage.value = message;
  alertModalIcon.value = icon;
  alertModalIconColor.value = color;
  alertModalOpen.value = true;
};

// 알림 모달 닫기
const closeAlertModal = () => {
  alertModalOpen.value = false;
};

// 로그인 확인 모달 닫기
const closeLoginConfirmModal = () => {
  loginConfirmModalOpen.value = false;
};

// 로그인 페이지로 이동
const goToLogin = () => {
  router.push('/member/login');
};

// 게시글 수정 모달 표시
const editPost = (postId) => {
  editModalOpen.value = true;
  editContent.value = post.value.postContent || '';
  editImages.value = [];
  
  // 기존 이미지가 있다면 미리보기로 불러오기
  if (post.value.imageUrlList && post.value.imageUrlList.length > 0) {
    originalImageUrls.value = [...post.value.imageUrlList];
    post.value.imageUrlList.forEach(url => {
      editImages.value.push({
        url: url,
        isExisting: true
      });
    });
  }
};

// 수정 모달 닫기
const closeEditModal = () => {
  editModalOpen.value = false;
  editContent.value = '';
  editImages.value = [];
  originalImageUrls.value = [];
};

// 이미지 업로드 처리
const handleEditImageUpload = (event) => {
  const files = event.target.files;
  if (!files.length) return;
  
  // 최대 5개 이미지 제한
  if (editImages.value.length + files.length > 5) {
    showAlertModal('이미지는 최대 5개까지 첨부할 수 있습니다.', 'mdi-image-multiple', '#ff9800');
    return;
  }
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // 파일 타입 검사
    if (!file.type.startsWith('image/')) {
      showAlertModal('이미지 파일만 업로드 가능합니다.', 'mdi-file-image', '#ff5252');
      continue;
    }
    
    // 파일 크기 검사 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      showAlertModal('이미지 크기는 5MB 이하만 가능합니다.', 'mdi-image', '#ff5252');
      continue;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      editImages.value.push({
        file: file,
        preview: e.target.result,
        isNew: true
      });
    };
    reader.readAsDataURL(file);
  }
  
  // 파일 입력 초기화
  event.target.value = '';
};

// 이미지 제거
const removeEditImage = (index) => {
  editImages.value.splice(index, 1);
};

// 글자 수 체크
const checkEditContentLength = () => {
  if (editContent.value.length > 3000) {
    showAlertModal('최대 3000자까지 입력 가능합니다.', 'mdi-alert', '#ff9800');
  }
};

// 게시글 업데이트
const updatePost = async () => {
  if (editContent.value.trim() === '') {
    showAlertModal('내용을 입력해주세요.', 'mdi-comment-alert', '#ff9800');
    return;
  }
  
  if (editContent.value.length > 3000) {
    showAlertModal('최대 3000자까지 입력 가능합니다.', 'mdi-text', '#ff5252');
    return;
  }
  
  const token = localStorage.getItem('token');
  if (!token) {
    loginConfirmModalOpen.value = true;
    return;
  }
  
  loading.value = true;
  
  try {
    const memberId = route.params.memberId;
    const memberApiUrl = process.env.VUE_APP_MEMBER_API;
    
    const formData = new FormData();
    formData.append('postId', post.value.postId);
    formData.append('channelOwnerId', memberId);
    
    // 내용이 변경되었는지 확인
    if (editContent.value !== post.value.postContent) {
      formData.append('content', editContent.value);
    }
    
    // 이미지 변경 확인
    const hasImageChanges = hasImageModifications();
    
    // 이미지 변경이 있을 때만 이미지 추가
    const remainingUrls = editImages.value
      .filter(img => !img.isNew)
      .map(img => img.url);

    remainingUrls.forEach(url => {
      formData.append('remainImageUrls', url);  // key 이름은 백엔드 DTO와 맞춰야 해
    });

    // 새 이미지 추가
    const newImages = editImages.value.filter(img => img.isNew);
    newImages.forEach(img => {
      if (img.file) {
        formData.append('imgaeList', img.file);
      }
    });
    
    await axios.post(
      `${memberApiUrl}/post/update`,
      formData,
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        } 
      }
    );
    
    // 성공 메시지
    showAlertModal('게시글이 수정되었습니다.', 'mdi-check-circle', '#4CAF50');
    
    // 모달 닫기
    closeEditModal();
    
    // 게시글 정보 다시 로드
    await fetchPostDetail();
    
  } catch (error) {
    console.error('게시글 수정 실패:', error);
    
    // 서버에서 반환된 에러 메시지 추출
    let errorMessage = '게시글 수정에 실패했습니다.';
    
    if (error.response && error.response.data) {
      if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data.status_message) {
        errorMessage = error.response.data.status_message;
      } else if (error.response.data.result && typeof error.response.data.result === 'string') {
        errorMessage = error.response.data.result;
      }
    }
    
    showAlertModal(errorMessage, 'mdi-alert-circle', '#ff5252');
  } finally {
    loading.value = false;
  }
};

// 이미지가 변경되었는지 확인
const hasImageModifications = () => {
  // 이미지 수가 변경됨
  if (editImages.value.length !== originalImageUrls.value.length) {
    return true;
  }
  
  // 새로운 이미지가 추가됨
  const hasNewImages = editImages.value.some(img => img.isNew);
  if (hasNewImages) {
    return true;
  }
  
  // 이미지 순서나 내용이 변경됨
  const currentUrls = editImages.value
    .filter(img => !img.isNew)
    .map(img => img.url);
  
  for (let i = 0; i < currentUrls.length; i++) {
    if (currentUrls[i] !== originalImageUrls.value[i]) {
      return true;
    }
  }
  
  return false;
};

// 포스트 좋아요 토글 함수 수정
const toggleLike = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      loginConfirmModalOpen.value = true;
      return;
    }
    
    const memberApiUrl = process.env.VUE_APP_MEMBER_API;
    const response = await axios.post(
      `${memberApiUrl}/post/toggle/${postId.value}`,
      null,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (response.status === 200) {
      // 좋아요 상태 업데이트
      post.value.isLiked = post.value.isLiked === 'Y' ? 'N' : 'Y';
      
      // 좋아요 개수 업데이트
      if (post.value.isLiked === 'Y') {
        post.value.likesCount++;
      } else {
        post.value.likesCount = Math.max(0, post.value.likesCount - 1);
      }
    }
  } catch (error) {
    console.error('좋아요 토글 실패:', error);
    showAlertModal('좋아요 처리 중 오류가 발생했습니다.', 'mdi-alert-circle', '#ff5252');
  }
};

// showReplyFormFromReply 함수 수정
const showReplyFormFromReply = (reply) => {
  // 모든 댓글의 답글 폼 닫기
  comments.value.forEach(c => {
    c.showReplyForm = false;
    // 대댓글도 답글 폼 닫기 (미래에 확장 가능성 대비)
    if (c.replies) {
      c.replies.forEach(r => {
        if (r.showReplyForm) r.showReplyForm = false;
      });
    }
  });
  
  // 대댓글이 속한 원본 댓글 찾기
  const parentComment = comments.value.find(c => 
    c.replies && c.replies.some(r => r.commentId === reply.commentId)
  );
  
  if (parentComment) {
    // 현재 대댓글 아래에 표시하기 위해 대댓글에 replyContent 할당
    reply.showReplyForm = true;
    reply.replyContent = '';

    // 추가 속성: 원본 댓글 ID 저장 (실제 답글은 원본 댓글에 달리도록)
    reply.parentCommentForReply = parentComment.commentId;
  }
};

// 컴포넌트 마운트 시 실행
onMounted(() => {
  fetchPostDetail();
  fetchComments().then(() => {
    setupInfiniteScroll();
  });
});

// 컴포넌트 언마운트 시 실행
onUnmounted(() => {
  // Observer 정리
  if (commentObserver.value) {
    commentObserver.value.disconnect();
  }
});
</script>

<style scoped>
.community-detail {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 40px;
}

.loading-container, .empty-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
  gap: 16px;
  color: #adb5bd;
}

.post-container {
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 0;
  overflow: hidden;
}

.post-detail {
  padding: 20px;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-text {
  display: flex;
  flex-direction: column;
}

.profile-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-image.small {
  width: 32px;
  height: 32px;
}

.author-name {
  font-weight: 500 !important;
  font-size: 14px !important;
}

.post-time {
  color: #7B7B7B;
  font-size: 14px;
}

.post-content {
  margin-bottom: 20px;
}

.content-text {
  font-size: 16px;
  line-height: 1.6;
  white-space: pre-line;
  word-break: break-word;
}

.post-images {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
  max-height: none;
  overflow-y: visible;
  padding-right: 0;
}

.image-item {
  width: 100%;
  border-radius: 8px;
  overflow: visible;
}

.post-image {
  width: auto;
  max-width: 100%;
  max-height: none;
  object-fit: unset;
  background-color: #141414;
}

.post-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-top: 16px;
}

.post-buff {
  padding: 4px 8px;
  border-radius: 4px;
}

.comment-item {
  display: flex;
  flex-direction: column;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.comment-actions, .reply-actions {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 4px;
}

.buff-button {
  padding: 2px 10px;
  border-radius: 4px;
  background: #2D2D2D;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 13px;
}

.comment-buff {
  font-size: 13px;
}

.buff-button.liked {
  background: #B084CC;
  color: #fff;
}

.reply-button {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #999;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s;
}

.reply-button:hover {
  color: #B084CC;
}

.replies-list {
  margin-left: 52px;
  margin-top: 8px;
}

.comment-user-info, .reply-user-info {
  display: flex;
  align-items: center !important;
  gap: 12px;
  margin-bottom: 0;
}

.comment-author-info, .reply-author-info {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center !important;
}

.author-name-time {
  margin-bottom: 0 !important;
}

.comment-time {
  color: #7B7B7B;
  font-size: 13px;
  margin-left: 4px;
}

.comment-author {
  font-weight: 700 !important;
  font-size: 14px !important;
  color: #B084CC !important;
}

.comment-text, .reply-text {
  font-size: 14px !important;
  font-weight: 400 !important;
  line-height: 1.4 !important;
  white-space: pre-line;
  word-break: break-word;
  margin: 0 !important;
  padding-top: 4px !important;
  color: #E8E8E8 !important;
}

.comment-body {
  margin-left: 52px;
  margin-top: -6px !important;
  padding-right: 8px;
}

/* 댓글 섹션 */
.comments-section {
  background-color: #1e1e1e;
  padding: 0 20px 20px;
  border-top: 1px solid #2a2a2a;
}

.comments-header {
  margin: 24px 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 12px;
}

.comments-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.comment-input-container {
  display: flex;
  gap: 12px;
  margin: 24px 0 16px;
  align-items: flex-start;
  padding-top: 0;
}

.comment-input-wrapper {
  flex: 1;
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
  background-color: #141414;
}

.comment-input {
  width: 100%;
  min-height: 40px;
  background: transparent;
  border: none;
  resize: none;
  color: white;
  font-size: 14px;
  line-height: 1.5;
  padding: 12px;
  outline: none;
}

.comment-input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #141414;
  border-top: 1px solid #333;
}

.content-count {
  font-size: 14px;
  color: #aaa;
}

.limit-exceeded {
  color: #FF4343;
}

.submit-btn, .submit-reply-btn {
  height: 32px;
  font-size: 14px;
  text-transform: none;
  border-radius: 4px;
  background-color: #B084CC !important;
  color: #ffffff !important;
  font-weight: 500 !important;
}

.comments-list {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.comments-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  color: #aaa;
}

.deleted-comment {
  color: #666;
  font-size: 13px;
  padding: 8px 0;
  font-style: italic;
}

/* 모달 스타일 */
.community-modal {
  background: transparent !important;
  box-shadow: none !important;
  display: flex;
  align-items: flex-start !important;
  padding-top: 50px;
  padding-bottom: 50px;
}

.modal-container {
  background-color: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  color: white;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #333;
}

.modal-title {
  font-size: 18px;
  font-weight: 500;
  color: white;
}

.close-btn {
  color: #aaa;
}

.modal-content {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.message-container {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: rgba(255, 82, 82, 0.1);
  border-radius: 8px;
}

.warning-container {
  background-color: rgba(255, 152, 0, 0.1);
}

.message-icon {
  margin-right: 16px;
}

.message-text {
  font-size: 16px;
  line-height: 1.5;
  color: #fff;
}

.warning-submessage {
  font-size: 14px;
  color: #aaa;
  margin-top: 8px;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid #333;
}

.confirm-btn {
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

.button-group {
  display: flex;
  width: 100%;
  gap: 10px;
}

.cancel-btn {
  flex: 1;
  border-color: #555 !important;
  color: white !important;
}

.delete-confirm-btn {
  flex: 2;
}

.login-container {
  background-color: rgba(176, 132, 204, 0.1) !important;
}

.login-submessage {
  font-size: 14px;
  color: #aaa;
  margin-top: 8px;
}

.login-confirm-btn {
  flex: 2;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  width: 100%;
}

.delete-item {
  color: #FF4343;
}

.menu-btn {
  padding: 0;
}

.options-list {
  padding: 0;
  min-width: auto;
  width: auto;
}

.option-item {
  min-height: 24px;
  padding: 0 !important;
}

.v-list-item__content {
  padding: 0;
}

.v-list-item__title {
  padding: 0;
}

.v-list {
  background-color: #1A1A1A !important;
}

.menu-text {
  font-size: 12px;
}

.edit-item {
  color: #2196F3;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.content-textarea {
  width: 100%;
  min-height: 150px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  resize: none;
  color: white;
  font-size: 16px;
  line-height: 1.5;
  padding: 12px;
  outline: none;
}

.edit-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.update-btn {
  flex: 2;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #aaa;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.2s;
}

.tool-btn:hover {
  color: #B084CC;
}

.image-preview-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-height: none;
  overflow-y: visible;
  padding-right: 0;
}

.image-preview {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: visible;
}

.image-preview img {
  width: auto;
  max-width: 100%;
  max-height: none;
  object-fit: unset;
  background-color: #141414;
}

.image-delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.5) !important;
  border-radius: 50%;
  width: 24px !important;
  height: 24px !important;
  color: white;
}

.reply-form {
  margin-left: 52px;
  margin-top: 12px;
}

.reply-to-reply-form {
  margin-left: 0;
  margin-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 10px;
}

.reply-input-container {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.reply-input-wrapper {
  flex: 1;
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
  background-color: #141414;
}

.reply-input {
  width: 100%;
  min-height: 40px;
  background: transparent;
  border: none;
  resize: none;
  color: white;
  font-size: 14px;
  line-height: 1.5;
  padding: 12px;
  outline: none;
}

.reply-input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #141414;
  border-top: 1px solid #333;
}

.cancel-reply-btn {
  color: #aaa !important;
}

.reply-item {
  padding: 6px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 0;
}

.reply-user-info {
  align-items: center !important;
}

.reply-body {
  margin-left: 44px;
  margin-top: -6px !important;
  padding-right: 8px;
}

.comment-body {
  margin-left: 52px;
  margin-top: -6px !important;
  padding-right: 8px;
}

.comment-edit-form, .reply-edit-form {
  background-color: #242424;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid #333;
  overflow: hidden;
}

.comment-edit-input, .reply-edit-input {
  width: 100%;
  min-height: 80px;
  background: transparent;
  border: none;
  resize: none;
  color: white;
  font-size: 14px;
  line-height: 1.5;
  padding: 12px;
  outline: none;
}

.comment-edit-footer, .reply-edit-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #1e1e1e;
  border-top: 1px solid #333;
}

.save-edit-btn {
  background-color: #B084CC !important;
  color: white !important;
  font-weight: 500;
  text-transform: none;
  border-radius: 4px;
  height: 32px;
}

.cancel-edit-btn {
  color: #aaa !important;
  text-transform: none;
}
</style> 