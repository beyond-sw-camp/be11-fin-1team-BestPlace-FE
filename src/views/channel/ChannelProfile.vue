<template>
    <div class="profile-section" >
      <!-- 프로필 이미지 -->
      <div 
        class="profile-image-wrapper" 
        :class="{ 'streaming-active': streamerInfo?.streamingYn === 'Y' }"
        @click="handleProfileClick"
      >
        <img 
          :src="streamerInfo?.streamerProfileImageUrl || defaultProfileImage" 
          alt="Profile Image" 
          class="profile-image"
        />
        <div v-if="streamerInfo?.streamingYn === 'Y'" class="live-badge">
          LIVE
        </div>
      </div>
  
      <!-- 스트리머 정보 -->
      <div class="streamer-info">
        <div class="name-follow-container">
          <h1 class="streamer-name">{{ streamerInfo?.streamerNickName }}</h1>
          <!-- 팔로우 버튼 (자기 자신 X) -->
          <button 
            v-if="isLoggedIn && !isSameUser(currentUserId, streamerId)"
            class="follow-button" 
            :class="{ 'following': streamerInfo?.isFollow === 'Y' }"
            @click="toggleFollow"
          >
            {{ streamerInfo?.isFollow === 'Y' ? '팔로잉' : '팔로우' }}
          </button>
        </div>
        <p class="follower-count">팔로워 {{ formatNumber(streamerInfo?.followerCount) }}명</p>
        <p class="streamer-introduction" v-if="streamerInfo?.introduction || streamerInfo?.introduce">
          {{ streamerInfo?.introduction || streamerInfo?.introduce }}
        </p>
      </div>
  
      <!-- 방송/관리 버튼 (스트리머 본인 or 매니저) -->
      <div v-if="isChannelManager || isSameUser(currentUserId, streamerId)" class="channel-management">
        <button 
          class="stream-button"
          @click="$emit('go-to-dashboard')"
        >
          <span class="mdi mdi-video"></span>
          <span>방송하기</span>
        </button>
        <button 
          class="manage-button"
          @click="$emit('go-to-manage')"
        >
          <span class="mdi mdi-cog"></span>
          <span>채널 관리</span>
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { defineProps, defineEmits } from 'vue'
  
  const emit = defineEmits(['go-to-dashboard', 'go-to-manage', 'go-to-live'])
  
  const props = defineProps({
    streamerInfo: {
      type: Object,
      default: () => ({})
    },
    defaultProfileImage: {
      type: String,
      default: ''
    },
    currentUserId: [String, Number],
    isLoggedIn: Boolean,
    isChannelManager: Boolean,
    streamerId: [String, Number],
    toggleFollow: Function,
    streamingId: [String, Number],
  })
  
  function formatNumber(num) {
    if (!num) return '0'
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '만'
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0'
  }
  
  function isSameUser(userId, streamerId) {
    return String(userId) === String(streamerId)
  }
  
  function handleProfileClick() {
    // 스트리밍 중이고 스트리밍 ID가 있는 경우에만 라이브 페이지로 이동
    if (props.streamerInfo?.streamingYn === 'Y' && props.streamingId) {
      emit('go-to-live')
    }
  }
  </script>
  
  <style scoped>
  .profile-section {
    display: flex;
    align-items: flex-start;
    gap: 24px;
    padding: 16px 20px;
    position: relative;
  }
  .profile-image-wrapper {
    position: relative;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
    border: 4px solid transparent;
    cursor: pointer;
  }
  .streaming-active {
    border-color: #ff3b3b;
  }
  .profile-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .live-badge {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    background-color: #ff3b3b;
    color: white;
    font-size: 12px;
    padding: 3px 8px;
    border-radius: 12px;
    text-transform: uppercase;
  }
  .streamer-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }
  .name-follow-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  .streamer-name {
    font-size: 28px;
    font-weight: 500;
    margin: 0;
  }
  .follower-count {
    font-size: 16px;
    color: #adb5bd;
    margin: 0 0 2px 0;
  }
  .streamer-introduction {
    font-size: 15px;
    color: #e0e0e0;
    line-height: 1.5;
    max-width: 600px;
    white-space: pre-line;
    margin: 0 0 8px 0;
  }
  .follow-button {
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    background: #B084CC;
    color: #000;
  }
  .follow-button.following {
    background: #2D2D2D;
    color: #fff;
  }
  .follow-button:hover {
    background: #9a6cb7;
  }
  .follow-button.following:hover {
    background: #3D3D3D;
  }
  .channel-management {
    display: flex;
    gap: 12px;
    margin-left: auto;
  }
  .stream-button, .manage-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #1A1A1A;
    color: white;
    border: 1px solid #ffffff;
    border-radius: 20px;
    padding: 8px 18px;
    cursor: pointer;
    font-size: 15px;
    transition: all 0.3s;
    font-weight: 500;
  }
  .manage-button:hover, .stream-button:hover {
    background-color: #333333;
  }
  </style>
  