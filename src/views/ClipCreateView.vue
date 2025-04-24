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
            :disabled="!isClipValid"
          >
            클립 만들기
          </button>
        </div>
      </div>
    </div>
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
  try {
    await axios.post(`${memberApi}/video/clip/create`, {
      vodId: vodId,
      title: clipTitle.value.trim(),
      start: Math.floor(clipStartTime.value),
      end: Math.floor(clipEndTime.value)
    }, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    
    alert('클립이 생성되었습니다.')
    router.back()
  } catch (error) {
    console.error('클립 생성 실패:', error)
    alert('클립 생성에 실패했습니다.')
  }
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
  width: 800px;
  height: 800px;
  margin: 0 auto;
  padding: 20px;
  color: #fff;
  background: #000;
}

.clip-header {
  margin-bottom: 24px;
}

.clip-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.video-container {
  width: 100%;
  background: #000;
  margin-bottom: 24px;
  position: relative;
}

video {
  width: 100%;
  max-height: 400px;
  object-fit: contain;
}

.video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 16px;
  opacity: 0;
  transition: opacity 0.3s;
}

.video-container:hover .video-controls {
  opacity: 1;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  cursor: pointer;
  margin-bottom: 8px;
}

.progress {
  height: 100%;
  background: #B084CC;
  border-radius: 2px;
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 16px;
}

.control-buttons button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px 8px;
}

.time-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: #7B7B7B;
  font-size: 14px;
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
  padding: 20px;
  background: #1A1A1A;
  border-radius: 8px;
}

.trim-track {
  position: relative;
  height: 4px;
  background: #2D2D2D;
  border-radius: 2px;
  margin: 20px 0;
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
  width: 12px;
  height: 24px;
  background: #B084CC;
  transform: translateY(-50%);
  cursor: ew-resize;
  border-radius: 2px;
}

.trim-handle.left {
  left: -6px;
}

.trim-handle.right {
  right: -6px;
}

.clip-form {
  padding: 20px;
  background: #1A1A1A;
  border-radius: 8px;
}

.form-group {
  position: relative;
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #7B7B7B;
}

.form-group input {
  width: 100%;
  padding: 12px;
  background: #2D2D2D;
  border: 1px solid #3D3D3D;
  border-radius: 4px;
  color: #fff;
  font-size: 16px;
}

.form-group input:focus {
  outline: none;
  border-color: #B084CC;
}

.char-count {
  position: absolute;
  right: 12px;
  top: 40px;
  font-size: 12px;
  color: #7B7B7B;
}

.clip-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-button {
  padding: 8px 24px;
  background: #2D2D2D;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.create-button {
  padding: 8px 24px;
  background: #B084CC;
  color: black;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
}

.create-button:disabled {
  background: #2D2D2D;
  color: #7B7B7B;
  cursor: not-allowed;
}
</style> 