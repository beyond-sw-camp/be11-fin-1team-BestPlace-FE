<template>
  <div>
    <div v-if="lastDonation" class="donation-container">
      <img src="https://ssl.pstatic.net/static/nng/glive/icon/chat_donation_01.png" alt="후원 아이콘" class="donation-icon" />
      <div class="donation-display">
        <div class="donation-info">
          <p class="donation-message">
            <span class="donation-sender">{{ lastDonation.sender }}</span>님이 
            <span class="donation-amount">{{ lastDonation.amount }}</span>원을 후원하셨습니다.
          </p>
          <p v-if="lastDonation.message" class="donation-user-message">{{ lastDonation.message }}</p>
        </div>
      </div>
    </div>
    
    <!-- 테스트용 입력폼 -->
    <!-- <div class="test-panel">
      <h3>테스트 도구</h3>
      <div class="test-form">
        <div class="input-group">
          <label for="testSender">닉네임:</label>
          <input type="text" id="testSender" v-model="testSender" placeholder="닉네임 입력">
        </div>
        <div class="input-group">
          <label for="testAmount">후원 금액:</label>
          <input type="number" id="testAmount" v-model="testAmount" placeholder="금액 입력">
        </div>
        <div class="input-group">
          <label for="testMessage">메시지:</label>
          <input type="text" id="testMessage" v-model="testMessage" placeholder="메시지 입력">
        </div>
        <button class="test-button" @click="createTestDonation">후원 테스트</button>
        <button class="test-button multi-test" @click="createMultipleTestDonations">연속 후원 테스트</button>
      </div>
      <div class="test-info">
        <p>이 테스트 도구는 개발용으로, 실제 웹소켓을 통해 전송되지 않습니다.</p>
      </div>
    </div> -->
  </div>
</template>

<script>
import axios from 'axios';
import SockJS from 'sockjs-client';
import Stomp from 'webstomp-client';

export default {
  name: 'ChatDonation',
  data() {
    return {
      stompClient: null,
      isConnected: false,
      streamId: null,
      streamInfo: {
        streamId: null,
        memberId: null,
        streamKey: '',
        title: '',
        roomId: null,
        minDonation: 0,
        adultYn: '',
        category: '',
        hashTag: [],
        managerRole: '',
        startTime: '',
        viewerCount: 0
      },
      messages: [],
      lastDonation: null,
      lastDonationMessage: '',
      speechSynthesis: null,
      currentUtterance: null,
      timeoutId: null,
      
      // 큐 시스템 변수 추가
      donationQueue: [],
      isProcessingQueue: false,
      
      // 테스트용 데이터
      testSender: '테스트닉네임',
      testAmount: 1000,
      testMessage: '감사합니다! 앞으로도 좋은 방송 부탁드려요~'
    };
  },
  async mounted() {
    // URL에서 streamId 가져오기
    this.streamId = this.$route.params.streamId || null;
    
    // 음성 합성 초기화
    this.speechSynthesis = window.speechSynthesis;
    
    if (this.streamId) {
      await this.initializeChat();
    } else {
      console.error('스트림 ID가 없습니다.');
    }
  },
  beforeUnmount() {
    this.disconnectWebSocket();
    
    // 음성 합성 중지
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
    
    // 타이머 정리
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  },
  methods: {
    async initializeChat() {
      try {
        // 1. 스트리밍 정보 가져오기
        const streamInfoLoaded = await this.getStreamInfo();
        if (!streamInfoLoaded) {
          console.error('스트리밍 정보를 불러오지 못했습니다.');
          return;
        }
        
        console.log('스트리밍 정보 확인:', this.streamInfo);
        
        // 2. 웹소켓 연결 (로그인 상태와 관계없이 가능)
        if (this.streamInfo.roomId) {
          this.connectWebsocket();
        } else {
          console.error('룸 ID가 없습니다.');
        }
      } catch (error) {
        console.error('초기화 중 오류 발생:', error);
      }
    },
    
    async getStreamInfo() {
      try {
        const streamingApi = process.env.VUE_APP_STREAMING_API;
        const response = await axios.get(`${streamingApi}/streaming/streamInfo/${this.streamId}`);
        if (response.data && response.data.result) {
          this.streamInfo = response.data.result;
          console.log('스트리밍 정보 로드 성공:', this.streamInfo);
          return true;
        } else {
          console.error('스트리밍 정보가 없습니다:', response.data);
          return false;
        }
      } catch (error) {
        console.error('스트리밍 정보 로드 실패:', error);
        return false;
      }
    },
    
    connectWebsocket() {
      if (this.stompClient && this.stompClient.connected) return;

      const streamingApi = process.env.VUE_APP_STREAMING_API;
      const sockJs = new SockJS(`${streamingApi}/connect`);
      this.stompClient = Stomp.over(sockJs);
      this.stompClient.debug = () => {};

      this.stompClient.connect({}, () => {
        console.log('WebSocket 연결 성공');
        this.isConnected = true;

        this.stompClient.subscribe(`/topic/${this.streamInfo.roomId}`, (message) => {
          try {
            const parsed = JSON.parse(message.body);
            console.log('수신된 메시지:', parsed);
            
            // 메시지 저장
            this.messages.push(parsed);
            
            // CHAT_DONATION 타입 메시지만 처리
            if (parsed.type === "CHAT_DONATION") {
              // 메시지 로그는 이미 위에서 출력됨
              this.addToDonationQueue(parsed);
            }
          } catch (err) {
            console.error('메시지 파싱 실패:', err);
          }
        });
      }, (err) => {
        console.error('WebSocket 연결 실패:', err);
        this.isConnected = false;

        // 3초 뒤 재연결
        setTimeout(() => {
          console.log('WebSocket 재연결 시도 중...');
          this.connectWebsocket();
        }, 3000);
      });
    },
    
    disconnectWebSocket() {
      if (this.stompClient && this.stompClient.connected) {
        this.stompClient.disconnect(() => {
          console.log('WebSocket 연결 종료');
          this.isConnected = false;
        });
      }
    },
    
    // 큐에 후원 메시지 추가
    addToDonationQueue(message) {
      // 콘솔 로그 주석 처리 (이미 메시지 수신 시 로그가 출력됨)
      // console.log('후원 메시지 큐에 추가:', message);
      this.donationQueue.push(message);
      
      // 큐 처리중이 아니면 처리 시작
      if (!this.isProcessingQueue) {
        this.processNextDonation();
      }
    },
    
    // 큐에서 다음 후원 메시지 처리
    processNextDonation() {
      if (this.donationQueue.length === 0) {
        this.isProcessingQueue = false;
        return;
      }
      
      this.isProcessingQueue = true;
      const nextDonation = this.donationQueue.shift();
      this.handleDonationMessage(nextDonation);
    },
    
    handleDonationMessage(message) {
      // 이전 타이머 정리
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      
      // 이전 발화 중지
      if (this.currentUtterance) {
        this.speechSynthesis.cancel();
      }
      
      // 후원 메시지 처리
      const fullMessage = message.message;
      const donationPattern = /(.+)님이 (\d+)원을 후원하셨습니다\.(.*)/;
      const match = fullMessage.match(donationPattern);
      
      let senderName = message.sender;
      let donationAmount = 1000;
      let actualMessage = '';
      
      if (match && match.length >= 4) {
        senderName = match[1]; // 닉네임
        donationAmount = parseInt(match[2]); // 후원 금액
        actualMessage = match[3] || ''; // 실제 메시지 (없을 수도 있음)
      }
      
      // 후원 정보 저장
      this.lastDonation = {
        sender: senderName,
        amount: donationAmount,
        message: actualMessage.trim(), // 메시지 공백 제거
        timestamp: new Date()
      };
      
      // 화면에 표시할 메시지 설정 (TTS 읽기용)
      this.lastDonationMessage = `${senderName}님이 ${donationAmount}원을 후원하셨습니다. ${actualMessage}`;
      
      // TTS로 메시지 읽기
      this.speakMessage(this.lastDonationMessage);
    },
    
    speakMessage(text) {
      if (!this.speechSynthesis) return;
      
      // 이전 음성 중지
      this.speechSynthesis.cancel();
      
      // 새 음성 생성
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      // 발화 종료 후 메시지 제거 이벤트 추가
      utterance.onend = () => {
        console.log('TTS 발화 완료');
        // TTS가 끝나면 3초 후 메시지 제거 및 다음 메시지 처리
        this.timeoutId = setTimeout(() => {
          console.log('후원 메시지 제거');
          this.lastDonation = null;
          this.lastDonationMessage = '';
          this.currentUtterance = null;
          
          // 다음 메시지 처리
          this.processNextDonation();
        }, 3000);
      };
      
      // 현재 발화 저장
      this.currentUtterance = utterance;
      
      // 음성 합성 시작
      this.speechSynthesis.speak(utterance);
      console.log('TTS 발화 시작');
    },
    
    // 테스트용 후원 메시지 생성
    createTestDonation() {
      const now = new Date();
      const formattedTime = now.toISOString().replace('T', ' ').substring(0, 19);
      
      // 실제 CHAT_DONATION 메시지 형식을 모방한 가상 메시지 생성
      const mockDonationMessage = {
        messageId: Math.floor(Math.random() * 1000),
        roomId: this.streamInfo.roomId || 1,
        memberId: 999,
        sender: this.testSender || '테스트닉네임',
        message: `${this.testSender || '테스트닉네임'}님이 ${this.testAmount || 1000}원을 후원하셨습니다.${this.testMessage ? this.testMessage : ''}`,
        type: 'CHAT_DONATION',
        createdTime: formattedTime
      };
      
      console.log('테스트 후원 메시지 생성:', mockDonationMessage);
      
      // 큐에 추가
      this.addToDonationQueue(mockDonationMessage);
    },
    
    // 여러 개의 테스트 메시지 연속 생성
    createMultipleTestDonations() {
      // 첫 번째 메시지 생성
      this.createTestDonation();
      
      // 두 번째 메시지 - 다른 사용자
      setTimeout(() => {
        const mockDonation2 = {
          messageId: Math.floor(Math.random() * 1000),
          roomId: this.streamInfo.roomId || 1,
          memberId: 998,
          sender: '다른테스터',
          message: `다른테스터님이 2000원을 후원하셨습니다.감사합니다! 열심히 응원할게요!`,
          type: 'CHAT_DONATION',
          createdTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        this.addToDonationQueue(mockDonation2);
      }, 500);
      
      // 세 번째 메시지 - 또 다른 사용자
      setTimeout(() => {
        const mockDonation3 = {
          messageId: Math.floor(Math.random() * 1000),
          roomId: this.streamInfo.roomId || 1,
          memberId: 997,
          sender: '응원자123',
          message: `응원자123님이 5000원을 후원하셨습니다.오늘 방송 너무 재밌어요! 다음에 또 봬요~`,
          type: 'CHAT_DONATION',
          createdTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        this.addToDonationQueue(mockDonation3);
      }, 1000);
    }
  }
};
</script>

<style scoped>
h1 {
  text-align: center;
  margin: 20px 0;
}

.donation-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 20px auto;
  max-width: 960px;
  animation: fadeIn 0.5s ease-in-out;
}

.donation-icon {
  width: 576px;
  height: 324px;
  margin-bottom: -30px;
  z-index: 2;
}

.donation-display {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px;
  background-color: transparent;
  border-radius: 10px;
  width: 100%;
  position: relative;
  z-index: 1;
}

.donation-info {
  flex: 1;
  text-align: center;
}

.donation-message {
  color: white;
  font-size: 22px;
  margin: 0 0 10px 0;
  word-break: break-word;
  padding: 0 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7), 
               0 0 10px rgba(0, 0, 0, 0.5);
}

.donation-user-message {
  color: white;
  font-size: 20px;
  margin: 0 auto;
  word-break: break-word;
  padding: 0 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7),
               0 0 10px rgba(0, 0, 0, 0.5);
  width: 600px;
  max-width: 100%;
}

.donation-sender, .donation-amount {
  color: #ffdc5e;
  font-weight: bold;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 테스트 도구 스타일 */
.test-panel {
  max-width: 500px;
  margin: 30px auto;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.test-panel h3 {
  color: #333;
  margin-top: 0;
  margin-bottom: 15px;
  text-align: center;
}

.test-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.input-group label {
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.input-group input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.test-button {
  padding: 12px;
  background-color: #8a4fff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 10px;
}

.test-button:hover {
  background-color: #7a3ff0;
}

.test-button.multi-test {
  background-color: #5a5a5a;
  margin-top: 10px;
}

.test-button.multi-test:hover {
  background-color: #4a4a4a;
}

.test-info {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #ddd;
  font-size: 12px;
  color: #777;
  text-align: center;
}
</style>


