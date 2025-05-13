<template>
  <div class="vod-detail-container">
    <div class="stream-content">
      <div class="vod-main">
        <div class="video-section">
          <div class="video-container">
            <video
              ref="video"
              controls
              autoplay
              width="1440"
            ></video>
            <div v-if="showPlayEffect" class="play-effect">
              <div class="play-icon">
                <v-icon icon="mdi-play" size="x-large" color="white"></v-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="stream-header">
                <div class="title-container">          <h1 class="stream-title">{{ vodInfo.title }}</h1>          <div class="title-actions">            <button               class="clip-create-button"               @click="goToClipCreate"            >              클립 생성            </button>            <div v-if="isOwnVod" class="vod-menu">              <button class="menu-button" @click="toggleVodMenu">⋮</button>              <div v-if="showVodMenu" class="menu-dropdown">                <button class="edit-button" @click="showEditTitleModal">수정</button>                <button class="delete-button" @click="showDeleteVodModal">삭제</button>              </div>            </div>          </div>        </div>
        <div class="stream-meta">
          <span 
            class="category"
            @click="goToCategory(vodInfo.category)"
          >{{ vodInfo.category }}</span>
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
            <div 
              class="streamer-avatar"
              @click="goToStreamerProfile(vodInfo.memberId)"
            >
              <img v-if="streamerInfo.streamerProfileImageUrl" :src="streamerInfo.streamerProfileImageUrl" alt="스트리머 프로필">
            </div>
            <div class="streamer-details">
              <span 
                class="streamer-name"
                @click="goToStreamerProfile(vodInfo.memberId)"
              >{{ streamerInfo.streamerNickName }}</span>
              <span class="follower-count">팔로워 {{ streamerInfo.followerCount }}명</span>
            </div>
          </div>
          <div 
            class="stream-actions" 
            v-if="isLogin && !isOwnProfile"
          >
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
                @keydown.enter.prevent="handleCommentEnter"
              ></textarea>
              <div class="edit-buttons" v-if="newComment.trim()">
                <button class="cancel-button" @click="newComment = ''">취소</button>
                <button 
                  class="submit-button" 
                  @click="createComment"
                >
                  작성
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="comments-list">
          <div v-for="comment in comments" :key="comment.commentId" class="comment-item">
            <!-- 메인 댓글 -->
            <div class="comment-main">
              <div class="comment-avatar" @click="goToChannel(comment.authorId)">
                <img :src="comment.authorProfileUrl" :alt="comment.authorNickName">
              </div>
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-author" @click="goToChannel(comment.authorId)">{{ comment.authorNickName }}</span>
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
                    @keydown.enter.prevent="handleEditEnter"
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
                    @keydown.enter="handleReplyEnter"
                  ></textarea>
                  <div class="edit-buttons" v-if="newReply.trim()">
                    <button class="cancel-button" @click="cancelReply">취소</button>
                    <button 
                      class="submit-button" 
                      @click="createReply(comment.commentId)"
                    >
                      작성
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 대댓글 목록 -->
            <div v-for="reply in replies.filter(r => r.parentCommentId === comment.commentId)" 
                 :key="reply.commentId" 
                 class="reply-item">
              <div class="comment-avatar" @click="goToChannel(reply.authorId)">
                <img :src="reply.authorProfileUrl" :alt="reply.authorNickName">
              </div>
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-author" @click="goToChannel(reply.authorId)">{{ reply.authorNickName }}</span>
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
                    @keydown.enter.prevent="handleEditEnter"
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
                    <button class="reply-button" @click="showReplyInput(comment.commentId)">
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
          :class="{ 'own-message': message.memberId === userId, 'donation-message': message.type === 'CHAT_DONATION' }"
        >
          <template v-if="message.type === 'CHAT_DONATION'">
            <div class="donation-box">
              <div class="donation-header">
                <span class="donation-title">{{ message.donationSender || message.sender }}</span>
                <span class="donation-amount">🍒 {{ formatNumber(message.berryAmount) }}</span>
              </div>
              <div class="donation-body">
                <span class="message-content">{{ message.message }}</span>
              </div>
            </div>
          </template>
          <template v-else>
            <span class="sender">{{ message.sender }}</span>
            <span class="message-content">{{ message.message }}</span>
          </template>
        </div>
      </div>
    </div>

    <!-- 삭제 확인 모달 추가 -->
    <v-dialog v-model="showDeleteModal" max-width="400" content-class="community-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">Bestplace</div>
          <v-btn icon @click="cancelDelete" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="modal-content">
          <div class="message-container warning-container">
            <v-icon icon="mdi-alert" color="#FF5252" size="x-large" class="message-icon"></v-icon>
            <div class="message-text">
              <p>댓글을 삭제하시겠습니까?</p>
              <p class="warning-submessage">삭제된 댓글은 복구할 수 없습니다.</p>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <div class="button-group">
            <v-btn 
              variant="outlined" 
              class="cancel-btn" 
              @click="cancelDelete"
            >
              취소
            </v-btn>
            <v-btn 
              color="#FF5252" 
              class="delete-confirm-btn" 
              @click="confirmDelete"
            >
              삭제
            </v-btn>
          </div>
        </div>
      </div>
    </v-dialog>

    <!-- 클립 생성 모달 -->
    <div v-if="showClipModal" class="modal-overlay">
      <div class="clip-modal-content">
        <h2>클립 만들기</h2>
        <div class="clip-form">
          <input 
            v-model="clipTitle" 
            type="text" 
            placeholder="클립 제목을 입력하세요"
            class="clip-title-input"
            maxlength="100"
          />
          <div class="time-control">
            <div class="time-display">
              <span>시작: {{ formatTime(clipStartTime) }}</span>
              <span>종료: {{ formatTime(clipEndTime) }}</span>
              <span>길이: {{ formatTime(clipEndTime - clipStartTime) }}</span>
            </div>
            <div class="trim-container">
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
          <div class="clip-buttons">
            <button class="cancel-button" @click="closeClipModal">취소</button>
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

    <!-- 로그인 확인 모달 -->
    <v-dialog v-model="loginConfirmModalOpen" max-width="400" content-class="community-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">로그인 필요</div>
          <v-btn icon @click="closeLoginConfirmModal" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="modal-content">
          <div class="message-container login-container">
            <v-icon icon="mdi-account-alert" color="#B084CC" size="x-large" class="message-icon"></v-icon>
            <div class="message-text">
              <p>로그인이 필요한 기능입니다.</p>
              <p class="login-submessage">로그인 페이지로 이동하시겠습니까?</p>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <div class="button-group">
            <v-btn 
              variant="outlined" 
              class="cancel-btn" 
              @click="closeLoginConfirmModal"
            >
              아니오
            </v-btn>
            <v-btn 
              color="#B084CC" 
              class="login-confirm-btn" 
              @click="goToLogin"
            >
              예, 로그인하기
            </v-btn>
          </div>
        </div>
      </div>
    </v-dialog>

    <!-- 성인 콘텐츠 경고 모달 -->
    <v-dialog v-model="adultContentModalOpen" max-width="400" content-class="community-modal" persistent>
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">성인 콘텐츠 제한</div>
        </div>
        
        <div class="modal-content">
          <div class="message-container warning-container">
            <v-icon icon="mdi-alert" color="#FF5252" size="x-large" class="message-icon"></v-icon>
            <div class="message-text">
              <p>이 방송은 성인 전용 콘텐츠입니다.</p>
              <p class="warning-submessage">회원님의 연령 정보에 따라 시청이 제한되었습니다.</p>
              <p class="warning-submessage">건전하고 안전한 서비스 이용을 위해 양해 부탁드립니다.</p>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <div class="button-group">
            <v-btn 
              color="#B084CC" 
              class="confirm-btn" 
              block
              @click="goToHome"
            >
              확인
            </v-btn>
          </div>
        </div>
      </div>
    </v-dialog>

    <!-- VOD 제목 수정 모달 -->
    <v-dialog v-model="editTitleModalOpen" max-width="400" content-class="community-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">VOD 제목 수정</div>
          <v-btn icon @click="closeEditTitleModal" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="modal-content">
          <div class="edit-title-form">
            <label for="vod-title">VOD 제목</label>
            <input 
              v-model="newVodTitle" 
              type="text" 
              id="vod-title"
              placeholder="새 제목을 입력하세요"
              class="edit-title-input"
              maxlength="100"
            />
          </div>
        </div>
        
        <div class="modal-footer">
          <div class="button-group">
            <v-btn 
              variant="outlined" 
              class="cancel-btn" 
              @click="closeEditTitleModal"
            >
              취소
            </v-btn>
            <v-btn 
              color="#B084CC" 
              class="confirm-btn" 
              @click="updateVodTitle"
              :disabled="!newVodTitle.trim()"
            >
              확인
            </v-btn>
          </div>
        </div>
      </div>
    </v-dialog>

    <!-- VOD 삭제 확인 모달 -->
    <v-dialog v-model="deleteVodModalOpen" max-width="400" content-class="community-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">VOD 삭제</div>
          <v-btn icon @click="closeDeleteVodModal" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="modal-content">
          <div class="message-container warning-container">
            <v-icon icon="mdi-alert" color="#FF5252" size="x-large" class="message-icon"></v-icon>
            <div class="message-text">
              <p>정말 삭제하시겠습니까?</p>
              <p class="warning-submessage">삭제된 VOD는 복구할 수 없습니다.</p>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <div class="button-group">
            <v-btn 
              variant="outlined" 
              class="cancel-btn" 
              @click="closeDeleteVodModal"
            >
              취소
            </v-btn>
            <v-btn 
              color="#FF5252" 
              class="delete-confirm-btn" 
              @click="deleteVod"
            >
              삭제
            </v-btn>
          </div>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const video = ref(null)
const vodId = route.params.vodId
const streamingApi = process.env.VUE_APP_STREAMING_API
const memberApi = process.env.VUE_APP_MEMBER_API
const token = ref(localStorage.getItem('token'))
const isLogin = ref(false)

// 로그인 확인 모달 관련 상태 추가
const loginConfirmModalOpen = ref(false)

// 성인 콘텐츠 경고 모달 관련 상태 추가
const adultContentModalOpen = ref(false)

// VOD 메뉴 관련 상태
const showVodMenu = ref(false)

// VOD 제목 수정 모달 관련 상태
const editTitleModalOpen = ref(false)
const newVodTitle = ref("")

// VOD 삭제 확인 모달 관련 상태
const deleteVodModalOpen = ref(false)

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

// 클립 관련 상태 추가
const showClipModal = ref(false)
const clipTitle = ref('')
const clipStartTime = ref(0)
const clipEndTime = ref(0)

// Add memberId to the data section if not already present
const memberId = ref(null)

// 재생 이펙트 상태 추가
const showPlayEffect = ref(false)

// 토큰 준비 및 사용자 정보 추출
const prepareToken = async () => {
  token.value = localStorage.getItem('token')
  isLogin.value = !!token.value
  
  if (token.value) {
    try {
      const base64Url = token.value.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      
      const payload = JSON.parse(jsonPayload)
      memberId.value = payload.sub
    } catch (error) {
      console.error('토큰 파싱 실패:', error)
    }
  }
}
const memberAdultYn = async () => {
  try {
    const response = await axios.get(`${memberApi}/member/detail/${memberId.value}`)
    if(response.data.result.adult === 'Y'){
      return true
    }else{
      return false
    }
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error)
    return false
  }
}

// VOD 정보 가져오기
const getVodInfo = async () => {
  try {
    // 토큰 준비
    await prepareToken()
    
    const response = await axios.get(`${memberApi}/video/vod/${vodId}`)

    if (!response.data || !response.data.result) {
      console.error('VOD 정보가 없습니다:', response.data)
      return false
    }

    // VOD 정보 설정
    vodInfo.value = response.data.result
    
    // 스트리머 정보 가져오기
    if (vodInfo.value.owner) {
      const streamerResponse = await axios.get(`${memberApi}/member/info/${vodInfo.value.memberId}`)
      
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
    const response = await axios.get(`${streamingApi}/chat/history/${vodInfo.value.roomId}`)
    
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
  
  // 음소거 상태로 설정하여 자동재생 정책 우회
  el.muted = true
  
  // 비디오가 로드되면 초기 메시지 표시
  el.addEventListener('loadedmetadata', () => {
    console.log('비디오 메타데이터 로드 완료')
    updateVisibleMessages()
    
    // 자동 재생 시도 (음소거 상태에서는 대부분의 브라우저에서 허용됨)
    const playPromise = el.play()
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // 재생 성공 시 이펙트 표시
        showPlayEffect.value = true
        setTimeout(() => {
          showPlayEffect.value = false
        }, 2000)
      }).catch(error => {
        console.error('자동 재생 실패:', error)
      })
    }
  })
  
  // 시간 업데이트 이벤트 리스너 추가
  el.addEventListener('timeupdate', () => {
    updateVisibleMessages()
  })
  
  // 사용자 상호작용(클릭) 시 음소거 해제
  el.addEventListener('click', () => {
    // 이미 재생 중이면 음소거만 해제
    if (!el.paused) {
      el.muted = false
    }
  })
  
  // 페이지 로드 후 사용자 상호작용(스크롤, 클릭 등) 감지하여 음소거 해제 시도
  const tryUnmute = () => {
    if (!el.paused) {
      el.muted = false
      console.log('사용자 상호작용 감지, 음소거 해제 시도')
    }
  }
  
  // 페이지 내 사용자 상호작용 이벤트 등록
  document.addEventListener('click', tryUnmute, { once: true })
  document.addEventListener('scroll', tryUnmute, { once: true })
  document.addEventListener('keypress', tryUnmute, { once: true })
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
    
    // 성인 콘텐츠 확인 로직 추가
    if (vodInfo.value.isAdult === 'Y') {
      // 로그인 상태 확인
      if (!isLogin.value) {
        adultContentModalOpen.value = true
        return
      }

      // 성인 인증 확인
      try {
        const isAdultUser = await memberAdultYn()
        if (!isAdultUser) {
          adultContentModalOpen.value = true
          return
        }
      } catch (error) {
        console.error('성인 인증 확인 실패:', error)
        adultContentModalOpen.value = true
        return
      }
    }
    
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
  }).map(message => {
    // 기부 메시지 파싱 처리
    if (message.type === "CHAT_DONATION") {
      const fullMessage = message.message
      const donationPattern = /(.+)님이 (\d+)원을 후원하셨습니다\.(.*)/
      const match = fullMessage.match(donationPattern)

      let senderName = message.sender
      let donationAmount = 1000
      let actualMessage = fullMessage

      if (match && match.length >= 4) {
        senderName = match[1]
        donationAmount = parseInt(match[2])
        actualMessage = match[3].trim()
      }

      return {
        ...message,
        message: actualMessage || '',
        berryAmount: donationAmount,
        donationSender: senderName
      }
    }
    
    return message
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

// 숫자 포맷팅 함수 추가
const formatNumber = (number) => {
  return number ? number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0"
}

// 팔로우 토글
const toggleFollow = async () => {
  try {
    await axios.post(`${memberApi}/follow/toggle/${vodInfo.value.memberId}`)
    streamerInfo.value.isFollow = streamerInfo.value.isFollow === 'Y' ? 'N' : 'Y'
    // 팔로워 수 실시간 업데이트
    if (streamerInfo.value.isFollow === 'Y') {
      streamerInfo.value.followerCount++
    } else {
      streamerInfo.value.followerCount--
    }
  } catch (error) {
    console.error('팔로우 토글 실패:', error)
  }
}

// 댓글 목록 가져오기
const getComments = async () => {
  // 성인 콘텐츠 제한 확인
  if (vodInfo.value.isAdult === 'Y') {
    if (!isLogin.value) {
      return
    }
    
    try {
      const isAdultUser = await memberAdultYn()
      if (!isAdultUser) {
        return
      }
    } catch (error) {
      console.error('성인 인증 확인 실패:', error)
      return
    }
  }
  
  try {
    const response = await axios.get(`${memberApi}/videoComment/list/${vodId}`)
    const allComments = response.data.result.content
    comments.value = allComments.filter(c => !c.parentCommentId)
    replies.value = allComments.filter(c => c.parentCommentId)
  } catch (error) {
    console.error('댓글 로드 실패:', error)
  }
}

// 댓글 작성
const createComment = async () => {
  if (!isLogin.value) {
    loginConfirmModalOpen.value = true
    return
  }
  
  if (!newComment.value.trim()) return
  
  try {
    await axios.post(`${memberApi}/videoComment/create`, {
      videoPostId: vodId,
      content: newComment.value
    })
    newComment.value = ''
    await getComments()
  } catch (error) {
    console.error('댓글 작성 실패:', error)
  }
}

// 답글 입력 표시
const showReplyInput = (commentId) => {
  if (!isLogin.value) {
    loginConfirmModalOpen.value = true
    return
  }
  replyToId.value = commentId
  // nextTick을 사용하여 DOM 업데이트 후 textarea에 포커스
  nextTick(() => {
    const textarea = document.querySelector('.reply-form .comment-textarea')
    if (textarea) {
      textarea.focus()
    }
  })
}

// 답글 작성 취소
const cancelReply = () => {
  replyToId.value = null
  newReply.value = ''
}

// 답글 작성
const createReply = async (commentId) => {
  if (!newReply.value.trim() || !commentId) return
  
  try {
    await axios.post(`${memberApi}/videoComment/reply`, {
      commentId: commentId,
      content: newReply.value
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
    await axios.post(`${memberApi}/videoComment/delete/${commentId}`)
    await getComments()
  } catch (error) {
    console.error('댓글 삭제 실패:', error)
  }
}

// 좋아요 토글
const toggleLike = async (commentId) => {
  if (!isLogin.value) {
    loginConfirmModalOpen.value = true
    return
  }
  
  try {
    await axios.post(`${memberApi}/videoComment/toggle/${commentId}`)
    await getComments()
  } catch (error) {
    console.error('좋아요 토글 실패:', error)
  }
}

// UI 헬퍼 함수들
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

// 엔터 키 핸들러 수정
const handleCommentEnter = (event) => {
  if (!event.shiftKey && newComment.value.trim()) {
    event.preventDefault()
    createComment()
  }
}

const handleReplyEnter = (event) => {
  if (!event.shiftKey && newReply.value.trim() && replyToId.value) {
    event.preventDefault()
    createReply(replyToId.value)
  }
}

const handleEditEnter = (event) => {
  if (!event.shiftKey && editingComment.value?.content.trim()) {
    event.preventDefault()
    updateComment(editingComment.value)
  }
}

// 프로필 페이지 이동
const goToStreamerProfile = (streamerId) => {
  router.push(`/channel/${streamerId}`)
}

// 카테고리 페이지 이동
const goToCategory = (category) => {
  router.push(`/category/${category}`)
}

// Add in the script section, after goToCategory function
const goToClipCreate = () => {
  if (!isLogin.value) {
    loginConfirmModalOpen.value = true
    return
  }
  
  const width = 800
  const height = 800
  const left = (window.screen.width - width) / 2
  const top = (window.screen.height - height) / 2
  
  window.open(
    `/video/clip/create/${vodId}`,
    'clipCreate',
    `width=${width},height=${height},left=${left},top=${top}`
  )
}

// Add in the script section, after goToCategory function
const goToChannel = (memberId) => {
  router.push(`/channel/${memberId}`)
}

// Add computed property for clip validation
const isClipValid = computed(() => {
  return clipTitle.value.trim() !== '' && 
         clipEndTime.value > clipStartTime.value && 
         (clipEndTime.value - clipStartTime.value) <= 120 // 최대 5분
})

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 로그인 모달 닫기
const closeLoginConfirmModal = () => {
  loginConfirmModalOpen.value = false
}

// 로그인 페이지로 이동
const goToLogin = () => {
  closeLoginConfirmModal()
  router.push('/member/login')
}

// 메인 페이지로 이동하는 함수 추가
const goToHome = () => {
  router.push('/')
}

// Add a computed property to check if the logged-in user is the VOD owner
const isOwnProfile = computed(() => { 
  if (!memberId.value || !vodInfo.value.memberId) return false 
  return String(memberId.value) === String(vodInfo.value.memberId)
})

// VOD 소유자인지 확인하는 computed 속성
const isOwnVod = computed(() => { 
  if (!memberId.value || !vodInfo.value.memberId) return false 
  return String(memberId.value) === String(vodInfo.value.memberId)
})

// VOD 메뉴 토글
const toggleVodMenu = () => {
  showVodMenu.value = !showVodMenu.value
}

// VOD 제목 수정 모달 표시
const showEditTitleModal = () => {
  newVodTitle.value = vodInfo.value.title
  editTitleModalOpen.value = true
  showVodMenu.value = false
}

// VOD 제목 수정 모달 닫기
const closeEditTitleModal = () => {
  editTitleModalOpen.value = false
}

// VOD 제목 업데이트
const updateVodTitle = async () => {
  if (!newVodTitle.value.trim()) return
  
  try {
    await axios.post(`${memberApi}/video/update/${vodInfo.value.id}`, {
      videoId: vodInfo.value.id,
      title: newVodTitle.value
    })
    vodInfo.value.title = newVodTitle.value
    closeEditTitleModal()
  } catch (error) {
    console.error('VOD 제목 수정 실패:', error)
  }
}

// VOD 삭제 모달 표시
const showDeleteVodModal = () => {
  deleteVodModalOpen.value = true
  showVodMenu.value = false
}

// VOD 삭제 모달 닫기
const closeDeleteVodModal = () => {
  deleteVodModalOpen.value = false
}

// VOD 삭제
const deleteVod = async () => {
  try {
    await axios.post(`${memberApi}/video/delete/${vodInfo.value.id}`)
    closeDeleteVodModal()
    // 삭제 후 홈으로 이동
    router.push('/')
  } catch (error) {
    console.error('VOD 삭제 실패:', error)
  }
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
  background: #000000;
}

.title-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stream-title {
  font-size: 24px;
  font-weight: 500;
  margin: 0;
  flex: 1;
  font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', '맑은 고딕', 'Noto Sans KR', sans-serif;
}

.clip-create-button {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: #2D2D2D;
  color: #fff;
  margin-left: 16px;
  white-space: nowrap;
}

.clip-create-button:hover {
  background: #3D3D3D;
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
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #2D2D2D;
  flex-shrink: 0;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
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
  font-size: 18px;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.streamer-name:hover {
  color: #B084CC;
}

.follower-count {
  font-size: 16px;
  color: #7B7B7B;
  font-weight: 500;
}

.stream-actions {
  display: flex;
  gap: 12px;
}

.follow-button,
.clip-create-button {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.follow-button:not(.following) {
  background: #B084CC;
  color: #000;
}

.follow-button.following {
  background: #2D2D2D;
  color: #fff;
}

.clip-create-button {
  background: #2D2D2D;
  color: #fff;
}

.clip-create-button:hover {
  background: #3D3D3D;
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

.video-controls {
  display: none;
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
  font-weight: 500;
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
  color: #B084CC;
  font-weight: 500;
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
  font-weight: 500;
  font-size: 14px;
}

.created-time {
  color: #7B7B7B;
  font-size: 14px;
}

.donation-body {
  color: white;
  word-break: break-word;
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
  background: #000000;
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
  border-bottom-color: #B084CC;
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
  background: #B084CC;
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
  cursor: pointer;
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
  cursor: pointer;
  transition: color 0.2s;
}

.comment-author:hover {
  color: #B084CC;
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
  background: #B084CC;
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
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
  width: 100%;
}

.modal-title {
  font-size: 18px;
  font-weight: 500;
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
  background: #B084CC;
  color: #000;
}

.category {
  color: #B084CC;
  font-weight: 500;
  font-size: 16px;
  text-shadow: 0 0 1px rgba(0, 255, 132, 0.3);
  cursor: pointer;
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
  border-bottom-color: #B084CC;
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
  background: #B084CC;
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
  border-color: #B084CC;
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
  background: #B084CC;
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

.menu-dropdown button:hover {
  background: #2D2D2D;
}

.reply-form {
  margin-left: 52px;
  margin-top: 16px;
}

.reply-form .comment-textarea {
  min-height: 60px;
  background: #041517;
}

.clip-modal-content {
  background: #1A1A1A;
  border-radius: 8px;
  padding: 24px;
  width: 500px;
  color: white;
}

.clip-modal-content h2 {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 500;
}

.clip-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.clip-title-input {
  width: 100%;
  padding: 12px;
  background: #2D2D2D;
  border: 1px solid #3D3D3D;
  border-radius: 4px;
  color: white;
  font-size: 16px;
}

.clip-title-input:focus {
  outline: none;
  border-color: #B084CC;
}

.time-control {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #7B7B7B;
}

.trim-container {
  position: relative;
  height: 40px;
  margin: 20px 0;
}

.trim-track {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 4px;
  background: #2D2D2D;
  transform: translateY(-50%);
  border-radius: 2px;
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

.clip-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}

.clip-buttons .cancel-button {
  padding: 8px 16px;
  background: #2D2D2D;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.clip-buttons .create-button {
  padding: 8px 16px;
  background: #B084CC;
  color: black;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.clip-buttons .create-button:disabled {
  background: #2D2D2D;
  color: #7B7B7B;
  cursor: not-allowed;
}

/* 로그인 모달 스타일 */
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
  background-color: rgba(255, 82, 82, 0.1);
  border-radius: 8px;
  width: 100%;
}

.warning-container {
  background-color: rgba(255, 152, 0, 0.1);
}

.message-icon {
  margin-right: 16px;
}

.message-text {
  font-size: 16px;
  line-height: 1.5;
  color: #fff;
}

.warning-submessage {
  font-size: 14px;
  color: #aaa;
  margin-top: 8px;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid #333;
}

.confirm-btn {
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

.button-group {
  display: flex;
  width: 100%;
  gap: 10px;
}

.cancel-btn {
  flex: 1;
  border-color: #555 !important;
  color: white !important;
}

.delete-confirm-btn {
  flex: 2;
}

.login-container {
  background-color: rgba(176, 132, 204, 0.1) !important;
}

.login-submessage {
  font-size: 14px;
  color: #aaa;
  margin-top: 8px;
}

.login-confirm-btn {
  flex: 2;
}

.play-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  z-index: 5;
  animation: fadeInOut 2s ease-in-out;
}

.play-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(176, 132, 204, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  animation: pulse 2s ease-in-out;
}

@keyframes fadeInOut {
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes pulse {
  0% { transform: scale(0.5); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.own-message .sender {
  color: #B084CC;
}

.donation-message {
  margin-bottom: 12px;
  width: 100%;
}

.donation-box {
  background: rgba(176, 132, 204, 0.15);
  border-radius: 8px;
  padding: 10px;
  width: 100%;
  animation: donationPulse 2s ease infinite;
}

@keyframes donationPulse {
  0% { box-shadow: 0 0 0 0 rgba(176, 132, 204, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(176, 132, 204, 0); }
  100% { box-shadow: 0 0 0 0 rgba(176, 132, 204, 0); }
}

.donation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.donation-title {
  font-weight: 500;
  color: #B084CC;
}

.donation-amount {
  font-weight: 500;
  color: #B084CC;
}

/* VOD 관리 관련 스타일 */
.title-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.vod-menu {
  position: relative;
}

.vod-menu .menu-button {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.vod-menu .menu-button:hover {
  background: #2D2D2D;
}

.edit-title-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit-title-form label {
  font-size: 14px;
  color: #7B7B7B;
}

.edit-title-input {
  width: 100%;
  padding: 12px;
  background: #2D2D2D;
  border: 1px solid #3D3D3D;
  border-radius: 4px;
  color: white;
  font-size: 16px;
}

.edit-title-input:focus {
  outline: none;
  border-color: #B084CC;
}
</style>