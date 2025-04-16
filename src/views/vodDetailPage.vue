<template>
  <div class="vod-detail-container">
    <div class="stream-content">
      <div class="vod-main">
        <div class="video-section">
          <div class="video-container">
            <video
              ref="video"
              controls
              width="1440"
            ></video>
          </div>
        </div>
      </div>

      <div class="stream-header">
        <div class="stream-info">
          <div class="streamer-info">
            <div class="streamer-avatar"></div>
            <div class="streamer-details">
              <span class="streamer-name">스트리머 이름</span>
              <h1 class="stream-title">{{ vodInfo.title }}</h1>
              <div class="stream-meta">
                <span class="category">{{ vodInfo.category }}</span>
                <div class="hashtags" v-if="vodInfo.hashTags && vodInfo.hashTags.length > 0">
                  <span class="dot"> </span>
                  <span v-for="tag in vodInfo.hashTags" :key="tag" class="hashtag">{{ tag }}</span>
                </div>
                <span class="dot"> </span>
                <span class="viewer-count">{{ vodInfo.views }}회 재생</span>
                <span class="dot"> </span>
                <span class="created-time">{{ formatRelativeTime(vodInfo.createdTime) }}</span>
              </div>
            </div>
          </div>
          <div class="stream-actions">
            <button class="follow-button">
              <span class="plus-icon">+</span>
              팔로우
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-section">
      <div class="chat-header">
        <span class="chat-title">채팅</span>
        <div class="chat-info">
          <span class="chat-count">{{ chatHistory.length }}</span>
        </div>
      </div>
      <div class="chat-messages" ref="chatContainer">
        <div
          v-for="message in visibleMessages"
          :key="message.id"
          class="chat-message"
          :class="{ 'own-message': message.memberId === userId }"
        >
          <span class="sender">{{ message.sender }}</span>
          <span class="message-content">{{ message.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const video = ref(null)
const vodId = route.params.vodId
const streamingApi = process.env.VUE_APP_STREAMING_API
const memberApi = process.env.VUE_APP_MEMBER_API
const token = ref(localStorage.getItem('token'))
const isLogin = ref(false)

// VOD 정보
const vodInfo = ref({
  id: null,
  title: '',
  url: '',
  duration: 0,
  views: 0,
  isAdult: '',
  createdTime: '',
  category: '',
  hashTags: [],
  owner: '',
  roomId: null,
  startTime: ''
})

// 채팅 관련 상태
const visibleMessages = ref([])
const chatHistory = ref([])
const userId = ref(null)

// 토큰 준비 및 사용자 정보 추출
const prepareToken = async () => {
  token.value = localStorage.getItem('token')
  isLogin.value = !!token.value
  
  if (token.value) {
    try {
      // JWT 토큰에서 사용자 정보 추출
      const base64Url = token.value.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      
      const payload = JSON.parse(jsonPayload)
      userId.value = payload.sub
      console.log('사용자 정보:', payload)
    } catch (error) {
      console.error('토큰 파싱 실패:', error)
    }
  }
}

// VOD 정보 가져오기
const getVodInfo = async () => {
  try {
    // 토큰 준비
    await prepareToken()
    
    const response = await axios.get(`${memberApi}/video/vod/${vodId}`, {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })

    if (!response.data || !response.data.result) {
      console.error('VOD 정보가 없습니다:', response.data)
      return false
    }

    // VOD 정보 설정
    vodInfo.value = response.data.result
    
    console.log('VOD 정보:', vodInfo.value)
    console.log('VOD 시작 시간:', new Date(vodInfo.value.startTime).toLocaleString())
    return true

  } catch (error) {
    console.error('VOD 정보 로드 중 오류 발생:', error)
    return false
  }
}

// 채팅 기록 가져오기
const getChatHistory = async () => {
  if (!vodInfo.value.roomId) {
    console.log('roomId가 없어 채팅 기록을 가져오지 않습니다')
    return
  }

  try {
    const response = await axios.get(`${streamingApi}/chat/history/${vodInfo.value.roomId}`, {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })
    
    // 채팅 기록을 정렬하여 저장
    chatHistory.value = response.data
      .map(msg => ({
        ...msg,
        createdTime: msg.createdTime || msg.CreatedTime // 대소문자 구분 없이 처리
      }))
      .sort((a, b) => new Date(a.createdTime) - new Date(b.createdTime))
    
    // 첫 번째 메시지 시간 로깅
    if (chatHistory.value.length > 0) {
      console.log('첫 번째 메시지 시간:', new Date(chatHistory.value[0].createdTime).toLocaleString())
      console.log('VOD 시작 시간:', new Date(vodInfo.value.startTime).toLocaleString())
    }
    
    console.log('정렬된 채팅 기록:', chatHistory.value)
  } catch (error) {
    console.error('채팅 기록 로드 실패:', error)
  }
}

// 비디오 초기화
const initializeVideo = () => {
  const el = video.value
  if (!el) return

  el.src = vodInfo.value.url
  
  // 비디오가 로드되면 초기 메시지 표시
  el.addEventListener('loadedmetadata', () => {
    console.log('비디오 메타데이터 로드 완료')
    updateVisibleMessages()
  })
  
  // 시간 업데이트 이벤트 리스너 추가
  el.addEventListener('timeupdate', () => {
    updateVisibleMessages()
  })
}

// VOD 초기화
const initializeVod = async () => {
  try {
    console.log('VOD 초기화 시작...')
    
    // 1. VOD 정보 가져오기
    const vodInfoSuccess = await getVodInfo()
    if (!vodInfoSuccess) {
      console.error('VOD 정보 로드 실패')
      return
    }
    console.log('VOD 정보 로드 완료:', vodInfo.value)
    
    // 2. 비디오 초기화
    initializeVideo()
    console.log('비디오 초기화 완료')
    
    // 3. 채팅 기록 가져오기
    if (vodInfo.value.roomId) {
      await getChatHistory()
      console.log('채팅 기록 로드 완료')
    } else {
      console.log('roomId가 없어 채팅 기록을 가져오지 않습니다')
    }
    
    // 4. 비디오 이벤트 리스너 설정
    const el = video.value
    if (el) {
      // 비디오가 로드되면 초기 메시지 표시
      el.addEventListener('loadedmetadata', updateVisibleMessages)
      
      // 시간 업데이트 이벤트 리스너 추가
      el.addEventListener('timeupdate', updateVisibleMessages)
      console.log('비디오 이벤트 리스너 설정 완료')
    }
    
    console.log('VOD 초기화 완료')
  } catch (error) {
    console.error('VOD 초기화 실패:', error)
  }
}

// 현재 재생 시간에 맞는 메시지 업데이트
const updateVisibleMessages = () => {
  const el = video.value
  if (!el) return

  const currentTime = el.currentTime
  const vodStartTime = new Date(vodInfo.value.startTime).getTime()
  
  // 유효한 시간 값인지 확인
  if (isNaN(vodStartTime)) {
    console.error('유효하지 않은 VOD 시작 시간:', vodInfo.value.startTime)
    return
  }

  // 현재 시간 이전의 모든 메시지를 필터링
  visibleMessages.value = chatHistory.value.filter(message => {
    // 메시지 시간을 밀리초로 변환
    const messageTime = new Date(message.createdTime).getTime()
    
    // 유효한 시간 값인지 확인
    if (isNaN(messageTime)) {
      console.error('유효하지 않은 메시지 시간:', message.createdTime)
      return false
    }
    
    // 메시지가 VOD 시작 시간 이후이고 현재 재생 시간 이전인지 확인
    const messageOffset = (messageTime - vodStartTime) / 1000 // 초 단위로 변환
    
    // 메시지가 VOD 시작 시간 이후에 보내졌거나, 시작 전에 보내진 메시지는 재생 시작과 함께 표시
    const isWithinTimeRange = messageOffset <= currentTime
    
    return isWithinTimeRange
  })

  // 스크롤을 최신 메시지로 이동
  scrollToBottom()
}

// 스크롤을 최신 메시지로 이동
const scrollToBottom = () => {
  const chatContainer = document.querySelector('.chat-messages')
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight
  }
}

// 상대적 시간 포맷팅
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)
  
  if (diffInSeconds < 60) {
    return '방금 전'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays}일 전`
  }
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`
  }
  
  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears}년 전`
}

onMounted(() => {
  initializeVod()
})
</script>

<style scoped>
.vod-detail-container {
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  background: #000;
  color: #fff;
  position: relative;
  display: flex;
}

.stream-content {
  flex: 1;
  min-width: 0;
  margin-right: 360px;
  display: flex;
  flex-direction: column;
}

.stream-header {
  padding: 20px 24px;
  width: 95%;
  background: #000;
}

.stream-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.streamer-info {
  display: flex;
  gap: 16px;
  flex: 1;
}

.streamer-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #2D2D2D;
  flex-shrink: 0;
}

.streamer-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.streamer-name {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.stream-title {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', '맑은 고딕', 'Noto Sans KR', sans-serif;
}

.stream-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #7B7B7B;
  font-size: 14px;
}

.dot {
  color: #7B7B7B;
}

.category {
  color: #00E693;
  font-weight: 800;
  font-size: 14px;
}

.stream-actions {
  display: flex;
  gap: 12px;
}

.follow-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 4px;
  background: #00FF84;
  color: #000;
  border: none;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.follow-button:hover {
  background: #00E676;
}

.plus-icon {
  font-size: 16px;
  font-weight: 700;
}

.vod-main {
  width: 100%;
}

.video-section {
  position: relative;
  background: #000;
  width: 100%;
}

.video-container {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  background: #000;
}

video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.chat-section {
  background: #0F0F0F;
  height: 100vh;
  display: flex;
  flex-direction: column;
  width: 360px;
  position: fixed;
  right: 0;
  top: 0;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #2D2D2D;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-title {
  font-size: 14px;
  font-weight: 600;
}

.chat-info {
  font-size: 13px;
  color: #7B7B7B;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.chat-message {
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.5;
  opacity: 0;
  animation: fadeIn 0.3s ease-in-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.sender {
  color: #00FF84;
  font-weight: 600;
  margin-right: 6px;
}

.message-content {
  color: #fff;
  word-break: break-all;
}

.hashtags {
  display: flex;
  align-items: center;
  gap: 4px;
}

.hashtag {
  color: #7B7B7B;
  font-size: 14px;
  font-weight: 800;
  padding: 2px 8px;
  background: #1A1A1A;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.hashtag:hover {
  background: #2D2D2D;
}

.viewer-count {
  color: #C9CEDC;
  font-weight: 800;
  font-size: 14px;
}

.created-time {
  color: #7B7B7B;
  font-size: 14px;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #2D2D2D;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #3D3D3D;
}
</style>