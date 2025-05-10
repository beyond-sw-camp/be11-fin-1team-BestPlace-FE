<template>
  <div class="dashboard-container">
    <h1 class="dashboard-title">스트리머 대시보드</h1>

    <div class="custom-row">
      <!-- 왼쪽 컬럼: 방송 시작하기 -->
      <div class="custom-col left-col">
        <v-card class="section-card mb-4">
          <v-card-title class="section-title">방송 시작하기</v-card-title>
          <v-card-text>
            <div class="step-container">
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-text">스트리밍 소프트웨어를 다운로드 하세요.</div>
              </div>

              <div class="software-container">
                <v-card class="software-card" @click="goToOBSWebsite">
                  <img :src="obsLogo" style="height: 80px;" />
                  <div class="software-name text-center">Open Broadcaster Software</div>
                  <v-btn icon class="download-icon">
                    <v-icon>mdi-download</v-icon>
                  </v-btn>
                </v-card>
              </div>
            </div>

            <div class="step-container mt-4">
              <div class="step">
                <div class="step-number">2</div>
                <div class="step-text">스트림 키를 소프트웨어에 넣어 설정하세요.</div>
              </div>
              <div class="stream-key-guide">
                스트림 키는 방송 설정 &gt; 설정 에서 확인할 수 있습니다.
              </div>
            </div>

            <div class="step-container mt-4">
              <div class="step">
                <div class="step-number">3</div>
                <div class="step-text">스트리밍 소프트웨어에서 방송을 시작하면 라이브 방송이 진행됩니다.</div>
              </div>
              <div class="stream-start-guide">
                방송 시작과 동시에 스트리밍 소프트웨어에서 진행해주세요.
              </div>
            </div>

            <div class="broadcast-button-container mt-4">
              <v-btn color="primary" class="broadcast-button" @click="goBroadcast">
                방송하기
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- 오른쪽 컬럼: 방송 정보 설정 가이드 -->
      <div class="custom-col right-col">
        <v-card class="info-card mb-4">
          <v-card-title class="section-title">방송 정보 설정 가이드</v-card-title>
          <v-card-text>
            <div class="guide-container">
              <div class="guide-item">
                <div class="guide-icon">
                  <v-icon size="48" color="primary">mdi-cog</v-icon>
                </div>
                <div class="guide-content">
                  <h3 class="guide-title">방송 정보</h3>
                  <p class="guide-text">매력적인 제목으로 시청자의 관심을 유도해보세요. 시청자가 방송을 찾을 때 사용할 많한 키워드를 넣는 것이 좋습니다.</p>
                </div>
              </div>

              <div class="guide-item mt-4">
                <div class="guide-icon">
                  <v-icon size="48" color="primary">mdi-playlist-check</v-icon>
                </div>
                <div class="guide-content">
                  <h3 class="guide-title">카테고리</h3>
                  <p class="guide-text">방송에 맞는 카테고리를 추가하여 시청자가 쉽게 찾을 수 있게 하세요.</p>
                </div>
              </div>

              <div class="guide-item mt-4">
                <div class="guide-icon">
                  <v-icon size="48" color="primary">mdi-image</v-icon>
                </div>
                <div class="guide-content">
                  <h3 class="guide-title">미리보기 이미지</h3>
                  <p class="guide-text">진행 중인 방송을 설명할 수 있는 시각적 이미지가 좋습니다. 시청자의 관심을 끌거나 이미지가 좋습니다.</p>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- 채팅 설정 카드 분리 -->
        <v-card class="chat-card">
          <v-card-title class="section-title">채팅 설정</v-card-title>
          <v-card-text>
            <div class="settings-description mb-4">
              내 방송 스타일에 맞게 채팅 기능을 설정할 수 있습니다.
            </div>
            <div class="chat-settings-buttons">
              <v-btn color="primary" class="mr-4" @click="goToChatSettings">채팅 설정</v-btn>
              <v-btn color="secondary" @click="goToForbiddenWords">금칙어 설정</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script>
import obsLogo from '@/assets/obsLogo.png';

export default {
  data() {
    return {
      streamerId: null,
      blockList: [],
      memberId: null,
      userNickname: '',
      obsLogo: obsLogo
    };
  },
  created() {
    // URL에서 스트리머 ID 가져오기
    this.streamerId = this.$route.params.memberId;
    
    // 이 ID로 스트리머 관련 데이터 로드
    this.loadStreamerData();
  },
  methods: {
    async loadStreamerData() {
    },
    goToOBSWebsite() {
      window.open('https://obsproject.com/', '_blank');
    },
    goBroadcast() {
        this.$router.push(`/streamer/${this.$route.params.memberId}/doBroadcast`);
    },
    goToChatSettings() {
      this.$router.push('/chat/setting');
    },
    goToForbiddenWords() {
      this.$router.push(`/streamer/${this.$route.params.memberId}/banword`);
    }
  }
};
</script>

<style scoped>
.dashboard-container {
  padding: 12px 0 20px;
  width: 120%; /* 컨테이너 너비 120%로 설정 */
  margin-left: 7%; /* 왼쪽으로 10% 이동 */
}

.custom-row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8px;
  width: 100%;
}

.custom-col {
  padding: 0 8px;
}

.left-col, .right-col {
  width: 50%; /* 기본 너비는 50% */
}

.dashboard-title {
  font-size: 24px;
  margin-bottom: 16px;
  color: #fff;
  padding-left: 4px;
}

.section-card, .info-card, .chat-card {
  border-radius: 10px;
  background-color: #1e2029;
}

.section-title {
  font-size: 20px;
  color: #fff;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.step-container {
  margin-bottom: 16px;
}

.step {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.step-number {
  background-color: #5b47fb;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.step-text {
  font-size: 16px;
  font-weight: 500;
}

.software-container {
  display: flex;
  padding: 16px;
  justify-content: center;
}

.software-card {
  width: 200px;
  height: 180px;
  background-color: #28293d;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.software-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.software-name {
  margin-top: 10px;
  font-weight: 500;
  color: #fff;
}

.download-icon {
  position: absolute;
  bottom: 10px;
  right: 10px;
}

.stream-key-guide, .stream-start-guide {
  padding-left: 34px;
  color: rgba(255, 255, 255, 0.7);
}

.broadcast-button-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.broadcast-button {
  min-width: 200px;
  height: 48px;
  font-size: 16px;
}

.guide-container {
  padding: 10px;
}

.guide-item {
  display: flex;
  align-items: flex-start;
  padding: 10px;
}

.guide-icon {
  margin-right: 16px;
}

.guide-content {
  flex: 1;
}

.guide-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
}

.guide-text {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}

.settings-description {
  color: rgba(255, 255, 255, 0.7);
}

.chat-settings-buttons {
  display: flex;
  
}

/* 태블릿과 모바일에서는 스타일 조정 */
@media (max-width: 960px) {
  .dashboard-container {
    width: 100%;
    margin-left: 0;
    padding: 10px;
  }
  
  .left-col, .right-col {
    width: 100%;
    margin-bottom: 12px;
  }
}
</style>
  