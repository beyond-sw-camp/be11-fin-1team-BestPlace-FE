<template>
    <div class="tab-buttons">
      <button 
        v-for="tab in tabs" 
        :key="tab.value"
        :class="['sort-btn', { active: selectedTab === tab.value }]"
        @click="$emit('update-tab', tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      selectedTab: {
        type: String,
        required: true
      }
    },
    data() {
      return {
        tabs: [
          { label: '전체', value: 'all' },
          { label: '라이브', value: 'live' },
          { label: '최근동영상', value: 'videos' },
          { label: '채널', value: 'channels' }
        ]
      };
    }
  };
  </script>
  
  <style scoped>
  .tab-buttons {
    display: flex;
    gap: 10px;
  }
  
  .sort-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 20px;
    background: #2c2c2c;
    color: #7B7B7B;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .sort-btn.active {
    background: #B084CC;
    color: #fff;
  }
  </style>
  