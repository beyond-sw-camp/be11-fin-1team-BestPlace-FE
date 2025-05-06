<template>
  <div v-if="currentClip" class="clip-detail-root" @wheel="onWheel" tabindex="0" @keydown="onKeydown">
    <div class="clip-video-flex-row">
      <transition :name="transitionName" mode="out-in">
        <div class="clip-video-container" :key="currentClip.id">
          <!-- 커스텀 볼륨 컨트롤 -->
          <div class="custom-volume-container" @mouseenter="showVolume = true" @mouseleave="showVolume = false">
            <button class="volume-btn" @click="toggleMute">
              <v-icon>{{ isMuted || volume === 0 ? 'mdi-volume-off' : (volume < 0.5 ? 'mdi-volume-medium' : 'mdi-volume-high') }}</v-icon>
            </button>
            <div v-show="showVolume" class="volume-slider-wrap">
              <input type="range" min="0" max="1" step="0.01" v-model.number="volume" class="volume-slider" orient="vertical" />
            </div>
          </div>
          <video
            ref="videoRef"
            :src="currentClip.url"
            autoplay
            :muted="isMuted"
            :volume="volume"
            class="clip-video"
            @volumechange="onVideoVolumeChange"
            @timeupdate="onVideoTimeUpdate"
          ></video>
          <transition name="play-pause-fade">
            <div v-if="showPlayPauseIcon" class="play-pause-overlay">
              <v-icon :icon="playPauseIcon" class="play-pause-icon"></v-icon>
            </div>
          </transition>
          <div class="progress-bar-wrap">
            <div class="progress-bar-bg">
              <div class="progress-bar-fg" :style="{ width: (progress * 100) + '%' }"></div>
            </div>
          </div>
          <div class="clip-info-overlay">
            <div class="streamer-info">
              <div class="profile-image-wrapper" :class="{ 'is-live': streamerInfo?.streamingYn === 'Y' }">
                <img :src="streamerInfo?.streamerProfileImageUrl" alt="profile" class="profile-image">
                <div v-if="streamerInfo?.streamingYn === 'Y'" class="live-badge">LIVE</div>
              </div>
              <span class="streamer-nickname">{{ streamerInfo?.streamerNickName }}</span>
              <button class="follow-btn" :class="{ 'is-following': streamerInfo?.isFollow === 'Y' }" @click="toggleFollow">
                {{ streamerInfo?.isFollow === 'Y' ? '팔로잉' : '팔로우' }}
              </button>
            </div>
            <div class="clip-title">{{ currentClip.title }}</div>
            <div class="clip-meta-row">
              <span class="category">{{ currentClip.category }}</span>
              <span v-for="tag in currentClip.hashTags" :key="tag" class="hashtag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </transition>
    </div>
    <div class="clip-side-actions">
      <button class="side-btn" @click="toggleLike(currentClip)">
        <v-icon>{{ currentClip.likeYn === 'Y' ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
        <span>{{ currentClip.likeCount }}</span>
      </button>
      <button class="side-btn" @click="showComments">
        <v-icon>mdi-comment-outline</v-icon>
        <span>{{ currentClip.commentCount }}</span>
      </button>
      <button class="side-btn" @click="showMenu">
        <v-icon>mdi-share-variant</v-icon>
      </button>
    </div>
    <div v-if="showCommentPanel" class="comment-panel" @wheel.stop>
      <div class="comment-panel-header">
        <span>댓글</span>
        <button class="comment-panel-close" @click="showCommentPanel = false">×</button>
      </div>
      <div class="comment-input-row">
        <img :src="streamerInfo?.streamerProfileImageUrl" class="comment-profile" />
        <input
          class="comment-input"
          placeholder="댓글 추가..."
          v-model="newComment"
          @keyup.enter="createComment"
        />
        <button class="comment-submit-btn" @click="createComment">등록</button>
      </div>
      <div class="comment-list">
        <div v-for="comment in orderedComments" :key="comment.commentId" class="comment-item" :class="{ deleted: comment.isDeleted === 'Y', reply: comment.parentCommentId }" :style="comment.parentCommentId ? 'margin-left:32px' : ''">
          <img :src="comment.authorProfileUrl" class="comment-profile" />
          <div class="comment-body">
            <div class="comment-header">
              <span class="comment-nickname">{{ comment.authorNickName }}</span>
              <span class="comment-time">{{ formatRelativeTime(comment.createdTime) }}</span>
              <span
                v-if="(comment.isOwner === 'Y' || (getUserId() && getUserId() == comment.authorId)) && comment.isDeleted !== 'Y'"
                class="comment-options"
                @click="openDropdown = openDropdown === comment.commentId ? null : comment.commentId"
              >⋮</span>
              <div v-if="openDropdown === comment.commentId" class="comment-dropdown">
                <button v-if="comment.isOwner === 'Y' && comment.isDeleted !== 'Y'" class="dropdown-btn dropdown-btn-delete" @click="showDeleteModal = true; deleteTargetId = comment.commentId; openDropdown = null">삭제</button>
                <button v-if="getUserId() && getUserId() == comment.authorId && comment.isDeleted !== 'Y'" class="dropdown-btn" @click="editOpen = comment.commentId; editInput[comment.commentId] = comment.content; openDropdown = null">수정</button>
              </div>
            </div>
            <div v-if="editOpen === comment.commentId" class="edit-input-row">
              <input
                class="edit-input"
                v-model="editInput[comment.commentId]"
                :placeholder="'댓글을 수정하세요...'"
                @keyup.enter="editInput[comment.commentId].trim() && updateComment(comment.commentId, editInput[comment.commentId])"
              />
              <button class="edit-cancel-btn" @click="editOpen = null">취소</button>
              <button
                class="edit-confirm-btn"
                :disabled="!editInput[comment.commentId] || !editInput[comment.commentId].trim()"
                @click="updateComment(comment.commentId, editInput[comment.commentId])"
              >확인</button>
            </div>
            <div v-else class="comment-content">{{ comment.content }}</div>
            <div class="comment-actions">
              <button class="comment-reply" @click="replyOpen = replyOpen === comment.commentId ? null : comment.commentId">답글달기</button>
              <button class="comment-buff" :class="{ 'is-buffed': comment.isLike === 'Y' }" @click="likeComment(comment.commentId)">버프 {{ comment.likeCount }}</button>
            </div>
            <div v-if="replyOpen === comment.commentId" class="reply-input-row">
              <input
                class="reply-input"
                placeholder="답글을 입력하세요..."
                v-model="replyInput[comment.commentId]"
                @keyup.enter="replyComment(comment.commentId)"
              />
              <button class="reply-submit-btn" @click="replyComment(comment.commentId)">등록</button>
            </div>
          </div>
        </div>
        <div v-if="orderedComments.length === 0" class="no-comment">아직 댓글이 없습니다.</div>
      </div>
    </div>
    <div v-if="showDeleteModal" class="delete-modal-backdrop" @click.self="showDeleteModal = false">
      <div class="delete-modal-vod">
        <div class="delete-modal-header">
          <span class="delete-modal-title-main">Bestplace</span>
          <button class="delete-modal-close" @click="showDeleteModal = false">
            <v-icon>mdi-close</v-icon>
          </button>
        </div>
        <div class="delete-modal-body">
          <div class="delete-modal-warning">
            <v-icon class="delete-modal-warning-icon">mdi-alert-circle</v-icon>
            <div class="delete-modal-warning-texts">
              <div class="delete-modal-bold">댓글을 삭제하시겠습니까?</div>
              <div class="delete-modal-sub">삭제된 댓글은 복구할 수 없습니다.</div>
            </div>
          </div>
        </div>
        <div class="delete-modal-actions">
          <button class="delete-modal-cancel" @click="showDeleteModal = false">취소</button>
          <button class="delete-modal-confirm" @click="deleteComment(deleteTargetId)">삭제</button>
        </div>
      </div>
    </div>
    <div v-if="showMenuModal" class="menu-modal-backdrop" @click.self="showMenuModal = false">
      <div class="menu-modal">
        <button @click="copyUrl">{{ isCopied ? '복사 완료' : '클립 URL 복사' }}</button>
        <button @click="showMenuModal = false">닫기</button>
      </div>
    </div>
  </div>
  <div v-else class="clip-loading">
    <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'

// FooterComponent를 ClipDetailView에서 숨기기 위한 전역 이벤트
import mitt from 'mitt'
const emitter = mitt()
window.__clipDetailEmitter = emitter
emitter.emit('hideFooter', true)

const route = useRoute()
const router = useRouter()
const clips = ref([])
const currentClip = ref(null)
const currentIndex = ref(0)
const memberApi = process.env.VUE_APP_MEMBER_API
const transitionName = ref('slide-down')
const showCommentPanel = ref(false)
const showMenuModal = ref(false)
const isCopied = ref(false)

// 볼륨/음소거 상태
const showVolume = ref(false)
const volume = ref(1)
const isMuted = ref(false)
const videoRef = ref(null)

const streamerInfo = ref(null)
const comments = ref([])
const openDropdown = ref(null)

const showPlayPauseIcon = ref(false)
const playPauseIcon = ref('')
const progress = ref(0)

const newComment = ref('')
const replyInput = ref({}) // { [commentId]: string }
const replyOpen = ref(null)

const showDeleteModal = ref(false)
const deleteTargetId = ref(null)

const editOpen = ref(null)
const editInput = ref({})

// 클립 데이터 패치
async function fetchClips() {
  const response = await axios.get(`${memberApi}/video/clip/${route.params.clipId}`)
  clips.value = response.data.result
  console.log(clips.value)
  if (!clips.value || clips.value.length === 0) {
    currentClip.value = null
    return
  }
  const idx = clips.value.findIndex(c => String(c.id) === String(route.params.clipId))
  currentIndex.value = idx !== -1 ? idx : 0
  currentClip.value = clips.value[currentIndex.value]
  getComment()
}
// 스트리머 정보
async function fetchStreamerInfo() {
  const response = await axios.get(`${memberApi}/member/info/${currentClip.value.memberId}`)
  streamerInfo.value = response.data.result
}

function selectClipByIndex(idx) {
  if (idx < 0 || idx >= clips.value.length) return
  currentIndex.value = idx
  currentClip.value = clips.value[idx]
  openDropdown.value = null  // 드롭다운 초기화
  // URL도 변경 (SPA 라우팅)
  router.replace({ name: route.name, params: { ...route.params, clipId: currentClip.value.id } })
}

function prevClip() {
  if (currentIndex.value <= 0) return
  transitionName.value = 'slide-up'
  selectClipByIndex(currentIndex.value - 1)
}
function nextClip() {
  if (currentIndex.value >= clips.value.length - 1) return
  transitionName.value = 'slide-down'
  selectClipByIndex(currentIndex.value + 1)
}

async function toggleLike(clip) {
  if (!clip.id) return
  try {
    const response = await axios.post(`${memberApi}/video/toggle/${clip.id}`)
    const result = response.data.result
    // 현재 클립 객체 갱신
    clip.likeCount = result.likeCount
    clip.likeYn = result.likeYn
  } catch (error) {
    console.error('like toggle failed:', error)
  }
}

function copyUrl() {
  const currentUrl = window.location.href
  navigator.clipboard.writeText(currentUrl).then(() => {
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  })
}

function formatDate(date) {
  const d = new Date(date)
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${month}.${day}`
}

function onWheel(e) {
  if (e.deltaY > 0) nextClip()
  else if (e.deltaY < 0) prevClip()
}
function onKeydown(e) {
  if (e.key === 'ArrowDown') nextClip()
  else if (e.key === 'ArrowUp') prevClip()
  else if (e.key === ' ' || e.code === 'Space') {
    if (videoRef.value) {
      if (videoRef.value.paused) {
        videoRef.value.play()
        showPlayPause('play')
      } else {
        videoRef.value.pause()
        showPlayPause('pause')
      }
    }
    e.preventDefault()
  }
}

function showComments() {
  showCommentPanel.value = true
}
function showMenu() {
  showMenuModal.value = true
}

function toggleMute() {
  isMuted.value = !isMuted.value
  if (videoRef.value) videoRef.value.muted = isMuted.value
}

function onVideoVolumeChange() {
  if (videoRef.value) {
    volume.value = videoRef.value.volume
    isMuted.value = videoRef.value.muted
  }
}

function onVideoTimeUpdate() {
  if (videoRef.value) {
    progress.value = videoRef.value.currentTime / videoRef.value.duration
  }
}

async function toggleFollow() {
  if (!streamerInfo.value) return
  try {
    await axios.post(`${memberApi}/follow/toggle/${clips.value[currentIndex.value].memberId}`)
    streamerInfo.value.isFollow = streamerInfo.value.isFollow === 'Y' ? 'N' : 'Y'
  } catch (error) {
    console.error('Follow toggle failed:', error)
  }
}

async function createComment() {
  if (!newComment.value.trim()) return
  try {
    await axios.post(`${memberApi}/videoComment/create`, {
      videoPostId: currentClip.value.id,
      content: newComment.value.trim()
    })
    newComment.value = ''
    await getComment()
  } catch (error) {
    console.error('댓글 등록 실패:', error)
  }
}

async function replyComment(commentId) {
  const content = replyInput.value[commentId]?.trim()
  if (!content) return
  try {
    await axios.post(`${memberApi}/videoComment/reply`, {
      commentId,
      content
    })
    replyInput.value[commentId] = ''
    replyOpen.value = null
    await getComment()
  } catch (error) {
    console.error('댓글 등록 실패:', error)
  }
}

async function deleteComment(commentId) {
  try {
    await axios.post(`${memberApi}/videoComment/delete/${commentId}`)
    showDeleteModal.value = false
    deleteTargetId.value = null
    await getComment()
  } catch (error) {
    console.error('댓글 삭제 실패:', error)
  }
}

async function updateComment(commentId, content) {
  if (!content.trim()) return
  try {
    await axios.post(`${memberApi}/videoComment/update`, {
      videoCommentId: commentId,
      content
    })
    editOpen.value = null
    editInput.value[commentId] = ''
    await getComment()
  } catch (error) {
    console.error('댓글 수정 실패:', error)
  }
}

async function likeComment(commentId) {
  try {
    await axios.post(`${memberApi}/videoComment/toggle/${commentId}`)
    await getComment()
  } catch (error) {
    console.error('댓글 버프 실패:', error)
  }
}

function getUserId() {
  return localStorage.getItem('userId')
}

async function getComment() {
  try {
    const response = await axios.get(`${memberApi}/videoComment/list/${currentClip.value.id}`)
    comments.value = response.data.result.content
    openDropdown.value = null  // 드롭다운 초기화
  } catch (error) {
    console.error('get comment failed:', error)
  }
}

function formatRelativeTime(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return `${diff}초 전`
  if (diff < 3600) return `${Math.floor(diff/60)}분 전`
  if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`
  return `${Math.floor(diff/86400)}일 전`
}

// 볼륨 슬라이더 조작 시 비디오 볼륨 동기화
watch(volume, (val) => {
  if (videoRef.value) {
    videoRef.value.volume = val
    if (val === 0) {
      isMuted.value = true
      videoRef.value.muted = true
    } else {
      isMuted.value = false
      videoRef.value.muted = false
    }
  }
})

watch(currentClip, (val) => {
  if (val && val.memberId) {
    fetchStreamerInfo();
    getComment();
  }
});

function showPlayPause(type) {
  playPauseIcon.value = type === 'play' ? 'mdi-play-circle-outline' : 'mdi-pause-circle-outline'
  showPlayPauseIcon.value = true
  setTimeout(() => { showPlayPauseIcon.value = false }, 700)
}

const orderedComments = computed(() => {
  // 1. 최상위 댓글만 추출
  const topLevel = comments.value.filter(c => !c.parentCommentId)
  // 2. 답글만 추출
  const replies = comments.value.filter(c => c.parentCommentId)
  // 3. 각 최상위 댓글 아래에 답글 붙이기
  const result = []
  for (const parent of topLevel) {
    result.push(parent)
    const children = replies.filter(r => r.parentCommentId === parent.commentId)
    // 답글도 시간순 정렬
    children.sort((a, b) => new Date(a.createdTime) - new Date(b.createdTime))
    result.push(...children)
  }
  return result
})

onMounted(() => {
  fetchClips()
  setTimeout(() => {
    document.querySelector('.clip-detail-root')?.focus()
  }, 100)
  if (videoRef.value) {
    videoRef.value.addEventListener('play', () => showPlayPause('play'))
    videoRef.value.addEventListener('pause', () => showPlayPause('pause'))
  }
})
</script>

<style scoped>
.clip-detail-root {
  width: 80vw;
  height: 90vh;
  background: #18191c;
  display: flex;
  justify-content: center;
  align-items: center;
  outline: none;
  overflow: hidden;
  position: relative;
}
.clip-video-flex-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: relative;
}
.clip-video-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
}
.clip-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}
.custom-volume-container {
  position: absolute;
  top: 32px;
  right: 32px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.volume-btn {
  background: rgba(30,30,30,0.85);
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  color: #fff;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px #0008;
  transition: background 0.2s;
}
.volume-btn:hover {
  background: #B084CC;
  color: #fff;
}
.volume-slider-wrap {
  margin-top: 12px;
  background: #232428;
  border-radius: 16px;
  padding: 16px 12px 12px 12px;
  box-shadow: 0 2px 12px #000a;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.volume-slider {
  writing-mode: bt-lr; /* vertical */
  -webkit-appearance: slider-vertical;
  width: 32px;
  height: 120px;
  background: transparent;
  accent-color: #B084CC;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}
.clip-info-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 0 0 0 60px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  pointer-events: auto;
  margin-bottom: 15px;
}
.streamer-info {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-bottom: 16px;
}
.streamer-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}
.profile-image-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: visible;
}
.profile-image-wrapper.is-live {
  border: 2px solid #ff0000;
}
.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: transparent;
}
.live-badge {
  position: absolute;
  left: 50%;
  bottom: -6px;
  transform: translateX(-50%);
  background: #ff2d55;
  color: #fff;
  font-size: 0.5rem;
  font-weight: bold;
  padding: 1px 4px 1px 4px;
  border-radius: 12px;
  box-shadow: 0 2px 6px #0005;
  letter-spacing: 1px;
  line-height: 1.2;
  z-index: 10;
}
.streamer-nickname {
  color: #fff;
  font-size: 1rem;
  font-weight: 500;
}
.follow-btn {
  color: #B084CC;
  border: none;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}
.follow-btn.is-following {
  color: #696969;
}
.follow-btn:hover {
  opacity: 0.9;
}
.clip-title {
  font-size: 1.2rem;
  font-weight: 400;
  color: #fff;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
  line-height: 1.2;
  text-shadow: 0 2px 12px #000a;
  pointer-events: auto;
}
.clip-meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
  color: #B084CC;
  font-weight: 600;
  flex-wrap: wrap;
  pointer-events: auto;
}
.category {
  color: #B084CC;
  font-weight: 700;
}
.hashtag {
  color: #fff;
  opacity: 0.85;
  font-weight: 500;
}
.clip-side-actions {
  position: absolute;
  right: 20px;
  bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  z-index: 10;
}
.side-btn {
  background: rgba(30,30,30,0.7);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  color: #fff;
  font-size: 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 16px #0008;
  transition: box-shadow 0.2s, background 0.2s;
  position: relative;
}
.side-btn .v-icon {
  font-size: 1.2rem;
}
.side-btn span {
  position: absolute;
  bottom: -20px;
  font-size: 0.8rem;
  color: #fff;
}
.side-btn:hover {
  color: #B084CC;
  box-shadow: 0 4px 32px #B084CC99;
}
.clip-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
/* 모달 스타일 */
.comment-modal-backdrop, .menu-modal-backdrop {
  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.45);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}
.comment-modal, .menu-modal {
  background: #232428;
  border-radius: 16px;
  padding: 32px 40px;
  min-width: 320px;
  color: #fff;
  box-shadow: 0 4px 32px #000a;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.comment-placeholder {
  margin: 24px 0;
  color: #B084CC;
  font-size: 1.1rem;
}
.close-btn {
  margin-top: 16px;
  background: #B084CC;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 24px;
  font-size: 1rem;
  cursor: pointer;
}
.menu-modal button {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.1rem;
  margin: 12px 0;
  cursor: pointer;
  transition: color 0.2s;
}
.menu-modal button:hover {
  color: #B084CC;
}
/* 슬라이드 다운 (다음 클립) */
.slide-down-enter-active, .slide-down-leave-active,
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.4s cubic-bezier(.4,0,.2,1);
}
.slide-down-enter-from {
  opacity: 0;
  transform: translateY(120px) scale(0.98);
}
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-60px) scale(1.01);
}
/* 슬라이드 업 (이전 클립) */
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(-120px) scale(0.98);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(60px) scale(1.01);
}
.comment-panel {
  position: fixed;
  right: 0;
  bottom: 0;
  width: 450px;
  height: 80vh;
  background: #18191c;
  border-top-left-radius: 18px;
  box-shadow: -2px 0 16px #000a;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  padding: 0;
}
.comment-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px 10px 24px;
  font-size: 1.2rem;
  color: #fff;
  font-weight: bold;
  border-bottom: 1px solid #232428;
}
.comment-panel-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
}
.comment-input-row {
  display: flex;
  align-items: center;
  padding: 16px 8px 8px 8px;
  border-bottom: 1px solid #232428;
  background: #232428;
}
.comment-input {
  flex: 1;
  margin-left: 12px;
  background: #18191c;
  border: none;
  color: #fff;
  font-size: 1rem;
  padding: 10px 14px;
  border-radius: 8px;
}
.comment-submit-btn {
  margin-left: 8px;
  background: #B084CC;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.comment-submit-btn:hover {
  background: #6d5eee;
}
.comment-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 24px 24px 8px;
}
.comment-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 0 8px 0;
  border-bottom: 1px solid #232428;
}
.comment-item.reply {
  background: #232428;
  border-radius: 10px;
  margin-bottom: 8px;
}
.comment-item.deleted .comment-content {
  color: #aaa;
  font-style: italic;
}
.comment-profile {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  background: #222;
  margin-left: 12px;
}
.comment-body {
  flex: 1;
  min-width: 0;
}
.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 2px;
  position: relative;
}
.comment-nickname {
  color: #B084CC;
  font-weight: 700;
  font-size: 0.82rem;
}
.comment-time {
  color: #aaa;
  font-size: 0.62rem;
}
.comment-options {
  margin-left: auto;
  margin-right: 12px;
  color: #888;
  font-size: 1.2rem;
  cursor: pointer;
  position: relative;
}
.comment-dropdown {
  position: absolute;
  top: 22px;
  right: 0;
  background: #232428;
  border-radius: 8px;
  box-shadow: 0 2px 8px #0008;
  min-width: 70px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  padding: 4px 0;
}
.dropdown-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 0.77rem;
  padding: 8px 16px;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}
.dropdown-btn:hover {
  background: #B084CC22;
  color: #B084CC;
}
.dropdown-btn-delete {
  color: #ff4d4f;
  background: transparent;
  font-weight: 700;
}
.dropdown-btn-delete:hover {
  background: #ff4d4f22;
  color: #ff4d4f;
}
.comment-content {
  color: #fff;
  font-size: 0.82rem;
  word-break: break-all;
  margin-bottom: 6px;
}
.comment-actions {
  display: flex;
  gap: 10px;
}
.comment-reply {
  background: none;
  border: none;
  color: #7B7B7B;
  font-size: 0.72rem;
  cursor: pointer;
  padding: 0;
}
.comment-buff {
  background: #2D2D2D;
  border: none;
  color: #fff;
  border-radius: 8px;
  font-size: 0.72rem;
  padding: 2px 12px;
  cursor: pointer;
  font-weight: bold;
  margin-left: 8px;
  transition: all 0.2s ease;
}
.comment-buff.is-buffed {
  background: #B084CC;
  color: #000;
}
.comment-buff:hover {
  opacity: 0.9;
}
.no-comment {
  color: #B084CC;
  text-align: center;
  margin: 24px 0;
  font-size: 0.92rem;
}
.play-pause-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 50;
  pointer-events: none;
}
.play-pause-icon {
  font-size: 7rem;
  color: #fff;
  text-shadow: 0 4px 32px #000a;
  opacity: 0.92;
}
.play-pause-fade-enter-active, .play-pause-fade-leave-active {
  transition: opacity 0.4s, transform 0.4s;
}
.play-pause-fade-enter-from, .play-pause-fade-leave-to {
  opacity: 0;
  transform: scale(1.5) translate(-50%, -50%);
}
.play-pause-fade-enter-to, .play-pause-fade-leave-from {
  opacity: 1;
  transform: scale(1) translate(-50%, -50%);
}
.progress-bar-wrap {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 6px;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  pointer-events: none;
}
.progress-bar-bg {
  width: 100%;
  height: 4px;
  background: #232428cc;
  border-radius: 8px;
  overflow: hidden;
  margin: 0 0 2px 0;
}
.progress-bar-fg {
  height: 100%;
  background: linear-gradient(90deg, #B084CC 0%, #6d5eee 100%);
  border-radius: 1px;
  transition: width 0.4s cubic-bezier(.4,0,.2,1);
}
.reply-input-row {
  display: flex;
  align-items: center;
  margin-top: 8px;
  gap: 8px;
}
.reply-input {
  flex: 1;
  background: #18191c;
  border: none;
  color: #fff;
  font-size: 0.77rem;
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 250px;
}
.reply-submit-btn {
  background: #B084CC;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.77rem;
  padding: 7px 14px;
  cursor: pointer;
  transition: background 0.2s;
}
.reply-submit-btn:hover {
  background: #6d5eee;
}
.delete-modal-backdrop {
  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.45);
  z-index: 3000;
  display: flex;
  justify-content: center;
  align-items: center;
}
.delete-modal-vod {
  background: #18191c;
  border-radius: 16px;
  min-width: 400px;
  max-width: 90vw;
  color: #fff;
  box-shadow: 0 8px 32px #000a;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0;
  font-family: 'Pretendard', 'Noto Sans KR', Arial, sans-serif;
}
.delete-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px 0 32px;
}
.delete-modal-title-main {
  font-size: 1.18rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
}
.delete-modal-close {
  background: none;
  border: none;
  color: #bdbdbd;
  font-size: 1.7rem;
  cursor: pointer;
  padding: 0;
}
.delete-modal-body {
  padding: 32px 32px 0 32px;
}
.delete-modal-warning {
  background: #2d2323;
  border-radius: 10px;
  display: flex;
  align-items: flex-start;
  gap: 18px;
  padding: 22px 24px;
}
.delete-modal-warning-icon {
  color: #ff4d4f;
  font-size: 2.2rem;
  margin-top: 2px;
}
.delete-modal-warning-texts {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.delete-modal-bold {
  font-size: 1.08rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
}
.delete-modal-sub {
  font-size: 0.97rem;
  color: #bdbdbd;
  font-weight: 400;
  margin-top: 2px;
}
.delete-modal-actions {
  display: flex;
  gap: 12px;
  padding: 32px 32px 32px 32px;
  justify-content: flex-end;
}
.delete-modal-cancel {
  background: #232428;
  color: #bdbdbd;
  border: none;
  border-radius: 8px;
  min-width: 104px;
  padding: 12px 0;
  font-size: 1.05rem;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: -0.5px;
  transition: background 0.2s, color 0.2s;
}
.delete-modal-confirm {
  background: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 8px;
  min-width: 104px;
  padding: 12px 0;
  font-size: 1.05rem;
  cursor: pointer;
  font-weight: 700;
  letter-spacing: -0.5px;
  transition: background 0.2s, color 0.2s;
}
.delete-modal-cancel:hover {
  background: #232428;
  color: #fff;
}
.delete-modal-confirm:hover {
  background: #d32f2f;
  color: #fff;
}
.edit-input-row {
  display: flex;
  align-items: center;
  gap: 3px;
  margin: 8px 0 6px 0;
}
.edit-input {
  flex: 1;
  background: #18191c;
  border: none;
  color: #fff;
  font-size: 0.80rem;
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 200px;
}
.edit-cancel-btn, .edit-confirm-btn {
  border: none;
  border-radius: 8px;
  font-size: 0.80rem;
  padding: 7px 14px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s, color 0.2s;
}
.edit-cancel-btn {
  background: #232428;
  color: #bdbdbd;
}
.edit-cancel-btn:hover {
  background: #232428;
  color: #fff;
}
.edit-confirm-btn {
  background: #B084CC;
  color: #fff;
}
.edit-confirm-btn:disabled {
  background: #bdbdbd;
  color: #fff;
  cursor: not-allowed;
}
.edit-confirm-btn:hover:enabled {
  background: #6d5eee;
}
</style>