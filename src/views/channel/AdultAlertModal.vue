<template>
    <div v-if="visible" class="adult-alert-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">연령 제한 컨텐츠</div>
          <button @click="$emit('close')" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
  
        <div class="modal-content">
          <div class="adult-alert-icon">
            <div class="age-icon-circle modal-icon">19</div>
          </div>
          <p class="adult-alert-message" v-if="isLoggedIn">
            미성년자는 이용 불가능한 컨텐츠입니다.
          </p>
          <p class="adult-alert-message" v-else>
            이 컨텐츠는 성인만 이용할 수 있습니다.<br>
            로그인 후 성인인증이 필요합니다.
          </p>
        </div>
  
        <div class="modal-footer">
          <button 
            v-if="!isLoggedIn"
            class="submit-btn"
            @click="$emit('login')"
          >
            로그인하기
          </button>
          <button
            v-else
            class="submit-btn"
            @click="$emit('close')"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    isLoggedIn: {
      type: Boolean,
      default: false
    }
  });
  
  defineEmits(['close', 'login']);
  </script>
  
  <style scoped>
.adult-alert-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-container {
  background-color: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  color: white;
  width: 400px;
  max-width: 90%;
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
  background: none;
  border: none;
  color: white;
  cursor: pointer;
}

.modal-content {
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.adult-alert-icon {
  margin-bottom: 20px;
}

.age-icon-circle {
  width: 60px;
  height: 60px;
  background-color: rgba(255, 255, 255, 0.9);
  color: black;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.adult-alert-message {
  font-size: 16px;
  line-height: 1.6;
  color: #eee;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid #333;
}

.submit-btn {
  width: 100%;
  height: 44px;
  background-color: #B084CC;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.submit-btn:hover {
  background-color: #9a70b6;
}
</style>

  