<template>
  <div class="broadcast-page">
    <div class="broadcast-container">
      <div class="stream-section">
        <!-- 비디오 화면 -->
        <div class="video-container">
          <video ref="video" autoplay muted playsinline width="100%"></video>
          <div v-if="!isStreaming" class="stream-placeholder">
            <div class="placeholder-content">
              <div class="placeholder-icon">
                <v-icon size="64">mdi-video-off</v-icon>
              </div>
              <div class="placeholder-text">방송 시작 전입니다.</div>
              <div class="placeholder-subtext">아래에서 방송 정보를 설정하고 방송을 시작하세요.</div>
            </div>
          </div>
        </div>

        <!-- 방송 정보 설정 폼 -->
        <div class="broadcast-settings">
          <h2 class="settings-title">방송 정보 설정</h2>
          
          <div class="form-group">
            <label>방송 제목 *</label>
            <v-text-field
              v-model="title"
              placeholder="방송 제목을 입력하세요"
              variant="outlined"
              counter="100"
              maxlength="100"
              density="comfortable"
              bg-color="#1e2029"
              color="primary"
            ></v-text-field>
          </div>
          
          <div class="form-group">
            <label>카테고리 *</label>
            <v-select
              v-model="category"
              :items="categories"
              placeholder="카테고리 선택"
              variant="outlined"
              bg-color="#1e2029"
              color="primary"
            ></v-select>
          </div>
          
          <div class="form-group">
            <label>태그</label>
            <v-combobox
              v-model="tags"
              chips
              closable-chips
              multiple
              placeholder="태그를 입력하고 엔터 키를 누르세요"
              variant="outlined"
              counter="5"
              hint="최대 5개까지 입력 가능합니다"
              bg-color="#1e2029"
              color="primary"
            ></v-combobox>
          </div>
          
          <div class="form-group">
            <label>미리보기 이미지</label>
            <div class="thumbnail-upload">
              <div class="thumbnail-preview" @click="triggerFileUpload">
                <img v-if="thumbnailPreview" :src="thumbnailPreview" alt="미리보기" />
                <div v-else class="upload-placeholder">
                  <v-icon size="48">mdi-image-plus</v-icon>
                  <div class="upload-text">이미지 업로드</div>
                </div>
              </div>
              <input 
                type="file" 
                ref="fileInput" 
                @change="handleFileUpload" 
                accept="image/*" 
                style="display: none"
              />
              <div class="thumbnail-hint">이미지 권장 비율: 16:9 (1280x720)</div>
            </div>
          </div>
          
          <div class="button-group">
            <v-btn 
              color="primary" 
              size="large" 
              block 
              @click="startStream"
              :loading="isStarting"
              :disabled="!title || !category"
            >
              방송 시작하기
            </v-btn>
          </div>
        </div>
      </div>

      <!-- 채팅 섹션 -->
      <div class="chat-section">
        <div class="chat-header">
          <span class="chat-title">실시간 채팅</span>
          <div class="chat-info">
            <span class="chat-count">{{ messages.length }}</span>
          </div>
        </div>
        <div class="chat-messages" ref="chatContainer">
          <div v-if="messages.length === 0" class="empty-chat">
            <div class="empty-chat-text">방송이 시작되면 채팅이 표시됩니다.</div>
          </div>
          <div
            v-for="message in messages"
            :key="message.messageId"
            class="chat-message"
          >
            <span class="sender">{{ message.sender }}</span>
            <span class="message-content">{{ message.message }}</span>
          </div>
        </div>
        <div class="chat-input">
          <input
            v-model="newMessage"
            @keyup.enter="sendMessage"
            placeholder="채팅을 입력하세요"
            :disabled="!isStreaming || !isConnected"
          />
          <button @click="sendMessage" :disabled="!isStreaming || !isConnected">전송</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import SockJS from 'sockjs-client';
import Stomp from 'webstomp-client';

export default {
  data() {
    return {
      // 스트리밍 상태
      isStreaming: false,
      isStarting: false,
      streamKey: '',
      streamId: null,
      roomId: null,
      
      // 스트리밍 정보
      title: '',
      category: null,
      tags: [],
      thumbnailFile: null,
      thumbnailPreview: null,
      
      // 채팅 관련
      messages: [],
      newMessage: '',
      stompClient: null,
      isConnected: false,
      
      // 사용자 정보
      memberId: null,
      userNickname: '',
      
      // 카테고리 목록
      categories: [
        '게임', '토크', '음악', '스포츠', '요리', '여행', '교육', '라이프스타일'
      ]
    };
  },
  async created() {
    // 사용자 정보 가져오기
    const token = localStorage.getItem('token');
    if (token) {
      const payload = jwtDecode(token);
      this.memberId = payload.sub;
      this.userNickname = payload.nickname;
    }
  },
  methods: {
    // 파일 업로드 함수
    triggerFileUpload() {
      this.$refs.fileInput.click();
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB 이하여야 합니다.');
        return;
      }
      
      this.thumbnailFile = file;
      
      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        this.thumbnailPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    
    // 방송 시작 함수
    async startStream() {
      if (!this.title || !this.category) {
        alert('방송 제목과 카테고리는 필수입니다.');
        return;
      }
      
      this.isStarting = true;
      
      try {
        // 폼 데이터 생성
        const formData = new FormData();
        formData.append('title', this.title);
        formData.append('category', this.category);
        
        if (this.tags.length > 0) {
          this.tags.forEach(tag => {
            formData.append('tags', tag);
          });
        }
        
        if (this.thumbnailFile) {
          formData.append('thumbnail', this.thumbnailFile);
        }
        
        // API 호출하여 스트리밍 생성
        const response = await axios.post(
          `${process.env.VUE_APP_STREAMING_API}/streaming/start`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        // 응답에서 필요한 정보 추출
        const result = response.data.result;
        this.streamId = result.streamId;
        this.streamKey = result.streamKey;
        this.roomId = result.roomId;
        
        // 채팅방 연결
        this.connectWebsocket();
        
        // 스트리밍 상태 변경
        this.isStreaming = true;
        
        // 알림 표시
        alert('방송이 시작되었습니다. OBS와 같은 스트리밍 소프트웨어에서 다음 스트림 키를 사용하세요: ' + this.streamKey);
        
      } catch (error) {
        console.error('방송 시작 실패:', error);
        alert('방송 시작에 실패했습니다: ' + (error.response?.data?.message || error.message));
      } finally {
        this.isStarting = false;
      }
    },
    
    // 웹소켓 연결 함수
    connectWebsocket() {
      if (!this.roomId) return;
      
      const sockJs = new SockJS(`${process.env.VUE_APP_STREAMING_API}/connect`);
      this.stompClient = Stomp.over(sockJs);
      this.stompClient.debug = () => {};
      
      this.stompClient.connect({}, () => {
        console.log('WebSocket 연결 성공');
        this.isConnected = true;
        
        this.stompClient.subscribe(`/topic/${this.roomId}`, (message) => {
          try {
            const parsed = JSON.parse(message.body);
            this.messages.push({
              messageId: parsed.messageId,
              roomId: parsed.roomId,
              memberId: parsed.memberId,
              message: parsed.message,
              sender: parsed.sender,
              type: parsed.type,
              createdTime: parsed.createdTime
            });
            this.scrollToBottom();
          } catch (err) {
            console.error('메시지 파싱 실패:', err);
          }
        });
      }, (err) => {
        console.error('WebSocket 연결 실패:', err);
        this.isConnected = false;
      });
    },
    
    // 메시지 전송 함수
    sendMessage() {
      if (!this.newMessage.trim() || !this.isConnected || !this.roomId) return;
      
      const messagePayload = {
        message: this.newMessage,
        type: 'TALK'
      };
      
      this.stompClient.send(
        `/publish/${this.roomId}`,
        JSON.stringify(messagePayload),
        {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'content-type': 'application/json'
        }
      );
      
      this.newMessage = '';
    },
    
    // 채팅 스크롤 아래로 이동
    scrollToBottom() {
      this.$nextTick(() => {
        const chatContainer = this.$refs.chatContainer;
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      });
    }
  },
  beforeUnmount() {
    // 컴포넌트 언마운트 시 연결 해제
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.disconnect();
    }
  }
};
</script>

<style scoped>
.broadcast-page {
  width: 100%;
  background: #0f0f0f;
  color: #fff;
  min-height: 100vh;
}

.broadcast-container {
  display: flex;
  max-width: 1800px;
  margin: 0 auto;
  height: calc(100vh - 64px);
}

.stream-section {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.video-container {
  width: 100%;
  position: relative;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  padding-top: 56.25%; /* 16:9 비율 */
}

.video-container video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.stream-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #141517;
}

.placeholder-content {
  text-align: center;
  padding: 24px;
}

.placeholder-icon {
  margin-bottom: 16px;
  color: #666;
}

.placeholder-text {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.placeholder-subtext {
  font-size: 16px;
  color: #999;
}

.broadcast-settings {
  margin-top: 24px;
}

.settings-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.thumbnail-upload {
  margin-top: 8px;
}

.thumbnail-preview {
  width: 320px;
  height: 180px;
  background: #1e2029;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  border: 2px dashed #333;
}

.thumbnail-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  text-align: center;
  color: #777;
}

.upload-text {
  margin-top: 12px;
  font-size: 14px;
}

.thumbnail-hint {
  font-size: 12px;
  color: #777;
  margin-top: 4px;
}

.button-group {
  margin-top: 32px;
}

/* 채팅 섹션 스타일 */
.chat-section {
  width: 360px;
  background: #141517;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #222;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #222;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-title {
  font-size: 14px;
  font-weight: 600;
}

.chat-count {
  font-size: 13px;
  color: #888;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.empty-chat {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-chat-text {
  color: #777;
  font-size: 14px;
  text-align: center;
}

.chat-message {
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.sender {
  color: #727cf5;
  font-weight: 600;
  margin-right: 6px;
}

.message-content {
  color: #eee;
}

.chat-input {
  padding: 12px;
  border-top: 1px solid #222;
  display: flex;
  gap: 8px;
}

.chat-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #2d2d2d;
  border-radius: 4px;
  background: #1e1e1e;
  color: #fff;
  font-size: 13px;
}

.chat-input input:focus {
  outline: none;
  border-color: #727cf5;
}

.chat-input button {
  padding: 8px 16px;
  background: #727cf5;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.chat-input button:hover {
  background: #5a67d8;
}

.chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 스크롤바 스타일 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #2d2d2d;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #3d3d3d;
}
</style>
  