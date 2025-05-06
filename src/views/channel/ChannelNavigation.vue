<template>
    <div class="channel-navigation">
      <button 
        class="nav-item"
        :class="{ active: activeTab === 'home' }"
        @click="changeTab('home')"
      >
        홈
      </button>
      <button 
        class="nav-item"
        :class="{ active: activeTab === 'videos' }"
        @click="changeTab('videos')"
      >
        동영상
      </button>
      <button 
        class="nav-item"
        :class="{ active: activeTab === 'clips' }"
        @click="changeTab('clips')"
      >
        클립
      </button>
      <button 
        class="nav-item"
        :class="{ active: activeTab === 'community' }"
        @click="changeTab('community')"
      >
        커뮤니티
      </button>
      <button 
        class="nav-item"
        :class="{ active: activeTab === 'info' }"
        @click="changeTab('info')"
      >
        정보
      </button>
    </div>
  </template>
  
  <script setup>
  import { useRoute, useRouter } from 'vue-router';

  const props = defineProps({
    activeTab: {
      type: String,
      default: 'home'
    }
  })
  
  const emit = defineEmits(['tabChange'])
  const router = useRouter()
  const route = useRoute()
  
  const changeTab = (tab) => {
    emit('tabChange', tab)
    
    const memberId = route.params.memberId
    let path = `/channel/${memberId}`
    
    if (tab !== 'home') {
      path += `/${tab}`
    }
    
    router.push(path)
  }
  </script>
  
  <style scoped>
.channel-navigation {
  display: flex;
  gap: 32px;
  border-bottom: 1px solid #2c2c2c;
  margin-top: 24px;
  padding-bottom: 0;
  padding: 0 20px;
}

.nav-item {
  padding: 12px 4px;
  background: transparent;
  border: none;
  color: #7B7B7B;
  font-size: 16px;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.nav-item.active {
  color: #fff;
  font-weight: 500;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #B084CC;
}
</style>

  