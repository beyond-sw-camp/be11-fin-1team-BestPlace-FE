<template>
  <div class="channel-setting-container">
    <div v-if="isLoading" class="loading-container">
      <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
      <p>권한을 확인하는 중...</p>
    </div>
    
    <div v-else-if="isAuthorized" class="setting-content">
      <h1 class="setting-title"><span class="purple-text">채널</span> <span class="white-text">설정</span></h1>
      
      <!-- 소셜 정보 섹션 -->
      <div class="info-section">
        <h2 class="info-section-title">소셜 정보</h2>
        
        <div class="content-box">
          <div class="content-header">
            <h3 class="content-title">소셜 링크</h3>
            <button 
              class="link-add-btn" 
              @click="openSnsModal"
              :disabled="snsLinks.length >= 5"
              :class="{ 'disabled-btn': snsLinks.length >= 5 }"
            >
              링크 추가
            </button>
          </div>
          
          <div class="content-description">
            <p>• 내 채널에서 링크를 소개할 수 있습니다.</p>
            <p>• 최대 5개까지 등록할 수 있습니다.</p>
          </div>
          
          <!-- 소셜 링크 목록 -->
          <div v-if="snsLinks.length > 0" class="sns-links-list">
            <div
              v-for="link in snsLinks"
              :key="link.id"
              class="sns-link-item"
            >
              <div class="link-info">
                <div class="link-icon">
                  <img :src="getFavicon(link.url)" alt="Site Icon" class="favicon">
                </div>
                <div class="link-details">
                  <div class="link-title">{{ link.title }}</div>
                  <div class="link-url">{{ link.url }}</div>
                </div>
              </div>
              <div class="link-actions">
                <button class="link-edit-btn" @click="editSnsLink(link)">
                  <v-icon>mdi-pencil</v-icon>
                </button>
                <button class="link-delete-btn" @click="confirmDeleteSnsLink(link.id)">
                  <v-icon>mdi-delete</v-icon>
                </button>
              </div>
            </div>
          </div>
          
          <!-- 소셜 링크가 없을 때 -->
          <div v-else class="empty-links">
            <p>등록된 소셜 링크가 없습니다.</p>
          </div>
        </div>
      </div>
      
      <!-- 배너 정보 섹션 -->
      <div class="info-section">
        <h2 class="info-section-title">배너 정보</h2>
        
        <div class="content-box">
          <div class="content-header">
            <h3 class="content-title">배너 링크</h3>
            <button 
              class="link-add-btn" 
              @click="openBannerModal"
              :disabled="banners.length >= 5"
              :class="{ 'disabled-btn': banners.length >= 5 }"
            >
              배너 추가
            </button>
          </div>
          
          <div class="content-description">
            <p>• 내 채널에서 배너를 소개할 수 있습니다.</p>
            <p>• 최대 5개까지 등록할 수 있습니다.</p>
          </div>
          
          <!-- 배너 목록 -->
          <div v-if="banners.length > 0" class="banners-list">
            <div
              v-for="banner in banners"
              :key="banner.id"
              class="banner-item"
            >
              <div class="banner-info">
                <div class="banner-image">
                  <img :src="banner.imageUrl" alt="Banner Image" class="banner-img">
                </div>
                <div class="banner-details">
                  <div class="banner-title">{{ banner.title || '배너' }}</div>
                  <div class="banner-url">{{ banner.bannerUrl }}</div>
                </div>
              </div>
              <div class="link-actions">
                <button class="link-edit-btn" @click="editBanner(banner)">
                  <v-icon>mdi-pencil</v-icon>
                </button>
                <button class="link-delete-btn" @click="confirmDeleteBanner(banner.id)">
                  <v-icon>mdi-delete</v-icon>
                </button>
              </div>
            </div>
          </div>
          
          <!-- 배너가 없을 때 -->
          <div v-else class="empty-links">
            <p>등록된 배너가 없습니다.</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 권한 없음 모달 -->
    <v-dialog v-model="showAuthModal" max-width="400" content-class="auth-modal" persistent>
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">알림</div>
        </div>
        
        <div class="modal-content">
          <div class="auth-message">
            <v-icon size="48" color="#B084CC">mdi-alert-circle-outline</v-icon>
            <p class="auth-text">이 채널의 스트리머 또는 채널매니저가 아닙니다.</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <v-btn 
            color="#b084cc" 
            block 
            @click="goBack"
            class="confirm-btn"
          >
            확인
          </v-btn>
        </div>
      </div>
    </v-dialog>
    
    <!-- 소셜 링크 추가/수정 모달 -->
    <v-dialog v-model="showSnsModal" max-width="500" content-class="sns-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">{{ editingSns ? '소셜 링크 수정' : '소셜 링크 추가' }}</div>
          <v-btn icon @click="closeSnsModal" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="modal-content">
          <div class="input-group">
            <div class="input-label">소셜 제목</div>
            <input 
              type="text" 
              v-model="snsForm.title" 
              class="form-input" 
              placeholder="링크의 이름을 입력하세요"
              maxlength="20"
            />
            <div class="char-count">{{ snsForm.title.length }}/20</div>
          </div>
          
          <div class="input-group">
            <div class="input-label">URL</div>
            <input 
              type="text" 
              v-model="snsForm.url" 
              class="form-input" 
              placeholder="https://"
            />
            <div v-if="urlError" class="error-message">{{ urlError }}</div>
          </div>
        </div>
        
        <div class="modal-footer">
          <v-btn 
            color="#b084cc" 
            block 
            :disabled="!isValidSnsForm || (editingSns && !hasSnsFormChanged)"
            @click="saveSnsLink"
            class="save-btn"
          >
            {{ editingSns ? '수정' : '추가' }}
          </v-btn>
        </div>
      </div>
    </v-dialog>

    <!-- 에러 메시지 모달 -->
    <v-dialog v-model="showErrorModal" max-width="400" content-class="auth-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">오류</div>
        </div>
        
        <div class="modal-content">
          <div class="auth-message">
            <v-icon size="48" color="#B084CC">mdi-alert-circle-outline</v-icon>
            <p class="auth-text">{{ errorMessage }}</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <v-btn 
            color="#b084cc" 
            block 
            @click="closeErrorModal"
            class="confirm-btn"
          >
            확인
          </v-btn>
        </div>
      </div>
    </v-dialog>

    <!-- 삭제 확인 모달 -->
    <v-dialog v-model="showDeleteModal" max-width="400" content-class="auth-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">삭제 확인</div>
        </div>
        
        <div class="modal-content">
          <div class="auth-message">
            <v-icon size="48" color="#B084CC">mdi-help-circle-outline</v-icon>
            <p class="auth-text">정말로 이 링크를 삭제하시겠습니까?</p>
          </div>
        </div>
        
        <div class="modal-footer delete-modal-footer">
          <v-btn 
            class="cancel-btn"
            @click="closeDeleteModal"
          >
            취소
          </v-btn>
          <v-btn 
            color="#b084cc" 
            @click="deleteSnsLink"
            class="confirm-btn"
          >
            삭제
          </v-btn>
        </div>
      </div>
    </v-dialog>

    <!-- 배너 추가/수정 모달 -->
    <v-dialog v-model="showBannerModal" max-width="500" content-class="banner-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">{{ editingBanner ? '배너 수정' : '배너 추가' }}</div>
          <v-btn icon @click="closeBannerModal" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="modal-content">
          <div class="input-group">
            <div class="input-label">배너 URL</div>
            <input 
              type="text" 
              v-model="bannerForm.bannerUrl" 
              class="form-input" 
              placeholder="https://"
            />
            <div v-if="bannerUrlError" class="error-message">{{ bannerUrlError }}</div>
          </div>
          
          <div class="input-group">
            <div class="input-label">배너 이미지</div>
            <div class="file-input-container">
              <label for="banner-image" class="file-input-label">
                <span v-if="!bannerForm.file && !bannerForm.imagePreview">파일 선택...</span>
                <span v-else>파일 변경...</span>
              </label>
              <input 
                type="file"
                id="banner-image"
                @change="handleBannerImageChange"
                accept="image/*"
                class="file-input"
              />
            </div>
            
            <div v-if="bannerForm.imagePreview" class="image-preview-container">
              <img :src="bannerForm.imagePreview" alt="Banner Preview" class="image-preview" />
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <v-btn 
            color="#b084cc" 
            block 
            :disabled="!isValidBannerForm"
            @click="saveBanner"
            class="save-btn"
          >
            {{ editingBanner ? '수정' : '추가' }}
          </v-btn>
        </div>
      </div>
    </v-dialog>

    <!-- 배너 삭제 확인 모달 -->
    <v-dialog v-model="showDeleteBannerModal" max-width="400" content-class="auth-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">삭제 확인</div>
        </div>
        
        <div class="modal-content">
          <div class="auth-message">
            <v-icon size="48" color="#B084CC">mdi-help-circle-outline</v-icon>
            <p class="auth-text">정말로 이 배너를 삭제하시겠습니까?</p>
          </div>
        </div>
        
        <div class="modal-footer delete-modal-footer">
          <v-btn 
            class="cancel-btn"
            @click="closeDeleteBannerModal"
          >
            취소
          </v-btn>
          <v-btn 
            color="#b084cc" 
            @click="deleteBanner"
            class="confirm-btn"
          >
            삭제
          </v-btn>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import { useRoute, useRouter } from 'vue-router';

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    
    return { route, router };
  },
  
  data() {
    return {
      isLoading: true,
      isAuthorized: false,
      showAuthModal: false,
      channelId: null,
      streamingApi: process.env.VUE_APP_STREAMING_API,
      memberApi: process.env.VUE_APP_MEMBER_API,
      
      // 소셜 링크 관련
      snsLinks: [],
      showSnsModal: false,
      editingSns: false,
      editingSnsId: null,
      snsForm: {
        title: '',
        url: ''
      },
      originalSnsForm: {
        title: '',
        url: ''
      },
      urlError: '',

      // 배너 관련
      banners: [],
      showBannerModal: false,
      editingBanner: false,
      editingBannerId: null,
      bannerForm: {
        bannerUrl: '',
        file: null,
        imagePreview: null
      },
      bannerUrlError: '',

      // 에러 모달 관련
      showErrorModal: false,
      errorMessage: '',

      // 삭제 확인 모달 관련
      showDeleteModal: false,
      deleteTargetId: null,
      showDeleteBannerModal: false,
      deleteBannerId: null
    };
  },
  
  computed: {
    isValidSnsForm() {
      return this.snsForm.title.trim() !== '' && 
             this.snsForm.url.trim() !== '' && 
             this.urlError === '';
    },
    // 소셜 링크 폼에 변경이 있는지 확인
    hasSnsFormChanged() {
      if (!this.editingSns) return true; // 신규 추가일 경우 항상 true
      return this.snsForm.title !== this.originalSnsForm.title || 
             this.snsForm.url !== this.originalSnsForm.url;
    },
    // 배너 폼 유효성 검사
    isValidBannerForm() {
      if (this.editingBanner) {
        // 수정 시에는 URL 또는 이미지 중 하나만 변경해도 됨
        return this.bannerForm.bannerUrl.trim() !== '' && 
               this.bannerUrlError === '';
      } else {
        // 추가 시에는 URL과 이미지 모두 필요
        return this.bannerForm.bannerUrl.trim() !== '' && 
               this.bannerUrlError === '' &&
               (this.bannerForm.file || this.bannerForm.imagePreview);
      }
    }
  },
  
  watch: {
    'snsForm.url': function(newVal) {
      this.validateUrl(newVal);
    },
    'bannerForm.bannerUrl': function(newVal) {
      this.validateBannerUrl(newVal);
    }
  },
  
  mounted() {
    this.channelId = this.route.params.memberId;
    this.checkManagerAuth();
  },
  
  methods: {
    async checkManagerAuth() {
      this.isLoading = true;
      
      try {
        const response = await axios.get(`${this.streamingApi}/manager/checking/channel/${this.channelId}`);
        
        // 응답 데이터에서 권한 여부 확인
        const authResult = response.data?.result;
        
        if (authResult === 'Y') {
          this.isAuthorized = true;
          // 권한이 확인되면 소셜 링크 데이터와 배너 데이터 가져오기
          await this.fetchSnsLinks();
          await this.fetchBanners();
        } else {
          this.isAuthorized = false;
          this.showAuthModal = true;
        }
      } catch (error) {
        console.error('권한 확인 중 오류 발생:', error);
        this.isAuthorized = false;
        this.showAuthModal = true;
      } finally {
        this.isLoading = false;
      }
    },
    
    goBack() {
      this.router.go(-1);
    },
    
    // 소셜 링크 데이터 가져오기
    async fetchSnsLinks() {
      try {
        const response = await axios.get(`${this.memberApi}/member/sns`, {
          params: { streamerId: this.channelId }
        });
        
        if (response.data && response.data.result) {
          this.snsLinks = response.data.result;
        }
      } catch (error) {
        console.error('SNS 링크 로드 실패:', error);
      }
    },
    
    // 파비콘 URL 생성
    getFavicon(url) {
      try {
        const domain = new URL(url).hostname;
        if (domain.includes('youtube') || domain.includes('youtu.be')) {
          return 'https://www.gstatic.com/youtube/img/branding/favicon/favicon_144x144.png';
        } else if (domain.includes('instagram')) {
          return 'https://static.cdninstagram.com/rsrc.php/v3/yt/r/30PrGfR3xhB.png';
        } else if (domain.includes('cafe.daum') || domain.includes('cafe.naver')) {
          return 'https://ssl.pstatic.net/static/cafe/cafe_pc/ico/favicon/favicon.ico?v=2';
        }
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      } catch {
        return 'https://www.google.com/s2/favicons?domain=example.com&sz=64';
      }
    },
    
    // URL 유효성 검사
    validateUrl(url) {
      if (!url) {
        this.urlError = '';
        return;
      }
      
      try {
        // URL 객체 생성 시도
        new URL(url);
        this.urlError = '';
      } catch (error) {
        this.urlError = '유효한 URL 형식이 아닙니다.';
      }
    },
    
    // 소셜 링크 모달 열기
    openSnsModal() {
      this.snsForm = {
        title: '',
        url: ''
      };
      this.editingSns = false;
      this.editingSnsId = null;
      this.urlError = '';
      this.showSnsModal = true;
    },
    
    // 소셜 링크 모달 닫기
    closeSnsModal() {
      this.showSnsModal = false;
    },
    
    // 소셜 링크 수정 모달 열기
    editSnsLink(link) {
      this.snsForm = {
        title: link.title,
        url: link.url
      };
      // 원본 데이터 저장
      this.originalSnsForm = {
        title: link.title,
        url: link.url
      };
      this.editingSns = true;
      this.editingSnsId = link.id;
      this.urlError = '';
      this.showSnsModal = true;
    },
    
    // 소셜 링크 저장 (추가 또는 수정)
    async saveSnsLink() {
      try {
        if (this.editingSns) {
          // 링크 수정
          await axios.patch(`${this.memberApi}/member/sns/update`, {
            id: this.editingSnsId,
            title: this.snsForm.title,
            url: this.snsForm.url
          });
        } else {
          // 링크 추가
          await axios.post(`${this.memberApi}/member/sns/create`, {
            channelMemberId: this.channelId,
            title: this.snsForm.title,
            url: this.snsForm.url
          });
        }
        
        // 소셜 링크 목록 다시 불러오기
        await this.fetchSnsLinks();
        
        // 모달 닫기
        this.closeSnsModal();
      } catch (error) {
        console.error('소셜 링크 저장 실패:', error);
        this.showError('소셜 링크 저장에 실패했습니다. 다시 시도해주세요.');
      }
    },
    
    // 소셜 링크 삭제 확인 모달 표시
    confirmDeleteSnsLink(id) {
      this.deleteTargetId = id;
      this.showDeleteModal = true;
    },
    
    // 소셜 링크 삭제
    async deleteSnsLink() {
      try {
        await axios.delete(`${this.memberApi}/member/sns/delete`, {
          params: { snsLinkId: this.deleteTargetId }
        });
        
        // 소셜 링크 목록 다시 불러오기
        await this.fetchSnsLinks();
        
        // 모달 닫기
        this.closeDeleteModal();
      } catch (error) {
        console.error('소셜 링크 삭제 실패:', error);
        this.closeDeleteModal();
        this.showError('소셜 링크 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    },
    
    // 삭제 모달 닫기
    closeDeleteModal() {
      this.showDeleteModal = false;
      this.deleteTargetId = null;
    },

    // 에러 모달 표시
    showError(message) {
      this.errorMessage = message;
      this.showErrorModal = true;
    },

    // 에러 모달 닫기
    closeErrorModal() {
      this.showErrorModal = false;
      this.errorMessage = '';
    },

    // 배너 데이터 가져오기
    async fetchBanners() {
      try {
        const response = await axios.get(`${this.memberApi}/member/banner`, {
          params: { memberId: this.channelId }
        });
        
        if (response.data && response.data.result) {
          this.banners = response.data.result;
        }
      } catch (error) {
        console.error('배너 로드 실패:', error);
      }
    },
    
    // 배너 URL 유효성 검사
    validateBannerUrl(url) {
      if (!url) {
        this.bannerUrlError = '';
        return;
      }
      
      try {
        // URL 객체 생성 시도
        new URL(url);
        this.bannerUrlError = '';
      } catch (error) {
        this.bannerUrlError = '유효한 URL 형식이 아닙니다.';
      }
    },
    
    // 배너 모달 열기
    openBannerModal() {
      this.bannerForm = {
        bannerUrl: '',
        file: null,
        imagePreview: null
      };
      this.editingBanner = false;
      this.editingBannerId = null;
      this.bannerUrlError = '';
      this.showBannerModal = true;
    },
    
    // 배너 모달 닫기
    closeBannerModal() {
      this.showBannerModal = false;
    },
    
    // 배너 이미지 파일 선택 처리
    handleBannerImageChange(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      this.bannerForm.file = file;
      
      // 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        this.bannerForm.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    
    // 배너 수정 모달 열기
    editBanner(banner) {
      this.bannerForm = {
        bannerUrl: banner.bannerUrl || '',
        file: null,
        imagePreview: banner.imageUrl || null
      };
      this.editingBanner = true;
      this.editingBannerId = banner.id;
      this.bannerUrlError = '';
      this.showBannerModal = true;
    },
    
    // 배너 저장 (추가 또는 수정)
    async saveBanner() {
      try {
        const formData = new FormData();
        
        if (this.editingBanner) {
          // 링크 수정
          formData.append('id', this.editingBannerId);
          formData.append('bannerUrl', this.bannerForm.bannerUrl);
          if (this.bannerForm.file) {
            formData.append('image', this.bannerForm.file);
          }
          
          await axios.post(`${this.memberApi}/member/banner/update`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        } else {
          // 링크 추가
          formData.append('channelMemberId', this.channelId);
          formData.append('bannerUrl', this.bannerForm.bannerUrl);
          formData.append('image', this.bannerForm.file);
          
          await axios.post(`${this.memberApi}/member/banner/create`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        }
        
        // 배너 목록 다시 불러오기
        await this.fetchBanners();
        
        // 모달 닫기
        this.closeBannerModal();
      } catch (error) {
        console.error('배너 저장 실패:', error);
        this.showError('배너 저장에 실패했습니다. 다시 시도해주세요.');
      }
    },
    
    // 배너 삭제 확인 모달 표시
    confirmDeleteBanner(id) {
      this.deleteBannerId = id;
      this.showDeleteBannerModal = true;
    },
    
    // 배너 삭제
    async deleteBanner() {
      try {
        await axios.delete(`${this.memberApi}/member/banner/delete`, {
          params: { bannerId: this.deleteBannerId }
        });
        
        // 배너 목록 다시 불러오기
        await this.fetchBanners();
        
        // 모달 닫기
        this.closeDeleteBannerModal();
      } catch (error) {
        console.error('배너 삭제 실패:', error);
        this.closeDeleteBannerModal();
        this.showError('배너 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    },
    
    // 삭제 모달 닫기
    closeDeleteBannerModal() {
      this.showDeleteBannerModal = false;
      this.deleteBannerId = null;
    }
  }
};
</script>

<style scoped>
.channel-setting-container {
  width: 100%;
  background-color: #141517;
  color: white;
  min-height: 100vh;
  padding: 24px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 16px;
}

.setting-content {
  max-width: 1200px;
  margin: 0 auto;
}

.setting-title {
  font-size: 32px;
  font-weight: 500;
  padding: 0 0 24px 0;
}

.purple-text {
  color: #B084CC;
}

.white-text {
  color: #FFFFFF;
}

/* 정보 섹션 스타일 */
.info-section {
  margin-bottom: 32px;
}

.info-section-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #ffffff;
}

.content-box {
  background-color: #1A1A1A;
  border-radius: 12px;
  padding: 20px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.content-title {
  font-size: 18px;
  font-weight: 500;
  color: #ffffff;
  margin: 0;
}

.content-description {
  color: #888888;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 20px;
}

.content-description p {
  margin: 4px 0;
}

/* 소셜 링크 버튼 */
.link-add-btn {
  background-color: #B084CC;
  color: #000;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.link-add-btn:hover {
  background-color: #9a6cb7;
}

.link-add-btn.disabled-btn {
  background-color: #666;
  color: #aaa;
  cursor: not-allowed;
}

.link-add-btn.disabled-btn:hover {
  background-color: #666;
}

/* 소셜 링크 목록 */
.sns-links-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sns-link-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #262626;
  padding: 12px 16px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.sns-link-item:hover {
  background-color: #333;
}

.link-info {
  display: flex;
  align-items: center;
  gap: 12px;
  width: calc(100% - 100px);
}

.link-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: #3a3a3a;
  flex-shrink: 0;
  overflow: hidden;
}

.favicon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.link-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.link-title {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-url {
  font-size: 14px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-actions {
  display: flex;
  gap: 8px;
}

.link-edit-btn, .link-delete-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background-color: #3a3a3a;
  color: #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.link-edit-btn:hover {
  background-color: #4a4a4a;
}

.link-delete-btn:hover {
  background-color: #cc4444;
}

.empty-links {
  padding: 24px;
  text-align: center;
  color: #888;
  font-size: 16px;
  background-color: #222;
  border-radius: 8px;
}

/* 모달 스타일 */
.auth-modal, .sns-modal {
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
  color: #999;
}

.modal-content {
  padding: 24px;
}

.input-group {
  margin-bottom: 20px;
  position: relative;
}

.input-label {
  font-size: 14px;
  color: #aaa;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px;
  background-color: #333;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
}

.char-count {
  font-size: 12px;
  color: #aaa;
  text-align: right;
  margin-top: 4px;
}

.error-message {
  color: #ff5252;
  font-size: 12px;
  margin-top: 4px;
}

.auth-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.auth-text {
  font-size: 16px;
  color: #fff;
  margin: 0;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid #333;
}

.delete-modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn {
  background-color: #333333;
  color: #ffffff;
}

.confirm-btn, .save-btn {
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

/* 배너 관련 스타일 */
.banners-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.banner-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #262626;
  padding: 12px 16px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.banner-item:hover {
  background-color: #333;
}

.banner-info {
  display: flex;
  align-items: center;
  gap: 12px;
  width: calc(100% - 100px);
}

.banner-image {
  width: 70px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: #3a3a3a;
  flex-shrink: 0;
  overflow: hidden;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.banner-title {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.banner-url {
  font-size: 14px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-input-container {
  width: 100%;
  margin-bottom: 10px;
}

.file-input-label {
  display: inline-block;
  padding: 10px 16px;
  background-color: #333;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.file-input-label:hover {
  background-color: #444;
}

.file-input {
  display: none;
}

.image-preview-container {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 10px;
  background-color: #222;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
