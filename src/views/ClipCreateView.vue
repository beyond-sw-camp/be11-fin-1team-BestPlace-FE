<template>
  <div class="clip-create-container">
    <div class="clip-header">
      <h1>클립 만들기</h1>
    </div>

    <div class="clip-content">
      <div class="video-section">
        <div class="video-container">
          <video
            ref="video"
            :controls="false"
            width="100%"
            @click="togglePlay"
          ></video>
          <div class="video-controls">
            <div class="progress-bar" @click="handleProgressBarClick">
              <div class="progress" :style="{ width: `${progress}%` }"></div>
            </div>
            <div class="control-buttons">
              <button @click="togglePlay">
                {{ isPlaying ? '일시정지' : '재생' }}
              </button>
              <div class="time-display">
                {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
              </div>
            </div>
          </div>
        </div>
        <div class="trim-container">
          <div class="time-display">
            <div class="time-start">시작: {{ formatTime(clipStartTime) }}</div>
            <div class="time-duration">길이: {{ formatTime(clipEndTime - clipStartTime) }}</div>
            <div class="time-end">종료: {{ formatTime(clipEndTime) }}</div>
          </div>
          <div class="trim-track">
            <div 
              class="trim-selection"
              :style="{ 
                left: (clipStartTime / video?.duration * 100) + '%',
                width: ((clipEndTime - clipStartTime) / video?.duration * 100) + '%'
              }"
            >
              <div class="trim-handle left" @mousedown="startDrag('start', $event)"></div>
              <div class="trim-handle right" @mousedown="startDrag('end', $event)"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="clip-form">
        <div class="form-group">
          <label>클립 제목</label>
          <input 
            v-model="clipTitle" 
            type="text" 
            placeholder="클립 제목을 입력하세요"
            maxlength="100"
          />
          <span class="char-count">{{ clipTitle.length }}/100</span>
        </div>
        <div class="clip-buttons">
          <button class="cancel-button" @click="goBack">취소</button>
          <button 
            class="create-button" 
            @click="createClip"
            :disabled="!isClipValid || isLoading"
          >
            <span v-if="!isLoading">클립 만들기</span>
            <span v-else class="loading-spinner"></span>
          </button>
        </div>
      </div>
    </div>

    <!-- 클립 생성 완료 모달 -->
    <v-dialog v-model="showSuccessModal" max-width="400" content-class="community-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">클립 생성 완료</div>
          <v-btn icon @click="closeSuccessModal" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="modal-content">
          <div class="message-container success-container">
            <v-icon icon="mdi-check-circle" color="#B084CC" size="x-large" class="message-icon"></v-icon>
            <div class="message-text">
              <p>클립이 성공적으로 생성되었습니다.</p>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <div class="button-group">
            <v-btn 
              color="#B084CC" 
              class="confirm-btn" 
              @click="closeSuccessModal"
            >
              확인
            </v-btn>
          </div>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const video = ref(null)
const vodId = route.params.vodId
const memberApi = process.env.VUE_APP_MEMBER_API
const token = ref(localStorage.getItem('token'))

// 클립 관련 상태
const clipTitle = ref('')
const clipStartTime = ref(0)
const clipEndTime = ref(0)
const isDragging = ref(false)
const dragType = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)

// VOD 정보
const vodInfo = ref({
  id: null,
  url: '',
  title: '',
  duration: 0
})

const isLoading = ref(false)

// 클립 생성 완료 모달 관련 상태 추가
const showSuccessModal = ref(false)

// VOD 정보 가져오기
const getVodInfo = async () => {
  try {
    const response = await axios.get(`${memberApi}/video/vod/${vodId}`, {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })

    if (response.data && response.data.result) {
      vodInfo.value = response.data.result
      initializeVideo()
    }
  } catch (error) {
    console.error('VOD 정보 로드 실패:', error)
  }
}

// 비디오 초기화
const initializeVideo = () => {
  const el = video.value
  if (!el || !vodInfo.value.url) return

  el.src = vodInfo.value.url
  el.addEventListener('loadedmetadata', () => {
    duration.value = el.duration
    // 초기 클립 범위 설정 (현재 시점 ±15초)
    const initialTime = el.duration / 2
    el.currentTime = initialTime
    clipStartTime.value = Math.max(0, initialTime - 15)
    clipEndTime.value = Math.min(el.duration, initialTime + 15)
  })

  el.addEventListener('timeupdate', () => {
    currentTime.value = el.currentTime
    progress.value = (el.currentTime / el.duration) * 100
  })
}

// 시간 포맷팅
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 드래그 관련 함수
const startDrag = (type) => {
  isDragging.value = true
  dragType.value = type
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
}

const handleDrag = (event) => {
  if (!isDragging.value || !video.value) return
  
  const container = document.querySelector('.trim-track')
  if (!container) return
  
  const rect = container.getBoundingClientRect()
  const position = (event.clientX - rect.left) / rect.width
  const time = Math.max(0, Math.min(video.value.duration, position * video.value.duration))
  
  if (dragType.value === 'start') {
    if (time < clipEndTime.value - 1) {
      clipStartTime.value = time
      video.value.currentTime = time
    }
  } else {
    if (time > clipStartTime.value + 1) {
      clipEndTime.value = time
      video.value.currentTime = time
    }
  }
  
  // 최대 길이 제한 (120초)
  const duration = clipEndTime.value - clipStartTime.value
  if (duration > 120) {
    if (dragType.value === 'start') {
      clipStartTime.value = clipEndTime.value - 120
    } else {
      clipEndTime.value = clipStartTime.value + 120
    }
  }
}

const stopDrag = () => {
  isDragging.value = false
  dragType.value = null
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 클립 생성 유효성 검사
const isClipValid = computed(() => {
  return clipTitle.value.trim() !== '' && 
         clipEndTime.value > clipStartTime.value && 
         (clipEndTime.value - clipStartTime.value) <= 120
})

// 클립 생성
const createClip = async () => {
  if (isLoading.value) return
  
  try {
    isLoading.value = true
    await axios.post(`${memberApi}/video/clip/create`, {
      vodId: vodId,
      title: clipTitle.value.trim(),
      start: Math.floor(clipStartTime.value),
      end: Math.floor(clipEndTime.value)
    }, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    
    showSuccessModal.value = true
  } catch (error) {
    console.error('클립 생성 실패:', error)
    alert('클립 생성에 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

// 모달 닫기 함수
const closeSuccessModal = () => {
  showSuccessModal.value = false
  window.close()
}

// 뒤로 가기
const goBack = () => {
  router.back()
}

// 재생/일시정지 토글
const togglePlay = () => {
  const el = video.value
  if (!el) return

  if (el.paused) {
    el.play()
    isPlaying.value = true
  } else {
    el.pause()
    isPlaying.value = false
  }
}

// 프로그레스 바 클릭 처리
const handleProgressBarClick = (event) => {
  const el = video.value
  if (!el) return

  const rect = event.target.getBoundingClientRect()
  const ratio = (event.clientX - rect.left) / rect.width
  const newTime = ratio * el.duration
  
  el.currentTime = newTime
}

onMounted(() => {
  getVodInfo()
})
</script>

<style scoped>
.clip-create-container {
  width: 90%;
  min-width: 600px;
  max-width: 1000px;
  min-height: 80vh;
  margin: 0 auto;
  padding: 2%;
  color: #fff;
  background: #000;
}

.clip-header {
  margin-bottom: 2%;
}

.clip-header h1 {
  font-size: 1.5em;
  font-weight: 600;
  margin: 0;
}

.video-container {
  width: 100%;
  padding-top: 56.25%; /* 16:9 비율 */
  background: #000;
  margin-bottom: 2%;
  position: relative;
}

video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 2%;
  opacity: 0;
  transition: opacity 0.3s;
}

.video-container:hover .video-controls {
  opacity: 1;
}

.progress-bar {
  width: 100%;
  height: 0.3em;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 0.15em;
  cursor: pointer;
  margin-bottom: 1%;
}

.progress {
  height: 100%;
  background: #B084CC;
  border-radius: 2px;
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 2%;
}

.control-buttons button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5em 1em;
  font-size: 0.9em;
}

.time-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5%;
  color: #7B7B7B;
  font-size: 0.9em;
}

.time-start {
  text-align: left;
  flex: 1;
}

.time-duration {
  text-align: center;
  flex: 1;
}

.time-end {
  text-align: right;
  flex: 1;
}

.trim-container {
  padding: 2%;
  background: #1A1A1A;
  border-radius: 0.5em;
  margin-bottom: 2%;
}

.trim-track {
  position: relative;
  height: 0.3em;
  background: #2D2D2D;
  border-radius: 0.15em;
  margin: 3% 0;
}

.trim-selection {
  position: absolute;
  height: 100%;
  background: #B084CC;
  border-radius: 2px;
}

.trim-handle {
  position: absolute;
  top: 50%;
  width: 0.75em;
  height: 1.5em;
  background: #B084CC;
  transform: translateY(-50%);
  cursor: ew-resize;
  border-radius: 0.15em;
}

.trim-handle.left {
  left: -6px;
}

.trim-handle.right {
  right: -6px;
}

.clip-form {
  padding: 2%;
  background: #1A1A1A;
  border-radius: 0.5em;
}

.form-group {
  position: relative;
  margin-bottom: 3%;
}

.form-group label {
  display: block;
  margin-bottom: 1%;
  font-size: 0.9em;
  color: #7B7B7B;
}

.form-group input {
  width: 100%;
  padding: 1em;
  background: #2D2D2D;
  border: 1px solid #3D3D3D;
  border-radius: 0.3em;
  color: #fff;
  font-size: 1em;
}

.form-group input:focus {
  outline: none;
  border-color: #B084CC;
}

.char-count {
  position: absolute;
  right: 1em;
  top: 2.5em;
  font-size: 0.8em;
  color: #7B7B7B;
}

.clip-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1em;
}

.cancel-button {
  padding: 0.8em 2em;
  background: #2D2D2D;
  color: white;
  border: none;
  border-radius: 0.3em;
  cursor: pointer;
  font-size: 0.9em;
}

.create-button {
  position: relative;
  min-width: 100px;
  padding: 0.8em 2em;
  background: #B084CC;
  color: black;
  border: none;
  border-radius: 0.3em;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.create-button:disabled {
  background: #2D2D2D;
  color: #7B7B7B;
  cursor: not-allowed;
  opacity: 0.7;
  transform: scale(0.98);
}

.create-button:not(:disabled):hover {
  background: #C19AD6;
  transform: scale(1.02);
}

.create-button:not(:disabled):active {
  transform: scale(0.98);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 모달 스타일 */
.community-modal {
  background: transparent !important;
  box-shadow: none !important;
  display: flex;
  align-items: flex-start !important;
  padding-top: 50px;
  padding-bottom: 50px;
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
  color: #aaa;
}

.modal-content {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
  width: 100%;
}

.message-container {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: rgba(176, 132, 204, 0.1);
  border-radius: 8px;
  width: 100%;
}

.message-icon {
  margin-right: 16px;
}

.message-text {
  font-size: 16px;
  line-height: 1.5;
  color: #fff;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid #333;
}

.confirm-btn {
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  width: 100%;
}

.button-group {
  display: flex;
  width: 100%;
}
</style> 