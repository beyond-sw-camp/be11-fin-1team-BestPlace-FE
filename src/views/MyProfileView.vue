<template>
  <div class="profile-wrapper">
    <!-- 베플 프로필 섹션 -->
    <div class="profile-content">
      <h1 class="profile-title"><span class="purple-text">베플</span> <span class="white-text">프로필</span></h1>

      <!-- 프로필 정보 섹션 -->
      <div class="profile-info-section">
        <div class="profile-avatar">
          <img 
            :src="profileData.profileImageUrl || defaultProfileImage" 
            alt="프로필 이미지" 
            class="avatar-image" 
          />
        </div>
        
        <div class="profile-details">
          <h2 class="username">{{ profileData.memberNickname }}</h2>
          <p v-if="profileData.introduction" class="introduction">{{ profileData.introduction }}</p>
          <p v-else class="introduction">한줄 자기소개를 작성해보세요.</p>
        </div>
        
        <v-btn class="edit-profile-btn" variant="outlined" color="white" rounded @click="openEditModal">
          프로필 편집
        </v-btn>
      </div>
      
      <!-- 구분선 -->
      <div class="divider"></div>
      
      <!-- 프로필 통계 섹션 - 세로 배치 -->
      <div class="profile-stats">
        <div class="stat-item">
          <div class="stat-label">활동기간</div>
          <div class="stat-value">{{ getActivityPeriodNumber }}<span class="stat-unit">{{ getActivityPeriodUnit }}</span></div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">베리</div>
          <div class="stat-value">{{ berryBalance }} <span class="stat-unit">개</span></div>
        </div>
      </div>
      
      <!-- 추가 공간 (스크롤이 필요하도록) -->
      <div class="spacer"></div>
    </div>
    
    <!-- 프로필 편집 모달 -->
    <v-dialog v-model="editModalOpen" max-width="400" content-class="profile-edit-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">프로필 편집</div>
          <v-btn icon @click="closeEditModal" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="modal-content">
          <!-- 프로필 이미지 변경 -->
          <div class="profile-image-edit">
            <div class="profile-image-container">
              <img 
                :src="previewImage || profileData.profileImageUrl || defaultProfileImage" 
                alt="프로필 이미지" 
                class="edit-avatar-image" 
              />
              <label for="profile-image-upload" class="image-upload-label">
                <v-icon class="upload-icon">mdi-camera</v-icon>
              </label>
              <input 
                type="file" 
                id="profile-image-upload" 
                class="image-upload-input" 
                accept="image/*"
                @change="handleImageChange" 
              />
            </div>
          </div>
          
          <!-- 닉네임 입력 -->
          <div class="input-group">
            <div class="input-label">닉네임</div>
            <input 
              type="text" 
              v-model="editForm.nickname" 
              class="profile-input" 
              placeholder="닉네임을 입력하세요"
            />
            <div v-if="nicknameError" class="error-message">{{ nicknameError }}</div>
          </div>
          
          <!-- 자기소개 입력 -->
          <div class="input-group">
            <div class="input-label">한 줄 자기소개</div>
            <textarea 
              v-model="editForm.introduction" 
              class="profile-textarea" 
              placeholder="자기소개를 입력하세요"
            ></textarea>
            <div class="char-count" :class="{ 'error': introError }">
              {{ editForm.introduction.length }}/30
            </div>
            <div v-if="introError" class="error-message">{{ introError }}</div>
          </div>
        </div>
        
        <div class="modal-footer">
          <v-btn 
            color="#b084cc" 
            block 
            :disabled="!isFormChanged" 
            @click="updateProfile"
            class="submit-btn"
          >
            수정
          </v-btn>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      profileData: {
        id: '',
        memberNickname: '',
        email: '',
        profileImageUrl: '',
        createdTime: '',
        berryBalance: 0,
        introduction: ''
      },
      berryBalance: 0,
      defaultProfileImage: 'https://bestplace-media.s3.ap-northeast-2.amazonaws.com/bestplace-basic-profile-image.png',
      memberApi: process.env.VUE_APP_MEMBER_API,
      paymentApi: process.env.VUE_APP_PAYMENT_API,
      
      // 모달 관련
      editModalOpen: false,
      editForm: {
        nickname: '',
        introduction: '',
        image: null
      },
      previewImage: null,
      originalForm: {
        nickname: '',
        introduction: ''
      },
      nicknameError: '',
      introError: ''
    }
  },
  computed: {
    calcActivityPeriod() {
      if (!this.profileData.createdTime) return '0개월+'
      
      const createdDate = new Date(this.profileData.createdTime)
      const currentDate = new Date()
      
      const yearDiff = currentDate.getFullYear() - createdDate.getFullYear()
      const monthDiff = currentDate.getMonth() - createdDate.getMonth()
      
      const totalMonths = yearDiff * 12 + monthDiff
      
      if (totalMonths >= 12) {
        const years = Math.floor(totalMonths / 12)
        const months = totalMonths % 12
        return months > 0 ? `${years}년 ${months}개월+` : `${years}년+`
      } else {
        return `${totalMonths}개월+`
      }
    },
    // 활동기간 값과 단위 분리
    getActivityPeriodNumber() {
      const period = this.calcActivityPeriod;
      if (period.includes('년')) {
        return period.split('년')[0];
      } else {
        return period.split('개월')[0];
      }
    },
    getActivityPeriodUnit() {
      const period = this.calcActivityPeriod;
      if (period.includes('년') && period.includes('개월')) {
        return '년 ' + period.split('년 ')[1];
      } else if (period.includes('년')) {
        return '년+';
      } else {
        return '개월+';
      }
    },
    // 폼 변경 감지
    isFormChanged() {
      return (this.editForm.nickname !== this.originalForm.nickname ||
             this.editForm.introduction !== this.originalForm.introduction ||
             this.editForm.image !== null) && !this.nicknameError && !this.introError;
    }
  },
  watch: {
    'editForm.nickname': function(newVal) {
      this.validateNickname(newVal);
    },
    'editForm.introduction': function(newVal) {
      this.validateIntroduction(newVal);
    }
  },
  mounted() {
    this.fetchProfileData()
    this.fetchBerryBalance()
  },
  methods: {
    async fetchProfileData() {
      try {
        const response = await axios.get(`${this.memberApi}/member/my/profile`)
        this.profileData = response.data.result
        console.log('프로필 데이터:', this.profileData) // 디버깅용 로그 추가
      } catch (error) {
        console.error('프로필 정보를 가져오는 중 오류가 발생했습니다:', error)
      }
    },
    async fetchBerryBalance() {
      try {
        const response = await axios.get(`${this.paymentApi}/payment/my/berry`)
        console.log(response)
        this.berryBalance = response.data.result.balance || 0
      } catch (error) {
        console.error('베리 정보를 가져오는 중 오류가 발생했습니다:', error)
        this.berryBalance = 0
      }
    },
    
    // 모달 관련 메서드
    openEditModal() {
      this.editForm.nickname = this.profileData.memberNickname || '';
      this.editForm.introduction = this.profileData.introduction || '';
      this.editForm.image = null;
      this.previewImage = null;
      
      // 원본 데이터 저장 (변경 감지용)
      this.originalForm = {
        nickname: this.editForm.nickname,
        introduction: this.editForm.introduction
      };
      
      this.editModalOpen = true;
    },
    
    closeEditModal() {
      this.editModalOpen = false;
    },
    
    handleImageChange(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      // 이미지 파일만 허용
      if (!file.type.match('image.*')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      
      this.editForm.image = file;
      
      // 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onload = e => {
        this.previewImage = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    
    // 닉네임 유효성 검사
    validateNickname(nickname) {
      // 길이 검사 (2-15자)
      if (nickname.length < 2 || nickname.length > 15) {
        this.nicknameError = '닉네임은 2자 이상 15자 이하로 입력해주세요.';
        return false;
      }
      
      // 특수문자 검사
      const regex = /^[가-힣a-zA-Z0-9]*$/;
      if (!regex.test(nickname)) {
        this.nicknameError = '닉네임은 특수문자를 포함할 수 없습니다.';
        return false;
      }
      
      // 모든 검사 통과
      this.nicknameError = '';
      return true;
    },
    
    // 자기소개 유효성 검사
    validateIntroduction(introduction) {
      if (introduction && (introduction.length < 2 || introduction.length > 30)) {
        this.introError = '자기소개는 2자 이상 30자 이하로 입력해주세요.';
        return false;
      }
      
      this.introError = '';
      return true;
    },
    
    async updateProfile() {
      // 닉네임 유효성 검사
      if (!this.validateNickname(this.editForm.nickname)) {
        return;
      }
      
      // 자기소개 유효성 검사
      if (!this.validateIntroduction(this.editForm.introduction)) {
        return;
      }
      
      try {
        const formData = new FormData();
        
        // 변경된 항목만 FormData에 추가
        if (this.editForm.nickname !== this.originalForm.nickname) {
          formData.append('nickname', this.editForm.nickname);
        }
        
        if (this.editForm.introduction !== this.originalForm.introduction) {
          formData.append('introduction', this.editForm.introduction);
        }
        
        if (this.editForm.image) {
          formData.append('image', this.editForm.image);
        }
        
        // 폼데이터 내용 디버깅
        for (let pair of formData.entries()) {
          console.log(pair[0] + ': ' + pair[1]);
        }
        
        // 프로필 업데이트 API 호출
        const response = await axios.patch(`${this.memberApi}/member/change/profile`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('프로필 업데이트 응답:', response.data); // 디버깅용 로그 추가
        
        if (response.data) {
          // 모달 닫기 전에 타이머 설정
          setTimeout(async () => {
            // 프로필 데이터 다시 불러오기
            await this.fetchProfileData();
            
            // 성공 시 모달 닫기
            this.closeEditModal();
          }, 500); // 0.5초 딜레이
        }
      } catch (error) {
        console.error('프로필 업데이트 중 오류가 발생했습니다:', error);
        alert('프로필 업데이트에 실패했습니다. 다시 시도해주세요.');
      }
    }
  }
}
</script>

<style scoped>
.profile-wrapper {
  width: 100%;
  background-color: #141517;
  color: white;
  min-height: calc(100vh - 60px); /* 헤더 높이를 뺀 전체 화면 높이 */
}

.profile-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 50vh; /* 푸터를 아래로 밀기 위한 추가 공간 */
}

.profile-title {
  font-size: 32px;
  font-weight: 500;
  padding: 20px 0 10px 15px;
}

.purple-text {
  color: #B084CC;
}

.white-text {
  color: #FFFFFF;
}

.profile-info-section {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 15px 20px;
  position: relative;
}

.profile-avatar {
  flex-shrink: 0;
}

.avatar-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: #e6d7ff;
  object-fit: cover;
}

.profile-details {
  flex-grow: 1;
}

.username {
  font-size: 28px;
  font-weight: 500;
  margin-bottom: 5px;
  color: #FFFFFF;
}

.introduction {
  font-size: 14px;
  color: #aaa;
  margin: 0 0 10px 0;
}

.edit-profile-btn {
  text-transform: none;
  font-weight: 500;
  height: 36px;
  border-radius: 20px;
  padding: 0 16px;
  position: absolute;
  right: 15px;
  top: calc(50% - 18px);
}

.divider {
  height: 1px;
  background-color: #222;
  margin: 0;
}

.profile-stats {
  display: flex;
  flex-direction: column; /* 세로 배치 */
  padding: 0 15px;
}

.stat-item {
  padding: 20px 0; /* 간격 조정 */
}

.stat-label {
  font-size: 18px; /* 더 키움 */
  color: #FFFFFF; /* 색상 변경 */
  margin-bottom: 10px;
  font-weight: 500;
}

.stat-value {
  font-size: 24px; /* 더 키움 */
  font-weight: 600;
  color: #FFFFFF; /* 색상 변경 */
}

.stat-unit {
  font-weight: 400; /* 단위 부분 굵기 감소 */
  font-size: 20px; /* 단위 부분 크기 감소 */
}

.spacer {
  height: 50vh; /* 스크롤이 필요하도록 추가 공간 확보 */
}

/* 프로필 편집 모달 스타일 */
.profile-edit-modal {
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

.modal-content {
  padding: 20px;
}

.profile-image-edit {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.profile-image-container {
  position: relative;
  width: 120px;
  height: 120px;
}

.edit-avatar-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #e6d7ff;
}

.image-upload-label {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: #b084cc;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.upload-icon {
  color: white;
  font-size: 18px;
}

.image-upload-input {
  display: none;
}

.input-group {
  margin-bottom: 20px;
}

.input-label {
  font-size: 14px;
  color: #aaa;
  margin-bottom: 8px;
}

.profile-input, .profile-textarea {
  width: 100%;
  padding: 12px;
  background-color: #333;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
}

.profile-textarea {
  min-height: 80px;
  resize: none;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid #333;
}

.submit-btn {
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

.error-message {
  color: #ff5252;
  font-size: 12px;
  margin-top: 4px;
}

.char-count {
  font-size: 12px;
  color: #aaa;
  text-align: right;
  margin-top: 4px;
}

.char-count.error {
  color: #ff5252;
}
</style>