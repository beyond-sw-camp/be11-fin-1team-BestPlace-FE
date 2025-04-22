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
        <h1 class="stream-title">{{ vodInfo.title }}</h1>
        <div class="stream-meta">
          <span class="category">{{ vodInfo.category }}</span>
          <div class="hashtags" v-if="vodInfo.hashTags && vodInfo.hashTags.length > 0">
            <span class="dot"> · </span>
            <span v-for="tag in vodInfo.hashTags" :key="tag" class="hashtag">{{ tag }}</span>
          </div>
          <span class="dot"> · </span>
          <span class="viewer-count">조회수 {{ vodInfo.views }}회</span>
          <span class="dot"> · </span>
          <span class="created-time">{{ formatRelativeTime(vodInfo.createdTime) }}</span>
        </div>

        <div class="streamer-section">
          <div class="streamer-info">
            <div class="streamer-avatar">
              <img v-if="streamerInfo.streamerProfileImageUrl" :src="streamerInfo.streamerProfileImageUrl" alt="스트리머 프로필">
            </div>
            <div class="streamer-details">
              <span class="streamer-name">{{ streamerInfo.streamerNickName }}</span>
              <span class="follower-count">팔로워 {{ streamerInfo.followerCount }}명</span>
            </div>
          </div>
          <div class="stream-actions">
            <button 
              class="follow-button" 
              :class="{ 'following': streamerInfo.isFollow === 'Y' }"
              @click="toggleFollow"
            >
              {{ streamerInfo.isFollow === 'Y' ? '팔로잉' : '팔로우' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 댓글 섹션 -->
      <div class="comments-section">
        <div class="comment-form">
          <div class="comment-input-container">
            <div class="comment-avatar">
              <img :src="userProfileImage" alt="프로필">
            </div>
            <div class="comment-input-wrapper">
              <textarea 
                v-model="newComment" 
                placeholder="댓글 추가..." 
                class="comment-textarea"
              ></textarea>
              <div class="edit-buttons" v-if="newComment.trim()">
                <button class="cancel-button" @click="newComment = ''">취소</button>
                <button 
                  class="submit-button" 
                  @click="createComment"
                >
                  댓글
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="comments-list">
          <div v-for="comment in comments" :key="comment.commentId" class="comment-item">
            <!-- 메인 댓글 -->
            <div class="comment-main">
              <div class="comment-avatar">
                <img :src="comment.authorProfileUrl" :alt="comment.authorNickName">
              </div>
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-author">{{ comment.authorNickName }}</span>
                  <span class="comment-time">{{ formatRelativeTime(comment.createdTime) }}</span>
                  <!-- 댓글 수정/삭제 메뉴 -->
                  <div v-if="comment.isOwner === 'Y' && comment.isDeleted === 'N'" class="comment-menu">
                    <button class="menu-button" @click="toggleMenu(comment.commentId)">⋮</button>
                    <div v-if="activeMenu === comment.commentId" class="menu-dropdown">
                      <button class="edit-button" @click="startEdit(comment)">수정</button>
                      <button class="delete-button" @click="showDeleteConfirm(comment.commentId)">삭제</button>
                    </div>
                  </div>
                </div>
                <!-- 수정 모드일 때는 입력창, 아닐 때는 텍스트로 표시 -->
                <div v-if="editingComment && editingComment.commentId === comment.commentId" class="edit-mode">
                  <textarea 
                    v-model="editingComment.content" 
                    class="edit-textarea"
                    ref="editInput"
                  ></textarea>
                  <div class="edit-buttons">
                    <button class="cancel-button" @click="cancelEdit">취소</button>
                    <button 
                      class="submit-button" 
                      @click="updateComment(editingComment)"
                      :disabled="!editingComment.content.trim()"
                    >
                      수정
                    </button>
                  </div>
                </div>
                <p v-else class="comment-text">{{ comment.content }}</p>
                <div class="comment-footer" v-if="!editingComment || editingComment.commentId !== comment.commentId">
                  <div class="comment-actions">
                    <button class="reply-button" @click="showReplyInput(comment.commentId)">
                      답글달기
                    </button>
                  </div>
                  <div class="buff-count">
                    <button 
                      class="like-button" 
                      :class="{ 'liked': comment.isLike === 'Y' }"
                      @click="toggleLike(comment.commentId)"
                    >
                      버프 {{ comment.likeCount }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 답글 입력 폼 -->
            <div v-if="replyToId === comment.commentId" class="reply-form">
              <div class="comment-input-container">
                <div class="comment-avatar">
                  <img :src="userProfileImage" alt="프로필">
                </div>
                <div class="comment-input-wrapper">
                  <textarea 
                    v-model="newReply" 
                    placeholder="답글 추가..." 
                    class="comment-textarea"
                  ></textarea>
                  <div class="edit-buttons" v-if="newReply.trim()">
                    <button class="cancel-button" @click="cancelReply">취소</button>
                    <button 
                      class="submit-button" 
                      @click="createReply(comment.commentId)"
                    >
                      답글
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 대댓글 목록 -->
            <div v-for="reply in replies.filter(r => r.parentCommentId === comment.commentId)" 
                 :key="reply.commentId" 
                 class="reply-item">
              <div class="comment-avatar">
                <img :src="reply.authorProfileUrl" :alt="reply.authorNickName">
              </div>
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-author">{{ reply.authorNickName }}</span>
                  <span class="comment-time">{{ formatRelativeTime(reply.createdTime) }}</span>
                  <!-- 대댓글 수정/삭제 메뉴 -->
                  <div v-if="reply.isOwner === 'Y' && reply.isDeleted === 'N'" class="comment-menu">
                    <button class="menu-button" @click="toggleMenu(reply.commentId)">⋮</button>
                    <div v-if="activeMenu === reply.commentId" class="menu-dropdown">
                      <button class="edit-button" @click="startEdit(reply)">수정</button>
                      <button class="delete-button" @click="showDeleteConfirm(reply.commentId)">삭제</button>
                    </div>
                  </div>
                </div>
                <!-- 대댓글 수정 모드 -->
                <div v-if="editingComment && editingComment.commentId === reply.commentId" class="edit-mode">
                  <textarea 
                    v-model="editingComment.content" 
                    class="edit-textarea"
                    ref="editInput"
                  ></textarea>
                  <div class="edit-buttons">
                    <button class="cancel-button" @click="cancelEdit">취소</button>
                    <button 
                      class="submit-button" 
                      @click="updateComment(editingComment)"
                      :disabled="!editingComment.content.trim()"
                    >
                      수정
                    </button>
                  </div>
                </div>
                <p v-else class="comment-text">{{ reply.content }}</p>
                <div class="comment-footer" v-if="!editingComment || editingComment.commentId !== reply.commentId">
                  <div class="comment-actions">
                    <button class="reply-button" @click="showReplyInput(reply.commentId)">
                      답글달기
                    </button>
                  </div>
                  <div class="buff-count">
                    <button 
                      class="like-button" 
                      :class="{ 'liked': reply.isLike === 'Y' }"
                      @click="toggleLike(reply.commentId)"
                    >
                      버프 {{ reply.likeCount }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
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

    <!-- 삭제 확인 모달 추가 -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-content">
        <p class="modal-title">Bestplace</p>
        <p class="modal-message">댓글을 삭제하시겠습니까?</p>
        <div class="modal-buttons">
          <button class="modal-button cancel" @click="cancelDelete">취소</button>
          <button class="modal-button confirm" @click="confirmDelete">확인</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
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
  memberId: null,
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

// 스트리머 정보
const streamerInfo = ref({
  streamerNickName: '',
  streamerProfileImageUrl: '',
  streamingYn: '',
  followerCount: 0,
  isFollow: ''
})

// 채팅 관련 상태
const visibleMessages = ref([])
const chatHistory = ref([])
const userId = ref(null)

// 댓글 관련 상태
const comments = ref([])
const replies = ref([])
const newComment = ref('')
const newReply = ref('')
const replyToId = ref(null)
const activeMenu = ref(null)
const editingComment = ref(null)

// 사용자 프로필 이미지 상태 추가
const userProfileImage = ref('https://bestplace-media.s3.ap-northeast-2.amazonaws.com/bestplace-basic-profile-image.png')

// 삭제 모달 관련 상태 추가
const showDeleteModal = ref(false)
const deleteTargetId = ref(null)

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
    
    // 스트리머 정보 가져오기
    if (vodInfo.value.owner) {
      const streamerResponse = await axios.get(`${memberApi}/member/info/${vodInfo.value.memberId}`, {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })
      
      if (streamerResponse.data && streamerResponse.data.result) {
        streamerInfo.value = streamerResponse.data.result
      }
    }
    
    console.log('VOD 정보:', vodInfo.value)
    console.log('스트리머 정보:', streamerInfo.value)
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

// 팔로우 토글
const toggleFollow = async () => {
  try {
    await axios.post(`${memberApi}/follow/toggle/${vodInfo.value.memberId}`, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    streamerInfo.value.isFollow = streamerInfo.value.isFollow === 'Y' ? 'N' : 'Y'
  } catch (error) {
    console.error('팔로우 토글 실패:', error)
  }
}

// 댓글 목록 가져오기
const getComments = async () => {
  try {
    const response = await axios.get(`${memberApi}/videoComment/list/${vodId}`, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    const allComments = response.data.result.content
    comments.value = allComments.filter(c => !c.parentCommentId)
    replies.value = allComments.filter(c => c.parentCommentId)
  } catch (error) {
    console.error('댓글 로드 실패:', error)
  }
}

// 댓글 작성
const createComment = async () => {
  if (!newComment.value.trim()) return
  
  try {
    await axios.post(`${memberApi}/videoComment/create`, {
      videoPostId: vodId,
      content: newComment.value
    }, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    newComment.value = ''
    await getComments()
  } catch (error) {
    console.error('댓글 작성 실패:', error)
  }
}

// 대댓글 작성
const createReply = async (commentId) => {
  if (!newReply.value.trim()) return
  
  try {
    await axios.post(`${memberApi}/videoComment/reply`, {
      commentId: commentId,
      content: newReply.value
    }, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    newReply.value = ''
    replyToId.value = null
    await getComments()
  } catch (error) {
    console.error('답글 작성 실패:', error)
  }
}

// 댓글 수정
const updateComment = async (comment) => {
  try {
    await axios.post(`${memberApi}/videoComment/update`, {
      videoCommentId: comment.commentId,
      content: comment.content
    }, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    editingComment.value = null
    await getComments()
  } catch (error) {
    console.error('댓글 수정 실패:', error)
  }
}

// 삭제 확인 모달 표시
const showDeleteConfirm = (commentId) => {
  deleteTargetId.value = commentId
  showDeleteModal.value = true
  activeMenu.value = null
}

// 삭제 취소
const cancelDelete = () => {
  showDeleteModal.value = false
  deleteTargetId.value = null
}

// 삭제 확인
const confirmDelete = async () => {
  if (deleteTargetId.value) {
    await deleteComment(deleteTargetId.value)
    showDeleteModal.value = false
    deleteTargetId.value = null
  }
}

// 기존 deleteComment 함수 수정
const deleteComment = async (commentId) => {
  try {
    await axios.post(`${memberApi}/videoComment/delete/${commentId}`, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    await getComments()
  } catch (error) {
    console.error('댓글 삭제 실패:', error)
  }
}

// 좋아요 토글
const toggleLike = async (commentId) => {
  try {
    await axios.post(`${memberApi}/videoComment/toggle/${commentId}`, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    await getComments()
  } catch (error) {
    console.error('좋아요 토글 실패:', error)
  }
}

// UI 헬퍼 함수들
const showReplyInput = (commentId) => {
  replyToId.value = commentId
}

const toggleMenu = (commentId) => {
  activeMenu.value = activeMenu.value === commentId ? null : commentId
}

const startEdit = (comment) => {
  editingComment.value = { ...comment }
  activeMenu.value = null
  // nextTick을 사용하여 DOM 업데이트 후 focus
  nextTick(() => {
    const input = document.querySelector('.edit-mode input')
    if (input) {
      input.focus()
    }
  })
}

// 댓글 취소 함수 추가
const cancelEdit = () => {
  editingComment.value = null
}

const cancelReply = () => {
  replyToId.value = null
  newReply.value = ''
}

onMounted(() => {
  initializeVod()
  getComments()
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
  background: #0F0F0F;
}

.stream-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
}

.stream-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.streamer-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid #2D2D2D;
  border-bottom: 1px solid #2D2D2D;
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
  overflow: hidden;
}

.streamer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.streamer-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.streamer-name {
  font-size: 20px;
  color: #fff;
  font-weight: 500;
}

.follower-count {
  color: #7B7B7B;
  font-size: 16px;
}

.stream-actions {
  display: flex;
  gap: 12px;
}

.follow-button {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.follow-button:not(.following) {
  background: #00FF84;
  color: #000;
}

.follow-button.following {
  background: #2D2D2D;
  color: #fff;
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
  font-weight: 500;
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

/* 댓글 섹션 스타일 */
.comments-section {
  padding: 24px;
  background: #0F0F0F;
}

.comment-form {
  margin-bottom: 24px;
}

.comment-input-container {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.comment-input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.comment-input-wrapper input {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: none;
  border-bottom: 1px solid #2D2D2D;
  color: #fff;
  font-size: 16px;
}

.comment-input-wrapper input:focus {
  outline: none;
  border-bottom-color: #00E693;
}

.edit-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.cancel-button {
  padding: 8px 16px;
  background: transparent;
  color: #7B7B7B;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.submit-button {
  padding: 8px 16px;
  background: #00E693;
  color: #000;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.submit-button:disabled {
  background: #2D2D2D;
  color: #7B7B7B;
  cursor: not-allowed;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.comment-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.comment-item {
  margin-bottom: 24px;
  border-bottom: 1px solid #2D2D2D;
}

.comment-main {
  display: flex;
  gap: 12px;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  position: relative;
}

.comment-author {
  font-weight: 500;
  font-size: 16px;
}

.comment-time {
  color: #7B7B7B;
  font-size: 14px;
}

.comment-text {
  margin: 0;
  line-height: 1.5;
  font-size: 16px;
}

.comment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  margin-bottom: 8px;
}

.comment-actions {
  display: flex;
  gap: 16px;
}

.like-button {
  padding: 4px 8px;
  border-radius: 4px;
  background: #2D2D2D;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.like-button.liked {
  background: #00E693;
  color: #000;
}

.reply-button {
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: #7B7B7B;
  cursor: pointer;
  font-size: 14px;
}

.comment-menu {
  margin-left: auto;
}

.menu-dropdown {
  position: absolute;
  right: 0;
  top: 24px;
  background: #1A1A1A;
  border: 1px solid #2D2D2D;
  border-radius: 4px;
  padding: 8px 0;
  min-width: 80px;
  z-index: 10;
}

.menu-dropdown button {
  display: block;
  width: 100%;
  padding: 8px 16px;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.menu-dropdown .edit-button {
  color: #fff;
  border-bottom: 1px solid #2D2D2D;
}

.menu-dropdown .delete-button {
  color: #FF4343;
}

.menu-dropdown button:hover {
  background: #2D2D2D;
}

.buff-count {
  display: flex;
  align-items: center;
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #1A1A1A;
  border-radius: 8px;
  padding: 24px;
  width: 320px;
  text-align: center;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.modal-message {
  font-size: 14px;
  color: #fff;
  margin: 0 0 24px 0;
}

.modal-buttons {
  display: flex;
  gap: 8px;
}

.modal-button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.modal-button.cancel {
  background: #2D2D2D;
  color: #fff;
}

.modal-button.confirm {
  background: #00E693;
  color: #000;
}

.category {
  color: #00E693;
  font-weight: 800;
  font-size: 14px;
}

.reply-item {
  margin-left: 52px;
  margin-top: 16px;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid #2D2D2D;
  margin-bottom: 8px;
  position: relative;
}

.reply-item::before {
  content: '';
  position: absolute;
  top: -16px;
  left: -52px;
  right: 0;
  height: 1px;
  background: #2D2D2D;
  opacity: 0.5;
}

.reply-item:first-of-type::before {
  display: none;
}

.comment-item:last-child,
.reply-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.edit-mode {
  margin: 8px 0;
  background: #1A1A1A;
  border-radius: 4px;
  padding: 12px;
}

.edit-mode .edit-textarea {
  background: transparent;
  border: 1px solid #041517;
}

.edit-mode .edit-buttons {
  margin-top: 4px;
}

.comment-input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.edit-comment-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-mode {
  margin: 8px 0;
}

.edit-mode .comment-input-wrapper {
  margin-bottom: 0px;
}

.edit-mode input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid #2D2D2D;
  color: #fff;
  font-size: 16px;
}

.edit-mode input:focus {
  outline: none;
  border-bottom-color: #00E693;
}

.edit-mode .edit-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.edit-mode .cancel-button {
  padding: 6px 12px;
  background: transparent;
  color: #7B7B7B;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.edit-mode .submit-button {
  padding: 6px 12px;
  background: #00E693;
  color: #000;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.edit-mode .submit-button:disabled {
  background: #2D2D2D;
  color: #7B7B7B;
  cursor: not-allowed;
}

.comment-textarea,
.edit-textarea {
  width: 100%;
  min-height: 60px;
  padding: 12px;
  background: #041517;
  border: 1px solid #2D2D2D;
  border-radius: 4px;
  color: #fff;
  font-size: 16px;
  resize: none;
}

.comment-textarea:focus,
.edit-textarea:focus {
  outline: none;
  border-color: #00E693;
}

.edit-mode {
  margin: 8px 0;
  background: #141517;
  border-radius: 4px;
  padding: 12px;
}

.edit-mode .edit-textarea {
  background: transparent;
  border: 1px solid #2D2D2D;
}

.comment-input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.edit-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.cancel-button {
  padding: 8px 16px;
  background: transparent;
  color: #7B7B7B;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.submit-button {
  padding: 8px 16px;
  background: #00E693;
  color: #000;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.submit-button:disabled {
  background: #2D2D2D;
  color: #7B7B7B;
  cursor: not-allowed;
}

.menu-dropdown {
  position: absolute;
  right: 0;
  top: 24px;
  background: #1A1A1A;
  border: 1px solid #2D2D2D;
  border-radius: 4px;
  padding: 8px 0;
  min-width: 80px;
  z-index: 10;
}

.menu-dropdown button {
  display: block;
  width: 100%;
  padding: 8px 16px;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.menu-dropdown .edit-button {
  color: #fff;
  border-bottom: 1px solid #2D2D2D;
}

.menu-dropdown .delete-button {
  color: #FF4343;
}
</style>