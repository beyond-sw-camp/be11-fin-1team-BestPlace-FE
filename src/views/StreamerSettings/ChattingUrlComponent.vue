<template>
  <div class="chzzk-chat-wrapper">
    <div class="chzzk-chat-container" ref="chatContainer">
      <div v-if="displayMessages.length === 0" class="empty-chat">
        <div class="empty-chat-text">방송이 시작되면 채팅이 표시됩니다.</div>
      </div>
      <div
        v-for="message in displayMessages"
        :key="message.messageId"
        class="chat-message"
      >
        <div class="message-content">
          <span class="username" :style="getUsernameColor(message.sender)">{{ message.sender }}</span>
          <span class="message-text">{{ message.message }}</span>
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
  name: 'ChattingUrlComponent',
  data() {
    return {
      messages: [],
      maxMessages: 10, // 최대 10개의 메시지만 보여줌
      stompClient: null,
      isConnected: false,
      roomId: null,
      memberId: null,
      userNickname: '',
      colors: [
        '#FF5E5B', '#D8315B', '#1EA896', '#3E92CC', '#C3BD78', 
        '#7768AE', '#FFB400', '#4AAB95', '#FF7A5A', '#7AC74F',
        '#00A5E0', '#8A4FFF', '#FF9505', '#9A348E', '#0077B6'
      ]
    };
  },
  computed: {
    // 표시할 메시지만 반환
    displayMessages() {
      // 배열의 마지막 maxMessages 개수만큼만 반환
      return this.messages.slice(-this.maxMessages);
    }
  },
  async created() {
    // body 클래스 설정 - 투명 배경을 위해
    document.body.classList.add('transparent-bg');
    
    const token = localStorage.getItem('token');
    if (token) {
      const payload = jwtDecode(token);
      this.memberId = payload.sub;
      this.userNickname = payload.nickname;
    }
    
    // URL 파라미터에서 roomId 추출
    this.roomId = this.$route.params.roomId;
    
    if (this.roomId) {
      await this.getChatHistory();
      await this.connectWebsocket();
    }
  },
  methods: {
    async getChatHistory() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_STREAMING_API}/chat/history/${this.roomId}`);
        if (Array.isArray(response.data)) {
          // 최대 maxMessages 개수만큼만 가져오기
          this.messages = response.data.slice(-this.maxMessages);
          // 메시지 로드 후 맨 아래로 스크롤
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        }
      } catch (error) {
        console.error('채팅 기록 불러오기 실패:', error);
      }
    },
    
    async connectWebsocket() {
      if (!this.roomId) {
        console.error('룸 ID가 없습니다.');
        return;
      }

      const sockJs = new SockJS(`${process.env.VUE_APP_STREAMING_API}/connect`);
      this.stompClient = Stomp.over(sockJs);
      this.stompClient.debug = () => {};

      this.stompClient.connect({}, () => {
        console.log('WebSocket 연결 성공');
        this.isConnected = true;

        this.stompClient.subscribe(`/topic/${this.roomId}`, (message) => {
          try {
            const parsed = JSON.parse(message.body);
            this.messages.push(parsed);
            
            // 메시지 개수가 maxMessages를 초과하면 오래된 메시지 제거
            if (this.messages.length > this.maxMessages * 2) {
              this.messages = this.messages.slice(-this.maxMessages);
            }
            
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
    
    scrollToBottom() {
      this.$nextTick(() => {
        const chatContainer = this.$refs.chatContainer;
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      });
    },
    
    // 사용자 이름에 대한 일관된 색상 반환
    getUsernameColor(username) {
      // 간단한 해시 함수로 사용자 이름을 숫자로 변환
      const hash = username.split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0);
      
      // 색상 배열에서 사용자 이름에 해당하는 색상 선택
      const colorIndex = hash % this.colors.length;
      return { color: this.colors[colorIndex] };
    }
  },
  beforeUnmount() {
    // 클래스 제거
    document.body.classList.remove('transparent-bg');
    
    // 컴포넌트 언마운트 시 연결 해제
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.disconnect();
    }
  }
};
</script>

<style scoped>
.chzzk-chat-wrapper {
  width: 100%;
  height: auto;
  max-height: 400px; /* 높이 줄임 - 약 10줄 정도 보이도록 */
  background-color: transparent;
  padding: 0;
  margin: 0;
  overflow: hidden;
  display: flex;
  justify-content: flex-start;
}

.chzzk-chat-container {
  height: auto;
  max-height: 400px; /* 높이 줄임 */
  width: 100%;
  max-width: 320px; /* 너비를 절반 정도로 줄임 */
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px; /* 채팅 간 간격 6px */
  align-items: flex-start;
}

.empty-chat {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px; /* 높이 줄임 */
  width: 100%;
}

.empty-chat-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px; /* 글자 크기 16px로 조정 */
}

.chat-message {
  padding: 8px 12px;
  word-break: break-word;
  font-size: 16px; /* 글자 크기 16px로 조정 */
  line-height: 1.5;
  letter-spacing: -0.3px;
  border-radius: 18px; /* 모서리 더 둥글게 */
  margin-bottom: 0;
  transition: background-color 0.2s;
  animation: fadeIn 0.2s ease-out;
  background-color: rgba(0, 0, 0, 0.5); /* 어두운 배경 추가 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); /* 입체감을 위한 그림자 추가 */
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5); /* 텍스트 그림자 추가 */
  align-self: flex-start; /* 메시지 왼쪽 정렬 */
  max-width: 95%; /* 최대 너비 제한 */
  width: 100%; /* 너비 설정 추가 */
  box-sizing: border-box; /* 패딩을 너비에 포함 */
}

.message-content {
  display: block; /* 블록 요소로 변경 */
  width: 100%;
  gap: 5px; /* 줄바꿈 시 간격 5px */
}

.username {
  font-weight: 600;
  white-space: nowrap;
  font-size: 16px; /* 사용자 이름 글자 크기 16px로 조정 */
  display: inline; /* 인라인 요소로 변경 - 한 줄에 표시 */
}

.username::after {
  content: ": ";
  color: rgba(255, 255, 255, 0.7);
  margin-right: 2px; /* 이름과 메시지 사이 간격 */
}

.message-text {
  color: #ffffff;
  word-break: break-word; /* 단어 단위로 줄바꿈 */
  font-size: 16px; /* 메시지 텍스트 글자 크기 16px로 조정 */
  display: inline; /* 인라인 요소로 변경 - 이름 옆에 표시 */
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

<style>
/* 전역 스타일 */
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

body.transparent-bg {
  background-color: transparent !important;
}

.chzzk-chat-container::-webkit-scrollbar {
  width: 0;
}

.chzzk-chat-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style> 