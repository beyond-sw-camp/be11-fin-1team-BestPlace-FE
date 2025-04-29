<template>
  <div class="channel-container">
    <div v-if="loading" class="loading-container">
      <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
      <p>채널 정보를 불러오는 중...</p>
    </div>
    
    <div v-else-if="streamerInfo">
      <ChannelProfile
        :streamerInfo="streamerInfo"
        :isLoggedIn="isLoggedIn"
        :isChannelManager="isChannelManager"
        :currentUserId="currentUserId"
        :streamerId="streamerId"
        :defaultProfileImage="defaultProfileImage"
        :toggleFollow="toggleFollow"
        @go-to-manage="goToChannelManage"
        @go-to-dashboard="goToStreamerDashboard"
      />
      <ChannelNavigation
        :activeTab="activeTab"
        @tabChange="handleTabChange"
      />

      <div class="channel-content">
        <HomeTab v-if="activeTab === 'home'" />
        <VideosTab 
          v-else-if="activeTab === 'videos'" 
          :streamerId="streamerId"
          :isLoggedIn="isLoggedIn"
          :userIsAdult="userIsAdult"
        />
        <ClipsTab 
          v-else-if="activeTab === 'clips'" 
          :channelId="streamerId"
          :isLoggedIn="isLoggedIn"
          :userIsAdult="userIsAdult"
          @showAdultAlert="handleShowAdultAlert"
        />
        <CommunityTab v-else-if="activeTab === 'community'" />
        <InfoTab v-else-if="activeTab === 'info'" />
      </div>
    </div>
    
    <div v-else class="not-found">
      <p>채널 정보를 찾을 수 없습니다.</p>
    </div>

    <AdultAlertModal
      :visible="clipAdultAlertModalOpen"
      :isLoggedIn="isLoggedIn"
      @close="closeAdultAlertModal"
      @login="goToLogin"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

import ChannelProfile from './ChannelProfile.vue'
import ChannelNavigation from './ChannelNavigation.vue'
import VideosTab from './VideosTab.vue'
import HomeTab from './HomeTab.vue'
import CommunityTab from './CommunityTab.vue'
import InfoTab from './InfoTab.vue'
import AdultAlertModal from './AdultAlertModal.vue'
import ClipsTab from './ClipsTab.vue'

const route = useRoute()
const router = useRouter()

// 기본 데이터
const streamerId = ref(null)
const streamerInfo = ref(null)
const loading = ref(true)
const isLoggedIn = ref(false)
const currentUserId = ref(null)
const isChannelManager = ref(false)
const activeTab = ref('home')
const userIsAdult = ref(false)
const defaultProfileImage = ref('/path/to/default-profile.png')

// 성인 컨텐츠 모달 관련
const clipAdultAlertModalOpen = ref(false)
const selectedClip = ref(null)

// 탭 변경 처리
const handleTabChange = (tab) => {
  activeTab.value = tab
}

// 성인 컨텐츠 모달 관련 메서드
const handleShowAdultAlert = (clip) => {
  selectedClip.value = clip
  clipAdultAlertModalOpen.value = true
}

const closeAdultAlertModal = () => {
  clipAdultAlertModalOpen.value = false
  selectedClip.value = null
}

const goToLogin = () => {
  router.push('/member/login')
}

// 팔로우 토글
const toggleFollow = async () => {
  if (!isLoggedIn.value) {
    alert('로그인이 필요한 기능입니다.')
    router.push('/member/login')
    return
  }
  
  try {
    const token = localStorage.getItem('token')
    const baseUrl = process.env.VUE_APP_MEMBER_API
    
    // 팔로우 토글 API 호출
    const response = await axios.post(`${baseUrl}/follow/toggle/${streamerId.value}`, null, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    // 상태 업데이트
    streamerInfo.value.isFollow = streamerInfo.value.isFollow === 'Y' ? 'N' : 'Y'
    
    // 팔로워 수 업데이트
    if (streamerInfo.value.isFollow === 'Y') {
      streamerInfo.value.followerCount++
    } else {
      streamerInfo.value.followerCount = Math.max(0, streamerInfo.value.followerCount - 1)
    }
  } catch (error) {
    console.error('팔로우 토글 실패:', error)
    alert('팔로우 처리 중 오류가 발생했습니다.')
  }
}

// 채널 관리 페이지로 이동
const goToChannelManage = () => {
  router.push(`/channel/setting/${streamerId.value}`)
}

// 방송 대시보드로 이동
const goToStreamerDashboard = () => {
  router.push(`/streamer/${streamerId.value}/dashboard`)
}

// 로그인 상태 확인
const checkLoginStatus = () => {
  const token = localStorage.getItem('token')
  isLoggedIn.value = !!token
}

// 현재 사용자 ID 가져오기
const getCurrentUserId = () => {
  // 로컬스토리지에서 직접 userId 가져오기
  currentUserId.value = localStorage.getItem('userId')
  
  // userId가 없으면 토큰에서 시도
  if (!currentUserId.value && localStorage.getItem('token')) {
    try {
      const token = localStorage.getItem('token')
      const decodedToken = jwtDecode(token)
      if (decodedToken && decodedToken.sub) {
        currentUserId.value = decodedToken.sub
      }
    } catch (error) {
      console.error('토큰 디코딩 실패:', error)
    }
  }
}

// 성인 여부 확인
const checkAdultStatus = () => {
  if (isLoggedIn.value) {
    const isAdult = localStorage.getItem('isAdult')
    userIsAdult.value = isAdult === 'Y'
  }
}

// 채널 정보 로드
const loadChannelInfo = async () => {
  loading.value = true;
  
  try {
    streamerId.value = route.params.memberId;
    
    console.log('라우트 정보:', route);
    console.log('스트리머 ID:', streamerId.value);
    
    // streamerId 유효성 검사
    if (!streamerId.value) {
      throw new Error('유효하지 않은 스트리머 ID')
    }
    
    const memberApiUrl = process.env.VUE_APP_MEMBER_API;
    console.log('멤버 API URL:', memberApiUrl);
    
    const endpoint = `/member/info/${streamerId.value}`;
    
    // API 요청 헤더 설정
    const headers = {}
    if (isLoggedIn.value) {
      const token = localStorage.getItem('token')
      headers['Authorization'] = `Bearer ${token}`
    }
    
    console.log('API 요청 URL:', `${memberApiUrl}${endpoint}`);
    const response = await axios.get(`${memberApiUrl}${endpoint}`, { headers })
    
    console.log('API 응답:', response);
    
    if (response.data && response.data.result) {
      streamerInfo.value = response.data.result
    } else {
      console.error('채널 정보를 불러올 수 없습니다.')
    }
  } catch (error) {
    console.error('채널 정보 로드 실패:', error)
  } finally {
    loading.value = false
  }
}

// 채널 관리자 여부 확인
const checkIsChannelManager = async () => {
  if (isLoggedIn.value && currentUserId.value && streamerId.value) {
    try {
      const streamingApiUrl = process.env.VUE_APP_STREAMING_API
      const token = localStorage.getItem('token')
      
      const response = await axios.get(
        `${streamingApiUrl}/manager/checking/${streamerId.value}?requester=${currentUserId.value}`,
        { headers: { Authorization: `Bearer ${token}` }}
      )
      
      isChannelManager.value = response.data.result === 'Y'
    } catch (error) {
      console.error('채널 관리자 확인 실패:', error)
      isChannelManager.value = false
    }
  }
}

// 컴포넌트 마운트 시 실행
onMounted(async () => {
  checkLoginStatus()
  getCurrentUserId()
  checkAdultStatus()
  await loadChannelInfo()
  
  // 로그인한 경우에만 채널 관리자 확인
  if (isLoggedIn.value) {
    await checkIsChannelManager()
  }
  
  // 라우트 파라미터에서 탭 설정
  if (route.hash) {
    const hash = route.hash.substring(1)
    if (['home', 'videos', 'clips', 'community', 'info'].includes(hash)) {
      activeTab.value = hash
    }
  }
})
</script>

<style scoped>
.channel-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 300px;
  gap: 16px;
}

.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  font-size: 18px;
  color: #adb5bd;
}

.channel-content {
  margin-top: 20px;
}
</style>
