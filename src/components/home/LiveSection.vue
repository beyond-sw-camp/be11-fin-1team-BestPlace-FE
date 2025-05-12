<template>
    <div class="live-section">
      <div v-if="isLoading" class="loading-container">
        <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
        <p>데이터를 불러오는 중...</p>
      </div>
      
      <div v-else-if="!hasStreams" class="no-streams">
        <p>현재 라이브 방송이 없습니다.</p>
      </div>
      
      <div v-else class="live-content">
        <!-- 메인 스트림 섹션 -->
        <div class="main-stream" @click="goToLiveDetail(mainStream.streamId)">
          <div class="video-container">
            <video
              ref="videoPlayer"
              autoplay
              muted
              playsinline
              class="video-player"
              :class="{
                'blur-thumbnail': shouldBlurThumbnail(mainStream),
                'hide-thumbnail': shouldHideThumbnail(mainStream)
              }"
            ></video>
            
            <!-- 연령 제한 표시 -->
            <div v-if="isAdultContent(mainStream)" class="age-restriction-overlay">
              <div class="age-restriction-content">
                <div class="age-icon-circle">19</div>
                <div class="age-text">연령 제한</div>
              </div>
            </div>
            
            <!-- 비디오 위 오버레이 -->
            <div class="video-overlay">
              <div class="overlay-content">
                <div class="overlay-top">
                  <div class="live-badge">
                    <span class="live-dot"></span>
                    LIVE
                  </div>
                  <div class="viewer-count">
                    {{ mainStream.viewerCount }}명 시청중
                  </div>
                </div>
                
                <div class="overlay-bottom">
                  <h2 class="live-title">{{ mainStream.title }}</h2>
                  <div class="stream-meta">
                    <span class="category">{{ mainStream.category }}</span>
                  </div>
                  <div class="streamer-info">
                    <img :src="mainStream.streamerProfileUrl" class="streamer-profile" alt="Streamer">
                    <span class="streamer-name">{{ mainStream.streamerNickname }}</span>
                  </div>
                  <div class="hashtags" v-if="mainStream.hashTag && mainStream.hashTag.length > 0">
                    <span v-for="tag in mainStream.hashTag" :key="tag" class="hashtag">{{ tag }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 미성년자/비로그인 사용자 알림 모달 -->
      <v-dialog v-model="adultAlertModalOpen" max-width="400" content-class="adult-alert-modal">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-title">연령 제한 컨텐츠</div>
            <v-btn icon @click="closeAdultAlertModal" class="close-btn">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          
          <div class="modal-content">
            <div class="adult-alert-icon">
              <div class="age-icon-circle modal-icon">19</div>
            </div>
            <p class="adult-alert-message" v-if="isLoggedIn">
              미성년자는 이용 불가능한 컨텐츠입니다.
            </p>
            <p class="adult-alert-message" v-else>
              이 컨텐츠는 성인만 이용할 수 있습니다.<br>
              로그인 후 성인인증이 필요합니다.
            </p>
          </div>
          
          <div class="modal-footer">
            <v-btn 
              v-if="!isLoggedIn"
              color="#b084cc" 
              block 
              @click="goToLogin"
              class="submit-btn"
            >
              로그인하기
            </v-btn>
            <v-btn 
              v-else
              color="#b084cc" 
              block 
              @click="closeAdultAlertModal"
              class="submit-btn"
            >
              확인
            </v-btn>
          </div>
        </div>
      </v-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
  import { useRouter } from 'vue-router';
  import axios from 'axios';
  import Hls from 'hls.js';
  import { jwtDecode } from 'jwt-decode';
  
  const streamingApi = process.env.VUE_APP_STREAMING_API
  const router = useRouter();
  
  // 상태 관리
  const streams = ref([]);
  const isLoading = ref(true);
  const currentMainStreamIndex = ref(0);
  const videoPlayer = ref(null);
  const hlsInstance = ref(null);
  const adultAlertModalOpen = ref(false);
  
  // 로그인 및 성인 인증 상태
  const isLoggedIn = ref(false);
  const userIsAdult = ref(false);
  
  // 스트림 정보 계산 속성
  const hasStreams = computed(() => streams.value.length > 0);
  const mainStream = computed(() => hasStreams.value ? streams.value[currentMainStreamIndex.value] : null);
  
  // 로그인 상태 확인
  const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    isLoggedIn.value = !!token;
    
    if (isLoggedIn.value) {
      try {
        const decoded = jwtDecode(token);
        userIsAdult.value = decoded.isAdult === 'Y';
      } catch (error) {
        console.error('토큰 디코딩 중 오류 발생:', error);
        userIsAdult.value = false;
      }
    }
  };
  
  // 스트림 데이터 가져오기
  const fetchStreamData = async () => {
    try {
      isLoading.value = true;
      const response = await axios.get(`${streamingApi}/streaming/list`);
      
      if (response.data.status_code === 200 && response.data.result) {
        streams.value = response.data.result;
        if (streams.value.length > 0) {
          // 첫 번째 스트림을 메인으로 설정
          currentMainStreamIndex.value = 0;
          // 비디오 플레이어 초기화
          setTimeout(() => {
            initializeVideoPlayer();
          }, 500);
        }
      }
    } catch (error) {
      console.error('스트림 데이터 가져오기 실패:', error);
      streams.value = [];
    } finally {
      isLoading.value = false;
    }
  };
  
  // 비디오 플레이어 초기화
  const initializeVideoPlayer = () => {
    if (!mainStream.value || !mainStream.value.streamKey) {
      console.error('스트림 키가 없습니다.');
      return;
    }
    
    // 성인 컨텐츠인 경우 로그인이 안되거나 성인이 아니면 재생 안함
    if (isAdultContent(mainStream.value) && (!isLoggedIn.value || !userIsAdult.value)) {
      return;
    }
    
    const video = videoPlayer.value;
    if (!video) {
      console.error('비디오 요소를 찾을 수 없습니다.');
      return;
    }
    
    // 배포용
    const hlsSrc = `https://hls.bepl.site/hls/${mainStream.value.streamKey}.m3u8`;
    //  로컬용
  // const hlsSrc = `http://localhost:8088/hls/${mainStream.value.streamKey}.m3u8`;
    
    // HLS.js 지원 확인
    if (Hls.isSupported()) {
      if (hlsInstance.value) {
        hlsInstance.value.destroy();
      }
      
      hlsInstance.value = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 5,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 4
      });
      
      hlsInstance.value.attachMedia(video);
      hlsInstance.value.loadSource(hlsSrc);
      
      hlsInstance.value.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('매니페스트 파싱 완료, 재생 시도');
        video.play().catch(err => console.error('비디오 재생 실패:', err));
      });
      
      hlsInstance.value.on(Hls.Events.ERROR, (event, data) => {
        console.warn('HLS 에러 발생:', data);
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('네트워크 에러, 재시도 중...', data);
              hlsInstance.value.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('미디어 에러, 복구 시도 중...', data);
              hlsInstance.value.recoverMediaError();
              break;
            default:
              console.error('복구 불가능한 에러:', data);
              destroyVideoPlayer();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // HLS.js를 지원하지 않는 iOS Safari용
      video.src = hlsSrc;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(err => console.error('비디오 재생 실패:', err));
      });
    } else {
      console.error('HLS를 지원하지 않는 브라우저입니다.');
    }
    
    // 항상 음소거 설정
    video.volume = 0;
    video.muted = true;
  };
  
  // 비디오 플레이어 정리
  const destroyVideoPlayer = () => {
    if (hlsInstance.value) {
      hlsInstance.value.destroy();
      hlsInstance.value = null;
    }
    
    if (videoPlayer.value) {
      videoPlayer.value.removeAttribute('src');
      videoPlayer.value.load();
    }
  };
  
  // 라이브 디테일 페이지로 이동
  const goToLiveDetail = (streamId) => {
    const stream = streams.value.find(s => s.streamId === streamId);
    
    if (stream && isAdultContent(stream) && (!isLoggedIn.value || !userIsAdult.value)) {
      // 성인 컨텐츠이고 로그인하지 않았거나 성인이 아닌 경우, 모달 표시
      adultAlertModalOpen.value = true;
    } else {
      // 아니면 라이브 상세 페이지로 이동
      router.push(`/live/${streamId}`);
    }
  };
  
  // 로그인 페이지로 이동
  const goToLogin = () => {
    router.push('/login');
    closeAdultAlertModal();
  };
  
  // 모달 닫기
  const closeAdultAlertModal = () => {
    adultAlertModalOpen.value = false;
  };
  
  // 성인 콘텐츠 관련 메서드
  const isAdultContent = (stream) => {
    return stream && stream.adultYn === 'Y';
  };
  
  const shouldBlurThumbnail = (stream) => {
    // 성인 컨텐츠이고, 로그인한 사용자가 성인인 경우 흐리게 표시
    return isAdultContent(stream) && isLoggedIn.value && userIsAdult.value;
  };
  
  const shouldHideThumbnail = (stream) => {
    // 성인 컨텐츠이고, 로그인하지 않았거나 성인이 아닌 경우 숨김
    return isAdultContent(stream) && (!isLoggedIn.value || !userIsAdult.value);
  };
  
  // 컴포넌트 마운트 시 데이터 가져오기
  onMounted(() => {
    checkLoginStatus();
    fetchStreamData();
  });
  
  // 컴포넌트 언마운트 시 비디오 플레이어 정리
  onBeforeUnmount(() => {
    destroyVideoPlayer();
  });
  </script>
  
  <style scoped>
  .live-section {
    margin-bottom: 24px;
    width: 90%;
    margin-left: auto;
    margin-right: auto;
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    width: 100%;
  }
  
  .no-streams {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    background-color: #18191c;
    border-radius: 8px;
    color: #fff;
    font-size: 16px;
  }
  
  .live-content {
    display: flex;
    width: 100%;
  }
  
  .main-stream {
    flex: 1;
    min-width: 0;
  }
  
  .video-container {
    position: relative;
    width: 100%;
    padding-top: 33.75%; /* 56.25% * 0.6 = 33.75%, 원래 비율의 60% */
    background-color: #000;
    overflow: hidden;
    cursor: pointer;
    border-radius: 8px;
  }
  
  .video-player {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  /* 비디오 위에 오버레이 */
  .video-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.1) 100%);
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
  }
  
  .overlay-content {
    width: 100%;
    height: 100%;
    padding: 8px 16px 8px 16px; /* 패딩 조정 */
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  
  .overlay-top {
    display: flex;
    align-items: center;
    gap: 8px; /* 간격 줄임 */
  }
  
  .live-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px; /* 1.5배 증가 */
    background-color: #ff3b3b;
    color: white;
    font-size: 18px; /* 1.5배 증가 */
    padding: 3px 15px 3px 9px; /* 1.5배 증가 */
    border-radius: 6px; /* 1.5배 증가 */
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  .live-dot {
    width: 9px; /* 1.5배 증가 */
    height: 9px; /* 1.5배 증가 */
    background: #fff;
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.3; }
    100% { opacity: 1; }
  }
  
  .viewer-count {
    font-size: 21px; /* 1.5배 증가 */
    font-weight: 500;
    color: #ff3b3b;
    letter-spacing: -1px;
  }
  
  .overlay-bottom {
    display: flex;
    flex-direction: column;
    gap: 6px; /* 1.5배 증가 */
  }
  
  .live-title {
    font-size: 27px; /* 1.5배 증가 */
    font-weight: 500;
    margin: 0;
    color: #fff;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.3; /* 약간 증가 */
    word-break: keep-all;
  }
  
  .stream-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  
  .category {
    color: #B084CC;
    font-weight: 500;
    font-size: 21px; /* 1.5배 증가 */
    cursor: pointer;
  }
  
  .streamer-info {
    display: flex;
    align-items: center;
    gap: 9px; /* 1.5배 증가 */
    margin-top: 3px; /* 1.5배 증가 */
  }
  
  .streamer-profile {
    width: 27px; /* 1.5배 증가 */
    height: 27px; /* 1.5배 증가 */
    border-radius: 50%;
    object-fit: cover;
  }
  
  .streamer-name {
    color: #fff;
    font-size: 18px; /* 1.5배 증가 */
    font-weight: 500;
  }
  
  .hashtags {
    display: flex;
    align-items: center;
    gap: 6px; /* 1.5배 증가 */
    flex-wrap: wrap;
    margin-top: 3px; /* 1.5배 증가 */
    max-width: 100%;
  }
  
  .hashtag {
    color: #bfc2c7;
    font-size: 15px; /* 1.5배 증가 */
    font-weight: 500;
    padding: 1.5px 9px; /* 1.5배 증가 */
    background: rgba(0, 0, 0, 0.6);
    border-radius: 4.5px; /* 1.5배 증가 */
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    border: 1px solid #bfc2c7;
    display: inline-flex;
    white-space: nowrap;
  }
  
  /* 성인 컨텐츠 관련 스타일 */
  .blur-thumbnail {
    filter: blur(10px);
  }
  
  .hide-thumbnail {
    visibility: hidden;
  }
  
  .age-restriction-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    z-index: 5;
  }
  
  .age-restriction-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }
  
  .age-icon-circle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;

    color: black;
  }
  
  .age-text {
    color: white;
    font-size: 20px;
    font-weight: 500;
  }
  
  /* 모달 스타일 */
  .modal-container {
    background-color: #1a1a1a;
    border-radius: 8px;
    overflow: hidden;
    color: white;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #333;
  }
  
  .modal-title {
    font-size: 18px;
    font-weight: 500;
  }
  
  .modal-content {
    padding: 30px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  
  .adult-alert-icon {
    margin-bottom: 10px;
  }
  
  .modal-icon {
    width: 80px;
    height: 80px;
    font-size: 36px;
  }
  
  .adult-alert-message {
    text-align: center;
    line-height: 1.5;
    font-size: 16px;
  }
  
  .modal-footer {
    padding: 16px 20px;
    border-top: 1px solid #333;
  }
  
  .submit-btn {
    color: white;
  }
  
  .close-btn {
    color: #aaa;
  }
  </style>
  