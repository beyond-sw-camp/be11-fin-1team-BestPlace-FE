<template>
  <div>
    <div class="mission-list">
      <div v-for="(mission, index) in missionsList" :key="mission.messageId" class="mission-donation-container">
        <!-- 미션 상태에 따라 다른 내용 표시 -->
        <div v-if="mission.status === 'pending'" class="mission-animation">
          <h2 class="mission-title">미션 등록!!</h2>
        </div>
        <div v-if="mission.status === 'rejected'" class="mission-animation">
          <h2 class="mission-title mission-rejected">미션 거절!!</h2>
        </div>
        <div v-if="mission.status === 'failed'" class="mission-animation">
          <h2 class="mission-title mission-failed">미션 실패!!</h2>
        </div>
        <div v-if="mission.status === 'done'" class="mission-animation">
          <h2 class="mission-title mission-done">미션 성공!!</h2>
        </div>
        
        <div class="mission-card" :class="{
          'accepted': mission.status === 'accepted',
          'failed': mission.status === 'failed',
          'done': mission.status === 'done'
        }">
          <div class="mission-header">
            <div class="mission-sender-info">{{ mission.sender }}</div>
            <div class="mission-info-right">
              <div class="mission-amount">🍒{{ formatAmount(mission.amount) }}베리</div>
              <div class="timer-display">
                <span class="timer-label">제한시간</span>
                <span class="timer-countdown">
                  {{ mission.status === 'accepted' ? formatTime(mission.remainingAcceptedTime) : formatTime(mission.remainingTime) }}
                </span>
              </div>
            </div>
          </div>
          <div class="mission-content">{{ mission.mission }}</div>
          
          <!-- 미션 상태에 따른 버튼 표시 -->
          <div v-if="mission.status === 'pending'" class="mission-buttons">
            <button class="accept-button" @click="acceptMission(mission, index)">수락</button>
            <button class="reject-button" @click="rejectMission(mission, index)">거절</button>
          </div>
          
          <!-- 수락 상태일 때만 성공 버튼 표시 -->
          <div v-if="mission.status === 'accepted'" class="mission-complete-button">
            <button class="complete-button" @click="updateMissionStatus(mission, index)">미션 성공</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 테스트용 입력폼 -->
    <div class="test-panel">
      <h3>테스트 도구</h3>
      <div class="test-form">
        <div class="input-group">
          <label for="testSender">닉네임:</label>
          <input type="text" id="testSender" v-model="testSender" placeholder="닉네임 입력">
        </div>
        <div class="input-group">
          <label for="testAmount">제한시간(분):</label>
          <input type="number" id="testAmount" v-model="testAmount" placeholder="제한시간(분) 입력">
        </div>
        <div class="input-group">
          <label for="testDonation">후원금액:</label>
          <input type="number" id="testDonation" v-model="testDonation" placeholder="후원금액 입력">
        </div>
        <div class="input-group">
          <label for="testMission">미션 내용:</label>
          <input type="text" id="testMission" v-model="testMission" placeholder="미션 내용 입력">
        </div>
        <button class="test-button" @click="createTestMission">미션 테스트</button>
        <button class="test-button multi-test" @click="createMultipleTestMissions">연속 미션 테스트</button>
      </div>
      <div class="test-info">
        <p>이 테스트 도구는 개발용으로, 실제 웹소켓을 통해 전송되지 않습니다.</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import SockJS from 'sockjs-client';
import Stomp from 'webstomp-client';

export default {
  name: 'MissonDonation',
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
      lastMissionDonation: null,
      lastMissionMessage: '',
      speechSynthesis: null,
      currentUtterance: null,
      timeoutId: null,
      
      // 미션 배열 - 순차적으로 화면에 쌓이는 미션 목록
      missionsList: [],
      
      // 타이머 관련 변수
      timerIntervals: {}, // 각 미션별 타이머 인터벌 보관용
      
      // 테스트용 데이터
      testSender: '테스트닉네임',
      testAmount: 10,
      testDonation: 10000,
      testMission: '푸쉬업 10개 해주세요!',

      paymentApi: process.env.VUE_APP_PAYMENT_API
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
    
    // 모든 미션의 타이머 업데이트를 위한 전역 인터벌 설정
    this.startGlobalTimer();
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
    
    // 모든 타이머 인터벌 정리
    this.clearAllTimers();
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
            
            // 메시지 타입에 따라 처리
            switch (parsed.type) {
              case "MISSION_DONATION":
                // 미션 등록 처리
                this.handleMissionMessage(parsed);
                break;
              case "MISSION_Accept":
                // 미션 수락 처리
                this.handleMissionAccept(parsed);
                break;
              case "MISSION_Cancel":
                // 미션 거절 처리
                this.handleMissionCancel(parsed);
                break;
              case "MISSION_Success":
                // 미션 성공 처리
                this.handleMissionSuccess(parsed);
                break;
              default:
                // 다른 타입의 메시지는 무시
                break;
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
    
    handleMissionMessage(message) {
      // 이전 발화 중지
      if (this.currentUtterance) {
        this.speechSynthesis.cancel();
      }
      
      // 메시지 처리
      // memberId는 제한시간(초)로 사용
      // roomId는 후원금액으로 사용
      // 닉네임은 sender 필드에서 가져옴
      // 메시지는 message 필드에서 가져옴
      
      // 미션 정보 생성 (고유 ID 확보)
      const missionId = message.messageId || `mission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 제한시간 처리: memberId에서 초 단위로 가져옴
      // 10분(600초) 기본값
      const timeLimitSeconds = parseInt(message.memberId) || 600;
      
      // 금액은 roomId에서 가져옴 (기본값 10000)
      const amount = parseInt(message.roomId) || 10000;
      
      // 새 미션 객체 생성
      const newMission = {
        id: missionId,
        messageId: message.messageId,
        sender: message.sender,
        amount: amount, // 후원금액 (roomId 필드 사용)
        mission: message.message, // 미션 내용
        timestamp: new Date(),
        remainingTime: 600, // 10분 = 600초 (대기 상태에서는 항상 10분)
        status: 'pending', // 'pending', 'accepted', 'rejected', 'expired'
        originalLimitSeconds: timeLimitSeconds, // 원래 제한시간(초) 저장
        remainingAcceptedTime: timeLimitSeconds // 수락 시 사용할 제한시간(초)
      };
      
      // 미션 목록에 추가
      this.missionsList.push(newMission);
      
      // 화면에 표시할 메시지 설정 (TTS 읽기용)
      this.lastMissionMessage = `${message.sender}님이 ${newMission.amount}원으로 미션을 등록하셨습니다. ${message.message}`;
      
      // TTS로 메시지 읽기
      this.speakMessage(this.lastMissionMessage);
    },
    
    // 전역 타이머 시작 - 모든 미션의 남은 시간을 1초마다 갱신
    startGlobalTimer() {
      setInterval(() => {
        // 모든 미션 순회하며 시간 갱신
        this.missionsList.forEach((mission, index) => {
          // 이미 완료(성공/실패) 또는 거절된 미션은 10초 후에 제거
          if (mission.status === 'rejected' || mission.status === 'failed' || mission.status === 'done') {
            if (mission.removalCountdown === undefined) {
              mission.removalCountdown = 10;
            } else if (mission.removalCountdown > 0) {
              mission.removalCountdown--;
            } else {
              // 10초 지난 후 제거
              this.missionsList.splice(index, 1);
            }
            return;
          }
          
          // 수락된 미션은 원래 시간으로 카운트다운
          if (mission.status === 'accepted') {
            if (mission.remainingAcceptedTime > 0) {
              mission.remainingAcceptedTime--;
            } else {
              // 시간이 다 된 미션은 API만 호출하고 상태는 변경하지 않음
              // (웹소켓 메시지를 통해 상태 변경이 이루어질 것임)
              this.autoRejectMission(mission);
            }
            return;
          }
          
          // 대기 중인 미션의 시간 갱신
          if (mission.status === 'pending' && mission.remainingTime > 0) {
            mission.remainingTime--;
          } else if (mission.status === 'pending') {
            // 시간 다 된 미션은 API만 호출하고 상태는 변경하지 않음
            // (웹소켓 메시지를 통해 상태 변경이 이루어질 것임)
            this.autoRejectMission(mission);
          }
        });
      }, 1000);
    },
    
    // 자동 거절 처리 - 이제 API 호출만 처리
    async autoRejectMission(mission) {
      try {
        // API 호출 없이 직접 상태 변경
        const index = this.missionsList.findIndex(m => m.messageId === mission.messageId);
        if (index !== -1) {
          this.missionsList[index].status = 'failed';
          this.missionsList[index].removalCountdown = 10;
        }
      } catch (error) {
        console.error('미션 자동 거절 처리 실패:', error);
      }
    },
    
    
    // 모든 타이머 제거
    clearAllTimers() {
      Object.values(this.timerIntervals).forEach(interval => {
        clearInterval(interval);
      });
      this.timerIntervals = {};
    },
    
    // 시간 형식 변환 (초 -> MM:SS)
    formatTime(seconds) {
      // 시간이 없는 경우 기본값 반환
      if (seconds === undefined || seconds === null) return '00:00';
      
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    },
    
    // 금액 형식 변환 (1000 -> 1,000)
    formatAmount(amount) {
      return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    // 미션 수락 - 이제 API 호출만 처리
    async acceptMission(mission, index) {
      try {
        // API 호출만 수행 (상태 변경은 웹소켓 메시지로 처리)
        const response = await axios.post(`${this.paymentApi}/payment/mission/done/approve?missionId=${mission.messageId}`);
        console.log('미션 수락 요청 완료:', response.data.result.balance);
        // 웹소켓 메시지를 통해 상태 변경이 이루어질 것임
      } catch (error) {
        console.error('미션 수락 요청 실패:', error);
      }
    },
    
    // 미션 거절 - 이제 API 호출만 처리
    async rejectMission(mission, index) {
      try {
        // API 호출만 수행 (상태 변경은 웹소켓 메시지로 처리)
        const response = await axios.post(`${this.paymentApi}/payment/mission/done/cancel?missionId=${mission.messageId}`);
        console.log('미션 거절 요청 완료:', response.data.result.balance);
        // 웹소켓 메시지를 통해 상태 변경이 이루어질 것임
      } catch (error) {
        console.error('미션 거절 요청 실패:', error);
      }
    },
    
    // 미션 성공 - 이제 API 호출만 처리
    async updateMissionStatus(mission, index) {
      try {
        // API 호출만 수행 (상태 변경은 웹소켓 메시지로 처리)
        const response = await axios.post(`${this.paymentApi}/payment/mission/done/success?missionId=${mission.messageId}`);
        console.log('미션 성공 요청 완료:', response.data.result.balance);
        // 웹소켓 메시지를 통해 상태 변경이 이루어질 것임
      } catch (error) {
        console.error('미션 성공 요청 실패:', error);
      }
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
      
      // 발화 종료 후 이벤트 추가
      utterance.onend = () => {
        console.log('TTS 발화 완료');
      };
      
      // 현재 발화 저장
      this.currentUtterance = utterance;
      
      // 음성 합성 시작
      this.speechSynthesis.speak(utterance);
      console.log('TTS 발화 시작');
    },
    
    // 테스트용 미션 메시지 생성
    createTestMission() {
      const now = new Date();
      const formattedTime = now.toISOString().replace('T', ' ').substring(0, 19);
      
      // 실제 MISSION_DONATION 메시지 형식을 모방한 가상 메시지 생성
      const mockMissionMessage = {
        messageId: Math.floor(Math.random() * 1000),
        roomId: this.testDonation || 10000, // 후원금액
        memberId: this.testAmount * 60 || 600, // 제한시간(초)
        sender: this.testSender || '테스트닉네임',
        message: this.testMission || '푸쉬업 10개 해주세요!',
        type: 'MISSION_DONATION',
        createdTime: formattedTime
      };
      
      console.log('테스트 미션 메시지 생성:', mockMissionMessage);
      
      // 미션 처리
      this.handleMissionMessage(mockMissionMessage);
    },
    
    // 여러 개의 테스트 메시지 연속 생성
    createMultipleTestMissions() {
      // 첫 번째 메시지 생성
      this.createTestMission();
      
      // 두 번째 메시지 - 다른 사용자
      setTimeout(() => {
        const mockMission2 = {
          messageId: Math.floor(Math.random() * 1000),
          roomId: 5000, // 5,000원
          memberId: 5 * 60, // 5분 = 300초
          sender: '미션테스터',
          message: '노래 한 소절 불러주세요!',
          type: 'MISSION_DONATION',
          createdTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        this.handleMissionMessage(mockMission2);
      }, 500);
      
      // 세 번째 메시지 - 또 다른 사용자
      setTimeout(() => {
        const mockMission3 = {
          messageId: Math.floor(Math.random() * 1000),
          roomId: 30000, // 30,000원
          memberId: 15 * 60, // 15분 = 900초
          sender: '미션킹123',
          message: '물구나무서기 도전!',
          type: 'MISSION_DONATION',
          createdTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        this.handleMissionMessage(mockMission3);
      }, 1000);
    },
    
    // 미션 수락 처리 (웹소켓 메시지)
    handleMissionAccept(message) {
      // messageId를 기준으로 미션 찾기
      const index = this.missionsList.findIndex(m => m.messageId === message.messageId);
      if (index === -1) {
        console.log(`미션 ID ${message.messageId}를 찾을 수 없습니다.`);
        return;
      }
      
      // 찾은 미션
      const mission = this.missionsList[index];
      
      // 미션 상태 업데이트
      mission.status = 'accepted';
      
      // 수락된 미션은 원래의 제한시간으로 설정
      mission.remainingAcceptedTime = mission.originalLimitSeconds;
      console.log(`미션 수락: 원래 제한시간 ${mission.originalLimitSeconds}초로 설정`);
    },
    
    // 미션 거절 처리 (웹소켓 메시지)
    handleMissionCancel(message) {
      // messageId를 기준으로 미션 찾기
      const index = this.missionsList.findIndex(m => m.messageId === message.messageId);
      if (index === -1) {
        console.log(`미션 ID ${message.messageId}를 찾을 수 없습니다.`);
        return;
      }
      
      // 찾은 미션
      const mission = this.missionsList[index];
      
      // 미션 상태 업데이트
      mission.status = 'rejected';
      
      // 거절된 미션은 10초 후에 제거하기 위한 카운트다운 시작
      mission.removalCountdown = 10;
    },
    
    // 미션 성공 처리 (웹소켓 메시지)
    handleMissionSuccess(message) {
      // messageId를 기준으로 미션 찾기
      const index = this.missionsList.findIndex(m => m.messageId === message.messageId);
      if (index === -1) {
        console.log(`미션 ID ${message.messageId}를 찾을 수 없습니다.`);
        return;
      }
      
      // 찾은 미션
      const mission = this.missionsList[index];
      
      // 미션 상태 업데이트
      mission.status = 'done';
      
      // 성공 후 10초 후에 제거하기 위한 카운트다운 시작
      mission.removalCountdown = 10;
    }
  }
};
</script>

<style scoped>
h1 {
  text-align: center;
  margin: 20px 0;
}

.mission-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 100%;
  align-items: center;
}

.mission-donation-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 10px auto;
  max-width: 768px; /* 20% 작게 (원래 960px) */
  width: 80%;
}

.mission-animation {
  margin-bottom: 10px;
  animation: zoomInOut 1s ease-in-out;
}

.mission-title {
  color: #FF5E5B;
  font-size: 38px; /* 20% 작게 (원래 48px) */
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 94, 91, 0.7);
  text-align: center;
}

.mission-title.mission-rejected {
  color: #F44336;
  text-shadow: 0 0 10px rgba(244, 67, 54, 0.7);
}

.mission-title.mission-failed {
  color: #F44336;
  text-shadow: 0 0 10px rgba(244, 67, 54, 0.7);
}

.mission-title.mission-done {
  color: #4CAF50;
  text-shadow: 0 0 10px rgba(76, 175, 80, 0.7);
}

.mission-card {
  width: 100%;
  background-color: rgba(30, 30, 30, 0.9);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.5s ease-in-out;
  transition: all 0.3s ease;
}

.mission-card.accepted {
  background-color: rgba(40, 60, 40, 0.9);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.mission-card.accepted .mission-amount,
.mission-card.accepted .timer-display {
  background-color: rgba(40, 60, 40, 0.9);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.mission-card.failed {
  background-color: rgba(60, 40, 40, 0.9);
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.mission-card.failed .mission-amount,
.mission-card.failed .timer-display {
  background-color: rgba(60, 40, 40, 0.9);
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.mission-card.done {
  background-color: rgba(40, 80, 40, 0.9);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.mission-card.done .mission-amount,
.mission-card.done .timer-display {
  background-color: rgba(40, 80, 40, 0.9);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.mission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.mission-sender-info {
  font-size: 20px; /* 20% 작게 (원래 24px) */
  color: #FFFFFF;
}

.mission-info-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mission-amount {
  color: #FFFFFF;
  font-size: 18px;
  padding: 4px 8px;
  background-color: rgba(30, 30, 30, 0.9);
  transition: all 0.3s ease;
}

.timer-display {
  background-color: rgba(30, 30, 30, 0.9);
  color: #FFFFFF;
  padding: 4px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
}

.timer-label {
  font-size: 10px; /* 20% 작게 (원래 12px) */
}

.timer-countdown {
  font-size: 14px; /* 20% 작게 (원래 18px) */
}

.mission-content {
  font-size: 29px; /* 20% 작게 (원래 36px) */
  color: white;
  text-align: center;
  margin: 24px 0;
  line-height: 1.4;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  padding: 0 16px;
}

.mission-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
}

.accept-button, .reject-button {
  padding: 10px 24px; /* 20% 작게 (원래 12px 30px) */
  border: none;
  border-radius: 6px;
  font-size: 14px; /* 20% 작게 (원래 18px) */
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.accept-button {
  background-color: #4CAF50;
  color: white;
}

.accept-button:hover {
  background-color: #388E3C;
  transform: scale(1.05);
}

.reject-button {
  background-color: #F44336;
  color: white;
}

.reject-button:hover {
  background-color: #D32F2F;
  transform: scale(1.05);
}

.mission-complete-button {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.complete-button {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  background-color: #4CAF50;
  color: white;
  transition: all 0.2s;
}

.complete-button:hover {
  background-color: #388E3C;
  transform: scale(1.05);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes zoomInOut {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
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
  background-color: #5affff; /* 미션 테마 컬러 */
  color: #333;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 10px;
}

.test-button:hover {
  background-color: #4af0f0;
}

.test-button.multi-test {
  background-color: #5a5a5a;
  color: white;
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
