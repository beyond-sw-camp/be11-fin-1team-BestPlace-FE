<template>
    <div class="tab-buttons">
      <button 
        v-for="tab in tabs" 
        :key="tab.value"
        :class="['tab-btn', { active: selectedTab === tab.value }]"
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
    margin-bottom: 16px;
  }
  .tab-btn {
    padding: 6px 16px;
    background-color: #2c2c2c;
    color: #aaa;
    border-radius: 20px;
    border: none;
    font-size: 14px;
    cursor: pointer;
  }
  .tab-btn.active {
    background-color: #B084CC;
    color: #fff;
  }
  </style>
  