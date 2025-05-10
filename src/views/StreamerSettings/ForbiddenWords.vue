<template>
  <div class="forbidden-words-container">
    <h1 class="page-title">채팅 금칙어 관리</h1>

    <div class="content-area">
      <v-card class="word-input-card">
        <v-card-title class="section-title">금칙어 추가</v-card-title>
        <v-card-text>
          <div class="input-description mb-4">
            방송에서 사용을 금지할 단어를 설정할 수 있습니다. 금칙어가 포함된 채팅은 자동으로 차단됩니다.
          </div>
          
          <div class="input-container">
            <v-text-field
              v-model="newWord"
              label="금칙어 입력"
              placeholder="금칙어를 입력하세요"
              @keyup.enter="addWord"
              :rules="[rules.required]"
              hide-details="auto"
              class="input-field"
            ></v-text-field>
            <v-btn 
              color="primary" 
              @click="addWord"
              :disabled="!newWord.trim()"
              class="add-btn"
            >
              추가
            </v-btn>
          </div>

          <div class="rules-note mt-4">
            <v-icon small class="mr-2" color="warning">mdi-information</v-icon>
            <span>금칙어는 최대 1000개까지 등록할 수 있습니다.</span>
          </div>

          <div class="rules-note">
            <v-icon small class="mr-2" color="warning">mdi-information</v-icon>
            <span>설정한 모든 금칙어를 포함하는 채팅은 전송되지 않습니다.</span>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="words-list-card mt-4">
        <v-card-title class="section-title">
          <span>금칙어 목록</span>
          <span class="word-count">{{ bannedWords.length }}개</span>
        </v-card-title>
        
        <v-card-text class="words-list-container">
          <div v-if="isLoading" class="text-center py-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
          
          <div v-else-if="bannedWords.length === 0" class="empty-list">
            <v-icon size="48" color="grey">mdi-text-box-remove</v-icon>
            <div class="empty-text">등록된 금칙어가 없습니다.</div>
          </div>
          
          <div v-else class="words-list">
            <div v-for="(word, index) in bannedWords" :key="index" class="word-item">
              <span class="word-text">{{ word }}</span>
              <v-btn icon small @click="deleteWord(word)" class="delete-btn">
                <v-icon small>mdi-close</v-icon>
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- 알림 스낵바 -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
          @click="snackbar.show = false"
        >
          닫기
        </v-btn>
      </template>
    </v-snackbar>

    <!-- 금칙어 삭제 확인 Dialog -->
    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card>
        <v-card-title class="delete-dialog-title">금칙어 삭제</v-card-title>
        <v-card-text class="delete-dialog-content">
          <p>정말 <strong>"{{ deleteDialog.word }}"</strong> 금칙어를 삭제하시겠습니까?</p>
        </v-card-text>
        <v-card-actions class="delete-dialog-actions">
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog.show = false">취소</v-btn>
          <v-btn color="error" @click="confirmDelete">삭제</v-btn>
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
      newWord: '',
      bannedWords: [],
      isLoading: false,
      streamerId: null,
      
      // 유효성 검사 규칙
      rules: {
        required: value => !!value.trim() || '금칙어를 입력해주세요.',
      },
      
      // 스낵바 상태
      snackbar: {
        show: false,
        color: '',
        text: ''
      },
      
      // 삭제 확인 다이얼로그 상태
      deleteDialog: {
        show: false,
        word: null
      }
    };
  },
  created() {
    // URL 파라미터에서 스트리머 ID 가져오기
    this.streamerId = this.$route.params.memberId;
    
    if (!this.streamerId) {
      this.showSnackbar('error', '스트리머 정보를 찾을 수 없습니다.');
      return;
    }
    
    // 금칙어 목록 불러오기
    this.loadBannedWords();
  },
  methods: {
    // 금칙어 목록 불러오기
    async loadBannedWords() {
        this.isLoading = true;

        try {
            const url = `${process.env.VUE_APP_STREAMING_API}/banWord/list/${this.streamerId}`;
            const response = await axios.get(url);

            // API 응답 구조 로깅
            console.log('금칙어 API 응답:', response.data);
            
            // 응답 구조에 따라 안전하게 처리
            if (response.data) {
                // 데이터가 있으면 적절한 경로로 접근
                let wordsArray = [];
                
                if (response.data.data) {
                    // response.data.data가 배열인 경우
                    wordsArray = response.data.data;
                } else if (response.data.result) {
                    // response.data.result가 배열인 경우
                    wordsArray = response.data.result;
                } else {
                    // 다른 구조일 수 있으므로 직접 확인 필요
                    console.log('금칙어 데이터 구조 확인 필요:', response.data);
                }
                
                // 배열인지 확인 후 정렬
                if (Array.isArray(wordsArray)) {
                    this.bannedWords = wordsArray.sort((a, b) => a.localeCompare(b, 'ko'));
                } else {
                    this.bannedWords = [];
                    console.error('금칙어 데이터가 배열이 아닙니다:', wordsArray);
                }
            } else {
                this.bannedWords = [];
                console.error('API 응답에 데이터가 없습니다');
            }

        } catch (error) {
            console.error('💥 금칙어 목록을 불러오는 중 오류 발생:', error); 
            this.showSnackbar('error', '금칙어 목록을 불러오는 중 오류가 발생했습니다.');
            this.bannedWords = []; // 오류 발생 시 빈 배열로 초기화
        } finally {
            this.isLoading = false;
        }
    },
    
    // 금칙어 추가하기
    async addWord() {
      if (!this.newWord.trim()) return;
      
      // 중복 검사
      if (this.bannedWords.includes(this.newWord.trim())) {
        this.showSnackbar('warning', '이미 등록된 금칙어입니다.');
        return;
      }
      
      // 개수 제한 검사 (1000개)
      if (this.bannedWords.length >= 1000) {
        this.showSnackbar('error', '금칙어는 최대 1000개까지 등록할 수 있습니다.');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.showSnackbar('error', '로그인이 필요합니다.');
          return;
        }
        
        const memberId = this.getUserIdFromToken(token);
        
        const response = await axios.post(
          `${process.env.VUE_APP_STREAMING_API}/banWord/save/${this.streamerId}`,
          this.newWord.trim(),
          {
            headers: {
              'Content-Type': 'text/plain',
              'X-User-Id': memberId
            }
          }
        );
        
        if (response.status === 200) {
          this.bannedWords.push(this.newWord.trim());
          this.newWord = '';
          this.bannedWords.sort((a, b) => a.localeCompare(b, 'ko'));
          this.showSnackbar('success', '금칙어가 추가되었습니다.');
        }
      } catch (error) {
        console.error('금칙어 추가 중 오류가 발생했습니다:', error);
        if (error.response && error.response.data && error.response.data.message) {
          this.showSnackbar('error', error.response.data.message);
        } else {
          this.showSnackbar('error', '금칙어 추가 중 오류가 발생했습니다.');
        }
      }
    },
    
    // 금칙어 삭제 다이얼로그 표시
    deleteWord(word) {
      this.deleteDialog.word = word;
      this.deleteDialog.show = true;
    },
    
    // 금칙어 삭제 확인
    async confirmDelete() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.showSnackbar('error', '로그인이 필요합니다.');
          return;
        }
        
        const memberId = this.getUserIdFromToken(token);
        
        const response = await axios.delete(
          `${process.env.VUE_APP_STREAMING_API}/banWord/delete/${this.streamerId}`,
          {
            params: {
              word: this.deleteDialog.word
            },
            headers: {
              'X-User-Id': memberId
            }
          }
        );
        
        if (response.status === 200) {
          // 목록에서 제거
          const index = this.bannedWords.indexOf(this.deleteDialog.word);
          if (index !== -1) {
            this.bannedWords.splice(index, 1);
          }
          this.showSnackbar('success', '금칙어가 삭제되었습니다.');
        }
      } catch (error) {
        console.error('금칙어 삭제 중 오류가 발생했습니다:', error);
        if (error.response && error.response.data && error.response.data.message) {
          this.showSnackbar('error', error.response.data.message);
        } else {
          this.showSnackbar('error', '금칙어 삭제 중 오류가 발생했습니다.');
        }
      } finally {
        this.deleteDialog.show = false;
        this.deleteDialog.word = null;
      }
    },
    
    // 스낵바 표시 함수
    showSnackbar(color, text) {
      this.snackbar.color = color;
      this.snackbar.text = text;
      this.snackbar.show = true;
    },
    
    // JWT 토큰에서 사용자 ID 추출
    getUserIdFromToken(token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload).sub;
      } catch (error) {
        console.error('토큰에서 ID를 추출하는 중 오류가 발생했습니다:', error);
        return null;
      }
    }
  }
};
</script>

<style scoped>
.forbidden-words-container {
  padding: 20px 30px;
  max-width: 800px;
  margin: 0 auto;
  color: #fff;
}

.page-title {
  font-size: 24px;
  margin-bottom: 20px;
}

.content-area {
  margin-top: 20px;
}

.word-input-card, .words-list-card {
  background-color: #1e2029;
  border-radius: 10px;
}

.section-title {
  font-size: 18px;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 20px;
}

.word-count {
  font-size: 14px;
  color: #b084cc;
  background-color: rgba(176, 132, 204, 0.1);
  padding: 4px 8px;
  border-radius: 20px;
}

.input-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin-bottom: 20px;
}

.input-container {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.input-field {
  flex: 1;
}

.add-btn {
  align-self: center;
  height: 40px;
}

.rules-note {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin-top: 8px;
}

.words-list-container {
  padding: 20px;
  max-height: 350px;
  overflow-y: auto;
}

.empty-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: rgba(255, 255, 255, 0.5);
}

.empty-text {
  margin-top: 16px;
  font-size: 14px;
}

.words-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.word-item {
  display: flex;
  align-items: center;
  background-color: #2d2e3a;
  border-radius: 20px;
  padding: 8px 12px;
  font-size: 14px;
}

.word-text {
  margin-right: 6px;
}

.delete-btn {
  opacity: 0.7;
}

.delete-btn:hover {
  opacity: 1;
}

.delete-dialog-title {
  color: #fff;
  background-color: #1e2029;
}

.delete-dialog-content {
  background-color: #1e2029;
  color: #fff;
  padding: 24px 20px;
}

.delete-dialog-actions {
  background-color: #1e2029;
  padding: 16px 20px;
}

/* 반응형 조정 */
@media (max-width: 600px) {
  .forbidden-words-container {
    padding: 15px;
  }
  
  .input-container {
    flex-direction: column;
  }
  
  .add-btn {
    width: 100%;
    margin-top: 8px;
  }
  
  .words-list {
    gap: 8px;
  }
}
</style> 