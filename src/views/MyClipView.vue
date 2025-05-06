<template>
  <div class="myclip-wrapper">
    <div class="myclip-content">
      <h1 class="myclip-title">내 <span class="purple-text">클립</span></h1>
      <p class="myclip-subtitle">클립의 원작 스트리머에게 클립이 삭제될 수 있습니다.</p>
      
      <!-- 클립 리스트 -->
      <div class="clips-container">
        <!-- 테이블 헤더 -->
        <div class="clip-header">
          <div class="header-video">영상</div>
          <div class="header-channel">채널</div>
          <div class="header-action">액션</div>
        </div>
        
        <!-- 로딩 표시 -->
        <v-card v-if="loading" class="text-center pa-6 mt-4 loading-card">
          <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
          <p class="mt-4">클립을 불러오는 중입니다...</p>
        </v-card>
        
        <!-- 클립 아이템 -->
        <div v-else-if="clips.length > 0" class="clip-list">
          <div v-for="clip in clips" :key="clip.id" class="clip-item">
            <!-- 썸네일 영역 -->
            <div class="thumbnail-area" @click="goToClipDetail(clip.id)">
              <div class="thumbnail-wrapper">
                <v-img :src="clip.thumbnailUrl" class="thumbnail" cover>
                  <template v-slot:placeholder>
                    <v-row class="fill-height ma-0" align="center" justify="center">
                      <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
                    </v-row>
                  </template>
                </v-img>
                <div class="duration">{{ formatDuration(clip.duration) }}</div>
              </div>
            </div>
            
            <!-- 콘텐츠 영역 -->
            <div class="content-area">
              <div class="clip-title" @click="goToClipDetail(clip.id)">{{ clip.title }}</div>
              <div class="clip-info">
                <div class="timestamp">
                  <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
                  {{ formatDate(clip.createdTime) }}
                </div>
                <div class="views">
                  <v-icon size="x-small" class="mr-1">mdi-eye</v-icon>
                  {{ formatNumber(clip.views) }}
                </div>
              </div>
            </div>
            
            <!-- 채널 영역 -->
            <div class="channel-area">
              <div class="channel-name">{{ clip.streamerNickname }}</div>
            </div>
            
            <!-- 액션 영역 -->
            <div class="action-area">
              <v-btn color="#b084cc" size="small" class="manage-btn" @click="openEditTitleModal(clip)">
                수정
              </v-btn>
              
              <v-btn color="#ff4757" size="small" class="delete-btn" @click="confirmDeleteClip(clip.id)">
                삭제
              </v-btn>
            </div>
          </div>
        </div>
        
        <!-- 데이터 없음 -->
        <v-card v-else class="empty-card mt-4">
          <v-card-text class="text-center pa-6">
            <v-icon size="64" color="#B084CC" class="mb-4">mdi-video-box-off</v-icon>
            <h3 class="mb-2">클립이 없습니다</h3>
            <p>아직 저장된 클립이 없습니다.</p>
          </v-card-text>
        </v-card>
        
        <!-- 페이지네이션 -->
        <div v-if="clips.length > 0" class="pagination-container">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="5"
            @update:model-value="handlePageChange"
            color="#B084CC"
          ></v-pagination>
        </div>
      </div>
      
      <!-- 삭제 확인 다이얼로그 -->
      <v-dialog v-if="deleteDialog" v-model="deleteDialog" max-width="400" content-class="delete-dialog-modal">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-title">클립 삭제 확인</div>
            <v-btn icon @click="closeDeleteModal" class="close-btn">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          
          <div class="modal-content">
            <div class="delete-confirm-message">
              <v-icon size="40" color="#ff4757" class="mb-3">mdi-alert-circle</v-icon>
              <p>정말 이 클립을 삭제하시겠습니까?</p>
              <p class="delete-subtitle">이 작업은 되돌릴 수 없습니다.</p>
            </div>
          </div>
          
          <div class="modal-footer delete-modal-footer">
            <v-btn 
              variant="outlined"
              color="#b084cc" 
              class="cancel-btn"
              @click="closeDeleteModal"
            >
              취소
            </v-btn>
            <v-btn 
              color="#ff4757" 
              class="confirm-delete-btn"
              @click="deleteClip"
              :loading="deleting"
            >
              삭제
            </v-btn>
          </div>
        </div>
      </v-dialog>

      <!-- 제목 수정 모달 -->
      <v-dialog v-if="editTitleDialog" v-model="editTitleDialog" max-width="400" content-class="edit-title-modal">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-title">클립 제목 수정</div>
            <v-btn icon @click="closeEditTitleModal" class="close-btn">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          
          <div class="modal-content">
            <!-- 썸네일 미리보기 -->
            <div class="edit-thumbnail-preview">
              <img 
                :src="selectedClip?.thumbnailUrl" 
                alt="클립 썸네일" 
                class="preview-image"
              />
            </div>
            
            <!-- 제목 입력 필드 -->
            <div class="input-group">
              <div class="input-label">클립 제목</div>
              <input 
                type="text" 
                v-model="editForm.title" 
                class="title-input" 
                placeholder="클립 제목을 입력하세요"
              />
              <div class="char-count" :class="{ 'error': titleError }">
                {{ editForm.title.length }}/50
              </div>
              <div v-if="titleError" class="error-message">{{ titleError }}</div>
            </div>
          </div>
          
          <div class="modal-footer">
            <v-btn 
              color="#b084cc" 
              block 
              :disabled="!isFormValid" 
              @click="updateClipTitle"
              class="submit-btn"
              :loading="updating"
            >
              수정
            </v-btn>
          </div>
        </div>
      </v-dialog>

      <!-- 수정 완료 알림 모달 -->
      <v-dialog v-if="successDialog" v-model="successDialog" max-width="400" content-class="success-modal">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-title">수정 완료</div>
            <v-btn icon @click="closeSuccessModal" class="close-btn">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          
          <div class="modal-content">
            <div class="success-message">
              <v-icon size="40" color="#B084CC" class="mb-3">mdi-check-circle</v-icon>
              <p>클립 제목이 성공적으로 수정되었습니다.</p>
            </div>
          </div>
          
          <div class="modal-footer">
            <v-btn 
              color="#b084cc" 
              block 
              @click="closeSuccessModal"
              class="submit-btn"
            >
              확인
            </v-btn>
          </div>
        </div>
      </v-dialog>

      <!-- 삭제 완료 알림 모달 -->
      <v-dialog v-if="deleteSuccessDialog" v-model="deleteSuccessDialog" max-width="400" content-class="delete-success-modal">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-title">삭제 완료</div>
            <v-btn icon @click="closeDeleteSuccessModal" class="close-btn">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          
          <div class="modal-content">
            <div class="success-message">
              <v-icon size="40" color="#B084CC" class="mb-3">mdi-check-circle</v-icon>
              <p>클립이 성공적으로 삭제되었습니다.</p>
            </div>
          </div>
          
          <div class="modal-footer">
            <v-btn 
              color="#b084cc" 
              block 
              @click="closeDeleteSuccessModal"
              class="submit-btn"
            >
              확인
            </v-btn>
          </div>
        </div>
      </v-dialog>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'MyClipView',
  data() {
    return {
      clips: [],
      loading: true,
      currentPage: 1,
      totalPages: 1,
      totalElements: 0,
      deleteDialog: false,
      clipIdToDelete: null,
      
      // 제목 수정 관련
      editTitleDialog: false,
      selectedClip: null,
      editForm: {
        title: ''
      },
      originalTitle: '', // 원래 제목 저장용
      titleError: '',
      updating: false,
      
      // 수정 완료 알림 관련
      successDialog: false,
      
      // 삭제 관련
      deleting: false,
      deleteSuccessDialog: false
    };
  },
  
  computed: {
    isFormValid() {
      // 빈 값 아닌지, 에러 없는지, 원래 제목과 다른지 체크
      return this.editForm.title.trim() !== '' && 
             !this.titleError && 
             this.editForm.title.trim() !== this.originalTitle;
    }
  },
  
  watch: {
    'editForm.title': function(newVal) {
      this.validateTitle(newVal);
    }
  },
  
  created() {
    this.fetchMyClips();
  },
  
  methods: {
    async fetchMyClips() {
      this.loading = true;
      
      try {
        const apiUrl = process.env.VUE_APP_MEMBER_API;
        const response = await axios.get(`${apiUrl}/video/clip/list/myclip`, {
          params: {
            page: this.currentPage - 1 // 백엔드는 0부터 시작
          }
        });
        
        if (response.data && response.data.result) {
          const { content, totalPages, totalElements } = response.data.result;
          this.clips = content;
          this.totalPages = totalPages;
          this.totalElements = totalElements;
        }
      } catch (error) {
        console.error('내 클립 로드 중 오류 발생:', error);
      } finally {
        this.loading = false;
      }
    },
    
    handlePageChange(page) {
      this.currentPage = page;
      this.fetchMyClips();
      
      // 페이지 상단으로 스크롤
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    },
    
    goToClipDetail(clipId) {
      this.$router.push(`/clip/${clipId}`);
    },
    
    // 삭제 확인 모달 관련 메서드
    confirmDeleteClip(clipId) {
      this.clipIdToDelete = clipId;
      this.deleteDialog = true;
    },
    
    closeDeleteModal() {
      this.deleteDialog = false;
      this.clipIdToDelete = null;
    },
    
    // 삭제 API 호출
    async deleteClip() {
      if (!this.clipIdToDelete) return;
      
      this.deleting = true;
      
      try {
        const apiUrl = process.env.VUE_APP_MEMBER_API;
        const response = await axios.post(
          `${apiUrl}/video/delete/${this.clipIdToDelete}`,
          { videoId: this.clipIdToDelete }
        );
        
        if (response.data) {
          // 현재 클립 목록에서 삭제된 클립 제거
          this.clips = this.clips.filter(clip => clip.id !== this.clipIdToDelete);
          
          // 삭제 모달 닫기
          this.deleteDialog = false;
          this.clipIdToDelete = null;
          
          // DOM 업데이트를 위한 시간 확보
          await this.$nextTick();
          
          // 삭제 완료 모달 표시
          setTimeout(() => {
            this.deleteSuccessDialog = true;
          }, 500);
          
          // 현재 페이지의 항목이 모두 삭제되었고, 이전 페이지가 있으면 이전 페이지로 이동
          if (this.clips.length === 0 && this.currentPage > 1) {
            this.currentPage -= 1;
            this.fetchMyClips();
          }
        }
      } catch (error) {
        console.error('클립 삭제 중 오류 발생:', error);
        alert('클립 삭제에 실패했습니다. 다시 시도해주세요.');
      } finally {
        this.deleting = false;
      }
    },
    
    // 삭제 완료 모달 관련 메서드
    closeDeleteSuccessModal() {
      this.deleteSuccessDialog = false;
      this.fetchMyClips();
    },
    
    // 제목 수정 모달 관련 메서드
    openEditTitleModal(clip) {
      this.selectedClip = clip;
      this.editForm.title = clip.title;
      this.originalTitle = clip.title; // 원래 제목 저장
      this.titleError = '';
      this.editTitleDialog = true;
    },
    
    closeEditTitleModal() {
      this.editTitleDialog = false;
      this.selectedClip = null;
      this.editForm.title = '';
    },
    
    validateTitle(title) {
      if (!title.trim()) {
        this.titleError = '제목을 입력해주세요';
      } else if (title.length > 50) {
        this.titleError = '제목은 50자 이하로 입력해주세요';
      } else {
        this.titleError = '';
      }
    },
    
    async updateClipTitle() {
      if (!this.isFormValid) return;
      
      this.updating = true;
      
      try {
        const apiUrl = process.env.VUE_APP_MEMBER_API;
        
        const requestData = {
          videoId: this.selectedClip.id,
          title: this.editForm.title.trim()
        };
        
        const response = await axios.post(
          `${apiUrl}/video/update/${this.selectedClip.id}`,
          requestData
        );
        
        if (response.data) {
          // 현재 클립 목록에서 제목 업데이트
          const updatedClip = this.clips.find(clip => clip.id === this.selectedClip.id);
          if (updatedClip) {
            updatedClip.title = this.editForm.title.trim();
          }
          
          // 제목과 선택된 클립 정보 임시 저장
        //   const updatedTitle = this.editForm.title.trim();
          
          // 편집 모달 완전히 닫기
          this.editTitleDialog = false;
          this.selectedClip = null;
          this.editForm.title = '';
          
          // DOM 업데이트를 위한 충분한 시간 확보 (다음 렌더링 사이클)
          await this.$nextTick();
          
          // 추가 지연 후 성공 모달 표시
          setTimeout(() => {
            this.successDialog = true;
          }, 500);
        }
      } catch (error) {
        console.error('클립 제목 수정 중 오류 발생:', error);
        alert('클립 제목 수정에 실패했습니다. 다시 시도해주세요.');
      } finally {
        this.updating = false;
      }
    },
    
    // 성공 모달 관련 메서드
    showSuccessModal() {
      this.successDialog = true;
    },
    
    closeSuccessModal() {
      this.successDialog = false;
    },
    
    formatDuration(durationStr) {
      if (!durationStr) return '00:00:00';
      
      // HH:MM:SS 형식이면 그대로 반환
      if (/\d{2}:\d{2}:\d{2}/.test(durationStr)) {
        return durationStr;
      }
      
      // 초 단위 문자열이라고 가정하고 변환
      const seconds = parseInt(durationStr, 10);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      return `00:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    },
    
    formatDate(dateStr) {
      if (!dateStr) return '';
      
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${year}.${month}.${day} ${hours}:${minutes}`;
    },
    
    formatNumber(num) {
      if (!num) return '0';
      
      if (num >= 10000) {
        return (num / 10000).toFixed(1) + '만';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + '천';
      }
      return num.toString();
    }
  }
};
</script>

<style scoped>
.myclip-wrapper {
  width: 100%;
  background-color: #141517;
  color: white;
  min-height: 100vh;
}

.myclip-content {
  max-width: 1920px;
  margin: 0 auto;
  padding: 24px;
}

.myclip-title {
  font-size: 32px;
  font-weight: 500;
  margin-bottom: 10px;
}

.myclip-subtitle {
  color: #aaaaaa;
  font-size: 14px;
  margin-bottom: 20px;
}

.purple-text {
  color: #B084CC;
}

/* 클립 컨테이너 */
.clips-container {
  margin-top: 20px;
}

/* 헤더 스타일 */
.clip-header {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 0;
  margin-bottom: 10px;
}

.header-video {
  width: 50%;
  color: white;
  font-size: 16px;
  font-weight: 500;
  padding-left: 60px;
}

.header-channel {
  width: 25%;
  color: white;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
}

.header-action {
  width: 25%;
  color: white;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
}

/* 클립 목록 */
.clip-list {
  width: 100%;
}

/* 클립 아이템 */
.clip-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

/* 썸네일 영역 */
.thumbnail-area {
  width: 120px;
  padding-left: 20px;
  cursor: pointer;
}

.thumbnail-wrapper {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 비율 */
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
}

.thumbnail {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.duration {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 10px;
}

/* 콘텐츠 영역 */
.content-area {
  width: calc(50% - 120px); /* 썸네일 영역을 뺀 나머지 */
  padding: 0 15px;
  min-width: 0;
}

.clip-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: white;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clip-title:hover {
  color: #B084CC;
}

.clip-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.timestamp, .views {
  color: #aaaaaa;
  font-size: 12px;
  display: flex;
  align-items: center;
}

/* 채널 영역 */
.channel-area {
  width: 25%;
  text-align: center;
  padding: 0 10px;
}

.channel-name {
  color: white;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 액션 영역 */
.action-area {
  width: 25%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.manage-btn {
  text-transform: none;
  font-size: 12px;
  letter-spacing: 0;
  height: 30px;
  min-width: 60px;
}

.delete-btn {
  text-transform: none;
  font-size: 12px;
  letter-spacing: 0;
  height: 30px;
  min-width: 60px;
  margin-left: 8px;
}

.menu-btn {
  color: #aaaaaa;
}

/* 페이지네이션 */
.pagination-container {
  display: flex;
  justify-content: center;
  margin: 30px 0;
}

/* 기타 카드 스타일 */
.empty-card, .loading-card {
  background-color: #1A1B1E !important;
  color: white;
  border-radius: 8px;
}

.empty-card h3 {
  color: white;
}

.empty-card p {
  color: #aaaaaa;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .clip-header {
    display: none;
  }
  
  .clip-item {
    flex-direction: column;
    align-items: flex-start;
    padding: 15px;
  }
  
  .thumbnail-area {
    width: 100%;
    padding-left: 0;
    margin-bottom: 10px;
  }
  
  .content-area {
    width: 100%;
    padding: 10px 0;
  }
  
  .channel-area {
    width: 100%;
    text-align: left;
    padding: 5px 0;
  }
  
  .action-area {
    width: 100%;
    justify-content: flex-start;
    padding: 5px 0;
  }
}

/* 모달 스타일 */
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
  color: #aaaaaa;
}

.modal-content {
  padding: 20px;
}

.edit-thumbnail-preview {
  width: 100%;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #000;
}

.preview-image {
  width: 100%;
  height: auto;
  display: block;
}

.input-group {
  margin-bottom: 20px;
  position: relative;
}

.input-label {
  font-size: 14px;
  color: #cccccc;
  margin-bottom: 8px;
}

.title-input {
  width: 100%;
  background-color: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 12px;
  color: white;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.title-input:focus {
  border-color: #B084CC;
}

.char-count {
  position: absolute;
  right: 0;
  top: 0;
  font-size: 12px;
  color: #aaaaaa;
}

.char-count.error {
  color: #ff5252;
}

.error-message {
  color: #ff5252;
  font-size: 12px;
  margin-top: 4px;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid #333;
}

.submit-btn {
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  text-transform: none;
}

/* 성공 알림 스타일 */
.success-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 15px 0;
}

.success-message p {
  color: #ffffff;
  font-size: 16px;
  margin-top: 10px;
}

/* 삭제 모달 스타일 */
.delete-confirm-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 15px 0;
}

.delete-confirm-message p {
  color: #ffffff;
  font-size: 16px;
  margin-top: 10px;
}

.delete-subtitle {
  color: #aaaaaa !important;
  font-size: 14px !important;
  margin-top: 5px !important;
}

.delete-modal-footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.cancel-btn, .confirm-delete-btn {
  flex: 1;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  text-transform: none;
}
</style>
