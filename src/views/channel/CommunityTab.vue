<template>
  <div class="community-tab">
    <div v-if="isChannelManager">
      <div class="write-section">
        <div class="post-input-container" v-if="!showWriteForm" @click="toggleWriteForm">
          <div class="post-input">어떤 이야기를 남길건가요?</div>
        </div>

        <div class="write-form" v-if="showWriteForm">
          <div class="write-form-header">
            <div class="write-title">글쓰기</div>
            <div class="write-actions">
              <v-btn 
                color="#B084CC" 
                class="submit-btn" 
                :disabled="postContent.trim() === '' || postContent.length > 3000"
                @click="submitPost"
              >
                등록
              </v-btn>
              <v-btn icon @click="toggleWriteForm" class="close-btn">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </div>
          </div>
          
          <div class="write-content">
            <textarea 
              v-model="postContent" 
              class="content-textarea" 
              placeholder="어떤 이야기를 남길건가요?"
              @input="checkContentLength"
            ></textarea>
            
            <div class="image-preview-container" v-if="selectedImages.length > 0">
              <div 
                v-for="(image, index) in selectedImages" 
                :key="index" 
                class="image-preview"
              >
                <img :src="image.preview || image.url" alt="미리보기" />
                <v-btn icon class="image-delete-btn" @click.stop="removeImage(index)">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
          
          <div class="write-footer">
            <div class="write-tools">
              <label for="imageUpload" class="tool-btn">
                <v-icon>mdi-image</v-icon>
                <span>사진</span>
                <input 
                  type="file" 
                  id="imageUpload" 
                  multiple 
                  accept="image/*" 
                  @change="handleImageUpload" 
                  hidden
                />
              </label>
            </div>
            <div class="content-count" :class="{ 'limit-exceeded': postContent.length > 3000 }">
              {{ postContent.length }}/3000
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
      <p>게시글을 불러오는 중...</p>
    </div>
    
    <div v-else-if="posts.length > 0" class="posts-container">
      <div class="post-card" v-for="post in posts" :key="post.postId" @click="goToPostDetail(post.postId)">
        <div class="post-header">
          <div class="user-info">
            <img :src="post.authorProfileImage || defaultProfileImage" alt="프로필 이미지" class="profile-image">
            <span class="author-name">{{ post.authorNickname }}</span>
            <span class="post-time">{{ formatRelativeTime(post.createdTime) }}</span>
          </div>
          <div class="post-options" v-if="post.isOwner === 'Y'" @click.stop>
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn icon size="small" v-bind="props" class="menu-btn">
                  <v-icon size="small">mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list density="compact" class="options-list">
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
        
        <div class="post-content-container">
          <div class="post-content" :class="{ 'truncated': isTruncated(post.postContent) }">
            {{ truncateContent(post.postContent) }}
            <span v-if="isTruncated(post.postContent)" class="more-btn" @click.stop="goToPostDetail(post.postId)">...더보기</span>
          </div>
          
          <div class="post-thumbnail" v-if="post.thumbnailUrl" @click.stop="goToPostDetail(post.postId)">
            <img :src="post.thumbnailUrl" alt="썸네일" class="thumbnail-image">
            <div class="image-count" v-if="post.imageCount > 1">+{{ post.imageCount - 1 }}</div>
          </div>
        </div>
        
        <div class="post-actions">
          <div class="comment-count">
            댓글 {{ post.commentCount || 0 }}
          </div>
          <div class="buff-button" :class="{ 'liked': post.isLiked === 'Y' }" @click.stop="toggleLike(post)">
            버프 {{ post.likeCount || 0 }}
          </div>
        </div>
      </div>
      
      <div class="pagination-container">
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="5"
          @update:model-value="fetchPosts"
        ></v-pagination>
      </div>
    </div>
    
    <div v-else class="empty-container">
      <p>아직 게시글이 없습니다.</p>
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const props = defineProps({
  isChannelManager: {
    type: Boolean,
    default: false
  }
});

const route = useRoute();
const router = useRouter();

// 데이터 상태
const posts = ref([]);
const loading = ref(true);
const currentPage = ref(1);
const totalPages = ref(0);
const totalElements = ref(0);
const defaultProfileImage = ref('/path/to/default-profile.png');
const userProfileImage = ref(localStorage.getItem('profileImageUrl') || 'https://bestplace-media.s3.ap-northeast-2.amazonaws.com/bestplace-basic-profile-image.png');

// 글쓰기 상태
const showWriteForm = ref(false);
const postContent = ref('');
const selectedImages = ref([]);

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

// 채널 ID 가져오기
const channelOwnerId = computed(() => route.params.memberId);

// 글쓰기 폼 토글
const toggleWriteForm = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    loginConfirmModalOpen.value = true;
    return;
  }
  showWriteForm.value = !showWriteForm.value;
  if (!showWriteForm.value) {
    // 폼 닫을 때 상태 초기화
    postContent.value = '';
    selectedImages.value = [];
  }
};

// 페이지 불러오기
const fetchPosts = async (page = currentPage.value) => {
  loading.value = true;
  try {
    const memberApiUrl = process.env.VUE_APP_MEMBER_API;
    const backendPage = page - 1; // 백엔드는 0부터 시작
    
    // API 요청 헤더 설정
    const headers = {};
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.get(
      `${memberApiUrl}/post/list/${channelOwnerId.value}?page=${backendPage}`,
      { headers }
    );
    
    if (response.data && response.data.result) {
      posts.value = response.data.result.content;
      totalPages.value = response.data.result.totalPages;
      totalElements.value = response.data.result.totalElements;
    }
  } catch (error) {
    console.error('게시글 로드 실패:', error);
  } finally {
    loading.value = false;
  }
};

// 글자 수 체크
const checkContentLength = () => {
  if (postContent.value.length > 3000) {
    showAlertModal('최대 3000자까지 입력 가능합니다.', 'mdi-alert', '#ff9800');
  }
};

// 이미지 업로드 처리
const handleImageUpload = (event) => {
  const files = event.target.files;
  if (!files.length) return;
  
  // 최대 5개 이미지 제한
  if (selectedImages.value.length + files.length > 5) {
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
      selectedImages.value.push({
        file: file,
        preview: e.target.result
      });
    };
    reader.readAsDataURL(file);
  }
  
  // 파일 입력 초기화
  event.target.value = '';
};

// 이미지 제거
const removeImage = (index) => {
  selectedImages.value.splice(index, 1);
};

// 게시글 등록
const submitPost = async () => {
  if (postContent.value.trim() === '') {
    showAlertModal('내용을 입력해주세요.', 'mdi-comment-alert', '#ff9800');
    return;
  }
  
  if (postContent.value.length > 3000) {
    showAlertModal('최대 3000자까지 입력 가능합니다.', 'mdi-text', '#ff5252');
    return;
  }
  
  loading.value = true;
  
  try {
    const token = localStorage.getItem('token');
    const memberApiUrl = process.env.VUE_APP_MEMBER_API;
    
    const formData = new FormData();
    formData.append('content', postContent.value);
    formData.append('channelOwnerId', channelOwnerId.value);
    
    // 이미지 파일 추가
    selectedImages.value.forEach((img) => {
      if (img.file) {
        formData.append('imgaeList', img.file);
      }
    });
    
    // 수정 또는 생성 API 호출
    const apiEndpoint = `${memberApiUrl}/post/create`;
    
    await axios.post(
      apiEndpoint, 
      formData,
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        } 
      }
    );
    
    // 등록 성공 후 목록 갱신
    fetchPosts(1);
    showWriteForm.value = false;
    
    // 상태 초기화
    postContent.value = '';
    selectedImages.value = [];
    
  } catch (error) {
    console.error('게시글 처리 실패:', error);
    
    // 서버에서 반환된 에러 메시지 추출
    let errorMessage = '게시글 등록에 실패했습니다.';
    
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

// 좋아요 토글
const toggleLike = async (post) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      loginConfirmModalOpen.value = true;
      return;
    }
    
    const memberApiUrl = process.env.VUE_APP_MEMBER_API;
    const response = await axios.post(
      `${memberApiUrl}/post/toggle/${post.postId}`,
      null,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (response.status === 200) {
      // 좋아요 상태 업데이트
      post.isLiked = post.isLiked === 'Y' ? 'N' : 'Y';
      
      // 좋아요 개수 업데이트
      if (post.isLiked === 'Y') {
        post.likeCount++;
      } else {
        post.likeCount = Math.max(0, post.likeCount - 1);
      }
    }
  } catch (error) {
    console.error('좋아요 토글 실패:', error);
    showAlertModal('좋아요 처리 중 오류가 발생했습니다.', 'mdi-alert-circle', '#ff5252');
  }
};

// 게시글 삭제 모달 표시
const deletePost = (postId) => {
  deleteTargetId.value = postId;
  deleteConfirmModalOpen.value = true;
};

// 삭제 취소
const cancelDeleteConfirm = () => {
  deleteConfirmModalOpen.value = false;
  deleteTargetId.value = null;
};

// 삭제 확인
const confirmDelete = async () => {
  if (!deleteTargetId.value) return;
  
  try {
    const token = localStorage.getItem('token');
    const memberApiUrl = process.env.VUE_APP_MEMBER_API;
    
    await axios.post(`${memberApiUrl}/post/delete/${deleteTargetId.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // 삭제 후 목록 다시 로드
    fetchPosts();
    deleteConfirmModalOpen.value = false;
    deleteTargetId.value = null;
  } catch (error) {
    console.error('게시글 삭제 실패:', error);
    showAlertModal('게시글 삭제 중 오류가 발생했습니다.', 'mdi-alert-circle', '#ff5252');
  }
};

// 게시글 수정
const editPost = async (postId) => {
  try {
    isEditMode.value = true;
    editPostId.value = postId;
    showWriteForm.value = true;
    loading.value = true;
    
    const token = localStorage.getItem('token');
    const memberApiUrl = process.env.VUE_APP_MEMBER_API;
    
    // 게시글 상세 정보 불러오기
    const response = await axios.get(
      `${memberApiUrl}/post/${postId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (response.data && response.data.result) {
      const postDetail = response.data.result;
      postContent.value = postDetail.content || '';
      
      // 기존 이미지가 있다면 미리보기로 불러오기
      selectedImages.value = [];
      if (postDetail.imageList && postDetail.imageList.length > 0) {
        postDetail.imageList.forEach(img => {
          selectedImages.value.push({
            url: img,
            isExisting: true
          });
        });
      }
    }
  } catch (error) {
    console.error('게시글 정보 불러오기 실패:', error);
    showAlertModal('게시글 정보를 불러올 수 없습니다.', 'mdi-alert-circle', '#ff5252');
  } finally {
    loading.value = false;
  }
};

// 게시글 상세 페이지로 이동
const goToPostDetail = (postId) => {
  router.push(`/channel/${channelOwnerId.value}/community/detail/${postId}`);
};

// 내용 길이 제한 (7줄 이상이면 잘라내기)
const isTruncated = (content) => {
  if (!content) return false;
  return content.split('\n').length > 7 || content.length > 200;
};

const truncateContent = (content) => {
  if (!content) return '';
  if (!isTruncated(content)) return content;
  
  const lines = content.split('\n');
  if (lines.length > 7) {
    return lines.slice(0, 7).join('\n');
  }
  
  return content.substring(0, 200);
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

// 컴포넌트 마운트 시 실행
onMounted(() => {
  fetchPosts();
});
</script>

<style scoped>
.community-tab {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.write-section {
  margin-bottom: 20px;
}

.post-input-container {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background-color: #1e1e1e;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid #333;
  transition: background-color 0.2s;
}

.post-input-container:hover {
  background-color: #2a2a2a;
}

.post-input {
  font-size: 15px;
  font-weight: 400;
  color: #aaa;
  width: 100%;
}

.write-form {
  background-color: #1e1e1e;
  border-radius: 8px;
  border: 1px solid #333;
  overflow: hidden;
  margin-bottom: 20px;
}

.write-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #333;
  background-color: #1a1a1a;
}

.write-title {
  font-size: 16px;
  font-weight: 500;
}

.write-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.submit-btn {
  font-size: 14px;
  font-weight: 500;
  text-transform: none;
}

.write-content {
  padding: 16px;
}

.content-textarea {
  width: 100%;
  min-height: 120px;
  background: transparent;
  border: none;
  resize: none;
  color: white;
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 16px;
  outline: none;
}

.write-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid #333;
  background-color: #1a1a1a;
}

.write-tools {
  display: flex;
  gap: 16px;
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

.content-count {
  font-size: 14px;
  color: #aaa;
}

.limit-exceeded {
  color: #FF4343;
}

.image-preview-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
  width: 100%;
}

.image-preview {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  max-height: 500px;
  object-fit: contain;
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

.loading-container, .empty-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
  gap: 16px;
  color: #adb5bd;
}

.posts-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px 0;
}

.post-card {
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.post-card:hover {
  background-color: #2a2a2a;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-weight: 500;
  font-size: 15px;
}

.post-time {
  color: #7B7B7B;
  font-size: 14px;
}

.post-content-container {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.post-content {
  flex: 1;
  font-size: 15px;
  line-height: 1.5;
  white-space: pre-line;
  word-break: break-word;
}

.truncated {
  position: relative;
}

.more-btn {
  color: #B084CC; /* 보라색 포인트 컬러 */
  cursor: pointer;
  font-weight: 500;
}

.post-thumbnail {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-count {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
}

.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #2d2d2d;
  padding-top: 12px;
}

.comment-count {
  color: #B084CC;
  font-size: 14px;
}

.buff-button {
  padding: 4px 8px;
  border-radius: 4px;
  background: #2D2D2D;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.buff-button.liked {
  background: #B084CC;
  color: #000;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
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

/* 모달 스타일 */
.community-modal {
  background: transparent !important;
  box-shadow: none !important;
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
</style>
  