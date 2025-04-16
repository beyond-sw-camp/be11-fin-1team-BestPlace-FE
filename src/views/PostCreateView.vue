<template>
  <div class="post-create-page">
    <div class="page-header">
      <h1>글쓰기</h1>

      <div class="header-actions">
        <v-btn
            color="primary"
            class="post-btn"
            :disabled="!isValid"
            @click="submitPost"
            :loading="isSubmitting"
        >
          등록
        </v-btn>
      </div>
    </div>

    <div class="post-editor">
      <div class="editor-tabs">
        <div
            class="tab-item"
            :class="{ active: activeTab === 'text' }"
            @click="activeTab = 'text'"
        >
          <v-icon>mdi-text</v-icon>
          사진
        </div>
        <div
            class="tab-item"
            :class="{ active: activeTab === 'sticker' }"
            @click="activeTab = 'sticker'"
        >
          <v-icon>mdi-sticker-emoji</v-icon>
          스티커
        </div>
      </div>

      <div class="editor-content">
        <!-- 제목 입력 필드 추가 -->
        <v-text-field
            v-model="postTitle"
            label="제목"
            placeholder="제목을 입력하세요"
            class="mb-4"
            :rules="[v => !!v || '제목은 필수입니다']"
        ></v-text-field>

        <textarea
            v-model="postContent"
            class="content-textarea"
            placeholder="어떤 이야기를 남길건가요?"
            @input="updateCharCount"
        ></textarea>

        <div class="content-footer">
          <div v-if="activeTab === 'text'" class="image-upload">
            <input
                type="file"
                ref="fileInput"
                accept="image/*"
                style="display: none"
                @change="handleFileUpload"
                multiple
            >
            <v-btn variant="outlined" size="small" @click="$refs.fileInput.click()">
              <v-icon>mdi-image</v-icon>
            </v-btn>
          </div>

          <div class="char-count">{{ charCount }}/5000</div>
        </div>

        <!-- 이미지 미리보기 영역 -->
        <div v-if="selectedImages.length > 0" class="image-preview-container">
          <div
              v-for="(image, index) in selectedImages"
              :key="index"
              class="image-preview"
          >
            <img :src="image.preview" alt="Preview">
            <v-btn
                icon
                density="compact"
                class="image-remove-btn"
                @click="removeImage(index)"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- 에러 메시지 표시 -->
        <v-alert
            v-if="errorMessage"
            type="error"
            class="mt-4"
            closable
            @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </v-alert>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      activeTab: 'text',
      postTitle: '',  // 제목 필드 추가
      postContent: '',
      charCount: 0,
      isSubmitting: false,
      selectedImages: [],
      maxImages: 10,
      errorMessage: ''
    };
  },
  computed: {
    isValid() {
      return this.postTitle.trim().length > 0 && this.postContent.trim().length > 0;
    },
    memberId() {
      // URL 파라미터에서 memberId를 가져옴
      return this.$route.params.memberId;
    }
  },
  methods: {
    updateCharCount() {
      this.charCount = this.postContent.length;
    },
    handleFileUpload(event) {
      const files = event.target.files;

      if (!files.length) return;

      // 최대 이미지 개수 체크
      if (this.selectedImages.length + files.length > this.maxImages) {
        this.errorMessage = `이미지는 최대 ${this.maxImages}개까지 첨부할 수 있습니다.`;
        return;
      }

      // 파일 추가 및 미리보기 생성
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.selectedImages.push({
              file: file,
              preview: e.target.result
            });
          };
          reader.readAsDataURL(file);
        }
      });

      // 파일 인풋 초기화
      this.$refs.fileInput.value = '';
    },
    removeImage(index) {
      this.selectedImages.splice(index, 1);
    },
    async submitPost() {
      try {
        if (!this.isValid) {
          this.errorMessage = '제목과 내용을 모두 입력해주세요.';
          return;
        }

        this.isSubmitting = true;
        this.errorMessage = '';

        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
          this.errorMessage = '로그인이 필요합니다.';
          this.$router.push('/member/login');
          return;
        }

        console.log('게시물 작성 시도:', {
          memberId: this.memberId,
          title: this.postTitle,
          content: this.postContent,
          imageCount: this.selectedImages.length
        });

        // FormData 생성
        const formData = new FormData();
        formData.append('title', this.postTitle);  // 제목 추가
        formData.append('content', this.postContent);

        // 이미지 파일 추가
        this.selectedImages.forEach((image) => {
          formData.append('imageFiles', image.file);
        });

        // API 호출
        const response = await axios.post(
            `http://localhost:8080/member-service/post/community/create/${this.memberId}`,
            formData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'X-User-Id': userId,
                'Content-Type': 'multipart/form-data'
              }
            }
        );

        console.log('API 응답:', response.data);

        // 성공 시 채널 페이지로 돌아가기
        if (response.data && response.data.status_code === 200) {
          // EventBus나 Vuex/Pinia 통해 이벤트 발생 또는 아래 처럼 직접 라우팅에 쿼리 추가
          this.$router.push({
            path: '/my-profile',
            query: {refresh: 'true', tab: 'community'}
          });
        } else {
          this.errorMessage = '게시물 저장에 실패했습니다. 다시 시도해주세요.';
        }
      } catch (error) {
        console.error('게시물 작성 중 오류 발생:', error);

        if (error.response) {
          console.error('서버 응답:', error.response.data);
          this.errorMessage = `오류: ${error.response.data.status_message || '서버 오류가 발생했습니다.'}`;
        } else if (error.request) {
          console.error('서버 응답 없음:', error.request);
          this.errorMessage = '서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.';
        } else {
          this.errorMessage = '게시물 작성 중 오류가 발생했습니다: ' + error.message;
        }
      } finally {
        this.isSubmitting = false;
      }
    }
  }
};
</script>

<style scoped>
.post-create-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  color: #ffffff;
}

.post-btn {
  min-width: 80px;
}

.post-editor {
  background-color: #1e2029;
  border-radius: 8px;
  overflow: hidden;
}

.editor-tabs {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-item {
  padding: 12px 16px;
  cursor: pointer;
  color: #c4bab4;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-item.active {
  color: #5ca1a8;
  border-bottom: 2px solid #5ca1a8;
}

.editor-content {
  padding: 16px;
}

.content-textarea {
  width: 100%;
  min-height: 150px;
  background-color: transparent;
  border: none;
  resize: none;
  color: #ffffff;
  font-size: 16px;
  line-height: 1.5;
  outline: none;
  margin-bottom: 16px;
}

.content-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.char-count {
  font-size: 14px;
  color: #c4bab4;
}

.image-preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.image-preview {
  width: 100px;
  height: 100px;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.5) !important;
}
</style>